"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
	countBookedCustomersOnDate,
	toLocalDateKey,
} from "@/domain/booking/bookingInquiry";
import { NOTIFICATION_CANDIDATES_QUERY_KEY } from "@/lib/queryClient";
import { fetchDueNotificationCandidates } from "@/services/notifications/notificationCandidatesService";

const TODAY_KEY_CHECK_MS = 60_000;

/**
 * How many customers are booked for today, for the header's Booking icon badge.
 *
 * Reads the same cached query the Header's notification poll already owns
 * (`NOTIFICATION_CANDIDATES_QUERY_KEY`) as a passive second observer: this hook does not
 * set `refetchInterval` or `refetchOnWindowFocus` itself, since `useNotificationCandidatesQuery`
 * (mounted once, in `Header.tsx`) already drives that polling for the shared cache entry.
 * Adding a second poller here would double the interval and its `checkNotifications`/
 * `check-notifications` side effects. This hook therefore adds no new network fetch.
 *
 * The count is saved-data-only: an unsaved Booking-page draft only changes it after
 * `saveDraft()` persists, the same as every other consumer of stage data.
 *
 * `todayKey` starts `null` and is set after mount, so the server-rendered markup never
 * depends on the client's local date (avoids a hydration mismatch) and never shows a
 * stale badge before the local day is known. It is re-derived every minute and on
 * `visibilitychange`/`focus`, so a sleeping laptop or a throttled background tab still
 * rolls over to the next day promptly instead of relying solely on a single scheduled
 * timer, which sleep/throttling can delay past midnight.
 *
 * On a failed refetch, React Query keeps the last successful `data`, so this hook does
 * too — the badge must not disappear from a transient network error, only from an
 * actual booking action or a day change.
 */
export function useTodayBookingCount(): number {
	const query = useQuery({
		queryKey: NOTIFICATION_CANDIDATES_QUERY_KEY,
		queryFn: fetchDueNotificationCandidates,
	});

	const [todayKey, setTodayKey] = useState<string | null>(null);

	useEffect(() => {
		const recompute = () => setTodayKey(toLocalDateKey(new Date()));
		recompute();

		const interval = setInterval(recompute, TODAY_KEY_CHECK_MS);
		window.addEventListener("visibilitychange", recompute);
		window.addEventListener("focus", recompute);

		return () => {
			clearInterval(interval);
			window.removeEventListener("visibilitychange", recompute);
			window.removeEventListener("focus", recompute);
		};
	}, []);

	return useMemo(() => {
		if (todayKey === null || query.data === undefined) return 0;
		return countBookedCustomersOnDate(query.data, todayKey);
	}, [query.data, todayKey]);
}
