# Phase 9 — Row Modals + Notifications

## Scenarios

1. **Notes modal saves a note to a seeded order row** (P1 regression)  
   Action column note icon → dialog → fill text → save → dialog closes.

2. **Attachment upload rejects files over 5MB** (P1 regression)  
   Upload a 6MB buffer → error message about size limit.

3. **Reminder modal sets and persists a reminder** (P1 regression — optional)  
   Action column reminder icon → set date → save → icon updates.

## Seeds Used

- `seedOrder()` with custom `customer_name` per test

## Files

- `row-modals.regression.spec.ts` — P1 scenarios 1–2

## Notes

- Action column does NOT use `field: "id"` — it's a composite valueGetter. Discover the note/reminder/attachment icons via playwright-cli snapshot with `--depth=5`.
- File input for attachment: `input[type="file"]` inside the attachment modal.
- Notification bell: in Header — discover ref via playwright-cli on /dashboard.

## Run

```bash
npx playwright test e2e/phase-9-modals/ --project=edge
```
