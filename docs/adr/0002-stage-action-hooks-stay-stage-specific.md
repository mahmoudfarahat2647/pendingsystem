# Stage action-handler and modal-state hooks stay stage-specific — no shared generic hook

**Status:** accepted
**Originally recorded:** 2026-09-05, as `FINDING_STAGE_EXTRACTION_REUSE.md` on a since-abandoned
branch (`refactor/archive-extraction-pattern`); recovered and formalized as an ADR 2026-09-17
when that branch was pruned. Its actual code (the archive extraction itself, issue #182) had
already landed on `main` through a separate merge; only this decision record was at risk of
being lost.

## Context

Booking (#175–#178) established a four-part extraction shape for a stage page: an
action-handler hook (`use<Stage>PageActions.ts`), a modal-state hook (`use<Stage>Modals.ts`), a
toolbar component, and the shared `ReorderReasonDialog`. As each further stage adopted the
shape — Call List (#180), Main Sheet, and finally Archive (#182, the fourth and last adopter) —
the question was whether the *hooks* (not the already-shared dialog and command builders) had
converged enough to warrant one generic `useStageActions(stage, { builders, messages })` /
`useStageModals()` instead of four near-identical siblings.

A revisit trigger was set at n=2 (Booking vs. Call List): adopt a shared generic hook once all
stages differ *only* by the stage enum literal and the stage noun inside otherwise-identical
toast copy — i.e. once the builder set, completion ordering, and `onComplete`/guard shape are
identical across every stage.

## Decision

**Keep the hooks stage-specific.** No shared generic hook was introduced, at n=2 or at n=4.

## Evidence

### What is genuinely identical across stages (plumbing)

- Param object shape: `{ applyCommand, effectiveRows, selectedRows, setSelectedRows }`.
- `handleUpdateOrder`: identical body — `applyCommand({ type: "patchRow", … })` with
  `previousValues: {}`, returns `Promise.resolve()`. Only the stage string literal differs.
- `handleSendToArchive`: identical body — `ids.flatMap` row resolution (drops unknown ids),
  then `for (const cmd of buildSendToArchiveCommands(rows, reason, <stage>)) applyCommand(cmd)`.
- `handleUpdatePartStatus`: identical — empty-selection guard, `forEach` patch via
  `handleUpdateOrder`, success toast. (Orders' version is unrelated — it also does VIN
  auto-move to Call List.)

That's roughly 40% of each hook by line count.

### What differs, and is load-bearing

| Axis | Booking | Call List | Archive |
|---|---|---|---|
| Stage literal | `"booking"` (typed enum member, ~6 occurrences) | `"call"` | `"archive"` |
| Reorder builder | `buildReorderCommands(rows, "booking", reason)` | `buildReorderCommands(rows, "call", reason)` | same shape, own stage |
| "Calendar" action | `buildRebookingCommands` (reschedule in place) | `buildBookingCommands` (send **to** Booking) | n/a |
| Handler count | 6 | 7 — adds `handleDelete` empty-selection **gate** with its own `toast.error(...)`, kept even though the button is also `disabled` | 6, no delete gate — guarded solely by `disabled={selectedRows.length === 0}` |
| Delete toast copy | "Booking(s) deleted" | "Row(s) deleted" | "Archived record(s) deleted" |
| `ConfirmDialog` copy | generic | generic | own `title="Delete Archived Records"`, `confirmText="Permanently Delete"` |
| `handleConfirmDelete` | takes `onComplete`, calls it last | no `onComplete` (shared `ConfirmDialog` calls `onOpenChange(false)` itself) | same as Call List |
| Completion ordering | reorder: `applyCommand → setSelectedRows → onComplete → toast`; rebooking: `applyCommand → onComplete → setSelectedRows → toast` (not internally consistent) | reorder: `applyCommand → setSelectedRows → onComplete → toast`; delete has no `onComplete` | same as Call List |

`useOrdersPageHandlers` (Orders, pre-pattern, ~525 LOC) is not the same *kind* of object at
all: it owns data (`useOrdersQuery`, `useDraftSession`), local state (`gridApi`,
`selectedRows`, six modal flags), effects (`checkNotifications`, `useSelectedRowsSync`), and
~15 handlers, most Orders-only (Beast-Mode `handleSaveOrder`, `handleCommit`/
`handleConfirmCommit`, `handleSendToCallList`, `handleShareToLogistics`, `handleSetAllRDate`,
bulk attachment, print). It cannot be a client of a generic stage-actions hook without being
decomposed first, and remains out of scope for this decision.

The modal-state hooks tell the same story: near-identical shape (reorder open + reason +
`resetReorder`; one calendar modal; delete confirm), diverging only in which calendar modal
(e.g. `isRebookingModalOpen` vs. `isBookingModalOpen`) and naming.

## Rationale

1. **The divergences are the hard part.** A generic hook would need to be parameterized on the
   stage enum member, three-plus builder functions, roughly six toast message templates,
   per-handler completion ordering, and the per-handler `onComplete` shape (plus the
   `applied`-guard pattern Orders alone uses). That configuration object ends up larger and
   less readable than a ~120-line sibling that is mostly plain `patchRow`-shaped literals.
2. **The reuse that pays off was already extracted at the right seam.** `ReorderReasonDialog`
   (shared, prop-parameterized) and the command builders in `@/lib/orderStageTransitions`
   (pure functions) are where the real duplication lived. What remains in the hooks is shallow
   and stable.
3. **The revisit trigger was checked at n=4 and still failed.** Archive keeps its own delete
   toast copy, its own `ConfirmDialog` copy, and its own guard shape (no empty-selection
   `handleDelete` gate). Since the builder set, toast copy, and guard shape still differ across
   all four hooks, the trigger's condition was never met.
4. **Cost of being wrong is low.** Factoring four ~120-line hooks into one generic hook later,
   if a future stage finally converges, is a mechanical, well-tested refactor. Building the
   abstraction now and discovering it needs more knobs than the siblings it replaces is the
   more expensive mistake.

## Consequences

- `use<Stage>PageActions.ts` and `use<Stage>Modals.ts` are expected to keep being written
  per-stage, by copying and adapting a sibling, not by parameterizing a shared hook. This is
  deliberate, not an oversight — don't "fix" it by introducing the generic hook this ADR
  rejected without new evidence that the divergence axes above have actually converged.
- All four stages (Booking, Call List, Main Sheet, Archive) have now adopted the extraction
  shape. Orders remains the one pre-pattern page and is explicitly out of scope; decomposing
  `useOrdersPageHandlers` is a separate, harder problem this decision does not attempt to
  solve.
- If a fifth stage is ever added, re-run the same check (do builder set, toast copy, and guard
  shape actually match across all hooks this time?) before generalizing — don't assume this
  ADR's "permanently" without re-checking the evidence it was conditioned on.
