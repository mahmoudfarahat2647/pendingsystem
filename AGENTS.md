# AGENTS.md - Guidance for coding agents

This file captures build/test commands and coding standards for this repo.
Primary sources: `package.json`, `biome.json`, `tsconfig.json`, `vitest.config.ts`,
`playwright.config.ts`, `docs/CONTRIBUTING.md`, `docs/DEVELOPMENT_RULES.md`,
`WORKSPACE_RULES.md`, and `docs/README.md`.

No Cursor rules found in `.cursor/rules/` or `.cursorrules`.
No Copilot rules found in `.github/copilot-instructions.md`.

## Build, Lint, Test

Install dependencies:

```bash
npm install
```

Common commands:

```bash
npm run dev          # Next.js dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Biome lint + format check
npm run lint:fix     # Biome fix/format
npm run type-check   # TypeScript (no emit)
npm run test         # Vitest run
npm run test:watch   # Vitest watch
npm run test:ui      # Vitest UI
npm run e2e          # Playwright tests
npm run e2e:ui       # Playwright UI
npm run e2e:debug    # Playwright debug
npm run e2e:headed   # Playwright headed
npm run e2e:report   # Playwright report
```

Single-test patterns:

```bash
# Vitest: run a single file
npm run test -- src/test/ordersSlice.test.ts

# Vitest: run by test name
npm run test -- -t "Order form submits"

# Playwright: run one spec file
npm run e2e -- tests/orders.e2e.spec.ts

# Playwright: run by project/browser
npm run e2e -- --project=chromium
```

Notes:
- Playwright uses `tests/` and `*.e2e.spec.ts` (see `playwright.config.ts`).
- Vitest uses `jsdom` and `src/test/setup.ts` (see `vitest.config.ts`).
- Node.js 18.x or 20.x recommended (per `docs/CONTRIBUTING.md`).

## Formatting & Linting (Biome)

Biome is the source of truth for formatting and linting:
- Indentation: tabs.
- Quote style: double quotes.
- Imports are organized automatically.
- Lint rules: recommended set + project overrides in `biome.json`.

Restricted imports (error):
- Do not import `@/components/shared/DataGrid` or `@/components/shared/DynamicDataGrid`.
- Use `@/components/grid` instead.

Lint warnings to heed:
- `noExplicitAny` is warned (treat as error per workspace rules).
- `noUnusedFunctionParameters` is warned.

## Imports & Module Boundaries

- Use absolute imports with the `@` alias (`@/*` -> `src/*`).
- Avoid relative deep paths like `../../`.
- Keep one component/hook/utility per file; split if a file grows past ~250 lines.

## TypeScript & Data Integrity

- TypeScript is `strict` (see `tsconfig.json`).
- No `any`: use precise types or `unknown` with narrowing.
- Every React component must declare a props interface/type.
- Centralize Zod schemas and inferred types in `src/types/index.ts`.
- Validate all Supabase/external data with Zod before it reaches UI or stores.
- Use Zod `.transform()` to sync legacy fields (e.g., `partNumber`, `description`).

## State Management & Data Flow

Zustand:
- Use slices in `src/store/slices/`.
- Define actions/state in `src/store/types.ts`.
- Always use selectors (e.g., `useAppStore(state => state.data)`).
- Do not store derived state in the store.

React Query:
- Use React Query for all backend data (Supabase queries).
- Do not mirror server data into Zustand unless it is purely UI-local.

Supabase access:
- Use a service layer in `src/services/`.
- Do not call Supabase directly in components.

## Error Handling & User Feedback

- Wrap critical UI in `ClientErrorBoundary` with a clear fallback title.
- All mutations should provide user feedback (e.g., toast on success/error).
- Validate inputs and handle errors gracefully; no silent failures.

## Performance & UX Rules

- Use `React.memo`, `useMemo`, and `useCallback` for expensive work.
- Use dynamic imports for heavy components (e.g., grids).
- Debounce search inputs (>= 300ms).

Protected behaviors (do not change without explicit request):
- In `GridConfig.tsx`, do not revert the composite `valueGetter` to `field: "id"`.
- Optimistic UI: always use `onMutate` and `onSuccess` for cache updates.
- Do not add `setTimeout` or artificial delays to `onSettled`/`invalidateQueries`.

## Naming & Structure

- Use meaningful names; keep functions small and single-purpose.
- Match existing conventions and directory layout.
- `src/components/` for UI, `src/hooks/` for hooks, `src/utils/` for utilities,
  `src/services/` for data access, `src/types/` for types.

## Testing Requirements

- New features must include tests.
- Suggested locations:
  - Store slices: `src/test/{sliceName}.test.ts` (target 100% coverage).
  - Services: `src/test/{serviceName}.test.ts` (target 90%+ coverage).
  - Complex components: `src/test/{componentName}.test.tsx` (target 70%+ coverage).

## Documentation Updates

- If you add or change a feature/UI/store action, update `features.md` (required).
- Also update docs when relevant:
  - Workflow stages: `docs/WORKFLOW_STATES.md`
  - Database schema: `docs/DATABASE_SCHEMA.md`
  - Env vars: `docs/ENVIRONMENT.md`
- Prefer JSDoc for public APIs, hooks, and complex utilities.

## Accessibility

- Add `aria-label` for icon-only buttons.
- Modals should use the shared `Dialog` component (focus trapping).

## Git & Workflow

- Use conventional commit messages: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.
- Before merge: `npm run lint`, `npm run test`, `npm run build` must pass.
- Keep changes minimal; do not refactor beyond the explicit request.

## Agent Behavior (from project rules)

- Modify only what is explicitly requested; avoid unrelated changes.
- Preserve existing behavior unless the request requires a change.
- Ask for clarification only if requirements are ambiguous or risky.
- Explain the plan and list targeted files before making changes.

## Quick Reference Paths

- `src/components/grid/` for DataGrid wrappers
- `src/store/slices/` for Zustand slices
- `src/services/` for Supabase access
- `src/test/` for unit/integration tests
- `tests/` for Playwright E2E tests
