"use client";

import type {
	CellValueChangedEvent,
	ColDef,
	FirstDataRenderedEvent,
	GridApi,
	GridReadyEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { memo, useCallback, useEffect, useId, useMemo, useRef } from "react";
import { toast } from "sonner";
import { tryJumpToRow } from "@/lib/ag-grid-helpers";
import { gridTheme } from "@/lib/ag-grid-setup";
import { useLiveGridStore } from "@/store/useLiveGridStore";
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
	const rowIdMapRef = useRef(new WeakMap<object, string>());
	const rowIdCounterRef = useRef(0);

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
	const getDefaultLayout = useAppStore((state) => state.getDefaultLayout);
	const setLiveGridState = useLiveGridStore((state) => state.setLiveGridState);
	const clearLiveGridState = useLiveGridStore(
		(state) => state.clearLiveGridState,
	);
	const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Restoration: Get initial state once on mount
	const initialState = useMemo(() => {
		if (!gridStateKey) return undefined;
		const state = getGridState(gridStateKey) || getDefaultLayout(gridStateKey);
		return state || undefined;
	}, [gridStateKey, getDefaultLayout, getGridState]);

	const setLayoutDirty = useAppStore((state) => state.setLayoutDirty);
	const gridInitializedRef = useRef(false);

	const handleSaveState = useCallback(() => {
		if (gridStateKey && gridApiRef.current) {
			const api = gridApiRef.current;
			if (api.isDestroyed()) return;

			// Clear previous timer
			if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

			// Debounce save to avoid excessive localStorage writes
			const state = api.getState();
			setLiveGridState(gridStateKey, state);

			saveTimerRef.current = setTimeout(() => {
				saveGridState(gridStateKey, state);
				// Drop the in-memory snapshot once committed to persistence
				clearLiveGridState(gridStateKey);
				saveTimerRef.current = null;
			}, 500);
		}
	}, [
		gridStateKey,
		saveGridState,
		setLiveGridState,
		clearLiveGridState,
		gridApiRef,
	]);

	const handleLayoutChange = useCallback(() => {
		// Only mark as dirty if the grid has been initialized (avoid false positive on initial load)
		if (gridStateKey && gridInitializedRef.current) {
			setLayoutDirty(gridStateKey, true);
		}
		handleSaveState();
	}, [gridStateKey, setLayoutDirty, handleSaveState]);

	// Scroll to highlighted row
	const highlightedRowId = useAppStore((state) => state.highlightedRowId);
	const setHighlightedRowId = useAppStore((state) => state.setHighlightedRowId);
	const pendingHighlightRef = useRef<string | null>(null);

	const attemptJump = useCallback(() => {
		const targetId = pendingHighlightRef.current;
		if (!targetId) return;

		const result = tryJumpToRow(gridApiRef.current, targetId);

		if (result.success) {
			pendingHighlightRef.current = null;
			setHighlightedRowId(null);
		}
	}, [gridApiRef, setHighlightedRowId]);

	// Register intent when highlight requests arrive, and trigger jump
	useEffect(() => {
		if (!highlightedRowId) return;

		pendingHighlightRef.current = highlightedRowId;
		attemptJump();
	}, [highlightedRowId, attemptJump, rowData]);

	// Guard against unresolvable requests (fallback timeout)
	useEffect(() => {
		if (!highlightedRowId) return;

		const requestedId = highlightedRowId;

		const timeout = setTimeout(() => {
			if (pendingHighlightRef.current === requestedId) {
				pendingHighlightRef.current = null;
				setHighlightedRowId(null);
				console.warn(`Jump to row ${requestedId} timed out`);
			}
		}, 8000);

		return () => clearTimeout(timeout);
	}, [highlightedRowId, setHighlightedRowId]);

	// [CRITICAL] PERSISTENCE RESTORATION
	// Restore saved state when grid is ready
	const onGridReadyInternal = useCallback(
		(params: GridReadyEvent) => {
			// Call external onGridReady if provided
			handleGridReady(params);

			// First opportunity to retry the jump
			attemptJump();

			// Mark grid as initialized after a short delay to ensure restoration is complete
			setTimeout(() => {
				if (gridStateKey && !params.api.isDestroyed()) {
					setLiveGridState(gridStateKey, params.api.getState());
				}
				gridInitializedRef.current = true;
			}, 100);
		},
		[gridStateKey, handleGridReady, attemptJump, setLiveGridState],
	);

	const onFirstDataRenderedInternal = useCallback(
		(params: FirstDataRenderedEvent) => {
			handleFirstDataRendered(params);

			// Second opportunity to retry the jump
			attemptJump();

			if (gridStateKey && !params.api.isDestroyed()) {
				setLiveGridState(gridStateKey, params.api.getState());
			}
		},
		[gridStateKey, handleFirstDataRendered, attemptJump, setLiveGridState],
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

	// Ctrl+C: copy focused cell value, or copy selected rows as TSV
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (!(e.ctrlKey || e.metaKey) || e.key !== "c") return;

			const api = gridApiRef.current;
			if (!api || api.isDestroyed()) return;

			// Don't intercept copy when focus is inside an editor or filter input
			const target = e.target as HTMLElement;
			const tag = target.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable)
				return;

			// Don't intercept copy when the user has a native text selection
			const nativeSel = window.getSelection();
			if (nativeSel && nativeSel.toString().length > 0) return;

			const copyToClipboard = (text: string, successMsg: string) => {
				void navigator.clipboard
					.writeText(text)
					.then(() => {
						toast.success(successMsg);
					})
					.catch(() => {
						toast.error("Failed to copy.");
					});
			};

			// Copy row(s) when checkboxes are selected — takes priority over cell copy
			const selectedRows = api.getSelectedRows() as Record<string, unknown>[];
			if (selectedRows.length > 0) {
				const fields = api
					.getAllDisplayedColumns()
					.map((col) => col.getColDef().field)
					.filter((f): f is string => typeof f === "string");

				const tsv = selectedRows
					.map((row) => fields.map((f) => String(row[f] ?? "")).join("\t"))
					.join("\n");

				copyToClipboard(tsv, `Copied ${selectedRows.length} row(s)!`);
				return;
			}

			// Copy focused cell value
			const focusedCell = api.getFocusedCell();
			if (!focusedCell) return;

			const rowNode = api.getDisplayedRowAtIndex(focusedCell.rowIndex);
			if (!rowNode?.data) return;

			const colDef = focusedCell.column.getColDef();
			const field = colDef.field;
			if (!field) return; // action column — skip

			const value = (rowNode.data as Record<string, unknown>)[field];
			if (value == null) return;

			copyToClipboard(String(value), "Copied!");
		},
		[gridApiRef],
	);

	// Row ID getter for efficient updates
	const getRowId = useMemo(
		() => (params: { data: T }) => {
			const data = params.data as unknown as object;
			if (params.data.id) return params.data.id;
			if (params.data.vin) return params.data.vin;

			const cached = rowIdMapRef.current.get(data);
			if (cached) return cached;

			rowIdCounterRef.current += 1;
			const fallbackId = `row-${gridId}-${rowIdCounterRef.current}`;
			rowIdMapRef.current.set(data, fallbackId);
			return fallbackId;
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

	const style = useMemo(() => ({ height, width: "100%" }), [height]);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: outer wrapper captures Ctrl+C events bubbling from AG Grid; AG Grid owns all real a11y/focus management
		<div role="presentation" style={style} onKeyDown={handleKeyDown}>
			<AgGridReact<T>
				theme={gridTheme}
				rowData={rowData}
				columnDefs={memoizedColDefs}
				defaultColDef={memoizedDefaultColDef}
				initialState={initialState}
				getRowId={getRowId}
				// Event handlers
				onGridReady={onGridReadyInternal}
				onFirstDataRendered={onFirstDataRenderedInternal}
				onCellValueChanged={handleCellValueChanged}
				onSelectionChanged={handleSelectionChanged}
				// State Change tracking for persistence
				onColumnMoved={handleLayoutChange}
				onColumnResized={handleLayoutChange}
				onColumnVisible={handleLayoutChange}
				onColumnPinned={handleLayoutChange}
				onSortChanged={handleSaveState}
				onFilterChanged={handleSaveState}
				onColumnGroupOpened={handleSaveState}
				// Default options spread
				{...defaultGridOptions}
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
