# Quickstart: Orders Tab Validation Refactor

## Prerequisites

- Node.js 18.x or 20.x
- Dependencies installed: `npm install`
- Feature branch checked out: `001-refactor-orders`

## 1) Implement core UI updates

1. Update company dropdown options to only `Zeekr` and `Renalt`.
2. Replace requester field location icon with a person/name icon.
3. Preserve shared `Dialog` usage for blocking warnings.

## 2) Implement validation behavior

1. Keep Default Mode permissive:
   - Allow partial VIN.
   - Skip VIN+part duplicate checks when VIN is partial.
   - Do not show VIN+part duplicate warnings.
2. Enforce Beast Mode strict gate:
   - Require all mandatory fields.
   - Block progression on VIN+part duplicates.
   - Block progression on part-description conflicts.
3. Add inline red warning for part-description conflict in Default Mode with one-click copy of canonical description.
4. Prevent duplicate part numbers within the same order in all modes.

## 3) Implement cross-tab guard

1. Trigger guard on VIN mismatch only.
2. Require save-first behavior before tab switch when mismatch exists.
3. Allow canceling the switch.
4. Apply mixed-VIN edit blocking across all grid sheets that support form editing.
5. Block all form-opening entry points when selection contains multiple normalized VIN values.
6. Treat blank VIN as a distinct VIN bucket in mixed-selection checks.
7. Show blocked-action guidance on both hover and keyboard focus.

## 4) Validate data flow and architecture

1. Keep backend data in React Query.
2. Keep Supabase access in `src/services/` only.
3. Keep schema validation at service/form boundary.

## 5) Add tests

Recommended minimum additions/updates:

- `src/test/ordersPage.test.tsx`
  - Default vs Beast mode behavior.
  - Company options and requester icon assertions.
  - Mixed-VIN edit eligibility across grid sheets.
- `src/test/orderService.test.ts`
  - Historical duplicate and description conflict checks.
- `src/test/OrderFormModal.test.tsx` (new if absent)
  - Inline description warning + copy action.
  - Duplicate part number within-order blocking.
  - Mixed-VIN form-open block for icon and non-icon entry points.
- `src/test/Sidebar.test.tsx`
  - Save-first cross-tab prompt when VIN mismatch exists.
  - Keyboard-focus guidance parity for blocked actions.
- `tests/orders-validation.e2e.spec.ts` (new)
  - Save-first cross-tab VIN mismatch guard.
  - Mixed-VIN selection keeps edit actions disabled until single-VIN selection is restored.

## 6) Run verification gates

```bash
npm run lint
npm run test
npm run build
```

Optional focused runs during development:

```bash
npm run test -- src/test/ordersPage.test.tsx
npm run test -- src/test/orderService.test.ts
npm run e2e -- tests/orders-validation.e2e.spec.ts
```

## Expected Result

- Orders entry supports fast rush-hour capture in Default Mode.
- Beast Mode enforces strict progression quality gate.
- Duplicate/conflict rules behave exactly as clarified in the spec.
- Cross-tab editing remains safe via VIN save-first guard.
