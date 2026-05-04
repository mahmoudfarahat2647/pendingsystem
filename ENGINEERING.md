# Architecture

pendingsystem is a Next.js App Router logistics application. Operational row
data flows from route components to React Query hooks, then to Supabase service
modules under `src/services/`. Draft-capable pages use `useDraftSession(stage)`
for local command recording before persistence.

The canonical user-managed lifecycle status field is `PendingRow.status`,
stored in Supabase order metadata as `metadata.status`. The old
`metadata.partStatus` value is retained only as rollback data and must not be
used by new application code.

# Store API

React Query owns live server state. Zustand remains responsible for UI
preferences, status definitions, draft-session recovery, and legacy compatibility
arrays.

The `partStatuses` store collection name is retained for compatibility, but its
labels now apply to `PendingRow.status`. The compatibility action
`updatePartStatus` updates `status` across legacy row arrays.

# Components Guide

Stage grids should use `DynamicDataGrid` or `DataGrid` with column definitions
from `src/components/shared/GridConfig.tsx`.

The STATS column uses `StatusRenderer` with `cellRendererParams: { partStatuses
}` so user-managed statuses render as colored dots. Do not add a separate PART
STATUS column.

# Troubleshooting

If status updates do not appear in a grid, verify the page is rendering
`workingRows` from `useDraftSession(stage)` when a draft is active and that
patch commands write `{ status: value }`.

If reserve-label printing does not enable for selected rows, check that the
configured status definition with `id === "reserve"` matches the selected rows'
`status` value after trim/case normalization.
