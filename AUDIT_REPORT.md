# Codebase Audit Report

Generated: 2026-02-11  
Repository: `D:\pendingsystem`  
Audit scope: **Committed code only** (`HEAD` `1ba75a4`)

## Executive Summary

The project has a strong functional base and clear domain workflows, but it is currently at risk in four areas:

1. Security controls on sensitive backend actions.
2. Data architecture drift (React Query + mirrored server data in Zustand).
3. Hidden side effects in UI polling logic.
4. Quality baseline instability (`type-check`, `lint`, missing committed E2E tests).

If these are fixed first, the project will be much easier to maintain and safer to scale.

## Highest-Priority Findings

### 1. Unauthenticated backup trigger endpoint
- Severity: **Critical**
- Evidence:
  - `src/app/api/trigger-backup/route.ts:6`
  - `src/app/api/trigger-backup/route.ts:8`
  - `src/app/api/trigger-backup/route.ts:52`
  - `src/store/slices/reportSettingsSlice.ts:117`
- Issue:
  - `POST /api/trigger-backup` triggers a GitHub workflow with `GITHUB_PAT`, but there is no auth/authorization check in the route.
- Risk:
  - External abuse can trigger workflows repeatedly (cost, rate limits, operational noise).
- Recommendation:
  - Require server-side auth (session + role) or signed internal secret header before dispatch.

### 2. Notification polling performs destructive mutations
- Severity: **Critical**
- Evidence:
  - `src/store/slices/notificationSlice.ts:47`
  - `src/store/slices/notificationSlice.ts:203`
  - `src/store/slices/notificationSlice.ts:207`
  - `src/components/shared/Header.tsx:78`
- Issue:
  - `checkNotifications()` runs on interval and can auto-archive records.
- Risk:
  - Opening the UI can cause repeated business-state transitions every poll cycle.
- Recommendation:
  - Keep notification checks read-only. Move auto-archive to a controlled backend job/cron.

### 3. Server data duplicated in React Query and Zustand
- Severity: **Critical**
- Evidence:
  - `src/store/types.ts:11`
  - `src/store/types.ts:24`
  - `src/store/types.ts:41`
  - `src/app/(app)/orders/useOrdersPageHandlers.ts:22`
  - `src/app/(app)/orders/useOrdersPageHandlers.ts:27`
  - `src/app/(app)/orders/useOrdersPageHandlers.ts:50`
  - `src/app/(app)/archive/page.tsx:58`
  - `src/app/(app)/archive/page.tsx:63`
- Issue:
  - Rows are fetched via React Query, then mirrored into persisted Zustand slices.
- Risk:
  - Drift, race conditions, and conflicting update paths.
- Recommendation:
  - Use React Query as the single source of truth for server data. Keep only UI-local state in Zustand.

## High-Risk Findings

### 4. API rate limiter is not production-safe
- Severity: **High**
- Evidence:
  - `src/middleware.ts:4`
  - `src/middleware.ts:5`
  - `src/middleware.ts:75`
  - `src/middleware.ts:91`
  - `src/middleware.ts:143`
- Issue:
  - In-memory `Map`-based limiter in middleware.
- Risk:
  - Not reliable across instances/serverless cold starts; memory can grow over time.
- Recommendation:
  - Use shared storage rate limiting (Redis/Upstash/provider edge limits) and scope matcher to API-only paths.

### 5. Search debounce intent is broken in header
- Severity: **High**
- Evidence:
  - `src/components/shared/Header.tsx:26`
  - `src/components/shared/Header.tsx:28`
  - `src/components/shared/Header.tsx:103`
  - `src/components/shared/Header.tsx:131`
  - `src/components/shared/Header.tsx:133`
- Issue:
  - There is local debounced state (`searchInput`), but input writes directly to global store immediately.
- Risk:
  - Extra re-renders and dead complexity.
- Recommendation:
  - Bind input to `searchInput`; only push to store from the debounce effect.

### 6. Cloud sync path depends on local mirrored rows
- Severity: **High**
- Evidence:
  - `src/components/shared/CloudSync.tsx:15`
  - `src/components/shared/CloudSync.tsx:21`
  - `src/components/shared/CloudSync.tsx:32`
- Issue:
  - Sync uploads local Zustand row slices rather than server authoritative state.
- Risk:
  - Stale writes and accidental overwrite behavior.
- Recommendation:
  - Replace with server-driven sync/export process or query-backed source with conflict checks.

### 7. Dashboard route mismatch in sidebar
- Severity: **High**
- Evidence:
  - `src/components/shared/Sidebar.tsx:29`
  - `src/components/shared/Sidebar.tsx:195`
  - `src/app/page.tsx:9`
- Issue:
  - Sidebar dashboard href is `/` while app redirects root to `/dashboard`.
- Risk:
  - Wrong active nav state and unnecessary redirect hop.
- Recommendation:
  - Normalize to `/dashboard` for dashboard nav item.

## Medium Findings

### 8. SearchResultsView has duplicated heavy computation
- Severity: **Medium**
- Evidence:
  - `src/components/shared/SearchResultsView.tsx:84`
  - `src/components/shared/SearchResultsView.tsx:94`
  - `src/components/shared/SearchResultsView.tsx:163`
  - `src/components/shared/SearchResultsView.tsx:303`
- Issue:
  - Similar aggregation/search logic runs multiple times; `searchableRows` is unused.
- Risk:
  - Wasted CPU and maintenance burden.
- Recommendation:
  - Build one normalized indexed dataset and derive filtered views from it.

### 9. Broad `any` usage in hot paths
- Severity: **Medium**
- Evidence:
  - `src/hooks/queries/useOrdersQuery.ts:29`
  - `src/hooks/queries/useOrdersQuery.ts:44`
  - `src/hooks/queries/useOrdersQuery.ts:75`
  - `src/hooks/queries/useOrdersQuery.ts:104`
  - `src/hooks/queries/useOrdersQuery.ts:136`
  - `src/components/shared/SearchResultsView.tsx:86`
- Issue:
  - Type safety is bypassed in data mutation and grid/search flow.
- Risk:
  - Higher regression probability and weaker refactor safety.
- Recommendation:
  - Introduce strict stage/query data types and remove `any` progressively.

### 10. Dead/unused state and handlers
- Severity: **Medium**
- Evidence:
  - `src/app/(app)/main-sheet/page.tsx:41`
  - `src/app/(app)/main-sheet/page.tsx:126`
  - `src/app/(app)/booking/page.tsx:104`
  - `src/app/(app)/booking/page.tsx:108`
  - `src/app/(app)/orders/useOrdersPageHandlers.ts:41`
- Issue:
  - Unused queries and local state variables remain.
- Risk:
  - Cognitive overhead and unnecessary data work.
- Recommendation:
  - Remove dead code and tighten page-level handlers.

### 11. Encoding artifact in UI text
- Severity: **Medium**
- Evidence:
  - `src/components/shared/Header.tsx:150`
- Issue:
  - Keyboard shortcut symbol is displayed as mojibake.
- Risk:
  - Visible UX quality issue.
- Recommendation:
  - Replace with clean symbol/text (`Cmd`/`Ctrl+K`).

### 12. Oversized files increase change risk
- Severity: **Medium**
- Evidence:
  - `src/components/orders/OrderFormModal.tsx` (~1217 lines)
  - `src/app/(app)/booking/page.tsx` (~435 lines)
  - `src/components/shared/SearchResultsView.tsx` (~430 lines)
- Issue:
  - Single files carry too many responsibilities.
- Risk:
  - Harder testing, slower onboarding, riskier edits.
- Recommendation:
  - Split by concern (data hook, toolbar actions, modal logic, schema helpers).

## Validation and Quality Gate Status

### TypeScript
- Command: `npm run type-check`
- Status: **Failing**
- Notable errors observed:
  - `src/test/gridConfig.test.ts` has unused `@ts-expect-error` directives.
  - local untracked test file caused module resolution error during this run.

### Lint (Biome)
- Command: `npm run lint`
- Status: **Failing**
- Sample committed issues:
  - Missing radix in `parseInt`: `scripts/generate-backup.mjs:57`, `:58`, `:59`, `:128`
  - `isNaN` usage: `scripts/generate-backup.mjs:132`
  - Unused import: `src/types/index.ts:5`

### E2E baseline
- Config exists:
  - `playwright.config.ts:13`
  - `playwright.config.ts:14`
  - `package.json:16`
- Observed state:
  - No committed specs under `tests/` (empty in tracked files).

## Recommended Recovery Plan

### Phase 1 (Stabilize and secure)
1. Secure `POST /api/trigger-backup` with auth/authorization.
2. Remove destructive side effects from UI polling (`checkNotifications`).
3. Fix route consistency (`/dashboard` nav path).

### Phase 2 (Data architecture cleanup)
1. Stop mirroring server rows into Zustand.
2. Keep server data in React Query only.
3. Restrict Zustand to UI preferences and UI-only state.

### Phase 3 (Quality baseline)
1. Make `npm run type-check` pass cleanly.
2. Reduce lint debt in core source first, then scripts/tests.
3. Add committed E2E smoke tests for main workflow transitions.

### Phase 4 (Maintainability)
1. Split oversized components/pages.
2. Replace `any` in mutation/query/search paths.
3. Add focused tests for refactored modules.

## Mentor Notes for This Project

- You already have good structure, clear feature intent, and strong domain rules.
- The main blocker is not feature capability, it is **consistency and control boundaries**.
- If you enforce one source of truth for server data and lock down sensitive actions, the rest of the codebase becomes much easier to improve safely.

