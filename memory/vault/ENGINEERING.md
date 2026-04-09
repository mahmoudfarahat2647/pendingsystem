# Engineering Reference

## Architecture

### Overview
`pendingsystem` is a Next.js 15 App Router application for managing pending automotive parts across five workflow stages:

1. `orders`
2. `main`
3. `call`
4. `booking`
5. `archive`

The live application is a hybrid of:
- Supabase for operational data
- React Query for server-state fetching and optimistic mutations
- Zustand for persisted UI/reference state, grid layouts, notifications, and the local draft-session command overlay
- AG Grid for the main desktop work surfaces

### Tech Stack
- Framework: Next.js 15, React 19, TypeScript
- Styling: Tailwind CSS, custom design tokens, Radix UI primitives
- Data fetching: `@tanstack/react-query`
- Persistence and UI state: Zustand with `persist`
- Backend: Supabase
- Validation: Zod
- Grid: `ag-grid-community` and `ag-grid-react`
- Charts: Recharts
- Notifications: Sonner
- Testing: Vitest, React Testing Library, and jsdom

### Route Map
- `/`: session-aware redirect to `/dashboard` or `/login`
- `/login`, `/forgot-password`, `/reset-password`: auth entrypoints
- `/dashboard`: storage overview and stage metrics
- `/orders`: intake and staging
- `/main-sheet`: active inventory processing
- `/call-list`: customer contact queue
- `/booking`: appointment scheduling
- `/archive`: historical and reorder workflow
- `/draft-session-test`: internal draft-session recovery harness
- `/api/auth/[...all]`: Better Auth handlers
- `/api/password-reset/request`: username-based reset request endpoint
- `/api/storage-stats`: storage and database quota reporting
- `/api/trigger-backup`: manual backup trigger for GitHub Actions
- `/api/health`: authenticated health check

### App Shell
- `src/app/layout.tsx` provides metadata, `QueryProvider`, and global toasts.
- `src/app/(app)/layout.tsx` wraps all application routes in `AppShell`.
- `src/components/shared/AppShell.tsx` composes the sidebar, header, page error boundary, and main content wrapper.

### Repository Layout
```text
src/
  app/                Next.js routes, layouts, metadata routes, and API handlers
  components/         Feature and shared UI
  hooks/              Query hooks and UI hooks
  lib/                Utilities, printing, exports, query helpers, and auth
  schemas/            Zod schemas for rows and forms
  services/           Supabase-facing services
  store/              Zustand store and slices
  test/               Vitest suites and setup
docs/                 Stable feature references and design notes
public/               Static assets
supabase/migrations/  SQL migrations
scripts/              backup, docs, seed, and helper scripts
```

### Data Model Summary
The UI works with a normalized `PendingRow` shape defined by `src/schemas/order.schema.ts`. The backing Supabase table is `orders`, with most per-row details stored in a `metadata` JSON column and reminders stored separately in `order_reminders`.

Important related tables and database assets:
- `orders`
- `order_reminders`
- `report_settings`
- RPC `get_database_size_bytes`

### Runtime Data Flow
1. Route components call React Query hooks such as `useOrdersQuery("orders")`.
2. Hooks delegate reads and writes to service-layer methods in `orderService` and `reportSettingsService`.
3. Services map database rows into `PendingRow` with Zod validation.
4. Draft-capable pages stage local edits through `useDraftSession(stage)` and render `workingRows` over the React Query baseline.
5. `saveDraft()` replays pending commands through the existing React Query mutations, which optimistically update caches and then invalidate affected stage keys.
6. Zustand remains responsible for UI-local state such as search, layout persistence, statuses, templates, notifications, lock state, and draft-session recovery metadata.

### React Query Boundaries
Operational stage data is fetched with:
- `src/hooks/queries/useOrdersQuery.ts`
- `src/hooks/queries/useDashboardStatsQuery.ts`
- `src/hooks/queries/reports/useReportSettingsQuery.ts`
- `src/hooks/useStorageStats.ts`

Stage query keys are standardized in `src/lib/queryClient.ts`:
```typescript
["orders", "orders"]
["orders", "main"]
["orders", "call"]
["orders", "booking"]
["orders", "archive"]
```

### Optimistic Mutation Strategy
Mutations are implemented in:
- `src/hooks/queries/useSaveOrderMutation.ts`
- `src/hooks/queries/useBulkUpdateOrderStageMutation.ts`
- `src/hooks/queries/useBulkDeleteOrdersMutation.ts`

The pattern is:
1. cancel in-flight `orders` queries
2. snapshot affected caches
3. apply optimistic updates
4. rollback on error
5. invalidate only touched stages

This is the main reactivity path for live stage data once a draft session is saved.

### Validation Layers
- `PendingRowSchema` normalizes and validates persisted rows.
- `OrderFormSchema` validates regular modal submission.
- `BeastModeSchema` enforces strict commit-time requirements before Orders can move to Main Sheet.

These schemas live in:
- `src/schemas/order.schema.ts`
- `src/schemas/form.schema.ts`

### Zustand Responsibilities
The combined store is assembled in `src/store/useStore.ts`.

Persisted store state is intentionally small and focused on:
- part statuses
- booking statuses
- note, reminder, booking, and reason templates
- vehicle models
- repair systems
- lock state
- sticky notes and todos
- grid layouts
- dismissed managed notification keys

The stage arrays inside some slices are still present for legacy flows and migration tooling, but the active route-level source of truth is React Query plus Supabase.

Draft-session recovery snapshots are stored separately in `localStorage["pending-sys-draft-v1"]` and rebuilt into a working overlay by `draftSessionSlice`.

## Store API

### Store Composition
The combined store type is defined in `src/store/types.ts` and composed from these slices:

| Slice | Primary role today | Notes |
|---|---|---|
| `ordersSlice` | legacy in-memory CRUD helpers | active pages do not rely on it as the primary source |
| `inventorySlice` | legacy stage move helpers and part-status propagation | still used by some UI-only flows like notification auto-archive fallback |
| `bookingSlice` | legacy booking move helpers | kept for compatibility |
| `notificationSlice` | managed reminder and warranty notifications | actively used |
| `uiSlice` | search, templates, statuses, lock, notes, todos, Beast Mode triggers | actively used |
| `draftSessionSlice` | local command overlays, recovery snapshots, and save/discard orchestration | actively used by stage pages and header controls |
| `gridSlice` | AG Grid layout persistence | actively used |
| `reportSettingsSlice` | compatibility wrapper over report settings service | retained but newer UI goes through query hooks |

### Slice Responsibilities

#### `notificationSlice`
- Builds notifications from loaded stage caches.
- Keeps dismissals stable via `managedKey`.
- Navigates users back to the correct route and row context.
- Auto-archives expired warranties by calling `sendToArchive` and then `orderService.updateOrdersStage`.

#### `uiSlice`
- Stores the global search term used by the header and search results overlay.
- Stores part and booking status definitions.
- Persists templates and default vehicle/reference values.
- Tracks sheet lock state.
- Tracks Beast Mode trigger timestamps for strict commit validation flows.

#### `draftSessionSlice`
- Tracks a per-workspace command queue, `past`/`future` history, dirty state, and touched stages.
- Derives `workingRows` overlays from React Query baselines without mutating the live cache until save.
- Persists crash-recovery snapshots and restores them with empty `past`/`future` stacks.
- Executes staged changes through `saveDraft()` using the existing mutation hooks.

#### `gridSlice`
- Persists AG Grid state by `gridStateKey`.
- Tracks dirty layouts.
- Supports "save as default" and reset behavior.

#### `reportSettingsSlice`
- Provides async wrappers for fetching and updating `report_settings`.
- Exists for compatibility with older consumers.
- Newer report UI uses the React Query hooks in `src/hooks/queries/reports/useReportSettingsQuery.ts`.

### Store Usage Guidance
- Use selector-based subscriptions, not `useAppStore()` without a selector.
- Prefer React Query for stage data and Supabase-backed records.
- Use Zustand for UI-local state and persisted preferences.
- Do not add new operational stage reads to Zustand unless the data is intentionally local-only.

## Components Guide

### High-Impact Components

#### `DynamicDataGrid` and `DataGrid`
- Files:
  - `src/components/grid/DynamicDataGrid.tsx`
  - `src/components/grid/DataGrid.tsx`
- Purpose:
  - client-only AG Grid wrapper
  - skeleton loading
  - layout persistence
  - row jump/highlight behavior
  - pagination and floating filters
- Important behavior:
  - `gridStateKey` ties a grid to saved layout state
  - highlighted rows are scrolled into view via `tryJumpToRow`
  - layout saves are debounced before writing to persisted state

#### `GridConfig`
- File: `src/components/shared/GridConfig.tsx`
- Defines base, Orders, Main Sheet, and Booking column sets.
- The action column uses a composite `valueGetter`, not a plain `field`, to force AG Grid refreshes when notes, reminders, or attachments change.

#### `OrderFormModal`
- File: `src/components/orders/form/OrderFormModal.tsx`
- Thin orchestrator over `useOrderForm`.
- Handles:
  - split identity and parts UI
  - duplicate warnings
  - multi-part creation/edit
  - Beast Mode transitions
  - warranty calculations and high-mileage detection through hook logic

#### `BookingCalendarModal`
- File: `src/components/shared/BookingCalendarModal.tsx`
- Shared booking workflow modal used across multiple stages.
- Combines:
  - calendar
  - task list
  - grouped booking history
  - detail panel
  - pre-booking note and status entry

#### `SearchResultsView`
- File: `src/components/shared/SearchResultsView.tsx`
- Aggregates all five stage queries into a single searchable result set.
- Supports stage filtering, inline row actions, and stage-aware update routing.

#### `SettingsModal`
- File: `src/components/shared/SettingsModal.tsx`
- Current tabs:
  - Part Statuses
  - Theme Color
  - Backup and Reports
- Notes:
  - Theme tab is currently a placeholder
  - lock state is controlled here
  - report settings UI is hosted here

#### `Header`
- File: `src/components/shared/Header.tsx`
- Owns:
  - debounced global search
  - draft-session undo/redo/save/discard controls
  - full-system exports by company
  - notification polling interval

### Page-Level Composition
- Orders uses `src/app/(app)/orders/useOrdersPageHandlers.ts` to coordinate create/edit, commit, booking, archive, exports, and stage transitions.
- Main Sheet, Call List, Booking, and Archive pages each compose the shared grid, shared modals, route-specific toolbar actions, and query hooks directly.
- Dashboard composes live counts, storage metrics, and dynamically imported charts.

## API and Services

### `orderService`
File: `src/services/orderService.ts`

Responsibilities:
- fetch stage rows
- fetch dashboard stats
- update stage for one or many rows
- save or insert rows
- create and clear reminders in `order_reminders`
- delete one or many rows
- map Supabase rows back into `PendingRow`
- detect historical duplicate VIN/part pairs
- detect conflicting descriptions for a known part number

### `reportSettingsService`
File: `src/services/reports/reportSettingsService.ts`

Responsibilities:
- get or seed `report_settings`
- update report settings
- trigger manual backup through `/api/trigger-backup`

### `/api/trigger-backup`
File: `src/app/api/trigger-backup/route.ts`

Responsibilities:
- validate GitHub backup configuration
- dispatch `backup-reports.yml` through the GitHub Actions API
- return structured success or error responses

### `/api/storage-stats`
File: `src/app/api/storage-stats/route.ts`

Responsibilities:
- create a service-role Supabase client
- query database size via RPC
- recursively sum Supabase storage bucket usage
- return per-source and combined quota data

## Environment Configuration

### Required Client and Server Variables
Based on live code paths:

| Variable | Used by | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase clients and backup script fallback | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser and server Supabase clients | yes |
| `NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET` | attachment uploads and public file URLs | optional, defaults to `attachments` |
| `NEXT_PUBLIC_SITE_URL` | metadata base URL | optional but recommended outside localhost |
| `NEXT_PUBLIC_SETTINGS_PASSWORD` | client-side settings lock | optional |
| `DATABASE_URL` | Better Auth, health check, seed script, and env validation | yes |
| `BETTER_AUTH_URL` | Better Auth base URL, password reset redirect, sitemap | yes |
| `BETTER_AUTH_SECRET` | Better Auth signing secret | yes |
| `RESEND_API_KEY` | password reset email delivery | yes |
| `RESEND_FROM_EMAIL` | password reset sender | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | storage stats API and backup script | yes for storage stats and scheduled backup |
| `GITHUB_PAT` | manual backup trigger API | yes for `/api/trigger-backup` |
| `GITHUB_OWNER` | manual backup trigger API | optional in code, recommended in deployment |
| `GITHUB_REPO` | manual backup trigger API | optional in code, recommended in deployment |
| `SMTP_HOST` | backup script | yes for backup emails |
| `SMTP_PORT` | backup script | optional, defaults to `587` |
| `SMTP_USER` | backup script | yes for backup emails |
| `SMTP_PASS` | backup script | yes for backup emails |
| `AUTH_ADMIN_USERNAME` | admin seed script | optional, defaults to `admin` |
| `AUTH_ADMIN_EMAIL` | admin seed script | required for seeding |
| `AUTH_ADMIN_PASSWORD` | admin seed script | required for seeding |
| `AUTH_ADMIN_NAME` | admin seed script | optional, defaults to `Admin` |

### Notes
- `.env.example` now includes the current core application variables plus backup-related SMTP settings.
- `scripts/generate-backup.mjs` accepts `SUPABASE_URL` as an optional override, but falls back to `NEXT_PUBLIC_SUPABASE_URL`.

## Testing

### Commands
```bash
npm run lint
npm run type-check
npm run test
npm run build
npm run docs:validate
```

### Current Test Split
- Vitest covers schemas, services, store slices, hooks, utilities, routes, and selected components under `src/test`.
- The repo does not currently expose a first-class Playwright or `e2e` script in `package.json`.

### What Is Covered Well
- order mapping and service behavior
- report settings service and slice behavior
- storage stats API
- schema normalization and validation
- grid/layout hooks and modal helpers
- printing/export utilities

## Operations and Maintenance

### Backup Flow
1. Users configure report settings from the Settings modal.
2. Manual trigger hits `/api/trigger-backup`.
3. GitHub Actions runs `scripts/generate-backup.mjs`.
4. The script reads `report_settings`, exports orders to CSV, and sends email through SMTP.

### Documentation Tooling
- `npm run docs:validate` runs `scripts/validate-docs.js`.
- The validator only checks for required section names, balanced markers, and basic link validity.
- Because of that, keeping these documents concise and implementation-driven is safer than carrying large speculative sections.

## Troubleshooting

### `Supabase client failed to initialize`
Check:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Both `src/lib/supabase.ts` and `src/lib/supabase-browser.ts` throw when configuration is missing.

### Dashboard storage cards show partial or missing data
Check:
- `SUPABASE_SERVICE_ROLE_KEY`
- RPC migration `20260307_add_get_database_size_bytes.sql`
- storage bucket permissions and bucket listing availability

If the RPC fails, database usage becomes unavailable even if storage usage works.

### Manual backup trigger fails
Check:
- `GITHUB_PAT`
- GitHub workflow file `backup-reports.yml`
- repository owner and repo values in deployment

The route returns a 404 if the workflow file is not present on the target branch.

### Notes, reminders, or attachment icons do not refresh in the grid
Do not replace the action column composite `valueGetter` with `field: "id"` in `src/components/shared/GridConfig.tsx`. That value getter is the refresh trigger for action-cell state.

### Stage moves look wrong after a mutation error
Inspect:
- optimistic cache rollback in `src/lib/queryCacheHelpers.ts`
- affected invalidations in the bulk mutation hooks

Broken rollback usually means a mutation bypassed the standard query hooks.

### Notifications are missing or stale
Notifications are computed from loaded React Query stage caches. If a stage has not been loaded yet, `checkNotifications()` has less data to work with. Visit the relevant route or ensure the cache has been fetched before debugging notification logic.

### Layout save/reset is not behaving as expected
Check:
- `gridStateKey` on the page grid
- `useColumnLayoutTracker`
- persisted `gridStates` and `defaultLayouts` in Zustand

Reset uses a page reload to restore either the saved default layout or the original coded layout.

### Booking, Call List, or Commit actions are blocked
These flows intentionally validate prerequisites:
- Orders to Main Sheet requires strict Beast Mode fields plus an attachment link or uploaded file.
- Booking and Call List flows require part number and description.
- Reorder flows require a typed reason.

### Draft edits seem to disappear or reappear unexpectedly
Check:
- whether a draft session is still dirty in the header controls
- the recovery snapshot in `localStorage["pending-sys-draft-v1"]`
- invalidations for the touched stages after `saveDraft()` or `discardDraft()`

Most apparent "sync" issues in the current app are draft-session overlay issues, not live Supabase sync problems.

