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
  `ag-grid-community` directly (`createGrid`, no React) against
  `ag-grid-community@32.3.9` — the **exact version `pnpm-lock.yaml` resolves**
  for the `^32.3.3` range in pendingsystem's `package.json` — fetched fresh
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
  32.3.9's own shipped type declarations and runtime source
  (`propertyKeys.d.ts`, `gridOptions.d.ts`, `gridApi.d.ts`,
  `GridOptionsService.updateGridOptions()`) that make the two headline
  findings (`localeText` and `enableRtl` are both `@initial`-only in this
  version) authoritative rather than just inferred from runtime behavior.

## Version correction (review 5274566894 on PR #282)

The first pass of this prototype tested `ag-grid-community@32.3.3` (matching
the `package.json` caret range) instead of `32.3.9` (what `pnpm-lock.yaml`
actually resolves and what the app actually runs). It also had several
harness bugs that produced weak, undefined-vs-undefined or empty-vs-empty
"evidence" in TESTs 1, 3, 4 and 5. Both are fixed as of this revision:
`prototype.mjs`, `output.txt`, and this README now reflect a rerun against
`32.3.9` with a harness that exercises real, non-trivial state throughout.
See `evidence-ag-grid-source.md`'s "Version correction" section and the
comment block at the top of `prototype.mjs` for the itemized list of what was
wrong and how each was fixed. The core conclusion (`localeText`/`enableRtl`
are both initial-only, recreation required) is unchanged — only the
supporting tests around it were weak, not that conclusion itself.

## Reproducing

Needs network access to the public npm registry (this repo's own
`pnpm install` currently fails for an unrelated reason — `xlsx` is pinned to a
direct CDN tarball URL that isn't reachable from every environment — so this
prototype was built and run in an isolated scratch directory rather than the
main project's `node_modules`):

```bash
mkdir /tmp/aggrid-spike-264 && cd /tmp/aggrid-spike-264
npm init -y
npm install ag-grid-community@32.3.9 jsdom
cp <this-folder>/prototype.mjs .
node prototype.mjs
```

## Headline findings (see the decision doc for the full write-up)

- `localeText` and `enableRtl` are both `@initial` GridOptions in the
  installed v32.3.9 and are listed in AG Grid's own
  `INITIAL_GRID_OPTION_KEYS`. Calling `gridApi.setGridOption()` on either
  logs `"<key> is an initial property and cannot be updated."` and has no
  visible effect — confirmed empirically (TEST 1's overlay text starts as a
  real, non-empty localized string and only changes after the fix; TEST 2's
  `ag-rtl` class stays absent) and at the source level.
- Recreation (`destroy()` + `createGrid()`) is required for both. AG Grid's
  own `getState()`/`initialState` mechanism round-trips column
  order/pinning/sizing, sort, filter, row selection, pagination, and focused
  cell correctly across that recreation — each of these now verified against
  a real, non-default captured value (not a default-vs-default or
  undefined-vs-undefined comparison). Scroll position remains an **open
  item**: headless jsdom has no real scrollable viewport to produce a
  non-zero scroll position from, so this one sub-case still needs a
  real-browser (Playwright) check.
- An open cell editor is undisturbed by a live-option *attempt* (no
  recreation happens, so nothing interrupts it) — now verified by actually
  mutating the editor's value mid-edit (via its default text editor's
  `eInput.setValue()`) and confirming that value survives the attempt. Across
  an actual `destroy()` + recreate, a bare `destroy()` does **not** commit an
  in-progress edit — the switching code must call `gridApi.stopEditing(false)`
  explicitly before capturing state/destroying if it wants to preserve
  (rather than silently discard) whatever the user was mid-typing; TEST
  4a/4b now show this as a real value difference (`'Beta'` discarded vs.
  `'Zed'` committed), not two identical-looking runs.
- The existing 500ms persistence debounce writes to durable storage lazily;
  the grid wrapper already keeps an immediately-updated in-memory
  ("live") snapshot alongside it. A recreation that reads the live snapshot
  (not the debounced durable one) loses nothing even if it happens inside
  the 500ms window — now confirmed with a real resized width (321) rather
  than an undefined column-sizing value; reading only the durable value
  would lose whatever changed inside that window.
