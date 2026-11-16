"use client";

import type { GridApi } from "ag-grid-community";
import { useEffect, useReducer } from "react";
import type { EmailTableRow } from "@/lib/clipboard/emailTable";
import type { PendingRow } from "@/types";

export const EMPTY_SELECTED_ROWS: PendingRow[] = [];

const toText = (value: unknown): string => (value == null ? "" : String(value));

export function toEmailTableRow(
	row: Pick<
		PendingRow,
		"customerName" | "vin" | "model" | "partNumber" | "description"
	>,
): EmailTableRow {
	return {
		customerName: toText(row.customerName),
		vin: toText(row.vin),
		model: toText(row.model),
		partNumber: toText(row.partNumber),
		description: toText(row.description),
	};
}

const isGridDestroyed = (gridApi: GridApi): boolean =>
	typeof gridApi.isDestroyed === "function" && gridApi.isDestroyed();

export function getCopyForEmailRows(
	selectedRows: readonly PendingRow[],
	gridApi?: GridApi | null,
): EmailTableRow[] {
	if (gridApi && !isGridDestroyed(gridApi)) {
		const rows: EmailTableRow[] = [];
		gridApi.forEachNodeAfterFilterAndSort((node) => {
			if (node.data && node.isSelected?.()) {
				rows.push(toEmailTableRow(node.data));
			}
		});
		return rows;
	}

	return selectedRows.map(toEmailTableRow);
}

/**
 * Projects the current grid selection into the fixed email-table shape.
 *
 * When a grid API is available the selection is read from the grid's
 * filtered, sorted node order, so hidden filter matches are excluded, sorted
 * order is honoured, and rows outside the viewport are included. Without an
 * API the supplied `selectedRows` are used as-is.
 *
 * The projection is recomputed on every render so a caller that passes a
 * freshly built array cannot drive an update loop. Grid events only request a
 * re-render; the current props are then read during that render.
 */
export function useCopyForEmailRows(
	selectedRows: readonly PendingRow[],
	gridApi?: GridApi | null,
): EmailTableRow[] {
	const [, forceRender] = useReducer((count: number) => count + 1, 0);

	useEffect(() => {
		if (!gridApi || isGridDestroyed(gridApi)) return;
		if (typeof gridApi.addEventListener !== "function") return;

		const refresh = () => {
			forceRender();
		};

		gridApi.addEventListener("filterChanged", refresh);
		gridApi.addEventListener("sortChanged", refresh);
		gridApi.addEventListener("modelUpdated", refresh);
		gridApi.addEventListener("selectionChanged", refresh);
		gridApi.addEventListener("cellValueChanged", refresh);

		return () => {
			if (isGridDestroyed(gridApi)) return;
			gridApi.removeEventListener("filterChanged", refresh);
			gridApi.removeEventListener("sortChanged", refresh);
			gridApi.removeEventListener("modelUpdated", refresh);
			gridApi.removeEventListener("selectionChanged", refresh);
			gridApi.removeEventListener("cellValueChanged", refresh);
		};
	}, [gridApi]);

	return getCopyForEmailRows(selectedRows, gridApi);
}
