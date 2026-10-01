"use client";

import { useEffect, useState } from "react";
import { toLocalDateKey } from "@/domain/booking/bookingInquiry";

const TODAY_KEY_CHECK_MS = 60_000;

/**
 * The local `YYYY-MM-DD` day, re-derived every minute and on
 * `visibilitychange`/`focus` so it rolls over at midnight even after sleep.
 * Starts `null` so server markup never depends on the client's date.
 */
export function useTodayKey(): string | null {
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

	return todayKey;
}
