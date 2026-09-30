# Theme (Dark / White)

Two themes: **Dark** (the original, default) and **White**. Spec: `.github/specs/white-theme.md` (issue `#340`, tracking `#352`).

## How it works

- **Preference**: browser-local key `pending-sys-theme`, values `dark` | `white`. A missing, unreadable or unrecognised value, or storage that throws, resolves to Dark. It is deliberately **not** in the persisted Zustand store (that hydrates after first render and would flash the wrong theme).
- **Applied via the `dark` class on `<html>`**. Dark = class present. White = class absent, so the light tokens already defined in `:root` (`globals.css`) apply.
- **No flash**: `src/app/layout.tsx` keeps `class="dark"` as the SSR default and injects `THEME_INIT_SCRIPT` (`src/lib/theme.ts`) in `<head>`, which removes the class before first paint only for a saved `white` choice. It also applies on the login / forgot-password / reset-password pages.
- **Live switching, no remount**: `useTheme()` (`src/hooks/useTheme.ts`, `useSyncExternalStore`) writes the key and toggles the class in place. Routes, draft sessions, forms, selections, scroll position and open dialogs are untouched. Cross-tab changes sync via the `storage` event.
- **Settings → Theme tab** (`ThemeTab.tsx`): explicit Dark / White buttons, translated EN/AR under `settings.theme.*`. No system-theme option and no header control (per spec).
- **`/mobile-order` is always Dark**: the pre-paint script skips it (direct load), `ForceDarkTheme` in its layout forces Dark on client navigation and restores the saved theme on leave, and the cross-tab handler and `ThemedToaster` ignore the preference on always-dark paths (`isAlwaysDarkPath`).
- **Sonner toasts** follow the theme (`ThemedToaster`).
- **AG Grid**: `gridThemeDark` (unchanged) and `gridThemeWhite` in `src/lib/ag-grid-setup.ts`; `getGridTheme(theme)` is passed as the `theme` prop of `DataGrid` and `SearchResultsGrid`, so switching never remounts the grid.

## The Dark-safety rule (how new UI must be written)

Dark output is the reference and must not change.

- Hardcoded dark colours keep their **original value verbatim under `dark:`**; the White value is the default: `bg-[#0c0c0e]` becomes `bg-white dark:bg-[#0c0c0e]`.
- Existing `dark:` variants are audited (removing the `dark` class activates their non-dark side).
- No unconditional edit to a shared primitive or global rule. White-only global CSS is scoped, e.g. `:root:not(.dark) ::-webkit-scrollbar-thumb`.
- `text-white` on a coloured button (`bg-red-500`, `bg-indigo-600`, ...) stays `text-white` in both themes.
- Do not add `dark:bg-*` next to a `className` that callers override with their own `bg-*` (it would win in Dark).
- Guard: `src/test/whiteThemeDarkSafety.test.ts` scans all of `src` and fails if a bare dark-only colour literal (for example `bg-[#1c1c1e]`, `border-white/10`) reappears. Exempt: `Sidebar.tsx` (black in both themes), `global-error.tsx`, `useDraftSession.tsx` (self-contained dark recovery toast), `/mobile-order`. The auth components (`src/components/auth/`) are no longer exempt; they are converted and scanned like the rest of `src`. The same test also has a "grid cell contrast" case (see below) that checks the `--grid-positive` variable and that the green cell files no longer use a bare `color: "#22c55e"`.

## White design notes

- **Sidebar** stays black in both themes; header, dropdowns, dialogs and overlays are light (overlay dim is lighter in White).
- **Dashboard**: White hero is `public/hero.png` in a `aspect-[2027/776]` box (the whole image is always visible, so the baked-in copy is never cropped; Dark keeps `/dashboard-car.webp` at 460px). Stat tiles and the calendar are non-interactive in White (no arrow icon, no pointer cursor, no hover). Charts read the theme: ring track, tooltip, bar value labels (White only), no drop shadow in White.
- **Status colours** (`StatusRenderer`): stored colours are never modified; White renders a tinted chip with darker text via `color-mix`. The Reorder status text is `#a16207` in White and keeps `#d4a017` under `dark:`.
- **Grid cell contrast**: the green "positive" cell colour (mobile numbers, Booking date, Global Search "Booking" source, Archive cells) is written as `var(--grid-positive, #22c55e)`. `globals.css` defines `--grid-positive: #15803d` only under `:root:not(.dark)`, so White gets a darker green while Dark, where the variable is unset, falls back to the original `#22c55e`. Used in `GridConfig.tsx` (Booking date, Call-list mobile, Global Search source), `MobileCellRenderer.tsx` and `archive/page.tsx`. The CNTR RDG alert icon (`CntrRdgCellRenderer`, via `useTheme()`) uses darker shades in White (`#dc2626` high, `#a16207` warning) and keeps `#ef4444` / `#eab308` in Dark.
- **Accent text** (`text-indigo-400`, `text-red-400`, ...) becomes the `-600` shade in White for contrast.
- **Auth pages** (`AuthPageShell`, `LoginForm`, `ForgotPasswordForm`, `ResetPasswordForm`): same photo with a light left-to-right white gradient overlay and a light translucent card (lighter border and shadow) in White; Dark keeps the original black overlay and card verbatim under `dark:`. Headings, subtitle, input text and autofill text colour are black in White. Gold text and borders use a darker gold in White (`#8A6D00` text, `#B38F00` border, `#6B5500` hover) while the focus border and the yellow logo underline stay `#FFCC00`. The "pending system" `ShiningText` uses a grey-to-black shine gradient with no text-shadow in White (grey-to-white with the original shadow in Dark).

## Known gaps / follow-ups

- Remaining inline gray grid cell colours (`#6b7280`, about 4.8:1 on white) are left as is; the Archive source cell is intentionally dimmed to 50% opacity. The faint green cells were addressed via `--grid-positive`.
- `global-error.tsx` and the draft-recovery toast stay dark by design.
- No automated pixel comparison exists (the earlier screenshot-baseline tool, PR `#351`, was dropped); Dark is protected by the guard test above and a manual check on each preview.
