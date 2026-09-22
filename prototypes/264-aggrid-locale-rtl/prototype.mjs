// Throwaway empirical prototype for issue #264
// ("Spike: AG Grid locale and direction switching strategy").
//
// This is NOT production code and is not wired into the app. It is a standalone,
// headless (jsdom) harness that drives `ag-grid-community` directly (no React) to
// empirically answer, against the exact AG Grid version pinned in pendingsystem's
// package.json (ag-grid-community ^32.3.3):
//
//   1. Can `localeText` be changed on a mounted/live grid without recreating it?
//   2. Can `enableRtl` (reading direction) be changed on a mounted/live grid
//      without recreating it?
//   3. If recreation is required: does AG Grid's own getState()/initialState
//      round-trip correctly capture and restore column order/pinning, sort,
//      filter, row selection and pagination across a destroy()+recreate?
//   4. What happens to an open cell editor across a live-option attempt, and
//      across an actual destroy()+recreate?
//   5. Does the existing ~500ms persistence-debounce window in DataGrid.tsx
//      interact badly with a recreation that happens inside that window?
//
// How to run (from a directory with network access to the public npm registry):
//   npm install ag-grid-community@32.3.3 jsdom
//   node prototype.mjs
//
// See ../../docs/spikes/264-aggrid-locale-rtl.md (on branch spike/264-aggrid-locale)
// for the write-up of what this produced and the recommendation for the grid
// localization ticket. This script and its sibling `evidence/` files are the
// primary source that write-up is based on.

import { JSDOM } from "jsdom";
import { createGrid } from "ag-grid-community";
// v32.3.3's "packages" build (ag-grid-community, non-modular) self-registers all
// Community features; calling ModuleRegistry.registerModules() here throws
// ("mixing modules and packages"), unlike the v33+ modular API.

const dom = new JSDOM("<!doctype html><html><body><div id='grid'></div></body></html>", {
	pretendToBeVisual: true,
});
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, "navigator", { value: dom.window.navigator, configurable: true });
global.HTMLElement = dom.window.HTMLElement;
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.ResizeObserver = class {
	observe() {}
	unobserve() {}
	disconnect() {}
};
global.MutationObserver = dom.window.MutationObserver;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.DocumentFragment = dom.window.DocumentFragment;
global.CSS = dom.window.CSS ?? { supports: () => false, escape: (s) => s };

const warnings = [];
const originalWarn = console.warn;
console.warn = (...args) => {
	warnings.push(args.join(" "));
	originalWarn(...args);
};

const rowData = [
	{ id: "1", vin: "VIN001", part: "Alpha", qty: 5 },
	{ id: "2", vin: "VIN002", part: "Beta", qty: 2 },
	{ id: "3", vin: "VIN003", part: "Gamma", qty: 9 },
];

const columnDefs = [
	{ field: "vin", headerName: "VIN", checkboxSelection: true, editable: true, resizable: true },
	{ field: "part", headerName: "Part", editable: true, resizable: true },
	{ field: "qty", headerName: "Qty", editable: true, resizable: true },
];

const eGridDiv = document.getElementById("grid");
function gridDivFresh() {
	document.body.innerHTML = "<div id='grid2'></div>";
	return document.getElementById("grid2");
}

console.log("\n=== TEST 1: setGridOption('localeText', ...) on a LIVE grid ===");
{
	const gridOptions = {
		rowData,
		columnDefs,
		rowSelection: { mode: "multiRow", checkboxes: true },
		localeText: { noRowsToShow: "No rows (EN)" },
	};
	const api = createGrid(eGridDiv, gridOptions);

	// Force an overlay to check its rendered text
	api.setGridOption("rowData", []);
	api.showNoRowsOverlay();
	const before = eGridDiv.querySelector(".ag-overlay-no-rows-center")?.textContent;
	console.log("Overlay text BEFORE live localeText change:", before);

	warnings.length = 0;
	api.setGridOption("localeText", { noRowsToShow: "No rows (AR-live-attempt)" });
	api.showNoRowsOverlay();
	const after = eGridDiv.querySelector(".ag-overlay-no-rows-center")?.textContent;
	console.log("Overlay text AFTER live localeText change:", after);
	console.log("Console warnings emitted:", warnings);
	console.log("RESULT: live update took effect?", before !== after);

	api.destroy();
}

console.log("\n=== TEST 2: setGridOption('enableRtl', ...) on a LIVE grid ===");
{
	const gridOptions = {
		rowData,
		columnDefs,
		enableRtl: false,
	};
	const api = createGrid(eGridDiv, gridOptions);
	const rootClassesBefore = eGridDiv.querySelector(".ag-root-wrapper")?.className;
	console.log("Root wrapper classes BEFORE:", rootClassesBefore);

	warnings.length = 0;
	api.setGridOption("enableRtl", true);
	const rootClassesAfter = eGridDiv.querySelector(".ag-root-wrapper")?.className;
	console.log("Root wrapper classes AFTER live enableRtl=true attempt:", rootClassesAfter);
	console.log("Console warnings emitted:", warnings);
	console.log(
		"RESULT: ag-rtl class appeared live?",
		/ag-rtl/.test(rootClassesAfter ?? "") && !/ag-rtl/.test(rootClassesBefore ?? ""),
	);

	api.destroy();
}

console.log(
	"\n=== TEST 3: Recreation path — capture state, destroy, recreate with new locale/dir, restore state ===",
);
{
	const gridOptions = {
		rowData,
		columnDefs: JSON.parse(JSON.stringify(columnDefs)),
		rowSelection: { mode: "multiRow", checkboxes: true },
		enableRtl: false,
		localeText: { noRowsToShow: "No rows (EN)" },
	};
	const api = createGrid(eGridDiv, gridOptions);

	// Simulate user interaction: sort, move a column, resize, pin, select all, filter
	api.applyColumnState({
		state: [
			{ colId: "qty", sort: "desc" },
			{ colId: "part", width: 250 },
		],
		applyOrder: false,
	});
	api.moveColumns(["qty"], 0);
	api.setColumnsPinned(["vin"], "left");
	api.selectAll();
	api.setFilterModel({ part: { type: "contains", filter: "a" } });
	if (api.paginationSetPageSize) api.paginationSetPageSize(10);

	// This mirrors DataGrid.tsx's handleSaveState(): api.getState() is the captured snapshot
	const capturedState = api.getState();
	console.log("Captured state keys:", Object.keys(capturedState));
	console.log("  columnOrder:", capturedState.columnOrder?.orderedColIds);
	console.log("  columnPinning:", capturedState.columnPinning);
	console.log(
		"  columnSizing:",
		capturedState.columnSizing?.columnSizingState?.map((c) => `${c.colId}:${c.width}`),
	);
	console.log("  sort:", capturedState.sort);
	console.log("  filter:", capturedState.filter);
	console.log("  rowSelection (selected row ids):", capturedState.rowSelection);
	console.log("  pagination:", capturedState.pagination);
	console.log("  scroll:", capturedState.scroll);
	console.log("  focusedCell:", capturedState.focus);

	api.destroy();

	// Recreate with new direction + locale, restoring via initialState (as DataGrid.tsx does)
	const api2 = createGrid(eGridDiv, {
		rowData,
		columnDefs: JSON.parse(JSON.stringify(columnDefs)),
		rowSelection: { mode: "multiRow", checkboxes: true },
		enableRtl: true,
		localeText: { noRowsToShow: "No rows (AR)" },
		initialState: capturedState,
	});

	const restoredState = api2.getState();
	console.log(
		"Restored columnOrder matches?",
		JSON.stringify(restoredState.columnOrder) === JSON.stringify(capturedState.columnOrder),
	);
	console.log("Restored sort matches?", JSON.stringify(restoredState.sort) === JSON.stringify(capturedState.sort));
	console.log(
		"Restored filter matches?",
		JSON.stringify(restoredState.filter) === JSON.stringify(capturedState.filter),
	);
	console.log(
		"Restored rowSelection matches?",
		JSON.stringify(restoredState.rowSelection) === JSON.stringify(capturedState.rowSelection),
	);
	console.log(
		"Restored pinning matches?",
		JSON.stringify(restoredState.columnPinning) === JSON.stringify(capturedState.columnPinning),
	);
	console.log(
		"Restored sizing matches?",
		JSON.stringify(restoredState.columnSizing) === JSON.stringify(capturedState.columnSizing),
	);

	const rootClasses = eGridDiv.querySelector(".ag-root-wrapper")?.className;
	console.log("New root classes carry ag-rtl after recreation?", /ag-rtl/.test(rootClasses ?? ""));

	api2.destroy();
}

console.log("\n=== TEST 4a: Open cell editor, live-option attempt, then destroy WITHOUT flushing the editor ===");
{
	const freshRowData = () => [
		{ id: "1", vin: "VIN001", part: "Alpha", qty: 5 },
		{ id: "2", vin: "VIN002", part: "Beta", qty: 2 },
		{ id: "3", vin: "VIN003", part: "Gamma", qty: 9 },
	];
	const gridOptions = {
		rowData: freshRowData(),
		columnDefs: JSON.parse(JSON.stringify(columnDefs)),
		getRowId: (p) => p.data.id,
	};
	const api = createGrid(gridDivFresh(), gridOptions);

	api.startEditingCell({ rowIndex: 1, colKey: "part" }); // row id "2", part "Beta"
	const isEditingBefore = api.getEditingCells().length > 0;

	const [editorInstance] = api.getCellEditorInstances({ rowNodes: [api.getRowNode("2")] });
	console.log("Editor open before switch attempt?", isEditingBefore, "| editor instance found?", !!editorInstance);
	console.log("Underlying row data before any live attempt:", api.getRowNode("2")?.data?.part);

	// Attempt a LIVE locale change while editor is open (no recreation) — does it disturb the editor?
	api.setGridOption("localeText", { noRowsToShow: "x" });
	const isEditingAfterLiveAttempt = api.getEditingCells().length > 0;
	console.log("Still editing after a live setGridOption attempt (editor undisturbed)?", isEditingAfterLiveAttempt);

	// Recreation path: capture state, destroy WITHOUT calling stopEditing() first, recreate from external rowData.
	const stateBeforeDestroy = api.getState();
	api.destroy();
	const api2 = createGrid(gridDivFresh(), {
		rowData: freshRowData(), // what React Query/DataGrid's `rowData` prop actually holds — untouched by any in-progress keystroke
		columnDefs: JSON.parse(JSON.stringify(columnDefs)),
		getRowId: (p) => p.data.id,
		initialState: stateBeforeDestroy,
	});
	console.log(
		"Row 'part' after destroy+recreate WITHOUT explicit flush (expect original 'Beta' — any uncommitted edit is silently discarded, never applied to the row model):",
		api2.getRowNode("2")?.data?.part,
	);
	api2.destroy();
}

console.log("\n=== TEST 4b: Same scenario, but the switch code explicitly commits the editor before destroying ===");
{
	const freshRowData = () => [
		{ id: "1", vin: "VIN001", part: "Alpha", qty: 5 },
		{ id: "2", vin: "VIN002", part: "Beta", qty: 2 },
		{ id: "3", vin: "VIN003", part: "Gamma", qty: 9 },
	];
	const gridOptions = {
		rowData: freshRowData(),
		columnDefs: JSON.parse(JSON.stringify(columnDefs)),
		getRowId: (p) => p.data.id,
	};
	const api = createGrid(gridDivFresh(), gridOptions);

	api.startEditingCell({ rowIndex: 1, colKey: "part" });

	// The switching code explicitly flushes the editor (commit, not cancel) before capturing state/destroying.
	// gridApi.d.ts: `stopEditing(cancel?: boolean): void` — "Pass `true` if you want to cancel the editing
	// (i.e. don't accept changes)"; omitted/false = accept (commit).
	api.stopEditing(false);
	const committedRowData = api.getRowNode("2")?.data;
	console.log("Row 'part' immediately after explicit stopEditing(false) commit:", committedRowData?.part);

	const stateBeforeDestroy = api.getState();
	api.destroy();
	const api2 = createGrid(gridDivFresh(), {
		rowData: [freshRowData()[0], committedRowData, freshRowData()[2]], // caller must read the committed value back out before recreating with fresh rowData
		columnDefs: JSON.parse(JSON.stringify(columnDefs)),
		getRowId: (p) => p.data.id,
		initialState: stateBeforeDestroy,
	});
	console.log(
		"Row 'part' after recreation, when caller explicitly committed+re-read before switching:",
		api2.getRowNode("2")?.data?.part,
	);
	api2.destroy();
}

console.log(
	"\n=== TEST 5: Debounce-window interaction — state change inside the 500ms persistence debounce, then recreation ===",
);
{
	// Mirrors DataGrid.tsx's handleSaveState(): setLiveGridState() is synchronous (in-memory),
	// saveGridState() (the durable write) is deferred 500ms via setTimeout.
	let liveGridState = null;
	let persistedGridState = null;
	function setLiveGridState(s) {
		liveGridState = s;
	}
	function saveGridStateDebounced(s) {
		return new Promise((resolve) => {
			setTimeout(() => {
				persistedGridState = s;
				resolve();
			}, 500);
		});
	}

	const gridOptions = {
		rowData,
		columnDefs: JSON.parse(JSON.stringify(columnDefs)),
	};
	const api = createGrid(eGridDiv, gridOptions);

	// User resizes a column -> handleLayoutChange -> handleSaveState fires synchronously with api.getState(),
	// updates the live (in-memory) snapshot immediately, and schedules the debounced durable write.
	api.setColumnWidths([{ key: "part", newWidth: 321 }]);
	const stateAtChange = api.getState();
	setLiveGridState(stateAtChange);
	const debouncedWrite = saveGridStateDebounced(stateAtChange);

	// A locale switch requiring recreation happens INSIDE the 500ms window, before the debounced write lands.
	const stateAtRecreateTime = liveGridState; // what DataGrid.tsx would read: the live snapshot, not the (not-yet-committed) persisted one
	console.log(
		"persistedGridState at moment of recreation (should be null — debounce not fired yet):",
		persistedGridState,
	);
	console.log("liveGridState at moment of recreation (available immediately, no data loss if used):", !!stateAtRecreateTime);

	api.destroy();
	const api2 = createGrid(eGridDiv, {
		rowData,
		columnDefs: JSON.parse(JSON.stringify(columnDefs)),
		initialState: stateAtRecreateTime,
	});
	const restored = api2.getState();
	console.log(
		"Column width survives recreation when the switch reads the LIVE (in-memory) snapshot instead of waiting for the debounced write:",
		restored.columnSizing?.columnSizingState?.some((c) => c.colId === "part" && c.width === 321),
	);

	await debouncedWrite; // let the original debounce resolve, proving it would have landed too late anyway
	console.log(
		"(for contrast) debounced durable write eventually resolved with width:",
		persistedGridState.columnSizing?.columnSizingState?.find((c) => c.colId === "part")?.width,
	);

	api2.destroy();
}

console.log("\nDone.");
