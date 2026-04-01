# Phase 8 — Global Search + Shared Workflows

## Scenarios

1. **Ctrl+K opens search workspace** (P1 smoke)  
   Keyboard shortcut opens the search overlay/dialog.

2. **Search aggregates results from all stages** (P1 regression)  
   Typing a known E2E_TEST_ customer name returns rows from multiple stages.

3. **Mixed-source selection blocks bulk stage actions** (P1 regression)  
   Selecting rows from different stages should disable or warn on bulk stage-move actions.

## Seeds Used

- `seedOrder()` + `seedMainSheetRow()` + `seedCallListRow()` — one row per stage for cross-stage search test

## Files

- `search.smoke.spec.ts` — P1 scenario 1
- `search.regression.spec.ts` — P1 scenarios 2–3

## Notes

- Search workspace: may be a dialog or custom component. Use fallback chain in locators.
- Ctrl+K: use `authedPage.keyboard.press("Control+k")`.
- Mixed-source bulk: discover toolbar behavior via playwright-cli.

## Run

```bash
npx playwright test e2e/phase-8-search/ --project=edge
```
