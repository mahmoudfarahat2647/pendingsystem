---

description: "Task list for Orders tab validation refactor implementation"
---

# Tasks: Orders Tab Validation Refactor

**Input**: Design documents from `/specs/001-refactor-orders/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included (required by project constitution and reinforced in `specs/001-refactor-orders/plan.md`).

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no dependency on unfinished tasks)
- **[Story]**: User story label (`[US1]`..`[US8]`) for story-phase tasks only
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared validation scaffolding used across stories.

- [X] T001 Create shared mode/company constants in `src/lib/ordersValidationConstants.ts`
- [X] T002 Create reusable validation/warning message map in `src/lib/ordersValidationMessages.ts`
- [X] T003 [P] Create reusable test fixtures for order-validation scenarios in `src/test/helpers/ordersValidationFixtures.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build core validation primitives and service/query foundations required by all stories.

**⚠️ CRITICAL**: Complete this phase before implementing user stories.

- [X] T004 Add VIN normalization and duplicate-part utility functions in `src/lib/orderWorkflow.ts`
- [X] T005 [P] Add historical/stage lookup methods for duplicate checks in `src/services/orderService.ts`
- [X] T006 [P] Add typed validation result interfaces for duplicate/conflict checks in `src/types/index.ts`
- [X] T007 Wire shared orders query access for validation consumers in `src/hooks/queries/useOrdersQuery.ts`
- [X] T008 Add base schema enums/rules for allowed companies and mode-aware constraints in `src/schemas/form.schema.ts`
- [ ] T009 Add foundational helper tests in `src/test/orderWorkflow.test.ts` and `src/test/orderService.test.ts`

**Checkpoint**: Shared validation foundation is ready; user stories can proceed.

---

## Phase 3: User Story 1 - Enter Order with Partial Data in Default Mode (Priority: P1) 🎯 MVP

**Goal**: Allow fast order entry with partial VIN and minimal required data in Default Mode without warnings.

**Independent Test**: Open the order form in default mode, submit with partial VIN + description only, and verify save succeeds with no validation warnings.

### Tests for User Story 1

- [ ] T010 [P] [US1] Add default-mode partial-VIN submit test cases in `src/test/OrderFormModal.test.tsx`
- [ ] T011 [P] [US1] Add default-mode save-flow tests for order creation handler in `src/test/ordersPage.test.tsx`

### Implementation for User Story 1

- [X] T012 [US1] Implement permissive default-mode field handling for partial VIN in `src/components/orders/OrderFormModal.tsx`
- [X] T013 [US1] Update default-mode schema behavior for incomplete submissions in `src/schemas/form.schema.ts`
- [X] T014 [US1] Persist incomplete default-mode orders in save flow in `src/app/(app)/orders/useOrdersPageHandlers.ts`
- [X] T015 [US1] Ensure partial VIN entries bypass VIN+part duplicate checks in default mode in `src/components/orders/OrderFormModal.tsx`

**Checkpoint**: US1 delivers rush-hour capture workflow independently.

---

## Phase 4: User Story 2 - Validate Complete Order Before Advancing to Next Step (Priority: P1)

**Goal**: Enforce strict Beast Mode requirements and block progression when mandatory data is missing.

**Independent Test**: Attempt commit with missing mandatory fields and verify progression is blocked with field-level warnings; commit succeeds only after completion.

### Tests for User Story 2

- [ ] T016 [P] [US2] Add beast-mode commit blocking tests for missing required fields in `src/test/ordersPage.test.tsx`
- [ ] T017 [P] [US2] Add beast-mode field-highlighting and timer tests in `src/test/OrderFormModal.test.tsx`

### Implementation for User Story 2

- [X] T018 [US2] Enforce strict required-field schema in Beast Mode in `src/schemas/form.schema.ts`
- [X] T019 [US2] Block commit progression on Beast Mode validation failures in `src/app/(app)/orders/useOrdersPageHandlers.ts`
- [X] T020 [US2] Show grouped strict-mode validation feedback in `src/components/orders/OrderFormModal.tsx`
- [X] T021 [US2] Keep Beast Mode trigger/timer synchronization consistent in `src/store/slices/uiSlice.ts` and `src/components/orders/OrderFormModal.tsx`

**Checkpoint**: US2 delivers a strict quality gate before stage advancement.

---

## Phase 5: User Story 3 - Prevent Duplicate VIN + Part Number Entries (Priority: P1)

**Goal**: Detect VIN+part duplicates across tabs/history and block Beast Mode progression when duplicates exist.

**Independent Test**: Create an existing VIN+part record, attempt same combination again, and verify Beast Mode blocks progression with duplicate location details.

### Tests for User Story 3

- [ ] T022 [P] [US3] Add historical VIN+part duplicate service tests in `src/test/orderService.test.ts`
- [ ] T023 [P] [US3] Add Beast Mode duplicate-blocking modal tests in `src/test/OrderFormModal.test.tsx`

### Implementation for User Story 3

- [X] T024 [US3] Implement VIN+part duplicate lookup APIs across stages/history in `src/services/orderService.ts`
- [X] T025 [US3] Integrate VIN+part duplicate evaluation into form validation pipeline in `src/components/orders/OrderFormModal.tsx`
- [X] T026 [US3] Add Beast Mode duplicate warning dialog with blocking action path in `src/components/orders/OrderFormModal.tsx`
- [X] T027 [US3] Enforce duplicate-blocking checks during commit progression in `src/app/(app)/orders/useOrdersPageHandlers.ts`
- [X] T028 [US3] Display duplicate source stage/location details in warning UI in `src/components/orders/OrderFormModal.tsx`

**Checkpoint**: US3 independently prevents duplicate VIN+part progression in strict mode.

---

## Phase 6: User Story 7 - Update Company Field Options (Priority: P1)

**Goal**: Restrict company selection to `Zeekr` and `Renalt` and remove `pendingsystem` from selectable options.

**Independent Test**: Open order form and verify company dropdown only contains `Zeekr` and `Renalt`; Beast Mode rejects out-of-set values.

### Tests for User Story 7

- [ ] T029 [P] [US7] Add company dropdown option and validation tests in `src/test/OrderFormModal.test.tsx`

### Implementation for User Story 7

- [X] T030 [US7] Replace company dropdown options with allowed values in `src/components/orders/OrderFormModal.tsx`
- [X] T031 [US7] Remove `pendingsystem` defaults and enforce allowed company set in `src/schemas/form.schema.ts`
- [X] T032 [US7] Add legacy-value fallback handling for edited records in `src/components/orders/OrderFormModal.tsx`

**Checkpoint**: US7 independently enforces the new company selection policy.

---

## Phase 7: User Story 4 - Prevent Conflicting Part Number Descriptions (Priority: P2)

**Goal**: Enforce one canonical description per part number across system history with default-mode inline correction UX.

**Independent Test**: Enter part number with conflicting description and verify default-mode inline red warning + copy action; Beast Mode blocks until resolved.

### Tests for User Story 4

- [ ] T033 [P] [US4] Add historical part-number description-conflict tests in `src/test/orderService.test.ts`
- [ ] T034 [P] [US4] Add inline warning + one-click copy interaction tests in `src/test/OrderFormModal.test.tsx`

### Implementation for User Story 4

- [X] T035 [US4] Implement historical partNumber->description conflict lookup in `src/services/orderService.ts`
- [X] T036 [US4] Render inline red conflict warning under description field in `src/components/orders/OrderFormModal.tsx`
- [X] T037 [US4] Implement one-click apply of canonical description in `src/components/orders/OrderFormModal.tsx`
- [X] T038 [US4] Block Beast Mode progression when description conflicts remain unresolved in `src/app/(app)/orders/useOrdersPageHandlers.ts`

**Checkpoint**: US4 independently enforces description consistency with fast correction path.

---

## Phase 8: User Story 5 - Prevent Duplicate Part Numbers Within Single Order (Priority: P2)

**Goal**: Prevent duplicate part numbers in a single order before submit/commit.

**Independent Test**: Add same part number twice in one order and verify form shows validation error and blocks submission.

### Tests for User Story 5

- [ ] T039 [P] [US5] Add same-order duplicate part-number tests in `src/test/OrderFormModal.test.tsx`

### Implementation for User Story 5

- [X] T040 [US5] Add duplicate part-number detection across current form rows in `src/components/orders/OrderFormModal.tsx`
- [X] T041 [US5] Block submit/commit and highlight duplicated rows in `src/components/orders/OrderFormModal.tsx`
- [X] T042 [US5] Add reusable same-order duplicate utility coverage in `src/lib/orderWorkflow.ts` and `src/test/orderWorkflow.test.ts`

**Checkpoint**: US5 independently prevents same-order duplicate part entries.

---

## Phase 9: User Story 8 - Update Requester Field Icon (Priority: P2)

**Goal**: Replace requester field location icon with person/name icon and improve label clarity.

**Independent Test**: Open form and verify requester field uses person icon with requester-name tooltip semantics.

### Tests for User Story 8

- [ ] T043 [P] [US8] Add requester icon and tooltip semantics tests in `src/test/OrderFormModal.test.tsx`

### Implementation for User Story 8

- [X] T044 [US8] Replace requester location icon with person icon in `src/components/orders/OrderFormModal.tsx`
- [X] T045 [US8] Update requester tooltip/aria labeling for name semantics in `src/components/orders/OrderFormModal.tsx`

**Checkpoint**: US8 independently delivers the requester field visual fix.

---

## Phase 10: User Story 6 - Restrict Cross-Tab Editing for Multiple VINs (Priority: P3)

**Goal**: Add VIN-based save-first guard when navigating across tabs during active edits.

**Independent Test**: Start editing one VIN in Orders, attempt navigation to another tab context with different VIN, and verify save-first guard prompt controls navigation.

### Tests for User Story 6

- [ ] T046 [P] [US6] Add sidebar navigation guard tests for VIN mismatch save-first behavior in `src/test/Sidebar.test.tsx`
- [ ] T047 [P] [US6] Add edit-session VIN tracking lifecycle tests in `src/test/ordersPage.test.tsx`

### Implementation for User Story 6

- [X] T048 [US6] Add current-edit VIN/session state and actions in `src/store/types.ts` and `src/store/slices/uiSlice.ts`
- [X] T049 [US6] Set/clear edit-session VIN state on form open/save/cancel in `src/app/(app)/orders/useOrdersPageHandlers.ts`
- [X] T050 [US6] Implement VIN mismatch navigation guard flow in `src/components/shared/Sidebar.tsx`
- [X] T051 [US6] Use shared dialog prompt with current/target VIN details in `src/components/shared/Sidebar.tsx` and `src/components/ui/dialog.tsx`
- [ ] T052 [US6] Add normalized VIN bucket helper with blank-VIN handling in `src/lib/orderWorkflow.ts`
- [ ] T053 [US6] Apply mixed-VIN edit gating to all form-open entry points in `src/components/orders/OrdersToolbar.tsx` and `src/app/(app)/orders/useOrdersPageHandlers.ts`
- [ ] T054 [US6] Add disabled-action guidance on hover and keyboard focus in `src/components/orders/OrdersToolbar.tsx`
- [ ] T055 [US6] Apply normalized VIN comparison/blank-VIN mismatch behavior in `src/components/shared/Sidebar.tsx` and `src/components/orders/OrderFormModal.tsx`

**Checkpoint**: US6 independently enforces mixed-VIN edit restrictions and safe cross-tab transitions.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, documentation, and full verification across stories.

- [X] T056 [P] Update feature behavior documentation in `FEATURES.md`
- [X] T057 [P] Add/update JSDoc for new validation APIs in `src/services/orderService.ts` and `src/lib/orderWorkflow.ts`
- [ ] T058 Run and fix unit/component regressions in `src/test/OrderFormModal.test.tsx`, `src/test/orderService.test.ts`, and `src/test/ordersPage.test.tsx`
- [ ] T059 Run and fix end-to-end validation flow in `tests/orders-validation.e2e.spec.ts`
- [X] T060 Execute and fix full quality gates from `D:/pendingsystem` using `npm run lint`, `npm run test`, and `npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies
- **Phase 2 (Foundational)**: depends on Phase 1; blocks all story work
- **Phases 3-10 (User Stories)**: depend on Phase 2 completion
- **Phase 11 (Polish)**: depends on selected story completion

### User Story Dependency Graph

```text
Setup -> Foundational -> {US1, US2, US3, US7} -> {US4, US5, US8} -> {US6} -> Polish
```

### User Story Completion Order (recommended)

1. US1 (P1) - Default mode partial entry (MVP)
2. US2 (P1) - Beast mode strict progression gate
3. US3 (P1) - VIN+part duplicate blocking
4. US7 (P1) - Company options restriction
5. US4 (P2) - Part description consistency + copy assist
6. US5 (P2) - Same-order duplicate part prevention
7. US8 (P2) - Requester icon/tooltip update
8. US6 (P3) - Cross-tab VIN save-first guard

---

## Parallel Execution Examples Per User Story

### US1

```bash
# Parallel test work
T010 in src/test/OrderFormModal.test.tsx
T011 in src/test/ordersPage.test.tsx
```

### US2

```bash
# Parallel test work
T016 in src/test/ordersPage.test.tsx
T017 in src/test/OrderFormModal.test.tsx
```

### US3

```bash
# Parallel test work
T022 in src/test/orderService.test.ts
T023 in src/test/OrderFormModal.test.tsx
```

### US7

```bash
# Parallelizable within phase
T029 in src/test/OrderFormModal.test.tsx
T031 in src/schemas/form.schema.ts
```

### US4

```bash
# Parallel test work
T033 in src/test/orderService.test.ts
T034 in src/test/OrderFormModal.test.tsx
```

### US5

```bash
# Parallelizable within phase
T039 in src/test/OrderFormModal.test.tsx
T042 in src/lib/orderWorkflow.ts and src/test/orderWorkflow.test.ts
```

### US8

```bash
# Parallelizable within phase
T043 in src/test/OrderFormModal.test.tsx
T044 in src/components/orders/OrderFormModal.tsx
```

### US6

```bash
# Parallel test work
T046 in src/test/Sidebar.test.tsx
T047 in src/test/ordersPage.test.tsx
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Finish Phase 1 and Phase 2
2. Deliver Phase 3 (US1)
3. Validate US1 independent test criteria
4. Demo/ship MVP for rush-hour entry improvement

### Incremental Delivery

1. Add remaining P1 stories (US2, US3, US7)
2. Add P2 stories (US4, US5, US8)
3. Add P3 story (US6)
4. Run Phase 11 polish and full gates

### Parallel Team Strategy

After Foundational phase, parallel lanes can be:

- Lane A: US1 -> US2
- Lane B: US3 -> US4 -> US5
- Lane C: US7 -> US8 -> US6

---

## Task Completeness Validation

- Every user story has: goal, independent test, test tasks, implementation tasks
- All tasks include strict checklist format with IDs and file paths
- Story labels are applied to all user-story phase tasks only
- Parallelizable tasks are marked `[P]` only where file/dependency conflicts are avoidable
