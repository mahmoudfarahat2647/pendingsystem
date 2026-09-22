# Prototype: AG Grid locale/direction switching strategy (#264)

Throwaway prototype for issue #264 (spike; parent #255). This branch and folder
are the **primary source** referenced by the decision doc at
`docs/spikes/264-aggrid-locale-rtl.md` on branch `spike/264-aggrid-locale`
(PR #282).

This code is not wired into the app and is not intended to be merged to `main`.
It exists only so the empirical findings behind the decision doc are
reproducible and inspectable.

## Contents

- `prototype.mjs` — standalone headless (jsdom) harness that drives
  `ag-grid-community` directly (`createGrid`, no React) against the exact
  version pinned in pendingsystem's `package.json` (`^32.3.3`), fetched fresh
  from the public npm registry. It runs five tests answering:
  1. Does `gridApi.setGridOption('localeText', …)` update a live/mounted grid?
  2. Does `gridApi.setGridOption('enableRtl', …)` update a live/mounted grid?
  3. Does AG Grid's own `getState()` / `initialState` round-trip correctly
     restore column order/pinning/sizing, sort, filter, row selection and
     pagination across a `destroy()` + recreate?
  4. What happens to an open cell editor (a) when a live-option attempt is
     made while it's open, and (b) across an actual `destroy()` + recreate,
     with and without an explicit `stopEditing(false)` flush beforehand?
  5. Does pendingsystem's existing ~500ms layout-persistence debounce
     (`DataGrid.tsx`'s `handleSaveState`) interact badly with a recreation
     that happens inside that window?
- `output.txt` — captured stdout from running `prototype.mjs`.
- `evidence-ag-grid-source.md` — the relevant excerpts from AG Grid
  32.3.3's own shipped type declarations and runtime source
  (`propertyKeys.d.ts`, `gridOptions.d.ts`, `gridApi.d.ts`,
  `GridOptionsService.updateGridOptions()`) that make the two headline
  findings (`localeText` and `enableRtl` are both `@initial`-only in this
  version) authoritative rather than just inferred from runtime behavior.

## Reproducing

Needs network access to the public npm registry (this repo's own
`pnpm install` currently fails for an unrelated reason — `xlsx` is pinned to a
direct CDN tarball URL that isn't reachable from every environment — so this
prototype was built and run in an isolated scratch directory rather than the
main project's `node_modules`):

```bash
mkdir /tmp/aggrid-spike-264 && cd /tmp/aggrid-spike-264
npm init -y
npm install ag-grid-community@32.3.3 jsdom
cp <this-folder>/prototype.mjs .
node prototype.mjs
```

## Headline findings (see the decision doc for the full write-up)

- `localeText` and `enableRtl` are both `@initial` GridOptions in the
  installed v32.3.3 and are listed in AG Grid's own
  `INITIAL_GRID_OPTION_KEYS`. Calling `gridApi.setGridOption()` on either
  logs `"<key> is an initial property and cannot be updated."` and has no
  visible effect — confirmed empirically (overlay text and `ag-rtl` class
  unchanged) and at the source level.
- Recreation (`destroy()` + `createGrid()`) is required for both. AG Grid's
  own `getState()`/`initialState` mechanism round-trips column
  order/pinning/sizing, sort, filter, row selection, and pagination
  correctly across that recreation.
- An open cell editor is undisturbed by a live-option *attempt* (no
  recreation happens, so nothing interrupts it). Across an actual
  `destroy()` + recreate, a bare `destroy()` does **not** commit an
  in-progress edit — the switching code must call `gridApi.stopEditing(false)`
  explicitly before capturing state/destroying if it wants to preserve
  (rather than silently discard) whatever the user was mid-typing.
- The existing 500ms persistence debounce writes to durable storage lazily;
  the grid wrapper already keeps an immediately-updated in-memory
  ("live") snapshot alongside it. A recreation that reads the live snapshot
  (not the debounced durable one) loses nothing even if it happens inside
  the 500ms window; reading only the durable value would lose whatever
  changed inside that window.
