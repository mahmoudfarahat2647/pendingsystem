# Phase 6 — Booking

## Scenarios

1. **Booking page loads and shows VIN summary** (P0 smoke)  
   Page renders without error.

2. **Booking modal blocks confirmation with a past date** (P1 regression)  
   After rebooking opens, selecting a past date keeps Confirm disabled.

## Seeds Used

- `seedBookingRow()` — row in "booking" stage with future bookingDate

## Files

- `booking.smoke.spec.ts` — P0 scenario 1
- `booking.regression.spec.ts` — P1 scenario 2

## Notes

- Date picker type: discover via playwright-cli — may be `input[type="date"]` or a custom calendar component.
- Rebook button: `getByTestId("rebook-button")` or `getByRole("button", { name: /rebook|reschedule/i })`.

## Run

```bash
npx playwright test e2e/phase-6-booking/ --project=edge
```
