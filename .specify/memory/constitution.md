<!--
SYNC IMPACT REPORT: Constitution v1.0.0 → v2.0.0

Version Bump: MINOR (New comprehensive constitution created from greenfield context)
- Initial ratification of project governing principles
- Integrated from ENGINEERING.md, WORKSPACE_RULES.md, AGENTS.md, FEATURES.md
- Added 10 core principles + 3 governance sections
- Formalized protected behaviors, workflow exceptions, and testing standards

New Sections:
✅ Project Identity (personal-use internal logistics platform)
✅ Non-Negotiable Architectural Principles
✅ Protected Behaviors (GridConfig, optimistic UI, auto-move, workflow exceptions)
✅ Code Quality Standards
✅ Testing Requirements
✅ UI/UX Non-Negotiables
✅ Documentation Update Requirements
✅ Performance Targets
✅ Security Principles
✅ Governance & Amendment Process

Templates Requiring Updates:
⚠️  .specify/templates/plan-template.md — Reference Constitution Principle 2 (State Management)
⚠️  .specify/templates/spec-template.md — Reference Principle 4 (Data Validation)
⚠️  .specify/templates/tasks-template.md — Add task categories for testing, docs, accessibility

Deferred: None — all fields resolved from project context
-->

# PendingSystem Constitution

## Project Identity

**PendingSystem** is a personal-use internal logistics management platform for an automotive service center. It is NOT a SaaS product — there is no multi-tenancy, public user registration, or authentication gate currently enforced.

**Target Users:**
- Service managers
- Service advisors and technicians
- Customer service representatives
- Parts department staff
- Scheduling coordinators

**Tech Stack:**
- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, Radix UI primitives, Framer Motion, Lucide React
- **UI Components:** shadcn/ui (primary choice for all new dialogs, dropdowns, selects)
- **State:** Zustand (UI preferences only), React Query (all backend data)
- **Data Grid:** ag-Grid Community v32
- **Charts:** Recharts
- **Testing:** Vitest (unit), Playwright (E2E)
- **Database:** Supabase (PostgreSQL + RLS policies)
- **Linting:** Biome (source of truth for formatting)

---

## Core Principles

### Principle 1: State Management Separation (NON-NEGOTIABLE)

**Zustand = UI Preferences Only**
- Part statuses (definitions, colors, labels)
- UI templates (reminders, notes)
- Visual preferences (sorting, column visibility)
- Modal open/close states

**React Query = ALL Supabase/Backend Data**
- Orders, inventory, bookings, archive data
- All customer/vehicle information
- Dynamic part availability
- Report settings and metadata

**Rule:** Never mirror backend data into Zustand. Every Supabase query MUST use React Query hooks (e.g., `useOrdersQuery`, `useInventoryQuery`). Zustand is consumed by components for UI state only; never store the result of a server query in Zustand. Do NOT create derived state in Zustand — computed values belong in selectors or memoized hooks.

---

### Principle 2: Service Layer Pattern (NON-NEGOTIABLE)

All Supabase calls go through `src/services/`. No direct Supabase access in components.

**Pattern:**
```typescript
// src/services/orderService.ts
export const orderService = {
  async getOrders(stage: string) { ... },
  async updateOrder(id: string, updates: Partial<Order>) { ... }
};

// In component:
const { data } = useOrdersQuery();
```

**Rationale:** Centralizes validation, error handling, and API contracts. Simplifies testing and future migrations.

---

### Principle 3: Data Validation with Zod (NON-NEGOTIABLE)

All Supabase data MUST be validated with Zod before reaching the UI or store.

**Rules:**
- Centralize all Zod schemas in `src/types/index.ts`
- Validate in the service layer before returning data
- Use `.transform()` to auto-sync legacy fields (e.g., `partNumber` → `parts` array)
- Never assume external data shape — always narrow from `unknown` with Zod
- Runtime validation prevents "water leak" regressions from bad API responses

**Example:**
```typescript
const OrderSchema = z.object({
  id: z.string(),
  vin: z.string(),
  partNumber: z.string(),
  partDescription: z.string()
}).transform(data => ({
  ...data,
  // Auto-sync legacy field
  description: data.partDescription
}));
```

---

### Principle 4: No `any` Type (NON-NEGOTIABLE)

The use of `any` is strictly forbidden in all code.

**Rules:**
- Use precise types whenever possible
- If the data shape is uncertain, use `unknown` with type narrowing
- Biome enforces `noExplicitAny` as a warning — treat as an error
- Every React component MUST declare a props interface

**Example:**
```typescript
// ❌ WRONG
const process = (data: any) => { ... };

// ✅ CORRECT
const process = (data: unknown) => {
  const order = OrderSchema.parse(data);
  // Now order is strongly typed
};

interface MyComponentProps {
  items: OrderRow[];
  onSelect: (id: string) => void;
}
```

---

### Principle 5: Absolute Imports Only

Use the `@/` alias for all imports. Avoid relative deep paths.

**Rules:**
- ✅ `import { Component } from "@/components/grid"`
- ❌ `import { Component } from "../../grid"`
- ❌ Never import from `@/components/shared/DataGrid` or `@/components/shared/DynamicDataGrid` — use `@/components/grid` instead
- Biome restricts these imports as errors

---

### Principle 6: One File Per Concern (250 Line Limit)

Each component, hook, and utility gets its own file. Max 250 lines per file.

**Rules:**
- If a file exceeds 250 lines → Extract sub-components or utilities
- One component per file: do not export multiple components from a single file
- One hook per file: do not bundle unrelated hooks
- Directory structure:
  ```
  src/components/{feature}/
  ├── MainComponent.tsx      (<100 lines)
  ├── SubComponentA.tsx
  ├── SubComponentB.tsx
  └── hooks/
      ├── useFeatureLogic.ts
      └── useAnotherHook.ts
  ```

---

### Principle 7: Strict TypeScript (NON-NEGOTIABLE)

TypeScript runs in strict mode. Every component must have typed props.

**Rules:**
- All function parameters must be typed
- All return types must be explicit
- Use `interface` for component props; use `type` for type aliases and unions
- No implicit `any` — Biome warns on `noUnusedFunctionParameters`
- Centralize types in `src/types/index.ts` (single source of truth)

---

### Principle 8: Testing is Non-Negotiable

Every new feature must include tests. Tests gate merge.

**Coverage Targets:**
- Store slices: 100% coverage (`src/test/{sliceName}.test.ts`)
- Services: 90%+ coverage (`src/test/{serviceName}.test.ts`)
- Complex components: 70%+ coverage (`src/test/{componentName}.test.tsx`)

**Test Gate:** Before merge, all of the following MUST pass:
```bash
npm run lint    # Zero errors
npm run test    # 100% pass
npm run build   # Succeeds
```

---

### Principle 9: UI/UX Consistency (NON-NEGOTIABLE)

All UI must follow the established design system.

**Rules:**
- **Dark Mode Default:** Base color `bg-[#0a0a0b]`
- **Accent Color:** "pendingsystem Yellow" (toned down for minimalism)
- **Component Library:** Use **shadcn/ui** for all new dialogs, dropdowns, selects, and modals
- **Animations:** Framer Motion for modals and transitions
- **Icons:** Lucide React for all UI icons
- **Accessibility:** 
  - All icon-only buttons MUST have `aria-label` and tooltip
  - All modals use the shared `Dialog` component (auto focus-trapping)
  - Destructive actions use `ConfirmDialog`
- **No Custom Dialogs:** Do not create custom modal implementations; use the shared `Dialog` component

---

### Principle 10: Documentation is Part of the Feature

Whenever code changes, documentation must follow.

**Rules:**
- New feature or UI change → Update `FEATURES.md`
- Workflow stages change → Update `ENGINEERING.md#workflow-states`
- Database schema change → Update `ENGINEERING.md#database-schema`
- Environment variables change → Update `ENGINEERING.md#environment-configuration`
- All exported functions, hooks, and services must have JSDoc comments
- Code comments explain WHY, not WHAT. Tag critical logic with `[CRITICAL]`

---

## Protected Behaviors (DO NOT CHANGE WITHOUT EXPLICIT REQUEST)

### GridConfig Composite ValueGetter

In `GridConfig.tsx`, the composite `valueGetter` (NOT `field: "id"`) is critical for optimized cell rendering and instant reactivity. Do not revert this to a simple field reference.

### Optimistic UI Pattern (Required for All Mutations)

All React Query mutations MUST follow this exact pattern:

```typescript
const mutation = useMutation({
  mutationFn: async (updates) => updateOrder(id, updates),
  onMutate: async (newData) => {
    // Step 1: Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['orders'] });
    // Step 2: Snapshot old data
    const previousData = queryClient.getQueryData(['orders']);
    // Step 3: Optimistically update cache
    queryClient.setQueryData(['orders'], (old) => ({
      ...old,
      rows: old.rows.map(r => r.id === id ? { ...r, ...newData } : r)
    }));
    return { previousData };
  },
  onSuccess: (data) => {
    // Step 4: Inject successful response into cache
    queryClient.setQueryData(['orders'], data);
  },
  onSettled: () => {
    // Step 5: Revalidate (NO setTimeout, NO artificial delays)
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  },
  onError: (err, newData, context) => {
    // Step 6: Restore on error
    if (context?.previousData) {
      queryClient.setQueryData(['orders'], context.previousData);
    }
  }
});
```

**Rule:** Do NOT add `setTimeout` or artificial delays to `onSettled` or `invalidateQueries`. The cache injection in `onSuccess` provides instant feedback; invalidation is synchronous cleanup only.

### Auto-Move Workflow (Automatic Staging)

When a part status is updated to "Arrived" (in Main Sheet, Orders, or Global Search):

1. System automatically checks all other parts for the same VIN across all active sheets
2. If **ALL** parts for that VIN are "Arrived" (or have an equivalent 'available' status), the entire group is automatically moved to the Call List
3. This is a protected feature — critical to workflow efficiency

Do NOT disable, bypass, or restrict this automation without explicit request.

### Booking Single VIN Restriction

Booking actions are restricted to a single VIN at a time. The Booking button MUST be disabled if multiple VINs are selected simultaneously to prevent scheduling conflicts. This is a `[CRITICAL]` feature — do not remove or bypass.

### Workflow Exceptions (Legitimate)

The standard workflow flow is linear:
```
Orders (Staging) → Main Sheet (Pending) → Call List (Contact) → Booking (Scheduled) → Archive (Historical)
```

However, **two legitimate workflow exceptions** exist (both backed by explicit UI buttons):

**Exception 1: Skip Main Sheet (Pre-configured Part)**
If a part is already confirmed as available before formal staging, the row can move directly from Orders → Call List, bypassing Main Sheet. Valid shortcut for in-stock parts.

**Exception 2: Archive at Any Stage (Client Changed Mind)**
At any point (Orders, Main Sheet, Call List, or Booking), a client may cancel. The row can be sent directly to Archive from any stage. This is NOT an error state — it is an expected business scenario.

**Rule:** Do NOT remove, bypass, or restrict these exception buttons. Treat them as first-class workflow paths, not edge cases.

### Archive Immutability (48-Hour Protection)

Archive records are immutable for 48 hours after archival. Edits are logged. This is a `[CRITICAL]` protection for audit compliance.

### Email Backup System (CRITICAL PROTECTION)

The email backup schedule and execution logic in GitHub Actions is `[CRITICAL]` and protected from alteration. Changes require explicit approval to ensure data safety.

---

## Code Quality Standards

### Biome is the Source of Truth

Biome enforces formatting and linting. All code MUST pass Biome checks before commit.

**Standards:**
- **Indentation:** Tabs (not spaces)
- **Quotes:** Double quotes only
- **Imports:** Automatically organized by Biome
- **Lint Rules:** Recommended set + project overrides in `biome.json`

### Conventional Commits

All commits MUST follow conventional commit format:

```
<type>: <description>

feat:     Add new feature
fix:      Bug fix
refactor: Refactor without behavior change
test:     Add/update tests
docs:     Documentation only
```

### No Console.log in Production

All `console.log` statements MUST be removed from production code before merge. Use structured logging for debugging.

### JSDoc for Public APIs

All exported functions, hooks, services, and complex utilities MUST have JSDoc comments:

```typescript
/**
 * Fetches orders for a given stage.
 * @param stage - The workflow stage (e.g., "pending", "archive")
 * @returns Promise<OrderRow[]>
 */
export async function getOrders(stage: string): Promise<OrderRow[]> {
  // ...
}
```

---

## Testing Requirements

### Pre-Merge Gates

Before merging ANY code:
```bash
npm run lint    # MUST pass
npm run test    # MUST pass (100% of tests)
npm run build   # MUST succeed
```

### Coverage Targets

- **Store Slices:** 100% coverage (`src/test/{sliceName}.test.ts`)
- **Services:** 90%+ coverage (`src/test/{serviceName}.test.ts`)
- **Complex Components:** 70%+ coverage (`src/test/{componentName}.test.tsx`)

### Test Locations

```
src/test/
├── ordersSlice.test.ts       # Store tests
├── inventorySlice.test.ts
├── orderService.test.ts      # Service tests
├── OrderForm.test.tsx        # Component tests
└── useOrdersQuery.test.ts    # Hook tests
```

### Playwright E2E

- Smoke tests: `tests/smoke.e2e.spec.ts`
- Feature tests: `tests/{feature}.e2e.spec.ts`
- Run via: `npm run e2e`

---

## UI/UX Non-Negotiables

### Design System

- **Dark Mode Default:** `bg-[#0a0a0b]`
- **Accent Color:** "pendingsystem Yellow" (minimalist, not bright)
- **Typography:** Consistent sizing and weight hierarchies
- **Spacing:** Consistent padding/margin patterns

### Component Rules

- **Use shadcn/ui** for dialogs, dropdowns, selects, tabs
- **No custom modals:** All modals use the shared `Dialog` component
- **Animations:** Framer Motion for transitions (not CSS animations in grids)
- **Icons:** Lucide React only (no inline SVGs)

### Accessibility Requirements

- Icon-only buttons MUST have `aria-label` and tooltip
- All modals use focus-trapping (`Dialog` component handles this)
- Keyboard navigation support in grids
- Color is not the only visual indicator (use icons + text)

### Safety Patterns

- **Delete Confirmation:** Reusable `ConfirmDialog` for all destructive actions
- **Destructive Actions:** Always require user confirmation (Yes/No)
- **Validation:** Real-time feedback on form inputs
- **Error States:** Clear error messages; no silent failures

---

## Performance Targets

These targets are monitored monthly:

- **First Load JS:** < 200 KB
- **Grid Render Time:** < 100ms
- **Search Debounce:** ≥ 300 ms (minimum)
- **Build Time:** < 30 seconds
- **Test Coverage:** 70%+ (minimum)

### Performance Techniques

- Use `React.memo` for expensive components
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers in lists
- Dynamic imports for heavy components (e.g., grids)
- Set-based O(1) lookups over O(n) array scans
- Debounce search inputs (at least 300ms)

---

## Security Principles

### Personal-Use Context

This is a personal-use project for an internal service center. No public-facing authentication or multi-tenancy.

### No Secrets in Client Code

- No API keys or secrets in client-side code
- No PII stored in localStorage
- Supabase Service Role Key used only in isolated GitHub Actions (backup reports)

### Input Validation

- Validate all external inputs at the service boundary
- Use Zod for all data transformations
- Sanitize user-provided content before display
- No SQL injection risk (Supabase uses parameterized queries)

### RLS Policies

Supabase Row-Level Security (RLS) policies are the enforcement layer. No client-side security — security is server-enforced.

---

## Documentation Update Requirements

**Mandatory Updates:**

| Change Type | File to Update | Section |
|-------------|----------------|---------|
| New feature | FEATURES.md | Add to relevant feature section |
| UI change | FEATURES.md | Update feature description |
| Workflow stage change | ENGINEERING.md | `#workflow-states` |
| Database schema change | ENGINEERING.md | `#database-schema` |
| Env var change | ENGINEERING.md | `#environment-configuration` |
| Architecture change | ENGINEERING.md | `#architecture` or relevant section |

**Code Documentation:**
- JSDoc for all exported functions/hooks/services
- Comments explain WHY, not WHAT
- Tag critical logic with `[CRITICAL]`

---

## Governance

### Amendment Process

1. **Proposal:** Document the change and rationale
2. **Review:** Discuss with team (if multi-person) or self-approval (personal project)
3. **Version Bump:** Update version per semver rules
4. **Propagation:** Update dependent templates and docs (see Sync Impact Report)
5. **Commit:** Use `docs: amend constitution to vX.Y.Z (description)` format

### Version Policy

Constitution follows semantic versioning:

- **MAJOR:** Backward-incompatible principle removals or redefinitions
- **MINOR:** New principle/section added or materially expanded guidance
- **PATCH:** Clarifications, wording, typo fixes, non-semantic refinements

### Compliance Review

- **Monthly:** Check test coverage, build time, lint errors
- **Per PR:** Verify at least 2 principles are followed (random sampling)
- **Runtime:** Use `AGENTS.md` and `WORKSPACE_RULES.md` as development guidance

### Supersedes All Other Practices

This Constitution is the source of truth. If `AGENTS.md`, `WORKSPACE_RULES.md`, or any other runtime guidance conflicts with a principle here, the Constitution wins. Runtime files may be updated to align with this document.

---

## Quick Reference Paths

- **Components:** `src/components/`
- **Grid Components:** `src/components/grid/`
- **Hooks:** `src/hooks/`
- **Store Slices:** `src/store/slices/`
- **Services:** `src/services/`
- **Types:** `src/types/` (centralized Zod schemas)
- **Tests:** `src/test/` (unit), `tests/` (E2E)
- **Configuration:** `biome.json`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`

---

**Version:** 2.0.0 | **Ratified:** 2026-03-03 | **Last Amended:** 2026-03-03
