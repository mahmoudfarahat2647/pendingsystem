# Phase 10 — Settings, Reporting, and Ops

## Scenarios

1. **Settings modal opens from the profile/sidebar area** (P1 smoke)  
   Button click → dialog visible → locked state indicator.

2. **Wrong password keeps settings locked** (P1 smoke)  
   Fill wrong password → still shows locked/error state.

3. **Report settings can be viewed** (P1 regression)  
   Settings modal has a report/notifications tab; recipients field is visible.

4. **/api/health returns 200 with a status property** (P2 ops)  
   Direct API call from authedPage.request.

## Seeds Used

- `seedReportSettings()` — upserts a test report settings row

## Files

- `settings.smoke.spec.ts` — P1 scenarios 1–2
- `settings.regression.spec.ts` — P1 scenario 3
- `ops.regression.spec.ts` — P2 scenario 4

## Notes

- Settings button: look in sidebar profile area. Discover via playwright-cli snapshot.
- Theme tab is a placeholder only — do not test theme customization.
- CloudSync is a legacy utility — do not test CloudSync behavior.

## Run

```bash
npx playwright test e2e/phase-10-settings-ops/ --project=edge
```
