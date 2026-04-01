# Phase 4 — Main Sheet

## Scenarios

1. **Main Sheet loads in locked state by default** (P0 smoke)  
   Unlock button is visible on load.

2. **Unlock succeeds and grid becomes interactive** (P0 smoke)  
   After clicking unlock, Lock button appears.

3. **Action toolbar is disabled while Main Sheet is locked** (P1 regression)  
   Booking/staging buttons should be disabled before unlocking.

## Seeds Used

- `seedMainSheetRow()` — a single "main" stage row
- `seedMainSheetArrivedGroup()` — two rows with same VIN, both Arrived (auto-move test)

## Files

- `main-sheet.smoke.spec.ts` — P0 scenarios 1–2
- `main-sheet.regression.spec.ts` — P1 scenario 3

## Notes

- Lock/unlock selector: discover via `playwright-cli snapshot` on /main-sheet.
- Auto-lock timer is 5 minutes in production — do not test timer in E2E (too slow).

## Run

```bash
npx playwright test e2e/phase-4-main-sheet/ --project=edge
```
