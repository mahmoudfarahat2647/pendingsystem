# Contract: Orders Entry Validation

## Scope

Defines the user-facing validation contract for creating/editing orders in Default and Beast modes.

## 1) Submit Order Attempt Contract

### Input

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| mode | `easy` \| `beast` | Yes | Validation strictness |
| orderId | String \| null | No | Present for edits |
| stage | String | Yes | Current workflow stage |
| formData | Object | Yes | Identity + vehicle + requester + company fields |
| parts | Array<PartEntry> | Yes | One or more line items |

### Output

| Field | Type | Notes |
|-------|------|-------|
| decision | `allow` \| `warn` \| `block` | Final action |
| messages | Array<ValidationMessage> | User-facing feedback |
| blockingReasons | Array<String> | Present when `decision=block` |

### Contract Rules

1. In `easy` mode, missing required fields do not block submission.
2. In `beast` mode, required fields must be complete before progression.
3. Duplicate part numbers in the same order always block.
4. VIN+part duplicates in `beast` mode block progression.
5. VIN+part duplicates in `easy` mode do not warn or block.
6. If VIN is partial in `easy` mode, VIN+part duplicate check is skipped.

## 2) VIN + Part Duplicate Check Contract

### Input

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vin | String | Yes | Candidate VIN |
| isCompleteVin | Boolean | Yes | True for full VIN |
| partNumber | String | Yes | Candidate part |
| excludeRowId | String \| null | No | Ignore current edited row |
| mode | `easy` \| `beast` | Yes | Affects enforcement |

### Output

| Field | Type | Notes |
|-------|------|-------|
| duplicateFound | Boolean | Duplicate status |
| matchedLocations | Array<String> | Stage names or history bucket |
| enforcement | `none` \| `warn` \| `block` | Effective mode-specific behavior |

### Contract Rules

1. If `isCompleteVin=false` and `mode=easy`, return `enforcement=none`.
2. If duplicate exists and `mode=beast`, return `enforcement=block`.
3. If duplicate exists and `mode=easy` with complete VIN, return `enforcement=none`.

## 3) Part Description Consistency Contract

### Input

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| partNumber | String | Yes | Normalized key source |
| description | String | Yes | Candidate description |
| mode | `easy` \| `beast` | Yes | Affects enforcement |

### Output

| Field | Type | Notes |
|-------|------|-------|
| conflictFound | Boolean | True if historical mismatch exists |
| canonicalDescription | String \| null | Existing approved value |
| uiAction | `none` \| `inline-warning-copy` \| `block` | UI behavior contract |

### Contract Rules

1. Description checks use historical records (system-wide scope).
2. In `easy` mode conflict => `uiAction=inline-warning-copy`.
3. In `beast` mode conflict => `uiAction=block`.
4. `inline-warning-copy` must expose one-click apply of canonical description.

## 4) Company Field Contract

### Allowed Values

`company IN { "Zeekr", "Renalt" }`

### Rules

1. `pendingsystem` must not appear as a selectable value.
2. Beast mode progression requires company to be non-empty and in allowed set.

## 5) Requester Field Contract

### Rules

1. Requester input uses a person/name icon (not location).
2. Field help/tooltip text must communicate requester-name intent.

## 6) Mixed-VIN Edit Eligibility Contract

### Input

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| selectedRows | Array<RowRef> | Yes | Current grid selection |
| entryPoint | String | Yes | Icon, keyboard shortcut, row trigger, or equivalent |

### Output

| Field | Type | Notes |
|-------|------|-------|
| canOpenForm | Boolean | Final edit-open decision |
| reasonCode | `none` \| `mixed-vin-selection` | Blocking reason |
| guidanceMessage | String \| null | Disabled-action guidance text |

### Contract Rules

1. VIN comparison uses normalized values (trimmed and case-insensitive).
2. Blank VIN is treated as a distinct VIN value.
3. If more than one VIN bucket is present in selection, return `canOpenForm=false`.
4. Mixed-VIN block must be enforced for all form-opening entry points.
5. When blocked, `guidanceMessage` must explain that opening different VINs is not allowed.
6. Guidance must be available for both hover and keyboard focus states.
