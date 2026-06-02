# Fix: `'Tooltip' must be used within 'TooltipProvider'` System Error

## Context

A "System Error" screen showing `'Tooltip' must be used within 'TooltipProvider'` appears
frequently across the system. Root-cause investigation (systematic-debugging Phase 1–2) found:

- The shadcn wrapper `src/components/ui/tooltip.tsx` re-exports Radix primitives directly
  (`Tooltip = TooltipPrimitive.Root`) **without** bundling a provider. Radix's `Tooltip.Root`
  throws this exact error whenever it has no `TooltipProvider` ancestor in the React tree.
- `TooltipProvider` is mounted **piecemeal**, never at the root — only in 5 page roots
  (orders, main-sheet, call-list, booking, archive) and 2 shared components
  (`SearchToolbar`, `StatusManagementSection`).
- It is **absent** from the global tree (`src/app/layout.tsx`, `QueryProvider.tsx`, `AppShell.tsx`).
- Therefore any `<Tooltip>` rendered outside those subtrees crashes and bubbles to
  `src/app/global-error.tsx` → the "System Error" screen.

Components that trigger it: `FormFooter` (inside `OrderFormModal`), `CallCustomerCounter`,
`VINLineCounter`, `SelectAllByVinButton`, `LayoutSaveButton`, and `CntrRdgCellRenderer`
(AG Grid cell renderer — portal/detached-root mounting can break context propagation).
`DistributionChart` uses recharts' Tooltip (unrelated, ruled out).

**Intended outcome:** Mount a single `TooltipProvider` at the app root so every tooltip — in any
page, modal portal, or grid cell — always has a provider ancestor, eliminating this crash class.
Then remove the now-redundant nested providers (single source of truth).

This is a structural fix with **no behavior or UI change**: all existing providers use default
props (`delayDuration` 700ms), so a single root provider with the same defaults preserves
identical tooltip timing/behavior. (Refactor Safety Rule satisfied.)

## Changes

### 1. Add the single root `TooltipProvider` — `src/components/providers/QueryProvider.tsx`

`QueryProvider` is the existing global `"use client"` boundary wrapping all app content under
`<body>` (used by root `layout.tsx`). Wrap its children with `TooltipProvider`:

- Import `TooltipProvider` from `@/components/ui/tooltip`.
- Wrap `{children}` (inside `QueryClientProvider`) with `<TooltipProvider>...</TooltipProvider>`.
- Do **not** pass a custom `delayDuration` — keep Radix defaults to match current behavior.

This guarantees coverage for every route (including `/login`, dashboard, reports, settings),
every Radix Dialog portal (context flows through portals via the React tree), and grid cells.

### 2. Remove redundant nested `TooltipProvider` wrappers

Now covered by the root provider; remove the wrapper element and its import where it is no longer
used. Keep all inner `<Tooltip>/<TooltipTrigger>/<TooltipContent>` usage untouched.

- `src/app/(app)/orders/page.tsx` — remove `<TooltipProvider>` wrapper (lines ~133/309) + import (line 13)
- `src/app/(app)/main-sheet/page.tsx` — wrapper (~287/512) + import (line 38)
- `src/app/(app)/call-list/page.tsx` — wrapper (~247/549) + remove `TooltipProvider` from the named import (line 45)
- `src/app/(app)/booking/page.tsx` — wrapper (~244/560) + named import (line 45)
- `src/app/(app)/archive/page.tsx` — wrapper (~230/486) + named import (line 47)
- `src/components/shared/search/SearchToolbar.tsx` — wrapper (~67/283) + named import (line 24)
- `src/components/shared/settings/StatusManagementSection.tsx` — wrapper (~226/255) + named import (line 10)

When removing, replace the `<TooltipProvider>` opening/closing tags with their inner content
(the wrapper is usually the outermost returned element or a fragment). Verify the surrounding
JSX still has a single root and indentation stays consistent; run lint:fix afterward.

### 3. Leave untouched
- `src/components/ui/tooltip.tsx` — no change (re-export pattern is standard shadcn).
- `src/test/CallCustomerCounter.test.tsx` — keeps its own `TooltipProvider` wrapper; isolated
  component tests legitimately provide their own context.
- `src/components/dashboard/DistributionChart.tsx` — recharts Tooltip, unrelated.

## Verification

1. `npm run type-check` — passes (no broken imports after removals).
2. `npm run lint` — passes on all touched files.
3. `npm run test` — existing suite green (incl. `CallCustomerCounter.test.tsx`).
4. Manual (dev server `npm run dev`):
   - Visit dashboard, reports, settings — hover any tooltip; **no** System Error.
   - Open `OrderFormModal` (from header/global add) — hover the `FormFooter` tooltip; no crash.
   - On call-list, hover `CallCustomerCounter`; on orders/main-sheet hover grid-cell tooltips
     (`CntrRdgCellRenderer`) and `VINLineCounter`/`SelectAllByVinButton`/`LayoutSaveButton`.
   - Confirm tooltip open delay/behavior is unchanged (~700ms hover).
5. `npm run build` — production build succeeds (announce ~several-minute wait before running).

## PR workflow (after approval + implementation)

The requested PR is the **final output** of this work (it can't exist before the fix is committed):

1. Branch off `main`: `fix/tooltip-provider-root`.
2. Apply changes 1–2, run the full quality gate (lint → type-check → test → build).
3. Commit (Co-Authored-By trailer), push, and open a PR with `gh` titled
   `fix: mount TooltipProvider at app root to stop "must be used within TooltipProvider" crash`,
   body summarizing root cause + fix + verification.
