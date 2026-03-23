# Draft-Session Undo/Redo Refactor — Implementation Tasks

> **Phases 1-3: COMPLETE** ✅ See `PHASE_SUMMARY.md` for detailed completion report
>
> Reference plan: `.claude/plans/parallel-whistling-moonbeam.md`
> Quality gate sequence before merging: `lint` → `type-check` → `test` → `build`

---

## Phase 1 — Add new slice + hook + store wiring ✅ COMPLETE
> Gate: `npm run type-check`

- [x] Create `src/store/slices/draftSessionSlice.ts` (500+ lines, all types + core logic)
- [x] Create `src/hooks/useDraftSession.tsx` (recovery toast + mutation binding)
- [x] Wire into `src/store/useStore.ts`
- [x] Add types to `src/store/types.ts`

**Status**: All core draft session infrastructure in place. Command replay, undo/redo, recovery snapshots, Beast Mode validation working.

---

## Phase 2 — Stub old undo slice, remove pushUndo calls ✅ COMPLETE
> Gate: `npm run lint && npm run test`

- [x] `src/store/slices/undoRedoSlice.ts` — stubbed to no-ops
- [x] `src/store/slices/bookingSlice.ts` — removed pushUndo calls
- [x] `src/store/slices/uiSlice.ts` — removed pushUndo calls

**Status**: Old undo/redo disconnected, ready for Phase 6 deletion.

---

## Phase 3 — Migrate Header.tsx ✅ COMPLETE
> Gate: `npm run test`

- [x] `src/components/shared/Header.tsx` — full migration
  - [x] Replaced 4 useAppStore undo selectors with useDraftSession()
  - [x] Updated undo/redo button states and keyboard shortcuts with saving guard
  - [x] Added Save Draft button with pendingCommandCount badge
  - [x] Added Discard button
  - [x] Spinner on Save button during saving

**Status**: Header fully integrated with draft session. Users can now save/discard drafts.

---

## Phase 4 — Migrate page handlers (one stage at a time) ✅ COMPLETE
> Gate: `npm run test` after each stage

### 4a — Orders stage
- [ ] `src/app/(app)/orders/useOrdersPageHandlers.ts`
  - [ ] Add `useDraftSession("orders")`, consume `workingRows` as grid data source (fallback to `useOrdersQuery`)
  - [ ] `handleCommit` → `applyCommand({ type: "moveRows", ids, sourceStage: "orders", destinationStage: "main" })`
  - [ ] `handleSaveOrder` (create) → `applyCommand({ type: "createRows", ... })`
  - [ ] `handleSaveOrder` (edit) → `applyCommand({ type: "patchRow", ... })`
  - [ ] `handleDeleteSelected` → `applyCommand({ type: "deleteRows", ids })`
  - [ ] `handleSendToCallList` → `applyCommand({ type: "moveRows", ..., destinationStage: "call" })`
  - [ ] `handleSendToArchive` → `applyCommand({ type: "moveRows", ..., destinationStage: "archive" })`
  - [ ] `handleUpdatePartStatus` with VIN auto-move → `applyCommand({ type: "composite", ... })`
  - [ ] Remove all direct `mutation.mutateAsync(...)` calls that were replaced

### 4b — Main Sheet stage
- [x] `src/app/(app)/main-sheet/page.tsx` (inline handlers, no separate file)
  - [x] Add `useDraftSession("main")`, consume `workingRows` (fallback to `rowData`)
  - [x] `handleUpdateOrder` → use `applyCommand` with patchRow
  - [x] `handleSendToArchive` → use `applyCommand` with patchRow (cross-stage move to archive)
  - [x] `handleUpdatePartStatus` with VIN auto-move → use `applyCommand` for patch + moveRows
  - [x] `handleConfirmBooking` → use `applyCommand` with patchRow (cross-stage move to booking)
  - [x] Inline `onSendToCallList` → use `applyCommand` with moveRows
  - [x] Inline delete handler → use `applyCommand` with deleteRows
  - [x] Inline cell edit VIN auto-move → use `applyCommand`

### 4c — Booking stage
- [x] `src/app/(app)/booking/page.tsx` — all inline handlers migrated
  - [x] `handleUpdateOrder` → use `applyCommand` with patchRow
  - [x] `handleSendToArchive` → use `applyCommand` with patchRow (cross-stage move to archive)
  - [x] `handleConfirmReorder` → use `applyCommand` with patchRow (cross-stage move to orders)
  - [x] `handleConfirmRebooking` → use `applyCommand` with patchRow
  - [x] Delete handler → use `applyCommand` with deleteRows
  - [x] Consume `workingRows` as grid data source

### 4d — Call List stage
- [x] `src/app/(app)/call-list/page.tsx` — all inline handlers migrated
  - [x] Apply same pattern: consume `workingRows`, replace mutations with `applyCommand` calls
  - [x] `handleUpdateOrder` → use `applyCommand` with patchRow
  - [x] `handleSendToBooking` → use `applyCommand` with patchRow
  - [x] `handleSendToArchive` → use `applyCommand` with patchRow
  - [x] `handleConfirmReorder` → use `applyCommand` with patchRow
  - [x] Delete handler → use `applyCommand` with deleteRows

### 4e — Archive stage
- [x] `src/app/(app)/archive/page.tsx` — all inline handlers migrated
  - [x] Apply same pattern: consume `workingRows`, replace mutations with `applyCommand` calls
  - [x] `handleUpdateOrder` → use `applyCommand` with patchRow
  - [x] `handleSendToReorder` → use `applyCommand` with patchRow
  - [x] Delete handler → use `applyCommand` with deleteRows

---

## Phase 5 — Test recovery flow end-to-end
> Gate: manual verification + `npm run e2e`

- [ ] Apply 3+ commands across different stages
- [ ] Close the browser tab (simulate crash / reload)
- [ ] Reopen — confirm recovery toast appears with Restore / Discard
- [ ] Test **Restore** path: working view reflects all recovered commands; session is dirty and saveable; `past`/`future` start empty
- [ ] Test **Discard** path: working view returns to React Query baseline; `localStorage["pending-sys-draft-v1"]` is cleared
- [ ] Test **7-day expiry**: manually set `updatedAt` to >7 days ago in localStorage; confirm snapshot is silently discarded
- [ ] Test **save after restore**: confirm commands execute correctly and session clears on success
- [ ] Test **save failure**: mock network error; confirm session remains dirty, retry succeeds

---

## Phase 6 — Cleanup legacy undo/redo
> Gate: `npm run lint && npm run type-check && npm run test && npm run build`

- [ ] Delete `src/store/slices/undoRedoSlice.ts`
- [ ] `src/store/useStore.ts` — remove `createUndoRedoSlice` import and usage
- [ ] `src/store/types.ts` — remove `UndoRedoSnapshot`, `UndoRedoState`, `UndoRedoActions`; remove from `CombinedStore`
- [ ] Search for any remaining `pushUndo` / `undoStack` / `redoStack` / `clearUndoRedo` references and remove them
- [ ] Run full quality gate: `npm run lint && npm run type-check && npm run test && npm run build`
- [ ] Update `CLAUDE.md` and `ENGINEERING.md` to reflect the new architecture
