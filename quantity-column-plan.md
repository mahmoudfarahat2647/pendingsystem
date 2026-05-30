# Plan: Add a Quantity field/column to all stages

## Context

Orders are made of parts. Each part (`PartEntry`) currently holds only `partNumber` and
`description`, and the app renders **one grid row per part** across all five stages
(orders → main → call → booking → archive). Users have no way to record *how many* of a
part is needed, and historically encoded counts inside the description text (e.g.
`"2 شدادات امامى"`).

This change adds a per-part **quantity**:
- New numeric field in the entry form, placed **before** part number → arrangement
  `qty | part number | part description`, default `1`.
- New **display-only** `QUANTITY` column on every stage grid (one base column reaches all
  five tabs).
- A one-time data migration that backfills existing rows: default quantity `1`, but when a
  description **begins** with a number, move that number into quantity and strip it from the
  description.

### Decisions (confirmed with user)
1. **Extraction rule:** *leading number only* — only a number at the very start of the
   description (`^\d+` followed by whitespace) becomes the quantity; numbers elsewhere
   (sizes/specs like `زيت 5 لتر`) are left untouched.
2. **Type:** integer (`number`).
3. **Grid behavior:** quantity is **display-only** in grids; the entry form is the edit path.

## Existing patterns reused
- Per-part schema: `PartEntrySchema` in [order.schema.ts:10-15](src/schemas/order.schema.ts#L10-L15).
- Auto-sync of `parts[0]` → top-level fields: `pendingRowTransform` in [order.schema.ts:146-154](src/schemas/order.schema.ts#L146-L154).
- Shared grid columns feeding all five stages: `getBaseColumns()` in [GridConfig.tsx](src/components/shared/GridConfig.tsx) (part number/description at lines 138-149).
- Per-column non-editability honored by [DataGrid.tsx:248-260](src/components/grid/DataGrid.tsx#L248-L260) only when `editable: false` is set explicitly.
- JSONB `metadata->'parts'` migration pattern: `supabase/migrations/20260525_standardize_part_descriptions.sql`.
- `@/types` re-exports `PartEntry` from the schema ([types/index.ts:1-3](src/types/index.ts#L1-L3)) — schema change propagates automatically.

---

## Changes by layer

### 1. Schema — [src/schemas/order.schema.ts](src/schemas/order.schema.ts)
- Add to `PartEntrySchema` (line 10-15):
  `quantity: z.number().int().positive().default(1)`.
  The `.default(1)` makes every existing stored part read back as `1` even before the
  migration runs — so no separate "set everything to 1" backfill is needed.
- Add a top-level legacy/sync field to `PendingRowBaseObject` (near lines 100-101, beside
  the legacy `partNumber`/`description`): `quantity: z.number().int().positive().optional()`.
- Extend `pendingRowTransform` (lines 146-154) to derive the grid-facing value:
  `quantity: firstPart?.quantity ?? data.quantity ?? 1`.
  This mirrors how `partNumber`/`description` are synced from `parts[0]`, so the grid's
  `field: "quantity"` resolves correctly.

No mapper change required — `mapSupabaseOrder` spreads `metadata` and parses through
`PersistedOrderRowSchema`, which now carries the quantity default + transform.

### 2. Form state — [useOrderParts.ts](src/components/orders/form/hooks/useOrderForm/useOrderParts.ts)
- Default new/placeholder part rows with `quantity: 1` (lines 8 and 15).
- Add a dedicated numeric handler so the integer type stays clean (the existing
  `handlePartChange` is typed `value: string`):
  `handlePartQuantityChange(id, value: number)` that sets `quantity` (coerce to an integer
  `≥ 1`, fall back to `1` on empty/NaN). Return it from the hook and thread it through
  `useOrderForm` to `PartsSection`.

### 3. Form UI — [PartsSection.tsx](src/components/orders/form/PartsSection.tsx)
- In the per-part row (lines 214-280), insert a small numeric `Input` **before** the part
  number input (fixed narrow width, e.g. `w-14`), so the row reads `qty | REF# | Description`.
  - `type="number"`, `min={1}`, `value={part.quantity ?? 1}`, `onChange` → parse to int and
    call `handlePartQuantityChange(part.id, n)`.
  - Match existing input styling (`h-8 text-[10px] rounded-lg`, `focusColor`).
- Add a new prop `onQuantityChange` to `PartsSectionProps` and wire from `OrderFormModal`.
- **Bulk import** (lines 74-98) unchanged: imported parts simply default `quantity: 1`
  (schema default). Do not parse a qty column from pasted text.

### 4. Save flow — [useOrdersPageHandlers.ts](src/app/(app)/orders/useOrdersPageHandlers.ts)
- `handleSaveOrder` already passes `parts: [part]`; `part` now carries `quantity`.
- Also set top-level `quantity: part.quantity` on the created/patched row object (alongside
  the existing top-level `partNumber`/`description` it already sets), so the optimistic cache
  row shows the right value before the server round-trip re-applies the transform.

### 5. Grid column — [GridConfig.tsx](src/components/shared/GridConfig.tsx)
- In `getBaseColumns()`, insert a new column **immediately before** PART NUMBER (line 138):
  ```
  { headerName: "QTY", field: "quantity", filter: "agNumberColumnFilter",
    width: 80, editable: false }
  ```
- Because all five stage column builders spread `getBaseColumns()`, the column appears on
  every tab in the `qty | part number | description` order. `editable: false` keeps it
  display-only (DataGrid honors explicit `false`). Existing saved layouts are unaffected; the
  new column appears with its default position/width for current users.

### 6. Data migration — `supabase/migrations/20260530_add_quantity_to_parts.sql` (new)
Follow the `jsonb_set` / `jsonb_agg` pattern from the 20260525 migration. For each order,
rebuild `metadata->'parts'`: for any part whose `description` matches `^\d+\s+`, set
`quantity` to the leading integer and strip the `^\d+\s+` prefix from `description`;
otherwise leave the part as-is (schema default supplies `1`). Also refresh the top-level
`metadata->>'description'` from the (possibly stripped) `parts[0].description` to keep it
consistent with the grid/SQL view.

Key SQL pieces:
- Match: `part->>'description' ~ '^\d+\s'`
- Quantity: `(regexp_match(part->>'description', '^(\d+)'))[1]::int`
- Stripped desc: `regexp_replace(part->>'description', '^\d+\s+', '')`

Edge: a description that is *only* a number (e.g. `"2"` with no trailing text) does **not**
match `^\d+\s` and is left unchanged (quantity stays the default `1`) — intentionally safe.

Run against Supabase via the project's migration flow (the same way 20260525 was applied).

---

## Out of scope / unchanged
- `BeastModeSchema` / `OrderFormSchema` — quantity always has a valid default (`≥1`), so no
  new required-field validation.
- Grid inline editing / draft-session command for quantity (form-only per decision).
- Bulk-paste quantity parsing.

## Files to touch
- `src/schemas/order.schema.ts` (field + top-level sync + transform)
- `src/components/orders/form/hooks/useOrderForm/useOrderParts.ts` (default + handler)
- `src/components/orders/form/hooks/useOrderForm/*` orchestrator + `OrderFormModal.tsx` (thread handler/prop)
- `src/components/orders/form/PartsSection.tsx` (qty input + prop)
- `src/app/(app)/orders/useOrdersPageHandlers.ts` (top-level quantity on save)
- `src/components/shared/GridConfig.tsx` (base column)
- `supabase/migrations/20260530_add_quantity_to_parts.sql` (new)

## Verification
1. `npm run type-check` and `npm run lint` on changed files — both clean.
2. **Form:** open the entry form → each part row shows `qty | REF# | Description`, qty
   defaults to `1`, accepts integers, persists on save.
3. **Grids:** the `QTY` column appears on all five tabs, shows each part's quantity, is not
   editable, and numeric filter works. Confirm a previously-saved layout still loads.
4. **Migration (on a copy / verify via Supabase MCP first):** rows like `"2 شدادات امامى"`
   become `quantity = 2`, `description = "شدادات امامى"`; rows like `"زيت 5 لتر"` keep
   `quantity = 1` and full description; rows with no leading number show `quantity = 1`.
   Spot-check `metadata->'parts'` and top-level `metadata->>'description'` for a few orders.
5. Round-trip: edit a quantity in the form, save, reload — grid reflects the new value.
