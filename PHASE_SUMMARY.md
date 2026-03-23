# Draft-Session Undo/Redo Refactor — Phase 1-3 Complete Summary

## Overview
The first three phases of the draft-session undo/redo refactor are complete. This establishes the core infrastructure for a command-based draft system where React Query remains the source of truth and Zustand manages pending changes.

## Architecture Implemented

### Core State Model
```ts
interface DraftSession {
  isActive: boolean;
  baselineByStage: Record<OrderStage, PendingRow[]>;  // RQ snapshot
  pendingCommands: DraftCommand[];                      // ordered command queue
  past: DraftCommand[];                                 // undo stack (mirrors pendingCommands)
  future: DraftCommand[];                               // redo stack
  dirty: boolean;                                       // pendingCommands.length > 0
  saving: boolean;                                      // locked during save
  saveError: string | null;
  touchedStages: Set<OrderStage>;
  lastTouchedAt: number | null;
  workspaceId: string;                                  // stable browser UUID
}
```

### Command Types (v1)
- `PatchRowCommand`: Update fields, optionally move cross-stage
- `CreateRowsCommand`: Insert new rows
- `DeleteRowsCommand`: Remove rows (global search)
- `MoveRowsCommand`: Transfer rows between stages with optional field overrides
- `CompositeCommand`: Batch multiple atomic commands with label

## What's Complete

### Phase 1: Core Infrastructure ✅
**File: `src/store/slices/draftSessionSlice.ts` (500+ lines)**
- All command type definitions
- `DraftSession`, `DraftRecoverySnapshot` interfaces
- Helper functions: `getOrCreateWorkspaceId()`, `deepCloneByStage()`
- Core slice methods:
  - `_captureBaseline()`: Lazy snapshot on first action
  - `_deriveWorkingRows()`: Full replay of pending commands
  - `applyCommand()`: Command application with Beast Mode guard
  - `undoDraft()`, `redoDraft()`: Undo/redo via stack manipulation
  - `saveDraft()`: Sequential mutation execution with lock
  - `discardDraft()`: Reset session, invalidate RQ
  - `restoreFromRecovery()`: Restore from localStorage snapshot
  - `_persistRecovery()`, `_clearRecovery()`: localStorage management

**File: `src/hooks/useDraftSession.tsx` (120+ lines, "use client")**
- Recovery check on mount: reads localStorage, validates workspace + age (<7 days)
- Non-blocking recovery toast with Restore/Discard buttons
- Mutation hook binding at call time (useSaveOrderMutation, useBulkUpdateOrderStageMutation, useBulkDeleteOrdersMutation)
- Exposed API:
  - State: `isActive`, `dirty`, `saving`, `saveError`, `canUndo`, `canRedo`, `pendingCommandCount`
  - Methods: `applyCommand`, `undoDraft`, `redoDraft`, `saveDraft`, `discardDraft`
  - Working rows: `workingRows` (with fallback to RQ cache)

**Store Integration:**
- `src/store/useStore.ts`: Draft session slice added (NOT persisted via partialize)
- `src/store/types.ts`: DraftSessionState + DraftSessionActions added to CombinedStore

**Constants:**
- `COMMAND_LIMIT = 30`: Max pending commands before wrapping
- `RECOVERY_STORAGE_KEY = "pending-sys-draft-v1"`: Compact localStorage snapshot
- `WORKSPACE_ID_KEY = "pending-sys-workspace-id"`: Stable browser UUID

---

### Phase 2: Legacy Undo/Redo Removal ✅
**Decoupled old snapshot system:**
- `src/store/slices/undoRedoSlice.ts`: All methods stubbed to no-ops (type signatures preserved for safe deletion in Phase 6)
- `src/store/slices/bookingSlice.ts`: Removed `pushUndo()` calls from `sendToBooking`, `updateBookingStatus`
- `src/store/slices/uiSlice.ts`: Removed `pushUndo()` calls from `addNote`, `updateNote`, `deleteNote`

**Why this works:**
- Old undo/redo was only wired to booking and UI notes (not order mutations)
- New command system will handle all mutations uniformly
- Stubbing allows safe cleanup without breaking existing code

---

### Phase 3: Header UI Integration ✅
**File: `src/components/shared/Header.tsx`**

**Undo/Redo buttons:**
- Replaced 4 old `useAppStore` selectors with single `useDraftSession()` hook
- Button `disabled` states: `!canUndo` / `!canRedo`
- Keyboard shortcuts (Cmd-Z / Cmd-Shift-Z):
  - Guard with `if (saving) return` to prevent undo during save
  - Disabled when `!canUndo` or `!canRedo`

**New UI elements:**
- Save Draft button
  - Visible when `dirty && !saving`
  - Shows `pendingCommandCount` badge (e.g., "Save (3)")
  - Disabled while `saving === true`
  - Shows spinner during save
- Discard button
  - Visible when `dirty && !saving`
  - Clears session, returns to fresh RQ data

---

## Key Design Decisions

### 1. Replay-Based Undo/Redo (Not Inversion)
- `past` and `pendingCommands` always stay in sync
- Working rows derived by replaying all pending commands over baseline
- Avoids state divergence, correct for cross-stage moves

### 2. Lazy Baseline Capture
- Baseline only captured on first `applyCommand()` (not app start)
- When `!isActive`, auto-capture before applying
- Remains isolated from background RQ refetches during active session

### 3. Beast Mode Validation as Pre-Apply Guard
- `moveRows orders→main` validation happens inside `applyCommand`
- On failure: toast error, don't append command
- Also checks partNumber, description, attachment presence

### 4. Mutation Sequencing in saveDraft
- Each pending command executed sequentially (not parallel)
- Uses mutation hooks passed at call time (not stored in Zustand)
- On success: clear session, invalidate touched stages, call `_clearRecovery()`
- On failure: keep all draft state intact for retry

### 5. Storage Architecture
- **Main store**: NOT persisted (no partialize needed)
- **Recovery snapshot**: Compact localStorage only (`{ workspaceId, updatedAt, pendingCommands }`)
- **Workspace ID**: Stable UUID per browser, persisted in localStorage

---

## What's Left (Phases 4-6)

### Phase 4: Page Handler Migrations ✅ COMPLETE
All 5 stages migrated to use `applyCommand`:
- Orders: `useOrdersPageHandlers.ts` ✅
- Main Sheet: inline handlers ✅
- Booking: inline handlers ✅
- Call List: inline handlers ✅
- Archive: inline handlers ✅

Each page now:
- Imports `useDraftSession(stage)`
- Uses `effectiveData = draftWorkingRows || queryData`
- Replaces all mutations with `applyCommand` calls
- Passes working rows to grids for optimistic UI

### Phase 5: End-to-End Recovery Testing
- Manual: Apply 3+ commands, close tab, reopen, verify recovery toast
- Restore path: Recovered commands visible, session dirty, saveable, `past`/`future` empty
- Discard path: Returns to fresh RQ data, localStorage cleared
- 7-day expiry: Old snapshots silently discarded
- Save after restore: Commands execute correctly
- Save failure: Session remains dirty, retry succeeds
- Saving lock: Undo/redo disabled, cells read-only, actions disabled

### Phase 6: Cleanup & Quality Gate
- Delete `src/store/slices/undoRedoSlice.ts`
- Remove `createUndoRedoSlice` from `useStore.ts` and types
- Remove `UndoRedoSnapshot`, `UndoRedoState`, `UndoRedoActions` types
- Search for any remaining `pushUndo` / `undoStack` / `redoStack` references
- Run full quality gate: `lint` → `type-check` → `test` → `build`
- Update `CLAUDE.md` and `ENGINEERING.md`

---

## Testing Status
- **Type Check**: ✅ Passing (0 errors)
- **Unit Tests**: ✅ 357 passing (37 test files)
- **E2E Tests**: ⏳ Ready for Phase 5 manual + Playwright testing

---

## Recovery Flow Example

```
User Action Sequence:
1. Open Orders page (draft inactive)
2. Edit row → applyCommand(patchRow) → baseline captured, command queued, snapshot persisted
3. Move to Main → applyCommand(moveRows) → command queued
4. Close tab (browser crash simulation)
5. Reopen Orders
6. Recovery toast appears: "Restore 2 pending changes or Discard?"
7. Click Restore:
   - Baseline re-captured from current RQ cache
   - pendingCommands replayed
   - past = [...pendingCommands], future = []
   - dirty = true, saveable
8. User sees working view with both changes
9. Click Save Draft:
   - saveDraft() executes commands sequentially
   - On success: session cleared, RQ invalidated, snapshot removed
   - On failure: error message, session intact for retry
```

---

## Files Changed Summary

| Phase | File | Status | Lines |
|---|---|---|---|
| 1 | `src/store/slices/draftSessionSlice.ts` | ✅ NEW | 500+ |
| 1 | `src/hooks/useDraftSession.tsx` | ✅ NEW | 120+ |
| 1 | `src/store/useStore.ts` | ✅ MODIFIED | +15 |
| 1 | `src/store/types.ts` | ✅ MODIFIED | +10 |
| 2 | `src/store/slices/undoRedoSlice.ts` | ✅ MODIFIED | ~20 |
| 2 | `src/store/slices/bookingSlice.ts` | ✅ MODIFIED | -5 |
| 2 | `src/store/slices/uiSlice.ts` | ✅ MODIFIED | -3 |
| 3 | `src/components/shared/Header.tsx` | ✅ MODIFIED | +40 |
| 4a | `src/app/(app)/orders/useOrdersPageHandlers.ts` | ✅ MODIFIED | ~50 |
| 4a | `src/app/(app)/orders/page.tsx` | ✅ MODIFIED | ~10 |
| 4b | `src/app/(app)/main-sheet/page.tsx` | ✅ MODIFIED | ~40 |
| 4c | `src/app/(app)/booking/page.tsx` | ✅ MODIFIED | ~50 |
| 4d | `src/app/(app)/call-list/page.tsx` | ✅ MODIFIED | ~45 |
| 4e | `src/app/(app)/archive/page.tsx` | ✅ MODIFIED | ~40 |

---

## Next Steps
1. **Phase 5**: Run manual recovery tests, add Playwright E2E tests
2. **Phase 6**: Delete legacy code, run full quality gate, update docs
3. **Merge**: Feature branch ready for main after Phase 6 completion
