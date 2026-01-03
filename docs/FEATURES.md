# System Feature Registry

> [!IMPORTANT]
> This document serves as the single source of truth for all system features. **Update this file whenever a new feature is added or an existing one is modified.**

## Core Infrastructure
- **Store History & Restore**: 
  - Tracks all state changes for 48 hours.
  - Allows full system restoration to any previous "commit" point via Settings.
  - Auto-cleans history older than 48h to maintain performance.
- **Settings Modal**:
  - Tabbed interface (Part Statuses, Appearance, History).
  - Accessible via Sidebar User Profile.
  - Centralized management for Part Status definitions.

## Order Management (Orders Page)
- **Data Grid**:
  - Dynamic editing of all order fields.
  - Validation checks for duplicates and name mismatches.
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
    - System automatically checks all other parts for the same VIN.
    - If **ALL** parts for that VIN are "Arrived", the entire group is automatically moved to the Call List.
    - Protected feature: Critical to workflow efficiency.

## Customer Communication (Call List)
- **Booking Calendar**:
  - **Premium Dark-Themed Interface**: Modern calendar with glassmorphic design and smooth animations.
  - **Universal Booking**: Works from Orders, Main Sheet, and Call List tabs - rows automatically move to Booking tab.
  - **Multi-Customer Visual Indicators**: Stacked, color-coded dots (max 3) for days with multiple customers, grouped by VIN.
  - **Booking Status System**: Customizable status definitions (Add, Cancel, Done, Reschedule, etc.) with color coding.
  - **Pre-Booking Edits**: Set initial note and status in sidebar *before* confirming booking.
  - **Large Purple Action Button**: Premium pill-shaped "Book [Date]" button with hover elevations.
  - **Smart Navigation**: Jumping to a customer highlights their booked dates and auto-selects the relevant month.
  - **History Tracking**: 
    - Includes archived bookings as historical markers on calendar.
    - Clickable "pill" badges for past booking dates to quickly review history.
  - **Search**: Filter bookings by customer name/VIN/part with visual fade effects for non-matches.
  - **3-Section Sidebar Layout**: 
    - Pre-booking setup (when creating new booking)
    - Customer list with selection
    - Details card with VIN, parts, and status dropdown
    - History footer with past booking dates
  - **Workflow Optimization**: Modal stays open after booking for immediate status updates and note additions.
- **Rebooking**: Dedicated button to reschedule, automatically opening the calendar with pre-filled search and history.
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

## Archive & history
- **Archive Page**: Read-only view of completed historical data.
- **Reorder**: Ability to move archived items back to Orders for re-processing.

## UI/UX Standards
- **Design System**:
  - Dark mode default (`bg-[#0a0a0b]`).
  - "Renault Yellow" accents (toned down for minimalism).
  - Framer Motion animations for modals and transitions.
  - Lucide React icons for all actions.
- **Accessibility**:
  - Tooltips for all icon-only buttons.
  - Keyboard navigation support in grids.
- **Safety**:
  - **Delete Confirmation**: Reusable high-fidelity dialog (ConfirmDialog) for all destructive actions.
  - Required confirmation (Yes/No) for row deletions in all tabs.
