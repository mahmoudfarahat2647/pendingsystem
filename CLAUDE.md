# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server (Node max memory 4GB)
npm run build        # Production build
npm run lint         # Biome check
npm run lint:fix     # Auto-fix lint issues
npm run lint:fix:staged # Auto-fix staged files
npm run lint:fix:staged:unsafe # Retry staged fixes with unsafe fixes
npm run type-check   # TypeScript validation (no emit)
npm run test         # Vitest unit tests
npm run test:watch   # Vitest watch mode
npm run docs:validate # Validate markdown docs structure
```

**Quality gates before merging:** `lint` -> `type-check` -> `test` -> `build`. Add `docs:validate` when documentation changes.

`git commit` triggers a Husky pre-commit hook that runs Biome safe fixes on staged files first, then retries with unsafe fixes if the safe pass still reports issues.

## Architecture

**pendingsystem** is a Next.js 15 App Router logistics platform for managing automotive parts across five workflow stages: `orders` -> `main` -> `call` -> `booking` -> `archive`.

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
- **Admin setup**: Run `npm run auth:seed-admin` after setting `AUTH_ADMIN_*` env vars in `.env.local`
- **Session expiry**: 1 hour, no refresh (`session.expiresIn: 3600`, `session.disableSessionRefresh: true`)

### Key Cross-Cutting Components
- **`BookingCalendarModal`** - shared booking workflow modal used across multiple stages
- **`SearchResultsView`** - aggregates all five stage queries for global header search
- **`OrderFormModal`** - orchestrates create/edit with Beast Mode, multi-part, and duplicate detection
- **`Header`** - owns debounced global search, draft-session undo/redo/save/discard controls, exports, and notification polling

## Project Conventions

- Use `@/` alias for all source imports.
- Keep feature code in the existing layout: `app/` routes, `components/` UI, `hooks/` hooks, `services/` Supabase logic, `lib/` utilities, `schemas/` Zod, `store/` Zustand.
- Feature-specific files live in sub-folders within their top-level directory (e.g., `services/reports/`, `hooks/queries/reports/`, `test/reports/`). The `components/reports/` folder is already self-contained. The store slice and Next.js API routes stay at their top-level locations due to framework and architecture constraints.
- Use selector-based subscriptions with `useAppStore`, never the bare store without a selector.
- Booking and Call List actions require part number and description. Commit to Main Sheet also requires an attachment path and Beast Mode validation.
- Stage pages should mutate operational rows through `useDraftSession()` commands, then persist with `saveDraft()` instead of calling stage mutations directly from the page body.

## Documentation

When making changes, update accordingly:
- **`FEATURES.md`** - when product behavior changes
- **`ENGINEERING.md`** - when architecture, data flow, env requirements, or operations change

### Obsidian Docs Workflow

The `docs/` folder is an Obsidian vault. Follow this convention:

| Folder | Purpose | Who writes |
|--------|---------|-----------|
| `docs/superpowers/specs/` | Design specs (intent, behavior, acceptance criteria) | User writes in Obsidian |
| `docs/superpowers/plans/` | Implementation plans | Claude writes via writing-plans skill |
| `docs/` root | Stable reference docs (post-implementation) | Claude writes after implementing |
| `docs/_templates/` | Obsidian templates for specs and references | — |

**Spec lifecycle:** `draft` → `approved` → `implemented`
Update the `status:` frontmatter field in the spec file when its lifecycle stage changes.

**When implementing from a spec:** Read the spec file first, implement, then update the spec `status` to `implemented` and update relevant reference docs.

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
npm run db:verify
```

This script parses `.env.local`, validates the `DATABASE_URL` format, attempts a live `SELECT 1`, checks all required vars, and prints row counts for every table. 90% of past failures were a malformed `DATABASE_URL`. Check it character by character before exploring other causes.

### Common Errors & Root Causes

| Error | Real Cause | Fix |
|-------|-----------|-----|
| `28P01 password authentication failed` | Wrong password in `DATABASE_URL` or URL is malformed | Copy exact string from Dashboard → Connect → Session mode — do not manually edit |
| `ENOTFOUND` / `getaddrinfo` | Wrong pooler host | Host must be `aws-<n>-<region>.pooler.supabase.com` |
| `SASL` / `invalid password` | Password has special chars not URL-encoded | Use Dashboard-provided string verbatim |
| `relation "auth_users" does not exist` | Better Auth tables not created yet | Trigger with one request to `/api/auth/get-session`, or run `npm run auth:seed-admin` |
| Auth passes but login fails | Better Auth `CamelCasePlugin` mismatch or wrong `modelName` | Check `src/lib/auth.ts` — model names must match prefixed table names (`auth_users`, etc.) |
| `duplicate key` on `DATABASE_URL` prefix | Duplicate `NEXT_PUBLIC_` prefix accidentally added to `DATABASE_URL` | `DATABASE_URL` must NOT have `NEXT_PUBLIC_` prefix |

### Better Auth Connection Chain

```
.env.local DATABASE_URL
  → src/lib/postgres.ts  (pg Pool, ssl: rejectUnauthorized: false)
  → src/lib/auth.ts      (Kysely + CamelCasePlugin + Better Auth)
```

If `SELECT 1` passes but auth still fails, the issue is in `auth.ts` config — not the connection string.

### Database Tables

| Table | Purpose |
|-------|---------|
| `orders` | All operational rows across all five stages |
| `order_reminders` | Per-row reminder records |
| `report_settings` | Report config per user |
| `auth_users` | Better Auth users |
| `auth_sessions` | Sessions (1h expiry, no refresh) |
| `auth_accounts` | Auth accounts |
| `auth_verifications` | Auth verifications |

### Supabase MCP

The Supabase MCP server is active in this project. Claude can directly query tables, run SQL, check logs, and inspect schema using MCP tools — **use this before manually debugging connection issues**.

---

## Known Constraints

- Authentication uses Better Auth (username+password only, admin-only, 1-hour sessions).
- Theme customization tab in Settings is a placeholder only.
- `CloudSync` is a legacy migration utility (Zustand -> Supabase), not the live sync path.
- Some legacy Zustand stage arrays remain in the store for compatibility; do not expand that pattern.

## Refactor Safety Rules

> **RESTRICTED RULE — must not be broken under any circumstance.**

When performing any refactor, optimization, or code cleanup:

- **Do not alter business logic.** The observable behavior of every feature must remain identical before and after the refactor.
- **Do not alter the UI.** No visual changes to layout, spacing, colors, component structure, text, or interactive behavior are permitted unless the user has explicitly requested them.
- **Do not silently change data flow.** Do not swap, reorder, or remove data transformations, validation steps, or side effects even if they appear redundant.
- **Warn before proceeding.** If any planned change would touch logic or UI in a way that goes beyond pure structural cleanup, stop and surface a clear warning:

  > ⚠️ RESTRICTED RULE: This change affects logic or UI. Proceeding would violate the refactor safety rule. Confirm before continuing.

- This warning is mandatory whether the change is proposed in a plan, a code edit, or a code review suggestion.

## important note

- after major changes please update this file (CLAUDE.md) . keep this file up-to-date with the project's status .
