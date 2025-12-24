"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

export const useAutoMoveVins = () => {
	const rowData = useAppStore((state) => state.rowData);
	const sendToCallList = useAppStore((state) => state.sendToCallList);

	// Use a ref to track if we're currently processing to avoid loops
	const isProcessingRef = useRef(false);

	useEffect(() => {
		// Prevent re-entry during processing
		if (isProcessingRef.current) return;

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
				// Collect IDs to move
				for (const r of rows) {
					idsToMove.push(r.id);
				}
			}
		}

		// 3. Move items if any found
		if (idsToMove.length > 0) {
			isProcessingRef.current = true;

			// Use requestAnimationFrame to ensure state update is clean
			requestAnimationFrame(() => {
				sendToCallList(idsToMove);

				// Reset processing flag after a short delay
				setTimeout(() => {
					isProcessingRef.current = false;
				}, 100);
			});
		}
	}, [rowData, sendToCallList]);
};
