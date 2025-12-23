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
  - **Reminder Modal**: Set reminders with templates and datetime.
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

## Customer Communication (Call List)
- **Booking Calendar**:
  - "Premium" dark-themed calendar interface.
  - **Smart Navigation**: Jumping to a customer highlights their booked dates and auto-selects the relevant month.
  - **History Tracking**: Clickable "pill" badges for past booking dates to quickly review history.
  - **Search**: Filter bookings by customer name/VIN with visual fade effects for non-matches.
  - **3-Section Layout**: Reserver List | Details Card | History Footer.
- **Booking Actions**:
  - **Rebooking**: Dedicated button to reschedule, automatically opening the calendar with pre-filled search and history.
  - System logs "Rescheduled from X to Y" notes automatically.

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
