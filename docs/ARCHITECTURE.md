# System Architecture

## Overview

**Renault Pending System** is a Next.js-based logistics management platform for automotive service centers. It provides real-time inventory tracking, customer booking management, and comprehensive order workflows.

**Tech Stack:**
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **State**: Zustand (with localStorage persistence)
- **Data Grid**: ag-Grid Community v32.3.3
- **Charts**: Recharts
- **Testing**: Vitest (unit), Playwright (E2E)

---

## Core Modules

### 1. **Orders** (`/app/orders`, `src/store/slices/ordersSlice.ts`)

**Purpose**: Manage new part requests and initial order staging.

**Features:**
- Bulk import of pending orders
- Order editing and deletion
- Attachment support for documentation
- Automatic tracking ID generation

**Data Structure:**
```typescript
interface PendingRow {
  id: string;                    // Unique identifier
  baseId: string;                // Source order ID
  vin: string;                   // Vehicle identification
  partNumber: string;            // Part code
  partDescription: string;       // Human-readable part name
  quantity: number;              // Order quantity
  status: 'Pending' | 'Call' | 'Archived';
  trackingId: string;            // Auto-generated (ORDER-{baseId})
  attachments?: Attachment[];
  notes?: string;
}
```

**Actions:**
- `addOrder(order)` - Single order creation
- `addOrders(orders)` - Batch import
- `updateOrder(id, updates)` - Single edit
- `updateOrders(ids, updates)` - Bulk edit
- `deleteOrders(ids)` - Batch deletion

---

### 2. **Main Sheet** (`/app/main-sheet`, `src/store/slices/inventorySlice.ts`)

**Purpose**: Active inventory with detailed part status tracking.

**Features:**
- Visual status indicators (Available, Pending, Arrived, etc.)
- Real-time availability updates
- Automatic auto-move workflow
- Historical status tracking

**Status Workflow:**
```
Pending → Arrived → Available → Call List
                  → Reserved → Booking
```

**Key Actions:**
```typescript
commitToMainSheet(ids)           // Orders → Main Sheet (Pending status)
updatePartStatus(id, status)     // Change availability (triggers workflows)
autoMoveToCallList(...)          // Auto-move when all parts "Arrived"
```

---

### 3. **Booking** (`/app/booking`, `src/store/slices/bookingSlice.ts`)

**Purpose**: Customer appointment scheduling with calendar integration.

**Features:**
- Premium dark-themed calendar UI
- Multi-customer VIN grouping
- Visual booking indicators (color-coded dots)
- 2-year historical booking retention
- Pre-booking note configuration

**Data Structure:**
```typescript
interface BookingEntry {
  id: string;
  vins: string[];                // Multi-VIN support
  date: string;                  // ISO format
  notes?: string;
  status?: string;
  bookingStatuses: Map<string, string>;  // Per-VIN status
}
```

**Key Actions:**
```typescript
sendToBooking(ids, date, note?, status?)   // Schedule appointment
updateBookingStatus(id, status)             // Change booking status
completeBooking(id)                         // Mark as done
```

---

### 4. **Call List** (`/app/call-list`)

**Purpose**: Customer communication queue and outreach management.

**Features:**
- Organized customer contact list
- Call status tracking
- Note attachments
- Auto-move from Main Sheet when parts arrive

**Workflow:**
- Parts arrive → Auto-move to Call List
- Contact customer → Log notes
- Schedule appointment → Move to Booking

---

### 5. **Archive** (`/app/archive`)

**Purpose**: Historical records and audit trail.

**Features:**
- 48-hour historical retention
- Archived reason documentation
- Compliance and reporting
- Immutable records

**Status**: All rows archived with tracking

---

## State Management (Zustand)

### Store Architecture

```typescript
// src/store/useStore.ts
export const useAppStore = create<CombinedStore>()(
  persist(
    (...a) => ({
      ...createOrdersSlice(...a),
      ...createInventorySlice(...a),
      ...createBookingSlice(...a),
      ...createNotificationSlice(...a),
      ...createUISlice(...a),
      ...createHistorySlice(...a),
    }),
    {
      name: "pending-sys-storage-v1.1",
      partialize: (state) => {
        // Only persist critical data; skip heavy arrays
        // Reduces localStorage overhead
      }
    }
  )
);
```

### Store Slices

| Slice | State | Key Actions |
|-------|-------|------------|
| **Orders** | `ordersRowData[]` | `addOrders`, `updateOrder`, `deleteOrders` |
| **Inventory** | `rowData[]`, `callRowData[]`, `archiveRowData[]` | `commitToMainSheet`, `updatePartStatus` |
| **Booking** | `bookingRowData[]`, `bookingStatuses` | `sendToBooking`, `updateBookingStatus` |
| **Notifications** | `notifications[]`, `notificationInterval` | `addNotification`, `clearNotifications` |
| **UI** | `selectedRows[]`, `activeTab`, etc. | `setSelectedRows`, `setActiveTab` |
| **History** | `undoStack[]`, `redos[]` | `addCommit`, `undo`, `redo` |

### Persistence Strategy

- **Method**: localStorage with key `"pending-sys-storage-v1.1"`
- **Selective**: Heavy arrays (commits, attachments) excluded
- **Retention**: 48-hour history in memory
- **Recovery**: Auto-restore on page reload

---

## Data Flow Architecture

### Order Lifecycle

```
┌─────────────┐
│   Import    │ User uploads orders or manual entry
└──────┬──────┘
       │ addOrders(orders[])
       ↓
┌─────────────────────┐
│ Orders (Staging)    │ Raw order data, not yet active
└──────┬──────────────┘
       │ commitToMainSheet(ids[])
       ↓
┌──────────────────────┐
│ Main Sheet (Pending) │ Active inventory tracking
│ Status: Pending      │
└──────┬───────────────┘
       │ updatePartStatus(id, 'Arrived')
       ├─→ autoMoveToCallList() [if all parts arrived]
       │
       ↓
┌──────────────────────┐
│ Call List (Contact)  │ Customer outreach queue
└──────┬───────────────┘
       │ sendToBooking(ids, date, note)
       ↓
┌──────────────────────┐
│ Booking (Scheduled)  │ Customer appointments
└──────┬───────────────┘
       │ completeBooking() or sendToArchive()
       ↓
┌──────────────────────┐
│ Archive (Historical) │ Immutable audit trail
└──────────────────────┘
```

### State Synchronization

**Optimization**: Index-based updates instead of full re-renders

```typescript
// Instead of: arr.map(item => item.id === id ? {...} : item)
// Use Set-based O(1) lookup:
const idSet = new Set(ids);
const newArr = arr.map(item => 
  idSet.has(item.id) 
    ? { ...item, ...updates } 
    : item
);
```

---

## Component Architecture

### Folder Structure

```
src/components/
├── booking/                  # Booking calendar components
│   ├── BookingCalendarGrid.tsx
│   └── BookingSidebar.tsx
├── dashboard/                # Chart components
│   ├── CapacityChart.tsx
│   └── DistributionChart.tsx
├── grid/                     # ag-Grid wrapper and config
│   ├── DataGrid.tsx
│   ├── DynamicDataGrid.tsx
│   ├── config/               # Column and grid configuration
│   ├── hooks/                # Grid-specific hooks
│   ├── renderers/            # Cell rendering components
│   └── utils/                # Grid utilities
├── main-sheet/               # Main sheet specific
├── orders/                   # Orders page components
├── shared/                   # Reusable modal and UI components
│   ├── BookingCalendarModal.tsx
│   ├── OrderFormModal.tsx
│   ├── SearchResultsView.tsx
│   ├── ConfirmDialog.tsx
│   └── EditableSelect.tsx
└── ui/                       # Radix UI primitives
    ├── button.tsx
    ├── dialog.tsx
    ├── dropdown-menu.tsx
    └── ... (11 total)
```

### Component Categories

**Complex Stateful Components:**
- `BookingCalendarModal` - Multi-feature booking interface
- `OrderFormModal` - Bulk order creation
- `SearchResultsView` - Advanced filtering
- `DataGrid` / `DynamicDataGrid` - ag-Grid wrappers

**Presentational/UI Components:**
- All `src/components/ui/*` - Radix UI wrappers
- Renderers, Headers, Sidebars

**Page Components:**
- `src/app/{route}/page.tsx` - Route-specific layouts

---

## Performance Optimizations

### Key Strategies

1. **Set-based Lookups** - O(1) instead of O(n) array checks
2. **Index-based Updates** - Direct array modification
3. **Selective Persistence** - Skip heavy data from localStorage
4. **Debounced Commits** - Batch history operations
5. **Memoized Selectors** - Prevent unnecessary re-renders
6. **Lazy Loading** - Route-based code splitting

### Grid Performance

- Column count: Optimized ag-Grid configuration
- Row virtualization: ag-Grid built-in
- Custom cell renderers: Memoized components
- Status update debouncing: 300ms default

→ See [PERFORMANCE_OPTIMIZATION.md](../PERFORMANCE_OPTIMIZATION.md) for detailed metrics

---

## Error Handling & Resilience

### Error Boundaries

- **ClientErrorBoundary**: Wraps component tree
- **Try-catch**: Store actions with error logging
- **Toast Notifications**: User feedback via Sonner

### Recovery Mechanisms

1. **localStorage Fallback**: Auto-restore on failures
2. **Undo/Redo**: 48-hour history stack
3. **Data Validation**: TypeScript types + runtime checks
4. **Graceful Degradation**: UI maintains usability

---

## Security Considerations

- **Client-side Only**: No backend API (file-based)
- **localStorage Isolation**: Per-domain storage
- **No Sensitive Data**: PII minimized in state
- **Type Safety**: Full TypeScript coverage

---

## Future Architecture Improvements

- [ ] Backend API for cloud synchronization
- [ ] Real-time collaboration (WebSockets)
- [ ] Advanced analytics dashboard
- [ ] Mobile-responsive optimization
- [ ] Dark/Light theme support

---

**Last Updated**: December 30, 2025
