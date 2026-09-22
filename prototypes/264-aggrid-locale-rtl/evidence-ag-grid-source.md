# Source-level evidence (ag-grid-community 32.3.3)

Extracted directly from the `ag-grid-community@32.3.3` package installed from the
public npm registry (the same major/minor pinned in pendingsystem's
`package.json`: `"ag-grid-community": "^32.3.3"`).

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
npm install ag-grid-community@32.3.3 jsdom
node prototype.mjs
```

`output.txt` in this folder is the captured stdout from exactly this
`prototype.mjs`, run against `ag-grid-community@32.3.3` fetched from the
public npm registry.

## Known harness limitation

`columnSizing` (column width) prints as `undefined` in the captured state in
this jsdom-headless harness — `getState()`'s column-sizing snapshot depends on
computed layout (actual rendered widths), which jsdom does not compute the way
a real browser does. This is a limitation of the headless harness, not
evidence about the grid's capability: `columnSizing` is a documented member of
`GridState` (`dist/types/core/interfaces/gridState.d.ts`) returned by
`getState()` and accepted by `initialState`, restored through the exact same
mechanism proven to work for `sort`/`filter`/`columnPinning`/`rowSelection` in
TEST 3. The grid ticket should re-verify this one specific sub-case in a real
browser (e.g. Playwright) before relying on it, since it is the one piece this
harness could not directly observe.
