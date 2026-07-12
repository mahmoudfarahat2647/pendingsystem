import {
	type UseQueryResult,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { NOTIFICATION_CANDIDATES_QUERY_KEY } from "@/lib/queryClient";
import { fetchDueNotificationCandidates } from "@/services/notifications/notificationCandidatesService";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

// Matches the Header's existing notification poll cadence (AC #5: polling
// interval unchanged from the user's perspective).
const NOTIFICATION_CANDIDATES_REFETCH_MS = 10_000;

/**
 * Keeps the server-filtered notification-candidate cache fresh and nudges
 * `checkNotifications` to recompute whenever that cache changes. Time-driven
 * transitions (e.g. a booking follow-up becoming due purely by the clock,
 * with no underlying data change) are still covered by the Header's own
 * polling interval, not by this hook.
 */
export function useNotificationCandidatesQuery(): UseQueryResult<
	PendingRow[],
	Error
> {
	const queryClient = useQueryClient();
	const checkNotifications = useAppStore((s) => s.checkNotifications);

	const query = useQuery<PendingRow[]>({
		queryKey: NOTIFICATION_CANDIDATES_QUERY_KEY,
		queryFn: fetchDueNotificationCandidates,
		refetchInterval: NOTIFICATION_CANDIDATES_REFETCH_MS,
		refetchOnWindowFocus: true,
	});

	// Recompute whenever the candidate set actually changes (structural
	// sharing means an unchanged payload keeps the same reference).
	useEffect(() => {
		if (query.data !== undefined) {
			checkNotifications();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query.data, checkNotifications]);

	// Preserve the existing post-mutation nudge (e.g. right after setting a
	// reminder) by invalidating the candidate cache on the same window event.
	useEffect(() => {
		const handleManualCheck = () => {
			void queryClient.invalidateQueries({
				queryKey: NOTIFICATION_CANDIDATES_QUERY_KEY,
			});
		};
		window.addEventListener("check-notifications", handleManualCheck);
		return () =>
			window.removeEventListener("check-notifications", handleManualCheck);
	}, [queryClient]);

	return query;
}
