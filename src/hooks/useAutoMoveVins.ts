"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { isVinBlockedByFreeze } from "@/domain/order/orderWorkflow";
import { AUTO_MOVE_DEBOUNCE_MS } from "@/lib/constants";
import { useBulkUpdateOrderStageMutation } from "./queries/useBulkUpdateOrderStageMutation";
import { useOrdersQuery } from "./queries/useOrdersQuery";

/** Stable key representing the subset of data that matters for auto-move decisions. */
function buildStatusKey(
	rows: { id: string; vin?: string | null; status?: string | null }[],
	freezeRows: { id: string; vin?: string | null; stage?: string | null }[] = [],
): string {
	const mainKey = rows
		.map(
			(r) =>
				`${r.id}:${(r.vin ?? "").trim().toLowerCase()}:${(r.status ?? "").trim().toLowerCase()}`,
		)
		.join("|");
	const freezeKey = freezeRows
		.map(
			(r) =>
				`${r.id}:${(r.vin ?? "").trim().toLowerCase()}:${(r.stage ?? "").trim().toLowerCase()}`,
		)
		.join("|");
	return `${mainKey}#${freezeKey}`;
}

export const useAutoMoveVins = () => {
	const { data: rowData = [] } = useOrdersQuery("main");
	const { data: freezeData = [] } = useOrdersQuery("freeze");
	const { mutateAsync: bulkMoveToCall } =
		useBulkUpdateOrderStageMutation("main");

	const isProcessingRef = useRef(false);
	const lastStatusKeyRef = useRef("");

	useEffect(() => {
		const currentKey = buildStatusKey(rowData, freezeData);

		// Skip if nothing relevant changed
		if (currentKey === lastStatusKeyRef.current) return;

		// Prevent re-entry during processing; do NOT stamp the key so the
		// next run after processing completes will re-evaluate this change.
		if (isProcessingRef.current) return;
		lastStatusKeyRef.current = currentKey;

		const timeoutId = setTimeout(() => {
			// 1. Group rows by normalised VIN
			const vinGroups: Record<string, typeof rowData> = {};
			for (const row of rowData) {
				if (!row.vin?.trim()) continue;
				const vin = row.vin.trim().toLowerCase();
				if (!vinGroups[vin]) vinGroups[vin] = [];
				vinGroups[vin].push(row);
			}

			// 2. Collect IDs for groups where every part is "arrived" and no part is frozen
			const vinMoves: Array<{ vin: string; ids: string[] }> = [];
			for (const [vin, rows] of Object.entries(vinGroups)) {
				if (rows.length === 0) continue;
				if (
					isVinBlockedByFreeze({
						vin,
						stageRows: rowData,
						frozenRows: freezeData,
					})
				) {
					continue;
				}
				const allArrived = rows.every(
					(row) => (row.status ?? "").trim().toLowerCase() === "arrived",
				);
				if (allArrived) {
					vinMoves.push({ vin, ids: rows.map((row) => row.id) });
				}
			}

			// 3. Persist each VIN separately so a frozen VIN cannot suppress
			// unrelated vehicles, and only report success after persistence.
			if (vinMoves.length > 0) {
				isProcessingRef.current = true;
				void (async () => {
					for (const { vin, ids } of vinMoves) {
						try {
							await bulkMoveToCall({
								ids,
								stage: "call",
								guardFrozenVins: true,
							});
							toast.success(
								`All parts for VIN ${vin.toUpperCase()} arrived! Moved to Call List.`,
								{ duration: 5000 },
							);
						} catch {
							// The mutation hook restores its optimistic cache and surfaces the error.
						}
					}
					isProcessingRef.current = false;
				})();
			}
		}, AUTO_MOVE_DEBOUNCE_MS);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [rowData, freezeData, bulkMoveToCall]);
};
