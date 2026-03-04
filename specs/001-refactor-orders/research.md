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

## Decision 5: VIN-based edit restrictions across sheets

- Decision: Use VIN mismatch only as the restriction key, enforce mixed-VIN edit blocking across all grid sheets that support form editing, and keep save-first confirmation for cross-tab switches.
- Rationale: Prevents invalid multi-vehicle edits consistently while preserving intended workflow flexibility.
- Alternatives considered:
  - VIN-or-model lock (stricter but rejected by clarification).
  - Cross-tab-only restriction without per-sheet edit blocking (allows bypass in same sheet).
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

## Decision 9: Blank VIN treatment in mixed-selection gating

- Decision: Treat blank VIN as a distinct VIN value; blank + non-blank selections are considered mixed and blocked from form opening.
- Rationale: Prevents accidental edit mixing between incomplete and identified vehicle records.
- Alternatives considered:
  - Ignore blank VIN in uniqueness checks (creates bypass risk).
  - Always block any selection containing a blank VIN (too restrictive for single-blank edit use cases).

## Decision 10: Form-open entry-point enforcement

- Decision: Apply mixed-VIN block to all form-opening entry points (icon, keyboard shortcut, row triggers, equivalent edit affordances).
- Rationale: Ensures users cannot bypass business constraints through alternate interaction paths.
- Alternatives considered:
  - Icon-only blocking (inconsistent and bypassable).
  - Partial entry-point coverage (complex and error-prone).

## Decision 11: Accessible blocked-action guidance

- Decision: Show blocked-action explanation on both hover and keyboard focus.
- Rationale: Meets constitution accessibility requirements and gives consistent guidance for pointer and keyboard users.
- Alternatives considered:
  - Hover-only tooltip (fails keyboard parity).
  - Static page text only (insufficiently contextual).

## Decision 12: VIN normalization for uniqueness checks

- Decision: Normalize VIN values (trim + case-insensitive) before mixed-selection uniqueness checks.
- Rationale: Avoids false mismatches caused by formatting noise while preserving strict identity semantics.
- Alternatives considered:
  - Exact string comparison (false blocks with whitespace/case variance).
  - Trim-only normalization (still case-fragile).

## Clarification Resolution Status

All planning-stage clarification points are resolved for this feature. No open clarification markers remain.
