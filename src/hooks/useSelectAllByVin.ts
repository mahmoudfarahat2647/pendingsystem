import type { GridApi } from "ag-grid-community";
import { useCallback } from "react";
import { trySelectRowsByVin } from "@/lib/ag-grid-helpers";
import { hasMixedVinSelection } from "@/lib/orderWorkflow";
import type { PendingRow } from "@/types";

export function useSelectAllByVin(
	selectedRows: PendingRow[],
	gridApi: GridApi | null,
): {
	onSelectAllByVin: () => void;
	isSelectAllByVinDisabled: boolean;
} {
	const isSelectAllByVinDisabled =
		selectedRows.length === 0 || hasMixedVinSelection(selectedRows);

	const onSelectAllByVin = useCallback(() => {
		if (selectedRows.length === 0 || hasMixedVinSelection(selectedRows)) return;
		const vin = selectedRows[0]?.vin;
		if (!vin) return;
		trySelectRowsByVin(gridApi, vin);
	}, [selectedRows, gridApi]);

	return { onSelectAllByVin, isSelectAllByVinDisabled };
}
