# Production Code Audit Report

**Overall Grade: B-**

The architecture is in good shape, tests pass, build passes, and environment validation is strong. The biggest risks are database security boundaries, non-atomic draft persistence, and missing CI enforcement.

---

## Findings

### Critical: Supabase RLS allows direct anon writes outside the app auth layer
- **Evidence:** `report settings` anon policies (line 21), `app settings` anon policies (line 14), `attachment` anon delete/update (line 13), `public attachment` read (line 7).
- **Impact:** Because the browser uses the public anon key, app-level Better Auth does not stop direct Supabase REST/storage calls. Anyone with the anon key can mutate settings and storage objects allowed by these policies. Attachments are also public-readable.

### Critical: Draft save retry can duplicate newly created orders after partial failure
- **Evidence:** `saveDraft` creates a per-attempt idMap and replays every command `draftSessionSlice.ts` (line 450); failed saves intentionally keep all commands for retry `draftSessionSlice.ts` (line 480); `createRows` replays as a fresh insert with id: "" `draftSessionSlice.ts` (line 627).
- **Impact:** If a create succeeds and a later command fails, retry inserts the created row again. Current tests cover temp-id reconciliation only for successful saves, not partial-failure retry.

### High: Public mobile-order route depends on service-role writes plus process-local rate limiting
- **Evidence:** `/api/mobile-order` is public in middleware `middleware.ts` (line 13), creates a service-role Supabase client `route.ts` (line 10), and inserts rows directly `route.ts` (line 148). Rate limiting is only an in-memory Map `rateLimiter.ts` (line 5).
- **Impact:** In production/serverless, limits reset on cold start and do not coordinate across instances, so this endpoint can be abused for DB spam/cost.

### High: Settings/report data is mutable through client-side-only gates
- **Evidence:** Settings lock compares against `NEXT_PUBLIC_SETTINGS_PASSWORD` in client code `SettingsModal.tsx` (line 56), and that env var is explicitly public `env.ts` (line 10).
- **Impact:** This is fine as a UI convenience, but it must not be treated as authorization. Combined with anon RLS, settings are not protected at the real data boundary.

### Medium: report_settings is treated as singleton but schema permits many rows
- **Evidence:** Table uses random UUID primary key `20260105_report_settings.sql` (line 2); service reads newest row with `limit(1)` `reportSettingsService.ts` (line 17); first access inserts defaults when none found `reportSettingsService.ts` (line 34).
- **Impact:** Concurrent first loads can create multiple config rows, and later updates affect whichever row the cache loaded.

### Medium: No CI workflow enforces the documented quality gates
- **Evidence:** Only `.github/workflows/backup-reports.yml` exists; it runs backup only `backup-reports.yml` (line 6). The repo documents `lint` -> `type-check` -> `test` -> `build` as merge gates `AGENTS.md` (line 20).
- **Impact:** This leaves regressions dependent on local discipline.

### Medium: npm run lint currently fails
- **Verification Result:** Biome reports 52 errors and 60 warnings. Major categories include formatting drift, `!important` usage in CSS, and explicit `any` in tests.
- **Impact:** `type-check`, `test`, `build`, `docs:validate`, and `npm audit` pass or complete, but lint blocks the stated merge gate.

### Low: Docs validation has broken README links
- **Details:** `npm run docs:validate` exits successfully but warns that README links to `docs/attachment-system-reference.md`, `docs/order-form-reference.md`, and `docs/reminder-system-reference.md` are broken.

---

## Verification Summary

| Task | Status | Notes |
| :--- | :--- | :--- |
| **type-check** | PASSED | |
| **test** | PASSED | 456 tests / 50 files |
| **build** | PASSED | |
| **npm audit** | PASSED | 0 vulnerabilities (moderate level) |
| **docs:validate** | WARNING | 0 errors, 3 broken links |
| **lint** | FAILED | 52 errors / 60 warnings |
