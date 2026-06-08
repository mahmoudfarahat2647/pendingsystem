# Plan: "Permission" tab — gate direct grid editing on non-Orders stages

## Context

Add a new **Permission** tab in the Settings modal with a single toggle that controls whether grid
cells can be edited directly on every workflow stage **except Orders** (Main Sheet, Call List,
Booking, Archive).

**Current behavior / the bug:** On these four stages the grid cells are technically editable, but
each page's `onCellValueChanged` only records a draft command for `rDate` (plus `status` on
Main Sheet). Editing **any other field** (customer name, VIN, mobile, part number, description, …)
changes the cell visually but records **no draft command** — so the global **Save** button never
activates and the edit is silently discarded on refresh (the grid re-renders from the React Query
cache).

**Desired outcome:**
- **Toggle ON** → any field on the four non-Orders stages is editable, and editing records a draft
  command so the **Save** button appears and the edit persists on save.
- **Toggle OFF** → grids are fully read-only (copy/Ctrl+C still works); no inline edits, no Save
  button. This is the default.
- **Orders stage is untouched** in all cases.

Decisions confirmed with the user: OFF = fully read-only (copy only); the Permission tab is gated
behind the existing Settings password lock like the other tabs.

## Key existing pieces to reuse (do not reinvent)

- `handleUpdateOrder(id, updates)` already exists in each stage page and **already builds the correct
  draft `patchRow` command** via `applyCommand` (see `src/app/(app)/main-sheet/page.tsx:81-94`,
  `src/app/(app)/booking/page.tsx:99-112`). The generic handler just needs to call it for any
  changed field.
- `readOnly` prop on `DataGrid` already disables all editing and is honored by the column factory
  (`src/components/grid/DataGrid.tsx:248-260`). Copy/selection stays enabled
  (`enableCellTextSelection: true` + the Ctrl+C handler), so OFF = "copy only" is satisfied for free.
- `Switch` UI component exists at `src/components/ui/switch.tsx`.
- `isLocked` lock pattern + tab structure in `src/components/shared/SettingsModal.tsx`.
- The global **Save** button is driven by the draft session `dirty`/`pendingCommandCount`, so any
  `applyCommand` automatically lights it up (no Header changes needed).

## Changes

### 1. Store: add a persisted permission flag

- `src/store/types.ts`: add `gridEditPermission: boolean` to `UIState` (near `isLocked`, ~L81) and
  `setGridEditPermission: (value: boolean) => void` to `UIActions` (near `setIsLocked`, ~L100).
- `src/store/slices/uiSlice.ts`: add `gridEditPermission: false` to `initialState`; add the
  `setGridEditPermission: (gridEditPermission) => set({ gridEditPermission })` action.
- `src/store/useStore.ts`: add `gridEditPermission: state.gridEditPermission` to the `partialize`
  object (~L48-57) so the choice persists across refresh.

### 2. New Permission tab component

- New file `src/components/shared/settings/PermissionTab.tsx`. Mirrors the structure/styling of the
  existing tabs (e.g. `PartStatusTab`). Accepts `isLocked: boolean`. Renders a labeled `Switch` bound
  to `gridEditPermission` / `setGridEditPermission` (selector-based `useAppStore`). When `isLocked`,
  disable the switch and show the same "locked" affordance the other tabs use. Include a short
  description that edits apply to all stages except Orders and require clicking Save to persist.

### 3. Wire the tab into the Settings modal

- `src/components/shared/SettingsModal.tsx`:
  - Extend `TabType` with `"permission"`.
  - Add a `navItems` entry (`id: "permission"`, label e.g. "Permission", a lucide icon such as
    `KeyRound`/`PencilLine`).
  - Add the header title/subtitle branch for the new tab.
  - Render `<PermissionTab isLocked={isLocked} />` in the content area.

### 4. Gate the four non-Orders stage grids

For each of: `src/app/(app)/main-sheet/page.tsx`, `src/app/(app)/call-list/page.tsx`,
`src/app/(app)/booking/page.tsx`, `src/app/(app)/archive/page.tsx`:

- Add a selector: `const gridEditPermission = useAppStore((s) => s.gridEditPermission);`
- Change the grid `readOnly` prop to also require permission:
  - Booking/Call List/Archive: `readOnly={!gridEditPermission || draftSaving}`
  - Main Sheet: `readOnly={!gridEditPermission || isSheetLocked || draftSaving}`
- Extend `onCellValueChanged` so that, **after** the existing special-case branches (Main Sheet's
  `status` auto-move-to-Call-List logic and the `rDate` validation branch), any other changed field
  records a draft command via the existing helper:

  ```ts
  const field = params.colDef.field;
  if (field && field !== "rDate" && field !== "status"
      && params.newValue !== params.oldValue) {
    await handleUpdateOrder(params.data.id, { [field]: params.newValue });
  }
  ```

  (Keep the existing `rDate` branch as-is so its date validation is preserved; keep Main Sheet's
  `status` branch as-is for the auto-move workflow.) Because the grid is read-only when the toggle is
  OFF, this handler only ever fires when editing is permitted.

**Orders stage:** no changes — `src/app/(app)/orders/page.tsx` keeps `readOnly={draftSaving}` and its
existing handler.

## Out of scope / explicitly unchanged

- No Header changes — the Save button already reacts to draft `dirty` state.
- No change to how saving works (`saveDraft()` already persists `patchRow` commands).
- `status` column stays `editable: false` in `GridConfig`; the Permission toggle does not make the
  status badge inline-editable.

## Verification

1. `npm run type-check` and `npm run lint` — must pass on all changed files.
2. Manual (dev server, `npm run dev`):
   - Open Settings → unlock with password → open the new **Permission** tab; confirm the toggle is
     OFF by default and disabled while locked.
   - With toggle **OFF**: on Main Sheet / Call List / Booking / Archive, confirm cells cannot be
     edited (double-click does nothing) but Ctrl+C / cell selection still copies. Confirm the Orders
     grid is unaffected.
   - With toggle **ON**: edit a non-Orders field (e.g. customer name on Call List). Confirm the
     global **Save** button activates (pending-command badge increments). Click **Save**, then
     refresh — the edit persists.
   - Toggle back OFF and refresh — confirm the OFF state persisted (read-only again).
3. After implementation, update the vault: patch `docs/features/settings.md` (new tab) and note the
   permission-gated editing behavior in `docs/features/data-grid.md`.
