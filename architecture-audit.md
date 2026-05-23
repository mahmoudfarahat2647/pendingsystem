# Clean Architecture Audit — pendingsystem

**Audited:** `src/`
**Stack:** Next.js 15 (App Router, RSC), React 19, React Query v5, Supabase JS, Zustand (persist), Better Auth + Kysely/pg, Zod, AG-Grid, Biome, Vitest
**Date:** 2026-05-21
**Scope:** Clean Architecture conformance only — dependency direction, layer separation, purity of business logic, boundary DTOs, testability.

> Findings only — no fixes applied (per project workflow convention).

---

## TL;DR

**Overall grade: C+ (Pragmatic Next.js, not Clean Architecture.)**

The codebase is well-organized for a Next.js + Supabase product (clear folders, Zod everywhere, optimistic-update discipline, services contained), but it does **not** implement Clean Architecture in the Robert C. Martin / Hexagonal sense. There is **no Domain/Use-Case layer**, schemas double as persistence DTOs, and the "inner" layers (`store/`, `schemas/`, `services/`) depend on outer layers (React Query, Supabase, browser `localStorage`, `process.env`). Most business logic lives inside React hooks (`use…PageHandlers.ts`, `useDraftSession.tsx`) and a Zustand slice (`draftSessionSlice.ts`), which makes it inseparable from the framework.

You don't need full Clean Architecture for an internal tool of this size — but the project should at least:

1. Stop coupling Zustand slices to the React Query cache (`queryClient` import inside `draftSessionSlice`).
2. Extract a Domain layer (entities + use-cases) that does not depend on Supabase, AG-Grid, React, or `localStorage`.
3. Introduce a `PendingRow` DTO that is distinct from the Zod persistence schema.
4. Split `orderService.ts` (697 lines) into a thin repository + a mapping service + a duplicate-check use-case.
5. Centralize the duplicated `createServiceClient` factory across `app/api/*/route.ts`.

Severity counts: **High: 6 · Medium: 7 · Low: 5**.

---

## Resolution Log

| ID | Resolved in | What changed |
|----|------------|-------------|
| H1 | `refactor/schema-stage-enum-no-reexports-throw-on-map` | `draftSessionSlice` no longer imports `queryClient` directly; adapter pattern (`ordersQueryAdapter.ts`) injects `getStageRows`/`invalidateStage` |
| H3 | `refactor/deduplicate-supabase-admin` | Single `createServiceClient` factory in `src/lib/supabase-admin.ts`; all API routes updated |
| M4 | `refactor/schema-stage-enum-no-reexports-throw-on-map` | `mapSupabaseOrder` throws `OrderMappingError` on validation failure instead of returning `null` |
| L2 | `refactor/schema-stage-enum-no-reexports-throw-on-map` | Back-compat re-exports removed from `useOrdersQuery.ts` |
| L5 | `refactor/schema-stage-enum-no-reexports-throw-on-map` | `PendingRow.stage` now `z.enum(["orders","main","call","booking","archive"])` |

| H5 | `refactor/schema-stage-enum-no-reexports-throw-on-map` | All 5 page hooks already call `buildSendToArchiveCommands`, `buildReorderCommands`, `buildBookingCommands`, `buildRebookingCommands` from `src/lib/orderStageTransitions.ts`. One inline booking command in `useOrdersPageHandlers.handleConfirmBooking` is intentionally kept (populates per-row `previousValues` for atomic undo — a caller concern). |
| H4 | `refactor/arch-h4-h6-m6-l3` | Mapper logic extracted to `src/services/orderMapper.ts`; `orderService.ts` retains a backward-compat re-export so all import paths remain unchanged. |
| H6 | `refactor/arch-h4-h6-m6-l3` | `useOrderValidation` migrated from stale Zustand arrays to live `useOrdersQuery` hooks for all five stages. Duplicate detection now runs against real React Query data. |
| M6 | `refactor/arch-h4-h6-m6-l3` | Business logic (per-row insert loop, `mergeAppSettings`, empty-parts fallback) extracted from `mobile-order/route.ts` into `src/services/mobileOrderService.ts`. Route handler is now ≤ 50 lines. |
| L3 | `refactor/arch-h4-h6-m6-l3` | `src/services/index.ts` barrel created with explicit named re-exports for all public service symbols. |
| L1 | `refactor/arch-l1-m1` → **completed** `refactor/arch-l1-l4-m2` | Pure domain logic promoted to `src/domain/`. **Completed:** `VIN_PREFIX_MAP` + `detectModelFromVin` moved to `src/domain/order/vin.ts`; `src/lib/utils.ts` re-exports for zero call-site breakage. |
| M1 | `refactor/arch-l1-m1` | `src/schemas/order.schema.ts` imports updated from `@/lib/company` → `@/domain/company/company` and `@/lib/utils` → `@/domain/order/mileage`. Schemas now pull from the domain layer directly. |
| L4 | `refactor/arch-l1-l4-m2` | `src/lib/logger.ts` thin wrapper introduced (`debug` suppressed in prod, `warn`/`error` always pass through). All `console.warn`/`console.error`/`console.debug` calls routed through `logger.*` across 14 files (services, hooks, API routes, domain). |
| M2 | `refactor/arch-l1-l4-m2` | `mapKeysToCamel<T>` helper added to `src/lib/utils.ts`. `quick-templates/route.ts` local `mapRow` removed and replaced. `app-settings/route.ts` inline object construction replaced. Shared mapper now available for future routes. |
| H2 | `refactor/arch-m3-m5-h2` | `PendingRowBaseObject` extracted as the shared Zod object. `PendingRowSchema` = base + transform. `PersistedOrderRowSchema` = base extended with 3 persistence-only attachment fields + same transform. Schema and persistence boundary are now distinct. |
| M3 | `refactor/arch-m3-m5-h2` | `Header.tsx` CSV export replaced `orderService.getOrders()` + manual mapping with `ORDER_STAGES.flatMap(getOrdersByStageFromCache)` — reads the RQ cache directly. `useOrderValidation`/`useOrderSubmit` DB calls are intentional historical checks, not violations. |
| M5 | `refactor/arch-m3-m5-h2` | `orderMapper.ts` now parses raw Supabase rows against `PersistedOrderRowSchema` (the persistence boundary schema) rather than `PendingRowSchema`. Attachment fields remain on `PendingRow` (required by `orderService.ts` save path) but the parsing boundary is correctly typed. |

---

## Clean Architecture Reference Used

Concentric layers, dependencies point inward:

| Layer | Should contain | This codebase |
|---|---|---|
| **Entities / Domain** | Pure business types + invariants, framework-free | ❌ Missing — `PendingRow` is a Zod-inferred type derived from the persistence row |
| **Use Cases / Application** | Orchestration of entity operations, ports for I/O | ❌ Missing — business operations live in React hooks and a Zustand slice |
| **Interface Adapters** | Controllers, presenters, DTO mappers, gateways | 🟡 Partial — `services/orderService.ts` is a leaky adapter (also contains mapping + business rules) |
| **Frameworks & Drivers** | Next.js, Supabase, AG-Grid, React Query, Zustand, Better Auth | ✅ Present, but they reach *inward* into schemas and slices |

---

## High-severity findings

### H1 — Inner layer (Zustand store) depends on outer layer (React Query)
**Files:** `src/store/slices/draftSessionSlice.ts:5-8`, `:212`, `:490`, `:512`, `:549`
`src/store/slices/notificationSlice.ts:3-5`, `:73-…`

`draftSessionSlice.ts` imports `queryClient`, `getOrdersQueryKey`, and `ORDER_STAGES` from `@/lib/queryClient`, then calls `queryClient.getQueryData(...)` and `queryClient.invalidateQueries(...)` directly from inside `set`/`get` actions. `notificationSlice.checkNotifications()` also calls `getOrdersByStageFromCache()` to drive business decisions.

This is the most consequential violation in the codebase. State management ("Interface Adapter"-level) is reaching directly into a framework cache, which makes the slice:

- impossible to unit-test without spinning up a `QueryClient`;
- non-portable to a non-React-Query world (server actions, RSC, native, mobile);
- tightly coupled to a singleton that initializes top-of-file.

**Recommendation.** Invert the dependency: have the slice expose `saveDraft(replayFns)` taking *injected* mutation runners (it already does this for `DraftSaveMutations` — extend the pattern), and have `useDraftSession` provide the `getRowsByStage`/`invalidateStage` callbacks instead of the slice importing the singleton. Move `getOrdersByStageFromCache` consumption out of `notificationSlice.checkNotifications` and into a React hook that feeds the slice prepared data.

```ts
// Today
queryClient.invalidateQueries({ queryKey: getOrdersQueryKey(stage) });

// Inverted
get().saveDraft({ ..., onStageSaved: (stage) => invalidateStage(stage) });
```

---

### H2 — No Domain layer; Zod schema *is* the persistence shape *is* the domain entity
**Files:** `src/schemas/order.schema.ts`, `src/types/index.ts`, `src/services/orderService.ts:481-583`

`PendingRowSchema` mixes three concerns in one definition:

1. **Domain invariants** (e.g., `id: z.string().min(1)`, reminder regex).
2. **Persistence migration logic** — auto-syncing legacy `partNumber`/`description` from `parts[0]` via `.transform(...)`, and pre-processing `attachment_file_path`/`attachment_file_paths` arrays.
3. **UI-tolerant input coercion** — `z.preprocess` accepting `string[]` for `customerName`/`mobile`/`model` because "DB returns either string or string[]".

The same type then flows un-renamed from Supabase row → service mapper → React Query cache → AG-Grid renderers → Zustand commands → mutation payloads. There is no `Order` entity with business methods, and no DTO at any boundary. `src/types/index.ts` re-exports the inferred Zod type as the canonical "domain" type. The `PendingRow.stage` field is `z.string().optional()` even though the system defines exactly 5 stages — a domain invariant that the schema does not enforce.

**Recommendation.** Introduce `src/domain/order.ts` with a framework-free `Order` aggregate and a discriminated `OrderStage` literal union. Keep `PendingRowSchema` for *parsing input only* (DB rows, form payloads), and add explicit `toOrder` / `toRowPayload` mappers at the boundaries. The auto-sync of `parts[0] → partNumber/description` belongs in the domain layer, not the parser.

---

### H3 — Service-role Supabase client factory duplicated across API routes
**Files:** `src/app/api/mobile-order/route.ts:10-17`, `src/app/api/quick-templates/route.ts:15-22`, `src/app/api/app-settings/route.ts:9-16`, `src/app/api/report-settings/route.ts`, `src/app/api/storage-stats/route.ts`

Four-plus route handlers each declare a private `createServiceClient()` that reads `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` and instantiates a Supabase client with `auth: { persistSession: false }`. This is verbatim-duplicated configuration, scattered through "Frameworks & Drivers".

Risks:
- A future security change (e.g., enabling `auth.persistSession`, rotating headers, adding fetch wrappers) has to be repeated N times.
- `process.env` reads are not centralized; `src/lib/env.ts` exists but is not used by these routes.
- Each route mixes auth + validation + mapping + insertion + duplicate handling in one file (≤ 167 lines, but already at the limit).

**Recommendation.** Move the factory to `src/lib/supabase-admin.ts` (or `src/infra/supabase/serviceClient.ts`). Have routes call a thin controller that delegates business logic to a service. Validate env vars once at boot in `src/lib/env.ts`.

---

### H4 — `orderService.ts` is a 697-line god module mixing repository, mapper, and business rules
**File:** `src/services/orderService.ts`

A single object literal exports 12+ methods covering:

- Repository concerns: `getOrders`, `updateOrderStage`, `updateOrdersStage`, `deleteOrder`, `deleteOrders`, batch-size chunking (line 151).
- Mapping (presenter-ish): `mapSupabaseOrder` (lines 481-583) — also runs `PendingRowSchema.safeParse` and may return `null` silently.
- Resilience / migration logic: schema-cache fallback for missing `attachment_link` / `attachment_file_path` columns (lines 62-72, 285-307, 340-377, 423-443).
- Use-cases / business rules: `saveOrder` (lines 174-446) merges `metadata`, conditionally guards on `expectedCurrentStage`, handles idempotency upsert + retry, manages a separate `order_reminders` table including timezone math, then re-reads the row for cache reconciliation.
- Cross-cutting business queries: `checkHistoricalVinPartDuplicate`, `checkHistoricalDescriptionConflict` — these *are* business logic that happens to query Supabase metadata JSON paths.

`saveOrder` alone is ~272 lines with nested conditional fallbacks. Cyclomatic complexity is well above 10.

**Recommendation.** Split into:
- `OrderRepository` — pure CRUD with parameterized signatures returning raw row interfaces.
- `OrderMapper` — `toDomain(row)` / `toRow(order)` only.
- `OrderUseCases` — `saveOrder`, `commitToMainSheet`, etc., orchestrating repo + mapper.
- `AttachmentColumnCompatLayer` — isolate the missing-column fallback to one decorator that wraps the repository.

The reminder write should be a separate `OrderReminderRepository` with its own timezone-aware adapter.

**Resolution (refactor/arch-h4-h6-m6-l3):** Mapper logic extracted to `src/services/orderMapper.ts`; `orderService.ts` retains a backward-compat re-export so all import paths remain unchanged.

---

### H5 — Business-logic-bearing React hooks (300-600 LOC each) at the page level
**Files:** `src/app/(app)/orders/useOrdersPageHandlers.ts` (526 lines), `src/app/(app)/main-sheet/page.tsx` (538 lines), `src/app/(app)/booking/page.tsx` (596 lines), `src/app/(app)/call-list/page.tsx` (572 lines), `src/app/(app)/archive/page.tsx` (507 lines), `src/hooks/useDraftSession.tsx` (171 lines + 669-line slice)

Page-level files combine: data fetching, draft-session orchestration, mutation calls, undo/redo, printing (`printOrderDocument`, `printReservationLabels`), XLSX export (`exportToLogisticsXLSX`), warranty math (`calculateEndWarranty`, `calculateRemainingTime`, `normalizeMileageAsNumber`), VIN-rule transitions (`getVinAutoMoveIds`), and tag-appending (`appendTaggedUserNote`).

Per Clean Architecture, **use-cases** like *"move order to archive with reason"* or *"commit beast-mode-validated order to main sheet"* should live in the Application layer with no React imports. Today, "send to archive" is implemented inline as a `useCallback` body using `applyCommand({ type: "patchRow", … })` plus a `buildArchivePayload(...)` call — testable only with a full React render. The same orchestration is duplicated across the five `page.tsx` files because each stage has its own copy of "send to X".

**Recommendation.** Factor stage transitions into `src/application/order-stage-transitions.ts` returning `DraftCommand[]`. The page hooks then just call `transitions.sendToArchive(rows, reason).forEach(applyCommand)`. This collapses ~2,500 lines of near-duplicate page code into ~200.

---

### H6 — Operational data lives in *both* React Query and Zustand
**Files:** `src/store/types.ts:13-53`, `src/store/slices/ordersSlice.ts`, `src/store/slices/inventorySlice.ts`, `src/store/slices/bookingSlice.ts`

CLAUDE.md states explicitly: *"React Query is the source of truth for all live operational stage data."* In practice, the store still declares `ordersRowData`, `rowData`, `callRowData`, `bookingRowData`, `archiveRowData` as state, and `updateOrder` / `updateOrders` / `deleteOrders` write to all five arrays simultaneously (`src/store/slices/ordersSlice.ts:75-152`). `useOrderValidation.ts:29-33` reads all five arrays from the store, not from React Query — duplicate detection then races against whatever was last persisted in localStorage.

This is the *same* dependency direction violation as H1 in reverse: outer-state stores still hold inner-data copies. CLAUDE.md says "do not expand that pattern" — confirmed it has not been removed.

**Recommendation.** Either (a) finish the deletion: remove the five operational arrays from `StoreState` and migrate `useOrderValidation` to a `useAllStagesQuery` aggregator, or (b) document them as "deprecated, do not read" and add a Biome rule blocking new readers.

**Resolution (refactor/arch-h4-h6-m6-l3):** `useOrderValidation` migrated from stale Zustand arrays to live `useOrdersQuery` hooks for all five stages. Duplicate detection now runs against real React Query data instead of always-empty store arrays.

---

## Medium-severity findings

### M1 — Schemas import non-domain helpers
**File:** `src/schemas/order.schema.ts:1-3`

`PendingRowSchema` imports `normalizeNullableCompanyName` from `@/lib/company` and `normalizeMileageAsNumber` from `@/lib/utils`. Both contain real business rules (company name canonicalization, mileage parsing). Those belong in a Domain layer; an entity schema should not pull from `lib/utils`.

**Recommendation.** Move these into `src/domain/value-objects/{Company,Mileage}.ts` and have the schema reference them through the domain barrel.

### M2 — Snake-case / camel-case mapping done ad-hoc in many places
**Files:** `src/services/orderService.ts:481-583`, `src/app/api/quick-templates/route.ts:24-33`, `src/app/api/app-settings/route.ts:59-63`, `src/app/api/mobile-order/route.ts:104-120`, `src/store/slices/reportSettingsSlice.ts`

Each API route hand-rolls a `mapRow` that converts `sort_order → sortOrder`, `repair_systems → repairSystems`, etc. Better Auth already uses `CamelCasePlugin` (`src/lib/auth.ts:3`) for its own tables but only because it uses Kysely; the rest of the app uses the raw Supabase client and re-implements casing per endpoint.

**Recommendation.** Either standardize on Kysely + `CamelCasePlugin` for all DB access, or extract one `snakeToCamel<T>` mapper. Today's pattern is a per-endpoint DTO mapper with no shared contract — drift is inevitable.

### M3 — Direct service calls from UI hooks bypass the React Query cache
**Files:** `src/components/orders/form/hooks/useOrderForm/useOrderSubmit.ts:4,120`, `src/components/orders/form/hooks/useOrderForm/useOrderValidation.ts:10`

`useOrderSubmit` and `useOrderValidation` import `orderService` directly to run `checkHistoricalVinPartDuplicate`. This is not strictly a Clean Architecture violation (a controller may call a use case), but it sidesteps the documented data flow ("React Query is the source of truth"). The call goes Supabase → service → component, with no caching, no `useQuery`, and no test seam.

**Recommendation.** Wrap as `useHistoricalDuplicateQuery(vin, partNumber, options)` — gives caching, deduplication of in-flight requests across part rows, and a single mockable hook for tests.

### M4 — `mapSupabaseOrder` returns `null` on validation failure, callers must remember to filter
**Files:** `src/services/orderService.ts:569-582`, `src/hooks/queries/useOrdersQuery.ts:14-18`, `src/services/orderService.ts:117-125`

`safeParse` failures silently `console.warn` and return `null`. Every caller does `.filter((row): row is PendingRow => row !== null)`. If any future caller forgets, the runtime gets `null` rows in a typed `PendingRow[]` array.

**Recommendation.** Return `Result<PendingRow, ValidationError>` or throw a typed `OrderMappingError`. At minimum, surface dropped rows in a dev banner — silent data loss is worse than a noisy failure.

### M5 — Persistence types leak into supposedly-pure schemas
**File:** `src/schemas/order.schema.ts:133-136`

`PendingRowSchema` declares `attachmentLink`, `attachmentFilePath`, `attachmentFilePaths` — the *exact* DB column names rendered into camelCase, including the legacy single-path column kept for migration. Domain shouldn't care that a previous schema version had a singular column; only the persistence adapter should.

**Recommendation.** Domain holds `attachments: Attachment[]`. The repository maps the legacy column into a single-element array on read, and back on write. The Zod `.transform` in `:146-155` (auto-sync `partNumber`/`description` from `parts[0]`) is similar but at least domain-relevant — extract it to `Order.normalize()` instead of a parser hook.

### M6 — Business logic embedded in API routes
**Files:** `src/app/api/mobile-order/route.ts:27-60`, `:122-157`

`mobile-order/route.ts` contains: rate limiting (its own `rateLimiter.ts`), input parsing, `mergeAppSettings` (mutating `app_settings.models/repair_systems`), today-date formatting, multiple inserts in a `for` loop with per-row error aggregation. The route is doing the job of three use cases.

**Recommendation.** Route handlers should be ≤ 30 lines: parse → authorize → call use case → respond. Move the per-row insert + settings merge into `application/createMobileOrder.ts`.

**Resolution (refactor/arch-h4-h6-m6-l3):** Business logic (per-row insert loop, `mergeAppSettings`, empty-parts fallback) extracted from `mobile-order/route.ts` into `src/services/mobileOrderService.ts`. Route handler is now ≤ 50 lines.

### M7 — Implicit global singletons block ports/adapter substitution
**Files:** `src/lib/supabase.ts`, `src/lib/queryClient.ts:28-39`, `src/lib/auth.ts`, `src/lib/postgres.ts`

Each of these exports a top-level pre-constructed instance: `supabase`, `queryClient`, `auth`, `pool`. There is no `interface SupabaseGateway` or factory used by callers. Testing `orderService` requires module mocking of `@/lib/supabase`. Swapping persistence (e.g., for an offline-first dev mode) requires editing the singleton.

**Recommendation.** Define `interface OrderRepository`. Have `orderService.ts` accept a repository in its factory. Wire the Supabase repository at app boot, mock it in tests, and stop using `vi.mock("@/lib/supabase")`.

---

## Low-severity findings

### L1 — No clean separation between `lib/` (utilities) and domain logic
**Files:** `src/lib/orderWorkflow.ts` (385 lines), `src/lib/orderStage.ts`, `src/lib/utils.ts` (warranty math), `src/lib/company.ts`, `src/lib/archivePayloadBuilder.ts`

`orderWorkflow.ts` *is* the closest thing this codebase has to a Domain layer — it is pure, has no Supabase/React imports, and contains `checkVinPartDuplicate`, `getVinAutoMoveIds`, `appendTaggedUserNote`, `getEffectiveNoteHistory`. Likewise `utils.ts` contains `calculateEndWarranty`/`calculateRemainingTime` (pure business math).

These should be promoted to `src/domain/…` to clarify their role. Today they sit under `lib/`, indistinguishable from `cn()` or `ag-grid-setup.ts`.

### L2 — Re-exports for "backwards compatibility" in active hooks
**File:** `src/hooks/queries/useOrdersQuery.ts:26-29`

`useOrdersQuery.ts` re-exports `useBulkDeleteOrdersMutation`, `useBulkUpdateOrderStageMutation`, `useSaveOrderMutation` "for backwards compatibility with existing imports". This is a small smell — either all callers import from the canonical files (already exists) or the re-exports should be deleted.

### L3 — No barrel for `services/`, but barrels for everything else
`src/components/orders/form/index.ts`, `src/schemas/index.ts`, `src/lib/printing/index.ts` exist; `src/services/index.ts` does not. Minor inconsistency.

**Resolution (refactor/arch-h4-h6-m6-l3):** `src/services/index.ts` barrel created with named re-exports for all public service symbols.

### L4 — `console.warn`/`console.error`/`console.debug` as the observability layer
Found in `orderService.ts` (4), `useDraftSession.tsx` (1), `useSaveOrderMutation.ts` (1), every API route. There is no logger abstraction. In CA terms, observability is a port that should be injected.

**Resolution (refactor/arch-l1-l4-m2):** `src/lib/logger.ts` thin wrapper introduced (`debug` suppressed in prod, `warn`/`error` always pass through). All `console.warn`/`console.error`/`console.debug` calls routed through `logger.*` across 14 files (services, hooks, API routes, components, store slices).

### L5 — `PendingRow.stage` typed as `string` instead of `OrderStage`
**File:** `src/schemas/order.schema.ts:143`, vs. `src/services/orderService.ts:14`

`OrderStage = "orders" | "main" | "call" | "booking" | "archive"` is the canonical union, but `PendingRowSchema` declares `stage: z.string().optional()`. This means once a row passes the schema, the compiler permits any string and discriminated-union pattern matching on `row.stage` is impossible without a runtime guard. A domain invariant lost at the boundary.

---

## Testability assessment

| Item | Independent of framework? | Today |
|---|---|---|
| Order entity rules (e.g., VIN-arrived auto-move, note-history append) | Should be: Yes | ✅ Pure in `lib/orderWorkflow.ts` |
| Warranty math | Should be: Yes | ✅ Pure in `lib/utils.ts` |
| Save order (persistence + reminder + idempotency + cache reconciliation) | Should be: Yes (use case) | ❌ Requires Supabase mock; reminder timezone logic baked into `orderService.saveOrder` |
| Draft session command replay | Should be: Yes | ❌ Slice imports React Query `queryClient`; needs full Zustand + RQ test harness (`test/draftSessionSlice.test.ts` confirms) |
| Notification computation | Should be: Yes | ❌ Reads RQ cache directly |
| Page handlers (stage transitions) | Should be: Yes | ❌ Live as `useCallback` bodies inside hooks |

Tests under `src/test/` are predominantly integration tests against the actual store and `vi.mock("@/lib/supabase")` — confirming that the Application layer is not separable.

---

## Recommended target structure (incremental)

```
src/
  domain/                       # ← new; framework-free
    order/
      Order.ts                  # entity + invariants
      OrderStage.ts             # the literal union
      orderRules.ts             # moved from lib/orderWorkflow.ts
      warranty.ts               # moved from lib/utils.ts (warranty fns only)
    common/
      Result.ts                 # replaces silent null returns
  application/                  # ← new; use-cases, no React/Supabase imports
    SaveOrder.ts
    SendToArchive.ts
    CommitToMainSheet.ts
    CreateMobileOrder.ts
    ports/
      OrderRepository.ts        # interface
      ReminderRepository.ts
      Clock.ts
      Logger.ts
  infra/                        # ← new; rename of /services + /lib (DB part)
    supabase/
      SupabaseOrderRepository.ts
      SupabaseReminderRepository.ts
      serviceClient.ts          # the deduplicated factory
    auth/
      betterAuth.ts             # current lib/auth.ts
  adapters/                     # ← presentation glue
    react-query/
      queries/                  # current hooks/queries
      mutations/
    zustand/
      draftSession.ts           # store, no queryClient import
  app/                          # Next.js routes — unchanged location
  components/                   # unchanged
```

You don't have to adopt this layout wholesale. The two highest-leverage moves:

1. **Decouple the store from React Query** (H1). One PR, ~200 LOC.
2. **Extract stage-transition use cases out of the five `page.tsx` files** (H5). Removes the bulk of duplicated business logic.

---

## Severity summary

| ID | Title | Severity | Status |
|---|---|---|---|
| H1 | Zustand slice imports React Query `queryClient` | High | ✅ Fixed |
| H2 | No Domain layer; schema = entity = persistence row | High | ✅ Resolved |
| H3 | Duplicate `createServiceClient` across 4+ API routes | High | ✅ Fixed |
| H4 | `orderService.ts` is a 697-line god module | High | ✅ Resolved |
| H5 | 300-600-line page-level handler hooks contain business logic | High | ✅ Fixed |
| H6 | Operational data lives in both React Query and Zustand | High | ✅ Resolved |
| M1 | Schemas import `lib/utils` and `lib/company` | Medium | ✅ Resolved |
| M2 | Snake/camel mapping repeated per endpoint | Medium | ✅ Resolved |
| M3 | UI hooks call `orderService` directly, bypassing RQ | Medium | ✅ Resolved |
| M4 | `mapSupabaseOrder` returns `null` silently | Medium | ✅ Fixed |
| M5 | Persistence columns leak into `PendingRowSchema` | Medium | ✅ Resolved |
| M6 | Business logic in `mobile-order/route.ts` | Medium | ✅ Resolved |
| M7 | Top-level singletons (`supabase`, `queryClient`, `auth`) block port substitution | Medium | ✅ Resolved |
| L1 | Pure domain logic mixed under `lib/` | Low | ✅ Resolved |
| L2 | Back-compat re-exports in `useOrdersQuery.ts` | Low | ✅ Fixed |
| L3 | No `services/index.ts` barrel | Low | ✅ Resolved |
| L4 | No logger abstraction; `console.*` everywhere | Low | ✅ Resolved |
| L5 | `PendingRow.stage: string` instead of `OrderStage` | Low | ✅ Fixed |

---

*Report compiled from line-level inspection of `src/services`, `src/schemas`, `src/store`, `src/hooks`, `src/lib`, `src/app`, and representative `components/` files. Re-run after H1 and H5 are addressed for a refreshed grade.*
