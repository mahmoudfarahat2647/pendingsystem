# Phase 7 — Archive

## Scenarios

1. **Archive page loads with booking date column visible** (P1 smoke)  
   Page renders without error.

2. **Reorder to Orders requires a reason** (P1 regression)  
   Submitting reorder dialog without a reason keeps row in Archive.

3. **Permanent delete requires confirmation** (P1 regression)  
   Delete action should show a confirmation dialog before removing.

## Seeds Used

- `seedArchiveRow()` — row in "archive" stage

## Files

- `archive.smoke.spec.ts` — P1 scenario 1
- `archive.regression.spec.ts` — P1 scenarios 2–3

## Notes

- Reorder from Archive: sends row back to Orders stage.
- Permanent delete: different from stage-move delete. Should ask for confirmation.
- Discover selectors via playwright-cli snapshot on /archive.

## Run

```bash
npx playwright test e2e/phase-7-archive/ --project=edge
```
