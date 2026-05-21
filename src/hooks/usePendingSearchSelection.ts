"use client";

import type { GridApi, IRowNode } from "ag-grid-community";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { ensurePagedRowVisible } from "@/lib/ag-grid-helpers";
import { useAppStore } from "@/store/useStore";

const SELECTION_FALLBACK_TIMEOUT_MS = 8000;

export function usePendingSearchSelection(
	stage: string,
	gridApiRef: React.RefObject<GridApi | null>,
	rowData: unknown[],
) {
	const pendingSearchSelection = useAppStore((s) => s.pendingSearchSelection);
	const setPendingSearchSelection = useAppStore(
		(s) => s.setPendingSearchSelection,
	);
	const pendingIdsRef = useRef<string[] | null>(null);

	const attemptSelect = useCallback(() => {
		const ids = pendingIdsRef.current;
		if (!ids || ids.length === 0) return;

		const api = gridApiRef.current;
		if (!api) return;
		try {
			if (api.isDestroyed()) return;
		} catch {
			return;
		}

		let firstFoundNode: IRowNode | undefined;

		api.deselectAll();
		for (const id of ids) {
			const node = api.getRowNode(id);
			if (node) {
				node.setSelected(true, false, "api");
				if (!firstFoundNode) firstFoundNode = node;
			}
		}

		if (firstFoundNode) {
			ensurePagedRowVisible(api, firstFoundNode);
			pendingIdsRef.current = null;
			setPendingSearchSelection(null);
		}
	}, [gridApiRef, setPendingSearchSelection]);

	// Register intent when a matching pending selection arrives and attempt immediately
	useEffect(() => {
		if (!pendingSearchSelection || pendingSearchSelection.stage !== stage)
			return;
		pendingIdsRef.current = pendingSearchSelection.ids;
		attemptSelect();
	}, [pendingSearchSelection, stage, attemptSelect]);

	// Retry when rowData changes — covers the async data-load timing after navigation
	// rowData identity change is the intentional trigger for retry — not a missing dep
	useEffect(() => {
		if (!pendingIdsRef.current) return;
		attemptSelect();
	}, [rowData, attemptSelect]);

	// 8-second fallback — clears stale pending selection if rows never appear in the grid
	useEffect(() => {
		if (!pendingSearchSelection || pendingSearchSelection.stage !== stage)
			return;

		const timeout = setTimeout(() => {
			if (pendingIdsRef.current) {
				pendingIdsRef.current = null;
				setPendingSearchSelection(null);
			}
		}, SELECTION_FALLBACK_TIMEOUT_MS);

		return () => clearTimeout(timeout);
	}, [pendingSearchSelection, stage, setPendingSearchSelection]);

	return attemptSelect;
}
