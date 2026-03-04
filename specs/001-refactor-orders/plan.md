# Implementation Plan: Orders Tab Refactoring with Dual-Mode Validation

**Branch**: `001-refactor-orders` | **Date**: 2026-03-03 | **Spec**: `D:/pendingsystem/specs/001-refactor-orders/spec.md`
**Input**: Feature specification from `/specs/001-refactor-orders/spec.md`

## Summary

Refine Orders workflow validation by keeping fast permissive entry in Default Mode, enforcing hard quality gates in Beast Mode, and preventing invalid edit operations for mixed VIN selections across all grid sheets. The implementation extends existing service-layer + React Query architecture, adds canonical duplicate/conflict checks, tightens cross-tab VIN safeguards, and standardizes blocking guidance accessibility.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19, Next.js 15  
**Primary Dependencies**: `@tanstack/react-query` v5, `zustand` v5 (UI-only), `zod` v4, `@supabase/supabase-js` v2, `ag-grid-community` v32, shadcn/ui Dialog, Lucide React, Framer Motion  
**Storage**: Supabase PostgreSQL (`orders`, `order_reminders`, metadata JSON)  
**Testing**: Vitest + Testing Library (unit/component), Playwright (E2E)  
**Target Platform**: Internal web app (desktop-first browser usage)  
**Project Type**: Web application (single Next.js project)  
**Performance Goals**: Sub-second validation feedback for blocking checks; preserve existing grid render responsiveness (<100ms target from constitution)  
**Constraints**: No `any`; backend data via React Query only; Supabase access only in `src/services`; Zod validation at schema/service boundary; shared Dialog for modal prompts; tooltip + keyboard-focus guidance for icon-only blocked actions  
**Scale/Scope**: Internal service-center volume (hundreds of active rows per stage, growing archive, five active stage tabs)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate Review

| Gate | Status | Notes |
|------|--------|-------|
| Principle 1: State separation | PASS | Backend/order datasets remain React Query-driven; only UI-local guard state in Zustand |
| Principle 2: Service layer | PASS | Historical duplicate/conflict checks routed through `src/services/orderService.ts` |
| Principle 3: Zod validation | PASS | Form strict/permissive behavior and service mappings remain schema-backed |
| Principle 4/7: No `any`, strict typing | PASS | New contracts and models typed explicitly |
| Principle 8: Testing non-negotiable | PASS | Unit/component/e2e updates included in scope and quickstart gates |
| Principle 9: UI/UX consistency + accessibility | PASS | Shared Dialog + tooltip + aria/focus guidance mandated |
| Principle 10: Documentation updates | PASS | `FEATURES.md` + spec/plan artifacts included |
| Protected behaviors unchanged | PASS | No planned change to auto-move, booking single-VIN, GridConfig protected logic |

### Post-Design Gate Review

| Gate | Status | Notes |
|------|--------|-------|
| Architecture compliance after design | PASS | Data model/contracts align with service + React Query pattern |
| Accessibility and UX consistency | PASS | Mixed-VIN blocked state explicitly requires hover + keyboard-focus guidance |
| Testability and measurable gates | PASS | Contracts and quickstart define deterministic validation and verification steps |

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
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   └── (app)/orders/
├── components/
│   ├── orders/
│   └── shared/
├── hooks/
│   └── queries/
├── lib/
├── schemas/
├── services/
├── store/
├── test/
└── types/

tests/
└── *.e2e.spec.ts
```

**Structure Decision**: Keep single-project Next.js structure. Implement behavior in existing Orders modal/handlers/sidebar/store/service layers; avoid introducing new top-level apps or alternate data-access paths.

## Phase 0: Research Decisions

Research is consolidated in `research.md` and resolves mode semantics, duplicate scope, blocking behavior, historical consistency, and VIN-based guard logic. Additional clarification-driven decisions now codified:

1. Mixed-VIN edit blocking applies to all grid sheets with order-form editing.
2. Blank VIN is treated as a distinct VIN in mixed-selection checks.
3. All form-opening entry points must enforce mixed-VIN blocking (not icon-only).
4. Blocked-action guidance must be available on hover and keyboard focus.
5. VIN comparisons for mixed-selection gating use trimmed case-insensitive normalization.

## Phase 1: Design & Contracts

Artifacts produced/updated in this phase:

- `data-model.md`: entities and validation-state models for mode rules, duplicate checks, and edit-eligibility gating.
- `contracts/orders-entry-validation.md`: behavioral contract for submit validation, duplicate checks, and description conflict handling.
- `contracts/cross-tab-edit-guard.md`: guard contract for save-first navigation and mixed-VIN edit blocking.
- `quickstart.md`: implementation sequence, test coverage targets, and verification commands.

## Agent Context Update

Run after design artifact updates:

```powershell
.specify/scripts/powershell/update-agent-context.ps1 -AgentType opencode
```

This refreshes agent-specific context with current stack and planning decisions while preserving manual additions between markers.

## Complexity Tracking

No constitution violations require special justification for this plan.
