// Throwaway empirical prototype for issue #264
// ("Spike: AG Grid locale and direction switching strategy").
//
// This is NOT production code and is not wired into the app. It is a standalone,
// headless (jsdom) harness that drives `ag-grid-community` directly (no React) to
// empirically answer, against the exact AG Grid version pinned in pendingsystem's
// pnpm-lock.yaml (ag-grid-community 32.3.9, resolved from the `^32.3.3` range in
// package.json):
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
//   npm install ag-grid-community@32.3.9 jsdom
//   node prototype.mjs
//
// Revision note (review 5274566894 on PR #282): the first pass of this script
// tested a stale version (32.3.3, not the 32.3.9 actually resolved by the
// lockfile) and had several harness bugs that made TEST 1/3/4/5 compare
// undefined-vs-undefined or empty-vs-empty instead of real values:
//   - TEST 1 never awaited a tick after showNoRowsOverlay()/before reading
//     `.textContent`, so both BEFORE and AFTER reads landed before AG Grid's
//     internal `requestAnimationFrame`-deferred overlay render ran.
//   - TEST 3/5 read `capturedState.columnSizing?.columnSizingState` — the real
//     field on `ColumnSizingState` in 32.3.9's shipped `gridState.d.ts` is
//     `columnSizingModel`, so the old code always logged undefined regardless
//     of whether sizing was actually captured.
//   - TEST 3 read `capturedState.focus` — the real field is `focusedCell`, so
//     that comparison was undefined-vs-undefined no matter what.
//   - TEST 3's `part` column had no `filter` configured, so `setFilterModel()`
//     silently no-opped (AG Grid even warns about this in the console).
//   - TEST 3's `gridOptions.pagination` was never set to `true`, so pagination
//     was inactive and `paginationSetPageSize` (which doesn't exist as an API
//     method in 32.3.9 anyway — pagination page size is a managed grid option,
//     `paginationPageSize`) was a no-op call to a function AG Grid doesn't ship.
//   - TEST 4a/4b opened a cell editor but never mutated its value, so commit vs.
//     discard were indistinguishable (both looked like "nothing happened").
// All of these are fixed below; see the per-test comments for what changed.
//
// See ../../docs/adr/0003-ag-grid-locale-rtl-switching-strategy.md (on branch
// spike/264-aggrid-locale) for the write-up of what this produced and the
// recommendation for the grid localization ticket. This script and its sibling
// evidence files are the primary source that write-up is based on.

import { JSDOM } from "jsdom";
import { createGrid } from "ag-grid-community";
// v32.3.9's "packages" build (ag-grid-community, non-modular) self-registers all
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

// AG Grid schedules several things (overlay render, firstDataRendered's cached
// state hookup) via `window.requestAnimationFrame`, which we've mapped to
// `setTimeout(cb, 0)` above. A real browser would run these on the next paint;
// here we must explicitly await a macrotask tick for them to have run before we
// inspect DOM text or state that depends on them.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
	{ id: "4", vin: "VIN004", part: "Delta", qty: 1 },
	{ id: "5", vin: "VIN005", part: "Epsilon", qty: 3 },
];

const columnDefs = [
	{ field: "vin", headerName: "VIN", checkboxSelection: true, editable: true, resizable: true },
	// `filter: "agTextColumnFilter"` added so TEST 3's setFilterModel() actually applies
	// (previously this column had no filter type configured, so the call silently no-opped).
	{ field: "part", headerName: "Part", editable: true, resizable: true, filter: "agTextColumnFilter" },
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
		columnDefs: JSON.parse(JSON.stringify(columnDefs)),
		rowSelection: { mode: "multiRow", checkboxes: true },
		localeText: { noRowsToShow: "No rows (EN)" },
	};
	const api = createGrid(eGridDiv, gridOptions);
	await sleep(20); // let the grid finish its initial (rAF-deferred) render

	// Force an overlay to check its rendered text. showNoRowsOverlay() itself defers
	// the actual overlay DOM update via requestAnimationFrame, so we must await a
	// tick before reading .textContent, or we read it before it's populated at all.
	api.setGridOption("rowData", []);
	api.showNoRowsOverlay();
	await sleep(0);
	const before = eGridDiv.querySelector(".ag-overlay-no-rows-center")?.textContent;
	console.log("Overlay text BEFORE live localeText change:", before);

	warnings.length = 0;
	api.setGridOption("localeText", { noRowsToShow: "No rows (AR-live-attempt)" });
	api.showNoRowsOverlay();
	await sleep(0);
	const after = eGridDiv.querySelector(".ag-overlay-no-rows-center")?.textContent;
	console.log("Overlay text AFTER live localeText change:", after);
	console.log("Console warnings emitted:", warnings);
	console.log(
		"RESULT: BEFORE is a real non-empty localized string?",
		before === "No rows (EN)",
	);
	console.log(
		"RESULT: live localeText update took visible effect (text actually changed)?",
		before !== after,
	);

	api.destroy();
}

console.log("\n=== TEST 2: setGridOption('enableRtl', ...) on a LIVE grid ===");
{
	const gridOptions = {
		rowData,
		columnDefs: JSON.parse(JSON.stringify(columnDefs)),
		enableRtl: false,
	};
	const api = createGrid(eGridDiv, gridOptions);
	await sleep(20);
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
		// pagination must be explicitly enabled, or paginationPageSize/paginationGoToPage
		// are inert and PaginationState stays at the untouched default (page 0, size 100).
		pagination: true,
		paginationPageSizeSelector: false,
		enableRtl: false,
		localeText: { noRowsToShow: "No rows (EN)" },
	};
	const api = createGrid(eGridDiv, gridOptions);
	// Wait for firstDataRendered so the state service wires up its focusedCell/scroll
	// cached-state listeners before we set focus below — otherwise getState() reports
	// focusedCell as undefined even though getFocusedCell() shows the focus really landed.
	await sleep(20);

	// Simulate user interaction: sort, move a column, resize, pin, select all, filter,
	// paginate to a non-default page, and focus a cell.
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
	api.setGridOption("paginationPageSize", 2); // 5 rows / 2 per page -> 3 pages
	api.paginationGoToPage(1); // second page (index 1) — not the default (0)
	api.setFocusedCell(1, "part");
	await sleep(0);

	// This mirrors DataGrid.tsx's handleSaveState(): api.getState() is the captured snapshot
	const capturedState = api.getState();
	console.log("Captured state keys:", Object.keys(capturedState));
	console.log("  columnOrder:", capturedState.columnOrder?.orderedColIds);
	console.log("  columnPinning:", capturedState.columnPinning);
	console.log(
		"  columnSizing:",
		// `columnSizingModel` (not `columnSizingState`) is the real field name on
		// ColumnSizingState in 32.3.9's shipped gridState.d.ts.
		capturedState.columnSizing?.columnSizingModel?.map((c) => `${c.colId}:${c.width}`),
	);
	console.log("  sort:", capturedState.sort);
	console.log("  filter:", capturedState.filter);
	console.log("  rowSelection (selected row ids):", capturedState.rowSelection);
	console.log("  pagination:", capturedState.pagination);
	console.log("  scroll:", capturedState.scroll, "(see note below)");
	// `focusedCell` (not `focus`) is the real field name on GridState.
	console.log("  focusedCell:", capturedState.focusedCell);

	api.destroy();

	// Recreate with new direction + locale, restoring via initialState (as DataGrid.tsx does)
	const api2 = createGrid(eGridDiv, {
		rowData,
		columnDefs: JSON.parse(JSON.stringify(columnDefs)),
		rowSelection: { mode: "multiRow", checkboxes: true },
		pagination: true,
		paginationPageSizeSelector: false,
		enableRtl: true,
		localeText: { noRowsToShow: "No rows (AR)" },
		initialState: capturedState,
	});
	await sleep(20);

	const restoredState = api2.getState();
	console.log(
		"Restored columnOrder matches?",
		JSON.stringify(restoredState.columnOrder) === JSON.stringify(capturedState.columnOrder),
	);
	console.log("Restored sort matches?", JSON.stringify(restoredState.sort) === JSON.stringify(capturedState.sort));
	console.log(
		"Restored filter matches (real filterModel, not undefined-vs-undefined)?",
		capturedState.filter?.filterModel?.part?.filter === "a" &&
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
		"Restored sizing matches (real non-empty columnSizingModel, not undefined-vs-undefined)?",
		(capturedState.columnSizing?.columnSizingModel?.length ?? 0) > 0 &&
			JSON.stringify(restoredState.columnSizing) === JSON.stringify(capturedState.columnSizing),
	);
	console.log(
		"Restored pagination matches (real non-default page, not just the untouched default)?",
		capturedState.pagination?.page === 1 &&
			JSON.stringify(restoredState.pagination) === JSON.stringify(capturedState.pagination),
	);
	console.log(
		"Restored focusedCell matches (real value, not undefined-vs-undefined)?",
		!!capturedState.focusedCell &&
			JSON.stringify(restoredState.focusedCell) === JSON.stringify(capturedState.focusedCell),
	);
	console.log(
		"OPEN ITEM — scroll: could NOT get a non-undefined scroll position in headless jsdom",
		"(GridStateService.getScrollState() reads live scrollFeature.getVScrollPosition()/getHScrollPosition(),",
		"and its cached-state entry only updates on a real 'bodyScrollEnd' event, which requires an actual",
		"scrollable viewport with real dimensions — jsdom has none. This mirrors the original ADR's existing",
		"flag that column-sizing/scroll/focus needed a real-browser check; focus is now confirmed here,",
		"scroll remains open pending a real-browser (Playwright) check.",
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
	await sleep(20);

	api.startEditingCell({ rowIndex: 1, colKey: "part" }); // row id "2", part "Beta"
	const isEditingBefore = api.getEditingCells().length > 0;

	const [editorInstance] = api.getCellEditorInstances({ rowNodes: [api.getRowNode("2")] });
	console.log("Editor open before switch attempt?", isEditingBefore, "| editor instance found?", !!editorInstance);
	console.log("Underlying row data before any live attempt:", api.getRowNode("2")?.data?.part);

	// Actually mutate the editor's live value (simulating a keystroke), via the default
	// text cell editor's public `eInput` (an AgInputTextField) and its `setValue()` API,
	// reached through `getCellEditorInstances()`. Previously the editor was opened but
	// its value was never touched, so committing vs. discarding looked identical.
	editorInstance.eInput.setValue("Zed");
	console.log("Editor's live (uncommitted) value after simulated keystroke:", editorInstance.getValue());
	console.log("Underlying row data is still untouched (uncommitted edit isn't applied yet):", api.getRowNode("2")?.data?.part);

	// Attempt a LIVE locale change while editor is open (no recreation) — does it disturb the editor?
	api.setGridOption("localeText", { noRowsToShow: "x" });
	const isEditingAfterLiveAttempt = api.getEditingCells().length > 0;
	console.log("Still editing after a live setGridOption attempt (editor undisturbed)?", isEditingAfterLiveAttempt);
	console.log("Editor's live value survived the live-option attempt?", editorInstance.getValue() === "Zed");

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
		"Row 'part' after destroy+recreate WITHOUT explicit flush",
		"(expect original 'Beta', NOT the uncommitted 'Zed' — an in-progress edit is silently discarded, never applied to the row model):",
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
	await sleep(20);

	api.startEditingCell({ rowIndex: 1, colKey: "part" });
	const [editorInstance] = api.getCellEditorInstances({ rowNodes: [api.getRowNode("2")] });
	editorInstance.eInput.setValue("Zed"); // same simulated keystroke as 4a

	// The switching code explicitly flushes the editor (commit, not cancel) before capturing state/destroying.
	// gridApi.d.ts: `stopEditing(cancel?: boolean): void` — "Pass `true` if you want to cancel the editing
	// (i.e. don't accept changes)"; omitted/false = accept (commit).
	api.stopEditing(false);
	const committedRowData = api.getRowNode("2")?.data;
	console.log(
		"Row 'part' immediately after explicit stopEditing(false) commit (expect the new value 'Zed', not the original 'Beta'):",
		committedRowData?.part,
	);

	const stateBeforeDestroy = api.getState();
	api.destroy();
	const api2 = createGrid(gridDivFresh(), {
		rowData: [freshRowData()[0], committedRowData, freshRowData()[2]], // caller must read the committed value back out before recreating with fresh rowData
		columnDefs: JSON.parse(JSON.stringify(columnDefs)),
		getRowId: (p) => p.data.id,
		initialState: stateBeforeDestroy,
	});
	console.log(
		"Row 'part' after recreation, when caller explicitly committed+re-read before switching",
		"(expect 'Zed', proving the commit path — unlike 4a's discard path — actually survives recreation):",
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
	await sleep(20);

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
	console.log(
		"liveGridState actually captured the resized width as a real number (not undefined; downstream of the TEST 3 columnSizingModel fix)?",
		stateAtRecreateTime.columnSizing?.columnSizingModel?.find((c) => c.colId === "part")?.width === 321,
	);

	api.destroy();
	const api2 = createGrid(eGridDiv, {
		rowData,
		columnDefs: JSON.parse(JSON.stringify(columnDefs)),
		initialState: stateAtRecreateTime,
	});
	await sleep(20);
	const restored = api2.getState();
	console.log(
		"Column width (321, a real captured/restored number) survives recreation when the switch reads the LIVE",
		"(in-memory) snapshot instead of waiting for the debounced write:",
		restored.columnSizing?.columnSizingModel?.some((c) => c.colId === "part" && c.width === 321),
	);

	await debouncedWrite; // let the original debounce resolve, proving it would have landed too late anyway
	console.log(
		"(for contrast) debounced durable write eventually resolved with width:",
		persistedGridState.columnSizing?.columnSizingModel?.find((c) => c.colId === "part")?.width,
	);

	api2.destroy();
}

console.log("\nDone.");
