# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server (Node max memory 4GB)
npm run build        # Production build
npm run lint         # Biome check
npm run lint:fix     # Auto-fix lint issues
npm run type-check   # TypeScript validation (no emit)
npm run test         # Vitest unit tests
npm run test:watch   # Vitest watch mode
npm run docs:validate # Validate markdown docs structure
```

**Quality gates before merging:** `lint` -> `type-check` -> `test` -> `build`. Add `docs:validate` when documentation changes.

## Architecture

**pendingsystem** is a Next.js 15 App Router logistics platform for managing automotive parts across five workflow stages: `orders` -> `main` -> `call` -> `booking` -> `archive`.

### Data Ownership
- **React Query** is the source of truth for all live operational stage data.
- **Supabase** (`orders`, `order_reminders`, `report_settings` tables) persists all data; access belongs only in `src/services/`.
- **Zustand** (`src/store/`) manages UI-local and persisted preference state plus the local draft-session command overlay and recovery state. Do not route new server-state through Zustand.

### Runtime Data Flow
1. Route components call React Query hooks (`useOrdersQuery`, etc.)
2. Hooks delegate to `src/services/orderService.ts` or `src/services/reportSettingsService.ts`
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
- Use selector-based subscriptions with `useAppStore`, never the bare store without a selector.
- Booking and Call List actions require part number and description. Commit to Main Sheet also requires an attachment path and Beast Mode validation.
- Stage pages should mutate operational rows through `useDraftSession()` commands, then persist with `saveDraft()` instead of calling stage mutations directly from the page body.

## Documentation

When making changes, update accordingly:
- **`FEATURES.md`** - when product behavior changes
- **`ENGINEERING.md`** - when architecture, data flow, env requirements, or operations change

## Known Constraints

- Authentication uses Better Auth (username+password only, admin-only, 1-hour sessions).
- Theme customization tab in Settings is a placeholder only.
- `CloudSync` is a legacy migration utility (Zustand -> Supabase), not the live sync path.
- Some legacy Zustand stage arrays remain in the store for compatibility; do not expand that pattern.

## important note

- after major changes please update this file (CLAUDE.md) . keep this file up-to-date with the project's status .
