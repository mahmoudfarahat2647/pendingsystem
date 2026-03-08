# Order Tab Form Constitution

## Constitutional Status

This file is the protected governance document for the Orders tab form.

Rules:

- treat this file as immutable unless the user explicitly asks to amend the constitution
- do not casually edit, rewrite, rename, move, or delete this file
- do not change the Orders form behavior in ways that conflict with this file without explicit user approval
- if implementation and this file diverge, stop and ask whether the code should be fixed or the constitution should be amended
- new documentation may reference this file, but must not silently override it

This document describes the current behavior of the order form used in the Orders tab. Treat it as the implementation reference before changing the form, its validation rules, or its save flow.

## Purpose

The form is intentionally split between:

- fast draft entry for day-to-day order creation and editing
- strict validation during the external commit workflow
- duplicate protection for VIN + part combinations
- batch-safe editing when multiple rows are selected

If a future change weakens any of those guarantees, it is a regression unless the workflow itself is being deliberately redesigned.

## Authoritative source files

These files define the current behavior:

- `src/components/orders/form/OrderFormModal.tsx`
- `src/components/orders/form/hooks/useOrderForm.ts`
- `src/components/orders/form/IdentityFields.tsx`
- `src/components/orders/form/PartsSection.tsx`
- `src/components/orders/form/FormHeader.tsx`
- `src/components/orders/form/FormFooter.tsx`
- `src/components/orders/form/types.ts`
- `src/schemas/form.schema.ts`
- `src/lib/orderWorkflow.ts`
- `src/lib/ordersValidationConstants.ts`
- `src/app/(app)/orders/useOrdersPageHandlers.ts`
- `src/services/orderService.ts`

## Architecture

The form is designed as a thin modal shell with most behavior centralized in a hook.

- `OrderFormModal` is only the orchestrator.
- `useOrderForm` owns state, derived warnings, effects, and submit logic.
- `IdentityFields` owns the left-side identity UI and personal bulk paste state.
- `PartsSection` owns the right-side parts UI and parts bulk paste state.
- `FormHeader` displays mode state, including the Beast Mode countdown.
- `FormFooter` displays warranty state, duplicate indicators, and the primary action button.

This split should stay intact. Do not move validation and workflow rules down into presentational components.

## Modes

There are two separate concepts that must not be merged mentally or in code.

### 1. Record mode

- Create mode: user is creating new order rows.
- Edit mode: user is updating one or more existing rows.
- Multi-selection edit: shared metadata is edited once, while parts map back to individual rows by `rowId`.

### 2. Validation mode

- `easy`: permissive draft mode
- `beast`: strict validation mode used during commit correction window

Important: the modal's primary button is still a draft-style save path. Strict commit is initiated outside the modal from the Orders toolbar via `handleCommit`.

## Open-state initialization

When the modal opens:

- create mode starts with empty defaults and one blank part row
- edit mode initializes form fields from the first selected row
- edit mode initializes parts from all selected rows
- edit mode stores the currently edited VIN in global state
- if a selected row has an active Beast Mode timer, the modal reopens in Beast Mode with the remaining countdown

When the modal closes:

- current edit VIN is cleared

## Field contract

The form data object contains:

- `customerName`
- `vin`
- `mobile`
- `cntrRdg`
- `model`
- `repairSystem`
- `startWarranty`
- `requester`
- `sabNumber`
- `acceptedBy`
- `company`

Current defaults:

- `startWarranty` defaults to today
- `company` defaults to `Zeekr`
- all text fields default to empty strings
- create mode starts with one empty part row

## Identity behavior

The left panel supports direct entry plus a smart paste helper.

Smart paste fills, in order:

- customer name
- VIN
- mobile
- odometer
- SAB number
- accepted by

VIN behavior:

- input is forced to uppercase
- when VIN length reaches 6 or more characters, model auto-detection may populate `model` if it is still empty
- VIN duplicate checks also start once the VIN is long enough

Company behavior:

- only allowed companies are valid
- current allowed values are `Zeekr` and `Renault`
- company values are normalized before save

Repair system behavior:

- when the repair system is the warranty option, the ICM date field is shown
- warranty state is also reflected in the footer
- vehicles at or above `100000` KM are ineligible for warranty

## Parts behavior

The right panel manages the parts list plus the requester field.

Each part row contains:

- `partNumber`
- `description`
- optional `rowId` in edit mode to preserve identity against existing rows

Parts entry supports:

- manual row addition
- row deletion
- bulk import from multiline pasted text
- Enter key on a description field to add the next row and focus it

Bulk part paste behavior:

- each line becomes one part row
- the first token becomes `partNumber`
- the rest of the line becomes `description`
- part numbers are uppercased

## Validation rules

### Easy mode

Easy mode is intentionally permissive.

- partial form data can be saved
- object-level `OrderFormSchema` is not enforced on submit
- same-order duplicate part numbers are still blocked
- cross-row and historical VIN + part duplicates are still blocked

This is not an accident. It supports draft capture before all information is available.

### Beast mode

Beast mode is intentionally strict.

Required fields:

- customer name
- VIN
- mobile
- KM reading
- vehicle model
- repair system
- SAB number
- company
- requester
- accepted by

Additional Beast Mode requirements:

- at least one part must contain both `partNumber` and `description`
- duplicate part numbers within the same order are blocked
- VIN + part duplicates are blocked
- description conflicts for an existing part number are blocked
- warranty-ineligible mileage is blocked

If Beast Mode validation fails:

- the form stays in Beast Mode
- the countdown is reset to 30 seconds
- missing fields are highlighted

## Beast Mode workflow

This is a critical behavior boundary.

- Beast Mode is triggered from `handleCommit` in `useOrdersPageHandlers.ts`
- the toolbar commit action validates selected rows using `BeastModeSchema`
- invalid rows do not commit to Main Sheet
- invalid rows get a timestamp stored through `triggerBeastMode`
- reopening the modal within 30 seconds re-enters Beast Mode with the remaining timer
- when the timer expires, the modal falls back to Easy Mode

Do not change the form button to behave like a direct commit unless the toolbar commit workflow is being redesigned end-to-end.

## Duplicate protection

There are three distinct duplicate/conflict checks.

### 1. Same-order duplicate parts

If the same part number appears twice in the current parts list:

- both rows are flagged
- submission is blocked in all modes

This is a hard data-integrity rule.

### 2. In-memory VIN + part duplicate check

The form checks the current in-app data across:

- pending rows
- orders rows
- call rows
- booking rows
- archive rows

This check is used to stop creating the same VIN + part combination in another tab or stage.

### 3. Historical database duplicate check

The form also queries persisted orders through `orderService.checkHistoricalVinPartDuplicate`.

Current behavior:

- per-part async check runs on part-number blur
- debounced async checks run when VIN changes
- draft submit rechecks duplicates before save
- edit mode excludes currently selected row IDs from duplicate matching

If a duplicate is found, the warning modal is shown and submission is blocked.

## Description conflict behavior

The form detects when a part number already exists with a different description.

Current behavior:

- the warning is shown inline on the part row
- the existing description can be applied directly from the UI
- Beast Mode blocks submission until the conflict is resolved
- Easy Mode shows the warning but does not block solely for mismatch unless the strict path is active

## Save semantics

### Create mode

On submit:

- one saved order row is created per part row
- `baseId` is generated once per submission
- multi-part creates use indexed `baseId` and `trackingId` values
- each saved row gets `status: "Pending"`
- each saved row gets today's `rDate`
- warranty-derived fields are computed when applicable

### Edit mode

On submit:

- metadata from the form is applied to every part row in the modal
- existing rows are updated by `rowId`
- removed original rows are deleted
- newly added part rows create new order rows linked to the selected batch

This means multi-row edit is not a superficial UI edit. It is a real structural rewrite of the selected order rows.

## Warranty-derived fields

When the selected repair system is the warranty option:

- `endWarranty` is calculated from `startWarranty`
- `remainTime` is calculated from `endWarranty`
- the footer shows live warranty status
- high mileage surfaces as ineligible state

These values are derived during save, not manually entered by the user.

## Non-obvious invariants

These behaviors are intentional and should be preserved unless there is a coordinated redesign.

1. The modal component must stay thin; business logic belongs in `useOrderForm`.
2. Easy Mode must remain permissive for draft saves.
3. Beast Mode must remain externally triggered by the commit workflow.
4. The 30-second Beast Mode timer must persist across modal reopen.
5. Same-order duplicate part numbers must always block save.
6. VIN + part duplicate checks must cover both in-memory rows and persisted history.
7. Edit mode must preserve row identity through `rowId`.
8. Multi-selection edit must initialize shared form data from the first selected row and parts from all selected rows.
9. Warranty calculations must continue to be derived, not user-authored.
10. Company values must stay normalized and restricted to the allowed list.

## Safe change checklist

Before changing this form, verify all of the following:

- draft save still works with partial information
- commit from the toolbar still enforces Beast Mode requirements
- reopening after failed commit still shows the remaining Beast Mode timer
- duplicate part numbers in the same order are rejected
- VIN + part duplicates are rejected across all stages
- historical duplicate checks still exclude edited rows correctly
- multi-row edit still updates, removes, and adds rows correctly
- warranty/high-mileage behavior still matches current rules

## Recommended test targets after changes

At minimum, cover:

- create mode with one part
- create mode with multiple parts
- edit mode with removed and added parts
- Easy Mode draft save with missing fields
- Beast Mode rejection for missing required fields
- same-order duplicate part rejection
- cross-stage VIN + part duplicate rejection
- historical duplicate rejection
- warranty ineligibility at `100000` KM and above

## Summary

The order form is not just a data-entry modal. It is a controlled workflow with draft entry, strict commit correction, duplicate prevention, warranty derivation, and batch-safe editing. Any future change should be evaluated against those responsibilities first.
