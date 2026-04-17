# Workflow-Focused Performance and Structure Cleanup

> **Reviewed and validated against live codebase on 2026-04-17.**
> Each item below was verified by code inspection. False positives and invalid claims from the original audit have been removed or corrected.

---

## Summary

- Audit baseline: `npm run type-check` passes, `npm test` passes (`43` files, `410` tests), and `npm run lint` currently fails with `47` errors and `63` warnings.
- Highest-value issues are structural: repeated notification scans from multiple page owners, unused packages, and unexported-but-exported symbols.
- The large `useSearchResultsState` aggregation and stage-page duplication are real but lower-priority for a 2–3 user app.

---

## Tier 1 — Quick Wins (Low Risk, High Confidence)

### Remove unused packages: `dotenv` and `@types/dotenv`

**Status: Confirmed.** No `import dotenv` or `require('dotenv')` exists anywhere in `src/` or the scripts folder. `seed-admin-user.mjs` even has an inline comment noting dotenv is not available. Safe to remove both from `package.json`.

### Internalize `NOTIFICATION_FRESHNESS_WINDOW_MS` and `NotificationPollingState`

**Status: Confirmed.** Both are exported from `headerNotificationPolling.ts` but no other file imports them — they are only used internally within the same file. Removing the `export` keyword is a zero-risk 2-line change.

### Internalize `SEARCH_FIELDS`

**Status: Confirmed.** Exported from `searchUtils.ts` but never imported by any other file. Remove the `export` keyword. Zero risk.

### Make `Header` the single owner of notification checks

**Status: Confirmed.** All 5 stage pages (`orders`, `main-sheet`, `call-list`, `booking`, `archive`) independently call `checkNotifications()` inside a `useEffect` triggered by their respective row data. Since only one page is mounted at a time this does not cause bugs today, but the responsibility is scattered and will silently duplicate if a 6th page is added. `Header.tsx` already has `headerNotificationPolling.ts` wired in. Remove the 5 page-level `checkNotifications` effects and let Header own it exclusively.

---

## Tier 2 — Optional (Worthwhile but Not Urgent)

### `useSearchResultsState` — all-stage data subscription

**Status: Confirmed.** The hook calls `useOrdersQuery` for all 5 stages simultaneously (lines 69–73) and rebuilds a combined array + runs a full string scan inside `useMemo` on every render. For current dataset sizes this is likely imperceptible, but the pattern is genuinely inefficient. Consider a cached all-stage snapshot plus an id lookup map if search response ever feels slow.

### Guard the `draft-session-test` route

**Status: Partially confirmed.** The route at `/draft-session-test` already redirects unauthenticated users to `/login`. However it remains accessible to any logged-in user in production. Adding a `process.env.NODE_ENV !== 'production'` guard (or a dedicated environment flag) would close this properly.

### Stage-page orchestration duplication

**Status: Confirmed but high-effort.** Each of the 5 stage pages independently owns its own copy of `useOrdersQuery`, `useDraftSession`, `handleUpdateOrder`, `handleSendToArchive`, selection syncing, and notification trigger. A shared `useStageWorkspace(stage)` hook would reduce this significantly. However the refactor carries non-trivial risk (each page has stage-specific logic, e.g. orders has partStatus auto-move, call-list has reorder flow) and is cosmetic for a 2–3 user app. Defer unless the team grows or a new stage is added.

---

## Do Not Touch

| Item | Reason |
|---|---|
| `nodemailer` | `scripts/generate-backup.mjs` imports it directly. **Do not remove.** Update knip config to include script entrypoints if you want knip to stop flagging it. |
| `SessionStatus` type export | This is the public return-type contract of `useSessionStatus`. Consumers that need to type a local variable would import it. Keep the export. |
| `orderService` internal split | The file is 623 lines but already has clear internal helpers (`isMissingAttachmentColumnError`, `handleSupabaseError`, two select-clause constants, `mapSupabaseOrder`). The `saveOrder` multi-round-trip pattern is intentional (documented in comments). Splitting further is cosmetic. |
| `console.warn/error` calls | All logging found in `src/` is in error-handling paths (DB failures, validation fallbacks, error boundaries). These are intentional diagnostics, not stray debug output. |
| `test-biome.ts` | Does not exist anywhere in the repo. Already deleted prior to this audit. |
| `session-expiry-ux-plan.md` | Does not exist anywhere in the repo. Already moved or deleted prior to this audit. |

---

## Test Plan

- Keep `npm run type-check` green.
- Keep `npm test` green at the current baseline (`43` files, `410` tests).
- Make `npm run lint` pass with zero errors before closing the cleanup pass.
- After removing the page-level `checkNotifications` effects, verify notification badges still appear correctly on all 5 stage pages.
- Run a final `npm run build` to confirm no regressions.

---

## Assumptions

- Existing routes, query keys, Zustand persistence keys, and Supabase tables stay unchanged.
- The draft-session harness is kept but optionally gated behind a non-production environment check.
- `nodemailer` stays until knip config is updated to include script entrypoints.
