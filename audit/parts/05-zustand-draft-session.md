# Audit Report: A05: Zustand Store & Draft-Session Integrity

This report contains findings from the codebase audit of the Zustand store slices (`src/store/**`), the draft-session mechanics, and localStorage recovery/persistence utilities in the "pendingsystem" project.

---

### [A05-01] Stale/Empty Baseline Captured on Recovery Restore Before React Query Cache Loads
- **Severity**: High
- **Category**: Correctness/Bug
- **Location**: `src/store/slices/draftSessionSlice.ts:109` (`_captureBaseline`), `src/hooks/useDraftSession.tsx:98-138`
- **Evidence**:
  In `src/store/slices/draftSessionSlice.ts`:
  ```ts
  _captureBaseline: () => {
  	const baseline: Record<OrderStage, PendingRow[]> = {} as Record<
  		OrderStage,
  		PendingRow[]
  	>;
  	const adapter = getOrdersQueryAdapter();
  	for (const stage of ORDER_STAGES) {
  		baseline[stage] = adapter.getStageRows(stage) ?? [];
  	}
  	set((state) => ({
  		draftSession: {
  			...state.draftSession,
  			baselineByStage: baseline,
  			derivedRowsRevision: allocateDerivedRowsRevision(),
  			isActive: true,
  		},
  	}));
  },
  ```
  In `src/hooks/useDraftSession.tsx`:
  ```ts
  const snapshot: DraftRecoverySnapshot = JSON.parse(raw);
  ...
  activeRecoveryToastId = toast.custom(
  	(t) => (
  		<div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900 p-4">
  			<p className="text-sm text-white">
  				You have <strong>{snapshot.pendingCommands.length} unsaved changes</strong> from your last session.
  			</p>
  			<div className="flex gap-2">
  				<button
  					type="button"
  					onClick={() => {
  						clearRecoveryToastOffer();
  						restoreFromRecovery(snapshot);
  						toast.dismiss(t);
  					}}
  ...
  ```
- **Why it's real**:
  Upon a fresh page load or browser refresh, the React Query caches are empty/uninitialized, and the app starts fetching order stages asynchronously from the network. Simultaneously, the `useDraftSession` hook mounts, detects the recovery snapshot in `localStorage`, and displays the recovery toast.
  If the user clicks the "Restore" button before the network requests complete (which is highly likely as the toast renders immediately on mount), `restoreFromRecovery` triggers `_captureBaseline()`.
  Since React Query is still in a loading state, `adapter.getStageRows(stage)` returns `undefined` for all stages, defaulting the baseline of each stage to `[]`.
  Once the network requests complete and populate the query caches, the draft session is already marked `isActive: true` with baseline data locked at `[]`. As a result, `_deriveWorkingRows()` replays the draft commands on top of the empty arrays. This causes all existing database rows to visually disappear from the grid, leaving only the restored draft rows.
- **Recommendation**:
  Do not allow restoring when the stage queries are still loading. Inspect `adapter.isStageLoaded(stage)` in the query adapter, and either:
  1. Defer showing the recovery toast or disable the "Restore" button until all stage caches have loaded.
  2. Dynamically re-capture or update the baseline once the query cache shifts from uninitialized to loaded.
- **Confidence**: High

---

### [A05-02] Architectural Violation: Redundant Server State Cached in Zustand Slices
- **Severity**: Medium
- **Category**: Architecture
- **Location**: `src/store/slices/ordersSlice.ts:9` (`ordersRowData`), `src/store/slices/inventorySlice.ts:9` (`rowData`, `callRowData`), `src/store/slices/bookingSlice.ts:11` (`bookingRowData`), and `src/store/slices/uiSlice.ts:11` (`archiveRowData`).
- **Evidence**:
  In `src/store/slices/ordersSlice.ts`:
  ```ts
  export const createOrdersSlice: StateCreator<
  	CombinedStore,
  	[["zustand/persist", unknown]],
  	[],
  	OrdersState & OrdersActions
  > = (set, get) => ({
  	ordersRowData: [],
  ...
  ```
  In `src/store/slices/inventorySlice.ts`:
  ```ts
  export const createInventorySlice: StateCreator<
  	CombinedStore,
  	[["zustand/persist", unknown]],
  	[],
  	InventoryState & InventoryActions
  > = (set, get) => ({
  	rowData: [],
  	callRowData: [],
  ...
  ```
- **Why it's real**:
  The project architecture specifies that React Query is the single source of truth for live server state. However, the Zustand store contains slices that duplicate and maintain these lists of server rows.
  These arrays are initialized to `[]` and their corresponding setters (`setOrdersRowData`, `setRowData`, `setBookingRowData`, etc.) are never invoked by any pages, components, or React Query query sync hooks during runtime.
  This results in obsolete state properties and dead actions residing in the Zustand store, creating significant architectural clutter and the risk of components subscribing to empty/stale arrays.
- **Recommendation**:
  Delete the obsolete array fields and their unused setter actions from the store slices. Any component or service requiring counts or lists of stage rows must subscribe to the respective React Query hooks or read directly from the query client cache.
- **Confidence**: High

---

### [A05-03] Incorrect/Stale Status Usage Counts in Settings Tab
- **Severity**: Medium
- **Category**: Correctness/Bug
- **Location**: `src/components/shared/settings/PartStatusTab.tsx:18-33`
- **Evidence**:
  ```ts
  // Data for usage checks
  const rowData = useAppStore((state) => state.rowData);
  const ordersRowData = useAppStore((state) => state.ordersRowData);
  const callRowData = useAppStore((state) => state.callRowData);
  const archiveRowData = useAppStore((state) => state.archiveRowData);
  const bookingRowData = useAppStore((state) => state.bookingRowData);

  const getPartStatusUsage = (label: string) => {
  	const allRows = [
  		...rowData,
  		...ordersRowData,
  		...callRowData,
  		...archiveRowData,
  		...bookingRowData,
  	];
  	return allRows.filter((row) => row.status === label).length;
  };
  ```
- **Why it's real**:
  The `PartStatusTab` calculates status usage to prevent users from deleting statuses that are currently referenced by active rows.
  However, it retrieves the row lists from the obsolete and unpopulated Zustand arrays (`state.ordersRowData`, etc.) instead of querying the React Query caches.
  Consequently, `getPartStatusUsage` always operates on empty arrays and returns `0` for all statuses. Displayed usage counts in the settings UI are always incorrect, and users can delete statuses that are actively in use in the database.
- **Recommendation**:
  Modify `PartStatusTab` to compute status usage counts by reading directly from the React Query cache (e.g., via `queryClient.getQueryData`) or by passing the loaded stage data down as props.
- **Confidence**: High

---

### [A05-04] Lost Undo History on Recovery Restore
- **Severity**: Low
- **Category**: Correctness/Bug
- **Location**: `src/store/slices/draftSessionSlice.ts:241` (`restoreFromRecovery`)
- **Evidence**:
  ```ts
  restoreFromRecovery: (snapshot: DraftRecoverySnapshot) => {
  	// Capture fresh baseline from current RQ caches
  	get()._captureBaseline();

  	const newSession = get().draftSession;

  	set(() => ({
  		draftSession: {
  			...newSession,
  			derivedRowsRevision: allocateDerivedRowsRevision(),
  			pendingCommands: snapshot.pendingCommands,
  			past: [],
  			future: [],
  			dirty: snapshot.pendingCommands.length > 0,
  			touchedStages: new Set(getAllCommandStages(snapshot.pendingCommands)),
  			lastTouchedAt: snapshot.updatedAt,
  		},
  	}));
  },
  ```
- **Why it's real**:
  When a user restores a draft session from a crash recovery snapshot (`localStorage`), `restoreFromRecovery` sets both the `past` (undo) and `future` (redo) stacks to `[]`.
  This means that once restored, the user cannot undo any of the restored commands. For example, if there were 5 unsaved changes restored, pressing "Undo" will do nothing because `past` is empty. The user is forced to either keep all 5 changes or discard the draft entirely.
- **Recommendation**:
  Reconstruct the `past` array in `restoreFromRecovery` using the list of restored `snapshot.pendingCommands` so that the restored commands can be undone one by one.
- **Confidence**: High
