# Contract: Cross-Tab Edit Guard

## Scope

Defines guard behavior when switching between workflow tabs while editing records tied to VIN values.

## Tab Switch Intent Contract

### Input

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| currentTab | String | Yes | Source tab |
| targetTab | String | Yes | Destination tab |
| currentVin | String \| null | No | VIN for active edit context |
| targetVin | String \| null | No | VIN represented in destination context |
| hasUnsavedChanges | Boolean | Yes | Current tab dirty state |

### Output

| Field | Type | Notes |
|-------|------|-------|
| allowSwitch | Boolean | Final navigation decision |
| reasonCode | `none` \| `vin-mismatch-save-required` | Why guard applied |
| promptMessage | String \| null | User-facing guidance |
| requiredAction | `none` \| `save-first` | Next required user action |

## Rules

1. Guard trigger is VIN mismatch only.
2. VIN mismatch comparison uses normalized VIN values (trim + case-insensitive).
3. Blank VIN is treated as a distinct VIN value during mismatch checks.
4. If VIN mismatch and unsaved changes exist, switch is blocked until current changes are saved.
5. If VIN mismatch and current changes are saved, switch is allowed.
6. User can cancel navigation and remain on current tab at any guard prompt.
7. Prompt must include compared VIN values when available.

## Mixed-VIN Form Open Guard Contract

### Input

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| activeGrid | String | Yes | Current grid sheet where selection exists |
| selectedVins | Array<String \| null> | Yes | VIN values from selected rows |
| openEntryPoint | String | Yes | Icon, keyboard shortcut, row trigger, or equivalent |

### Output

| Field | Type | Notes |
|-------|------|-------|
| allowOpen | Boolean | Whether form open is allowed |
| reasonCode | `none` \| `mixed-vin-selection` | Blocking reason |
| guidanceMessage | String \| null | Disabled-action guidance text |

### Rules

1. Mixed-VIN guard applies in all grid sheets that support form editing.
2. Guard applies to all form-opening entry points.
3. If normalized VIN buckets in selection are greater than one, `allowOpen=false`.
4. Guidance message must state that opening different VINs is not allowed.
5. Guidance must be available on both hover and keyboard focus.

## Non-Goals

1. Model mismatch alone does not trigger this guard.
2. Guard does not alter protected workflow exceptions (direct archive/skip paths).
