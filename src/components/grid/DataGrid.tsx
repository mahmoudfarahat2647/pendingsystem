"use client";

import type { CellValueChangedEvent, ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { memo, useCallback, useEffect, useId, useMemo, useRef } from "react";

import { gridTheme } from "@/lib/ag-grid-setup";
import { useAppStore } from "@/store/useStore";
import type { GridState } from "@/types";
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
	gridStateKey?: string;
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
	gridStateKey,
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

	// Grid State Persistence logic
	const saveGridState = useAppStore((state) => state.saveGridState);
	const getGridState = useAppStore((state) => state.getGridState);
	const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Restoration: Get initial state once on mount
	const initialState = useMemo(() => {
		if (!gridStateKey) return undefined;
		const state = getGridState(gridStateKey);
		return state || undefined;
	}, [gridStateKey, getGridState]);

	const handleSaveState = useCallback(() => {
		if (gridStateKey && gridApiRef.current) {
			const api = gridApiRef.current;
			if (api.isDestroyed()) return;

			// Clear previous timer
			if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

			// Debounce save to avoid excessive localStorage writes
			saveTimerRef.current = setTimeout(() => {
				const state = api.getState();
				saveGridState(gridStateKey, state);
				saveTimerRef.current = null;
			}, 500);
		}
	}, [gridStateKey, saveGridState, gridApiRef]);

	// [CRITICAL] PERSISTENCE RESTORATION
	// Restore saved state when grid is ready
	const onGridReadyInternal = useCallback(
		(params: GridReadyEvent) => {
			// Call external onGridReady if provided
			handleGridReady(params);
		},
		[handleGridReady],
	);

	// Cleanup timer on unmount
	useEffect(() => {
		return () => {
			if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
		};
	}, []);

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
			selectAll: "filtered" as const,
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
				initialState={initialState}
				getRowId={getRowId}
				// Event handlers
				onGridReady={onGridReadyInternal}
				onFirstDataRendered={handleFirstDataRendered}
				onCellValueChanged={handleCellValueChanged}
				onSelectionChanged={handleSelectionChanged}
				// State Change tracking for persistence
				onColumnMoved={handleSaveState}
				onColumnResized={handleSaveState}
				onColumnVisible={handleSaveState}
				onColumnPinned={handleSaveState}
				onSortChanged={handleSaveState}
				onFilterChanged={handleSaveState}
				onColumnGroupOpened={handleSaveState}
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
				// [CRITICAL] REACTIVE CUSTOM COMPONENTS
				// This MUST be true to allow React Cell Renderers (Action icons, etc.) to respond 
				// immediately to React Query cache updates.
				reactiveCustomComponents={true}
			/>
		</div>
	);
}

// Memoize the entire component to prevent unnecessary re-renders
export const DataGrid = memo(DataGridInner) as typeof DataGridInner;
