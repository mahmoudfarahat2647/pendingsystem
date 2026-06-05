# Type Safety

## 🟡 WARNING — Missing return type annotation
**File:** `src\middleware.ts:33`
**Issue:** Exported function "middleware" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\global-error.tsx:7`
**Issue:** Exported function "GlobalError" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\layout.tsx:40`
**Issue:** Exported function "RootLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\page.tsx:9`
**Issue:** Exported function "RootPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\useColumnLayoutTracker.ts:11`
**Issue:** Exported function "useColumnLayoutTracker" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\useDraftSession.tsx:32`
**Issue:** Exported function "useDraftSession" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\useOrdersRealtimeSync.ts:10`
**Issue:** Exported function "useOrdersRealtimeSync" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\usePendingSearchSelection.ts:11`
**Issue:** Exported function "usePendingSearchSelection" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\useSelectedRowsSync.ts:8`
**Issue:** Exported function "useSelectedRowsSync" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\useStorageStats.ts:14`
**Issue:** Exported function "useStorageStats" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\useWarrantyExpiryMaintenance.ts:60`
**Issue:** Exported function "useWarrantyExpiryMaintenance" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\lib\auth-session.ts:4`
**Issue:** Exported function "getServerSession" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\lib\supabase-admin.ts:9`
**Issue:** Exported function "createServiceClient" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\lib\supabase-browser.ts:6`
**Issue:** Exported function "getSupabaseBrowserClient" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\lib\utils.ts:16`
**Issue:** Exported function "cn" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\services\orderService.ts:272`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\services\orderService.ts:84`
**Issue:** Exported function "createOrderService" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\apiResponse.test.ts:17`
**Issue:** Assertion "successResponse() as unknown as {
				status: number;
				bo" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\apiResponse.test.ts:32`
**Issue:** Assertion "successResponse(data, message) as unknown as {
				status: n" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\apiResponse.test.ts:45`
**Issue:** Assertion "successResponse(
				undefined,
				undefined,
				201,
			)" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\apiResponse.test.ts:61`
**Issue:** Assertion "errorResponse(
				"INTERNAL_ERROR",
				"An unexpected erro" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\apiResponse.test.ts:78`
**Issue:** Assertion "errorResponse(
				"VALIDATION_ERROR",
				"Invalid input",
" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\CallCustomerCounter.test.tsx:30`
**Issue:** Assertion "[
			{ id: "1", vin: "VIN123" },
			{ id: "2", vin: "" },
		" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\exportUtils.test.ts:128`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\exportUtils.test.ts:143`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\exportUtils.test.ts:26`
**Issue:** Assertion "{
			setAttribute: vi.fn(),
			style: { visibility: "" },
		" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\exportUtils.test.ts:39`
**Issue:** Assertion "null as unknown as Node" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\exportUtils.test.ts:42`
**Issue:** Assertion "null as unknown as Node" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\exportUtils.test.ts:128`
**Issue:** Assertion "document.createElement as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\exportUtils.test.ts:143`
**Issue:** Assertion "document.createElement as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\inventorySlice.test.ts:38`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\inventorySlice.test.ts:40`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\inventorySlice.test.ts:43`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\inventorySlice.test.ts:36`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Bypas" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\inventorySlice.test.ts:36`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Bypas" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\inventorySlice.test.ts:38`
**Issue:** Assertion "a[2] as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\inventorySlice.test.ts:40`
**Issue:** Assertion "a[2] as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\mobileOrderService.test.ts:23`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\mobileOrderService.test.ts:92`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\mobileOrderService.test.ts:95`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\mobileOrderService.test.ts:98`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\mobileOrderService.test.ts:92`
**Issue:** Assertion "supabase.from as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\mobileOrderService.test.ts:95`
**Issue:** Assertion "supabase.from as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\mobileOrderService.test.ts:98`
**Issue:** Assertion "ordersBuilder.insert as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\notificationSlice.test.ts:62`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\notificationSlice.test.ts:70`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\notificationSlice.test.ts:84`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\notificationSlice.test.ts:91`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\notificationSlice.test.ts:60`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Bypas" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\notificationSlice.test.ts:60`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Bypas" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\notificationSlice.test.ts:62`
**Issue:** Assertion "a[2] as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\notificationSlice.test.ts:82`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Bypas" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\notificationSlice.test.ts:82`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Bypas" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\notificationSlice.test.ts:84`
**Issue:** Assertion "a[2] as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:29`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValue: Function }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:59`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValueOnce: Function " bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:78`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValue: Function }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:103`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValueOnce: Function " bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:165`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValue: Function }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:290`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValue: Function }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:323`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValue: Function }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:351`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValue: Function }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:378`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValue: Function }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:417`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValue: Function }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:505`
**Issue:** Assertion "{ from: mockFrom } as unknown as Parameters<
				typeof crea" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\ordersSlice.test.ts:38`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\ordersSlice.test.ts:44`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\ordersSlice.test.ts:36`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Bypas" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\ordersSlice.test.ts:36`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Bypas" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\ordersSlice.test.ts:38`
**Issue:** Assertion "a[2] as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderWorkflow.test.ts:313`
**Issue:** Assertion "null as unknown as string" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderWorkflow.test.ts:314`
**Issue:** Assertion "undefined as unknown as string" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\quickTemplatesRoute.test.ts:31`
**Issue:** Assertion "{
		headers: new Headers(),
		url,
		json: () => Promise.res" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\quickTemplatesRoute.test.ts:198`
**Issue:** Assertion "res.body as unknown as { error: string }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\quickTemplatesRoute.test.ts:233`
**Issue:** Assertion "res.body as unknown as { id: string }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reservationLabels.test.ts:35`
**Issue:** Assertion "mockPrintWindow as unknown as Window" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\storageStatsRoute.test.ts:61`
**Issue:** Assertion "req as unknown as import("next/server").NextRequest" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\storageStatsRoute.test.ts:90`
**Issue:** Assertion "response.body as unknown as Record<string, unknown>" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\storageStatsRoute.test.ts:108`
**Issue:** Assertion "response.body as unknown as Record<string, unknown>" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\storageStatsRoute.test.ts:126`
**Issue:** Assertion "response.body as unknown as Record<string, unknown>" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\storageStatsRoute.test.ts:149`
**Issue:** Assertion "response.body as unknown as Record<string, unknown>" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\storageStatsRoute.test.ts:174`
**Issue:** Assertion "response.body as unknown as Record<string, unknown>" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\storageStatsRoute.test.ts:187`
**Issue:** Assertion "response.body as unknown as Record<string, unknown>" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useAutoMoveVins.test.ts:66`
**Issue:** Assertion "{
			data: [makeRow({ id: "r1", vin: "VIN111", status: "Arri" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useAutoMoveVins.test.ts:77`
**Issue:** Assertion "{
			data: [
				makeRow({ id: "r1", vin: "VIN222", status: " bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useAutoMoveVins.test.ts:95`
**Issue:** Assertion "{
			data: [
				makeRow({ id: "r1", vin: "VIN333", status: " bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useAutoMoveVins.test.ts:109`
**Issue:** Assertion "{
			data: [makeRow({ id: "r1", vin: "", status: "Arrived" }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useAutoMoveVins.test.ts:120`
**Issue:** Assertion "{
			data: undefined,
		} as unknown as ReturnType<typeof us" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useAutoMoveVins.test.ts:131`
**Issue:** Assertion "{
			data: [
				// VIN_A: all arrived → should move
				mak" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useAutoMoveVins.test.ts:156`
**Issue:** Assertion "{ data: [row] } as unknown as ReturnType<
			typeof useOrder" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useAutoMoveVins.test.ts:164`
**Issue:** Assertion "{
			data: [{ ...row }],
		} as unknown as ReturnType<typeof" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\useColumnLayoutTracker.test.ts:32`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useColumnLayoutTracker.test.ts:32`
**Issue:** Assertion "window as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useWarrantyExpiryMaintenance.test.ts:49`
**Issue:** Assertion "{
		id: "row-1",
		stage: "orders",
		vin: "VIN0001",
		repa" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\layout.tsx:14`
**Issue:** Exported function "AppLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(auth)\layout.tsx:5`
**Issue:** Exported function "AuthLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\draft-session-test\page.tsx:5`
**Issue:** Exported function "DraftSessionTestPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\mobile-order\layout.tsx:9`
**Issue:** Exported function "MobileOrderLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\mobile-order\page.tsx:29`
**Issue:** Exported function "MobileOrderPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\auth\AuthPageShell.tsx:17`
**Issue:** Exported function "AuthPageShell" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\auth\ForgotPasswordForm.tsx:13`
**Issue:** Exported function "ForgotPasswordForm" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\auth\LoginForm.tsx:17`
**Issue:** Exported function "LoginForm" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\auth\ResetPasswordForm.tsx:15`
**Issue:** Exported function "ResetPasswordForm" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\components\grid\DataGrid.tsx:339`
**Issue:** Assertion "params.data as unknown as object" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\orders\DuplicateOrderWarningModal.tsx:20`
**Issue:** Exported function "DuplicateOrderWarningModal" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\providers\QueryProvider.tsx:28`
**Issue:** Exported function "QueryProvider" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\BackupReportsTab.tsx:11`
**Issue:** Exported function "BackupReportsTab" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\FrequencyPicker.tsx:26`
**Issue:** Exported function "FrequencyPicker" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\LostSalesReportView.tsx:347`
**Issue:** Exported function "LostSalesReportView" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\ManualActionCard.tsx:23`
**Issue:** Exported function "ManualActionCard" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\RecipientsCard.tsx:26`
**Issue:** Exported function "RecipientsCard" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\ReportExportMenu.tsx:51`
**Issue:** Exported function "ReportExportMenu" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\ReportFilters.tsx:18`
**Issue:** Exported function "ReportFilters" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\ReportsHub.tsx:12`
**Issue:** Exported function "ReportsHub" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\SchedulingCard.tsx:22`
**Issue:** Exported function "SchedulingCard" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\shared\AppShell.tsx:22`
**Issue:** Exported function "AppShell" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\shared\EditableSelect.tsx:34`
**Issue:** Exported function "EditableSelect" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\shared\LayoutSaveButton.tsx:40`
**Issue:** Exported function "LayoutSaveButton" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\shared\Logo.tsx:1`
**Issue:** Exported function "Logo" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\shared\SelectAllByVinButton.tsx:17`
**Issue:** Exported function "SelectAllByVinButton" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\shared\SessionGuard.tsx:16`
**Issue:** Exported function "SessionGuard" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\components\shared\SettingsModal.tsx:32`
**Issue:** Assertion "window as unknown as { __SETTINGS_PASSWORD__?: string }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\shared\SidebarUserMenu.tsx:17`
**Issue:** Exported function "SidebarUserMenu" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\testing\DraftSessionRecoveryHarness.tsx:464`
**Issue:** Exported function "DraftSessionRecoveryHarness" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\badge.tsx:30`
**Issue:** Exported function "Badge" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:517`
**Issue:** Exported function "ChartTooltip" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:678`
**Issue:** Exported function "Grid" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:791`
**Issue:** Exported function "BarXAxis" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:882`
**Issue:** Exported function "BarYAxis" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:962`
**Issue:** Exported function "Bar" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:1135`
**Issue:** Exported function "Legend" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:1149`
**Issue:** Exported function "LegendItemComponent" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:1163`
**Issue:** Exported function "LegendMarker" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:1176`
**Issue:** Exported function "LegendLabel" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:1203`
**Issue:** Exported function "PatternLines" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:1260`
**Issue:** Exported function "BarLineIndicator" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:1617`
**Issue:** Exported function "BarChart" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\calendar.tsx:11`
**Issue:** Exported function "Calendar" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\date-time-picker.tsx:27`
**Issue:** Exported function "DateTimePicker" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\components\ui\origin-calendar.tsx:64`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\origin-calendar.tsx:11`
**Issue:** Exported function "Calendar" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\shining-text.tsx:11`
**Issue:** Exported function "ShiningText" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\simple-date-picker.tsx:30`
**Issue:** Exported function "SimpleDatePicker" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\skeleton.tsx:4`
**Issue:** Exported function "Skeleton" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\mutations\useUpdateAppSettingsMutation.ts:9`
**Issue:** Exported function "useUpdateAppSettingsMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\useAppSettingsQuery.ts:22`
**Issue:** Exported function "useAppSettingsQuery" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\useBulkDeleteOrdersMutation.ts:19`
**Issue:** Exported function "useBulkDeleteOrdersMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\useBulkUpdateOrderStageMutation.ts:27`
**Issue:** Exported function "useBulkUpdateOrderStageMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\useQuickTemplatesQuery.ts:9`
**Issue:** Exported function "quickTemplatesQueryKey" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\useQuickTemplatesQuery.ts:13`
**Issue:** Exported function "useQuickTemplatesQuery" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\useQuickTemplatesQuery.ts:21`
**Issue:** Exported function "useAddQuickTemplateMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\useQuickTemplatesQuery.ts:56`
**Issue:** Exported function "useRemoveQuickTemplateMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\useSaveOrderMutation.ts:18`
**Issue:** Exported function "useSaveOrderMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\api\mobile-order.route.test.ts:14`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\ManualActionCard.test.tsx:61`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\ManualActionCard.test.tsx:90`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\ManualActionCard.test.tsx:94`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\ManualActionCard.test.tsx:111`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\ManualActionCard.test.tsx:115`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\ManualActionCard.test.tsx:131`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\ManualActionCard.test.tsx:148`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\ManualActionCard.test.tsx:171`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\ManualActionCard.test.tsx:90`
**Issue:** Assertion "{ data: null } as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\ManualActionCard.test.tsx:91`
**Issue:** Assertion "{
			mutateAsync,
			isPending: false,
		} as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\ManualActionCard.test.tsx:103`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\ManualActionCard.test.tsx:112`
**Issue:** Assertion "{
			mutateAsync,
			isPending: true,
		} as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\ManualActionCard.test.tsx:123`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\ManualActionCard.test.tsx:140`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\ManualActionCard.test.tsx:163`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:43`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:57`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:70`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:94`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:97`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:100`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:118`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:134`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:152`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:169`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:188`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\RecipientsCard.test.tsx:94`
**Issue:** Assertion "{ data: null } as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\RecipientsCard.test.tsx:95`
**Issue:** Assertion "{
			mutate: addMutate,
		} as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\RecipientsCard.test.tsx:98`
**Issue:** Assertion "{
			mutate: removeMutate,
		} as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\RecipientsCard.test.tsx:110`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: ["a@test.com", "b@test" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\RecipientsCard.test.tsx:126`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\RecipientsCard.test.tsx:144`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\RecipientsCard.test.tsx:161`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\RecipientsCard.test.tsx:180`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: ["keep@test.com", "rem" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\reportSettingsService.test.ts:12`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\reportSettingsService.test.ts:30`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\reportSettingsService.test.ts:48`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\reportSettingsService.test.ts:73`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\reportSettingsService.test.ts:12`
**Issue:** Assertion "global.fetch as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\reportSettingsService.test.ts:30`
**Issue:** Assertion "global.fetch as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\reportSettingsService.test.ts:48`
**Issue:** Assertion "global.fetch as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\reportSettingsService.test.ts:73`
**Issue:** Assertion "global.fetch as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\reportSettingsSlice.test.ts:21`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\reportSettingsSlice.test.ts:22`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\reportSettingsSlice.test.ts:19`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Test-" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\reportSettingsSlice.test.ts:19`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Test-" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\reportSettingsSlice.test.ts:21`
**Issue:** Assertion "store as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\SchedulingCard.test.tsx:33`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\SchedulingCard.test.tsx:41`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\SchedulingCard.test.tsx:54`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\SchedulingCard.test.tsx:73`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\SchedulingCard.test.tsx:76`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\SchedulingCard.test.tsx:99`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\SchedulingCard.test.tsx:115`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\SchedulingCard.test.tsx:133`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\SchedulingCard.test.tsx:73`
**Issue:** Assertion "{ data: null } as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\SchedulingCard.test.tsx:74`
**Issue:** Assertion "{
			mutate,
		} as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\SchedulingCard.test.tsx:91`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\SchedulingCard.test.tsx:107`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\SchedulingCard.test.tsx:125`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\archive\layout.tsx:12`
**Issue:** Exported function "ArchiveLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\archive\page.tsx:65`
**Issue:** Exported function "ArchivePage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\booking\layout.tsx:12`
**Issue:** Exported function "BookingLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\booking\page.tsx:69`
**Issue:** Exported function "BookingPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\call-list\layout.tsx:12`
**Issue:** Exported function "CallListLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\call-list\page.tsx:68`
**Issue:** Exported function "CallListPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\dashboard\layout.tsx:12`
**Issue:** Exported function "DashboardLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\dashboard\page.tsx:40`
**Issue:** Exported function "DashboardPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\main-sheet\layout.tsx:12`
**Issue:** Exported function "MainSheetLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\main-sheet\page.tsx:57`
**Issue:** Exported function "MainSheetPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\orders\layout.tsx:11`
**Issue:** Exported function "OrdersLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\orders\page.tsx:44`
**Issue:** Exported function "OrdersPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\reports\page.tsx:3`
**Issue:** Exported function "ReportsPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(auth)\forgot-password\page.tsx:4`
**Issue:** Exported function "ForgotPasswordPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(auth)\login\page.tsx:8`
**Issue:** Exported function "LoginPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(auth)\reset-password\page.tsx:5`
**Issue:** Exported function "ResetPasswordPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\app-settings\route.ts:13`
**Issue:** Exported function "PATCH" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\health\route.ts:17`
**Issue:** Exported function "GET" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\health\route.ts:73`
**Issue:** Exported function "HEAD" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\mobile-order\route.ts:10`
**Issue:** Exported function "POST" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\quick-templates\route.ts:17`
**Issue:** Exported function "GET" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\quick-templates\route.ts:49`
**Issue:** Exported function "POST" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\quick-templates\route.ts:91`
**Issue:** Exported function "DELETE" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\report-settings\route.ts:16`
**Issue:** Exported function "GET" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\report-settings\route.ts:53`
**Issue:** Exported function "PATCH" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\storage-stats\route.ts:123`
**Issue:** Exported function "GET" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\trigger-backup\route.ts:8`
**Issue:** Exported function "POST" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\booking\hooks\useBookingCalendar.ts:31`
**Issue:** Exported function "useBookingCalendar" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\grid\hooks\useGridCallbacks.ts:18`
**Issue:** Exported function "useGridCallbacks" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\grid\hooks\useGridPerformance.ts:11`
**Issue:** Exported function "useGridPerformance" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\reports\useReportSettingsQuery.ts:9`
**Issue:** Exported function "useReportSettingsQuery" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\reports\useReportSettingsQuery.ts:16`
**Issue:** Exported function "useUpdateReportSettingsMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\reports\useReportSettingsQuery.ts:67`
**Issue:** Exported function "useAddEmailRecipientMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\reports\useReportSettingsQuery.ts:87`
**Issue:** Exported function "useRemoveEmailRecipientMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\reports\useReportSettingsQuery.ts:109`
**Issue:** Exported function "useTriggerManualBackupMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\maintenance\archive-expired-warranties\route.ts:5`
**Issue:** Exported function "GET" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\password-reset\request\route.ts:32`
**Issue:** Exported function "POST" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\orders\form\hooks\useOrderFormState.ts:7`
**Issue:** Exported function "useOrderFormState" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\orders\form\hooks\useOrderForm\useOrderParts.ts:5`
**Issue:** Exported function "useOrderParts" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\orders\form\hooks\useOrderForm\useOrderSubmit.ts:32`
**Issue:** Exported function "useOrderSubmit" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\orders\form\hooks\useOrderForm\useOrderValidation.ts:24`
**Issue:** Exported function "useOrderValidation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---
