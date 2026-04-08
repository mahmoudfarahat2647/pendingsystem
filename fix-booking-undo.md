# Fix: Booking from Orders Tab Bypasses Undo/Redo

## Context

When a user books a VIN from the Orders tab and then presses Ctrl+Z, nothing happens — the row stays in Booking and cannot be returned to Orders. This is because `handleConfirmBooking` in the Orders page calls `saveOrderMutation.mutateAsync()` directly, committing the action immediately to Supabase without recording any command in the draft session. Since no entry is added to the `past` array, Ctrl+Z has nothing to undo.

Every other stage-move action on the Orders page (e.g. Send to Call List, Send to Main Sheet) correctly uses `applyCommand()`, which records the action in the draft session and makes it undoable. Booking was the only outlier.

**Expected behavior:** After booking from Orders, the row visually moves to Booking as a pending draft command. Ctrl+S commits it; Ctrl+Z reverses it and returns the row to Orders.

---

## Root Cause

**File:** `src/app/(app)/orders/useOrdersPageHandlers.ts`, lines 272–311

`handleConfirmBooking` calls `saveOrderMutation.mutateAsync()` in a loop — a direct mutation that bypasses `applyCommand()` entirely.

---

## Fix Plan

### Step 1 — Convert `handleConfirmBooking` to use draft commands

**File:** `src/app/(app)/orders/useOrdersPageHandlers.ts`

Replace the `async` direct-mutation loop with `applyCommand()` calls using `patchRow` commands.

**Why `patchRow` (not `moveRows`):**
- `moveRows` executes as `bulkUpdateStage()` on save, which only moves the stage — it does not persist `bookingDate`, `bookingNote`, `bookingStatus`, or `noteHistory`.
- `patchRow` with `sourceStage: "orders"` + `destinationStage: "booking"` executes as `saveOrder({ stage: "booking", sourceStage: "orders", updates: {...} })`, which saves all booking fields and moves the row in one call. This is the correct path.

**Logic:**
- For a single selected row: call `applyCommand({ type: "patchRow", ... })` directly.
- For multiple selected rows: wrap all `patchRow` commands in a `composite` command (so the entire booking batch counts as one undo step). Each row needs its own `patchRow` because `noteHistory` is per-row (each row has a different history to append to).
- `previousValues` stores the row's current booking fields (for record-keeping; undo works by replaying from baseline, not reversing with `previousValues`).
- Gate `setSelectedRows([])` and `toast.success(...)` on the return value of `applyCommand()` (returns `false` on failure, e.g. Beast Mode guard).
- Remove the `async` keyword from the function signature (no more `await`).

**Result after change:**
```typescript
const handleConfirmBooking = (date: string, note: string, status?: string) => {
  // validation (unchanged) ...

  const commands = selectedRows.map((row) => {
    const newNoteHistory = appendTaggedUserNote(
      getEffectiveNoteHistory(row), note, "booking",
    );
    return {
      type: "patchRow" as const,
      id: row.id,
      sourceStage: "orders" as const,
      destinationStage: "booking" as const,
      updates: {
        bookingDate: date,
        bookingNote: note,
        noteHistory: newNoteHistory,
        ...(status ? { bookingStatus: status } : {}),
      },
      previousValues: {
        bookingDate: row.bookingDate,
        bookingNote: row.bookingNote,
        bookingStatus: row.bookingStatus,
        noteHistory: row.noteHistory,
      },
    };
  });

  const cmd: DraftCommand =
    commands.length === 1
      ? commands[0]
      : { type: "composite", label: "Book Orders", children: commands };

  const applied = applyCommand(cmd);
  if (applied) {
    setSelectedRows([]);
    toast.success(`${selectedRows.length} order(s) sent to Booking`);
  }
};
```

### Step 2 — Remove unused `saveOrderMutation` from handlers

`saveOrderMutation` (and its import `useSaveOrderMutation`) are only used in `handleConfirmBooking`. After Step 1, remove:
- Line 9: `useSaveOrderMutation` from the import
- Line 37: `const saveOrderMutation = useSaveOrderMutation();`

### Step 3 — Add `DraftCommand` import

Add `DraftCommand` to the existing import from `@/store/slices/draftSessionSlice` (line 29 already imports `AtomicCommand`).

---

## Files to Change

| File | Change |
|------|--------|
| `src/app/(app)/orders/useOrdersPageHandlers.ts` | Replace `handleConfirmBooking` body; remove `saveOrderMutation`; add `DraftCommand` import |

No other files need changes. The `patchRow` command type, `executeCommand`, and `useDraftSession` already support this path correctly.

---

## Verification

1. Open the Orders tab, select a row with a part number and description.
2. Open the Booking modal, pick a date, confirm.
3. The row should visually move to Booking immediately (draft state — not yet saved to DB).
4. Press **Ctrl+Z** → the row should return to the Orders tab.
5. Re-book the row, then press **Ctrl+S** → the row is committed to Supabase and disappears from Orders.
6. Confirm in the Booking tab that the row appears with the correct date, note, and status.
7. Verify that booking multiple rows at once also undoes as a single step (one Ctrl+Z reverts all).
