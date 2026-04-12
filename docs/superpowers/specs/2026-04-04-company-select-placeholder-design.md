---
title: Company Select Placeholder Design
date: 2026-04-04
status: implemented
feature: company-select-placeholder
type: spec
---

# Company Select Placeholder Design

## Problem

The Company field in the New Logistics Request form defaults to "Zeekr" on initialization, giving the impression a selection has already been made. Users can submit without consciously choosing a company. The field should behave like Vehicle Model and Repair System — showing an unselected state by default and requiring an explicit choice before submission.

## Goal

- Company field initializes with no pre-selection ("Select Company" placeholder)
- Submitting without a selection shows a "Company is required" validation error
- Selecting Zeekr or Renault and editing an existing order continue to work unchanged

## Approach

Add a disabled placeholder `<option>` to the existing native `<select>`, initialize the form's company value to `""`, and tighten the Zod schema to reject empty strings.

## Changes

### 1. `src/components/orders/form/IdentityFields.tsx`

Prepend a disabled placeholder option as the first child of the `<select>`:

```tsx
<select value={formData.company} onChange={...} ...>
  <option value="" disabled>Select Company</option>
  {/* existing unknown-value guard for legacy edit data */}
  {ALLOWED_COMPANIES.map((company) => (
    <option key={company} value={company}>{company}</option>
  ))}
</select>
```

- `disabled` prevents re-selecting the placeholder after a real choice
- `value={formData.company}` is already controlled — when company is `""` the placeholder renders; when it's `"Zeekr"` or `"Renault"` the real option renders

### 2. `src/schemas/form.schema.ts`

Change the company field schema from defaulting to `DEFAULT_COMPANY` to defaulting to `""` with a required validation:

```ts
// Before
company: z.string().default(DEFAULT_COMPANY).transform(normalizeCompanyName)

// After
company: z
  .string()
  .default("")
  .min(1, "Company is required")
  .transform(normalizeCompanyName)
```

- `.min(1)` fires first when company is `""`, showing "Company is required"
- The existing `isAllowedCompanyName` refinement at the schema level continues to guard against invalid non-empty values
- `DEFAULT_COMPANY` constant in `src/lib/ordersValidationConstants.ts` is left unchanged

### 3. `src/components/orders/form/hooks/useOrderForm/orderFormUtils.ts` — new-order initial state

Line 44 seeds a blank new order form. Change:

```ts
// Before (line 44)
company: DEFAULT_COMPANY,

// After
company: "",
```

Line 27 (`normalizeCompanyName(first.company) || DEFAULT_COMPANY`) is the edit-mode fallback for legacy rows with a missing company — leave it unchanged.

## Validation Error Display

The form already renders field-level errors under Vehicle Model and Repair System. Apply the same pattern under the Company select:

```tsx
{getFieldError("company") && (
  <p className="text-[9px] text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
    {errors.company ?? "Company is required"}
  </p>
)}
```

## Out of Scope

- `DEFAULT_COMPANY` constant in `src/lib/ordersValidationConstants.ts` — not changed; still used as edit-mode fallback in `orderFormUtils.ts:27`
- `EditableSelect` component — not used; native `<select>` retained
- Beast Mode schema — already uses `.min(1)` with no `DEFAULT_COMPANY` default; no change needed

## Verification

1. Open the New Logistics Request form — Company shows "Select Company", not "Zeekr"
2. Fill all other required fields, leave Company empty, click Publish — "Company is required" error appears under Company
3. Select Zeekr or Renault — error clears, submission proceeds normally
4. Open an existing order in edit mode — Company shows the saved value, not the placeholder
5. Run `npm run type-check` and `npm run lint` — no new errors
