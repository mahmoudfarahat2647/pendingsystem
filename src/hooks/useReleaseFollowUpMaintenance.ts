"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { getQualifyingChassis } from "@/domain/order/releaseGate";
import { logger } from "@/lib/logger";
import { RELEASE_FOLLOW_UPS_QUERY_KEY } from "@/lib/queryClient";
import { orderService } from "@/services/orderService";
import { releaseFollowUpService } from "@/services/releaseFollowUpService";
import type { PendingRow } from "@/types";

// Run at most once per hour — mirrors useWarrantyExpiryMaintenance's cadence.
const MAINTENANCE_INTERVAL_MS = 60 * 60 * 1000;

const ACTIVE_STAGES = ["orders", "main", "call", "booking"] as const;

/**
 * Clears a chassis's release follow-up once it no longer satisfies the
 * release rule (issue #242 "Clearing the follow-up"): repair system changed
 * away from warranty, mileage became invalid/blank, or mileage reached
 * 5,000 km or more. A follow-up for a VIN with no rows left in any active
 * stage (e.g. archived) is also cleared — there is nothing left to gate.
 *
 * Call this hook from Header alongside useWarrantyExpiryMaintenance.
 */
export function useReleaseFollowUpMaintenance() {
	const queryClient = useQueryClient();
	const lastRunRef = useRef<number>(0);

	const runMaintenance = useCallback(async () => {
		const now = Date.now();
		if (now - lastRunRef.current < MAINTENANCE_INTERVAL_MS) return;

		let followUps: Awaited<ReturnType<typeof releaseFollowUpService.list>>;
		try {
			followUps = await releaseFollowUpService.list();
		} catch (error) {
			logger.warn(
				"[useReleaseFollowUpMaintenance] Failed to list follow-ups:",
				error,
			);
			return;
		}
		if (followUps.length === 0) {
			lastRunRef.current = now;
			return;
		}

		let allRows: PendingRow[] = [];
		try {
			const results = await Promise.all(
				ACTIVE_STAGES.map((stage) => orderService.fetchMappedOrders(stage)),
			);
			allRows = results.flat();
		} catch (error) {
			logger.warn(
				"[useReleaseFollowUpMaintenance] Failed to fetch stages:",
				error,
			);
			return;
		}

		lastRunRef.current = now;

		const stillQualifyingVins = new Set(
			getQualifyingChassis(allRows).map((c) => c.vin),
		);

		const vinsToClear = followUps
			.map((f) => f.vin)
			.filter((vin) => !stillQualifyingVins.has(vin));

		if (vinsToClear.length === 0) return;

		try {
			await releaseFollowUpService.clear(vinsToClear);
			queryClient.invalidateQueries({
				queryKey: RELEASE_FOLLOW_UPS_QUERY_KEY,
			});
		} catch (error) {
			logger.warn(
				"[useReleaseFollowUpMaintenance] Failed to clear follow-ups:",
				error,
			);
		}
	}, [queryClient]);

	return { runMaintenance };
}
