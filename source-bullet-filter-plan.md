# Source Bullet Filter for Global Search Toolbar

Add a bullet (dot) filter to the global search toolbar that filters rows by their SOURCE
column, following the same pattern as the Main Sheet's part-status bullet filter.

> **Revision 2 (2026-09-21).** This plan was reviewed against the live code and debated with
> an external reviewer (OpenAI Codex, read-only). The debate changed the filtering layer,
> added dot-availability handling, resolved a self-contradiction in the styling spec, and
> expanded the verification plan. A summary of what changed and what was rejected is in
> [Debate Outcomes](#debate-outcomes) at the end.

## Background

The Main Sheet toolbar ([MainSheetToolbar.tsx](file:///d:/projects/pendingsystem/src/components/main-sheet/MainSheetToolbar.tsx#L321-L362))
already has a row of colored dot buttons that filter the grid by `partStatus`. Each dot uses
the status color, shows an active ring when selected, and has a "Clear" link to reset.

The global search already has:

- A `SOURCE` column ([GridConfig.tsx:L459-L494](file:///d:/projects/pendingsystem/src/components/shared/GridConfig.tsx#L459-L494))
  with color-coded badges. Note these are **translucent tints** (`bg-*-500/10` +
  `text-*-400` + `border-*-500/20`), not solid fills.
- Stage badges in the header ([SearchResultsHeader.tsx:L60-L68](file:///d:/projects/pendingsystem/src/components/shared/search/SearchResultsHeader.tsx#L60-L68))
  whose 1.5×1.5 dots use the **solid** `bg-*-500` of the same hue.
- An existing `activeSources` state in the hook
  ([useSearchResultsState.ts:L78](file:///d:/projects/pendingsystem/src/components/shared/search/hooks/useSearchResultsState.ts#L78))
  that is declared but never set — `_setActiveSources` is unused, so the filter at the end of
  the `searchResults` memo is a permanent no-op. It is dead code and is being replaced.

The goal is to add a set of colored bullets to the search toolbar that toggle source-based
filtering. Each bullet's color must match its source's established **hue** (the solid header
dot, not the column's tint).

## Source-to-Color Mapping

| Source | Dot (solid) | Header badge dot | SOURCE column tint |
|---|---|---|---|
| Main Sheet | `bg-indigo-500` | `bg-indigo-500` | `bg-indigo-500/10 text-indigo-400` |
| Orders | `bg-orange-500` | `bg-orange-500` | `bg-orange-500/10 text-orange-400` |
| Booking | `bg-purple-500` | `bg-purple-500` | `bg-purple-500/10 text-purple-400` |
| Call | `bg-blue-500` | `bg-blue-500` | `bg-blue-500/10 text-blue-400` |
| Archive | `bg-slate-500` | `bg-slate-500` | `bg-slate-500/10 text-slate-400` |
| Freeze | `bg-sky-500` | `bg-sky-500` | `bg-sky-500/10 text-sky-400` |

> **✓ RESOLVED DECISION — active-ring treatment.** Option B (thin semantic ring: `ring-1 ring-offset-1 ring-offset-[#141416]` in the source's own `*-400` hue) was chosen by the user and shipped. Full literal class strings are stored in `SEARCH_SOURCES`.


## Proposed Changes

### Hook: useSearchResultsState

#### [MODIFY] [useSearchResultsState.ts](file:///d:/projects/pendingsystem/src/components/shared/search/hooks/useSearchResultsState.ts)

The single most important design decision, and the one the debate changed: **the source filter
is applied in its own layer between `searchResults` and the model filter — not inside
`searchResults`.** Revision 1 put it inside `searchResults`, which would have made the
"No results found" panel misreport a source exclusion as a search-term miss. See
[Debate Outcomes](#debate-outcomes) §1.

The resulting chain, mirroring the existing `modelOptions` / `effectiveSelectedModels`
pattern already in this file:

1. **`searchResults`** — term-matched rows across all six stages, **no source filter**.
   Remove the dead `activeSources` state and its no-op `.filter()`.
2. **`sourceOptions`** — the distinct `sourceType` values present in `searchResults`, i.e.
   computed **before** the source filter is applied. This is what makes the six dots stay
   visible and mutually switchable; deriving them from `counts` or `filteredResults` instead
   would make every other dot vanish the moment one is selected.
3. **`activeSourceFilter: SearchSource | null`** — single-source toggle state (click the same
   dot to deselect, a different dot to switch).
4. **`effectiveSourceFilter`** — `activeSourceFilter` intersected with `sourceOptions` during
   render. This is the key correctness step: if the search term changes so the selected source
   no longer has any rows, the filter is treated as absent for this render rather than
   producing an empty grid. Directly parallel to `effectiveSelectedModels` at
   [L207-L214](file:///d:/projects/pendingsystem/src/components/shared/search/hooks/useSearchResultsState.ts#L207-L214)
   — and, as the comment there explains, it must be a render-time intersection, not an effect,
   or one frame leaks through with new results and a stale filter.
5. **`sourceFilteredResults`** — `searchResults` narrowed by `effectiveSourceFilter`.
6. **`modelOptions`** — derived from `sourceFilteredResults` (**changed**: currently derived
   from `searchResults`). This keeps the existing guarantee that a model chip always matches
   at least one visible row, now *within* the selected source.
7. **`filteredResults`** — `sourceFilteredResults` narrowed by `effectiveSelectedModels`.
   Unchanged downstream.
8. **Cleanup effect** — clear `activeSourceFilter` once its source disappears from
   `sourceOptions`, mirroring the existing `setSelectedModels` tidy effect. Cosmetic only;
   step 4 is what keeps the data correct.
9. **`handleSourceFilterChange(source)`** — `useCallback`, toggles/switches/clears.
10. **Export** `sourceOptions`, `activeSourceFilter` (the raw value, so an unavailable dot can
    still render as selected-but-disabled if desired), and `handleSourceFilterChange`.

**Filter on `sourceType`, not `stage`.** Rows are spread with both, and every other consumer in
this file (`counts`, `onBadgeNavigate`, `SOURCE_TO_STAGE`) keys on `sourceType`.

**Invariant preserved.** Because `effectiveSourceFilter` can never select an absent source,
`filteredResults` is still empty only when `searchResults` is. The invariant comment above the
grid in `SearchResultsView.tsx` therefore stays true — but it must be **extended** to mention
the source layer, since its current wording only justifies the model chips.

### Shared source metadata

#### [NEW] `src/components/shared/search/searchSources.ts`

A single `SEARCH_SOURCES` constant — source label + solid dot class (+ ring class once the
open decision is settled) — plus a `SearchSource` union type derived from it with `as const`.

Consumed by **`SearchToolbar`** and **`SearchResultsHeader`** (replacing that file's inline
`cn` object). This keeps the plan's own requirement — dots must match the established scheme —
from drifting the first time a color is adjusted.

Deliberately **out of scope**: folding `SOURCE_TO_STAGE` / `SOURCE_TO_ROUTE` or the
`GridConfig` SOURCE renderer's tint chain into the same constant. Those are separate mappings
(identity→route, and a different shade family), and pulling them in widens the diff for no
behavioral gain. Noted as an optional follow-up.

### Toolbar UI: SearchToolbar

#### [MODIFY] [SearchToolbar.tsx](file:///d:/projects/pendingsystem/src/components/shared/search/SearchToolbar.tsx)

Insert the bullet group **after the Update Status dropdown and its existing
`w-px h-6 bg-white/10 mx-1` divider, immediately before the `RowValueFilter`** — i.e. sharing
that divider, exactly as Main Sheet places its dots. No new divider.

1. **New props**: `sourceOptions: SearchSource[]`, `activeSourceFilter: SearchSource | null`,
   `onSourceFilterChange: (source: SearchSource | null) => void`.
2. **Render one dot per entry in `SEARCH_SOURCES`**, iterating the constant (stable order)
   rather than `sourceOptions` (so the row does not reflow as results change):
   - Solid `bg-*-500` from the shared constant.
   - Active: per the open decision above.
   - Inactive but available: `opacity-40 grayscale-[0.5]`, restored on hover.
   - **Not present in `sourceOptions`: rendered disabled** (`disabled`, `opacity-20`,
     `cursor-default`, no hover) — mirroring how `SearchResultsHeader` disables a zero-count
     badge. A dot that cannot change anything must not look clickable.
   - Tooltip with the source name.
3. **Accessibility** (not inherited from Main Sheet, which lacks it): each dot is a native
   `<button type="button">` with `aria-label={source}` and `aria-pressed={isActive}`, and a
   visible keyboard focus treatment. A tooltip alone conveys neither the name nor the toggle
   state to assistive tech.
4. **Clear button** — text link, rendered only when a filter is active, same styling as Main
   Sheet's.

### Parent: SearchResultsView

#### [MODIFY] [SearchResultsView.tsx](file:///d:/projects/pendingsystem/src/components/shared/SearchResultsView.tsx)

1. Pass `sourceOptions`, `activeSourceFilter` and `handleSourceFilterChange` through to
   `SearchToolbar`.
2. **Extend the invariant comment above the grid** so it accounts for the new source layer
   (see the hook section). Leaving it as-is would leave a comment that reads as a complete
   argument while covering only two thirds of the pipeline.

## Behavioral Consequences (explicit, per the Refactor Safety Rule)

Everything below already reads `filteredResults` and will therefore narrow while a source
filter is active. This is intended and matches how the existing model filter behaves — but it
is stated here so it is an accepted consequence rather than a surprise in review:

| Consumer | Effect |
|---|---|
| `counts` → header source badges | Collapse to the selected source; `counts` keys off `filteredResults` in both branches, so non-selected sources have no entry at all and their badges disappear from the header rather than showing a zero (the zero-seeding path only runs for the row-*selection* case, a different condition) |
| `resultsCount` in the header | Reports the narrowed count |
| `handleExtract` → XLSX export | Exports **only** the filtered rows (consistent with the existing "exports only the filtered rows" test) |
| `onBadgeNavigate` | Hands the destination page only the narrowed id set |
| `handleDisplayedRowsChanged` | Deselects rows hidden by the filter; `selectedRows`, master-checkbox tri-state, `isSameSource` and `disabledReason` all recompute |

No stage-mutation path changes. The release gate, freeze guards and draft-session behavior are
untouched — the filter never reaches a mutation, only the rows presented to one.

## Data Flow

```text
useSearchResultsState
  ├── searchResults          ← term match across 6 stages (NO source filter)
  ├── sourceOptions          ← distinct sourceType in searchResults  (drives dot availability)
  ├── activeSourceFilter     ← SearchSource | null (state)
  ├── effectiveSourceFilter  ← activeSourceFilter ∩ sourceOptions (render-time)
  ├── sourceFilteredResults  ← searchResults narrowed by effectiveSourceFilter
  ├── modelOptions           ← derived from sourceFilteredResults
  └── filteredResults        ← sourceFilteredResults narrowed by effectiveSelectedModels
       └── grid · counts · resultsCount · export · badge navigation

SearchResultsView
  └── SearchToolbar
       ├── 6 dots from SEARCH_SOURCES; disabled when absent from sourceOptions
       ├── onClick → handleSourceFilterChange(source)   (same = clear, other = switch)
       └── Clear   → handleSourceFilterChange(null)
```

## Files Modified

| File | Change |
|---|---|
| `src/components/shared/search/searchSources.ts` | **NEW** — `SEARCH_SOURCES` constant + `SearchSource` union |
| `src/components/shared/search/hooks/useSearchResultsState.ts` | Remove dead `activeSources`; add source-filter layer (`sourceOptions`, `activeSourceFilter`, `effectiveSourceFilter`, `sourceFilteredResults`); re-base `modelOptions` on `sourceFilteredResults`; export the new values |
| `src/components/shared/search/SearchToolbar.tsx` | Source bullet group with availability, a11y and Clear |
| `src/components/shared/search/SearchResultsHeader.tsx` | Consume `SEARCH_SOURCES` instead of the inline color map (no visual change) |
| `src/components/shared/SearchResultsView.tsx` | Wire new props; extend the invariant comment |
| `src/test/SearchResultsView.test.tsx` | New `describe("source filter")` block |

## Verification Plan

### Gates (repo order — CLAUDE.md:19)

```
pnpm run lint          # Biome check (read-only)
pnpm run type-check    # tsc --noEmit
pnpm run test          # Vitest
pnpm run build         # takes several minutes
```

### New tests — `describe("source filter")`

Model on the existing `describe("car model filter")` block at
[SearchResultsView.test.tsx:656-782](file:///d:/projects/pendingsystem/src/test/SearchResultsView.test.tsx#L656-L782).

1. Renders one dot per source; dots for sources absent from the current results are disabled.
2. Selecting a source narrows grid rows, `resultsCount`, and the header badges.
3. Clicking the active dot clears; clicking another switches.
4. "Clear" resets.
5. Export writes **only** the filtered rows.
6. **Source + model interaction**: select a model, then switch source — the now-stale model
   chip is dropped without a frame of empty grid (exercises the `effectiveSelectedModels`
   render-time intersection against a `modelOptions` set that now moves with the source).
7. **Stale-filter self-heal**: with a source selected, change the search term to one that
   matches no rows in that source — results fall back to unfiltered rather than rendering the
   empty panel (exercises `effectiveSourceFilter`).
8. **Selection pruning**: select rows across two sources, then filter to one — assert
   `selectedRows` count, master-checkbox state, and that bulk actions are no longer enabled
   against hidden rows.

### Manual verification

- Six dots in the toolbar; dot hues match the header badge dots (not the column's tints).
- Toggle / switch / Clear behave as specified.
- Car model filter still composes on top of the source filter.
- Keyboard: dots are tabbable, `aria-pressed` flips, focus is visible.

### Documentation

`docs/` is a gitignored local Obsidian vault and currently has no `features/` directory in this
checkout. Per CLAUDE.md, search the vault for existing global-search notes before implementing,
and write/patch the relevant note afterwards via the `obsidian` MCP tools. If the vault is
unavailable in the implementing session, say so rather than silently skipping the step.

---

## Debate Outcomes

External read-only review by Codex, plus a direct re-read of the code. **Caveat:** Codex's
sandbox blocked its file reads (`exec_command … blocked by policy`), so it ruled on supplied
excerpts, not the repo. Every ruling adopted below was re-verified against the actual source
before being written into this plan.

### Adopted

1. **Filter layer moved out of `searchResults`.** Revision 1 filtered inside that memo, which
   routed a source exclusion into the "We couldn't find any records matching *term*" panel
   with a "Clear Search Input" button — wrong message, wrong remedy. Correction to the
   original review framing: this did **not** technically falsify the invariant comment (model
   options were derived from the same filtered set, so `filteredResults` empty still implied
   `searchResults` empty). The defect was the *message*, not the invariant. The chosen fix —
   a separate layer plus `effectiveSourceFilter` — makes the bad state unreachable rather than
   merely relabeling it.
2. **Dot availability must be computed pre-filter.** The obvious remedy (derive the dots from
   `counts`) is a trap: `counts` reads `filteredResults`, so selecting one source would hide
   the other five and make direct switching impossible. Hence `sourceOptions` off
   `searchResults`.
3. **The styling spec contradicted itself** (colored ring in the table vs. `ring-white` in the
   spec). Now an explicit open decision rather than an ambiguity for the implementer.
4. **Downstream narrowing stated explicitly** — export, header counts, badge navigation.
5. **Tests are required, not optional.** Eight cases above, including the zero-row path: the
   grid is rendered conditionally on `filteredResults.length`, so emptying it **unmounts** the
   grid and fires `handleGridPreDestroyed` — a different path from merely shrinking `rowData`,
   and not covered by the existing model-filter tests.
6. **Gate order corrected** to `lint → type-check → test → build`; revision 1 inverted the
   first two and omitted `build`.
7. **A11y and docs added** — `aria-label`/`aria-pressed` and visible focus (Main Sheet's dots
   have none, so copying it verbatim would propagate the gap), plus the vault check.
8. **Shared constant, scoped.** Correction to the original review framing: there were **two**
   color maps (header + GridConfig), not four — `SOURCE_TO_STAGE`/`SOURCE_TO_ROUTE` map
   identity to route, not to color. So the plan shares one constant between header and toolbar
   and explicitly leaves `GridConfig` alone.

### Considered and rejected

- **Reset the filter whenever the search term changes.** Unnecessary once
  `effectiveSourceFilter` self-heals; a deliberately chosen source legitimately constrains
  successive searches. (The view already unmounts on a full search clear —
  `MainContentWrapper.tsx:37` — so the filter resets there regardless.)
- **Multi-select sources.** Revision 1's single-select was already explicit and is consistent
  with Main Sheet; the dead `activeSources: string[]` array was never wired to anything and so
  establishes no requirement. The `SearchSource | null` shape is cheap to widen later.
- **Consolidating all source metadata into one constant.** Scope creep; see above.
- **New "no rows for this source" empty-state copy.** Made unreachable by
  `effectiveSourceFilter`; adding it would be dead UI.

### Settled during implementation and review

At the time of the debate above, Codex could not read the repo, so three items were flagged but
left unchecked: `useMemo` dependency arrays around the new state, AG Grid row-identity churn as
`rowData` shrinks, and whether any existing test asserts on toolbar DOM order in a way the
insertion breaks. All three were resolved once the code existed:

- **`useMemo`/`useCallback` dependency arrays** — reviewed in `useSearchResultsState.ts` for the
  new `sourceOptions` / `effectiveSourceFilter` / `sourceFilteredResults` /
  `handleSourceFilterChange` chain; no stale-closure or missing-dependency issue found.
- **Row-identity churn** — the source filter narrows `rowData` the same way the existing model
  filter and AG Grid column filters already do; no new `getRowId` concern, and
  `handleDisplayedRowsChanged` correctly prunes hidden-row selection (covered by a dedicated
  test).
- **Toolbar DOM order** — the bullet group was inserted after the Update Status divider as
  specified; no existing test asserted on toolbar DOM order in a way that broke.

A subsequent local debate-review (Claude main + Codex debate, both high effort) independently
re-verified the shipped implementation end to end and returned verdict **approve** with 0
blocking findings. Two non-blocking findings were raised and fixed: the toolbar test mock was
pre-resolving the deselect-on-reclick toggle instead of exercising the hook's own toggle branch
(fixed in `SearchResultsView.test.tsx`), and this document's Behavioral Consequences table (line
159, above) understated how far the header badges collapse (fixed above).
