# Codebase Audit Report — pendingsystem — 2026-06-10

## Executive summary

Overall health grade: **C+**. The application layer is in good shape — TypeScript is clean, near-zero `any` in production code, API routes are consistently auth-guarded, and the layered architecture is largely respected. However, the **database layer is critically exposed**: RLS is disabled on every table and the `anon` role (whose key ships in the browser bundle) has full read/write/TRUNCATE on `orders`, `auth_users`, `auth_sessions`, and `auth_accounts` — including session tokens and password hashes. Independently, the test suite is broken (32 failures across 13 files from a single test-cleanup misconfiguration), which means the project's own merge quality gate (`lint → type-check → test → build`) currently fails at both `lint` (16 formatting errors) and `test`. Fix the database grants this week; the test and lint fixes are under 30 minutes combined.

## Scorecard

| Area | Grade | Notes |
|---|---|---|
| Correctness / bugs | B+ | tsc clean; no real logic bugs found in sampled high-churn files |
| Security (app layer) | B | All API routes auth-guarded; good middleware (CSP, HSTS); public mobile-order endpoint is by design but weakly limited |
| Security (data layer) | F | RLS disabled everywhere; anon role has full CRUD + TRUNCATE on auth and business tables |
| Type safety | A | `tsc --noEmit` passes; only 2 `any` occurrences in non-test src |
| Performance | B | Exports lazy-load xlsx; no N+1 patterns found; 6 unused DB indexes |
| Dependencies | C | xlsx high-severity CVEs with no fix; better-auth 11 minor versions behind; 9 audit findings |
| Code health | B- | 1 type-only circular import; 31 dead exports; 9 files exceed the project's own size budgets; 16 files have formatting drift |
| Build | A | `npm run build` passes; 26 routes, 103 kB shared first-load JS; heaviest pages: `/call-list` 426 kB, `/reports` 415 kB first-load |
| Testing | D | 32 of 486 tests failing (13 files) — single root cause, easy fix |

## Findings

### P0 — Critical

#### [P0-1] RLS disabled on all tables; anon key grants full CRUD on auth and business data
- **File:** Supabase project `iwuhqvzkxiisaoioswtf` (database, not repo) — client key exposure path: `src/lib/supabase.ts:5-18` (browser client built from `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- **Evidence:**
  - Supabase security advisors report `rls_disabled_in_public` (ERROR) for `orders`, `order_notes`, `order_attachments`, `order_links`, `order_reminders`, `bookings`, `report_settings`, `auth_users`, `auth_sessions`, `auth_accounts`, `auth_verifications`, and `sensitive_columns_exposed` (ERROR) for `auth_accounts` (`password`, `access_token`, `refresh_token`) and `auth_sessions` (`token`).
  - Verified via SQL (`information_schema.role_table_grants`): role `anon` holds `INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER` on `auth_users`, `auth_sessions`, `auth_accounts`, `auth_verifications`, `orders`, `app_settings`, `report_settings`.
- **Impact:** Anyone who extracts the anon key from the JS bundle (it is public by definition) can, without logging in, call PostgREST directly to: read every active session token from `auth_sessions` and hijack any account; read password hashes from `auth_accounts` for offline cracking; read, modify, or `TRUNCATE` all operational order data. This is a full-compromise path.
- **Fix (staged, verified safe):**
  1. **Today — auth tables.** Better Auth connects via the direct `pg` pool (`src/lib/postgres.ts:45` → `src/lib/auth.ts:13`), *not* PostgREST, so revoking API-role access cannot break login:
     ```sql
     REVOKE ALL ON public.auth_users, public.auth_sessions, public.auth_accounts, public.auth_verifications FROM anon, authenticated;
     ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.auth_accounts ENABLE ROW LEVEL SECURITY;
     ALTER TABLE public.auth_verifications ENABLE ROW LEVEL SECURITY;
     ```
  2. **Today — non-client tables.** `app_settings`, `rate_limits`, `recent_activity` are only touched server-side (service-role / pg pool): revoke `anon`/`authenticated` and enable RLS the same way.
  3. **This week — orders and related tables.** The browser client reads/writes `orders` directly with the anon key (`src/services/orderRepository.ts` via `src/lib/supabase.ts`), so enabling RLS there with no policy would break the app. Decide between: (a) moving order access behind authenticated API routes using the existing service-role client, or (b) enabling RLS with a policy tied to a Better Auth-issued JWT. Until then the orders data remains effectively public — treat this as an open incident, not a backlog item.

### P1 — High

#### [P1-1] Test suite broken: 32 failures in 13 files (quality gate failing)
- **File:** `vitest.config.ts:6-27` and `src/test/setup.ts`
- **Evidence:** `npm test` → `Test Files 13 failed | 46 passed (59); Tests 32 failed | 454 passed (486)`. 30 of 32 failures are `TestingLibraryElementError: Found multiple elements...` (e.g. `src/test/reports/SchedulingCard.test.tsx`, `RecipientsCard`, `ManualActionCard`, `BackupReportsTab`, `Sidebar`, `authForms`, `CallCustomerCounter`, `EditNoteModal`).
- **Impact:** React Testing Library's auto-cleanup only registers when a global `afterEach` exists. `vitest.config.ts` does not set `globals: true` and `setup.ts` never calls `cleanup()`, so rendered components accumulate in the shared JSDOM document and duplicate-element queries fail. The CI/merge gate is red, masking any real regressions.
- **Fix:** Add `globals: true` to the `test` block of `vitest.config.ts:6` (or add `import { afterEach } from "vitest"; import { cleanup } from "@testing-library/react"; afterEach(cleanup);` to `src/test/setup.ts`). The 2 remaining failures in `src/test/supabase.test.ts` expect `'Invalid environment variables'` but get supabase-js's own `'supabaseUrl is required.'` — update the assertions or stop setting `SKIP_ENV_VALIDATION` for that test.

#### [P1-2] Unauthenticated public order-creation endpoint with spoofable, fail-open rate limit
- **File:** `src/app/api/mobile-order/route.ts:10-23`, `src/app/api/mobile-order/rateLimiter.ts:22-26`
- **Evidence:** `POST /api/mobile-order` is in `PUBLIC_PATHS` (`src/middleware.ts:13`) and has no session check. Rate limiting keys on `x-forwarded-for` (`route.ts:11-14`), which a direct caller can set arbitrarily, and `rateLimiter.ts:22-26` **fails open** on any DB error. Input is Zod-validated, and writes go through the service-role client.
- **Impact:** Anyone can inject unlimited fake orders into the `orders` stage by rotating the `x-forwarded-for` header (30 req/window per spoofed IP), polluting the operational workflow and consuming storage.
- **Fix:** If the mobile quick-order page is meant for staff, require a session (or at minimum a shared secret/signed link). If it must stay public: key the limit on a server-derived identifier where available, add a global (all-IPs) ceiling per hour in `check_rate_limit`, and change `rateLimiter.ts:26` to fail closed for writes.

#### [P1-3] Project's own merge gate also fails at lint: 16 files with formatting drift
- **File:** e.g. `src/store/useStore.ts`, `src/services/orderRepository.ts`, `src/app/(app)/archive/page.tsx`, `next.config.ts`, `package.json` (full list from `npx biome check . --reporter=github`)
- **Evidence:** `npm run lint` → `Found 16 errors` (all `format` — no lint-rule violations).
- **Impact:** `lint → type-check → test → build` gate cannot pass; combined with P1-1, merges are happening without a working gate.
- **Fix:** `npm run lint:fix` (Biome safe fixes), then commit. ~2 minutes.

### P2 — Medium

| ID | File | Issue | Fix |
|---|---|---|---|
| P2-1 | `package.json:80` (`xlsx ^0.18.5`) | High-severity advisories GHSA-4r6h-8v6p-xvw6 (prototype pollution) + GHSA-5pgg-2g8v-p4x9 (ReDoS); **no fixed version on npm**. Mitigating factor: only used to *write* exports (`src/lib/exportUtils.ts:68`, `src/lib/reports/reportExcel.ts:11`), never to parse untrusted files | Migrate to the maintained CDN build of SheetJS (`https://cdn.sheetjs.com`) or to `exceljs`; never add xlsx *parsing* of user uploads while on 0.18.5 |
| P2-2 | `package.json:56` (`better-auth 1.5.6`) | Auth library 11 minor versions behind (latest 1.6.16) | Schedule upgrade + run auth regression (login, reset, session expiry) |
| P2-3 | `npm audit --omit=dev` | 6 moderate: `postcss` <8.5.10 (via next), `uuid` (via resend→svix), `ws` 8.x | `npm audit fix` (all have non-breaking fixes) |
| P2-4 | Supabase functions `check_rate_limit`, `prune_rate_limits`, `get_database_size_bytes`, `fn_log_order_activity_v2/v5` | Mutable `search_path` (advisor WARN) — hijackable in combination with other issues | `ALTER FUNCTION ... SET search_path = public, pg_temp;` |
| P2-5 | Supabase function `get_database_size_bytes` | `SECURITY DEFINER` executable by `anon` via `/rest/v1/rpc/` | `REVOKE EXECUTE ... FROM anon, authenticated;` (only the service-role route `src/app/api/storage-stats/route.ts:146` calls it) |
| P2-6 | Storage bucket `attachments` | Public bucket with broad SELECT policy allows full file listing | Drop the listing policy; public object-URL access doesn't need it |
| P2-7 | `src/app/api/password-reset/request/route.ts:9-25` | In-memory rate limiter — resets on redeploy and is per-instance under any multi-instance deploy; IP from spoofable header | Reuse the DB-backed `check_rate_limit` RPC used by mobile-order |
| P2-8 | `src/components/auth/LoginForm.tsx:25-27` | `void import("ldrs").then(...)` with no `.catch` — throws unhandled rejection (reproduced in test run: `Cannot read properties of null (reading '_namespaceURI')`) | Add `.catch(() => {})` or guard `customElements.get("l-mirage")` before `register()` |

### P3 — Low

| ID | File | Issue | Fix |
|---|---|---|---|
| P3-1 | `package.json:67` | `nodemailer` has **zero** imports in the repo (email goes via `resend` — `src/lib/auth-email.ts`); commit fe7a417 restored it citing a "knip false positive", but depcheck + grep confirm it is unused | `npm uninstall nodemailer`, then verify `npm run build` |
| P3-2 | `src/store/types.ts:9-14` ↔ `src/store/slices/draftSessionSlice.ts:9-13` | Only circular import in src (madge); type-only, benign | Re-home draft command types into `@/types` per architecture rule §f |
| P3-3 | knip output | 31 unused exports + 21 unused types + 1 duplicate export — concentrated in `src/components/ui/bar-chart.tsx` (10), `combobox.tsx` (13), `src/services/orderService.ts:4-10` (5 re-exports, violates anti-pattern L2) | Remove or un-export; rerun `npx knip` |
| P3-4 | Size budgets (project's own rules) | `orderRepository.ts` 606 LOC (>500 service split point); `useOrdersPageHandlers.ts` 524 (>300); API routes over 50 LOC: `storage-stats` 229, `quick-templates` 120, `trigger-backup` 109, `password-reset/request` 99, `report-settings` 88, `health` 75, `app-settings` 61; UI: `bar-chart.tsx` 1673, `useSearchResultsState.ts` 729 | Split opportunistically when next touched |
| P3-5 | `npm outdated` | Notable drift: `@supabase/supabase-js` 2.89→2.108, `ag-grid` 32→35 (major), `lucide-react` 0.468→1.x (major), `next` 15.5.15→15.5.19 (patch) | Patch/minor bumps in a maintenance PR; majors individually |
| P3-6 | Supabase performance advisors | 6 never-used indexes (`idx_orders_company`, `idx_order_reminders_remind_at`, `idx_bookings_date`, `idx_bookings_status`, `idx_auth_sessions_expires_at`, `quick_templates_category_sort_idx`) | Drop after confirming with production query patterns |
| P3-7 | `docs/architecture.md:96` (vault) | Stale path: lists adapter at `src/store/adapters/ordersQueryAdapter.ts`; actual location is `src/store/ordersQueryAdapter.ts` | Patch the vault doc |
| P3-8 | DB tables `bookings`, `order_attachments`, `order_links`, `order_notes` | Exist in DB with RLS policies but disabled RLS; not referenced by current `src/services/` code paths (orders embeds reminders only) | Fold into the P0 RLS migration; drop if truly orphaned |

## Quick wins (< 30 min each)

1. `npm run lint:fix` — clears all 16 lint-gate errors (P1-3).
2. Add `globals: true` to `vitest.config.ts` `test` block — should clear ~30 of 32 test failures (P1-1); then fix the 2 `supabase.test.ts` assertions.
3. Run the P0 step-1 SQL (revoke + enable RLS on `auth_*` tables) in the Supabase SQL editor — closes the account-takeover path immediately without touching app code.
4. `npm audit fix` — clears the postcss/uuid/ws moderates (P2-3).
5. `npm uninstall nodemailer` + `npm run build` to verify (P3-1).
6. `REVOKE EXECUTE ON FUNCTION public.get_database_size_bytes() FROM anon, authenticated;` (P2-5).

## Suggested fix order

1. **Today:** P0-1 steps 1–2 (auth + server-only tables), quick wins 1–3.
2. **This week:** P0-1 step 3 (orders RLS strategy — needs a design decision), P1-2 (mobile-order hardening), P2-1 (xlsx replacement decision), P2-4/P2-5/P2-6 (DB function + bucket hardening).
3. **Next sprint:** P2-2 (better-auth upgrade), P2-7, P2-8, P3-3 (dead exports), P3-4 (size-budget splits when files are next touched).
4. **Opportunistic:** P3-1, P3-2, P3-5, P3-6, P3-7, P3-8.

## What was NOT checked

- **E2E tests:** none were run (project has a Playwright workflow per memory, but this audit ran unit tests only).
- **Runtime performance:** no profiling or bundle-size measurement was performed; bundle findings are static-analysis only.
- **Manual review sampling:** automated checks covered the full repo; manual line-level review sampled the top-churn files (`GridConfig.tsx`, `orderService.ts`/`orderRepository.ts`, stage pages, `Header.tsx`, store slices), all 10 API routes, middleware, and auth wiring — not all 622 TS files (~75k LOC).
- **Secrets scan:** `git grep` pattern scan of the working tree only; full git *history* was not scanned for previously committed secrets.
- **Supabase logs:** not inspected; advisor + grants evidence was considered sufficient for the P0.
