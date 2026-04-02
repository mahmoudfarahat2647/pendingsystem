# Phase 2 — App Shell + Dashboard

## Scenarios

1. **Sidebar links navigate to all 5 stage routes** (P0 smoke)
2. **Header search input is visible and focusable** (P0 smoke)
3. **Export menu is accessible from header** (P0 smoke)
4. **Dashboard renders without crashing** (P0 smoke)
5. **Dashboard storage widgets degrade gracefully when API is down** (P1 regression)

## Files

- `app-shell.smoke.spec.ts` — P0 scenarios 1–4
- `app-shell.regression.spec.ts` — P1 scenario 5

## Notes

- Sidebar link selectors: discover via `playwright-cli snapshot` on /dashboard.
- Search workspace: may be a dialog or a custom overlay — use `.or()` fallback chain.
- Export button: check toolbar area on /orders (not just dashboard).

## Run

```bash
npx playwright test e2e/phase-2-app-shell/ --project=edge
```
