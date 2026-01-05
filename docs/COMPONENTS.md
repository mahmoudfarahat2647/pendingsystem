# Component Documentation Guide

Documentation for complex and critical components in the Renault Pending System.

---

## Component Categories

1. [Complex Stateful Components](#complex-stateful-components)
2. [Modal Components](#modal-components)
3. [Grid Components](#grid-components)
4. [Shared Components](#shared-components)
5. [UI Primitives](#ui-primitives)

---

## Complex Stateful Components

### BookingCalendarModal

**Location**: [`src/components/shared/BookingCalendarModal.tsx`](../src/components/shared/BookingCalendarModal.tsx)

**Purpose**: Premium dark-themed booking calendar for scheduling customer appointments with advanced features.

**Features**:
- Multi-customer VIN grouping
- Visual booking status indicators (color-coded dots)
- 2-year historical booking retention
- Pre-booking note and status configuration
- Customer search within calendar
- Real-time booking status updates

**Props**:
```typescript
interface BookingCalendarModalProps {
  open: boolean;                           // Modal visibility
  onOpenChange: (open: boolean) => void;   // Close handler
  onConfirm: (date, note, status?) => void; // Booking confirmation callback
  selectedRows: PendingRow[];              // Orders to book
  initialSearchTerm?: string;              // Pre-populate search
  bookingOnly?: boolean;                   // Filter to booking-only rows
}
```

**Usage**:
```tsx
const [open, setOpen] = useState(false);

<BookingCalendarModal
  open={open}
  onOpenChange={setOpen}
  onConfirm={(date, note, status) => {
    // Handle confirmed booking
    sendToBooking(selectedIds, date, note, status);
  }}
  selectedRows={selectedOrders}
/>
```

**Implementation Details**:
- Uses `date-fns` for date manipulation
- Memoized calendar grid for performance
- Handles multi-year booking history
- Sidebar shows customer preview

**Performance**:
- Calendar virtualization: Supports 10+ years of bookings
- Status updates: Debounced 300ms
- Search: Real-time filtering with memoization

**Constraints**:
- **Single VIN Enforcement**: UI prevents booking multiple different VINs in a single session.
- **Decomposed Architecture**: Logic is split across `src/components/booking/` (Grid, Sidebar, Header, Details) and `useBookingCalendar` hook.

---

### OrderFormModal

**Location**: [`src/components/orders/OrderFormModal.tsx`](../src/components/orders/OrderFormModal.tsx)

**Purpose**: Bulk order creation interface with multi-part support and VIN validation.

**Features**:
- Single or batch order entry
- Part number autocomplete
- VIN validation and formatting
- Quantity and notes input
- Attachment upload support
- Real-time form validation

**Props**:
```typescript
interface OrderFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (orders: PendingRow[]) => void;
  initialData?: Partial<PendingRow>;
}
```

**Usage**:
```tsx
<OrderFormModal
  open={isOpen}
  onOpenChange={setIsOpen}
  onSubmit={(orders) => {
    addOrders(orders);
  }}
/>
```

**Validation**:
- VIN format: 17-character alphanumeric
- Part number: Non-empty, max 20 chars
- Quantity: Positive integer
- Notes: Max 500 characters

---

### SearchResultsView

**Location**: [`src/components/shared/SearchResultsView.tsx`](../src/components/shared/SearchResultsView.tsx)

**Purpose**: Advanced search and filter interface across all inventory sheets.

**Features**:
- Multi-criteria filtering (VIN, Part#, Status)
- Date range filtering
- Full-text search
- Results pagination
- Quick actions on results
- Filter preset saving

**Search Criteria**:
```typescript
interface SearchCriteria {
  query: string;           // Full-text search (scans VIN, Name, Part#, Company)
  vin?: string;           // Exact VIN match
  company?: string;       // Company filter
  partNumber?: string;    // Partial part match
  status?: string[];      // Multiple statuses
  dateFrom?: string;      // ISO date
  dateTo?: string;        // ISO date
}
```

**Decomposed Architecture**:
- `SearchResultsHeader`: Toolbar and search input.
- `SearchResultsGrid`: Data display with tab identification.
- `SearchEmptyState`: Visual feedback for zero results.
- `useSearchResults`: Logic for multi-tab searching and filtering.

**Performance**:
- Indexed search: O(log n)
- Memoized result rendering
- Virtual scrolling for large result sets

---

## Modal Components

### ConfirmDialog

**Location**: [`src/components/shared/ConfirmDialog.tsx`](../src/components/shared/ConfirmDialog.tsx)

**Purpose**: Reusable confirmation dialog for destructive actions.

**Props**:
```typescript
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;    // Default: "Confirm"
  cancelLabel?: string;     // Default: "Cancel"
  destructive?: boolean;    // Red warning style
  onConfirm: () => void;
  onCancel: () => void;
}
```

**Usage**:
```tsx
<ConfirmDialog
  open={showDeleteConfirm}
  title="Delete Orders?"
  description="This action cannot be undone."
  destructive={true}
  confirmLabel="Delete"
  onConfirm={() => deleteOrders(selectedIds)}
  onCancel={() => setShowDeleteConfirm(false)}
/>
```

---

### EditNoteModal

**Location**: [`src/components/shared/EditNoteModal.tsx`](../src/components/shared/EditNoteModal.tsx)

**Purpose**: Modal for editing or creating notes on orders.

**Props**:
```typescript
interface EditNoteModalProps {
  open: boolean;
  rowId: string;
  currentNote?: string;
  onSave: (note: string) => void;
  onCancel: () => void;
}
```

---

### EditReminderModal

**Location**: [`src/components/shared/EditReminderModal.tsx`](../src/components/shared/EditReminderModal.tsx)

**Purpose**: Set customer reminders for follow-ups.

**Props**:
```typescript
interface EditReminderModalProps {
  open: boolean;
  rowId: string;
  onSet: (date: string, message: string) => void;
  onCancel: () => void;
}
```

---

### EditAttachmentModal

**Location**: [`src/components/shared/EditAttachmentModal.tsx`](../src/components/shared/EditAttachmentModal.tsx)

**Purpose**: Upload or manage order attachments.

**Features**:
- File upload (PDF, images)
- Attachment preview
- Delete existing attachments
- File size validation (max 10MB)

---

## Grid Components

### DataGrid & DynamicDataGrid

**Location**: 
- [`src/components/grid/DataGrid.tsx`](../src/components/grid/DataGrid.tsx)
- [`src/components/grid/DynamicDataGrid.tsx`](../src/components/grid/DynamicDataGrid.tsx)

**Purpose**: Reusable ag-Grid wrapper with column configuration and custom renderers.

**Props**:
```typescript
interface DataGridProps {
  rowData: PendingRow[];
  columnDefs: ColDef[];        // ag-Grid column definitions
  onSelectionChange?: (rows: PendingRow[]) => void;
  onCellClicked?: (params: CellClickedEvent) => void;
  height?: string;             // CSS height
  className?: string;
}
```

**Usage**:
```tsx
import { DynamicDataGrid } from "@/components/grid";

<DynamicDataGrid
  rowData={ordersRowData}
  columnDefs={orderColumnDefs}
  onSelectionChange={setSelectedRows}
/>
```

**Features**:
- Multi-select with checkboxes
- Column sorting and filtering
- Inline cell editing
- Custom cell renderers
- Status-based row styling
- Keyboard shortcuts (Ctrl+A, Delete, etc.)

**Custom Renderers**:
- `ActionCellRenderer` - Edit, delete, archive buttons
- `PartStatusRenderer` - Status dropdown with color coding
- `VINRenderer` - Formatted vehicle ID with link
- `DateRenderer` - Date formatting
- `AttachmentRenderer` - File count badge

---

### Grid Configuration

**Location**: [`src/components/grid/config/`](../src/components/grid/config/)

**columnTypes.ts**:
Defines reusable column type templates (id, vin, status, date, etc.)

**defaultOptions.ts**:
Global ag-Grid settings (theme, pagination, height, etc.)

**Example Configuration**:
```typescript
const orderColumnDefs = [
  {
    field: "id",
    headerName: "ID",
    width: 100,
    type: "id"
  },
  {
    field: "vin",
    headerName: "VIN",
    width: 180,
    type: "vin",
    filter: true,
    sort: "asc"
  },
  {
    field: "partNumber",
    headerName: "Part #",
    width: 120
  },
  {
    field: "status",
    headerName: "Status",
    width: 120,
    cellRenderer: "PartStatusRenderer",
    editable: true,
    cellEditor: "agRichSelectCellEditor"
  }
];
```

---

## Shared Components

### Header

**Location**: [`src/components/shared/Header.tsx`](../src/components/shared/Header.tsx)

**Purpose**: Top navigation bar with title and action buttons.

**Features**:
- Page title display
- Quick action buttons (New Order, Booking, etc.)
- Settings access
- Notification badge

---

### Sidebar

**Location**: [`src/components/shared/Sidebar.tsx`](../src/components/shared/Sidebar.tsx)

**Purpose**: Left navigation menu for route switching.

**Features**:
- Route links (Orders, Main Sheet, Call List, Booking, Archive)
- Active route highlighting
- Collapsible on mobile
- Icon and label display

---

### MainContentWrapper

**Location**: [`src/components/shared/MainContentWrapper.tsx`](../src/components/shared/MainContentWrapper.tsx)

**Purpose**: Layout wrapper for consistent page structure.

**Usage**:
```tsx
<MainContentWrapper>
  <Header title="Orders" />
  <DataGrid {...props} />
</MainContentWrapper>
```

---

### VINLineCounter

**Location**: [`src/components/shared/VINLineCounter.tsx`](../src/components/shared/VINLineCounter.tsx)

**Purpose**: Floating indicator for quick visibility of row and unique VIN counts.

**Features**:
- Real-time calculation of total lines vs unique VINs.
- Semi-transparent, blur-background design.
- Clickable/Hover effects for better engagement.

**Props**:
```typescript
interface VINLineCounterProps {
  rows: PendingRow[];
}
```

---

### Part Status Toolbar Dropdown

**Location**: Standardized across all page toolbars (`MainSheetToolbar`, `OrdersToolbar`, `BookingPage`, etc.)

**Purpose**: Unified interface for bulk updating part statuses of selected rows.

**Features**:
- **Standardized Icon**: Uses `CheckCircle` icon.
- **Rich Visuals**: Shows color bullets alongside status labels.
- **Bulk Action**: Updates all selected rows simultaneously.
- **Safety**: Wrapped in a Tooltip explaining the action.
- **Consistency**: Exact same UI and behavior in Main Sheet, Orders, Booking, Call List, and Archive.

---

### RowModals

**Location**: [`src/components/shared/RowModals.tsx`](../src/components/shared/RowModals.tsx)

**Purpose**: Container for all row action modals (edit, delete, archive, etc.)

**Features**:
- Edit note modal
- Edit reminder modal
- Edit attachment modal
- Archive reason modal
- Confirmation dialogs

---

## UI Primitives

All primitives from Radix UI with Tailwind styling.

### Available Components

| Component | Usage | Location |
|-----------|-------|----------|
| `Button` | Primary actions | `ui/button.tsx` |
| `Dialog` | Modal dialogs | `ui/dialog.tsx` |
| `Input` | Text input fields | `ui/input.tsx` |
| `Select` | Dropdown selection | (via Radix) |
| `Checkbox` | Toggle options | `ui/checkbox.tsx` |
| `Calendar` | Date picker | `ui/calendar.tsx` |
| `Popover` | Floating menus | `ui/popover.tsx` |
| `Tooltip` | Hover hints | `ui/tooltip.tsx` |
| `Textarea` | Multi-line input | `ui/textarea.tsx` |
| `Skeleton` | Loading placeholders | `ui/skeleton.tsx` |
| `Card` | Content containers | `ui/card.tsx` |
| `Command` | Search/command palette | `ui/command.tsx` |
| `DropdownMenu` | Context menus | `ui/dropdown-menu.tsx` |

---

## Component Patterns

### Pattern 1: Controlled Modal

```typescript
const [isOpen, setIsOpen] = useState(false);

<Modal
  open={isOpen}
  onOpenChange={setIsOpen}
  onConfirm={() => {
    handleAction();
    setIsOpen(false);
  }}
/>
```

---

### Pattern 2: Store-Connected Component

```typescript
import { useAppStore } from "@/store/useStore";

export const OrderList = () => {
  const ordersRowData = useAppStore(state => state.ordersRowData);
  const deleteOrders = useAppStore(state => state.deleteOrders);
  
  return (
    <DataGrid
      rowData={ordersRowData}
      onDelete={(ids) => deleteOrders(ids)}
    />
  );
};
```

---

### Pattern 3: Custom Cell Renderer

```typescript
interface StatusRendererProps {
  value: string;
  onStatusChange: (newStatus: string) => void;
}

export const StatusRenderer = ({ value, onStatusChange }: StatusRendererProps) => {
  return (
    <select
      value={value}
      onChange={(e) => onStatusChange(e.target.value)}
      className="px-2 py-1 border rounded"
    >
      <option>Pending</option>
      <option>Arrived</option>
      <option>Available</option>
    </select>
  );
};
```

---

## Best Practices

### 1. Component Composition

- Keep components focused on single responsibility
- Extract reusable logic into custom hooks
- Use composition over inheritance

### 2. State Management

- Minimal local state (UI-only)
- Global state via Zustand
- Lift state up when sharing between components

### 3. Performance

- Memoize expensive renders: `React.memo()`
- Use `useCallback` for event handlers
- Virtual scrolling for large lists

### 4. Accessibility

- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast compliance

### 5. Styling

- Use Tailwind utility classes
- Follow existing color scheme
- Responsive breakpoints: `sm:`, `md:`, `lg:`

---

## Testing Components

### Unit Tests (Vitest)

```typescript
import { render, screen } from "@testing-library/react";
import { OrderFormModal } from "@/components/shared";

describe("OrderFormModal", () => {
  it("should submit valid order data", () => {
    const onSubmit = vi.fn();
    render(
      <OrderFormModal open={true} onSubmit={onSubmit} onOpenChange={() => {}} />
    );
    
    // Fill form and submit
    screen.getByDisplayValue("").value = "VF1AB000123456789";
    screen.getByText("Submit").click();
    
    expect(onSubmit).toHaveBeenCalled();
  });
});
```

### E2E Tests (Playwright)

```typescript
test("should create and book order", async ({ page }) => {
  await page.goto("http://localhost:3000/orders");
  await page.click("button:has-text('New Order')");
  await page.fill("input[name='vin']", "VF1AB000123456789");
  await page.click("button:has-text('Create')");
  
  // Verify order in grid
  await expect(page.locator("text=VF1AB000123456789")).toBeVisible();
});
```

---

**Last Updated**: January 1, 2026
