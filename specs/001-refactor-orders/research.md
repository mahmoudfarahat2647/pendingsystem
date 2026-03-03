# Research: Orders Tab Validation Refactor

## Decision 1: Keep dual-mode behavior aligned to current app semantics

- Decision: Keep existing internal mode keys (`easy`, `beast`) and map them to the product terminology (Default Mode, Beast/Restriction Mode) in labels and docs.
- Rationale: This avoids broad rename risk in existing state/actions while preserving the requested business behavior.
- Alternatives considered:
  - Rename all internals to `default`/`restrictive` (clearer naming, but higher refactor risk).
  - Introduce a third mode abstraction (unnecessary complexity for current scope).

## Decision 2: Duplicate VIN + part validation scope and timing

- Decision: Enforce VIN + part duplicate checks across all stages and historical records only when VIN is complete; skip this check for partial VIN entries in Default Mode.
- Rationale: Matches clarified requirements and prevents false positives during rush-hour partial entry.
- Alternatives considered:
  - Suffix matching for partial VIN (higher false-positive risk).
  - No VIN duplicate checking in any mode (insufficient integrity in Beast Mode).

## Decision 3: Beast Mode duplicate behavior is hard-blocking

- Decision: In Beast Mode, detected VIN + part duplicates block progression to the next step until resolved.
- Rationale: Beast Mode is the data-integrity gate before workflow advancement.
- Alternatives considered:
  - Warning-only in Beast Mode (insufficient control for strict mode).
  - Role-based override (adds permission complexity not requested).

## Decision 4: Part number description conflict behavior

- Decision: Keep global historical uniqueness for partNumber -> description mapping; in Default Mode show inline red warning under description with one-click copy of the canonical description.
- Rationale: Preserves data integrity while keeping Default Mode fast and recoverable.
- Alternatives considered:
  - Beast-only conflict feedback (too late for user correction).
  - Block immediately in Default Mode (conflicts with permissive rush-entry requirement).

## Decision 5: Cross-tab restriction key uses VIN only

- Decision: Cross-tab edit restriction is triggered by VIN mismatch only (not model mismatch), and users may switch tabs after saving current tab changes.
- Rationale: Explicitly matches clarified behavior and reduces accidental cross-editing without blocking valid workflows.
- Alternatives considered:
  - VIN-or-model lock (stricter but rejected by clarification).
  - Hard lock until cancel/discard (too disruptive).

## Decision 6: Validation data source pattern

- Decision: Use React Query-managed stage datasets plus service-layer historical lookups for cross-stage checks; do not introduce new backend data mirroring in Zustand.
- Rationale: Satisfies constitution state-separation and service-layer principles while keeping checks consistent across tabs/history.
- Alternatives considered:
  - Store all validation data in Zustand (violates constitution principle 1).
  - Component-direct Supabase queries (violates constitution principle 2).

## Decision 7: UI warning/confirmation pattern

- Decision: Use inline warning text for description conflicts in Default Mode and shared `Dialog`-based warning flow for Beast Mode blockers.
- Rationale: Aligns with constitution UI consistency and accessibility requirements.
- Alternatives considered:
  - Toast-only warnings (easy to miss for field-level correction).
  - Custom modal implementation (disallowed by constitution).

## Decision 8: Testing and verification scope

- Decision: Add/extend unit, component, and e2e coverage for mode rules, duplicate checks, and cross-tab guard behavior; keep pre-merge gates (`lint`, `test`, `build`) mandatory.
- Rationale: Required by constitution and needed to prevent regressions in protected workflows.
- Alternatives considered:
  - Unit-only coverage (insufficient for modal/flow behavior).
  - Manual QA only (not acceptable for merge gate).

## Clarification Resolution Status

All planning-stage clarification points are resolved for this feature. No open clarification markers remain.
