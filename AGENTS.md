# AGENTS.md

This file guides Codex (Codex.ai/code) when working in this repository.

## Commands

```bash
npm run dev                     # Next.js dev server, Node max memory 4GB
npm run build                   # Production build
npm run start                   # Start the production server
npm run lint                    # Biome check
npm run lint:fix                # Biome check with writes
npm run lint:fix:staged         # Biome safe fixes on staged files
npm run lint:fix:staged:unsafe  # Biome unsafe fixes on staged files
npm run type-check              # TypeScript validation, no emit
npm run test                    # Vitest unit/component tests
npm run test:watch              # Vitest watch mode
npm run test:ui                 # Vitest UI
npm run docs                    # Print main docs entrypoints
npm run docs:serve              # Serve repo/docs content on port 8080
npm run docs:validate           # Validate README/docs structure
npm run docs:extract            # Extract JSDoc-derived docs data
npm run docs:sync               # Sync src/ changes into docs vault through prompts
npm run db:verify               # Verify .env.local, DATABASE_URL, and table access
npm run auth:seed-admin         # Seed the initial Better Auth admin user
npm run import:sheet            # Dry-run legacy CSV import to Supabase main stage
npm run import:sheet -- --yes   # Execute legacy CSV import
npm run commit                  # PowerShell helper that stages, commits, then optionally pushes
npm run testsprite              # Prints TestSprite MCP guidance
```

`npm run prepare` installs Husky hooks. Normal commits run the Husky pre-commit hook, which applies Biome safe fixes to staged files and retries with unsafe fixes if needed.

**Quality gates before merging:** `npm run lint` -> `npm run type-check` -> `npm run test` -> `npm run build`. Add `npm run docs:validate` whenever README/docs guidance changes. For docs-only edits, run at least `npm run docs:validate`; run the full gates when touching source behavior.

`npm run build` can take several minutes. Announce it before starting and prefer `npm run type-check` for fast TypeScript validation unless production output is the goal.

## Architecture

**pendingsystem** is a private Next.js 15 App Router logistics platform for automotive parts across five operational stages:

```text
orders -> main -> call -> booking -> archive
```

The internal stage keys are `orders`, `main`, `call`, `booking`, and `archive`. Their protected route folders are `orders`, `main-sheet`, `call-list`, `booking`, and `archive` under `src/app/(app)/`. `dashboard` is also a protected app route. Public route groups include `(auth)` pages and `/mobile-order`.

### Data Ownership

- **React Query** is the source of truth for live server state: operational orders, dashboard stats, app settings, and report settings.
- **Supabase** persists operational rows, reminders, app settings, report settings, rate limits, auth tables, and attachments. Do not access Supabase directly from page components. Put reusable data access in `src/services/`; server-only route handlers may use service-role Supabase clients or the pg pool when required.
- **Zustand** in `src/store/` manages UI-local state, persisted preferences, grid layouts, notifications, settings/report UI state, and the local draft-session command overlay. Do not route new server state through Zustand.
- **Route Handlers** under `src/app/api/` own server-only workflows such as Better Auth, password reset, mobile order intake, app/report settings, storage stats, and GitHub backup dispatch.

### Runtime Data Flow

1. Route components call React Query hooks such as `useOrdersQuery`, `useDashboardStatsQuery`, `useAppSettingsQuery`, or `useReportSettingsQuery`.
2. Query hooks delegate to services in `src/services/` or protected API routes.
3. `orderService` reads Supabase rows, joins active reminders, maps attachment columns, and validates via `PendingRowSchema` in `mapSupabaseOrder()`.
4. Stage pages use `useDraftSession(stage)` and render `workingRows` while local drafts are active.
5. `applyCommand()` records local commands only; `saveDraft()` replays the command list through existing mutation hooks.
6. Query keys are centralized in `src/lib/queryClient.ts`: `getOrdersQueryKey(stage)`, `ORDER_STAGES`, and the shared `queryClient`.

### Query Keys

| Key | Purpose |
| --- | --- |
| `["orders", "orders"]` | Orders intake stage |
| `["orders", "main"]` | Main Sheet stage |
| `["orders", "call"]` | Call List stage |
| `["orders", "booking"]` | Booking stage |
| `["orders", "archive"]` | Archive stage |
| `["dashboard-stats"]` | Stage counts for dashboard |
| `["app_settings"]` | Models, repair systems, requesters |
| `["report_settings"]` | Backup/report configuration |

### Validation Layers

- `PendingRowSchema` (`src/schemas/order.schema.ts`) validates and normalizes all persisted operational rows.
- `PartEntrySchema` keeps multi-part order rows structured while legacy `partNumber` / `description` stay synced from the first part.
- `ReminderInputSchema` validates future reminder form input without rejecting historical persisted reminders.
- `OrderFormSchema` (`src/schemas/form.schema.ts`) validates normal order modal submission.
- `BeastModeSchema` is the strict commit guard before rows move from Orders to Main Sheet.
- `MobileQuickOrderSchema` (`src/schemas/mobileOrder.schema.ts`) validates public mobile intake.
- `LoginFormSchema`, `ForgotPasswordFormSchema`, and `ResetPasswordFormSchema` validate auth forms.

### Mutation Pattern

Stage mutations must follow the optimistic pattern:

```text
cancel queries -> snapshot affected cache -> optimistic setQueryData -> rollback on error -> invalidate touched stages
```

Use existing hooks: `useSaveOrderMutation`, `useBulkUpdateOrderStageMutation`, and `useBulkDeleteOrdersMutation`. Settings/report mutations have their own query hooks. Do not make ad hoc `queryClient` writes in page components.

### Draft Session Flow

- Stage pages call `useDraftSession(stage)` and render `workingRows` when drafts exist.
- `draftSessionSlice` captures a React Query baseline on the first command, derives working rows by replaying commands, and keeps undo/redo history capped at 30 entries.
- `applyCommand()` is local-only and returns `false` when a guard rejects the command.
- Orders -> Main Sheet moves require Beast Mode validation, part number, description, and at least one attachment.
- `saveDraft()` executes commands in order, tracks temp-id to real-id mappings for created rows, stores retry checkpoints, and invalidates touched stage caches after success.
- Recovery snapshots live in `localStorage["pending-sys-draft-v1"]`; workspace identity lives in `localStorage["pending-sys-workspace-id"]`. Restoring a snapshot captures a fresh baseline and resets `past` / `future`.

### Grid

- Use `DynamicDataGrid` or `DataGrid` for all stage grids.
- Every persistent grid must provide a stable `gridStateKey`.
- Shared stage columns come from `src/components/shared/GridConfig.tsx` unless a route-specific shape is required.
- The STATS column is backed by `PendingRow.status`. Do not reintroduce a separate `partStatus` row field or PART STATUS grid column.
- **Do not** replace the action column composite `valueGetter` with `field: "id"`. The composite value refreshes note, reminder, and attachment icons.
- Use `useColumnLayoutTracker` for save/reset layout controls.
- Global search uses `SearchResultsView` plus dedicated search grid columns. Do not restrict its columns or remove its checkbox without an explicit product request.

### App Shell

```text
src/app/layout.tsx
  -> QueryProvider + Sonner Toaster
  -> src/app/(app)/layout.tsx
     -> authoritative getServerSession() DB check
     -> AppShell
        -> SessionGuard + Sidebar + Header + MainContentWrapper + ClientErrorBoundary
```

Protected app routes live under `src/app/(app)/`. Auth pages live under `src/app/(auth)/`. `/mobile-order` is public and has its own layout. Settings is currently a shared modal, not a route.

### Authentication Architecture

- **Library:** Better Auth with email/password disabled signup plus username plugin.
- **Database:** direct pg connection through `DATABASE_URL`, `src/lib/postgres.ts`, Kysely, and `CamelCasePlugin`.
- **Tables:** `auth_users`, `auth_sessions`, `auth_accounts`, `auth_verifications`.
- **Server config:** `src/lib/auth.ts` exports `auth`.
- **Client config:** `src/lib/auth-client.ts` exports `authClient` with `usernameClient()`.
- **Session helper:** `src/lib/auth-session.ts` exports `getServerSession()` for RSC and Route Handlers.
- **Route handler:** `src/app/api/auth/[...all]/route.ts` is the Better Auth catch-all.
- **Protection:** middleware performs an optimistic cookie check; `(app)/layout.tsx` performs the authoritative DB session check.
- **Public paths:** `/login`, `/forgot-password`, `/reset-password`, `/api/auth/*`, `/api/health/*`, `/api/password-reset/*`, `/mobile-order/*`, `/api/mobile-order/*`.
- **Admin setup:** run `npm run auth:seed-admin` after setting `AUTH_ADMIN_*` values in `.env.local`.
- **Password reset:** `/api/password-reset/request` looks up username via pg and sends reset mail through Better Auth + Resend.
- **Session timing:** `expiresIn` is 8 hours and `updateAge` is 5 minutes in `src/lib/auth.ts`.

### API Routes

| Route | Auth | Purpose |
| --- | --- | --- |
| `/api/auth/*` | Better Auth internal | Login, logout, session, password operations |
| `/api/health` | Public | Health check |
| `/api/password-reset/request` | Public | Username-based reset request, generic response, in-memory rate limit |
| `/api/mobile-order` | Public | Mobile order intake, DB-backed rate limit, app-setting merge |
| `/api/storage-stats` | Protected | DB/storage usage via service-role Supabase client |
| `/api/app-settings` | Protected | Singleton settings for models, repair systems, requesters |
| `/api/report-settings` | Protected | Backup/report singleton config |
| `/api/trigger-backup` | Protected | Dispatch GitHub Actions backup workflow |

All server-side mutations go through Route Handlers; the codebase does not use `"use server"` Server Actions.

### Key Cross-Cutting Components

- `AppShell`, `Sidebar`, `Header`, `SessionGuard`, and `ClientErrorBoundary` compose the protected shell.
- `Header` owns debounced global search, draft-session undo/redo/save/discard controls, exports, and notification polling.
- `SearchResultsView` aggregates all five stage queries for global search.
- `OrderFormModal` handles create/edit with Beast Mode, multi-part rows, duplicate checks, attachments, and reminders.
- `BookingCalendarModal` is shared across stage workflows.
- `SettingsModal` manages part statuses, booking statuses, report settings, storage stats, and app settings.

## Project Conventions

- Use `@/` alias for all source imports.
- Keep feature code in the existing layout: `app/` routes, `components/` UI, `hooks/` hooks, `services/` data access, `lib/` utilities, `schemas/` Zod, `store/` Zustand, and `test/` Vitest.
- Feature-specific files live in subfolders within their top-level area, for example `services/reports/`, `hooks/queries/reports/`, `components/reports/`, and `test/reports/`.
- Use selector-based subscriptions with `useAppStore`; never use the bare store in React components without a selector.
- New source behavior should have focused Vitest coverage in `src/test/` or a feature subfolder.
- Booking and Call List actions require part number and description.
- Commit to Main Sheet requires part number, description, attachment, and Beast Mode validation.
- Stage pages should mutate operational rows through `useDraftSession()` commands and persist through `saveDraft()`.
- Keep Supabase row-shape transforms centralized in `orderService.mapSupabaseOrder()` and related schemas.

## Documentation

The tracked root reference is `README.md`. The local `docs/` directory is an Obsidian vault and is gitignored by default, but this workspace contains it and it should be kept current when present.

When behavior changes, update the relevant docs:

- `README.md` for setup, commands, workflow, and contributor-facing guidance.
- `docs/architecture.md` for architecture, data flow, query keys, auth, or database changes.
- `docs/api.md` for Route Handler contracts.
- `docs/features/*.md` for feature behavior.
- `docs/wiki/**` when the Obsidian/wiki material should reflect the same change.
- `AGENTS.md` after major architecture, workflow, command, auth, database, or documentation-process changes.

### Obsidian Docs Workflow

| Folder | Purpose | Who writes |
| --- | --- | --- |
| `docs/features/` | Stable feature references | Codex updates after implementation |
| `docs/wiki/` | Wiki-style generated/curated knowledge base | Codex updates intentionally |
| `docs/raw/` | Raw source material for the wiki | User or Codex, depending on source |
| `docs/superpowers/specs/` | Design specs with lifecycle frontmatter | User writes in Obsidian |
| `docs/superpowers/plans/` | Implementation plans derived from specs | Codex writes via planning skills |
| `docs/_templates/` | Obsidian templates when present | User/Codex as needed |

**Spec lifecycle:** `draft` -> `approved` -> `implemented`. When implementing from a spec, read the spec first, implement the change, update its `status:` frontmatter to `implemented`, and update relevant reference docs.

`npm run docs:sync` is commit-range based. It checks for `src/` changes and uses `scripts/prompts/docs-triage.md` plus `scripts/prompts/docs-ingest.md` to decide which docs need updates. It is allowed to skip when the local docs vault is absent.

## Supabase & Database

### Required and Common Environment Variables

All vars live in `.env.local` and must never be committed. Keep `.env.example` aligned with real requirements.

```env
# Public Supabase client config
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET=attachments

# Public app/client settings
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SETTINGS_PASSWORD=

# Server Supabase / auth / API config
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-<n>-<region>.pooler.supabase.com:5432/postgres
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<at-least-32-chars>
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@example.com

# GitHub backup trigger
GITHUB_PAT=<token-with-workflow-scope>
GITHUB_OWNER=<owner>
GITHUB_REPO=pendingsystem

# GitHub Actions backup-report email secrets are documented in .env.example/workflow
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=mailer@example.com
SMTP_PASS=<smtp-password>

# Admin seed script
AUTH_ADMIN_USERNAME=admin
AUTH_ADMIN_EMAIL=admin@example.com
AUTH_ADMIN_PASSWORD=<password>
AUTH_ADMIN_NAME=Admin
```

The known Supabase pooler region for this project is `eu-central-1` (host pattern `aws-<n>-eu-central-1.pooler.supabase.com`, port `5432`).

### Debug Rule: Always Check `.env.local` First

Before trying any other fix for a database/auth error, run:

```bash
npm run db:verify
```

The verifier parses `.env.local`, validates the `DATABASE_URL` shape, checks required vars, attempts a live DB connection, and prints row counts for auth and core app tables. Most historical database/auth failures were malformed `DATABASE_URL` values, wrong pooler hosts, or unencoded passwords.

### Common Errors and Root Causes

| Error | Real Cause | Fix |
| --- | --- | --- |
| `28P01 password authentication failed` | Wrong password or malformed `DATABASE_URL` | Copy the exact Supabase Dashboard connection string |
| `ENOTFOUND` / `getaddrinfo` | Wrong pooler host | Use `aws-<n>-<region>.pooler.supabase.com` |
| `SASL` / `invalid password` | Password has special chars not URL-encoded | Use the Dashboard-provided string verbatim |
| `relation "auth_users" does not exist` | Better Auth tables not created | Apply migrations or trigger Better Auth table creation, then run `npm run auth:seed-admin` |
| Auth DB connection passes but login fails | Better Auth config/table mapping mismatch | Check `src/lib/auth.ts` model names and `CamelCasePlugin` |
| `NEXT_PUBLIC_DATABASE_URL` appears | Secret DB URL exposed with public prefix | Remove it; only `DATABASE_URL` is valid |

### Connection Chain

```text
.env.local DATABASE_URL
  -> src/lib/postgres.ts  (pg Pool with bounded pool/connection/query timeouts)
  -> src/lib/auth.ts      (Kysely + CamelCasePlugin + Better Auth)
```

Supabase client config flows through `src/lib/env.ts`, `src/lib/supabase.ts`, and `src/lib/supabase-browser.ts`.

### Database Tables and Storage

| Table / Storage | Purpose |
| --- | --- |
| `orders` | All operational rows across all five stages |
| `order_reminders` | Per-row reminder records |
| `report_settings` | Backup/report singleton configuration |
| `app_settings` | Models, repair systems, requesters singleton |
| `rate_limits` | DB-backed mobile-order rate limiting |
| `recent_activity` | Legacy/activity log table from migrations |
| `auth_users` | Better Auth users |
| `auth_sessions` | Better Auth sessions |
| `auth_accounts` | Better Auth accounts |
| `auth_verifications` | Better Auth verifications |
| Supabase Storage bucket `attachments` | Order attachment files |

### Supabase MCP

The Supabase MCP server may be available in this project. When it is available, prefer it for schema inspection, logs, SQL checks, and table queries before manually debugging connection issues.

## Known Constraints

- Authentication is username/password only, with admin-created accounts and disabled public signup.
- User-managed part lifecycle statuses live in `PendingRow.status` / Supabase `metadata.status`; legacy `metadata.partStatus` is rollback/legacy data only.
- `PartStatusRenderer` is still used for booking status display, but do not reintroduce a separate `partStatus` row field.
- Theme customization in Settings is a placeholder.
- Some legacy Zustand stage arrays remain for compatibility. Do not expand that pattern.
- The `docs/` vault and most helper scripts are gitignored locally; do not assume they exist on clean clones unless the task is explicitly in this workspace.
- `repomix-output.xml` may exist in the repo root as analysis output; do not treat it as an application source file.

## Refactor Safety Rules

> **RESTRICTED RULE - must not be broken under any circumstance.**

When performing any refactor, optimization, or code cleanup:

- **Do not alter business logic.** Observable behavior must remain identical before and after the refactor.
- **Do not alter the UI.** No visual changes to layout, spacing, colors, component structure, text, or interactive behavior are permitted unless explicitly requested.
- **Do not silently change data flow.** Do not swap, reorder, or remove transformations, validation steps, or side effects even if they appear redundant.
- **Warn before proceeding.** If a planned change would touch logic or UI in a way that goes beyond pure structural cleanup, stop and surface this warning:

  > ⚠️ RESTRICTED RULE: This change affects logic or UI. Proceeding would violate the refactor safety rule. Confirm before continuing.

- This warning is mandatory whether the change is proposed in a plan, a code edit, or a code review suggestion.

## Workflow Conventions

- When a review or audit skill is invoked (`/bug-review`, `/production-code-audit`, `/requesting-code-review`, etc.), deliver only the findings report unless the user explicitly asks to apply fixes.
- For bug-review and adversarial review workflows, verify each finding is a real issue in the current codebase before proposing any fix.
- After source code edits, run `npm run type-check` and `npm run lint` before declaring the task done. For docs-only edits, run `npm run docs:validate`; add full gates if source files changed.
- Keep planning proportional. For simple UI additions or single-file changes, implement directly.
- When presenting approaches, offer 2-3 concise options with trade-offs and wait for the user to choose before deep-diving.
- If asked to save a general plan, write it to a `.md` file in the project root and stop before implementation. If implementing from an Obsidian spec, plans belong in `docs/superpowers/plans/`.

## Deprecated Commands

The following slash commands are deprecated. Do not suggest or invoke them:

- `/superpowers:write-plan` - replaced by the `superpowers:writing-plans` skill
- `/superpowers:execute-plan` - replaced by the `superpowers:executing-plans` skill

## Build and Long-Running Tasks

- Announce `npm run build` before starting; it can take several minutes.
- Prefer `npm run type-check` for quick validation unless production output is explicitly needed.
- Prefer read-only `npm run lint` over `npm run lint:fix` unless the task is specifically to auto-fix.
