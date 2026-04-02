# Phase 1 — Auth

> **STATUS: COMPLETED** — All 6 scenarios passed via playwright-cli (Edge) on 2026-04-01.

## Scenarios

1. **Login → dashboard → session persist → sign out** (P0 smoke)  
   Admin logs in, dashboard loads, session survives refresh, sign-out returns to /login.

2. **Guest redirects** (P0 smoke)  
   All 7 protected routes redirect to /login when unauthenticated.

3. **Invalid credentials** (P1 regression)  
   Wrong password stays on /login and shows an error message.

4. **Empty fields** (P1 regression)  
   Clicking submit with empty fields does not navigate away.

5. **Forgot password** (P1 regression)  
   Submitting any username shows success message (no enumeration).

6. **Reset password without token** (P1 regression)  
   Visiting /reset-password with no token shows an error/invalid-token state.

## Files

- `auth.smoke.spec.ts` — P0 scenarios 1–2
- `auth.regression.spec.ts` — P1 scenarios 3–6

## Notes

- Sign-out selector: use `playwright-cli snapshot` on /dashboard to discover the exact ref.
  Fallback chain already in spec: `getByRole("button", { name: /sign out/i })` → `getByTestId("sign-out-button")` → `getByText(/sign out/i)`.
- Auth fixture: `authedPage` (session pre-loaded from `e2e/.auth/admin.json`).
- Guest redirect tests use the bare `page` fixture (no session).

## Run

```bash
npx playwright test e2e/phase-1-auth/ --project=edge
```
