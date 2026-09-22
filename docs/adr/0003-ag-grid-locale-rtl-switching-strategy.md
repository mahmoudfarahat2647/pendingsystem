# AG Grid locale text and RTL direction require full grid recreation, not a live update

**Status:** accepted (spike finding — no production code shipped from this ticket)
**Recorded:** 2026-09-22, issue #264 ("Spike: AG Grid locale and direction switching strategy"),
Wave 1 of the Arabic-localization rollout (parent #255).

## Context

Issue #255's review clarification 3 ("AG Grid requires a state-preserving switching strategy")
deliberately left open whether the grid localization ticket can update `localeText` and
reading direction on a *mounted* grid, or must destroy and recreate it — and said to check the
installed AG Grid APIs rather than assume. `pendingsystem` pins `ag-grid-community` /
`ag-grid-react` at `^32.3.3` (`package.json`). This ticket's whole scope is to answer that
question empirically against that exact version, and — since it forks the grid ticket's
implementation shape — to specify the state-capture/restore contract if recreation turns out
to be required.

The grid wrapper in question is `src/components/grid/DataGrid.tsx`
(re-exported dynamically as `src/components/grid/DynamicDataGrid.tsx`), which every stage grid
uses via a `gridStateKey`. It does not currently set `localeText` or `enableRtl` at all (grep
confirmed: no occurrence of either, or of `setGridOption`, anywhere in `src/`). It already has a
column/sort/filter/selection/pagination persistence pipeline: `handleSaveState()` calls
`api.getState()`, writes it *synchronously* into an in-memory live-state store
(`useLiveGridStore.setLiveGridState`), and separately schedules a **500ms debounced** write to
the durable Zustand-persisted store (`saveGridState`) — clearing the live snapshot once that
durable write lands. Restoration on (re)mount reads `getGridState(gridStateKey) ??
getDefaultLayout(gridStateKey)` into the `initialState` prop passed to `<AgGridReact>`.

## Method

A throwaway prototype (retained at
[`prototype/264-aggrid-locale-rtl`](../../../../tree/prototype/264-aggrid-locale-rtl),
folder `prototypes/264-aggrid-locale-rtl/`) drove `ag-grid-community@32.3.3` — installed fresh
from the public npm registry in an isolated scratch directory, since this repo's own
`pnpm install` currently fails for an unrelated reason (`xlsx` is pinned to a direct
`cdn.sheetjs.com` tarball URL not reachable from every environment) — headlessly via jsdom and
`createGrid` (no React needed for the grid-core questions this spike is about). Findings below
combine that runtime evidence with source-level evidence from the same package version's own
shipped type declarations and `GridOptionsService` implementation (see
`prototypes/264-aggrid-locale-rtl/evidence-ag-grid-source.md` for exact excerpts).

## Findings

### 1. `localeText` cannot be live-updated — empirically confirmed, `@initial` in v32.3.3

`ag-grid-community@32.3.3`'s own `gridOptions.d.ts` tags `localeText` (and the callback
alternative, `getLocaleText`) `@initial`, and both are listed in the package's own
`INITIAL_GRID_OPTION_KEYS` (`propertyKeys.d.ts`) — the exact table AG Grid uses internally to
decide whether a `GridOptions` key may be changed after grid creation.

Calling `gridApi.setGridOption('localeText', {...})` on a live grid:
- Logs `AG Grid: localeText is an initial property and cannot be updated.`
- Has **no visible effect** — confirmed by forcing the no-rows overlay before and after the
  call: the overlay text does not change (prototype TEST 1).

Source inspection (`GridOptionsService.updateGridOptions()`) explains *why* it's silent rather
than throwing: the warning does not stop execution — `gridOptions.localeText` is still
overwritten internally and a property-changed event still fires — but no downstream
feature/renderer subscribes to that event for this key; every consumer reads the locale map
once, at its own construction time.

### 2. `enableRtl` cannot be live-updated either — same mechanism

`enableRtl` carries the identical `@initial` tag and is in the same
`INITIAL_GRID_OPTION_KEYS` table. Calling `gridApi.setGridOption('enableRtl', true)` on a live
grid logs `AG Grid: enableRtl is an initial property and cannot be updated.` and the grid's
`.ag-root-wrapper` element keeps its `ag-ltr` class — `ag-rtl` never appears (prototype TEST 2).
There is no separate "live RTL toggle" API in this version; `enableRtl` is the only mechanism,
and it is construction-time only.

**This directly answers #255's clarification 3: both halves of "locale text and direction" on
AG Grid 32 require full grid recreation. There is no live-update path for either in the
installed version.**

### 3. Recreation state-capture/restore shape (confirmed working via AG Grid's own `getState()`/`initialState`)

Prototype TEST 3 drove a live grid through a representative mutation set (sort, column move,
resize, pin, select-all, filter, pagination page size), captured `api.getState()`, destroyed
the grid, and recreated it with the opposite `enableRtl`/new `localeText` **and**
`initialState: capturedState`. The restored `api.getState()` matched the captured one exactly
for:

- **Column order** (`columnOrder`)
- **Column pinning** (`columnPinning`)
- **Column sizing** (`columnSizing`) — see caveat below
- **Sort model** (`sort`)
- **Filter model** (`filter`)
- **Row selection** (`rowSelection`, by row id)
- **Pagination** (`pagination` — page + page size)

and the recreated grid's root element correctly carried `ag-rtl`.

**Caveat (harness limitation, not a capability gap):** `columnSizing` printed `undefined` in
this specific headless jsdom run because `getState()`'s width snapshot depends on computed
layout, which jsdom does not render the way a browser does. `columnSizing` is a documented
`GridState` member accepted by both `getState()` and `initialState`, and is restored through
the exact same mechanism proven for the other six pieces above — the grid ticket should
re-confirm this one sub-case in a real browser (e.g. a Playwright pass) before relying on it,
since it's the one piece this harness could not directly exercise.

Two pieces `getState()` did **not** produce in this harness at all — `scroll` and `focus`
(focused cell) — came back `undefined` even after row/column interaction. AG Grid 32.3.3's
`GridState` type does include a `scroll: { top, left }` member; whether it populates reliably
in a real browser (vs. only in this headless harness) is unconfirmed by this spike and should
be checked in the same real-browser pass. Treat scroll/focus restoration as unverified, not as
confirmed-working like the six pieces above.

**State-capture shape for the grid ticket to implement (`DataGrid.tsx`'s
`handleSaveState`/`onGridReadyInternal` already produce exactly this via `api.getState()`):**

| Piece | `GridState` key | Status |
|---|---|---|
| Column order | `columnOrder` | Confirmed |
| Column pinning | `columnPinning` | Confirmed |
| Column visibility | `columnVisibility` | Present in schema; not separately exercised (no hidden column in the test fixture) — low risk, same mechanism as order/pinning |
| Column sizing/width | `columnSizing` | Schema-confirmed; runtime restore unverified in headless harness — verify in a real browser |
| Sort model | `sort` | Confirmed |
| Filter model | `filter` | Confirmed |
| Row selection (by id) | `rowSelection` | Confirmed |
| Pagination (page + size) | `pagination` | Confirmed |
| Scroll position | `scroll` | Present in schema; did not populate in this harness — verify in a real browser |
| Focused cell | `focus` | Present in schema; did not populate in this harness — verify in a real browser |

No custom state shape needs to be invented — `gridApi.getState()` in → `initialState` prop out
is sufficient, which is already exactly what `DataGrid.tsx` does for its existing
column/sort/filter/selection/pagination persistence. The recreation strategy is: capture
`api.getState()` immediately before `destroy()`, then pass it as `initialState` to the new
`<AgGridReact>` mount with the new `localeText`/`enableRtl`.

### 4. Active cell editor: undisturbed by a live-option *attempt*; silently discarded on raw `destroy()`; preservable via explicit `stopEditing(false)`

Prototype TEST 4a/4b:

- While a cell is being edited, calling `gridApi.setGridOption('localeText', …)` (a live-option
  attempt, no recreation) does **not** interrupt or close the editor — `getEditingCells()`
  still reports it open afterward. This matters because the grid ticket's actual switch path
  will call `stopEditing`/destroy, not a no-op `setGridOption`, but it confirms the initial
  property write itself is inert with respect to editing state.
- A bare `api.destroy()` while a cell is being edited does **not** commit the in-progress edit.
  Recreating from the external `rowData` (what React Query's cache / `DataGrid`'s `rowData`
  prop actually holds) shows the original, pre-edit value — the edit is silently discarded, not
  committed and not blocked.
- `gridApi.stopEditing(cancel?: boolean)` is the documented, deliberate flush API
  (`gridApi.d.ts`: *"Pass `true` if you want to cancel the editing (i.e. don't accept
  changes)"* — omitted/`false` commits). Calling `stopEditing(false)` before capturing
  state/destroying commits the edit into `rowNode.data`, which the switching code can then read
  back out if it needs the committed value to seed the recreated grid's `rowData`.

**Implication for the grid ticket:** a locale/direction switch that recreates the grid must
call `gridApi.stopEditing(false)` (commit, not cancel) before capturing `getState()` and
destroying, or an in-progress edit will be silently lost with no error and no warning. This is
not optional cleanup — it's the only way to avoid silent data loss on switch.

### 5. Interaction with the existing 500ms persistence debounce: safe, provided the switch reads the live snapshot, not the durable one

`DataGrid.tsx`'s `handleSaveState()` already writes twice on every layout-affecting event:
synchronously into `useLiveGridStore` (`setLiveGridState`, immediate), and after a 500ms
debounce into the durable Zustand-persisted store (`saveGridState`), clearing the live snapshot
once the durable write lands. Prototype TEST 5 modeled this exactly: a column resize fires both
writes; a recreation is simulated *inside* the 500ms window, before the debounced write
resolves. Reading the **live** (synchronous) snapshot at that moment and passing it as
`initialState` to the recreated grid preserves the resize with zero loss. The durable write, by
contrast, would still be `null`/stale at that instant — reading only the durable store would
lose whatever changed inside the debounce window.

**This is good news and needs no new mechanism**: `DataGrid.tsx` already exposes exactly the
right value (`useLiveGridStore.getLiveGridState(gridStateKey)`, falling back to
`getGridState`/`getDefaultLayout`) to read at switch time. The switch handler must read the
**live** grid state (either directly via `gridApiRef.current.getState()` at switch time, since
the grid is still mounted right up until the switch destroys it, or via the live-state store)
— never wait for or rely on the debounced durable write, and never key off `saveGridState`
alone.

## Decision

**AG Grid 32.3.3 requires full grid recreation for both `localeText` and `enableRtl`/direction
changes.** There is no live-update path for either in this version. The grid localization
ticket should:

1. Centralize translated `localeText` and `enableRtl`/direction in `DataGrid.tsx` (per #255
   clarification 3), computed from the active locale.
2. On a locale switch, for every mounted grid instance:
   a. Call `gridApi.stopEditing(false)` first (commit any in-progress edit — never
      `cancel: true`, and never skip this step).
   b. Capture `gridApi.getState()` **synchronously, at switch time** (not from the debounced
      durable store) — or reuse the existing live-state snapshot in `useLiveGridStore` if it is
      more current, since a layout change can be mid-debounce when the switch happens.
   c. Destroy the grid and remount `<AgGridReact>` with the new `localeText`/`enableRtl` and
      `initialState` set to the captured state.
   d. Do not write the locale-triggered state re-application back into `saveGridState`'s
      "layout dirty" tracking (`setLayoutDirty`/`setPositionLayoutDirty`) — restoring the same
      layout under a new locale/direction is not a user layout change and must not flip the
      dirty flags per #255 clarification 3 ("never persist a locale-only refresh as a user
      layout change").
   e. Keep `field`, `colId`, row ids (`getRowId`), and `gridStateKey` exactly as they are today
      — none of this needs to change for the switch, and changing any of them would be a
      correctness regression, not a localization requirement.
3. Verify `columnSizing`, `scroll`, and `focus` restoration in a real browser (e.g. Playwright)
   before shipping — this spike's headless harness could not exercise those three reliably and
   they are the only unverified pieces of an otherwise-confirmed capture/restore contract.

## Evidence

Primary source: [`prototype/264-aggrid-locale-rtl`](../../../../tree/prototype/264-aggrid-locale-rtl)
branch, folder `prototypes/264-aggrid-locale-rtl/`:
- `prototype.mjs` — the runnable headless harness (5 tests, described above).
- `output.txt` — captured stdout from running it against `ag-grid-community@32.3.3`.
- `evidence-ag-grid-source.md` — exact excerpts from that version's own `gridOptions.d.ts`,
  `propertyKeys.d.ts`, `gridApi.d.ts`, and `GridOptionsService.updateGridOptions()`.
- `README.md` — reproduction steps and a summary of headline findings.

## Consequences

- No production code changed as a result of this ticket. `src/` is untouched on
  `spike/264-aggrid-locale`; the prototype code lives only on `prototype/264-aggrid-locale-rtl`
  and is not merged to `main`.
- The grid localization ticket (successor to this spike) has a concrete, evidence-backed
  implementation shape to build against instead of guessing between a live-update and a
  recreation strategy, and a specific state-capture checklist (with the three still-unverified
  pieces called out) rather than needing to rediscover the AG Grid 32 API surface itself.
- If `pendingsystem` ever upgrades past AG Grid 32, this decision must be re-verified —
  `INITIAL_GRID_OPTION_KEYS` and the `@initial` tagging are version-specific implementation
  details, not a documented permanent AG Grid contract, and later major versions may change
  which properties are dynamically updatable.
