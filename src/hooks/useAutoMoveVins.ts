"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useStore";
import { PendingRow } from "@/types";

export const useAutoMoveVins = () => {
    const rowData = useAppStore((state) => state.rowData);
    const sendToCallList = useAppStore((state) => state.sendToCallList);

    // Use a ref to track if we're currently processing to avoid loops
    const isProcessingRef = useRef(false);

    useEffect(() => {
        // Prevent re-entry during processing
        if (isProcessingRef.current) return;

        console.log("[AutoMove] Checking rowData changes, count:", rowData.length);

        // 1. Group by VIN
        const vinGroups: Record<string, PendingRow[]> = {};

        rowData.forEach(row => {
            if (row.vin) {
                const vin = row.vin.trim().toLowerCase();
                if (!vinGroups[vin]) {
                    vinGroups[vin] = [];
                }
                vinGroups[vin].push(row);
            }
        });

        console.log("[AutoMove] VIN groups found:", Object.keys(vinGroups).length);

        // 2. Identify groups where ALL parts are 'Arrived'
        const idsToMove: string[] = [];

        Object.entries(vinGroups).forEach(([vin, rows]) => {
            if (rows.length === 0) return;

            // Check if every row in this group has "Arrived" status
            const allArrived = rows.every(row => {
                const status = (row.partStatus || "").trim().toLowerCase();
                return status === 'arrived';
            });

            console.log(`[AutoMove] VIN ${vin}: ${rows.length} parts, allArrived=${allArrived}`);
            rows.forEach(r => console.log(`  - ID: ${r.id}, partStatus: "${r.partStatus}"`));

            if (allArrived) {
                // Collect IDs to move
                rows.forEach(r => idsToMove.push(r.id));
                console.log(`[AutoMove] ✓ Fully arrived VIN: ${vin} (${rows.length} parts)`);
            }
        });

        // 3. Move items if any found
        if (idsToMove.length > 0) {
            console.log(`[AutoMove] Moving ${idsToMove.length} items to Call List:`, idsToMove);

            isProcessingRef.current = true;

            // Use requestAnimationFrame to ensure state update is clean
            requestAnimationFrame(() => {
                sendToCallList(idsToMove);
                console.log(`[AutoMove] ✓ Moved ${idsToMove.length} items to Call List`);

                // Reset processing flag after a short delay
                setTimeout(() => {
                    isProcessingRef.current = false;
                }, 100);
            });
        }

    }, [rowData, sendToCallList]);
};
