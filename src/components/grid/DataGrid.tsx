"use client";

import type { ColDef, GridApi } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { memo, useId, useMemo } from "react";

import { gridTheme } from "@/lib/ag-grid-setup";
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
		return {
			pagination: true,
			paginationPageSize: pageSize,
			paginationPageSizeSelector: [25, 50, 100, 200],
		};
	}, [enablePagination, rowData.length, pageSize]);

	const style = useMemo(() => ({ height, width: "100%" }), [height]);

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
