# Fix: Unbounded Supabase selects — silent row truncation

## Context

`CODE_REVIEW_FINDINGS.md` finding #1 (High). Both read paths in
`src/services/order/orderQueryRepository.ts` issue `.select(...)` with **no
`.range()`/`.limit()`**:

- `getOrders(stage?)` — feeds every stage grid (via `useOrdersQuery`) and the
  warranty maintenance scan.
- `getDashboardStats()` — feeds `useDashboardStatsQuery` (counts across all stages).

Supabase/PostgREST caps rows per response (default max **1000**). Once any stage
crosses that cap, results are **silently truncated with no error**: grids drop
orders, dashboard stats undercount, and
`warrantyMaintenanceService.archiveExpiredWarranties`
(`src/services/warrantyMaintenanceService.ts`) never sees — so never archives —
rows past the cap. `orders` is the single table for all five stages and `archive`
only grows, so this is a matter of time, not an edge case.

**Intended outcome:** both methods return the complete result set regardless of
row count, with no behavior change below the cap.

## Approach

Fetch **all** pages via a `.range()` loop. An explicit `.limit()` + count check
is rejected: it would only *detect* truncation, still leaving grids and the
warranty scan without the missing rows. Correctness requires returning every row.

All changes are confined to `src/services/order/orderQueryRepository.ts` plus its
test file — no caller, hook, or type changes (both methods keep their current
return shape: an array or `null`).

### 1. Add a module-local pagination helper

In `orderQueryRepository.ts`, add a generic fetch-all helper (page size 1000 =
PostgREST default max). It takes a page-builder factory so it can be reused for
both the with-attachments and fallback selects, and for dashboard stats:

```ts
const SUPABASE_MAX_ROWS = 1000;

async function fetchAllPages<T>(
  buildPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>,
): Promise<{ data: T[] | null; error: PostgrestError | null }> {
  const rows: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await buildPage(from, from + SUPABASE_MAX_ROWS - 1);
    if (error) return { data: null, error };
    const page = data ?? [];
    rows.push(...page);
    if (page.length < SUPABASE_MAX_ROWS) break;
    from += SUPABASE_MAX_ROWS;
  }
  return { data: rows, error: null };
}
```

Import `PostgrestError` as a type from `@supabase/supabase-js`.

### 2. Rework `getOrders` (lines 24–51)

Build each page with a factory that applies the stage filter, ordering, and
`.range(from, to)`, then drive it through `fetchAllPages`. Preserve the existing
missing-attachment-column fallback by running a second `fetchAllPages` with
`ORDERS_SELECT_BASE`:

```ts
const makePage = (select: string) => (from: number, to: number) => {
  let q = db.from("orders").select(select);
  if (stage) q = q.eq("stage", stage);
  return q
    .order("created_at", { ascending: false })
    .order("id", { ascending: true }) // deterministic tiebreak — see note
    .range(from, to);
};

const { data, error } = await fetchAllPages(makePage(ORDERS_SELECT_WITH_ATTACHMENTS));
if (error && isMissingAttachmentColumnError(error)) {
  const { data: fb, error: fbErr } = await fetchAllPages(makePage(ORDERS_SELECT_BASE));
  if (fbErr) handleSupabaseError(fbErr);
  return fb;
}
if (error) handleSupabaseError(error);
return data;
```

### 3. Rework `getDashboardStats` (lines 69–73)

```ts
const { data, error } = await fetchAllPages<{ id: string; vin: string | null; stage: string | null }>(
  (from, to) => db.from("orders").select("id, vin, stage").order("id").range(from, to),
);
if (error) handleSupabaseError(error);
return data;
```

### Out of scope

- `checkHistoricalVinPartDuplicate` / `checkHistoricalDescriptionConflict`
  `.limit(100)` scans (lines 100, 148) — that is a **separate** finding (#15) and
  is not touched here.

### Note on ordering (Refactor Safety Rule)

A secondary `.order("id")` is added so pages don't skip/duplicate rows when
`created_at` values tie at a page boundary — this is **required** for pagination
correctness, not a cosmetic change. It only fixes the tie-break within an
already-non-deterministic ordering; observable results below the cap are
unchanged. `getDashboardStats` gains an `.order("id")` where it previously had
none (needed for stable pagination; the result set is used for unordered counting,
so no UI impact). No other business logic or UI changes.

## Tests

File: `src/test/orderService.test.ts`. The mock chains currently terminate on
`.eq` / `.order`; the terminal call is now `.range`, so:

**Update existing tests** to resolve on `.range` (chain:
`select → [eq] → order → order → range`):
- "should fetch orders for a specific stage"
- "should fallback to legacy select when attachment columns are missing"
- "createOrderRepository – injected client › calls db.from('orders')…"

Each returns fewer than 1000 rows, so the loop terminates after one page — assert
the returned data is unchanged.

**Add new tests:**
- `getOrders` paginates: `.range` resolves a full 1000-row page first, then a
  short page → assert the concatenated result contains all rows and `.range` was
  called with the expected `(0,999)` then `(1000,…)` windows.
- `getDashboardStats` paginates the same way.
- (Optional) error on the first page short-circuits and routes through
  `handleSupabaseError`.

## Execution Workflow

1. **Branch:** `git checkout -b fix/unbounded-supabase-selects` off `main`.
2. **Draft PR now:** commit this plan doc, push, and open a **draft** PR
   (`gh pr create --draft`) describing finding #1 and the intended fix.
3. **Implement (Sonnet 5 subagent):** spawn a `general-purpose` agent with
   `model: sonnet` to implement the code + test changes below on the branch,
   commit, and push. It works strictly within the scope of this plan.
4. **Review (Opus, in-session):** review the subagent's diff for adherence to the
   plan and the Refactor Safety / Architecture rules, then run the quality gates.
5. **Ready:** once gates pass, `gh pr ready` to mark the PR ready for review.

## Verification

1. `npm run type-check` — must pass (watch the `PostgrestError` import and the
   `let q` builder-reassignment typing).
2. `npm run lint` — must pass on the two changed files.
3. `npm run test -- orderService` — updated + new pagination tests pass.
4. Manual/DB sanity (optional, via Supabase MCP): confirm a stage with >1000 rows
   now returns the full count. If no stage currently exceeds 1000, the unit tests
   are the authoritative check; below the cap behavior is provably unchanged
   (single-page loop returns the same array as before).
