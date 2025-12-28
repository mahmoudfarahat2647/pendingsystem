"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

export const useAutoMoveVins = () => {
	const rowData = useAppStore((state) => state.rowData);
	const sendToCallList = useAppStore((state) => state.sendToCallList);

	// Use a ref to track if we're currently processing to avoid loops
	const isProcessingRef = useRef(false);

	// Use a ref to track the last data we processed to avoid redundant work
	const lastDataLengthRef = useRef(0);

	useEffect(() => {
		// Only run if data length changed or explicitly requested
		// This avoids running on every single state update that doesn't change rows
		if (rowData.length === lastDataLengthRef.current) return;
		lastDataLengthRef.current = rowData.length;

		// Prevent re-entry during processing
		if (isProcessingRef.current) return;

		// Debounce slightly to allow multiple rapid changes to settle
		const timeoutId = setTimeout(() => {
			// 1. Group by VIN
			const vinGroups: Record<string, PendingRow[]> = {};

			for (const row of rowData) {
				if (row.vin) {
					const vin = row.vin.trim().toLowerCase();
					if (!vinGroups[vin]) {
						vinGroups[vin] = [];
					}
					vinGroups[vin].push(row);
				}
			}

			// 2. Identify groups where ALL parts are 'Arrived'
			const idsToMove: string[] = [];

			for (const [_vin, rows] of Object.entries(vinGroups)) {
				if (rows.length === 0) continue;

				// Check if every row in this group has "Arrived" status
				const allArrived = rows.every((row) => {
					const status = (row.partStatus || "").trim().toLowerCase();
					return status === "arrived";
				});

				if (allArrived) {
					for (const r of rows) {
						idsToMove.push(r.id);
					}
				}
			}

			// 3. Move items if any found
			if (idsToMove.length > 0) {
				isProcessingRef.current = true;
				sendToCallList(idsToMove);

				// Reset flag after state has settled
				setTimeout(() => {
					isProcessingRef.current = false;
				}, 500);
			}
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [rowData, sendToCallList]);
};
