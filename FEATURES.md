# System Feature Registry

## Product Summary
`pendingsystem` is a Next.js 15 workflow application for automotive service centers. The live implementation uses Supabase for operational data, React Query for server-state workflows, Zustand for persisted UI/reference state, and AG Grid for the primary desktop workspaces.

The product is organized around five fixed operational stages:

1. `orders`
2. `main`
3. `call`
4. `booking`
5. `archive`

## Authentication

The platform uses [Better Auth](https://better-auth.com) for admin-only authentication.

### Login
- Navigate to `/login` to sign in with username and password
- No public sign-up — only pre-created admin accounts can log in
- Sessions expire after **1 hour** with no automatic refresh

### Forgot Password
- Navigate to `/forgot-password` and enter your **username** (not email)
- A reset link is sent to the admin's email address (kept private)
- The form always shows a generic success message (prevents username enumeration)
- Reset links expire after 1 hour

### Session Behavior
- Sessions are stored in the `auth_sessions` table
- Middleware performs optimistic cookie-based redirects (Edge Runtime compatible)
- Server layouts perform authoritative DB-backed session checks
- All app routes and private API routes require a valid session

### Sign Out
- Click the **⋮** (three-dot) button in the sidebar user area
- Select "Sign out" from the dropdown

## Workspace Experience

### App Shell and Navigation
- Root `/` redirects to `/dashboard`.
- Shared app shell provides the sidebar, header, page-level error boundary, and main content wrapper.
- Sidebar navigation covers Dashboard, Orders, Main Sheet, Call List, Booking, and Archive.
- Sidebar can collapse to icon-only mode.
- Settings open from the sidebar profile area.
- When an edit session is active for a VIN, sidebar navigation warns before discarding that edit context.
- Route-level authentication is enforced via Better Auth (see Authentication section above).

### Header
- Debounced global search input with `Cmd/Ctrl+K` focus shortcut.
- Undo and redo controls backed by the persisted UI store.
- Page refresh shortcut button.
- Full-system CSV export filtered by allowed company (`Renault` or `Zeekr`).
- Notifications dropdown.
- Legacy `CloudSync` trigger for replaying local rows into Supabase.

### Security and Health
- Middleware applies security headers, including CSP, `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`.
- `/api/health` exposes health and liveness responses for monitoring.
- Settings edits are gated by a client-side password prompt and lock state, but this is not a true auth boundary.

## Dashboard
- Displays live counts from Supabase-backed order data.
- Shows total line counts for Orders and Main Sheet.
- Shows unique VIN count for the Call queue.
- Fetches storage usage through `/api/storage-stats`.
- Renders dynamic charts for storage capacity and stage distribution.
- Includes a branded hero section and a lightweight calendar widget.

## Operational Stages

### Orders
- React Query-backed grid for the `orders` stage.
- Create and edit flow uses `OrderFormModal` with split identity and parts sections.
- Supports multi-part creation, multi-row edit, row splitting, and row removal during edit.
- Edit mode is blocked when the current selection mixes VINs.
- Draft save is permissive, but same-order duplicate part numbers are still blocked.
- Commit to Main Sheet enforces strict `BeastModeSchema` validation.
- Failed commit attempts can reopen the edit flow in Beast Mode with the remaining 30-second timer.
- Duplicate protection covers:
  - duplicate part numbers within the same order
  - duplicate VIN + part combinations across loaded rows
  - historical VIN + part duplicates via service lookup
  - part-number/description mismatch warnings
- Before moving to Main Sheet, each selected row must have:
  - Beast Mode validation satisfied
  - part number
  - description
  - at least one attachment value (uploaded file or external link)
- Before sending to Booking or Call List, each selected row must have part number and description.
- Bulk actions include:
  - create/edit
  - delete
  - reserve label printing
  - logistics CSV export
  - bulk attachment link assignment
  - grouped order-document printing
  - archive
  - booking
  - send to Call List
  - part-status update
  - CSV extract
  - layout save/reset
- If every row for a VIN in Orders is marked `Arrived`, that VIN group auto-moves to Call List.

### Main Sheet
- React Query-backed grid for the `main` stage.
- Uses a page-local lock/unlock state, not the Settings lock.
- Unlocking enables edit-sensitive actions and starts a 5-minute auto-lock timer.
- Booking is restricted to selections that belong to a single VIN.
- Supports:
  - reserve label printing
  - archive
  - send to Call List
  - booking
  - delete
  - CSV extract
  - column layout save/reset
  - part-status quick filters
  - bulk part-status updates
- Reminder and warranty notifications are refreshed when data changes.
- If every row for a VIN in Main Sheet is marked `Arrived`, that VIN group auto-moves to Call List.

### Call List
- React Query-backed grid for the `call` stage.
- Supports booking from the call queue.
- Supports reorder back to Orders with a mandatory reason.
- Supports archive, reserve labels, CSV extract, delete, part-status updates, and saved layouts.

### Booking
- React Query-backed grid for the `booking` stage.
- Supports rebooking through the shared booking calendar modal.
- Rebooking appends reschedule history into both booking note text and note history.
- Supports reorder back to Orders with a mandatory reason.
- Supports archive, reserve labels, CSV extract, delete, part-status updates, and saved layouts.
- Includes `VINLineCounter` for quick VIN and line visibility.

### Archive
- React Query-backed grid for the `archive` stage.
- Archived rows remain editable for notes, reminders, attachments, and part status.
- Supports reorder back to Orders with a mandatory reason.
- Supports permanent deletion, CSV extract, and saved layouts.
- Displays booking date in the archive grid when available.

## Shared Workflows

### Global Search Workspace
- Header search fans out across Orders, Main Sheet, Call List, Booking, and Archive.
- Search corpus includes customer, VIN, part data, model, company, requester metadata, notes, booking details, archive reason, and stage.
- Search results are rendered in a dedicated grid workspace with inline modal actions.
- Bulk actions from search include reserve, booking, archive, send to Call List, status update, delete, extract, and filter toggle.
- Stage-changing bulk actions are restricted to selections from the same source stage.

### Booking Calendar
- Reusable booking modal shared by Orders, Main Sheet, Call List, Booking, and Search results.
- Combines:
  - calendar
  - task list
  - customer list
  - booking details
  - booking history
  - pre-booking status selection
  - booking note entry
- Search inside the modal scans Booking and Archive history from the last two years by customer, VIN, part number, or booking date.
- Clicking a history date jumps the calendar to that date.
- Confirmation is disabled while browsing search results or when the selected date is in the past.

### Row Modals
- Shared modal system handles notes, reminders, attachments, and archive reasons.
- Notes are persisted through unified `noteHistory`.
- Archive flows append tagged note lines for traceability.
- Reminder saves trigger an immediate notification refresh request.

### Attachments
- Row-level attachment editing supports either:
  - an external link
  - a Supabase-backed uploaded file
- Supported uploads are JPG, PNG, and PDF up to 5 MB.
- Attachment state is stored using `attachment_link`, `attachment_file_path`, and derived `hasAttachment`.
- Orders bulk attachment editing is link-only and does not allow file upload.

### Notifications
- Notifications are managed in Zustand but rebuilt from loaded React Query stage caches.
- Due reminders generate managed reminder notifications.
- Warranty expirations within 10 days generate managed warranty notifications.
- Expired warranties are auto-archived and then synced to Supabase in the background.
- Notifications route users back to the originating page and row context.

### Grid UX and Layout Persistence
- AG Grid is the main work surface across all operational pages and search results.
- Floating filters can be toggled per page.
- Column layouts are persisted by grid key and support save, save-as-default, and reset flows.
- Action-cell state refresh depends on a composite `valueGetter`, so note/reminder/attachment icon state stays in sync.

### Printing and Export
- Logistics export generates a CSV for selected rows.
- Header export generates a full-system CSV filtered by company.
- Order document printing groups rows by VIN and produces printable Arabic A4 order sheets.
- Reservation label printing is available from the operational grids and produces branded printable labels.

## Settings and Reporting

### Settings Modal
- Current tabs:
  - Part Statuses
  - Theme Color
  - Backup & Reports
- Part status definitions are editable and persisted in Zustand.
- Renaming a part-status label also rewrites matching values in the legacy local stage arrays.
- Theme tab is currently a placeholder only.
- Settings lock state controls protected settings/report editing, not Main Sheet locking.

### Backup and Reports
- Report settings are stored in Supabase `report_settings`.
- Users can:
  - enable or disable scheduled backups/reports
  - choose Daily, Weekly, Monthly, or Yearly frequency
  - manage recipient email addresses
  - trigger a manual backup immediately
- Manual backups call `/api/trigger-backup`, which dispatches the GitHub Actions workflow `backup-reports.yml`.
- Scheduled backup generation logic lives in `scripts/generate-backup.mjs`.

## Platform Services
- `/api/storage-stats` reports database usage and storage-bucket usage.
- `/api/trigger-backup` validates GitHub backup configuration and dispatches the workflow run.
- `/api/health` returns health and liveness status.
- `CloudSync` remains available to migrate legacy persisted stage arrays into Supabase, but it is not the primary live data path.

## Data and Business Rules
- Operational rows are normalized through `PendingRowSchema`.
- Form-level validation uses `OrderFormSchema`.
- Strict commit validation uses `BeastModeSchema`.
- Stage names are fixed to `orders`, `main`, `call`, `booking`, and `archive`.
- Company handling is normalized against the app's allowed company list.
- Reminders live in the `order_reminders` table and are projected back into UI rows.
- Attachment columns are used when present in the database schema, with metadata fallback for older schemas.

## Current Constraints
- No RBAC or role-differentiated access control exists beyond the single admin role.
- Settings password/lock is a client-side workflow guard, not a security boundary.
- Theme customization is not implemented beyond the placeholder tab.
- Main Sheet still shows share/print toolbar affordances that are not wired to handlers.
- Notifications only reflect stages that have been loaded into the React Query cache.
- Some Zustand stage arrays remain for legacy compatibility and migration support even though live stage data comes from React Query plus Supabase.
