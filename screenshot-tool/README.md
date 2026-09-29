# Dark screenshot baseline (issue #341)

Repeatable Dark screenshot baseline for the white-theme rollout. Later
tickets re-capture Dark and diff against the committed `baseline/` images;
any unexplained difference blocks the merge.

## One command

```bash
# 1. Start the app (separate terminal)
pnpm run dev

# 2. Install the browser once per machine
pnpm exec playwright install chromium

# 3. Capture all 15 views at both viewports (30 shots)
SCREENSHOT_PASSWORD=<local-test-admin-password> pnpm run screenshots:capture

# 4. Compare the fresh capture against the committed baseline
pnpm run screenshots:compare
```

`pnpm run screenshots` is an alias of `screenshots:capture`.

## Views (15) and viewports (2)

Views: Dashboard, Orders, Main Sheet, Call List, Booking, Archive, Freeze,
Reports, search results (header search for `Baseline`), Settings modal, one
representative dialog (Orders → Create order), login, forgot-password,
reset-password, and `/mobile-order`.

Viewports: `1672x941` and `1440x900`. Files are named
`<view>@<viewport>.png`, e.g. `dashboard@1672x941.png`.

The reset-password view is captured without a token, so it deterministically
renders the page's invalid-token state rather than the reset form.

## Determinism

- **Fixed data:** the capture script intercepts Supabase (`/rest/v1/**`, including RPCs) and
  the storage/report settings APIs and serves the frozen set in
  `seed-data.mjs` — never live data.
- **Frozen clock:** `2026-09-15T12:00:00` is injected before any page script
  so the dashboard calendar and relative dates are stable.
- **Animations off:** transitions/animations are zeroed via injected CSS,
  `prefers-reduced-motion` is forced, and screenshots use
  `animations: "disabled"` with the caret hidden.
- **Dark default:** the `pending-sys-theme` key is removed so the app renders
  its current Dark appearance.

Two consecutive runs on unchanged code produce no diff.

## Compare mode

`pnpm run screenshots:compare` diffs `current/` against the committed
`baseline/` with pixelmatch and prints a per-view verdict:

- `PASS <view>@<viewport>` — identical within threshold.
- `DIFF <view>@<viewport> (x.xx%)` — pixels differ; a diff image is written
  to `diff/<view>@<viewport>.png`.
- `NO-BASELINE` / `NO-CURRENT` — a file is missing on either side.

Exit code is non-zero unless every pair is identical, so CI or a merge
check can gate on it.

## Refreshing the baseline

Only refresh deliberately (e.g. an intentional Dark change reviewed and
approved), then commit the result to `feat/white-theme`:

```bash
SCREENSHOT_PASSWORD=<pw> pnpm run screenshots:capture -- --update-baseline
```

`--update-baseline` writes into `baseline/` instead of `current/`.

## Layout

| Path | Purpose |
| --- | --- |
| `config.mjs` | Viewports, view list, file naming (pure, tested) |
| `seed-data.mjs` | Frozen rows + API mocks + PostgREST filter (pure, tested) |
| `diff-utils.mjs` | Diff thresholds + report formatting (pure, tested) |
| `capture.mjs` | Playwright capture runner |
| `compare.mjs` | pixelmatch compare runner |
| `screenshot-tool.test.mjs` | Vitest coverage of the pure seams |
| `baseline/` | Committed Dark reference images + manifest |
| `current/` | Fresh capture output (gitignored) |
| `diff/` | Diff images for changed views (gitignored) |

Environment: `BASE_URL` (default `http://localhost:3000`),
`SCREENSHOT_USERNAME` (default `admin`), `SCREENSHOT_PASSWORD` (required).
The test admin is the local Better Auth admin seeded with
`pnpm run auth:seed-admin`. No production code or runtime dependencies are
involved; the only new packages are dev-only (`playwright`, `pixelmatch`,
`pngjs`).
