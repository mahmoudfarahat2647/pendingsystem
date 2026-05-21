# H1 Fix Plan — Decouple Zustand store from React Query

> Audit reference: `architecture-audit.md` finding **H1** — `draftSessionSlice.ts`
> and `notificationSlice.ts` import `queryClient` and reach into the React Query
> cache directly, inverting the dependency direction (state → framework).

This plan was approved before implementation began. Implementation proceeds in
small, verifiable commits on `fix/h1-decouple-store-from-react-query`.

## Goal

Remove all `@/lib/queryClient` cache reads and invalidations from
`src/store/slices/draftSessionSlice.ts` and
`src/store/slices/notificationSlice.ts`. The store no longer depends on React
Query; instead, a thin adapter is registered by the React Query provider at
boot. Zero behavior change.

## Coupling sites being removed

### `src/store/slices/draftSessionSlice.ts`
| Line | Site | Purpose |
|------|------|---------|
| 4-8  | `import { getOrdersQueryKey, ORDER_STAGES, queryClient } from "@/lib/queryClient"` | The bad import |
| 212  | `queryClient.getQueryData(...)` in `_captureBaseline` | Reads RQ cache to snapshot the 5 stages |
| 490  | `queryClient.invalidateQueries(...)` in `saveDraft` | Refresh RQ after successful save |
| 512  | Same in `discardDraft` | Refresh RQ after discard |
| 549  | `queryClient.getQueryData(...)` in `getWorkingRows` | Fallback to RQ when no draft active |

### `src/store/slices/notificationSlice.ts`
| Line | Site | Purpose |
|------|------|---------|
| 3-5  | `import { getOrdersByStageFromCache, isStageCacheLoaded } from "@/lib/queryClient"` | Bad import (transitive) |
| 98-122 | 4× `getOrdersByStageFromCache(stage)` + 4× `isStageCacheLoaded(stage)` | Reads RQ cache for reminder/warranty computation |

### Out of scope
- `src/components/shared/Sidebar.tsx` keeps using `getOrdersByStageFromCache`
  — Sidebar is a React component (outer layer); calling RQ from a component
  is fine.
- `src/lib/queryClient.ts` keeps its helpers; only the store stops using them.

## Approach: Registered Port

A new file `src/store/ordersQueryAdapter.ts` defines the port interface and
a module-local registration slot. `QueryProvider` registers a React-Query-backed
adapter at module-load time. The slices read from the registered adapter via
`getOrdersQueryAdapter()`. The default is a no-op adapter (preserves SSR and
pre-boot behavior — `getQueryData` already returns `undefined` in those
contexts).

### Why not pass adapter as a method argument
That would touch every public method signature (`applyCommand`, `discardDraft`,
`restoreFromRecovery`, `getWorkingRows`, `checkNotifications`) and ~15 call
sites in pages and hooks. Too invasive for a pure architecture fix.

### Why not put adapter in store state
Adapters aren't JSON-serializable. Would break the `persist` middleware.

## Implementation commits (planned order)

Each commit must independently pass `npm run lint` and `npm run type-check`.

1. **Add adapter port** — new file `src/store/ordersQueryAdapter.ts`. No
   callers yet. Type-check passes. No behavior change.
2. **Wire adapter from QueryProvider** — `QueryProvider.tsx` calls
   `setOrdersQueryAdapter(createReactQueryAdapter(queryClient))` at module
   load. Adapter exists but no slice consumes it yet. No behavior change.
3. **Wire adapter into Vitest setup** — `src/test/setup.ts` registers the
   same adapter (against the same `queryClient` singleton) so seeded test
   data is visible through the adapter. No behavior change to tests.
4. **Migrate `draftSessionSlice.ts`** — replace 4 cache calls + 1 import.
   Run `npm run test src/test/draftSessionSlice.test.ts` — must pass green.
5. **Migrate `notificationSlice.ts`** — replace 8 cache calls + 1 import.
   Run `npm run test src/test/notificationSlice.test.ts` and
   `Header.notificationPolling.test.tsx` — must pass green.
6. **Final verification** — full `npm run lint`, `npm run type-check`,
   `npm run test`, grep proof that `src/store/` has no `@/lib/queryClient`
   imports (only `ORDER_STAGES` const is allowed).

## Refactor Safety Rule audit (CLAUDE.md mandatory)

> ⚠️ This refactor touches store internals. Observable behavior must remain
> identical.

| Concern | Status |
|---------|--------|
| Business logic | Unchanged. Same `_captureBaseline` data, same invalidation set, same `getWorkingRows` fallback, same `checkNotifications` rules |
| UI | Untouched. No component / page / hook / styling file modified beyond `QueryProvider.tsx` (whose JSX is identical) |
| Data flow | Unchanged. The adapter is a thin pass-through to the same `queryClient` singleton; every read and every invalidate hits the same query keys at the same call sites |
| Side effects | `_persistRecovery`, `_clearRecovery`, `localStorage` ops, toast calls — none touched |
| Persist middleware | State shape unchanged → no `version` bump needed |
| Recovery snapshot format | Unchanged |

No `⚠️ RESTRICTED RULE` warning needs to be raised. This is pure structural
cleanup.

## Files touched

| File | Change |
|------|--------|
| `src/store/ordersQueryAdapter.ts` | **NEW** — port + register/get + factory + test reset |
| `src/store/slices/draftSessionSlice.ts` | Replace 1 import + 4 call sites |
| `src/store/slices/notificationSlice.ts` | Replace 1 import + 8 call sites |
| `src/components/providers/QueryProvider.tsx` | Add adapter registration at module load |
| `src/test/setup.ts` | Register adapter in `beforeAll` |

## Verification protocol (must all pass)

1. `npm run lint` → clean
2. `npm run type-check` → clean
3. `npm run test` → all green (especially `draftSessionSlice.test.ts`,
   `notificationSlice.test.ts`, `Header.notificationPolling.test.tsx`)
4. **Grep verification:** searching `src/store/` for `@/lib/queryClient`
   returns only the `ORDER_STAGES` import in `draftSessionSlice.ts`. No
   `queryClient.`, no `getOrdersByStageFromCache`, no `isStageCacheLoaded`
   inside `src/store/`.
5. Manual smoke (`npm run dev`) — owner: human reviewer:
   - Open Orders, edit a row → draft active, working rows show edit
   - Undo / Redo work
   - Save draft → row persists, RQ refetches
   - Discard → revert
   - Refresh mid-draft → recovery toast → Restore works
   - Reminder/warranty notifications appear in header

## Rollback strategy

Single `git revert` restores everything. No DB migrations, no API contract
changes, no persisted-state changes → zero data risk. Safety baseline:
audit commit `ae7fe32` on `main`.

## Decisions (taken without explicit user input — safest defaults)

- **Adapter location:** `src/store/ordersQueryAdapter.ts` (the slices own
  the port). Open to relocating to `src/lib/` or `src/adapters/` in a follow-up.
- **Duplicate registration:** `setOrdersQueryAdapter` logs a `console.warn`
  in dev when called twice, then overwrites. Silent overwrite in prod. This
  flags wiring bugs without breaking hot-reload.
- **Default adapter:** no-op (returns `undefined` / `false`, invalidate is
  a no-op). Matches today's behavior when `queryClient` has no observers.
