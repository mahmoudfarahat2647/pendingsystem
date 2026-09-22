# Source-level evidence (ag-grid-community 32.3.9)

Extracted directly from the `ag-grid-community@32.3.9` package installed from the
public npm registry — the **exact version `pnpm-lock.yaml` resolves** for the
`^32.3.3` range in pendingsystem's `package.json` (confirmed via
`grep -n "ag-grid-community@" pnpm-lock.yaml`, which shows
`ag-grid-community@32.3.9:`). The original pass of this doc/prototype tested
`32.3.3` directly rather than the resolved `32.3.9` — see the "Version
correction" note below. All findings on this page were re-verified against the
`32.3.9` package's own shipped `.d.ts`/bundled source and hold unchanged.

## Version correction (review 5274566894 on PR #282)

The initial spike tested `ag-grid-community@32.3.3` (matching the caret range
in `package.json`) instead of `32.3.9` (what the lockfile actually resolves
and what the app actually installs). Re-running against `32.3.9` specifically:

- `localeText` and `enableRtl` are **still** both listed in
  `INITIAL_GRID_OPTION_KEYS` in `32.3.9`'s shipped `propertyKeys.d.ts`, with
  identical `@initial` JSDoc tags on both properties in `gridOptions.d.ts`, and
  an identical `updateGridOptions()` warn-but-don't-block implementation in the
  bundled `main.cjs.js` (byte-identical warning string and control flow to what
  was previously checked against `32.3.3`). This is expected — a patch-version
  bump (`32.3.3` → `32.3.9`) is very unlikely to change a documented public API
  contract, and it did not here. **The core conclusion is unchanged**: both
  properties are initial-only and require full grid recreation to change live.
- The one file-path detail worth noting: the type declarations in the
  installed package live under `dist/types/core/...`, not
  `dist/types/src/...` as the very first draft of this note assumed before
  verification — this is a path detail, not a functional finding, and is
  corrected in the code excerpts below.

## 1. `localeText` and `enableRtl` are both `@initial`-only GridOptions

`dist/types/core/entities/gridOptions.d.ts`:

```ts
/**
 * A map of key->value pairs for localising text within the grid.
 * @initial
 */
localeText?: { ... };

/**
 * Set to `true` to operate the grid in RTL (Right to Left) mode.
 * @default false
 * @initial
 */
enableRtl?: boolean;
```

`dist/types/core/propertyKeys.d.ts` — the canonical list AG Grid itself uses to
classify every `GridOptions` key as either dynamically updatable or
initial-only — includes both:

```ts
export declare const INITIAL_GRID_OPTION_KEYS: {
  ...
  localeText: boolean;
  ...
  enableRtl: boolean;
  ...
  getLocaleText: boolean; // the callback alternative to localeText is ALSO initial-only
  ...
};
```

## 2. What actually happens when you call `setGridOption()` on an initial key anyway

`dist/package/main.cjs.js`, inside `GridOptionsService.updateGridOptions()`
(the method backing `gridApi.setGridOption()`):

```js
updateGridOptions({ options, force, source = "api" }) {
  const changeSet = { id: _GridOptionsService.changeSetId++, properties: [] };
  const events = [];
  Object.entries(options).forEach(([key, value]) => {
    if (source === "api" && INITIAL_GRID_OPTION_KEYS[key]) {
      _warnOnce(`${key} is an initial property and cannot be updated.`);
    }
    const coercedValue = getCoercedValue(key, value);
    const shouldForce = force || typeof coercedValue === "object" && source === "api";
    const previousValue = this.gridOptions[key];
    if (shouldForce || previousValue !== coercedValue) {
      this.gridOptions[key] = coercedValue;
      const event = { type: key, currentValue: coercedValue, previousValue, changeSet, source };
      events.push(event);
    }
  });
  ...
  events.forEach((event) => { ...; this.propertyEventService.dispatchEvent(event); });
}
```

Note the warning does **not** `return` early — `this.gridOptions[key]` is still
overwritten and a property-changed event is still dispatched. The reason
nothing visibly changes (confirmed empirically in `output.txt`, TESTs 1–2) is
that no downstream feature/component subscribes to change events for these two
specific keys — headers, the RTL layout classes, and the overlay/locale text
renderers all read `gridOptions.enableRtl` / the locale map **once**, during
their own initialization, not reactively. The stored value silently goes
stale until the grid is torn down and recreated.

## 3. `stopEditing()`'s documented contract

`dist/types/core/api/gridApi.d.ts`:

```ts
/** If a cell is editing, it stops the editing. Pass `true` if you want to
 *  cancel the editing (i.e. don't accept changes). */
stopEditing(cancel?: boolean): void;
```

`stopEditing(false)` (or no argument) commits the in-progress edit into the
row's data before returning; `stopEditing(true)` discards it. Calling plain
`api.destroy()` does not itself route through this commit path (see
`output.txt`, TEST 4a vs 4b): a bare `destroy()` while a cell is being edited
does not commit or otherwise surface the in-progress edit — the row model
simply reflects whatever the external `rowData` prop already held. Only an
explicit `stopEditing(false)` call before `getState()`/`destroy()` reliably
flushes it into `rowNode.data` so the caller can read it back out (necessary
because "recreation" in `DataGrid.tsx`'s pattern rebuilds from the external
`rowData` array, not from the outgoing grid instance's live row nodes).

## How to reproduce

```bash
npm install ag-grid-community@32.3.9 jsdom
node prototype.mjs
```

`output.txt` in this folder is the captured stdout from exactly this
`prototype.mjs`, run against `ag-grid-community@32.3.9` fetched from the
public npm registry.

## Known harness limitation (only `scroll` remains open)

After the review-5274566894 fixes (correct `GridState` field names —
`columnSizingModel` not `columnSizingState`, `focusedCell` not `focus` — a
real filter type on the `part` column, `pagination: true` plus a deliberate
non-default page, and an `await` after each `requestAnimationFrame`-deferred
grid operation), `columnSizing`, `filter`, `pagination`, and `focusedCell` all
now capture and restore **real, non-default values** in this headless jsdom
harness (see `output.txt`, TEST 3) — none of these remain an open item.

`scroll` is the one field that genuinely could not be exercised here:
`GridStateService.getScrollState()`/its cached-state entry only updates on a
real `bodyScrollEnd` event fired against an actual scrollable viewport with
real pixel dimensions, which jsdom does not provide. `scroll` is a documented
member of `GridState` (`dist/types/core/interfaces/gridState.d.ts`) returned
by `getState()` and accepted by `initialState`, restored through the exact
same `initialState` mechanism proven to work for the other state slices in
TEST 3 — but this specific sub-case needs a real-browser (e.g. Playwright)
check before the grid ticket relies on it, since it is the one piece this
harness could not directly observe.
