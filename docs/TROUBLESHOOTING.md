# Troubleshooting Guide

Common issues and solutions for the Renault Pending System.

---

## Table of Contents

1. [Grid & Display Issues](#grid--display-issues)
2. [State Management Issues](#state-management-issues)
3. [Performance Issues](#performance-issues)
4. [Booking & Calendar Issues](#booking--calendar-issues)
5. [Data Import Issues](#data-import-issues)
6. [Browser & Environment Issues](#browser--environment-issues)
7. [Build & Deployment Issues](#build--deployment-issues)

---

## Grid & Display Issues

### Grid Not Loading / Empty Grid

**Symptoms**: ag-Grid appears empty or doesn't render

**Solutions**:

1. **Check ag-grid-community version**
   ```bash
   npm list ag-grid-community
   # Should be 32.3.3
   ```

2. **Verify gridTheme import**
   ```typescript
   // ✅ Correct
   import { gridTheme } from "@/lib/ag-grid-setup";
   
   // ❌ Incorrect
   import { theme } from "@/lib/ag-grid-setup";
   ```

3. **Check grid container height**
   ```tsx
   // Grid needs explicit parent height
   <div style={{ height: "600px" }}>
     <DataGrid rowData={data} columnDefs={columns} />
   </div>
   ```

4. **Verify rowData is not null**
   ```typescript
   const rowData = useAppStore(state => state.rowData) || [];
   // Fallback to empty array
   ```

---

### Column Headers Missing or Misaligned

**Solutions**:

1. **Check columnDefs structure**
   ```typescript
   // ✅ Valid
   const columnDefs = [
     { field: "id", headerName: "ID", width: 100 },
     { field: "vin", headerName: "VIN", width: 180 }
   ];
   
   // ❌ Invalid - missing field or headerName
   const columnDefs = [
     { width: 100 }
   ];
   ```

2. **Verify column width values**
   - Minimum: 50px
   - Recommended: 100-200px
   - Total should fit container

3. **Check column filter/sort settings**
   ```typescript
   {
     field: "status",
     headerName: "Status",
     filter: true,        // Enables filter UI
     sortable: true,      // Enables sorting
     width: 120
   }
   ```

---

### Cells Not Editable

**Solutions**:

1. **Enable cell editing**
   ```typescript
   {
     field: "quantity",
     headerName: "Qty",
     editable: true,  // ← Required
     cellEditor: "agNumberCellEditor"
   }
   ```

2. **Check cellEditor type**
   ```typescript
   // Valid editors
   cellEditor: "agTextCellEditor"           // Text input
   cellEditor: "agNumberCellEditor"         // Number only
   cellEditor: "agRichSelectCellEditor"     // Dropdown
   cellEditor: "agDateCellEditor"           // Date picker
   ```

---

### Custom Cell Renderer Not Working

**Solutions**:

1. **Register custom renderer**
   ```typescript
   import { ActionCellRenderer } from "@/components/grid/renderers";
   
   {
     field: "actions",
     cellRenderer: ActionCellRenderer,  // Component reference
     width: 150
   }
   ```

2. **Verify props in renderer**
   ```typescript
   interface CellRendererProps {
     value: any;
     data: PendingRow;
     node: RowNode;
     api: GridApi;
   }
   
   export const CustomRenderer = (props: CellRendererProps) => {
     return <div>{props.value}</div>;
   };
   ```

---

## State Management Issues

### State Not Persisting After Refresh

**Symptoms**: Data disappears when page reloads

**Solutions**:

1. **Clear browser storage and reload**
   ```javascript
   // In browser console
   localStorage.clear();
   location.reload();
   ```

2. **Check localStorage size limits**
   ```javascript
   // Estimate size
   const state = JSON.stringify(localStorage);
   console.log((new Blob([state]).size / 1024).toFixed(2) + " KB");
   // Typical limit: 5-10MB
   ```

3. **Verify persist middleware is active**
   ```typescript
   // useStore.ts should have:
   persist(
     (...a) => ({ /* slices */ }),
     {
       name: "pending-sys-storage-v1.1",  // ← Key name
       partialize: (state) => { /* ... */ }
     }
   )
   ```

4. **Check excluded data in partialize**
   ```typescript
   // These are NOT persisted (intentional):
   // - commits (history)
   // - undoStack, redos
   // - searchResults
   // - highlightedRowId
   ```

---

### Selected Rows Not Updating

**Symptoms**: Grid selection doesn't reflect in store

**Solutions**:

1. **Ensure onSelectionChange handler connected**
   ```tsx
   <DataGrid
     rowData={data}
     onSelectionChange={(rows) => {
       setSelectedRows(rows);  // ← Must call store action
     }}
   />
   ```

2. **Check selection mode in columnDefs**
   ```typescript
   {
     field: "select",
     headerName: "",
     checkboxSelection: true,  // ← Required for multi-select
     width: 50
   }
   ```

---

### Updates Not Reflecting Across All Sheets

**Symptoms**: Change in Orders doesn't update Main Sheet

**Solutions**:

1. **Use updateOrders instead of updateOrder**
   ```typescript
   // ✅ Correct - updates everywhere
   updateOrders(ids, updates);
   
   // ❌ Incorrect - only updates one sheet
   rowData[0] = { ...rowData[0], ...updates };
   ```

2. **Verify action exists in all slices**
   ```typescript
   // ordersSlice.ts must have updateOrder handler
   // inventorySlice.ts must have updateOrder handler
   // (shared across all sheets)
   ```

---

## Performance Issues

### Grid Slow with Large Datasets (1000+ rows)

**Solutions**:

1. **Enable column virtualization**
   ```typescript
   columnDefs: {
     suppressColumnVirtualization: false,  // ← Default
   }
   ```

2. **Use faster update pattern**
   ```typescript
   // ❌ Slow - full array recreation
   const newRows = rows.map(r => 
     r.id === id ? { ...r, status: "Updated" } : r
   );
   
   // ✅ Fast - index-based lookup
   const idx = rows.findIndex(r => r.id === id);
   const newRows = [...rows];
   newRows[idx] = { ...newRows[idx], status: "Updated" };
   ```

3. **Paginate results**
   ```typescript
   const defaultColDef = {
     pagination: true,
     paginationPageSize: 100,  // ← Limit rows per page
   };
   ```

4. **Reduce localStorage size**
   ```typescript
   // Clear old commits beyond 48h
   const cutoff = Date.now() - (48 * 60 * 60 * 1000);
   const recentCommits = commits.filter(c => c.timestamp > cutoff);
   ```

---

### Booking Calendar Laggy with Large History

**Solutions**:

1. **Limit historical bookings**
   ```typescript
   const twoYearsAgo = subYears(new Date(), 2);
   const relevantBookings = bookings.filter(b => 
     isAfter(new Date(b.date), twoYearsAgo)
   );
   ```

2. **Memoize calendar grid**
   ```typescript
   const MemoizedCalendarGrid = React.memo(BookingCalendarGrid);
   
   <MemoizedCalendarGrid
     currentMonth={month}
     bookingData={bookings}
   />
   ```

---

### High Memory Usage

**Solutions**:

1. **Check for memory leaks in event listeners**
   ```typescript
   // ✅ Cleanup on unmount
   useEffect(() => {
     const handler = () => { /* ... */ };
     window.addEventListener("resize", handler);
     return () => window.removeEventListener("resize", handler);
   }, []);
   ```

2. **Limit notification history**
   ```typescript
   const MAX_NOTIFICATIONS = 100;
   if (notifications.length > MAX_NOTIFICATIONS) {
     notifications = notifications.slice(-MAX_NOTIFICATIONS);
   }
   ```

---

## Booking & Calendar Issues

### Booking Modal Not Opening

**Symptoms**: Click booking button but modal doesn't appear

**Solutions**:

1. **Check modal open state**
   ```typescript
   const [isOpen, setIsOpen] = useState(false);
   
   // Verify setIsOpen is called
   <button onClick={() => setIsOpen(true)}>Book</button>
   ```

2. **Verify selectedRows not empty**
   ```typescript
   if (!selectedRows || selectedRows.length === 0) {
     showNotification("Select rows before booking");
     return;
   }
   ```

3. **Check modal parent z-index**
   ```css
   /* Modal should have high z-index */
   .modal {
     z-index: 50;  /* Tailwind default */
   }
   ```

---

### Calendar Not Showing Dates

**Solutions**:

1. **Verify date format**
   ```typescript
   // ✅ Correct ISO format
   const date = "2025-01-15";
   
   // ❌ Incorrect
   const date = "01/15/2025";
   ```

2. **Check date-fns imports**
   ```typescript
   import { format, isAfter, subYears } from "date-fns";
   // All date operations must use date-fns
   ```

---

### Booking Not Triggering Auto-move

**Symptoms**: Booked customer doesn't move to Booking sheet

**Solutions**:

1. **Verify sendToBooking is called**
   ```typescript
   const { sendToBooking } = useAppStore();
   sendToBooking(selectedIds, date, note, status);
   ```

2. **Check IDs match across sheets**
   ```javascript
   // In console:
   const { ordersRowData, rowData, bookingRowData } = useAppStore.getState();
   const id = "test-id";
   console.log(ordersRowData.find(r => r.id === id));
   console.log(rowData.find(r => r.id === id));
   console.log(bookingRowData.find(r => r.id === id));
   // ID should exist in at least one sheet
   ```

---

## Data Import Issues

### CSV Import Not Working

**Symptoms**: File select doesn't process, data not added

**Solutions**:

1. **Check file format**
   ```
   ✅ Required columns:
   - vin
   - partNumber
   - partDescription
   - quantity
   - baseId (optional)
   
   ✅ File format: CSV only (not Excel)
   ✅ Encoding: UTF-8
   ```

2. **Verify VIN validation**
   ```typescript
   // VIN must be 17 characters
   if (vin.length !== 17) {
     addNotification("Invalid VIN: must be 17 characters");
   }
   ```

3. **Check part number length**
   ```typescript
   // Part number: max 20 characters
   if (partNumber.length > 20) {
     addNotification("Part number too long (max 20)");
   }
   ```

---

### Imported Data Disappeared

**Solutions**:

1. **Check if accidentally archived**
   ```javascript
   const { archiveRowData } = useAppStore.getState();
   console.log("Archived count:", archiveRowData.length);
   ```

2. **Check undo/redo stack**
   ```javascript
   // Last action might have been undone
   const { undoStack } = useAppStore.getState();
   console.log("Undo stack:", undoStack);
   ```

3. **Verify addOrders was called**
   ```javascript
   // Check console for "Add Multiple Orders" commit
   const { commits } = useAppStore.getState();
   commits.forEach(c => console.log(c.action, c.timestamp));
   ```

---

## Browser & Environment Issues

### Page Freezes / Unresponsive

**Symptoms**: UI doesn't respond to clicks

**Solutions**:

1. **Check for blocking operations**
   ```typescript
   // Avoid blocking operations in event handlers
   const handleLargeUpdate = (ids) => {
     // ❌ Blocks UI
     const results = ids.map(id => expensiveComputation(id));
     
     // ✅ Non-blocking
     setTimeout(() => {
       updateOrders(ids, updates);
     }, 0);
   };
   ```

2. **Reduce grid render updates**
   ```typescript
   // Use debounce for frequent updates
   const debouncedUpdate = useMemo(
     () => debounce((id, updates) => updateOrder(id, updates), 300),
     []
   );
   ```

3. **Clear browser cache**
   - DevTools → Application → Clear Storage → Clear All

---

### "ag-grid-community not installed" Error

**Solutions**:

```bash
# Reinstall ag-grid
npm uninstall ag-grid-community ag-grid-react
npm install ag-grid-community@32.3.3 ag-grid-react@32.3.3
```

---

### Dark Mode Not Applied

**Solutions**:

1. **Check theme import**
   ```typescript
   import { gridTheme } from "@/lib/ag-grid-setup";
   
   <DataGrid
     className={gridTheme}
     // ... other props
   />
   ```

2. **Verify Tailwind CSS loaded**
   - Check DevTools → Elements → Find `<style>` tag

---

### TypeScript Errors

**Common Types Missing**:

```typescript
// ✅ Import from @/types
import type { PendingRow, CellRenderer, StateActions } from "@/types";

// Make sure types are exported from types/index.ts
```

---

## Build & Deployment Issues

### Build Fails with TypeScript Errors

**Solutions**:

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Fix common issues
npm run lint  # Check Biome issues
npm test      # Run test suite
```

---

### Next.js Build Size Too Large

**Solutions**:

1. **Analyze bundle**
   ```bash
   npm install -D @next/bundle-analyzer
   # Add to next.config.ts and run build
   ```

2. **Remove unused dependencies**
   ```bash
   npm ls  # Find unused packages
   npm prune
   ```

---

### Playwright Tests Failing

**Solutions**:

1. **Install browser**
   ```bash
   npx playwright install
   ```

2. **Run tests in headed mode for debugging**
   ```bash
   npm run e2e:headed
   ```

3. **Check selectors**
   ```typescript
   // Use stable selectors
   await page.click('button[role="button"]:has-text("Book")');
   ```

---

## Getting Help

### Debug Checklist

- [ ] Browser console for errors (F12)
- [ ] Network tab for failed requests
- [ ] localStorage state via console
- [ ] Store state: `useAppStore.getState()`
- [ ] Check for JavaScript disabled
- [ ] Try incognito mode
- [ ] Clear cache and reload

### Useful Console Commands

```javascript
// Check store state
useAppStore.getState()

// Get specific data
useAppStore.getState().ordersRowData

// Recent actions
useAppStore.getState().commits.slice(-10)

// Undo last action
useAppStore.getState().undo()

// Export state for debugging
copy(JSON.stringify(useAppStore.getState()))
```

---

**Last Updated**: December 30, 2025
**Still have issues?** Check [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines
