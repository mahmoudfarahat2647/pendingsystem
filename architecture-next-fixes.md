# Architecture Audit — Next Fixes Plan

## Context

H1, H3, and H5 are done. Remaining issues span High/Medium/Low severity. This plan identifies the highest-leverage fixes that can be bundled into a single PR without touching structural concerns (H2/H4 which require domain-layer extraction and are separate projects).

**Confirmed remaining issues (from live codebase scan):**

| ID | Description | Complexity |
|----|-------------|------------|
| H6 | 5 operational arrays still in both RQ and Zustand | Medium |
| M3 | UI hooks call orderService directly, bypassing RQ | Medium |
| M4 | mapSupabaseOrder returns null silently | Medium |
| L2 | 3 back-compat re-exports in useOrdersQuery.ts | Low |
| L5 | PendingRow.stage typed as `z.string()` not `z.enum()` | Low |

H2 (domain layer) and H4 (god module split) are left for a future structural PR.

---

## Recommendation: Bundle 1 (this PR)

Fix **L5 + M4 + L2** together — all low-to-medium, all in the schema/service boundary, zero risk to data flow or UI.

Then, as a second PR: **M3** (wrap duplicate checks in React Query).

H6 is next after that — it requires migrating `useOrderValidation` away from the 5 Zustand arrays, which is more involved.

---

## Bundle 1 Implementation Steps

### Step 1 — L5: Fix `stage` field type in schema

**File:** `src/schemas/order.schema.ts` (line 143)

Change:
```ts
stage: z.string().optional(),
```
To:
```ts
stage: z.enum(["orders", "main", "call", "booking", "archive"]).optional(),
```

- `OrderStage` is already exported from `src/services/orderService.ts:14` as a TS type; the schema should define the source-of-truth Zod enum and the TS type should be inferred from it.
- After this change, run `npm run type-check` — any place that passes an arbitrary string to `row.stage` will become a compile error (surfacing hidden bugs).

---

### Step 2 — M4: Replace silent null return in mapSupabaseOrder

**File:** `src/services/orderService.ts` (lines 569–582)

Current behavior:
```ts
if (!parseResult.success) {
  console.warn("[orderService.mapSupabaseOrder] validation_failed", {...});
  return null; // silent data loss
}
```

Change to throw a typed error:
```ts
if (!parseResult.success) {
  throw new Error(
    `[orderService] Row mapping failed for id=${row.id}: ${parseResult.error.message}`
  );
}
```

**Update callers** to remove now-unnecessary null filters:

1. `src/hooks/queries/useOrdersQuery.ts:14–18` — remove `.filter((row): row is PendingRow => row !== null)`
2. `src/services/orderService.ts:117–125` — remove the `.filter()` for null rows

> ⚠️ RESTRICTED RULE notice: This changes error behavior (silent drop → thrown error). Invalid rows from Supabase that were previously silently skipped will now throw. The `useOrdersQuery` wraps in React Query's `queryFn`, so thrown errors will surface as query errors (not crashes). This is intentional and strictly better — silent data loss is worse than a visible error.

---

### Step 3 — L2: Remove back-compat re-exports

**File:** `src/hooks/queries/useOrdersQuery.ts` (lines 26–29)

Remove these lines:
```ts
export { useBulkDeleteOrdersMutation } from "./useBulkDeleteOrdersMutation";
export { useBulkUpdateOrderStageMutation } from "./useBulkUpdateOrderStageMutation";
export { useSaveOrderMutation } from "./useSaveOrderMutation";
```

Then grep for any file that imports these from `useOrdersQuery` and update to import from the canonical path:
- `useBulkDeleteOrdersMutation` → `@/hooks/queries/useBulkDeleteOrdersMutation`
- `useBulkUpdateOrderStageMutation` → `@/hooks/queries/useBulkUpdateOrderStageMutation`
- `useSaveOrderMutation` → `@/hooks/queries/useSaveOrderMutation`

---

## Bundle 2 (next PR) — M3: Wrap duplicate checks in React Query

**Files:**
- `src/components/orders/form/hooks/useOrderForm/useOrderSubmit.ts:4,120`
- `src/components/orders/form/hooks/useOrderForm/useOrderValidation.ts:10,134`

Both hooks call `orderService.checkHistoricalVinPartDuplicate()` directly, bypassing React Query (no caching, no deduplication).

Plan:
1. Create `src/hooks/queries/useHistoricalDuplicateQuery.ts` wrapping the check in `useQuery` with `enabled: !!vin && !!partNumber`.
2. Update `useOrderSubmit` and `useOrderValidation` to use the hook instead of the direct service call.
3. Remove the direct `orderService` import from both files.

---

## Bundle 3 (future PR) — H6: Remove Zustand operational arrays

Still active: `ordersRowData`, `rowData`, `callRowData`, `bookingRowData`, `archiveRowData` in `src/store/types.ts` + written by `updateOrder/updateOrders/deleteOrders` in `src/store/slices/ordersSlice.ts`.

`useOrderValidation.ts:29–33` reads all 5 arrays from Zustand for cross-stage duplicate detection.

Fix path:
1. Create `useAllStagesData()` hook using `useQueries` across the 5 stage query keys.
2. Refactor `useOrderValidation` to accept the aggregated rows from the new hook instead of Zustand.
3. Verify `updateOrder/updateOrders/deleteOrders` have no other callers, then remove them.
4. Remove the 5 array fields from `StoreState` in `src/store/types.ts`.

This is scoped but touches many files — deserves its own PR.

---

## Verification (after Bundle 1)

```bash
npm run type-check   # must pass — L5 fix surfaces any stage string mismatches
npm run lint         # must pass cleanly
npm run test         # must pass cleanly
```

Key things to confirm:
- `PendingRowSchema.stage` now rejects arbitrary strings at parse time
- `mapSupabaseOrder` throws instead of returning null; query error boundaries catch it
- No file imports the 3 mutations from `useOrdersQuery` anymore
