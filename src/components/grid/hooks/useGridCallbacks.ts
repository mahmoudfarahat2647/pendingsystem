import type {
	CellValueChangedEvent,
	FirstDataRenderedEvent,
	GridApi,
	GridReadyEvent,
	SelectionChangedEvent,
} from "ag-grid-community";
import { useCallback, useRef } from "react";

interface UseGridCallbacksOptions<T> {
	onDataChange?: (data: T) => void;
	onSelectionChange?: (selectedRows: T[]) => void;
	onGridReady?: (api: GridApi) => void;
	onFirstDataRendered?: () => void;
}

export function useGridCallbacks<T>({
	onDataChange,
	onSelectionChange,
	onGridReady,
	onFirstDataRendered,
}: UseGridCallbacksOptions<T>) {
	const gridApiRef = useRef<GridApi | null>(null);

	const handleGridReady = useCallback(
		(event: GridReadyEvent) => {
			gridApiRef.current = event.api;

			// Defer column sizing to next frame
			requestAnimationFrame(() => {
				event.api.sizeColumnsToFit();
			});

			onGridReady?.(event.api);
		},
		[onGridReady],
	);

	const handleFirstDataRendered = useCallback(
		(event: FirstDataRenderedEvent) => {
			// Auto-size columns based on content
			requestAnimationFrame(() => {
				event.api.autoSizeAllColumns();
			});

			onFirstDataRendered?.();
		},
		[onFirstDataRendered],
	);

	const handleCellValueChanged = useCallback(
		(event: CellValueChangedEvent<T>) => {
			if (event.data && onDataChange) {
				onDataChange(event.data);
			}
		},
		[onDataChange],
	);

	const handleSelectionChanged = useCallback(
		(event: SelectionChangedEvent<T>) => {
			if (onSelectionChange) {
				const selectedRows = event.api.getSelectedRows();
				onSelectionChange(selectedRows);
			}
		},
		[onSelectionChange],
	);

	return {
		gridApiRef,
		handleGridReady,
		handleFirstDataRendered,
		handleCellValueChanged,
		handleSelectionChanged,
	};
}
