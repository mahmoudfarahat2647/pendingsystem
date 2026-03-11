# pendingsystem Workspace Rules

This file documents the repo conventions that match the current codebase. Use it as the working agreement for changes in this workspace.

## 1. Quality Gates
Run the relevant checks before merging:

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

When documentation changes, also run:

```bash
npm run docs:validate
```

Use `npm run e2e` when touching critical user flows or route-level behavior.

## 2. Imports and Project Structure
- Use the `@/` alias for app source imports.
- Keep feature code in the existing folder layout:
  - `src/app` for routes and API handlers
  - `src/components` for UI
  - `src/hooks` for hooks
  - `src/services` for Supabase-facing logic
  - `src/lib` for utilities
  - `src/schemas` for Zod validation
  - `src/store` for Zustand slices and types

## 3. Data Ownership Rules
- React Query is the primary source of truth for live operational stage data.
- Supabase access belongs in service-layer files such as `src/services/orderService.ts` and `src/services/reportSettingsService.ts`.
- Zustand is for UI-local and persisted preference state, not new server-state features.
- Legacy stage arrays still exist in Zustand for compatibility and migration tooling. Do not expand that pattern unless the feature is intentionally local-only.

## 4. Stage Workflow Rules
The only supported operational stages are:

```text
orders
main
call
booking
archive
```

- Keep stage strings aligned with `OrderStage` in `src/services/orderService.ts`.
- Use the standard query keys from `src/lib/queryClient.ts`.
- Route-level stage moves should go through the existing mutation hooks, not ad hoc cache edits.

## 5. Validation Rules
- All persisted order rows must conform to `PendingRowSchema`.
- Form editing should use `OrderFormSchema`.
- Orders cannot move from Orders to Main Sheet unless `BeastModeSchema` passes.
- Booking and Call List actions require part number and description.
- Commit to Main Sheet also requires an attachment path for each selected row.
- Reorder flows require a human-entered reason.

## 6. Grid Rules
- Reuse `DynamicDataGrid` and `DataGrid` for stage grids.
- Every persisted grid must provide a stable `gridStateKey`.
- Column definitions should come from `src/components/shared/GridConfig.tsx` unless there is a route-specific reason to diverge.
- Do not replace the action column composite `valueGetter` with `field: "id"`. That breaks icon reactivity for notes, reminders, and attachments.
- Use `useColumnLayoutTracker` for save, save-as-default, and reset controls.

## 7. Mutation Rules
- Use:
  - `useSaveOrderMutation`
  - `useBulkUpdateOrderStageMutation`
  - `useBulkDeleteOrdersMutation`
- Preserve the optimistic mutation pattern:
  - cancel queries
  - snapshot cache
  - update cache
  - rollback on error
  - invalidate touched stages
- Do not introduce direct `queryClient` edits in page components when an existing mutation hook already owns the workflow.

## 8. Service and API Rules
- Keep Supabase table shape mapping inside `orderService`.
- Map database rows through `orderService.mapSupabaseOrder()` so Zod validation remains in the pipeline.
- Keep report settings access inside `reportSettingsService`.
- API routes must stay server-only and use `runtime = "nodejs"` where required by current integrations.

## 9. UI and Shell Rules
- The main app shell is `AppShell` with `Sidebar` and `Header`; preserve that structure for application pages.
- The settings modal currently supports Part Statuses, Theme Color, and Backup and Reports. The theme tab is placeholder-only; do not document it as a full theming system.
- Global search is header-driven and searches across all five stages through `SearchResultsView`.
- Notifications are generated from stage caches and tied to row navigation/highlighting.

## 10. Backup and Reporting Rules
- Manual backups must continue to flow through `/api/trigger-backup`.
- Scheduled backup generation logic belongs in `scripts/generate-backup.mjs`.
- Storage and quota reporting belongs in `/api/storage-stats` plus the dashboard hook/components.
- If you change backup configuration or runtime env requirements, update `ENGINEERING.md` and `.env.example` together.

## 11. Testing Expectations
- Add or update Vitest coverage when changing:
  - schemas
  - services
  - store slices
  - shared hooks
  - utilities
  - route handlers
- Add or update Playwright coverage when changing critical route flows.
- Prefer targeted tests that follow existing patterns in `src/test` and `tests`.

## 12. Documentation Expectations
- Update `FEATURES.md` when product behavior changes.
- Update `ENGINEERING.md` when architecture, data flow, environment requirements, or operational tooling changes.
- Keep documentation implementation-based. Do not add aspirational or planned behavior unless it is clearly labeled as not implemented.

## 13. Environment Expectations
These variables are used by the live codebase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GITHUB_PAT`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `NEXT_PUBLIC_SITE_URL`

If a change adds a required variable, update docs and deployment configuration in the same task.

## 14. Current Practical Constraints
- No active authentication gate is implemented.
- Theme customization is not implemented beyond a placeholder tab.
- `CloudSync` exists for local-to-cloud migration support and is not the main live data path.
- Some legacy Zustand stage actions remain in the store; prefer the React Query route flow for new work.
