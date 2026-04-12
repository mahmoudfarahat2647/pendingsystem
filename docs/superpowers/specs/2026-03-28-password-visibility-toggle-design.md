---
title: Password Visibility Toggle — Design Spec
date: 2026-03-28
status: implemented
feature: password-visibility-toggle
type: spec
---

# Password Visibility Toggle — Design Spec

---

## Context

The authentication card has password input fields that currently have no way to reveal the entered text. Users cannot verify what they've typed, which causes frustration on login failures and when setting a new password. Adding an eye icon toggle is a standard UX pattern that eliminates this friction.

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Icon placement | Inside the fieldset border, right-aligned | Contained, clean, matches the fieldset layout |
| Icon color (default) | Muted yellow — `rgba(255,204,0,0.35)` | Consistent with the yellow accent language |
| Icon color (active/hover) | Full yellow — `#FFCC00` | Matches fieldset border focus behavior |
| Icon style | Lucide `Eye` / `EyeOff` — thin stroke (1.75px) | Already used app-wide, zero new dependencies |
| Scope | All password fields across all auth pages | Login (1 field), ResetPassword (2 fields) |

---

## Components Affected

- `src/components/auth/LoginForm.tsx` — 1 password field (`password`)
- `src/components/auth/ResetPasswordForm.tsx` — 2 password fields (`newPassword`, `confirmPassword`)
- `src/components/auth/ForgotPasswordForm.tsx` — no password fields, no change needed

---

## Implementation Design

### State

Each password field gets its own independent `useState<boolean>` toggle (e.g. `showPassword`, `showNewPassword`, `showConfirmPassword`). No shared state — fields toggle independently.

### Markup Change

The `<fieldset>` content area becomes a flex row:

```tsx
<div style={{ display: 'flex', alignItems: 'center' }}>
  <input
    type={showPassword ? 'text' : 'password'}
    ...existing props...
  />
  <button
    type="button"
    onClick={() => setShowPassword(v => !v)}
    tabIndex={-1}
    aria-label={showPassword ? 'Hide password' : 'Show password'}
    className="..."
  >
    {showPassword ? <EyeOff ... /> : <Eye ... />}
  </button>
</div>
```

### Button Styling

```
- background: none / transparent
- border: none
- cursor: pointer
- padding: 0 4px
- color: rgba(255,204,0,0.35) at rest
- color: #FFCC00 on hover/when active (visible state)
- transition: color 150ms
- flex-shrink: 0
- outline: none / focus-visible ring optional
```

`type="button"` is mandatory to prevent form submission on click.
`tabIndex={-1}` keeps keyboard flow on the input itself, not the button.

### Icon

```tsx
import { Eye, EyeOff } from 'lucide-react'
// size={16}, strokeWidth={1.75}
```

---

## Verification

1. Run `npm run dev` and navigate to `/login`
2. Confirm eye icon appears inside the password fieldset, right-aligned
3. Click icon — password becomes visible, icon switches to EyeOff
4. Click again — password hidden, icon switches back to Eye
5. Hover icon — color transitions to full yellow `#FFCC00`
6. Navigate to `/reset-password?token=test`
7. Confirm both New Password and Confirm Password fields have independent toggles
8. Verify form still submits correctly (button type="button" check)
9. Run `npm run type-check` — no errors
10. Run `npm run lint` — no errors
