# Data Model: Orders Tab Validation Refactor

## Entity: OrderRecord (Persisted)

Represents one persisted order row in the workflow dataset.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID string | Yes | Primary identifier |
| stage | Enum | Yes | `orders`, `main`, `call`, `booking`, `archive` |
| orderNumber | String | No | Tracking identifier (`trackingId`) |
| customerName | String | Yes in Beast Mode | Required at strict progression gate |
| customerPhone | String | Yes in Beast Mode | Required at strict progression gate |
| vin | String | Yes in Beast Mode | May be partial in Default Mode |
| company | Enum | Yes in Beast Mode | Allowed values: `Zeekr`, `Renalt` |
| metadata | Object | Yes | Extended order form data |
| createdAt | ISO datetime | Yes | Audit timestamp |
| updatedAt | ISO datetime | Yes | Audit timestamp |

## Entity: OrderMetadata (Persisted inside order metadata)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| model | String | Yes in Beast Mode | Auto-detect may prefill |
| cntrRdg | Number | Yes in Beast Mode | Odometer reading |
| repairSystem | String | Yes in Beast Mode | Includes warranty branch rules |
| startWarranty | Date string | Conditional | Used when warranty flow applies |
| requester | String | Yes in Beast Mode | Name field with person icon |
| sabNumber | String | Yes in Beast Mode | Business-required in strict mode |
| acceptedBy | String | Yes in Beast Mode | Agent name |
| parts | PartEntry[] | Yes | One or more part lines |
| partNumber (legacy) | String | Derived | Mirrors first `parts` entry |
| description (legacy) | String | Derived | Mirrors first `parts` entry |
| reminder | Reminder | No | Optional reminder details |

## Entity: PartEntry

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | String | Yes | Client-side row identifier |
| partNumber | String | Yes | Normalized for duplicate checks |
| description | String | Yes | Checked against canonical history |
| rowId | String | No | Existing row reference during edits |

## Entity: ValidationModeState (UI State)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| mode | Enum | Yes | `easy` (Default), `beast` (Restriction) |
| beastModeTimerSeconds | Number \| null | No | Countdown when strict mode is triggered |
| fieldErrors | Set<string> | No | Strict-mode missing-field indicators |

## Entity: DuplicateCheckResult (Derived, not persisted)

| Field | Type | Notes |
|-------|------|-------|
| checkType | Enum | `vinPartDuplicate`, `descriptionConflict`, `duplicatePartInOrder` |
| severity | Enum | `warning` or `blocking` |
| location | String \| null | Stage name/source when applicable |
| canonicalDescription | String \| null | Existing approved description |
| copyActionAvailable | Boolean | True for description conflicts in Default Mode |

## Entity: CrossTabEditContext (Derived)

| Field | Type | Notes |
|-------|------|-------|
| currentTab | String | Active stage tab |
| currentVin | String \| null | VIN of edited record(s) |
| targetTab | String | Destination stage tab |
| targetVin | String \| null | VIN of selected target record(s) |
| hasUnsavedChanges | Boolean | Save-first gating condition |
| requiresSaveFirst | Boolean | True when VIN mismatch is detected |

## Entity: EditEligibilityState (Derived)

Represents whether the order form may be opened from the current grid selection.

| Field | Type | Notes |
|-------|------|-------|
| selectedRowCount | Number | Current selected rows in active grid |
| normalizedVinSet | Set<String> | Trimmed, case-insensitive VIN values from selection |
| hasBlankVin | Boolean | True when one or more selected rows have blank VIN |
| isMixedVinSelection | Boolean | True when selection contains more than one VIN bucket (blank is its own bucket) |
| canOpenFormEdit | Boolean | False when mixed-VIN block applies |
| blockReasonCode | Enum | `none` \| `mixed-vin-selection` |
| blockGuidanceMessage | String \| null | Tooltip message shown on blocked action |

## Relationships

- OrderRecord 1 -> N PartEntry (through `metadata.parts` and legacy mirror fields).
- OrderRecord 1 -> 0..N Reminder records (via related reminder table).
- PartEntry N -> 1 PartNumberDescriptionMapping (logical global map keyed by normalized part number).

## Identity and Uniqueness Rules

1. Composite duplicate key: normalized `VIN + partNumber`.
2. VIN+part duplicate enforcement:
   - Default Mode: silent/non-blocking behavior; partial VIN entries skip VIN+part duplicate checks.
   - Beast Mode: duplicate blocks progression.
3. Part description consistency: one canonical description per normalized part number across historical data.
4. Intra-order uniqueness: duplicate part numbers within the same order are not allowed.
5. Mixed-selection edit gating uses normalized VIN uniqueness (trim + case-insensitive).
6. Blank VIN is treated as a distinct VIN bucket in mixed-selection gating.

## Lifecycle and State Transitions

### Workflow stage transitions

- Standard: `orders -> main -> call -> booking -> archive`.
- Protected exceptions remain supported (per constitution):
  - `orders -> call` for pre-confirmed availability.
  - Any stage -> `archive` for cancellation.

### Validation mode transitions

- `easy -> beast`: on strict progression attempt or beast trigger.
- `beast -> easy`: after timer expiry or user returns to permissive flow.
- Beast progression gate: blocked when required fields or blocking duplicate validations fail.

### Edit-eligibility transitions

- `canOpenFormEdit=true -> false`: when active grid selection changes from one VIN bucket to mixed VIN buckets.
- `canOpenFormEdit=false -> true`: when selection resolves to a single VIN bucket.
- Mixed-VIN blocked state applies to all form-open entry points in supported grid sheets.

## Validation Matrix by Mode

| Rule | Default Mode (`easy`) | Beast Mode (`beast`) |
|------|------------------------|----------------------|
| Full required fields | Not enforced | Enforced (blocking) |
| Partial VIN allowed | Yes | No (must satisfy strict validation) |
| VIN+part duplicate (complete VIN) | Silent / non-blocking | Blocking |
| VIN+part duplicate (partial VIN) | Skipped | Not applicable (strict VIN expected) |
| Part number description conflict | Inline red warning + copy action | Blocking until resolved |
| Duplicate part number in same order | Blocking | Blocking |
| Cross-tab VIN mismatch editing | Save-first guard | Save-first guard |

## Scale Assumptions

- Validation checks operate across five active stage tabs and historical order records.
- Expected operational scale is internal-service-center volume (hundreds of active rows per stage, growing archive).
- Duplicate/conflict checks should remain near-instant for user actions (sub-second feedback target in strict mode).
