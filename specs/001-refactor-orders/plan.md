# Implementation Plan: Orders Tab Validation Refactor

**Branch**: `001-refactor-orders` | **Date**: 2026-03-03 | **Spec**: `specs/001-refactor-orders/spec.md`
**Input**: Feature specification from `specs/001-refactor-orders/spec.md`

## Summary

Refactor the Orders tab entry flow to support dual-mode validation (Default permissive mode and Beast strict mode), enforce duplicate and consistency rules across stage tabs/history, apply save-first cross-tab VIN guardrails, and deliver requested UI fixes (company options and requester icon).

Technical approach: keep strict separation between UI state and backend data, centralize historical checks through service/query patterns, add mode-aware validation contracts, and cover the behavior with unit/component/e2e tests before merge.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19, Next.js 15  
**Primary Dependencies**: React Query v5, Zod, Supabase JS, Zustand (UI-only usage), Lucide React, shadcn/ui Dialog, Sonner  
**Storage**: Supabase PostgreSQL (`orders`, `order_reminders`) + order metadata object  
**Testing**: Vitest + Testing Library (unit/component), Playwright (e2e)  
**Target Platform**: Internal web app (desktop-first, responsive), Node 18/20 build/runtime tooling  
**Project Type**: Single-project Next.js web application  
**Performance Goals**: Beast-mode blocker feedback <= 500ms; maintain grid responsiveness (<100ms target from constitution)  
**Constraints**: Service-layer Supabase access only; no backend data mirroring into Zustand; no `any`; preserve optimistic mutation pattern and protected workflow behaviors  
**Scale/Scope**: Five active workflow tabs plus historical order records; internal service-center operational volume (hundreds of active rows per stage)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Gate Review

| Gate | Constitution Principle | Status | Plan Evidence |
|------|------------------------|--------|---------------|
| State data boundaries | Principle 1 (React Query vs Zustand) | PASS | Validation reads use query/service data; no new backend mirror state in Zustand |
| Service access boundary | Principle 2 (service layer) | PASS | Duplicate/history checks planned via service-level access patterns |
| Runtime validation | Principle 3 (Zod validation) | PASS | Form and order data constraints remain schema-validated |
| Type safety | Principles 4 and 7 | PASS | No `any` introduction, strict typing preserved |
| UI consistency/accessibility | Principle 9 | PASS | Shared `Dialog`, Lucide icons, inline accessible warnings |
| Protected behaviors | Protected Behaviors section | PASS | No plan to alter GridConfig composite getter, auto-move, or workflow exceptions |
| Quality gates | Principle 8 and Testing Requirements | PASS | `lint`, `test`, `build` maintained as merge gate |
| Documentation obligations | Principle 10 | PASS | `FEATURES.md` update included in implementation workflow |

**Gate Result (Pre-Phase 0)**: PASS

### Post-Phase 1 Re-check

| Gate | Status | Notes |
|------|--------|-------|
| Architecture and boundaries preserved | PASS | Data model and contracts keep service/query boundaries explicit |
| Validation requirements testable | PASS | Contracts and quickstart define measurable checks by mode |
| No constitution violations introduced by design | PASS | No exceptions required |

**Gate Result (Post-Phase 1)**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-refactor-orders/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── orders-entry-validation.md
│   └── cross-tab-edit-guard.md
└── tasks.md                # Created later by /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   └── (app)/orders/
│       ├── page.tsx
│       └── useOrdersPageHandlers.ts
├── components/
│   └── orders/
│       ├── OrderFormModal.tsx
│       ├── OrdersToolbar.tsx
│       └── OrderFormErrorBoundary.tsx
├── hooks/
│   └── queries/
│       ├── useOrdersQuery.ts
│       ├── useSaveOrderMutation.ts
│       ├── useBulkUpdateOrderStageMutation.ts
│       └── useDeleteOrderMutation.ts
├── schemas/
│   ├── form.schema.ts
│   └── order.schema.ts
├── services/
│   └── orderService.ts
└── test/
    ├── ordersPage.test.tsx
    ├── orderService.test.ts
    └── OrderFormModal.test.tsx      # expected add/update

tests/
└── orders-validation.e2e.spec.ts    # expected add
```

**Structure Decision**: Use the existing single Next.js project structure and implement feature-specific changes in orders components/hooks/services/schemas with corresponding `src/test` and `tests` coverage updates.

## Phase 0: Research Output

Research completed in `specs/001-refactor-orders/research.md` with decisions on:

1. Mode semantics and naming compatibility.
2. Full vs partial VIN duplicate-check behavior.
3. Beast-mode blocking policy.
4. Description conflict UX and historical consistency scope.
5. VIN-only cross-tab guard behavior.
6. Data-source architecture for validation checks.

All planning-stage clarifications are resolved.

## Phase 1: Design and Contracts Output

Generated artifacts:

- Data model: `specs/001-refactor-orders/data-model.md`
- Validation contract: `specs/001-refactor-orders/contracts/orders-entry-validation.md`
- Cross-tab guard contract: `specs/001-refactor-orders/contracts/cross-tab-edit-guard.md`
- Implementation/verification runbook: `specs/001-refactor-orders/quickstart.md`

## Phase 2: Task Planning Approach

Implementation tasks should be decomposed into these streams:

1. Orders form UX adjustments (company options + requester icon).
2. Mode-aware validation logic (default vs beast) and duplicate/conflict checks.
3. Cross-tab VIN save-first guard behavior.
4. Test coverage updates (unit/component/e2e) and documentation updates.

## Complexity Tracking

No constitution violations identified. No exception justification required.
