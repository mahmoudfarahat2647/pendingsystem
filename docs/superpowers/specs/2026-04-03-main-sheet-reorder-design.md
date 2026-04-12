---
title: Main Sheet Reorder Button — Design Spec
date: 2026-04-03
status: implemented
feature: main-sheet-reorder
type: spec
---

# Main Sheet Reorder Button — Design Spec

## Context

The Archive and Call List stages both have a Reorder action that sends selected rows back to the Orders stage with `status: "Reorder"` and appends a tagged note recording the reason. The Main Sheet stage has no equivalent — operators who discover a problem with an order already on the main sheet must manually work around this gap. This spec adds the identical Reorder flow to the Main Sheet.

## What Changes

### 1. `MainSheetToolbar` — new prop + button

Add one prop `onReorder: () => void` and a new toolbar button using the `RotateCcw` icon (orange tint, disabled when `isLocked || selectedCount === 0`), placed after the Send-to-Call-List button.

### 2. `main-sheet/page.tsx` — state + handler + modal

Add two state variables (`isReorderModalOpen`, `reorderReason`) and `handleConfirmReorder`, mirroring the archive page exactly:

```
for each selectedRow:
  newNoteHistory = appendTaggedUserNote(getEffectiveNoteHistory(row), `Reorder Reason: ${reorderReason}`, "reorder")
  applyCommand({
    type: "patchRow",
    id: row.id,
    sourceStage: "main",
    destinationStage: "orders",
    updates: { noteHistory: newNoteHistory, status: "Reorder" },
    previousValues: {},
  })
reset selectedRows, close modal, clear reason
toast.success(`${count} row(s) sent back to Orders (Reorder)`)
```

Add the Reorder Reason modal dialog (same markup as archive: orange title, Input, Cancel + Confirm buttons, Confirm disabled while reason is empty).

Wire `onReorder={() => setIsReorderModalOpen(true)}` on the `<MainSheetToolbar>` call site.

## What Does NOT Change

- No new mutation hooks — uses existing `applyCommand` / `useDraftSession("main")` path.
- No schema changes.
- No new files — changes are confined to `MainSheetToolbar.tsx` and `main-sheet/page.tsx`.
- The action column composite `valueGetter` is untouched.
- Lock state: button is disabled while the sheet is locked (same as Archive/Delete).

## Files Touched

| File | Change |
|------|--------|
| `src/components/main-sheet/MainSheetToolbar.tsx` | Add `onReorder` prop + `RotateCcw` button |
| `src/app/(app)/main-sheet/page.tsx` | Add state, handler, modal, wire prop |

## Verification

1. Select one or more rows on the Main Sheet → Reorder button becomes active.
2. Click Reorder → modal opens with orange title "Reorder - Reason Required".
3. Confirm button disabled until reason typed.
4. After confirm → rows disappear from Main Sheet grid, appear in Orders with `status: "Reorder"` and note history updated.
5. Toast shows correct count.
6. Undo (draft session) reverses the move.
7. Sheet locked → Reorder button disabled.
8. No rows selected → Reorder button disabled.
