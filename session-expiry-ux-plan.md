# Session Expiry UX — Revised Plan

## Context

Today Better Auth is configured for a **silent hard cutoff**: `expiresIn: 3600` with `disableSessionRefresh: true` ([src/lib/auth.ts:29-33](src/lib/auth.ts#L29-L33)). The only place the client reads the session is [src/components/shared/Sidebar.tsx:87](src/components/shared/Sidebar.tsx#L87) for the user's initials, so an expired session looks fine until the next page load, Server Component render, or protected API call — at which point middleware/layout redirects the user to `/login` and any unsaved in-memory work is lost.

The saving grace is that `draftSessionSlice._persistRecovery()` already writes `localStorage["pending-sys-draft-v1"]` on every command ([src/store/slices/draftSessionSlice.ts:311-324](src/store/slices/draftSessionSlice.ts#L311-L324)) and [src/hooks/useDraftSession.tsx:72-88](src/hooks/useDraftSession.tsx#L72-L88) restores it on reload, so drafts already survive redirects. What's missing is the *user-facing signal* that a session is ending, and a graceful path back in.

The goal: keep the session alive while the user is actively working, warn before it ends, and if it does expire, stop edits and require in-app re-auth instead of silently breaking the current page.

## Review of the original plan

The original plan's direction is right. Adjustments based on what's actually in the repo:

- **Draft preservation already works.** Recovery is auto-persisted on every command; no new "flush before redirect" step is required. The plan's "preserve work before re-auth" bullet is already satisfied by existing code — we just need to make sure we don't clear `localStorage["pending-sys-draft-v1"]` on sign-out.
- **Supabase is not an auth-error source.** All operational data uses the Supabase anon key with `persistSession: false` ([src/lib/supabase.ts](src/lib/supabase.ts)). A 401 from the Next.js API auth layer can only come from `/api/auth/*` or the two custom routes ([src/app/api/trigger-backup/route.ts:11](src/app/api/trigger-backup/route.ts#L11), [src/app/api/storage-stats/route.ts:128](src/app/api/storage-stats/route.ts#L128)). The "centralize 401 handling from mutations/queries" bullet is narrower than the original plan implies.
- **Sign-in route is `/login`, not `/sign-in`.** Layout guard already redirects to `/login` on missing session ([src/app/(app)/layout.tsx:21](src/app/(app)/layout.tsx#L21)).
- **Toast system is Sonner**, mounted in [src/app/layout.tsx:50](src/app/layout.tsx#L50). Reuse it for the warning banner/toast rather than building a new overlay for the first cut.
- **`authClient.useSession()` is already wired** in the Sidebar — we can add a second subscription in a guard component without extra plumbing.
- **`router.replace("/login")` from [src/components/shared/SidebarUserMenu.tsx:22](src/components/shared/SidebarUserMenu.tsx#L22) after `authClient.signOut()`** is the existing sign-out path; the new expired-session flow should reuse it.

## Recommended approach

Confirmed scope: **8-hour sliding session, Phase 1 only**. We keep the three-state mental model (`active | expiringSoon | expired`) but implement it as a single guard component mounted inside the authenticated shell. The full-screen re-auth overlay, 401 interception, return-to-route, and cross-tab sync are documented as a follow-up (Phase 2) but **not in scope for this PR**.

### Phase 1 — Sliding session + warning (in scope)

1. **[src/lib/auth.ts:29-33](src/lib/auth.ts#L29-L33)** — change `session` config:
   - `expiresIn: 60 * 60 * 8` (8 hours)
   - Remove `disableSessionRefresh: true`
   - Add `updateAge: 60 * 5` (refresh when session is older than 5 min, on access)
2. **New [src/hooks/useSessionStatus.ts](src/hooks/useSessionStatus.ts)** — thin wrapper over `authClient.useSession()` that computes `{ status: "active" | "expiringSoon" | "expired", expiresAt, secondsRemaining }` from `session.expiresAt`. Re-evaluates every 30 s via `setInterval` and on `visibilitychange`. Thresholds: `expiringSoon` when `≤ 5 min` left, `expired` when `≤ 0`.
3. **New [src/components/shared/SessionGuard.tsx](src/components/shared/SessionGuard.tsx)** — client component, returns `null`. Uses `useSessionStatus()`:
   - On transition into `expiringSoon`: show a sticky Sonner toast ("Your session ends in Xm. Stay signed in?") with a **Stay signed in** action that calls `authClient.getSession()` to refresh and a **Sign out** action that calls `authClient.signOut()` + `router.replace("/login")`. Update the countdown every 30 s by re-issuing the toast with the same `id`.
   - On transition into `expired`: dismiss the warning toast and call `authClient.signOut()` + `router.replace("/login?expired=1")`.
4. **Mount the guard** inside [src/components/shared/AppShell.tsx](src/components/shared/AppShell.tsx) alongside `Sidebar`/`Header`, so it's only active for authenticated routes.
5. **[src/components/auth/LoginForm.tsx](src/components/auth/LoginForm.tsx)** — when `searchParams.expired === "1"`, show an inline notice ("Your session expired. Please sign in again.") above the form.

### Phase 2 — Deferred (documented, not implemented in this PR)

6. **Extend `SessionGuard`** — on `expired`, instead of redirecting, render a full-screen re-auth overlay (new `SessionExpiredOverlay`) that:
   - Disables pointer events on the app behind it.
   - Shows the draft status: "You have N unsaved changes. They'll be restored after you sign in again." (read `useDraftSession().dirty` / pending command count).
   - Offers **Sign in again** (calls `authClient.signOut()` then `router.replace("/login?expired=1&returnTo=<current-path>")`) and **Discard and sign out** (calls `discardDraft()` then signs out).
7. **Preserve `localStorage["pending-sys-draft-v1"]` across sign-out.** Audit `authClient.signOut()` callers and confirm no code path calls `_clearRecovery()` on unauthorized flows. Add a comment in [src/store/slices/draftSessionSlice.ts](src/store/slices/draftSessionSlice.ts) documenting that recovery survives sign-out by design.
8. **Return-to-route after login** — in [src/components/auth/LoginForm.tsx:36](src/components/auth/LoginForm.tsx#L36), read `searchParams.returnTo` (validated to start with `/` and not be `/login`) and `router.replace(returnTo ?? "/dashboard")`. Existing draft-recovery toast in `useDraftSession` will fire automatically on the restored page.
9. **Centralize 401 handling for custom API routes.** Add a `mutationCache.onError` on the shared `QueryClient` in [src/lib/queryClient.ts](src/lib/queryClient.ts) that inspects errors for a `status === 401` marker and, if found, flips `SessionGuard` into `expired` via a small Zustand flag (`authStatusSlice.setForcedExpired(true)`). Only `useBackupMutation` and the storage-stats query currently hit protected Next.js routes, so the blast radius is small.
10. **Cross-tab sync.** In `SessionGuard`, listen for `storage` events on a new key `"pending-sys-auth-status-v1"`. When any tab sets it to `"expired"`, all tabs enter `expired`. Write the key whenever the guard transitions into `expired`.

### Files to add (Phase 1)

- `src/hooks/useSessionStatus.ts`
- `src/components/shared/SessionGuard.tsx`

### Files to modify (Phase 1)

- `src/lib/auth.ts` — session config
- `src/components/shared/AppShell.tsx` — mount `SessionGuard`
- `src/components/auth/LoginForm.tsx` — inline `?expired=1` banner

### Existing utilities to reuse

- `authClient.useSession()` and `authClient.signOut()` — [src/lib/auth-client.ts](src/lib/auth-client.ts)
- `useDraftSession().dirty` and `discardDraft()` — [src/hooks/useDraftSession.tsx](src/hooks/useDraftSession.tsx)
- Existing recovery toast restoration — [src/hooks/useDraftSession.tsx:72-139](src/hooks/useDraftSession.tsx#L72-L139)
- Sonner `toast.message` with `action`/`cancel` — already used across `Header.tsx`, `draftSessionSlice.ts`

### What we are **not** doing

- No new session-storage scheme (Better Auth's `expiresAt` is the single source of truth).
- No server-side `updateAge` refresh webhook — Better Auth does this itself once `disableSessionRefresh` is removed.
- No rewrite of per-mutation `onError` toasts — they keep handling domain errors; only 401 transits the new auth-status channel.

## Verification (Phase 1)

1. **Sliding refresh.** `npm run dev`, sign in, and refresh after a few minutes of activity. Inspect `auth_sessions.expires_at` in Supabase via MCP — it should advance on access once the session is older than `updateAge`. Leaving the tab active past the old 1-hour mark no longer triggers surprise sign-out.
2. **Warning toast.** Temporarily set `expiresIn: 60 * 6` locally; sign in and wait ~1 min. Sonner toast appears with countdown and two actions. **Stay signed in** extends the session (check `expires_at` in Supabase); **Sign out** lands on `/login` with no banner.
3. **Expired flow.** With the shortened expiry, wait past zero. App redirects to `/login?expired=1`; login page shows the inline "session expired" notice. After login, user lands on `/dashboard`. Any in-progress draft is preserved in `localStorage["pending-sys-draft-v1"]` and the existing recovery toast offers to restore it on the next protected page.
4. **Quality gates.** `npm run lint` → `npm run type-check` → `npm run test` → targeted E2E via `playwright-cli+msedge` covering the three flows above, per the project's E2E convention.

## Assumptions carried from the original plan

- This is an internal tool; sliding 8-hour sessions are acceptable (no compliance-mandated hard cutoff).
- A 5-minute warning and 30-second re-check interval are the right defaults. If policy later requires a true hard cutoff, we keep the warning + overlay + draft-preservation and simply restore `disableSessionRefresh: true`.
