# Code Review Findings — Critical Paths

**Date:** 2026-07-08
**Scope:** Data & services layer, API routes/auth/security, and validation/optimistic-mutation/draft-session flow.
**Method:** Parallel review by Fable-model subagents (services layer; API/auth/security) plus a direct manual review (validation/mutations/draft-session, completed after the third Fable subagent hit a session limit). All findings below were independently spot-checked against the current source before inclusion; unverified or already-compensated items were dropped.

Findings report. **Fixed so far:** #1 (High) — see the ✅ marker on that finding. All other findings are still open.

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| High     | 4     | 1     |
| Medium   | 11    | 0     |
| Low      | 9     | 0     |

No Critical-severity issues were found. The codebase's optimistic-mutation pattern (cancel → snapshot → apply → rollback → invalidate) and the draft-session command/checkpoint system are implemented correctly and were **not** flagged.

---

## High Severity

### 1. ✅ FIXED — Unbounded Supabase selects — silent row truncation
**File:** [src/services/order/orderQueryRepository.ts:24](src/services/order/orderQueryRepository.ts#L24) (also `getDashboardStats`)
`getOrders(stage)` issues `.select(...)` with no `.range()`/`.limit()`. Once any stage (e.g. `archive`, which only grows) exceeds Supabase/PostgREST's default row cap, results are silently truncated — grids show missing orders, dashboard stats undercount, and `warrantyMaintenanceService.archiveExpiredWarranties` never sees (or archives) rows beyond the cap. No error is raised.
**Fix direction:** Paginate with `.range()` or add an explicit `.limit()` + total-count check.
**Fixed:** Branch `fix/unbounded-supabase-selects` (merged). Added a `fetchAllPages()` helper that pages through 1000-row `.range()` windows until a short page ends the loop; both `getOrders` (with-attachments + legacy-fallback selects) and `getDashboardStats` now route through it, so the warranty archive scan (`fetchMappedOrders` → `getOrders`) is covered too. A secondary `.order("id")` tiebreak keeps pages from skipping/duplicating rows at a `created_at` boundary. Return shapes and below-cap behavior are unchanged. Covered by 3 new pagination unit tests in `src/test/orderService.test.ts`.

### 2. Non-transactional metadata read-modify-write race
**File:** [src/services/orderRepository.ts:80-94](src/services/orderRepository.ts#L80-L94)
`saveOrder` reads the existing `metadata` JSON, merges the patch into it, and writes it back later with no optimistic-concurrency guard. Two concurrent saves on the same row (two tabs, or a user edit racing a background maintenance scan) read the same snapshot; the second write overwrites the entire `metadata` blob, silently reverting the first writer's fields. The `expectedCurrentStage` guard only protects stage transitions, not metadata content.
**Fix direction:** Move the merge server-side (RPC / `jsonb` patch update), or add an `updated_at` equality condition to the update.

### 3. Rate limiter keyed on a spoofable header
**Files:** [src/app/api/mobile-order/route.ts:11-13](src/app/api/mobile-order/route.ts#L11-L13), [src/app/api/password-reset/request/route.ts](src/app/api/password-reset/request/route.ts)
The client IP is taken as the **first** segment of `x-forwarded-for`, falling back to `x-real-ip` only if the header is absent. Both routes are public. An attacker fully controls whether `x-forwarded-for` is sent and what it contains, so they can prepend an arbitrary value on every request and always win over the trustworthy `x-real-ip`/last-hop value — fully bypassing the 30/hour (mobile-order) and 3/hour (password-reset) caps. This enables unlimited public order-intake spam and password-reset email bombing / enumeration attempts.
**Fix direction:** Derive the client IP from the platform-trusted value (Vercel's `x-real-ip`, or the last hop of `x-forwarded-for`), never the first/client-suppliable one.

### 4. Public intake endpoint mutates shared global settings with no bounds
**Files:** [src/services/mobileOrderService.ts:14-45](src/services/mobileOrderService.ts#L14-L45), [src/app/api/mobile-order/route.ts:40](src/app/api/mobile-order/route.ts#L40)
The unauthenticated `/api/mobile-order` endpoint writes attacker-supplied `model`/`repairSystem` strings directly into the shared `app_settings.models` / `repair_systems` arrays via `mergeAppSettings`. `MobileQuickOrderSchema` validates only `company` (enum); all other fields are unbounded free strings defaulting to `""`. A public caller can inject arbitrary strings that later render in the admin Settings/dropdown UI, or submit huge strings / large `parts` arrays to grow storage and the `orders` table unbounded per request.
**Fix direction:** Add max-length/max-array-size constraints to the schema, and stop letting a public intake endpoint mutate global `app_settings`.

---

## Medium Severity

### 5. Empty-string field clears silently fail
**File:** [src/services/orderRepository.ts:149-154](src/services/orderRepository.ts#L149-L154)
`baseSupabaseOrder.customer_name = rest.customerName || ...` — an intentional clear (`customerName: ""`) evaluates to the fallback (`undefined`), which `JSON.stringify` drops from the request, so the column is never updated. `mapSupabaseOrder` prefers the non-empty column value on refetch, so a cleared name/mobile silently reappears. Contrast `order_number` at line 146, which correctly falls back to `null`.
**Fix direction:** Use explicit `??`/empty-string-aware handling instead of `||` for `customer_name` and `customer_phone`.

### 6. Save silently no-ops instead of surfacing "not found"
**File:** [src/services/orderRepository.ts:182-200](src/services/orderRepository.ts#L182-L200)
When an update matches 0 rows, the code returns `null` even when `expectedCurrentStage` was **not** supplied (i.e. this isn't an intentional stage-conflict skip). `useSaveOrderMutation.onSuccess` swallows the resulting mapper throw and treats it as success — a save on a concurrently-deleted row silently vanishes with no toast, violating the project rule that validation/lookup failures must throw, not return null. The insert-vs-update branch also uses a weak `id.length === 36` check rather than a real UUID validator.
**Fix direction:** Throw a typed `ServiceError("NOT_FOUND", ...)` when 0 rows match and no `expectedCurrentStage` was given; use a UUID validator for the branch decision.

### 7. Duplicate/conflict checks swallow errors and report "clean"
**File:** [src/services/order/orderQueryRepository.ts:102-160](src/services/order/orderQueryRepository.ts#L102-L160)
`checkHistoricalVinPartDuplicate` and `checkHistoricalDescriptionConflict` catch DB errors, log a warning, and return `{ isDuplicate: false }` / `{ hasConflict: false }`. A transient Supabase failure during validation is indistinguishable from "verified clean," so a real duplicate VIN+part order can pass validation — a silent integrity bypass.
**Fix direction:** Throw a typed error on query failure so callers can distinguish "checked, clean" from "check failed."

### 8. Non-atomic reminder delete-then-insert, delete error unchecked
**File:** [src/services/orderRepository.ts:298-320](src/services/orderRepository.ts#L298-L320)
Pending reminders are deleted before the new one is inserted; the delete's error is never checked. If the insert then fails, the old reminder is already gone with no rollback. If the delete itself silently fails, two "active" reminders can coexist and `mapSupabaseOrder` picks one arbitrarily.
**Fix direction:** Check the delete error; make the replace atomic (upsert on `order_id`, or insert-then-delete-others).

### 9. Raw/untyped error thrown, null columns cast without guard
**File:** [src/services/appSettingsService.ts:16-20](src/services/appSettingsService.ts#L16-L20)
`fetchAppSettings` throws the raw `PostgrestError` (not routed through `handleSupabaseError`/a typed error) and casts nullable columns (`data.models as string[]`, etc.) without a `?? []` guard. If `models`/`repair_systems`/`requesters` is `NULL` in the DB, callers doing `.includes`/`.map` on the result crash at runtime — `mobileOrderService.ts` guards the same columns with `?? []`, confirming null is a real possible state.
**Fix direction:** Route the error through the typed-error path; default each nullable array column with `?? []`.

### 10. `report-settings` PATCH — unvalidated mass assignment
**File:** [src/app/api/report-settings/route.ts:33-39](src/app/api/report-settings/route.ts#L33-L39), [src/services/reports/reportSettingsRepository.ts:28-41](src/services/reports/reportSettingsRepository.ts#L28-L41)
The PATCH body is cast (`as {id: string} & Partial<ReportSettings>`) with no Zod validation; everything except `id` is passed straight into `.update(settings)`. An authenticated caller can set arbitrary columns (e.g. `singleton`, `last_sent_at`) that were never meant to be client-writable. *(Note: `report_settings` is a singleton table, so this is not cross-tenant IDOR — but it is an unvalidated write surface.)*
**Fix direction:** Zod-validate the PATCH body to an explicit allowlist of updatable fields.

### 11. `app-settings` PATCH — business logic and unvalidated arrays in the handler
**File:** [src/app/api/app-settings/route.ts:20](src/app/api/app-settings/route.ts#L20)
The handler casts the body with `as Partial<AppSettings>` and performs the protected-repair-system merge and field mapping inline, with no validation of array element types/lengths. This both violates the project's "no business logic in route handlers" rule and lets oversized/malformed array contents reach the DB.
**Fix direction:** Zod-validate the payload; move the merge logic into a service function.

### 12. `auth.ts` trusts the entire `*.vercel.app` domain
**File:** [src/lib/auth.ts:16](src/lib/auth.ts#L16)
`trustedOrigins: ["https://*.vercel.app"]` treats every subdomain on the shared `vercel.app` domain — including an attacker's own free Vercel deployment — as a trusted origin for Better Auth's CSRF/redirect checks.
**Fix direction:** Restrict trusted origins to the specific production/preview hostnames actually used by this project.

### 13. Draft recovery snapshot deserialized without schema validation
**Files:** [src/hooks/useDraftSession.tsx:133](src/hooks/useDraftSession.tsx#L133), [src/store/slices/draftSessionSlice.ts:432](src/store/slices/draftSessionSlice.ts#L432), [src/store/slices/draftSessionSlice.ts:141-211](src/store/slices/draftSessionSlice.ts#L141-L211)
`JSON.parse(raw)` from `localStorage["pending-sys-draft-v1"]` is only type-asserted to `DraftRecoverySnapshot`, never schema-validated. `applyCommandToWorking`'s if/else-if chain has no fallback branch, so a corrupted/malformed command (unexpected `type`) is silently dropped from the restored working view with no error — the user is told changes were restored when one is actually missing. Additionally, `restoreFromRecovery(snapshot)` is invoked later from a button `onClick` handler, outside the `try/catch` that wrapped the original `JSON.parse` — a malformed shape that throws there would be an uncaught exception in a React event handler.
**Fix direction:** Validate the parsed snapshot (and each command) with a Zod schema before offering "Restore"; add a default/error branch in `applyCommandToWorking` for unrecognized command types.

### 14. No way to skip a single permanently-failing command during draft save retry
**File:** [src/store/slices/draftSessionSlice.ts:369-409](src/store/slices/draftSessionSlice.ts#L369-L409)
`saveDraft`'s checkpoint mechanism resumes from the failing command index on retry, which is good for transient failures — but if one command fails deterministically (e.g. a stage conflict because another user already moved/deleted that row), the user has no way to drop just that command; the only escape is `discardDraft()`, which throws away **all** pending commands, not just the offending one.
**Fix direction:** Allow removing/skipping a single failing command from `pendingCommands` without discarding the whole draft.

### 15. `ilike` duplicate/conflict scans: unescaped wildcards, capped and unordered
**File:** [src/services/order/orderQueryRepository.ts:98-150](src/services/order/orderQueryRepository.ts#L98-L150)
User-supplied part numbers are passed unescaped into `ilike` filters (`%`/`_` act as wildcards, causing false-positive duplicate matches), and the scan is capped at `.limit(100)` with no ordering — a part number with more than 100 historical orders can have a real conflict missed depending on which arbitrary 100 rows are returned.
**Fix direction:** Escape `ilike` metacharacters in the input; use exact-match filtering or a count-based check instead of a truncated scan.

---

## Low Severity

### 16. `mergeAppSettings` ignores update errors; read-modify-write race
**File:** [src/services/mobileOrderService.ts:45](src/services/mobileOrderService.ts#L45) — a failed `update()` (or two concurrent mobile submissions) can silently drop a newly submitted model/repair-system value with no log.

### 17. Stale `metadata.stage` embedded on mobile-created rows
**File:** [src/services/mobileOrderService.ts:81](src/services/mobileOrderService.ts#L81) — mobile intake embeds `stage: "orders"` inside `metadata`, which `saveOrder` elsewhere deliberately strips; once the row moves stages, raw-metadata consumers (exports, ad hoc SQL) see a stale value.

### 18. Back-compat re-export violates the "no re-export" architecture rule
**File:** [src/services/orderRepository.ts:18](src/services/orderRepository.ts#L18) — re-exports `createOrderQueryRepository`, creating two import paths for the same symbol (also re-exported via `orderService.ts`).

### 19. Bulk stage-move batches have no rollback on partial failure
**File:** [src/services/orderRepository.ts:42](src/services/orderRepository.ts#L42) — for >50 ids, sequential batch commits mean a later-batch failure leaves some rows moved and others not, while the UI's optimistic-cache rollback no longer matches the half-applied DB state until the next refetch.

### 20. TLS certificate validation disabled on the Postgres connection
**File:** [src/lib/postgres.ts:12](src/lib/postgres.ts#L12) — `ssl: { rejectUnauthorized: false }` disables server-certificate verification (appears to be an intentional Supabase-pooler workaround, but is a real weakening of transport security).

### 21. Raw internal error messages returned to API clients
**Files:** [src/app/api/report-settings/route.ts:24,44](src/app/api/report-settings/route.ts#L24), [src/app/api/app-settings/route.ts:59](src/app/api/app-settings/route.ts#L59), [src/app/api/quick-templates/route.ts](src/app/api/quick-templates/route.ts), [src/app/api/storage-stats/route.ts](src/app/api/storage-stats/route.ts) — DB/driver error text is returned directly in the 500 response body. Admin-only access limits impact, but internals are still exposed.

### 22. PII logged on password-reset dispatch failure
**File:** [src/services/passwordResetService.ts:33](src/services/passwordResetService.ts#L33) — logs `username` and `email` together, expanding the sensitive-data surface in log storage.

### 23. Production CSP still allows `'unsafe-inline'` scripts
**File:** [src/middleware.ts:74](src/middleware.ts#L74) — `'unsafe-eval'` is correctly stripped in production, but `'unsafe-inline'` remains in `script-src`, materially weakening XSS protection.

### 24. `getOrCreateReportSettings` / `patchReportSettings` throw plain `Error`, not typed
**File:** [src/services/reports/reportSettingsRepository.ts:18,24,39](src/services/reports/reportSettingsRepository.ts#L18) — consistent with finding #9's pattern; not routed through the project's typed-error convention.

---

## Verified Clean (checked, not flagged)

- `orderMapper.ts` — reminder timezone round-trip is symmetric; correctly throws `OrderMappingError` on Zod failure.
- `quickTemplatesRepository.ts` — correctly uses `mapKeysToCamel`.
- No `console.*` usage, no `store/`→`hooks`/`components` imports, no service file over 500 LOC in the reviewed set.
- All non-public API routes (`app-settings`, `report-settings`, `quick-templates`, `storage-stats`, `trigger-backup`) perform their own authoritative `auth.api.getSession` check independent of middleware.
- `maintenance/archive-expired-warranties` is correctly gated by a `CRON_SECRET` bearer token.
- All routes use the sanctioned `@/lib/supabase-admin` `createServiceClient` — no inline client construction.
- Password-reset enumeration protection (generic response + fixed minimum delay) and token expiry (1 hour) are implemented correctly.
- The optimistic mutation pattern (`useSaveOrderMutation`, `useBulkUpdateOrderStageMutation`, `useBulkDeleteOrdersMutation`) correctly cancels, snapshots, applies, rolls back, and invalidates all touched stages plus dashboard stats.
- `store/ordersQueryAdapter.ts` is a deliberate, documented dependency-inversion port — it does not violate the "no `queryClient` import in `store/slices/`" rule.
- The Beast Mode gate for the `orders → main` transition is only reachable via the guarded `moveRows` command path (`useOrdersPageHandlers.ts`); no `patchRow`-based bypass exists.
- `saveDraft`'s checkpoint/retry mechanism is safe against duplicate creates on retry — `createRows` commands carry an `idempotencyKey` that the repository upserts on (`onConflict: "idempotency_key"`).

---

## Notes on Method

- The third planned review area (validation/mutations/draft-session) was originally assigned to a parallel Fable subagent, which hit its session usage limit partway through. The area was completed via direct manual review (Read/Grep against the live source) instead, using the partial output already produced as a starting point.
- Every finding above cites a specific file:line and was re-read directly before inclusion; no finding is based on the reviewing agents' descriptions alone.
- One Fable-reported finding (report-settings "IDOR") was corrected during verification — the table is a singleton, not per-user, so the finding was reframed as unvalidated mass-assignment rather than cross-tenant access.
