# Plan: Customizable Request Date (`rDate`)

## Context

The `rDate` (R/DATE) field on every order is currently hardcoded to `new Date()` at creation time and is not editable anywhere — not in the form and not in the grid. Users who enter backdated orders cannot set the correct request date, so orders always land on the Main Sheet with today's date instead of the actual request date.

**Goal:** Make `rDate` settable in the Order Form (where the "Core Identity" label currently sits) and editable inline in the grid across all five stage tabs.

---

## Files to Modify

1. `src/components/orders/form/types.ts`
2. `src/components/orders/form/hooks/useOrderForm/orderFormUtils.ts`
3. `src/components/orders/form/IdentityFields.tsx`
4. `src/app/(app)/orders/useOrdersPageHandlers.ts`
5. `src/components/shared/GridConfig.tsx`
6. `src/app/(app)/orders/page.tsx`
7. `src/app/(app)/main-sheet/page.tsx`
8. `src/app/(app)/call-list/page.tsx`
9. `src/app/(app)/booking/page.tsx`
10. `src/app/(app)/archive/page.tsx`

---

## Steps

### Step 1 — Add `rDate` to `FormData` type
**File:** `src/components/orders/form/types.ts`

Add `rDate: string` to the `FormData` interface. This is required so the form can carry and submit the date.

```ts
export interface FormData {
  // ... existing fields ...
  rDate: string;
}
```

---

### Step 2 — Initialize `rDate` in form utilities
**File:** `src/components/orders/form/hooks/useOrderForm/orderFormUtils.ts`

- `buildEmptyFormData()`: add `rDate: new Date().toISOString().split("T")[0]` (today as default for new orders)
- `buildInitialFormData(first)`: add `rDate: first.rDate || new Date().toISOString().split("T")[0]` (use existing row's date when editing, fall back to today)

---

### Step 3 — Replace "Core Identity" label with shadcn date picker
**File:** `src/components/orders/form/IdentityFields.tsx`

**Current code (lines 74–79):**
```tsx
<div className="flex items-center gap-2">
  <User className="h-3 w-3 text-slate-500" />
  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
    Core Identity
  </h3>
</div>
```

**Replace with** a compact shadcn date picker using `Popover` + `Calendar` + `Button` (all already installed):
- Import `Popover`, `PopoverContent`, `PopoverTrigger` from `@/components/ui/popover`
- Import `Calendar` from `@/components/ui/calendar`
- Import `CalendarIcon` from `lucide-react`
- Remove the `User` import (no longer used in this slot)
- The trigger button shows the selected date formatted as `dd/MM/yyyy` (or "R/DATE" placeholder if empty)
- On day select: call `onFieldChange({ rDate: format(date, "yyyy-MM-dd") })` and close the popover
- Style the trigger to match the existing compact header row (h-6, small text, muted colors matching the section aesthetic)

The bulk-import `FileSpreadsheet` button on the right of the header row stays untouched.

---

### Step 4 — Use `formData.rDate` in order handlers (fix the bug)
**File:** `src/app/(app)/orders/useOrdersPageHandlers.ts`

Two places currently hardcode `rDate: new Date().toISOString().split("T")[0]`:

- **Line ~179** (edit path — adding a new part row): replace with `rDate: formData.rDate`
- **Line ~222** (create path — new order rows): replace with `rDate: formData.rDate`

This is the core bug fix — the form-submitted date is now used instead of the current system date.

---

### Step 5 — Make `rDate` editable in the grid
**File:** `src/components/shared/GridConfig.tsx`

**Current definition (lines 63–67):**
```ts
{
  headerName: "R/DATE",
  field: "rDate",
  width: 100,
},
```

**Replace with:**
```ts
{
  headerName: "R/DATE",
  field: "rDate",
  width: 100,
  editable: true,
  cellEditor: "agTextCellEditor",
},
```

This is shared across all stage grids, so inline editing is enabled everywhere automatically.

---

### Step 6 — Handle `rDate` cell edits in `orders/page.tsx`
**File:** `src/app/(app)/orders/page.tsx`

The existing `onCellValueChanged` handler already handles `partStatus`. Add an `else if` branch:

```ts
} else if (
  params.colDef.field === "rDate" &&
  params.newValue !== params.oldValue
) {
  await handleUpdateOrder(params.data.id, { rDate: params.newValue });
}
```

---

### Step 7 — Handle `rDate` cell edits in `main-sheet/page.tsx`
**File:** `src/app/(app)/main-sheet/page.tsx`

Same pattern as Step 6 — add the `rDate` branch to the existing `onCellValueChanged` handler.

---

### Steps 8–10 — Add `onCellValueChanged` to call-list, booking, archive pages
**Files:** `call-list/page.tsx`, `booking/page.tsx`, `archive/page.tsx`

These pages have `handleUpdateOrder` defined but no `onCellValueChanged` prop on their `DataGrid`. Add the prop with `rDate` handling only:

```tsx
onCellValueChanged={async (params) => {
  if (
    params.colDef.field === "rDate" &&
    params.newValue !== params.oldValue
  ) {
    await handleUpdateOrder(params.data.id, { rDate: params.newValue });
  }
}}
```

Find the `<DataGrid` component in each page and add this prop.

---

## What Does NOT Change

- `BeastModeSchema` — `rDate` is not a Beast Mode required field; no schema changes
- `draftSessionSlice` — `patchRow` command already handles arbitrary field updates; no changes needed
- `useBulkUpdateOrderStageMutation` — moves only update `stage`; `rDate` carries through correctly on the row
- All other form fields, validation logic, and UI layout below the header row

---

## Verification

1. **New order:** Open "New Logistics Request" form → R/DATE field shows today by default in the header row. Change to a past date. Publish → order appears in Orders grid with the selected date.
2. **Commit to Main Sheet:** Select the order → commit to Main Sheet → verify the order in Main Sheet shows the custom date, not today.
3. **Edit existing order:** Open edit form for an existing order → R/DATE shows the order's existing date. Change it → publish → verify grid updates.
4. **Inline grid edit (all tabs):** Click an `R/DATE` cell in Orders, Main Sheet, Call List, Booking, Archive → type a new date → press Enter → verify the cell updates and persists after save draft.
