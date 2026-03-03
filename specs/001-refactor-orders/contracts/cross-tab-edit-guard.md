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
2. If VIN mismatch and unsaved changes exist, switch is blocked until current changes are saved.
3. If VIN mismatch and current changes are saved, switch is allowed.
4. User can cancel navigation and remain on current tab at any guard prompt.
5. Prompt must include compared VIN values when available.

## Non-Goals

1. Model mismatch alone does not trigger this guard.
2. Guard does not alter protected workflow exceptions (direct archive/skip paths).
