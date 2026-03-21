"use client";

import type {
	CellValueChangedEvent,
	ColDef,
	GridApi,
	GridPreDestroyedEvent,
	GridReadyEvent,
	ModelUpdatedEvent,
	SelectionChangedEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useRef } from "react";
import { gridTheme } from "@/lib/ag-grid-setup";
import type { PendingRow } from "@/types";

interface SearchResultsGridProps {
	rowData: PendingRow[];
	columnDefs: ColDef<PendingRow>[];
	onCellValueChanged: (
		event: CellValueChangedEvent<PendingRow>,
	) => void | Promise<void>;
	onSelectionChanged: (event: SelectionChangedEvent<PendingRow>) => void;
	onGridApiReady?: (api: GridApi<PendingRow>) => void;
	onDisplayedRowsChanged?: (api: GridApi<PendingRow>) => void;
	onGridPreDestroyed?: () => void;
	showFilters?: boolean;
}

const ROW_SELECTION_CONFIG = {
	mode: "multiRow" as const,
	enableClickSelection: false,
	checkboxes: false,
	headerCheckbox: false,
};

export const SearchResultsGrid = ({
	rowData,
	columnDefs,
	onCellValueChanged,
	onSelectionChanged,
	onGridApiReady,
	onDisplayedRowsChanged,
	onGridPreDestroyed,
	showFilters = false,
}: SearchResultsGridProps) => {
	const gridRef = useRef<AgGridReact<PendingRow>>(null);

	const onGridReady = useCallback((params: GridReadyEvent<PendingRow>) => {
		onGridApiReady?.(params.api);
	}, [onGridApiReady]);

	const handleSelectionChanged = useCallback(
		(event: SelectionChangedEvent<PendingRow>) => {
			onSelectionChanged(event);
		},
		[onSelectionChanged],
	);

	const onModelUpdated = useCallback(
		(params: ModelUpdatedEvent<PendingRow>) => {
			if (params.api.isDestroyed()) return;
			onDisplayedRowsChanged?.(params.api);
		},
		[onDisplayedRowsChanged],
	);

	const handleGridPreDestroyed = useCallback(
		(_event: GridPreDestroyedEvent<PendingRow>) => {
			onGridPreDestroyed?.();
		},
		[onGridPreDestroyed],
	);

	return (
		<div className="h-full w-full rounded-xl border border-white/10 overflow-hidden bg-[#141416]/50 shadow-2xl ring-1 ring-white/5">
			<div className="h-full w-full">
				<AgGridReact
					ref={gridRef}
					theme={gridTheme}
					rowData={rowData}
					columnDefs={columnDefs}
					defaultColDef={{
						sortable: true,
						filter: true,
						resizable: true,
						suppressHeaderMenuButton: true,
						floatingFilter: showFilters,
					}}
					rowHeight={32}
					headerHeight={36}
					animateRows={true}
					rowSelection={ROW_SELECTION_CONFIG}
					onCellValueChanged={onCellValueChanged}
					onSelectionChanged={handleSelectionChanged}
					onGridReady={onGridReady}
					onModelUpdated={onModelUpdated}
					onGridPreDestroyed={handleGridPreDestroyed}
					suppressHorizontalScroll={false}
				/>
			</div>
		</div>
	);
};
