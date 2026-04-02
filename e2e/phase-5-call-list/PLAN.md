# Phase 5 — Call List

## Scenarios

1. **Call List page loads without error** (P0 smoke)  
   Grid visible, no 500 error.

2. **Reorder button opens modal that requires a reason** (P1 regression)  
   Submitting without a reason should not move the row out of Call List.

## Seeds Used

- `seedCallListRow()` — row in "call" stage

## Files

- `call-list.smoke.spec.ts` — P0 scenario 1
- `call-list.regression.spec.ts` — P1 scenario 2

## Notes

- Reorder modal: requires a reason field — discover exact form selector via playwright-cli.
- Row must have partNumber and description set for booking eligibility (already set in seedCallListRow).

## Run

```bash
npx playwright test e2e/phase-5-call-list/ --project=edge
```
