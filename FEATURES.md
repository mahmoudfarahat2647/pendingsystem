# System Feature Registry

## Product Summary
`pendingsystem` is a Next.js logistics and workflow application for automotive service centers. The current implementation centers on five operational stages backed by Supabase data and surfaced through AG Grid-heavy desktop views:

1. `orders`
2. `main`
3. `call`
4. `booking`
5. `archive`

## Core Product Behavior

### App Shell
- Shared shell with persistent sidebar, top header, notifications, global search, and React Query provider.
- Route map: `/dashboard`, `/orders`, `/main-sheet`, `/call-list`, `/booking`, `/archive`.
- Root `/` resolves to the dashboard experience.
- No active authentication gate is implemented in the current app shell.

### Dashboard
- Displays live stage counts from Supabase-backed order data.
- Shows total lines for Orders and Main Sheet.
- Shows unique VIN count for the Call queue.
- Includes storage monitoring cards fed by `/api/storage-stats`.
- Uses dynamic chart loading for capacity and stage distribution visualizations.

### Orders
- React Query-backed grid for the `orders` stage.
- Create and edit flow uses `OrderFormModal` with split identity and parts sections.
- Supports multi-part order creation and edit mode row splitting/removal.
- Commit to Main Sheet is blocked until strict "Beast Mode" validation passes.
- Commit also requires part number, description, and attachment path on every selected row.
- Bulk actions include:
  - reserve label printing
  - logistics CSV export
  - link/path assignment
  - document printing
  - archive
  - booking
  - send to Call List
  - part status update
- Mixed-VIN selection blocks edit mode for safety.

### Main Sheet
- React Query-backed grid for the `main` stage.
- Lock state is controlled from Settings and disables editing-sensitive actions.
- Booking action is limited to selections that belong to a single VIN.
- Supports:
  - reserve label printing
  - archive
  - send to Call List
  - booking
  - bulk part status changes
  - CSV extract
  - column layout save/reset
- Reminder and warranty notifications are refreshed whenever data changes.

### Call List
- React Query-backed grid for the `call` stage.
- Supports booking from the call queue.
- Supports reorder flow back to Orders with a mandatory reason.
- Supports archive flow, reserve labels, extract, delete, part-status updates, and saved layouts.

### Booking
- React Query-backed grid for the `booking` stage.
- Rebooking uses the booking calendar modal and appends reschedule history into notes.
- Supports reorder back to Orders with a mandatory reason.
- Supports archive, reserve labels, delete, extract, part-status updates, and saved layouts.
- Includes `VINLineCounter` for quick line and VIN visibility.

### Archive
- React Query-backed grid for the `archive` stage.
- Archived rows remain editable for notes, reminders, attachments, and part status.
- Reorder sends selected rows back to Orders with a mandatory reason.
- Supports permanent deletion and CSV export.
- Shows booking date in the archive grid when available.

## Shared Workflow Systems

### Booking Calendar
- Reusable booking modal shared by Orders, Main Sheet, Call List, and Booking.
- Combines calendar, task list, customer history, and booking detail sidebar.
- Supports pre-booking status and note entry.
- Supports search-driven navigation through existing bookings and archive history.
- Can run in full workflow mode or booking-only mode.

### Global Search
- Header search fans out across all five stages.
- Searches customer, VIN, part data, requester metadata, notes, booking details, and archive reason text.
- Results carry source-stage tagging and support inline modal actions.

### Notifications
- Notifications are managed in Zustand but computed from React Query stage caches.
- Reminder notifications appear when reminder date/time is due.
- Warranty notifications appear when warranty expiration is within 10 days.
- Clicking a notification navigates to the source route and requests row highlighting.
- Expired warranties trigger automatic archive behavior through store and background sync logic.

### Grid UX and Layout Persistence
- AG Grid is the primary work surface on every operational route.
- Column layouts are persisted per grid key through Zustand.
- Users can save current layout, save a default layout, or reset to default/original layout.
- Action cells depend on a composite `valueGetter` so note/reminder/attachment icon state refreshes correctly.

### Modals and Row Editing
- Shared modal system handles note, reminder, attachment, and archive flows.
- Attachment modal stores a single path or URL plus a `hasAttachment` flag.
- Archive flows append tagged action notes for traceability.

### Settings
- Settings modal currently exposes:
  - Part Statuses
  - Theme Color
  - Backup and Reports
- Theme tab is a placeholder and does not yet provide configurable theming.
- Main Sheet lock state is controlled from Settings.
- Part status definitions are editable and propagate label changes through persisted local rows.

### Backup and Reports
- Report settings are stored in Supabase `report_settings`.
- Users can:
  - enable or disable scheduled reports
  - choose frequency
  - manage recipient emails
  - manually trigger backup workflow
- Manual backups call `/api/trigger-backup`, which dispatches the GitHub Actions workflow `backup-reports.yml`.
- Scheduled backup generation logic lives in `scripts/generate-backup.mjs`.

### Storage Monitoring
- `/api/storage-stats` reports database usage and storage bucket usage using the Supabase service role.
- Database size depends on the RPC added by `supabase/migrations/20260307_add_get_database_size_bytes.sql`.
- Dashboard presents separate database and storage quotas plus combined usage.

### Printing and Export
- Logistics export generates a CSV for selected rows.
- Full-system export from the header filters by allowed company.
- Order document printing generates grouped printable order sheets by VIN.
- Reservation label printing is available from all operational grids.

### Legacy Local-to-Cloud Sync
- `CloudSync` still exists to migrate legacy Zustand arrays into Supabase by replaying rows stage by stage.
- This is a migration utility, not the primary live data path.

## Data and Validation Rules Reflected in the UI
- Operational data is normalized through `PendingRowSchema`.
- Stage names are fixed to `orders`, `main`, `call`, `booking`, and `archive`.
- Form-level validation uses `OrderFormSchema`.
- Commit-time strict validation uses `BeastModeSchema`.
- Company names are constrained by the app's allowed-company rules and normalization helpers.
- Reminder data is stored in a dedicated `order_reminders` table and projected back into UI rows.

## Current Known Constraints
- Theme customization is not implemented beyond a placeholder settings tab.
- Access control is not implemented.
- Some Zustand stage arrays remain in the store for legacy flows and migration support, even though React Query is the active source for operational stage data.
