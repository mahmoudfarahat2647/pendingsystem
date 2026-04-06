"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { buildArchivePayload } from "@/lib/archivePayloadBuilder";
import { getOrdersQueryKey } from "@/lib/queryClient";
import { orderService } from "@/services/orderService";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import { useSaveOrderMutation } from "./queries/useSaveOrderMutation";

// Run at most once per hour — prevents fetching all stages every 10-second tick.
const MAINTENANCE_INTERVAL_MS = 60 * 60 * 1000;

// The repair system value that identifies warranty rows.
const WARRANTY_REPAIR_SYSTEM = "ضمان";

const ACTIVE_STAGES = ["orders", "main", "call", "booking"] as const;

/**
 * Returns true if the warranty end date is strictly in the past (expired yesterday or earlier).
 * Day 0 (today) is still "active" per the notification system's daysRemaining >= 0 threshold.
 */
function isWarrantyExpired(endWarranty: string): boolean {
	// Parse as local calendar date (not UTC) by splitting the YYYY-MM-DD string.
	// new Date("YYYY-MM-DD") is interpreted as UTC midnight, which shifts the date
	// one day earlier in timezones west of UTC and causes premature archiving.
	const parts = endWarranty.split("-").map(Number);
	if (parts.length !== 3 || parts.some(Number.isNaN)) return false;
	const [year, month, day] = parts;
	const endDate = new Date(year, month - 1, day);
	if (Number.isNaN(endDate.getTime())) return false;

	// Compare calendar dates only (strip time) so "today" is not expired.
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	return endDate < todayStart;
}

/**
 * Groups rows by VIN. Only includes rows that are warranty rows with expired warranties.
 */
function getExpiredWarrantyVinGroups(
	rows: PendingRow[],
): Map<string, PendingRow[]> {
	const groups = new Map<string, PendingRow[]>();

	for (const row of rows) {
		if (row.repairSystem !== WARRANTY_REPAIR_SYSTEM) continue;
		if (!row.endWarranty) continue;
		if (!isWarrantyExpired(row.endWarranty)) continue;

		const vin = (row.vin || "").trim().toUpperCase() || "(blank)";
		if (!groups.has(vin)) {
			groups.set(vin, []);
		}
		groups.get(vin)?.push(row);
	}

	return groups;
}

/**
 * A rate-limited, draft-aware maintenance hook that auto-archives expired warranty VINs.
 *
 * - Runs at most once per hour (lastMaintenanceRunRef guards against the 10-second polling tick).
 * - Skips archiving a stage entirely if a draft is currently dirty (to avoid race conditions
 *   where the draft's baselineByStage snapshot still holds the pre-archive rows).
 * - Uses a VIN-level in-flight lock (inFlightVinsRef) so concurrent runs cannot double-archive.
 * - On both success and error, the VIN is removed from the lock so the next eligible run can retry.
 *
 * Call this hook from the Header component alongside the notification polling.
 */
export function useWarrantyExpiryMaintenance() {
	const queryClient = useQueryClient();
	const saveOrderMutation = useSaveOrderMutation();

	const lastMaintenanceRunRef = useRef<number>(0);
	// Set of VINs currently being archived — prevents double-archiving across concurrent runs.
	const inFlightVinsRef = useRef<Set<string>>(new Set());

	// Read draft dirty state directly from the store (not from useDraftSession, which is stage-bound).
	const isDraftDirty = useAppStore((state) => state.draftSession.dirty);

	const runMaintenance = useCallback(async () => {
		const now = Date.now();

		// Rate-limit: only run once per hour.
		if (now - lastMaintenanceRunRef.current < MAINTENANCE_INTERVAL_MS) {
			return;
		}

		// Skip entirely if a draft is active — the draft's baseline snapshot would still show
		// the rows we're about to archive, causing them to reappear after the draft is saved.
		if (isDraftDirty) {
			return;
		}

		// Fetch all active stages in parallel.
		let allRows: PendingRow[] = [];
		try {
			const results = await Promise.all(
				ACTIVE_STAGES.map((stage) => orderService.fetchMappedOrders(stage)),
			);
			allRows = results.flat();
		} catch (error) {
			console.warn(
				"[useWarrantyExpiryMaintenance] Failed to fetch stages:",
				error,
			);
			return;
		}

		const vinGroups = getExpiredWarrantyVinGroups(allRows);
		if (vinGroups.size === 0) return;

		const archiveReason = "انتهاء فترة الضمان";

		for (const [vin, rows] of vinGroups) {
			// Skip VINs already being processed by a concurrent run.
			if (inFlightVinsRef.current.has(vin)) continue;
			inFlightVinsRef.current.add(vin);

			// Archive each row in the VIN group sequentially to avoid mutation race conditions.
			for (const row of rows) {
				const payload = buildArchivePayload(row, archiveReason);

				try {
					await saveOrderMutation.mutateAsync({
						id: row.id,
						updates: payload,
						stage: "archive",
						sourceStage:
							(row.stage as "orders" | "main" | "call" | "booking") ?? "orders",
					});
				} catch (error) {
					console.warn(
						`[useWarrantyExpiryMaintenance] Failed to archive row ${row.id} (VIN: ${vin}):`,
						error,
					);
					// Do not break — continue with remaining rows in this VIN group.
					// The VIN lock will be released below so the next run can retry.
				}
			}

			// Always release the lock — on both success and error paths.
			inFlightVinsRef.current.delete(vin);
		}

		// Stamp the cooldown only after a complete pass so transient failures are retried promptly.
		lastMaintenanceRunRef.current = now;

		// Invalidate touched stages so the UI reflects archived rows.
		for (const stage of ACTIVE_STAGES) {
			queryClient.invalidateQueries({ queryKey: getOrdersQueryKey(stage) });
		}
		queryClient.invalidateQueries({ queryKey: getOrdersQueryKey("archive") });
	}, [isDraftDirty, saveOrderMutation, queryClient]);

	return { runMaintenance };
}
