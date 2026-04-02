# Phase 3 — Orders

## Scenarios

1. **Orders page loads without error** (P0 smoke)  
   Grid visible, no 500 error.

2. **Commit Beast-Mode-complete order to Main Sheet** (P0 smoke)  
   Seeds a row with all Beast Mode requirements met, selects it, commits it, verifies it leaves Orders.

3. **Create order form opens and closes correctly** (P1 regression)  
   "Add Order" button opens modal; Cancel closes modal without saving.

4. **Commit is blocked when required part fields are missing** (P1 regression)  
   Seeds a row with empty partNumber; commit button should be disabled or show a validation error.

## Seeds Used

- `seedBeastModeOrder()` — row with full Beast Mode data
- `seedOrderMissingPartNumber()` — row with empty partNumber/description
- `seedOrder()` — generic order row

## Files

- `orders.smoke.spec.ts` — P0 scenarios 1–2
- `orders.regression.spec.ts` — P1 scenarios 3–4

## Notes

- Beast Mode requires: partNumber, description, attachment_link, cntrRdg > 0, partStatus = "Arrived".
- All seeded rows have `E2E_TEST_` prefix — cleanup is safe.
- Cleanup: `cleanupTestRows()` called in `afterEach` or in a `finally` block for smoke tests.

## Run

```bash
npx playwright test e2e/phase-3-orders/ --project=edge
```
