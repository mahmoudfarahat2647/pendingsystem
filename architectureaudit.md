# Clean Architecture Audit — pendingsystem

**Date:** 2026-06-10  
**Stack:** Next.js 15 App Router · Supabase · React Query · Zustand · Better Auth  
**Scope:** `src/` (316 TypeScript files)

---

## Layer Map

| Clean Architecture Ring | Project Folder(s) |
|---|---|
| **Entities / Domain** | `src/domain/`, `src/types/` |
| **Use Cases / Application** | `src/hooks/`, `src/store/` (UI-local state only) |
| **Interface Adapters** | `src/services/`, `src/schemas/`, `src/lib/` (mapping/query helpers) |
| **Frameworks & Drivers** | `src/app/` (Next.js routes), `src/components/`, `src/lib/` (infra: auth, supabase, postgres) |

The golden dependency rule: **inner rings must never import from outer rings.**

---

## Executive Summary

The codebase has a recognisable layered structure and several good patterns (injectable repository, adapter port for React Query, zero `console.*` leakage, Zod validation at the persistence boundary). However, **4 High and 7 Medium violations** mean the dependency direction is regularly reversed, the domain layer is not pure, and server state leaks into Zustand.

---

## Findings

| # | Severity | Area | Short description |
|---|---|---|---|
| H1 | **High** | Domain purity | Domain imports `@/lib/` at runtime |
| H2 | **High** | Type ownership | `OrderStage` enum lives in `services/` layer |
| H3 | **High** | Component → Service | Components call `orderService` directly at runtime |
| H4 | **High** | Server state in Zustand | `reportSettingsSlice` async-fetches via service |
| M1 | **Medium** | lib → store | `lib/orderStageTransitions` imports store slice type |
| M2 | **Medium** | Schema → lib | `schemas/` imports from `lib/` utility functions |
| M3 | **Medium** | Fat route handlers | 5 API routes exceed 50-LOC / contain business logic |
| M4 | **Medium** | Oversized service | `orderRepository.ts` at 606 LOC (limit: 500) |
| M5 | **Medium** | hook → app route | Hook imports DTO from `app/api/` |
| M6 | **Medium** | UI in store | `draftSessionSlice` imports `toast` from Sonner |
| M7 | **Medium** | Storage logic in component | `EditAttachmentModal` calls Supabase storage directly |
| L1 | Low | Dead re-exports | Back-compat shims in `orderService.ts` and `lib/orderWorkflow.ts` |
| L2 | Low | Missing DTOs at UI boundary | `PendingRow` entity crosses all layer boundaries |
| L3 | Low | Docs drift | `.claude/rules/architecture.md` referenced but absent |

---

## Detailed Findings

---

### H1 — Domain Layer Impure

**Severity:** High  
**Files:**
- `src/domain/company/company.ts` lines 2–4
- `src/domain/order/orderWorkflow.ts` line 7 (has a `biome-ignore` comment acknowledging "pre-existing debt")

**Violation:** Domain entities/pure logic import from `@/lib/`, which is the infrastructure/adapter ring. This creates a hidden coupling: the domain can no longer be tested or reused without the full lib layer.

```ts
// src/domain/company/company.ts — CURRENT (violates CA)
import { logger } from "@/lib/logger";                      // ❌ lib is outer ring
import { ALLOWED_COMPANIES } from "@/lib/ordersValidationConstants"; // ❌

// src/domain/order/orderWorkflow.ts — CURRENT
// biome-ignore lint/style/noRestrictedImports: pre-existing debt — domain using lib constants
import { ... } from "@/lib/ordersValidationConstants";      // ❌
```

**Fix:**

1. Move `ALLOWED_COMPANIES` and the validation constants that domain code needs into `src/domain/order/constants.ts`.
2. Remove `logger` from domain functions — return result/error objects instead of logging side-effects.

```ts
// src/domain/order/constants.ts — NEW
export const ALLOWED_COMPANIES = ["Toyota", "Ford", ...] as const;

// src/domain/company/company.ts — AFTER
import { ALLOWED_COMPANIES } from "@/domain/order/constants"; // ✅ same ring
// No logger import — return { valid: false, reason: "..." } instead
```

---

### H2 — `OrderStage` Domain Enum Lives in the Services Layer

**Severity:** High  
**Files:**
- `src/services/orderService.ts` lines 4–5 (defines and exports `OrderStage`)
- Imported by: `src/lib/orderStage.ts`, `src/lib/orderStageTransitions.ts`, `src/lib/queryClient.ts`, `src/lib/queryCacheHelpers.ts`, `src/store/types.ts`, `src/store/slices/draftSessionSlice.ts`, `src/store/slices/draftSessionCommands.ts`, `src/components/shared/Header.tsx`

**Violation:** A core domain concept is owned by the outermost service facade. Every inner layer (`lib/`, `store/`, even `components/`) imports from `services/` just to use a string enum, inverting the dependency direction for all of them.

**Fix:** Move `OrderStage` to `src/types/index.ts` (already imported widely) or `src/domain/order/orderStage.ts`, and update all import sites.

```ts
// src/domain/order/orderStage.ts — NEW
export type OrderStage = "orders" | "main" | "call" | "booking" | "archive";
export const ORDER_STAGE_VALUES = ["orders","main","call","booking","archive"] as const;

// All former importers change one line:
import type { OrderStage } from "@/domain/order/orderStage"; // ✅
```

---

### H3 — Components Call Services Directly at Runtime

**Severity:** High  
**Files:**
- `src/components/orders/form/hooks/useOrderForm/useOrderSubmit.ts` line 4, 120
- `src/components/orders/form/hooks/useOrderForm/useOrderValidation.ts` line 12, 138

**Violation:** Component-scoped hooks call `orderService.checkHistoricalVinPartDuplicate()` directly. This bypasses the React Query cache, skips the optimistic mutation pattern, makes the component untestable without a real service, and violates the architecture rule "components only via hooks/".

```ts
// useOrderSubmit.ts — CURRENT (violates CA)
import { orderService } from "@/services/orderService"; // ❌
...
const result = await orderService.checkHistoricalVinPartDuplicate(...);
```

**Fix:** Extract a dedicated query hook and call only that from the component.

```ts
// src/hooks/queries/useHistoricalDuplicateCheck.ts — NEW
import { useQuery } from "@tanstack/react-query";
import { createOrderRepository } from "@/services/orderService";
import { supabase } from "@/lib/supabase";

const repo = createOrderRepository(supabase);

export function useHistoricalDuplicateCheck(vin: string, partNo: string) {
  return useQuery({
    queryKey: ["duplicate-check", vin, partNo],
    queryFn: () => repo.checkHistoricalVinPartDuplicate(vin, partNo),
    enabled: vin.length >= 6,
  });
}

// useOrderSubmit.ts — AFTER
// No service import — call useHistoricalDuplicateCheck() hook instead ✅
```

---

### H4 — Server State Fetched and Cached in Zustand

**Severity:** High  
**Files:**
- `src/store/slices/reportSettingsSlice.ts` lines 3, 22–93

**Violation:** The slice runtime-imports `reportSettingsService`, performs async fetches inside `fetchReportSettings()`, and stores the server response in Zustand. This contradicts the data-ownership rule ("React Query is the source of truth for live operational data") and couples the state layer to an infrastructure service. Error handling also embeds a fallback entity (`temp-id`), mixing infrastructure concerns into state.

```ts
// reportSettingsSlice.ts — CURRENT (violates CA)
import { reportSettingsService } from "@/services/reports/reportSettingsService"; // ❌
...
fetchReportSettings: async () => {
  const reportSettings = await reportSettingsService.getReportSettings(); // ❌ service in store
  set({ reportSettings });
}
```

**Fix:** Delete the async actions from the slice, keep only UI-preference state (loading flags if needed for optimistic UX), and migrate to React Query.

```ts
// src/hooks/queries/reports/useReportSettingsQuery.ts — NEW
export function useReportSettingsQuery() {
  return useQuery({
    queryKey: ["report-settings"],
    queryFn: () => reportSettingsService.getReportSettings(),
  });
}

// src/hooks/mutations/useUpdateReportSettingsMutation.ts — NEW
export function useUpdateReportSettingsMutation() {
  return useMutation({ mutationFn: reportSettingsService.updateReportSettings });
}
```

---

### M1 — `lib/` Imports Store Slice Type

**Severity:** Medium  
**File:** `src/lib/orderStageTransitions.ts` line 9

**Violation:** `lib/` must not import from `store/`. `PatchRowCommand` is a command-object type that logically belongs with the domain commands, not in a Zustand slice.

```ts
// lib/orderStageTransitions.ts — CURRENT
import type { PatchRowCommand } from "@/store/slices/draftSessionSlice"; // ❌
```

**Fix:** Move `PatchRowCommand` (and sibling command types) to `src/types/commands.ts` or `src/domain/order/commands.ts` and import from there in both `lib/` and `store/`.

---

### M2 — Schemas Import Runtime Helpers from `lib/`

**Severity:** Medium  
**Files:**
- `src/schemas/form.schema.ts` lines 3, 5 — imports `isAllowedCompanyName`, `normalizeCompanyName` from `@/lib/company`; `normalizeMileageAsNumber` from `@/lib/utils`
- `src/schemas/mobileOrder.schema.ts` lines 3, 5 — same pattern

Note: `src/schemas/order.schema.ts` was already migrated to import from `@/domain/...` — the two files above were not.

**Fix:** Move the functions these schemas need into `src/domain/` (following the pattern already established by `order.schema.ts`) and update the imports.

```ts
// form.schema.ts — AFTER
import { isAllowedCompanyName, normalizeCompanyName } from "@/domain/company/company"; // ✅
import { normalizeMileageAsNumber } from "@/domain/order/mileage";                     // ✅
```

---

### M3 — Business Logic Inside API Route Handlers

**Severity:** Medium  
**Files:**

| Route | LOC | Issue |
|---|---|---|
| `src/app/api/storage-stats/route.ts` | 229 | Recursive bucket traversal + timeout orchestration inline |
| `src/app/api/quick-templates/route.ts` | 120 | Inline Supabase queries; `quickTemplatesService.ts` exists but is bypassed |
| `src/app/api/trigger-backup/route.ts` | 109 | GitHub Actions orchestration inline |
| `src/app/api/report-settings/route.ts` | 88 | Direct Supabase calls instead of via service |
| `src/app/api/password-reset/request/route.ts` | 99 | Email + token logic inline |

**Fix pattern** (apply to each): Extract all non-parse/non-auth logic into a service. Route becomes parse → authorize → service.call() → respond in ≤50 LOC.

```ts
// storage-stats/route.ts — AFTER (simplified)
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await storageStatsService.getStats(); // ✅ all logic delegated
  return NextResponse.json(stats);
}
```

---

### M4 — `orderRepository.ts` Exceeds 500-LOC Limit

**Severity:** Medium  
**File:** `src/services/orderRepository.ts` — 606 LOC

**Violation:** Architecture rules cap service files at 500 LOC and require splitting into repo/mapper/use-case.

**Fix:** The mapper already exists as `src/services/orderMapper.ts`. Extract stage-transition use-cases (e.g. `moveToMain`, `moveToArchive`) into dedicated files under `src/services/order/` and reduce the repository to pure CRUD + query primitives.

---

### M5 — Hook Imports DTO from an App Route

**Severity:** Medium  
**File:** `src/hooks/useStorageStats.ts` line 4

```ts
import type { StorageStatsResponse } from "@/app/api/storage-stats/route"; // ❌
```

**Violation:** `hooks/` → `app/` is a reverse dependency. If the route is ever refactored the hook breaks.

**Fix:** Move `StorageStatsResponse` to `src/types/index.ts` and import from there in both the route and the hook.

---

### M6 — Toast Side-Effect Called from Zustand Slice

**Severity:** Medium  
**File:** `src/store/slices/draftSessionSlice.ts` line 1

```ts
import { toast } from "sonner"; // ❌ UI library in state layer
```

**Violation:** The state layer should be pure — it should not know about UI toast notifications. This makes the slice untestable without mocking a UI library and couples persistence logic to presentation.

**Fix:** Remove the `toast` import from the slice. Surface results through state flags (`lastSaveResult`, `lastSaveError`) and let the component/hook layer observe and toast.

---

### M7 — Supabase Storage Mutation Inside a Component

**Severity:** Medium  
**File:** `src/components/shared/EditAttachmentModal.tsx` lines 53, 62, 114–117

**Violation:** The component directly calls `supabase.storage.from(...).remove()` and `.upload()`. Infrastructure calls belong in `src/services/`, not in component files.

**Fix:** Create `src/services/attachmentService.ts` (a thin wrapper over Supabase storage) and expose it through a mutation hook. The component calls only the hook.

```ts
// src/services/attachmentService.ts — NEW
export const attachmentService = {
  upload: (bucket: string, path: string, file: File) =>
    supabase.storage.from(bucket).upload(path, file),
  remove: (bucket: string, path: string) =>
    supabase.storage.from(bucket).remove([path]),
  getPublicUrl: (bucket: string, path: string) =>
    supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl,
};
```

---

### L1 — Dead Back-Compat Re-Exports

**Severity:** Low  
**Files:**
- `src/services/orderService.ts` — exports deprecated alias `createOrderService = createOrderRepository`
- `src/lib/orderWorkflow.ts` — entire file is `export * from "@/domain/order/orderWorkflow"`

**Fix:** Update the two known call sites to import from the canonical path, then delete the shims.

---

### L2 — `PendingRow` Entity Crosses All Boundaries Without DTOs

**Severity:** Low  
**Note:** The `PendingRow` entity is passed from Supabase rows all the way to grid cell renderers with no view-model or DTO adapter at any boundary. This is a common pragmatic trade-off in small-to-mid apps. Flagged for awareness; a `GridRowViewModel` type at the component boundary would insulate the UI from schema changes.

---

### L3 — `.claude/rules/architecture.md` Referenced but Absent

**Severity:** Low  
**File:** `CLAUDE.md` references `.claude/rules/architecture.md` as "full reference" for architecture standards.  
**Fix:** Either create the file or remove the reference.

---

## Testability Assessment

| Layer | Independently Testable? | Notes |
|---|---|---|
| `src/domain/` | ✅ Yes | Pure functions, no framework deps. Tests exist in `src/test/domain/`. Caveat: H1 lib imports break full isolation. |
| `src/services/` | ✅ Yes (with injection) | `createOrderRepository(supabaseClient)` accepts injectable client. `mobileOrderService.test.ts` confirms the pattern works. |
| `src/store/` | ⚠️ Partial | Most slices testable. `reportSettingsSlice` (H4) requires mocking a service. `draftSessionSlice` (M6) requires mocking Sonner. |
| `src/hooks/` | ⚠️ Partial | H3 hooks require mocking `orderService`. After fix they would only need React Query test wrappers. |
| `src/app/api/` | ⚠️ Partial | Thin routes are easy to test. Fat routes (M3) require mocking Supabase, GitHub API, etc. inline. |
| `src/components/` | ⚠️ Partial | M7 (`EditAttachmentModal`) requires mocking Supabase storage directly in component tests. |

---

## Positive Patterns Worth Preserving

1. **`src/store/ordersQueryAdapter.ts`** — Textbook dependency-inversion port. The store defines an interface; the outer `QueryProvider` registers a concrete React Query adapter at startup. Inner layer never imports the framework. Keep and apply this pattern to `reportSettingsSlice`.
2. **`createOrderRepository(supabaseClient)`** — Injectable dependency. Services are fully testable without a real database.
3. **`PersistedOrderRowSchema` validation in `orderMapper.ts`** — Zod guard at the persistence boundary prevents corrupt rows reaching the domain.
4. **Zero `console.*` in `src/`** — All logging routed through `@/lib/logger` with a single commented-out debug line correctly wrapped in a comment.
5. **`createServiceClient` from `@/lib/supabase-admin`** — All API routes use the shared factory; no inline `createClient()` calls.
6. **Test coverage breadth** — 50+ test files spanning domain logic, slices, hooks, routes, and components.

---

## Priority Remediation Order

1. **H2** — Move `OrderStage` to `src/types/` (small change, fixes imports across all layers at once)
2. **H1** — Move constants to domain, remove logger from domain files
3. **M2** — Align remaining schemas to import from `@/domain/` (follows the already-established `order.schema.ts` pattern)
4. **M1** — Move command types out of the slice into `src/types/`
5. **H3** — Extract `useHistoricalDuplicateCheck` hook
6. **H4** — Migrate `reportSettingsSlice` async actions to React Query
7. **M5, M6, M7** — DTO relocation, toast extraction, attachment service
8. **M3, M4** — Route handler extraction + repository split (larger refactors, do last)
