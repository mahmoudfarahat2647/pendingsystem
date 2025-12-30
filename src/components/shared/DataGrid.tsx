"use client";

import type {
	CellValueChangedEvent,
	ColDef,
	GridApi,
	GridReadyEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

export interface DataGridProps {
	rowData: PendingRow[];
	columnDefs: ColDef[];
	onSelectionChanged?: (selectedRows: PendingRow[]) => void;
	onGridReady?: (api: GridApi) => void;
	onCellValueChanged?: (params: CellValueChangedEvent) => void;
	height?: string;
	readOnly?: boolean;
	showFloatingFilters?: boolean;
}

export const DataGrid = React.memo(function DataGrid({
	rowData,
	columnDefs,
	onSelectionChanged,
	onGridReady,
	onCellValueChanged,
	height = "calc(100vh - 280px)",
	readOnly = false,
	showFloatingFilters = false,
}: DataGridProps) {
	const gridRef = useRef<AgGridReact>(null);

	const defaultColDef = useMemo<ColDef>(
		() => ({
			filter: true,
			floatingFilter: showFloatingFilters,
			resizable: true,
			flex: 1,
			minWidth: 100,
		}),
		[showFloatingFilters],
	);

	// Handle highlighted row from notifications
	const highlightedRowId = useAppStore((state) => state.highlightedRowId);

	const highlightRow = useCallback((api: GridApi, rowId: string) => {
		const node = api.getRowNode(rowId);
		if (node) {
			api.deselectAll();
			node.setSelected(true);
			api.ensureNodeVisible(node, "middle");

			// Optional: Flash the cells to make it more obvious
			api.flashCells({ rowNodes: [node] });
		}
	}, []);

	const handleGridReady = useCallback(
		(params: GridReadyEvent) => {
			if (onGridReady) {
				onGridReady(params.api);
			}
			// Check for highlighted row on mount/ready
			if (highlightedRowId) {
				highlightRow(params.api, highlightedRowId);
			}
		},
		[onGridReady, highlightedRowId, highlightRow],
	);

	const handleSelectionChanged = useCallback(() => {
		if (gridRef.current && onSelectionChanged) {
			const selectedRows = gridRef.current.api.getSelectedRows();
			onSelectionChanged(selectedRows);
		}
	}, [onSelectionChanged]);

	// Apply readOnly settings to column definitions
	const readOnlyColumnDefs = useMemo(() => {
		if (!readOnly) return columnDefs;

		return columnDefs.map((col) => ({
			...col,
			editable: false,
			suppressMenu: true,
		}));
	}, [columnDefs, readOnly]);

	// Apply readOnly settings to default column definitions
	const readOnlyDefaultColDef = useMemo(
		() => ({
			...defaultColDef,
			editable: !readOnly,
			suppressMenu: readOnly,
		}),
		[defaultColDef, readOnly],
	);

	useEffect(() => {
		if (highlightedRowId && gridRef.current?.api) {
			highlightRow(gridRef.current.api, highlightedRowId);
		}
	}, [highlightedRowId, highlightRow]);

	// Refresh cells when rowData changes to update cell renderers
	useEffect(() => {
		if (gridRef.current?.api) {
			gridRef.current.api.refreshCells({ force: true });
		}
	}, []);

	return (
		<div
			className={`ag-theme-alpine-dark w-full h-full ${showFloatingFilters ? "show-filter-icons" : ""}`}
			style={{ height: height || "100%", width: "100%" }}
		>
			<AgGridReact
				ref={gridRef}
				rowData={rowData}
				columnDefs={readOnlyColumnDefs}
				defaultColDef={readOnlyDefaultColDef}
				rowSelection="multiple"
				suppressRowClickSelection
				getRowId={(params) => params.data.id}
				onGridReady={handleGridReady}
				onSelectionChanged={handleSelectionChanged}
				onCellValueChanged={onCellValueChanged}
				animateRows
				pagination
				paginationPageSize={25}
				paginationPageSizeSelector={[10, 25, 50, 100]}
				// Allow scrolling and navigation when locked but disable editing
				// We allow cell focus for navigation but prevent editing through column definitions
				suppressRowHoverHighlight={readOnly}
				enableCellTextSelection={!readOnly}
				ensureDomOrder={!readOnly}
				// Ensure scrolling works when locked
				scrollbarWidth={12}
			/>
		</div>
	);
});
