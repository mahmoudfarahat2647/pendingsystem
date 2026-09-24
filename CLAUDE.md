# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Package manager: pnpm only.** Always use `pnpm` (`pnpm install`, `pnpm run <script>`, `pnpm exec`, `pnpm dlx`). Never use `npm`, `npx`, or `yarn`, and never create a `package-lock.json`.

```bash
pnpm run dev          # Dev server (Node max memory 4GB)
pnpm run build        # Production build
pnpm run lint         # Biome check
pnpm run lint:fix     # Auto-fix lint issues
pnpm run lint:fix:staged # Auto-fix staged files
pnpm run lint:fix:staged:unsafe # Retry staged fixes with unsafe fixes
pnpm run type-check   # TypeScript validation (no emit)
pnpm run test         # Vitest unit tests
pnpm run test:watch   # Vitest watch mode
```

**Quality gates before merging:** `lint` -> `type-check` -> `test` -> `build`.

`git commit` triggers a Husky pre-commit hook that runs Biome safe fixes on staged files first, then retries with unsafe fixes if the safe pass still reports issues.

## Architecture

**pendingsystem** is a Next.js 15 App Router logistics platform for managing automotive parts across five workflow stages: `orders` -> `main` -> `call` -> `booking` -> `archive` (route folders: `orders`, `main-sheet`, `call-list`, `booking`, `archive`). A sixth stage, `freeze`, is a parking area orthogonal to that pipeline — see [FREEZE Workflow](#freeze-workflow) below.

### Data Ownership
- **React Query** is the source of truth for all live operational stage data.
- **Supabase** (`orders`, `order_reminders`, `report_settings` tables) persists all data; access belongs only in `src/services/`.
- **Zustand** (`src/store/`) manages UI-local and persisted preference state plus the local draft-session command overlay and recovery state. Do not route new server-state through Zustand.

### Runtime Data Flow
1. Route components call React Query hooks (`useOrdersQuery`, etc.)
2. Hooks delegate to `src/services/orderService.ts` or `src/services/reports/reportSettingsService.ts`
3. Services map Supabase rows through `orderService.mapSupabaseOrder()` with Zod validation into `PendingRow`
4. Draft-capable pages apply local stage edits through `useDraftSession(stage)` and render `workingRows`
5. `saveDraft()` replays the pending command list through the existing mutation hooks
6. Stage query keys are defined in `src/lib/queryClient.ts` (for example, `["orders", "main"]`)

### Validation Layers
- `PendingRowSchema` - all persisted rows
- `OrderFormSchema` - modal form submission
- `BeastModeSchema` - strict commit check required before Orders can move to Main Sheet

Schemas are in `src/schemas/order.schema.ts` and `src/schemas/form.schema.ts`.

### Mutation Pattern
All stage mutations must follow the optimistic pattern: cancel queries -> snapshot cache -> apply optimistic update -> rollback on error -> invalidate touched stages.

Use existing hooks: `useSaveOrderMutation`, `useBulkUpdateOrderStageMutation`, `useBulkDeleteOrdersMutation`. Do not make ad hoc `queryClient` edits in page components.

### Draft Session Flow
- Route handlers for stage data should use `useDraftSession(stage)` and render `workingRows` when a draft is active.
- `applyCommand()` records local mutations in `draftSessionSlice`; nothing reaches Supabase until `saveDraft()` executes the command list.
- Recovery snapshots are stored in `localStorage["pending-sys-draft-v1"]`; restoring a snapshot rebuilds the working view and resets `past` and `future`.

### Grid
- Use `DynamicDataGrid` or `DataGrid` for all stage grids.
- Every grid must have a stable `gridStateKey` for layout persistence.
- Column definitions come from `src/components/shared/GridConfig.tsx` unless there is a route-specific reason.
- **Do not** replace the action column composite `valueGetter` with `field: "id"` - it is the refresh trigger for notes, reminders, and attachment icons.
- Use `useColumnLayoutTracker` for save/reset layout controls.

### FREEZE Workflow
`freeze` is a sixth `orders.stage` value used to park problematic or long-held lines outside the normal `orders -> main -> call -> booking -> archive` pipeline (route: `src/app/(app)/freeze/`). Status:

- **Delivered (waves 1-4, merged):** stage-type foundation, DB enum value, `/freeze` route/grid/days-frozen column, sidebar entry, VIN auto-move blocking while any line is frozen, export/report labeling, row-modal stage-fallback fix, freeze action (snowflake button + required-reason modal) on Orders/Main Sheet/Call/Booking toolbars, unfreeze via a "Move to…" picker with a neutral transition builder, exclusion from active/actionable counts, global search integration (ice-blue badge, full actionability, notification click-through), and (wave 4, `#202`, merged 2026-09-14) concurrency hardening — compare-and-set on single-row and bulk stage transitions (including the batched >50-row bulk-move path, both the forward write and its rollback), and realtime `UPDATE`/`DELETE` propagation alongside the existing `INSERT` handling.
- **`#202`'s DB prerequisites were applied directly to the live project** (not just shipped as migration files) since they'd lagged behind prior merges: `public.orders` now has `REPLICA IDENTITY FULL` so `UPDATE`/`DELETE` realtime payloads carry the prior row's stage, `orders` was added to the `supabase_realtime` publication (it had never been published, so **no** realtime event — including the pre-existing `INSERT` one — was ever actually reaching a client before this), and the already-merged `#200`'s `auto_move_orders_to_stage_if_unfrozen` RPC was deployed live (it existed only as an unapplied migration file, so any frozen-VIN-guarded bulk move was throwing in production until now).
- **Wave 5 (`#204`, verified 2026-09-15):** end-to-end verification pass and rollout-order check, closing out the feature. Confirmed in code and tests: freeze action present on Orders/Main Sheet/Call/Booking toolbars and absent from Archive; `/freeze` grid shows reason and days-frozen per row; frozen rows excluded from active-count queries; VIN auto-advance blocked while any sibling line is frozen; frozen rows are findable and fully actionable from global search; unfreeze via the "Move to…" picker preserves status/booking/attachment fields untouched; reminders keep firing on frozen rows. Migration deploy order verified: `20260913_add_freeze_to_order_stage.sql` (enum value) precedes `20260914_atomic_guarded_order_stage_move.sql`, `20260914_orders_replica_identity_full.sql`, and `20260915_add_orders_to_realtime_publication.sql` — and per the `#202` entry above, all of these were already applied directly to the live database, so no further rollout action is required. All four gates pass: `lint`, `type-check`, `test` (962 tests), `build`.
- **Feature complete** as of 2026-09-15 (full spec: issue `#191`), with one intentional follow-up: **`#220`** (2026-09-15) removed the sidebar's live Freeze row-count badge added in `#199` — the Freeze nav entry now shows only its icon and label, matching every other sidebar tab, in both expanded and collapsed sidebar states. No other open tickets remain for FREEZE.
- **Freeze-in metadata** (`previousStage`, `freezeReason`, `frozenAt`) lives in `orders.metadata` (nullable fields — see `src/schemas/order.schema.ts`), set by `buildSendToFreezeCommands` (`src/lib/orderStageTransitions.ts`) and cleared via `null` (not omission) by the neutral `buildUnfreezeCommands` on unfreeze — clearing by omission does not work, since metadata merges on write.
- **The freeze-reason requirement is enforced at three independent layers**, not just the modal: the pure builder, the draft-session `applyCommand` guard, and `orderRepository.ts`'s `assertFreezeTransitionAllowed` (plus a hard rejection of `stage: "freeze"` in the generic `updateOrderStage`/`updateOrdersStage`, which can never carry freeze metadata).
- Full feature doc: `docs/features/freeze.md`.

### Release Gate (low-mileage warranty chassis)

A chassis-level safety gate in front of every route into **Call List** (issue `#191`... see `#242`). A chassis requires a typed `release` confirmation only when, on at least one of its rows, **both** hold together: `repairSystem.trim() === "ضمان"` **and** mileage (`cntrRdg`) is present/valid and strictly below `5,000`. It is an AND, never an OR. Approval is per-attempt, never a permanent flag.

- **Domain**: `src/domain/order/releaseGate.ts` — `rowRequiresRelease`, `getQualifyingChassis` (groups by normalized VIN; a VIN qualifies only if one row satisfies both halves — legacy rows never combine one half from each), `computeReleaseFingerprint`/`buildReleaseAuthorization`, and `addCalendarMonths`/`computeReleaseFollowUpDueDate` for the two-calendar-month cadence.
- **Mileage note**: `normalizeMileageAsNumber` maps blank input to `0`, so `PendingRow.cntrRdgProvided` preserves whether the original field was present. Blank mileage does not trigger the gate; a genuine numeric `0 km` does.
- **The gate**: `ReleaseGateProvider` (`src/components/shared/release/`) + `useReleaseGate()` (`src/hooks/useReleaseGate.ts`), mounted app-wide in `MainContentWrapper` alongside the auto-move watcher. `requestCallRelease({rows, automatic})` presents one `ReleaseConfirmationModal` at a time (queued across every caller), and automatic producers (the background `useAutoMoveVins` watcher, and inline VIN auto-moves) silently skip any VIN with an existing follow-up rather than re-prompting — manual actions (toolbars, Freeze "Move to…", Global Search) always prompt.
- **Coverage**: every producer that can move a row into `call` — Main Sheet/Orders toolbars and inline VIN auto-move, the Orders grid inline status edit, the shared `useAutoMoveVins` watcher, Freeze "Move to… Call List", and both Global Search paths — passes through `requestCallRelease` before applying its command/mutation, on top of (not instead of) existing safeguards like `guardFrozenVins`.
- **Draft staleness**: `MoveRowsCommand`/`PatchRowCommand` carry an optional `releaseAuthorization: {vins, fingerprint, grantedAt}`. `applyCommand` (`draftSessionSlice.ts`) rejects a `*→call` command for a qualifying chassis without a matching authorization as a third guard beside Beast Mode and the freeze-reason check; `restoreFromRecovery` re-verifies the fingerprint against the fresh baseline and drops (never silently replays) a stale one, since a recovered snapshot bypasses `applyCommand` on replay.
- **Persistence**: `release_follow_ups` table (VIN primary key, `next_due_at`, `reference_row_id`) — RLS `Anon full access`, matching `orders`/`order_reminders`. `src/services/releaseFollowUpRepository.ts` / `releaseFollowUpService.ts`, `src/hooks/queries/useReleaseFollowUpsQuery.ts`. Cancelling a release upserts a follow-up two calendar months out; a successful release-authorized move clears it (never a failed one); `useReleaseFollowUpMaintenance` (wired in `Header.tsx` next to `useWarrantyExpiryMaintenance`) clears a follow-up once the chassis no longer satisfies the rule.
- **Notifications**: new `release_followup` `AppNotification` type, one per normalized VIN, `managedKey = release_followup:{vin}:{dueISO}`. Reaches `notificationSlice.checkNotifications` via `ordersQueryAdapter.getReleaseFollowUps()` (store never touches React Query directly). The dropdown's `X` — and "Clear All" — snooze a `release_followup` notification another two months instead of permanently dismissing it; every other notification type keeps its existing dismiss behavior. Click-through reuses `resolveNotificationStage`.
- Migration: `supabase/migrations/20260920_add_release_follow_ups.sql` (applied directly to the live project).

### Move to Main Sheet (issue `#314`)

A "Move to Main Sheet" toolbar action on Call List, Booking, Archive, and Global Search — the only other path into `main` besides Orders → Commit and Freeze → Move to…, guarded by a Settings permission so nobody moves a customer to Main Sheet by accident.

- **Permission is a per-browser safety toggle, not user authorization.** `moveToMainPermission` (Zustand `uiSlice`, persisted, default `false`) hides the button on every surface until turned on in Settings → Permissions ("Allow Move to Main Sheet", under "Allow Grid Editing"). Every confirm handler re-checks the store value at the moment of confirmation, since the toggle can change while a dialog is open.
- **Builder**: `buildMoveToMainUpdates(row, sourceStage)` / `buildMoveToMainCommands(rows, sourceStage)` in `src/lib/orderStageTransitions.ts`. Every move appends a `Moved to Main Sheet from <Stage>` history note (`#main` tag). From `archive` only, it also resets `status` to `"Pending"` and nulls `archiveReason`/`archivedAt` (now nullable in `PendingRowSchema`) while preserving the old reason in the note history; booking and attachment fields are untouched for every source.
- **Draft pages** (Call List, Booking, Archive): a plain Yes/No `ConfirmDialog` (no field validation, no type-to-confirm) wired through each page's `use*PageActions.ts` → `applyCommand`, same as every other draft-session transition.
- **Global Search**: only enabled when every selected row is currently in `call`, `booking`, or `archive` and all in the same stage (`MOVE_TO_MAIN_SOURCE_STAGES` in `useSearchResultsActions.ts`) — Orders/Main/Freeze and mixed selections are excluded. Unlike the bulk-stage-only `useBulkUpdateOrderStageMutation`, it saves each row individually through the guarded `useSaveOrderMutation` (`sourceStage` as `expectedCurrentStage`, the existing compare-and-set check) so the note/status/archive-field updates persist together with the stage move, and reports actual moved/skipped/failed counts rather than assuming full success.

### Arabic (AR) Language (i18n)

Epic `#300`, delivered in five waves (`#301` foundation, `#302` Sidebar, `#303` Notifications, `#304` Settings, `#305` action modals). Arabic is a **text-only** translation: the page layout stays LTR and pixel-identical in both languages.

- **Dictionaries**: `src/i18n/dictionaries/en.ts` is the source of truth (namespaces `common`, `sidebar`, `notifications`, `settings`, `modals`); `ar.ts` is typed as `Dictionary`, so a missing/extra key fails `type-check`, and `src/test/i18n/dictionaries.parity.test.ts` enforces key parity at runtime.
- **Lookup**: `translate(lang, key, params)` (`src/lib/i18n/translate.ts`) — pure, `{param}` interpolation, English fallback. Components use `useT()` (`src/hooks/useT.ts`) → `{ t, lang, dir }`. The language lives in the persisted Zustand `language` field (`uiSlice`, default `"en"`), switched by the EN|AR `LanguageToggle` in the Settings header.
- **Scoping**: wrap translated **leaf text** in `LocalizedScope` (adds `lang="ar" dir="rtl"` + the IBM Plex Sans Arabic `font-arabic` class in AR). Never wrap flex/grid layout containers; `<html>` stays `lang="en"` with no global `dir`. Attributes (`placeholder`, `title`, `aria-label`) just take `t(...)`.
- **Rules**: Sidebar navigation labels and collapsed tooltips are translated in AR while routes, order and layout stay unchanged. Stage names stay English inside modal text and pickers (e.g. "إفراج إلى Call List"); user content (notes, reasons, reminder subjects, quick-template text, links, file names, VINs) is never translated; toasts stay English; Western digits.
- **Action modals (Wave 5)**: `ConfirmDialog` (default Confirm/Cancel + every page caller's title/description/confirmText), `FreezeReasonModal`, `ArchiveReasonModal`, `ReorderReasonDialog` (+ callers' placeholder/helper text), `ReleaseConfirmationModal`, `UnfreezeMoveDialog`, `DuplicateOrderWarningModal`, `EditNoteModal`, `EditReminderModal`, `EditAttachmentModal`. Guards are untouched: the release word stays `release` (`RELEASE_CONFIRMATION_WORD`), ConfirmDialog's type-to-confirm word (`yes` on Commit) stays English, and the freeze/archive/reorder reason requirement is unchanged. `EditAttachmentModal` stores its inline validation error as a `TranslationKey` so it follows a language switch. Every Wave 5 dialog that renders `DialogContent`'s default X passes `closeLabel={t("common.close")}`. `EditReminderModal` passes `lang` to `DateTimePicker` (`src/components/ui/date-time-picker.tsx`), which then uses the `react-day-picker/locale` `ar` locale for the formatted date and calendar labels, with `numerals="latn"` and `weekStartsOn={0}` so digits and the Sunday-first grid match EN; AM/PM display text is translated while stored values stay `AM`/`PM`. AR render tests: `src/test/i18n/actionModals.i18n.test.tsx`.
- **Not translated** (out of epic scope): grids, page toolbars, Header, search, booking calendars, order form.
- Full doc: `docs/features/i18n.md`.

### App Shell
`src/app/layout.tsx` -> `src/app/(app)/layout.tsx` -> `AppShell` (Sidebar + Header + error boundary). All application routes live under `src/app/(app)/`.

### Authentication Architecture
- **Library**: Better Auth with username plugin, direct pg connection via `DATABASE_URL`
- **Tables**: `auth_users`, `auth_sessions`, `auth_accounts`, `auth_verifications` (prefixed to avoid collisions)
- **Server config**: `src/lib/auth.ts` — exported `auth` instance
- **Client config**: `src/lib/auth-client.ts` — exported `authClient` with `usernameClient` plugin
- **Session helper**: `src/lib/auth-session.ts` — `getServerSession()` for RSC/Route Handlers
- **Route handler**: `src/app/api/auth/[...all]/route.ts` — Better Auth catch-all
- **Protection**: Middleware (optimistic cookie check) + `(app)/layout.tsx` (authoritative DB check)
- **Admin setup**: Run `pnpm run auth:seed-admin` after setting `AUTH_ADMIN_*` env vars in `.env.local`
- **Session expiry**: 8 hours, 5-minute rolling refresh (`session.expiresIn: 60 * 60 * 8`, `session.updateAge: 60 * 5`)

### Key Cross-Cutting Components
- **`BookingCalendarModal`** - shared booking workflow modal used across multiple stages
- **`BookingInquiryModal`** / **`BookingInquiryButton`** - read-only Booking Inquiry calendar opened from the header on every protected route. Composes the same grid/customer-list/details components as `BookingCalendarModal` but ships no write controls, no notes, and no tooltips. Active vs Archived is decided by **which stage query returned a line**, never by `PendingRow.stage` (optional) or by whether the Booking Date has passed - see `docs/adr/0001-booking-inquiry-distinguishes-by-stage-not-date.md`. The modal **must only be rendered while open**: `useBookingCalendar` queries `booking` and `archive` unconditionally, so mounting it permanently would add two queries to every page load app-wide. Full doc: `docs/features/booking.md`
- **`SearchResultsView`** - aggregates all six stage queries (including `freeze`) for global header search. Its toolbar (`SearchToolbar`) chains three composable filters left to right: stage (the source dots) → company (Zeekr/Renault logo buttons, multi-select; both selected is treated as no filter, not an OR-match against only those two values, so rows with a blank/unrecognized company aren't hidden) → car model. Each stage narrows the next's options via the same render-time-intersection pattern (`useSearchResultsState.ts`), so a selection can never itself produce an empty grid. `getCompanyValue`/`getModelValue`/`getRepairSystemValue` (`src/lib/rowValueFilter.ts`) are the shared accessors this pattern is built on; `CompanyLogo` (`src/components/shared/CompanyLogo.tsx`) renders the brand marks for both this filter and the grid's COMPANY column (`CompanyLogoRenderer`). The grid (`SearchResultsGrid`) must keep its `defaultColDef` referentially stable (`useMemo` on `showFilters`): an inline object re-applied column defaults on every parent render, which re-fired `onModelUpdated` → `setSelectedRows` → re-render in a loop that froze the column filter popup (`#297`). `src/test/SearchResultsGrid.filterTyping.test.tsx` renders the real AG Grid to guard this.
- **`OrderFormModal`** - orchestrates create/edit with Beast Mode, multi-part, and duplicate detection
- **`Header`** - owns debounced global search, draft-session undo/redo/save/discard controls, exports, and notification polling

## Project Conventions

- Use `@/` alias for all source imports.
- Keep feature code in the existing layout: `app/` routes, `components/` UI, `hooks/` hooks, `services/` Supabase logic, `lib/` utilities, `schemas/` Zod, `store/` Zustand.
- Feature-specific files live in sub-folders within their top-level directory (e.g., `services/reports/`, `hooks/queries/reports/`, `test/reports/`). The `components/reports/` folder is already self-contained. The store slice and Next.js API routes stay at their top-level locations due to framework and architecture constraints.
- Use selector-based subscriptions with `useAppStore`, never the bare store without a selector.
- Booking and Call List actions require part number and description. Commit to Main Sheet also requires an attachment path and Beast Mode validation.
- Stage pages should mutate operational rows through `useDraftSession()` commands, then persist with `saveDraft()` instead of calling stage mutations directly from the page body.

## Supabase & Database

### Required Environment Variables

All vars live in `.env.local` (never committed). Exact structure:

```
# Supabase client (Dashboard → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET=attachments
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Better Auth DB connection — copy EXACT string from Supabase Dashboard → Connect → Session mode
# Format: postgresql://postgres.<project-ref>:<password>@aws-<n>-<region>.pooler.supabase.com:5432/postgres
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-<n>-<region>.pooler.supabase.com:5432/postgres
BETTER_AUTH_SECRET=<random-secret>
BETTER_AUTH_URL=http://localhost:3000
```

This project's Supabase pooler region is `eu-central-1` (host: `aws-1-eu-central-1.pooler.supabase.com`, port `5432`).

### Debug Rule — Always Check `.env.local` First

**Before trying any other fix** for a database/auth error, run:

```bash
pnpm run db:verify
```

This script parses `.env.local`, validates the `DATABASE_URL` format, attempts a live `SELECT 1`, checks all required vars, and prints row counts for every table. 90% of past failures were a malformed `DATABASE_URL`. Check it character by character before exploring other causes.

### Common Errors & Root Causes

| Error | Real Cause | Fix |
|-------|-----------|-----|
| `28P01 password authentication failed` | Wrong password in `DATABASE_URL` or URL is malformed | Copy exact string from Dashboard → Connect → Session mode — do not manually edit |
| `ENOTFOUND` / `getaddrinfo` | Wrong pooler host | Host must be `aws-<n>-<region>.pooler.supabase.com` |
| `SASL` / `invalid password` | Password has special chars not URL-encoded | Use Dashboard-provided string verbatim |
| `relation "auth_users" does not exist` | Better Auth tables not created yet | Trigger with one request to `/api/auth/get-session`, or run `pnpm run auth:seed-admin` |
| Auth passes but login fails | Better Auth `CamelCasePlugin` mismatch or wrong `modelName` | Check `src/lib/auth.ts` — model names must match prefixed table names (`auth_users`, etc.) |
| `duplicate key` on `DATABASE_URL` prefix | Duplicate `NEXT_PUBLIC_` prefix accidentally added to `DATABASE_URL` | `DATABASE_URL` must NOT have `NEXT_PUBLIC_` prefix |

### Better Auth Connection Chain

```
.env.local DATABASE_URL
  → src/lib/postgres.ts  (pg Pool with bounded max/connection/query timeouts, ssl: rejectUnauthorized: false)
  → src/lib/auth.ts      (Kysely + CamelCasePlugin + Better Auth)
```

If `SELECT 1` passes but auth still fails, the issue is in `auth.ts` config — not the connection string.

### Database Tables

| Table | Purpose |
|-------|---------|
| `orders` | All operational rows across all five stages |
| `order_reminders` | Per-row reminder records |
| `release_follow_ups` | Chassis-level (VIN-keyed) release-gate follow-up schedule — see [Release Gate](#release-gate-low-mileage-warranty-chassis) |
| `quick_templates` | Saved quick-fill order templates |
| `report_settings` | Global singleton backup/report configuration |
| `app_settings` | Application-level settings |
| `rate_limits` | Rate-limiting records |
| `auth_users` | Better Auth users |
| `auth_sessions` | Sessions (8h expiry, 5-min refresh) |
| `auth_accounts` | Auth accounts |
| `auth_verifications` | Auth verifications |

#### `orders.stage` is a Postgres enum, not text

The column type is `public.order_stage`, whose labels are `orders`, `main`, `call`, `booking`,
`archive`, `freeze`. Adding a new workflow stage requires an `ALTER TYPE ... ADD VALUE` migration — a TypeScript-only
change will fail at the database layer. A newly added label also cannot be used in the same transaction
that adds it.

#### Rich row fields live in `metadata` jsonb, not in columns

`orders` has only ~16 real columns. Everything else — `noteHistory`, `archiveReason`, `archivedAt`,
`bookingDate`, `bookingNote`, `partStatus`, `parts`, `vin`, `customerName`, and the rest of `PendingRow` —
is stored inside the `metadata` jsonb column. **Adding a field to `PendingRow` usually needs no DDL at all.**
Note that metadata is merged on write: omitting a key preserves it, and `undefined` does not reliably delete
a JSON key — persist `null` to clear one.

#### Empty legacy tables — do not write to these

`bookings`, `order_notes`, `order_attachments`, and `order_links` exist but hold zero rows and are not used.
Notes, attachments, and booking data all live in `orders.metadata` (above). Do not "restore" these tables or
route new code through them.

There is **no stage-transition history**: migration `20260129_drop_legacy_history.sql` dropped the `history`,
`activity_log`, and `recent_activity` tables along with the order-activity trigger. Changing `orders.stage`
overwrites the previous value and nothing records the transition.

### Supabase MCP

The Supabase MCP server is active in this project. Claude can directly query tables, run SQL, check logs, and inspect schema using MCP tools — **use this before manually debugging connection issues**.

---

## Known Constraints

- Authentication uses Better Auth (username+password only, admin-only, 8-hour sessions).
- Theme customization tab in Settings is a placeholder only.
- Some legacy Zustand stage arrays remain in the store for compatibility; do not expand that pattern.
- FREEZE stage transitions are now guarded by compare-and-set (single-row and bulk, including the batched rollback path) and realtime sync reacts to `UPDATE`/`DELETE` as well as `INSERT` — delivered by `#202` (2026-09-14). End-to-end verification and rollout-order check (`#204`) completed 2026-09-15; the FREEZE feature is complete with no open tickets. See [FREEZE Workflow](#freeze-workflow).

## Refactor Safety Rules

> **RESTRICTED RULE — must not be broken under any circumstance.**

When performing any refactor, optimization, or code cleanup:

- **Do not alter business logic.** The observable behavior of every feature must remain identical before and after the refactor.
- **Do not alter the UI.** No visual changes to layout, spacing, colors, component structure, text, or interactive behavior are permitted unless the user has explicitly requested them.
- **Do not silently change data flow.** Do not swap, reorder, or remove data transformations, validation steps, or side effects even if they appear redundant.
- **Warn before proceeding.** If any planned change would touch logic or UI in a way that goes beyond pure structural cleanup, stop and surface a clear warning:

  > ⚠️ RESTRICTED RULE: This change affects logic or UI. Proceeding would violate the refactor safety rule. Confirm before continuing.

- This warning is mandatory whether the change is proposed in a plan, a code edit, or a code review suggestion.

## Architecture Standards

> **RESTRICTED RULE — must not be broken.** Full reference: `.claude/rules/architecture.md`.

### Dependency direction (one line per layer)
- `domain/` → only `types/`. Pure; no React/Supabase/env/localStorage.
- `schemas/` → `domain`, `types`. No `lib`/`services`/`store`/UI.
- `services/` → `domain`, `schemas`, `lib`, `types`. No store/components/hooks.
- `lib/` → `domain`, `schemas`, `types`. No `services`/`store`/UI.
- `store/` → upward layers + types-only from services. No `lib/queryClient` runtime client; no React Query cache access from slices.
- `hooks/` → everything above. No components/app.
- `components/` → only via `hooks/`; no direct `services/*` runtime calls.
- `app/` → routes only; handlers ≤50 LOC, delegate to services.

### Top forbidden patterns (catalog: `.claude/rules/architecture.md` §c)
- No `console.*` in `src/` — use `@/lib/logger`.
- No inline `createServiceClient` in API routes — use `@/lib/supabase-admin`.
- No `queryClient` import in `store/slices/`.
- No operational stage rows in Zustand — React Query owns them.
- No `null` returns on validation failure — throw a typed error.
- No business logic in API route handlers, page-handler hooks, or schemas.
- No new service file > 500 LOC; split into repo/mapper/use-case.
- No back-compat re-exports; update call sites.

### Required patterns for new work
- Stage transitions → `@/lib/orderStageTransitions` command builders.
- Mutations → existing optimistic hooks (`useSaveOrderMutation`, `useBulk*`).
- Snake/camel mapping → `mapKeysToCamel<T>` from `@/lib/utils`.
- Stage enum → `z.enum(["orders","main","call","booking","archive"])`.
- New API route → `parse → authorize → service.call() → respond`, ≤50 LOC.

If a planned change would break any of the above, **stop and warn** using the same RESTRICTED RULE format as the Refactor Safety Rules.

## Important Note

After major changes, update this file (`CLAUDE.md`). Keep it up-to-date with the project's current status.

## Workflow Conventions

- When a review or audit skill is invoked (`/bug-review`, `/production-code-audit`, `/requesting-code-review`, etc.), deliver **only** the findings report unless the user explicitly asks to apply fixes.
- For bug-review and adversarial review workflows: verify each finding is a real issue in the current codebase before proposing any fix. Do not propose fixes for unreachable code, dead paths, or already-compensated issues.
- After any code edit, run `pnpm run type-check` and `pnpm run lint` on the changed files before declaring the task done. Both must pass cleanly.

## Planning

- Keep planning proportional to task complexity. For simple UI additions or single-file changes, skip brainstorming and implement directly.
- When presenting multiple approaches, offer 2–3 concise options with trade-offs and wait for the user to select before deep-diving into the chosen path.
- If asked to "save a plan", write it to a `.md` file in the **project root** and exit plan mode before beginning implementation. This makes the plan accessible from other sessions.

## Build & Long-Running Tasks

- `pnpm run build` can take several minutes. Before starting, announce what you are running and the expected wait time.
- Prefer `pnpm run type-check` (`tsc --noEmit`) for fast type validation unless production output is the explicit goal.
- For lint validation prefer `pnpm run lint` (read-only Biome check) over `pnpm run lint:fix` unless the task is specifically to auto-fix.

## Documentation Structure

- `/docs/features/` → feature-level docs
- `/docs/architecture.md` → system patterns
- `/docs/api.md` → API reference

## Obsidian Vault & pendingsystem-vault Skill

The project has an Obsidian vault at `docs/` (gitignored, local only) connected via the `obsidian` MCP server (`@bitbonsai/mcpvault`).

Use the **`pendingsystem-vault` skill** automatically at these moments:

| Moment | Action |
|--------|--------|
| Before implementing any feature | Search vault for existing docs on that feature, read them |
| After completing a feature or significant fix | Patch or create the relevant `docs/features/<name>.md` |
| User asks "how does X work" about this project | Search vault first, answer from docs + code |
| Before architectural decisions | Read `docs/architecture.md` |
| User mentions a named feature (booking, beast-mode, auth, etc.) | Read `docs/features/<name>.md` |

The vault MCP tools to use: `mcp__obsidian__search_notes`, `mcp__obsidian__read_note`, `mcp__obsidian__write_note`, `mcp__obsidian__patch_note`, `mcp__obsidian__list_directory`.

Do not write to `docs/.obsidian/`. Do not invent doc content — only document what was actually built.

## Protected Dependencies

**Do not remove `nodemailer` from `package.json`** — it is a runtime dependency used exclusively by `scripts/generate-backup.mjs` (the daily Backup & Reports GitHub Actions workflow). It has been wrongly stripped by knip/depcheck audits three times (`ca64f6b`, `0f54b58`), breaking the backup each time. The `knip` entry config covers `scripts/*.mjs`, but audits have ignored it. Treat this as a protected dep: do not remove it during any codebase audit, dependency cleanup, or automated fix pass.

**Keep `.github/workflows/backup-reports.yml` aligned with the repository package manager.** The project uses the pinned pnpm version in `package.json` and `pnpm-lock.yaml`; package-manager migrations must update the workflow setup, cache, and install steps together. `src/test/reports/backupWorkflow.test.ts` enforces this contract.

## Rules

- Before implementing any feature, check `/docs/features/` for existing context
- After completing a feature, update the relevant doc file
