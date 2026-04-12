"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { AUTO_MOVE_DEBOUNCE_MS } from "@/lib/constants";
import { useBulkUpdateOrderStageMutation } from "./queries/useBulkUpdateOrderStageMutation";
import { useOrdersQuery } from "./queries/useOrdersQuery";

/** Stable key representing the subset of data that matters for auto-move decisions. */
function buildStatusKey(
	rows: { id: string; vin?: string | null; partStatus?: string | null }[],
): string {
	return rows
		.map(
			(r) =>
				`${r.id}:${(r.vin ?? "").trim().toLowerCase()}:${(r.partStatus ?? "").trim().toLowerCase()}`,
		)
		.join("|");
}

export const useAutoMoveVins = () => {
	const { data: rowData = [] } = useOrdersQuery("main");
	const { mutate: bulkMoveToCall } = useBulkUpdateOrderStageMutation("main");

	const isProcessingRef = useRef(false);
	const lastStatusKeyRef = useRef("");

	useEffect(() => {
		const currentKey = buildStatusKey(rowData);

		// Skip if nothing relevant changed
		if (currentKey === lastStatusKeyRef.current) return;
		lastStatusKeyRef.current = currentKey;

		// Prevent re-entry during processing
		if (isProcessingRef.current) return;

		let resetTimeoutId: ReturnType<typeof setTimeout> | undefined;

		const timeoutId = setTimeout(() => {
			// 1. Group rows by normalised VIN
			const vinGroups: Record<string, typeof rowData> = {};
			for (const row of rowData) {
				if (!row.vin?.trim()) continue;
				const vin = row.vin.trim().toLowerCase();
				if (!vinGroups[vin]) vinGroups[vin] = [];
				vinGroups[vin].push(row);
			}

			// 2. Collect IDs for groups where every part is "arrived"
			const idsToMove: string[] = [];
			for (const [vin, rows] of Object.entries(vinGroups)) {
				if (rows.length === 0) continue;
				const allArrived = rows.every(
					(row) => (row.partStatus ?? "").trim().toLowerCase() === "arrived",
				);
				if (allArrived) {
					for (const r of rows) idsToMove.push(r.id);
					toast.success(
						`All parts for VIN ${vin.toUpperCase()} arrived! Moved to Call List.`,
						{ duration: 5000 },
					);
				}
			}

			// 3. Move if any found
			if (idsToMove.length > 0) {
				isProcessingRef.current = true;
				bulkMoveToCall({ ids: idsToMove, stage: "call" });

				resetTimeoutId = setTimeout(() => {
					isProcessingRef.current = false;
				}, AUTO_MOVE_DEBOUNCE_MS);
			}
		}, AUTO_MOVE_DEBOUNCE_MS);

		return () => {
			clearTimeout(timeoutId);
			clearTimeout(resetTimeoutId);
		};
	}, [rowData, bulkMoveToCall]);
};
