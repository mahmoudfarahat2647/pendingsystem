# Store API Reference

Complete reference for all Zustand store actions and state management in the Renault Pending System.

---

## Quick Navigation

- [Orders Slice](#orders-slice)
- [Inventory Slice](#inventory-slice)
- [Booking Slice](#booking-slice)
- [Notifications Slice](#notifications-slice)
- [UI Slice](#ui-slice)

---

## Orders Slice

Manages new part requests and order staging before committing to Main Sheet.

### State

```typescript
interface OrdersState {
  ordersRowData: PendingRow[];
}
```

### Actions

#### `addOrder(order: PendingRow): void`

Create a single new order.

```typescript
const { addOrder } = useAppStore();
addOrder({
  id: "order-1",
  baseId: "B001",
  vin: "VF1AB000123456789",
  customerName: "John Doe",
  company: "Renault Retail",
  partNumber: "8200123456",
  partDescription: "Front Door Assembly",
  quantity: 1,
  status: "Pending"
});
```

---

#### `addOrders(orders: PendingRow[]): void`

**Batch import multiple orders** (optimized for bulk operations).

```typescript
const { addOrders } = useAppStore();
const importedOrders = [
  { id: "1", baseId: "B001", vin: "...", ... },
  { id: "2", baseId: "B002", vin: "...", ... },
  { id: "3", baseId: "B003", vin: "...", ... },
];
addOrders(importedOrders);  // Single state update
```

**Performance**: O(n) single update vs O(n) individual updates

---

#### `updateOrder(id: string, updates: Partial<PendingRow>): void`

Update a single order with partial data.

```typescript
const { updateOrder } = useAppStore();
updateOrder("order-1", {
  quantity: 2,
  notes: "Priority request"
});
```

**Behavior**:
- Merges updates with existing data
- Updates across all sheets (Orders, Main, Booking, Call, Archive)

---

#### `updateOrders(ids: string[], updates: Partial<PendingRow>): void`

**Bulk update multiple orders** (optimized with Set-based lookups).

```typescript
const { updateOrders } = useAppStore();
updateOrders(["id1", "id2", "id3"], {
  status: "Verified",
  notes: "Quality checked"
});
```

**Performance**: O(n) with Set lookup vs O(n²) with array includes

---

#### `deleteOrders(ids: string[]): void`

Permanently remove orders from all sheets.

```typescript
const { deleteOrders } = useAppStore();
deleteOrders(["id1", "id2"]);
```

**Behavior**:
- Removes from Orders, Main Sheet, Booking, Call, Archive
- No recovery (use Undo for recent deletions)

---

## Inventory Slice

Manages active inventory tracking across Main Sheet, Call List, and Archive.

### State

```typescript
interface InventoryState {
  rowData: PendingRow[];            // Main Sheet (active inventory)
  callRowData: PendingRow[];        // Call List (customer contact)
  archiveRowData: PendingRow[];     // Archive (historical records)
}
```

### Actions

#### `commitToMainSheet(ids: string[]): void`

Move orders from Orders → Main Sheet with **Pending status**.

```typescript
const { commitToMainSheet } = useAppStore();
commitToMainSheet(["id1", "id2", "id3"]);
```

**Auto-generated**:
- Status: `"Pending"`
- TrackingId: `MAIN-{baseId}`

**Workflow**: Orders → Main Sheet (visible to inventory team)

---

#### `updatePartStatus(id: string, status: string): void`

**Update part availability status** with automatic workflow triggers.

```typescript
const { updatePartStatus } = useAppStore();
updatePartStatus("order-1", "Arrived");
```

**Status Values**:
- `"Available"` - Part in stock
- `"Pending"` - Waiting for arrival
- `"Arrived"` - Just received
- `"Reserved"` - Held for customer
- `"In Process"` - Being worked on

**Automatic Behaviors**:
- Status `"Arrived"` + all parts arrived → **Auto-move to Call List**
- Triggers notifications

**Example - Auto-move Workflow**:
```typescript
// Part 1 arrives
updatePartStatus("id1", "Arrived");  // Main Sheet

// Part 2 arrives  
updatePartStatus("id2", "Arrived");  // → Automatically moves to Call List
                                     // (both parts Arrived)
```

---

#### `sendToCallList(ids: string[]): void`

Move rows from Main Sheet → Call List for **customer contact**.

```typescript
const { sendToCallList } = useAppStore();
sendToCallList(["id1", "id2"]);
```

**Auto-generated**:
- Status: `"Call"`
- TrackingId: `CALL-{baseId}`

**Workflow**: Main Sheet → Call List (ready for outreach)

---

#### `sendToBooking(ids: string[], date: string, note?: string, status?: string): void`

Schedule customer appointments and move to **Booking**.

```typescript
const { sendToBooking } = useAppStore();
sendToBooking(
  ["id1", "id2"],
  "2025-01-15",
  "Customer prefers afternoon slots",
  "Scheduled"
);
```

**Auto-generated**:
- Status: `"Booking"`
- TrackingId: `BOOK-{baseId}`
- Booking date stored

**Triggered from**: Call List, Main Sheet, or Orders

**Workflow**: Any sheet → Booking (customer appointment scheduled)

---

#### `sendToArchive(ids: string[], actionNote?: string): void`

Move any rows to **Archive** with optional reason documentation.

```typescript
const { sendToArchive } = useAppStore();
sendToArchive(
  ["id1", "id2"],
  "Customer declined service - parts returned to warehouse"
);
```

**Auto-generated**:
- Status: `"Archived"`
- TrackingId: `ARCH-{baseId}`
- actionNote stored for audit trail

**Triggered from**: Any sheet (Booking, Call List, Main, Orders)

**Retention**: Archive records are retained

---

## Booking Slice

Manages customer appointment scheduling with calendar integration.

### State

```typescript
interface BookingState {
  bookingRowData: PendingRow[];
  bookingStatuses: Map<string, string>;  // Per-VIN status tracking
}
```

### Actions

#### `updateBookingStatus(id: string, status: string): void`

Change booking status (e.g., "Scheduled" → "Completed").

```typescript
const { updateBookingStatus } = useAppStore();
updateBookingStatus("id1", "Completed");
```

**Common Statuses**:
- `"Scheduled"` - Appointment confirmed
- `"Completed"` - Customer visited
- `"Rescheduled"` - New date set
- `"No-show"` - Customer didn't arrive

---

#### `updateBookingStatusDef(id: string, updates: Partial<BookingStatusDef>): void`

**Update booking status definition** (label and color) with bulk renaming support.

```typescript
const { updateBookingStatusDef } = useAppStore();
updateBookingStatusDef("pending", {
  label: "Waiting Confirmation",
  color: "#f59e0b"
});
```

**Data Integrity Behavior**:
- If `label` is changed, ALL rows in `bookingRowData` with the old label are automatically updated to the new label.
- Color changes reflect immediately in the UI without modifying row data.

---

#### `completeBooking(id: string): void`

Mark booking as completed and optionally move to Archive.

```typescript
const { completeBooking } = useAppStore();
completeBooking("id1");
```

---

## Notifications Slice

System-wide alerts and user feedback management.

### State

```typescript
interface NotificationsState {
  notifications: Notification[];
  notificationInterval: number;  // Default: 30000ms (30s)
}
```

### Actions

#### `addNotification(notification: Notification): void`

Add a new toast notification.

```typescript
const { addNotification } = useAppStore();
addNotification({
  id: "notif-1",
  type: "success",
  message: "Order committed to Main Sheet",
  duration: 3000
});
```

**Types**: `"success"` | `"error"` | `"warning"` | `"info"`

---

#### `clearNotifications(): void`

Clear all active notifications.

```typescript
const { clearNotifications } = useAppStore();
clearNotifications();
```

---

#### `setNotificationInterval(ms: number): void`

Update notification check interval (default 30s).

```typescript
const { setNotificationInterval } = useAppStore();
setNotificationInterval(60000);  // 60 seconds
```

---

## UI Slice

Global UI state for selections, tabs, and modals.

### State

```typescript
interface UIState {
  selectedRows: PendingRow[];
  activeTab: string;
  isOrderModalOpen: boolean;
  isBookingModalOpen: boolean;
  searchTerm: string;
  filterConfig: FilterConfig;
}
```

### Actions

#### `setSelectedRows(rows: PendingRow[]): void`

Update multi-select row selection.

```typescript
const { setSelectedRows } = useAppStore();
setSelectedRows([row1, row2, row3]);
```

---

#### `setActiveTab(tab: string): void`

Switch between pages/tabs.

```typescript
const { setActiveTab } = useAppStore();
setActiveTab("booking");  // /booking
```

**Valid Values**: `"orders"` | `"main"` | `"call"` | `"booking"` | `"archive"`

---

#### `setOrderModalOpen(open: boolean): void`

Toggle order creation modal visibility.

```typescript
const { setOrderModalOpen } = useAppStore();
setOrderModalOpen(true);  // Show modal
```

---

#### `setBookingModalOpen(open: boolean): void`

Toggle booking calendar modal visibility.

```typescript
const { setBookingModalOpen } = useAppStore();
setBookingModalOpen(true);  // Show calendar
```

---

#### `setSearchTerm(term: string): void`

Update search/filter query.

```typescript
const { setSearchTerm } = useAppStore();
setSearchTerm("VF1AB000");  // Filter by VIN
```

---

#### `updatePartStatusDef(id: string, updates: Partial<PartStatusDef>): void`

**Update part status definition** (label and color) with cross-sheet bulk renaming support.

```typescript
const { updatePartStatusDef } = useAppStore();
updatePartStatusDef("arrived", {
  label: "Arrived & Ready",
  color: "#10b981"
});
```

**Data Integrity Behavior**:
- If `label` is changed, performs a **global update** across ALL row arrays:
  - `ordersRowData`
  - `rowData` (Main Sheet)
  - `callRowData`
  - `archiveRowData`
  - `bookingRowData` (individual line items)
- Matches by exact label string and replaces with new label.


---

## Usage Patterns

### Pattern 1: Import and Commit Orders

```typescript
const { addOrders, commitToMainSheet } = useAppStore();

// Import orders
addOrders(csvData.map(row => ({
  id: generateId(),
  baseId: row.orderId,
  vin: row.vin,
  partNumber: row.partNum,
  partDescription: row.partDesc,
  quantity: row.qty,
  status: "Pending"
})));

// Review then commit to Main Sheet
const { ordersRowData } = useAppStore.getState();
const selectedIds = ordersRowData.map(r => r.id);
commitToMainSheet(selectedIds);
```

---

### Pattern 2: Track Part Status Changes

```typescript
const { updatePartStatus } = useAppStore();

// Part arrives
updatePartStatus("id1", "Arrived");

// Auto-move to Call List triggered if all parts arrived
// → Part status automatically updated
// → Customer contact triggered
```

---

### Pattern 3: Schedule Customer Booking

```typescript
const { sendToBooking, setBookingModalOpen } = useAppStore();

// From Call List, send to Booking
sendToBooking(
  selectedIds,
  "2025-01-20",
  "Customer confirmed",
  "Scheduled"
);

// Modal closes, rows moved to Booking
setBookingModalOpen(false);
```

---

### Pattern 4: Undo Failed Operation

```typescript
const { deleteOrders, undo } = useAppStore();

// Accidentally delete orders
deleteOrders(selectedIds);

// Oops! Undo within 48 hours
undo();  // Orders restored
```

---

## Performance Tips

1. **Batch Operations**: Use `addOrders()` not repeated `addOrder()`
2. **Selective Updates**: Only update changed fields with `updateOrders()`
3. **Set Operations**: Built-in optimization for O(1) lookups
4. **Memoize Selectors**: Use `useAppStore(state => state.rowData)` pattern

---

## Debugging

### Check Current State

```typescript
// In browser console
useAppStore.getState();

// Specific slice
useAppStore.getState().ordersRowData;
useAppStore.getState().rowData;
```

### Clear localStorage

```typescript
localStorage.clear();  // Clear all state
location.reload();     // Reload app
```


---

**Last Updated**: January 1, 2026
