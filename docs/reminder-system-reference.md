# Reminder System Reference

This document describes the current reminder system as implemented in the repo today. Treat it as the implementation reference before changing reminder UX, persistence, notification logic, or stage behavior.

## Purpose

The reminder system currently does four jobs:

1. lets users attach a single active reminder to an order row
2. persists that reminder in Supabase through the normal order save path
3. exposes reminder state back to the grid and modal UI
4. promotes due reminders into the notification dropdown

The system is intentionally tied to the existing order lifecycle and React Query cache flow. It is not a standalone reminders module.

## Authoritative Source Files

These files define the current behavior:

- `src/components/grid/renderers/ActionCellRenderer.tsx`
- `src/components/shared/EditReminderModal.tsx`
- `src/components/shared/RowModals.tsx`
- `src/hooks/useRowModals.ts`
- `src/hooks/queries/useSaveOrderMutation.ts`
- `src/services/orderService.ts`
- `src/store/slices/notificationSlice.ts`
- `src/components/shared/Header.tsx`
- `src/schemas/order.schema.ts`
- `src/types/index.ts`
- `src/test/useRowModals.test.ts`
- `src/test/notificationSlice.test.ts`
- `src/test/orderService.test.ts`

## Reminder Data Contract

At the UI level, a reminder is stored on `PendingRow` as:

```typescript
{
  date: string;    // yyyy-MM-dd
  time: string;    // HH:mm
  subject: string;
}
```

Schema notes from `PendingRowSchema`:
- `date` must match `yyyy-MM-dd`
- `time` must match `HH:mm`
- the reminder can be `null`
- the reminder can be omitted

In practice, the system supports one active reminder per order row.

## End-to-End Flow

### 1. Open

The reminder bell in `ActionCellRenderer` opens the shared reminder modal through `useRowModals`.

Important UI detail:
- the bell turns yellow when `row.reminder` is truthy
- the bell does not mean the reminder is due
- it only means a reminder currently exists on that row

### 2. Edit

`EditReminderModal` receives `initialData` from `currentRow.reminder` and preloads:
- date and time
- subject
- reminder templates from Zustand

The modal supports:
- save
- clear reminder
- pick or create quick templates
- remove existing templates

Current modal behavior:
- if there is no existing reminder, the modal defaults to `new Date()`
- if the internal date becomes invalid or empty on save, it falls back to today at `12:00`
- clearing uses `onSave(null)`

## Stage-Aware Save Path

`useRowModals.saveReminder()` sends:

```typescript
onUpdate(currentRow.id, { reminder }, sourceTag || undefined)
```

That means reminder saves are stage-aware when the caller provides a source tag such as:
- `orders`
- `main`
- `call`
- `booking`
- `archive`

Tests already verify that the stage tag is forwarded through `useRowModals`.

## Persistence Model

Reminder persistence is handled inside `orderService.saveOrder()`.

Current behavior:

1. the order row itself is saved to `orders`
2. `reminder` is intentionally removed from the JSON metadata before that write
3. if `reminder !== undefined`, the service deletes existing pending reminders from `order_reminders`
4. if the new reminder value is truthy, the service inserts a replacement reminder row into `order_reminders`

Important consequence:
- there is effectively one active reminder per order
- saving a new reminder replaces the previous active reminder
- clearing a reminder removes active reminder rows and inserts nothing
- completed reminders are not restored into the UI row model

## Timezone Handling

Timezone handling is explicit and important.

### Save direction

When saving:
- the UI `date` and `time` are interpreted as local time
- `orderService.saveOrder()` constructs a local `Date(year, month, day, hours, minutes)`
- that local date is converted to UTC with `toISOString()`
- the UTC value is stored in `order_reminders.remind_at`

This avoids the common bug where `"YYYY-MM-DDTHH:mm"` is interpreted with the wrong timezone offset.

### Read direction

When reading:
- `orderService.getOrders()` joins `order_reminders`
- `orderService.mapSupabaseOrder()` picks the first active, uncompleted reminder
- the stored UTC timestamp is converted back into local date and local time
- the UI receives the normalized `{ date, time, subject }` object

This round-trip is designed to preserve the user's intended local reminder time.

## Notification Lifecycle

Due reminder notifications are managed in `notificationSlice.checkNotifications()`.

### Sources scanned

The notification engine currently scans only these loaded React Query caches:
- `main`
- `orders`
- `booking`
- `call`

Important limitation:
- `archive` reminders are not included in notification generation
- archive rows can still hold reminder data, but those reminders will not appear in the notification dropdown

### Due logic

For each row with a reminder:
- the slice builds `new Date(\`${date}T${time}\`)`
- if `now >= reminderDate`, the reminder is considered due

When due, the notification payload includes:
- type: `reminder`
- title: `Reminder Due`
- description with due date, due time, customer name, and subject
- row id, VIN, tracking id, source tab name, and navigation path

### Notification identity

Reminder notifications are deduplicated with:

```text
reminder:{rowId}:{date}:{time}:{subject}
```

This `managedKey` is used to:
- prevent duplicate notifications
- remember dismissals
- allow a changed subject or rescheduled reminder to create a new notification identity

### Synchronization model

The notification slice does not append blindly.

Instead it:
1. computes the exact set of due reminders and warranties
2. rebuilds managed notifications from that set
3. removes notifications that are no longer due
4. preserves dismissed keys while an item is still actively due
5. prunes dismissed keys only when all relevant caches are loaded and the item is no longer due

This is why future reminders disappear properly when rescheduled instead of getting stuck in the dropdown.

## Notification Trigger Timing

There are two ways reminder notifications get reevaluated.

### Background polling

`Header.tsx` triggers `checkNotifications()`:
- after an initial 3 second delay
- every 10 seconds after that

### Manual post-save check

After `saveReminder()` runs, `useRowModals` dispatches a global `check-notifications` event after 100 ms.

Purpose:
- if the reminder is already due, the user does not need to wait for the next 10 second polling interval

Important nuance:
- `saveReminder()` does not await the update promise
- the current UX depends on the route update path already being optimistic
- this works in the current pages because reminder saves go through the existing optimistic mutation flow

## Navigation Behavior

When a user clicks a reminder notification:
- the notification is marked read
- the app navigates to the source route
- the row id is stored as `highlightedRowId`
- `DataGrid` tries to jump to and highlight that row after the grid is ready

This keeps the reminder system tied to row context instead of opening a separate reminder inbox.

## UI-Level Rules and Invariants

These behaviors are intentional and should not be changed casually:

1. A row exposes only one active reminder in the UI.
2. The reminder bell indicates presence, not due state.
3. Reminder saves travel through the row update path, not a separate reminder API.
4. Reminder notifications are derived from loaded stage caches, not fetched independently.
5. Archive reminders do not generate notifications.
6. Dismissed due reminders stay dismissed until their managed identity changes or the due item disappears.
7. Timezone conversion must stay local-to-UTC on save and UTC-to-local on read.

## Practical Limitations

Current limitations worth knowing before making changes:

- No archive-source reminder notifications.
- No history UI for completed reminders.
- No explicit success toast in `saveReminder()` itself.
- Manual reminder checks happen on a short timeout, not after awaiting confirmed server success.
- The notification engine only knows about data that has been loaded into the relevant React Query caches.

## Recommended Test Targets After Changes

At minimum, cover:

- saving a reminder from each supported stage
- clearing a reminder
- timezone round-trip for saved reminder times
- due reminder notification creation
- dismissed reminder non-respawn behavior
- reminder respawn when subject/date/time changes
- strict cleanup of dismissed keys when a due reminder is removed
- the archive limitation, if archive reminder behavior is changed intentionally

## Summary

The current reminder system is a row-scoped reminder feature layered on top of the normal order save flow. It stores one active reminder per row, projects it back through `PendingRow`, and promotes due reminders into managed notifications based on loaded stage caches. The main design constraints are single-reminder semantics, stage-aware optimistic updates, local-time correctness, and notification deduplication through `managedKey`.
