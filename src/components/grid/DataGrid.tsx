"use client";

import type { CellValueChangedEvent, ColDef, GridApi } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { memo, useEffect, useId, useMemo } from "react";

import { gridTheme } from "@/lib/ag-grid-setup";
import { useAppStore } from "@/store/useStore";
import { defaultColDef, defaultGridOptions } from "./config/defaultOptions";
import { useGridCallbacks } from "./hooks/useGridCallbacks";
import { useGridPerformance } from "./hooks/useGridPerformance";
import * as cellRenderers from "./renderers";

export interface DataGridProps<T extends { id?: string; vin?: string }> {
	rowData: T[];
	columnDefs: ColDef[];
	onDataChange?: (data: T) => void;
	onSelectionChange?: (selectedRows: T[]) => void;
	onGridReady?: (api: GridApi) => void;
	onCellValueChanged?: (event: CellValueChangedEvent<T>) => void;
	readOnly?: boolean;
	enablePagination?: boolean;
	pageSize?: number;
	loading?: boolean;
	height?: string | number;
	showFloatingFilters?: boolean;
}

function DataGridInner<T extends { id?: string; vin?: string }>({
	rowData,
	columnDefs,
	onDataChange,
	onSelectionChange,
	onGridReady,
	onCellValueChanged,
	readOnly = false,
	enablePagination = false,
	pageSize = 50,
	loading = false,
	height = "100%",
	showFloatingFilters = false,
}: DataGridProps<T>) {
	const gridId = useId();

	// Memoized callbacks
	const {
		handleGridReady,
		handleFirstDataRendered,
		handleCellValueChanged,
		handleSelectionChanged,
		gridApiRef,
	} = useGridCallbacks<T>({
		onDataChange,
		onSelectionChange,
		onGridReady,
		onCellValueChanged,
	});

	// Performance monitoring
	useGridPerformance(gridApiRef.current);

	// Memoized column definitions with readOnly override
	const memoizedColDefs = useMemo(() => {
		return columnDefs.map((col) => {
			// If main grid is locked, disable editing
			const isEditable = readOnly ? false : col.editable;

			return {
				...col,
				editable: isEditable,
				floatingFilter: showFloatingFilters && col.filter !== false,
			};
		});
	}, [columnDefs, readOnly, showFloatingFilters]);

	// Memoized default column definition
	const memoizedDefaultColDef = useMemo(
		() => ({
			...defaultColDef,
			editable: !readOnly,
			floatingFilter: showFloatingFilters,
		}),
		[readOnly, showFloatingFilters],
	);

	// Row ID getter for efficient updates
	const getRowId = useMemo(
		() => (params: { data: T }) => {
			return (
				params.data.id || params.data.vin || `row-${gridId}-${Math.random()}`
			);
		},
		[gridId],
	);

	// Pagination settings
	const paginationSettings = useMemo(() => {
		if (!enablePagination && rowData.length <= 100) {
			return { pagination: false };
		}
		// Ensure pageSize is included in selector to avoid AG Grid warning
		const selectorSizes = [25, 50, 100, 200];
		if (!selectorSizes.includes(pageSize)) {
			selectorSizes.unshift(pageSize);
			selectorSizes.sort((a, b) => a - b);
		}
		return {
			pagination: true,
			paginationPageSize: pageSize,
			paginationPageSizeSelector: selectorSizes,
		};
	}, [enablePagination, rowData.length, pageSize]);

	// Row selection configuration for v32.2+
	const rowSelectionConfig = useMemo(
		() => ({
			mode: "multiRow" as const,
			checkboxes: false,
			headerCheckbox: false,
			enableClickSelection: true,
		}),
		[],
	);

	const style = useMemo(() => ({ height, width: "100%" }), [height]);

	// Scroll to highlighted row
	const highlightedRowId = useAppStore((state) => state.highlightedRowId);
	const setHighlightedRowId = useAppStore((state) => state.setHighlightedRowId);

	useEffect(() => {
		if (highlightedRowId && gridApiRef.current) {
			const api = gridApiRef.current;

			// If rowData isn't loaded yet, getRowNode(id) will return undefined.
			// We depend on rowData below so this effect runs again when data arrives.
			const node = api.getRowNode(highlightedRowId);

			if (node) {
				// Ensure the node is visible in the viewport
				api.ensureNodeVisible(node, "middle");

				// Select the node for better visibility
				node.setSelected(true);

				// Flash the cells to draw attention
				api.flashCells({
					rowNodes: [node],
					flashDelay: 500,
					fadeDelay: 500,
				});

				// Clear the highlight from store so it doesn't persist
				// but verify it's the same ID to avoid race conditions
				setTimeout(() => {
					setHighlightedRowId(null);
				}, 1000);
			}
		}
	}, [highlightedRowId, setHighlightedRowId, rowData, gridApiRef]);

	return (
		<div style={style}>
			<AgGridReact<T>
				theme={gridTheme}
				rowData={rowData}
				columnDefs={memoizedColDefs}
				defaultColDef={memoizedDefaultColDef}
				getRowId={getRowId}
				// Event handlers
				onGridReady={handleGridReady}
				onFirstDataRendered={handleFirstDataRendered}
				onCellValueChanged={handleCellValueChanged}
				onSelectionChanged={handleSelectionChanged}
				// Default options spread
				{...defaultGridOptions}
				// Row Selection
				rowSelection={rowSelectionConfig}
				// Pagination
				{...paginationSettings}
				// Custom components
				components={cellRenderers}
				// Loading state
				loading={loading}
			/>
		</div>
	);
}

// Memoize the entire component to prevent unnecessary re-renders
export const DataGrid = memo(DataGridInner) as typeof DataGridInner;
