# Performance

## 🔵 INFO — Query without pagination
**File:** `src\hooks\useSelectedRowsSync.ts:45`
**Issue:** "rowData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🟡 WARNING — Await in loop
**File:** `src\hooks\useWarrantyExpiryMaintenance.ts:122`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🟡 WARNING — Await in loop
**File:** `src\lib\batchUtils.ts:18`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🔵 INFO — Unguarded JSON operation
**File:** `src\services\appSettingsService.ts:28`
**Issue:** JSON.stringify can throw on malformed/large input but is not in try/catch.
**Fix:** Wrap in try/catch and validate size where relevant.

---

## 🟡 WARNING — Await in loop
**File:** `src\services\mobileOrderService.ts:114`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🔵 INFO — Query without pagination
**File:** `src\services\orderMapper.ts:22`
**Issue:** "row.order_reminders.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Unguarded JSON operation
**File:** `src\services\quickTemplatesService.ts:28`
**Issue:** JSON.stringify can throw on malformed/large input but is not in try/catch.
**Fix:** Wrap in try/catch and validate size where relevant.

---

## 🟡 WARNING — Await in loop
**File:** `src\services\warrantyMaintenanceService.ts:44`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\gridConfig.test.ts:44`
**Issue:** "columns.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\gridConfig.test.ts:51`
**Issue:** "columns.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\gridConfig.test.ts:84`
**Issue:** "columns.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\gridConfig.test.ts:108`
**Issue:** "result.current.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\gridConfig.test.ts:165`
**Issue:** "columns.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\gridConfig.test.ts:166`
**Issue:** "columns.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\gridConfig.test.ts:167`
**Issue:** "columns.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\gridConfig.test.ts:175`
**Issue:** "columns.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\mobileOrderService.test.ts:92`
**Issue:** "(supabase.from as any).mock.results.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\ordersSlice.test.ts:90`
**Issue:** "state.ordersRowData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\ordersSlice.test.ts:93`
**Issue:** "state.ordersRowData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\ordersSlice.test.ts:96`
**Issue:** "state.ordersRowData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🟡 WARNING — Await in loop
**File:** `src\test\passwordResetRequestRoute.test.ts:105`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🔵 INFO — Unguarded JSON operation
**File:** `src\test\passwordResetRequestRoute.test.ts:31`
**Issue:** JSON.stringify can throw on malformed/large input but is not in try/catch.
**Fix:** Wrap in try/catch and validate size where relevant.

---

## 🔵 INFO — Unguarded JSON operation
**File:** `src\test\quickTemplatesService.test.ts:81`
**Issue:** JSON.stringify can throw on malformed/large input but is not in try/catch.
**Fix:** Wrap in try/catch and validate size where relevant.

---

## 🟡 WARNING — Await in loop
**File:** `src\components\shared\EditAttachmentModal.tsx:144`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🟡 WARNING — Await in loop
**File:** `src\components\shared\EditAttachmentModal.tsx:197`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🟡 WARNING — Await in loop
**File:** `src\components\shared\EditAttachmentModal.tsx:212`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:388`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:389`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:390`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:391`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:392`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:393`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:394`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:395`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:396`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:397`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:398`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:399`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:400`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:401`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:402`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:403`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:404`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\Sidebar.tsx:104`
**Issue:** "getOrdersByStageFromCache("orders").find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\Sidebar.tsx:110`
**Issue:** "getOrdersByStageFromCache("main").find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\domain\order\orderWorkflow.ts:380`
**Issue:** "partStatuses.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Unguarded JSON operation
**File:** `src\services\reports\reportSettingsService.ts:24`
**Issue:** JSON.stringify can throw on malformed/large input but is not in try/catch.
**Fix:** Wrap in try/catch and validate size where relevant.

---

## 🟡 WARNING — Await in loop
**File:** `src\store\slices\draftSessionSlice.ts:462`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🟡 WARNING — Await in loop
**File:** `src\store\slices\draftSessionSlice.ts:625`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🟡 WARNING — Await in loop
**File:** `src\store\slices\draftSessionSlice.ts:628`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🟡 WARNING — Await in loop
**File:** `src\store\slices\draftSessionSlice.ts:647`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🔵 INFO — Unguarded JSON operation
**File:** `src\store\slices\draftSessionSlice.ts:326`
**Issue:** JSON.stringify can throw on malformed/large input but is not in try/catch.
**Fix:** Wrap in try/catch and validate size where relevant.

---

## 🔵 INFO — Query without pagination
**File:** `src\store\slices\notificationSlice.ts:41`
**Issue:** "state.notifications.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\store\slices\notificationSlice.ts:188`
**Issue:** "sources.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\store\slices\notificationSlice.ts:233`
**Issue:** "sources.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\store\slices\notificationSlice.ts:309`
**Issue:** "state.notifications.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\store\slices\uiSlice.ts:101`
**Issue:** "state.partStatuses.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Unguarded JSON operation
**File:** `src\test\api\mobile-order.route.test.ts:35`
**Issue:** JSON.stringify can throw on malformed/large input but is not in try/catch.
**Fix:** Wrap in try/catch and validate size where relevant.

---

## 🔵 INFO — Unguarded JSON operation
**File:** `src\test\api\mobile-order.route.test.ts:204`
**Issue:** JSON.stringify can throw on malformed/large input but is not in try/catch.
**Fix:** Wrap in try/catch and validate size where relevant.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\reports\lostSalesAnalysis.test.ts:102`
**Issue:** "result.topParts.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\reports\lostSalesAnalysis.test.ts:335`
**Issue:** "result.modelDemand.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\reports\lostSalesAnalysis.test.ts:337`
**Issue:** "result.modelDemand.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\app\(app)\archive\page.tsx:108`
**Issue:** "effectiveData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\app\(app)\booking\page.tsx:117`
**Issue:** "effectiveBookingData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\app\(app)\call-list\page.tsx:158`
**Issue:** "effectiveData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\app\(app)\main-sheet\page.tsx:99`
**Issue:** "effectiveRowData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\app\(app)\main-sheet\page.tsx:221`
**Issue:** "selectedRows.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\app\(app)\orders\useOrdersPageHandlers.ts:100`
**Issue:** "effectiveOrdersData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\app\(app)\orders\useOrdersPageHandlers.ts:347`
**Issue:** "selectedRows.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🟡 WARNING — Await in loop
**File:** `src\app\api\storage-stats\route.ts:48`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🟡 WARNING — Await in loop
**File:** `src\app\api\storage-stats\route.ts:62`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\booking\hooks\useBookingCalendar.ts:140`
**Issue:** "sidebarGroupedBookings.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\booking\hooks\useBookingCalendar.ts:147`
**Issue:** "allBookings.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\grid\renderers\CntrRdgCellRenderer.tsx:20`
**Issue:** "state.notifications.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\grid\renderers\PartStatusRenderer.tsx:19`
**Issue:** "statuses.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\grid\renderers\PartStatusRenderer.tsx:42`
**Issue:** "statuses.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\grid\renderers\StatusRenderer.tsx:12`
**Issue:** "statuses.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\search\hooks\useSearchResultsState.ts:352`
**Issue:** "searchResults.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\search\hooks\useSearchResultsState.ts:385`
**Issue:** "searchResults.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\search\hooks\useSearchResultsState.ts:445`
**Issue:** "searchResults.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🟡 WARNING — Await in loop
**File:** `src\components\orders\form\hooks\useOrderForm\useOrderSubmit.ts:120`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\orders\form\hooks\useOrderForm\useOrderSubmit.ts:141`
**Issue:** "Object.values(props.partValidationWarnings).find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\orders\form\hooks\useOrderForm\useOrderSubmit.ts:145`
**Issue:** "props.parts.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\orders\form\hooks\useOrderForm\useOrderSubmit.ts:148`
**Issue:** "Object.keys(props.partValidationWarnings).find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---
