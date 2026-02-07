# System Feature Registry

## Product Requirements (Summary)
### Product Vision
Create an efficient logistics platform for pendingsystem service centers that reduces operational overhead, provides real-time inventory visibility, and supports premium, brand-aligned UX.

### Target Users
- Service center managers
- Service advisors and technicians
- Customer service representatives
- Parts department staff
- Scheduling coordinators

### Success Metrics
- Reduce manual data entry by 75%
- Improve inventory tracking accuracy to 99%
- Decrease average time from order to delivery by 30%
- Achieve 95% customer satisfaction for appointment scheduling
- Maintain 99.9% uptime

### Core Objectives
- Centralize pending parts tracking
- Automate routine status updates and workflows
- Provide cross-stage visibility and navigation
- Enable efficient customer communication and scheduling

## Feature Registry
> [!IMPORTANT]
> This document serves as the single source of truth for all system features. **Update this file whenever a new feature is added or an existing one is modified.**

## Core Infrastructure
- **Settings Modal**:
  - Tabbed interface (Part Statuses, Appearance).
  - Accessible via Sidebar User Profile.
  - Centralized management for Part Status definitions.
- **Access Control (Temporary Disabled)**:
  - Legacy sign-in flows removed to unblock a future Clerk integration.
  - App routes are currently accessible without a sign-in gate.

## Order Management (Orders Page)
- **Data Grid**:
  - Dynamic editing of all order fields.
  - **[PROTECTED] Instant Reactivity**: Action icons (Notes, Reminders) and Statuses update with 0ms perceived latency using optimized cache injection and composite valueGetters.
  - Validation checks for duplicates and name mismatches.
- **Order Form ([PROTECTED])**:
  - **Premium Layout**: Side-by-side field grouping for (Customer/Company) and (VIN/Mileage) to eliminate scrolling on standard displays. [CRITICAL UX]
  - **Dynamic Warranty Display**: Real-time calculation of remaining warranty time or "High Mileage" warning displayed in the modal footer when Repair System is "ضمان". [CRITICAL UX]
- **Zod Data Validation ([PROTECTED])**:
  - Centralized schema enforcement for all Supabase data.
  - Runtime validation in service layer to prevent "water leak" regressions.
  - Auto-sync for legacy fields via schema transformations.
- **Bulk Operations**:
  - **Bulk Link / Set Path**: Select multiple rows -> Toolbar Link Icon -> Apply path/URL to all.
  - **Commit to Main Sheet**: Validates entries and moves them to the Main Sheet.
- **Modals**:
  - **Note Modal**: Add/Edit notes with color coding and templates.
  - **Reminder Modal**: 
    - Set reminders with templates and datetime.
    - **Grid Indicator**: Immediate bell icon coloring (Yellow = Active, Gray = None) which updates in real-time.
    - **Instant Alerts**: Setting a reminder for a past time triggers a notification immediately.
  - **Attachment Modal**: Link files or URLs to specific orders.
- **Visuals**:
  - Status color coding.
  - "Premium" glassmorphic UI design.

## Inventory (Main Sheet)
- **Sheet Locking**:
  - "Lock/Unlock" toggle icon in toolbar.
  - Prevents accidental edits when locked.
  - Auto-locks after 5 minutes of inactivity.
- **Workflow Actions**:
  - **Send to Call List**: Moves selected ready items to the Call List.
  - **Archive**: Moves completed items to Archive.
  - **Auto-Move Automation**: 
  - When a part status is updated to "Arrived" (in Main Sheet, Orders, or Global Search):
  - System automatically checks all other parts for the same VIN across all active sheets.
  - If **ALL** parts for that VIN are "Arrived" (or have an equivalent 'available' status), the entire group is automatically moved to the Call List.
  - Protected feature: Critical to workflow efficiency.
- **Enhanced Global Search**:
  - Search across all data tabs simultaneously.
  - **Searchable Fields**: VIN, Customer Name, Part Number, and **Company**.
  - Direct navigation to source row upon selection.

## Customer Communication (Call List)
- **Booking Calendar**:
  - **Premium Dark-Themed Interface**: Modern calendar with glassmorphic design and smooth animations.
  - **Universal Booking**: Works from Orders, Main Sheet, and Call List tabs - rows automatically move to Booking tab.
  - **Single VIN Restriction**: [CRITICAL] Booking actions are restricted to a single VIN at a time. The Booking button is disabled if multiple VINs are selected simultaneously to prevent scheduling conflicts.
  - **Multi-Customer Visual Indicators**: Stacked, color-coded dots (max 3) for days with multiple customers, grouped by VIN.
  - **Booking Status System**: Customizable status definitions (Add, Cancel, Done, Reschedule, etc.) with color coding.
  - **Pre-Booking Edits**: Set initial note and status in sidebar *before* confirming booking.
  - **Large Purple Action Button**: Premium pill-shaped "Book [Date]" button with hover elevations.
  - **Smart Navigation**: Jumping to a customer highlights their booked dates and auto-selects the relevant month.
  - **Search**: Filter bookings by customer name/VIN/part with visual fade effects for non-matches.
  - **3-Section Sidebar Layout**: 
    - Pre-booking setup (when creating new booking)
    - Customer list with selection
    - Details card with VIN, parts, and status dropdown
  - **Workflow Optimization**: Modal stays open after booking for immediate status updates and note additions.
- **Rebooking**: Dedicated button to reschedule, automatically opening the calendar with pre-filled search context.
  - System logs "Rescheduled from X to Y" notes automatically.

## Smart Notification System
- **Responsive Alerts**:
  - Numbered badge in header showing unread count (with "9+" support for high counts).
  - 10-second background check interval for near-instant responsiveness.
- **Direct Navigation & Highlighting**:
  - Clicking a notification navigates directly to the source tab.
  - **Auto-Scroll**: Automatically selects and scrolls the specific row into view for the user.
- **Detailed Metadata**:
  - Notifications display Due Date, Customer Name, VIN, Tracking ID, and Tab Source for context.
- **Management**:
  - Individual "X" delete icon per notification for quick cleanup.
  - "Clear All" functionality to wipe all alerts at once.

## Archive
- **Archive Page**: Read-only view of completed items.
- **Reorder**: Ability to move archived items back to Orders for re-processing.

## System Reports & Backup ([PROTECTED])
- **Automated Email Reports**:
  - Scheduled CSV backups sent via SMTP (Daily/Weekly/Monthly/Yearly).
  - Supports user-defined day selection for Weekly reports.
  - Emails sent at 10:00 AM Cairo Time (08:00 UTC).
  - "Send Backup Now" manual trigger.
- **Security & Integrity**:
  - Run via GitHub Actions to ensure isolated environment.
  - Requires Service Role Key for complete data access.
  - **[CRITICAL]** Logic protected from alteration to ensure data safety.


## UI/UX Standards
- **Design System**:
  - Dark mode default (`bg-[#0a0a0b]`).
  - "pendingsystem Yellow" accents (toned down for minimalism).
  - Framer Motion animations for modals and transitions.
  - Lucide React icons for all actions.
- **Accessibility**:
  - Tooltips for all icon-only buttons.
  - Keyboard navigation support in grids.
- **Safety**:
  - **Delete Confirmation**: Reusable high-fidelity dialog (ConfirmDialog) for all destructive actions.
  - Required confirmation (Yes/No) for row deletions in all tabs.
