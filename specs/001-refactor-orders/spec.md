# Feature Specification: Orders Tab Refactoring with Dual-Mode Validation

**Feature Branch**: `001-refactor-orders`  
**Created**: 2026-03-03  
**Status**: Draft  
**Input**: User description: "Refactor Orders tab with company filtering, icon updates, duplicate prevention, dual validation modes, and cross-tab restrictions"

## Clarifications

### Session 2026-03-03

- Q: For cross-tab edit restrictions, should mismatch be triggered by VIN mismatch only, or by either VIN OR model mismatch? -> A: VIN mismatch only.
- Q: How should duplicate VIN + part checks work when a default-mode order has only a partial VIN? -> A: Skip VIN+part duplicate checks when VIN is partial.
- Q: In beast mode, if duplicate VIN + part is found, should user be able to proceed anyway? -> A: No, block progression until resolved.
- Q: In default mode, when same part number has a conflicting description in history, should system warn immediately or defer to beast mode validation? -> A: Show inline red warning text under description and allow one-click copy of the existing description for fast correction.
- Q: Should mixed-VIN edit blocking apply in one tab only or all grid sheets with form editing? -> A: Apply it across all grid sheets that support form editing.
- Q: How should blank VIN rows be handled in mixed-selection edit validation? -> A: Treat blank VIN as a distinct VIN; mixed blank/non-blank selection is blocked.
- Q: Should only the edit icon be blocked, or every form-open entry point? -> A: Block all form-opening entry points when mixed VINs are selected.
- Q: Should blocked-action guidance be pointer-only or also keyboard-accessible? -> A: Show the same tooltip/guidance on hover and keyboard focus.
- Q: Should VIN comparison for mixed-selection gating be exact string or normalized? -> A: Use normalized VIN comparison (trim + case-insensitive).

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Enter Order with Partial Data in Default Mode (Priority: P1)

During busy or rush hours, warehouse staff need to quickly enter partial VIN data and part descriptions without validation delays, planning to complete the full details later when time permits.

**Why this priority**: Enables fast data entry during peak demand periods, critical for operational efficiency in high-volume environments.

**Independent Test**: Can be fully tested by creating a new order in default mode with partial VIN (last 5 characters) and description only, and verifying the system accepts it without validation warnings.

**Acceptance Scenarios**:

1. **Given** the system is in default mode, **When** a user enters only the last 5 characters of a VIN and a part description, **Then** the system accepts the entry without any validation warnings
2. **Given** partial data is entered in default mode, **When** the user saves the order, **Then** the order is saved with the incomplete VIN
3. **Given** a user is in default mode, **When** they attempt to save an order with missing optional fields, **Then** no warnings are displayed

---

### User Story 2 - Validate Complete Order Before Advancing to Next Step (Priority: P1)

When moving an order to the next workflow step, system operators need strict validation to ensure all required fields are complete and all data integrity rules are enforced, preventing incomplete orders from progressing.

**Why this priority**: Prevents incomplete orders from entering downstream processes, ensuring data quality at critical workflow transitions.

**Independent Test**: Can be fully tested by attempting to advance an order with missing fields in beast mode and verifying validation warnings are displayed before allowing progression.

**Acceptance Scenarios**:

1. **Given** an order is in beast mode and has missing required fields, **When** the user attempts to advance to the next step, **Then** validation errors are displayed blocking progression
2. **Given** a complete order in beast mode, **When** all validation checks pass, **Then** the user can advance to the next step
3. **Given** an order in beast mode, **When** checking for duplicates, **Then** system validates across all tabs before allowing progression

---

### User Story 3 - Prevent Duplicate VIN + Part Number Entries (Priority: P1)

Order entry staff need real-time warnings when attempting to create an order with a VIN + part number combination that already exists in any tab, preventing accidental duplicate entries that could cause downstream fulfillment issues.

**Why this priority**: Prevents critical fulfillment errors caused by duplicate orders, directly impacts operational accuracy.

**Independent Test**: Can be fully tested by creating an order with VIN + part number, then attempting to create another order with the same combination and verifying a warning modal appears.

**Acceptance Scenarios**:

1. **Given** an order with VIN "ABC12" and part "12345678R" exists in any tab, **When** a user attempts to create a new order with the same VIN and part number, **Then** a warning modal is displayed
2. **Given** a duplicate VIN + part number is detected, **When** the user is shown the warning modal, **Then** the modal displays which tab contains the existing order
3. **Given** a warning modal is displayed in beast mode, **When** the user dismisses the modal, **Then** progression is blocked until the duplicate is resolved

---

### User Story 4 - Prevent Conflicting Part Number Descriptions (Priority: P2)

Data administrators need the system to prevent assigning different descriptions to the same part number across all tabs, ensuring consistency and preventing confusion during parts identification and fulfillment.

**Why this priority**: Maintains data integrity and prevents costly fulfillment errors caused by conflicting part descriptions, important but can be caught during later validation steps.

**Independent Test**: Can be fully tested by creating a part number with one description, then attempting to use the same part number with a different description in a different tab and verifying a warning appears.

**Acceptance Scenarios**:

1. **Given** part "12345678R" has description "شاسية كرسى السائق" in one tab, **When** a user attempts to enter the same part with description "شاسية كرسى امامى شمال" in another tab, **Then** a validation warning is displayed
2. **Given** conflicting part descriptions are detected in beast mode, **When** validation runs before advancing the order, **Then** the system blocks advancement and displays the conflict details
3. **Given** the same part number appears in multiple tabs, **When** the user inspects the order, **Then** they can see all descriptions assigned to that part number
4. **Given** the system is in default mode and a conflicting description is entered, **When** the user exits the description field, **Then** inline red warning text appears under the field and provides a one-click copy action for the existing approved description

---

### User Story 5 - Prevent Duplicate Part Numbers Within Single Order (Priority: P2)

Order entry staff need to prevent accidentally adding the same part number twice within a single order, avoiding incorrect quantity calculations and fulfillment confusion.

**Why this priority**: Prevents data entry errors that could cause fulfillment inaccuracies, important for order correctness.

**Independent Test**: Can be fully tested by adding a part number to an order, then attempting to add the same part number again and verifying a validation error appears.

**Acceptance Scenarios**:

1. **Given** part "XYZ789" is already in the current order, **When** the user attempts to add the same part number again, **Then** the system prevents the addition or displays a warning
2. **Given** duplicate part detection is active, **When** a user tries to save an order with duplicate parts, **Then** the system identifies which part number is duplicated

---

### User Story 6 - Restrict Cross-Tab Editing for Multiple VINs (Priority: P3)

Order processors need to prevent editing across different tabs when different VINs are selected, ensuring users focus on one vehicle at a time and preventing accidental cross-contamination of order data.

**Why this priority**: Prevents data confusion and ensures organized workflow, improves user experience by enforcing logical boundaries.

**Independent Test**: Can be fully tested by selecting rows with different VINs in any grid sheet, attempting to open edit via icon/double-click/keyboard path, and verifying the edit action stays blocked with accessible guidance.

**Acceptance Scenarios**:

1. **Given** selected rows in a grid contain more than one normalized VIN value, **When** the user attempts to open the form through any edit entry point, **Then** form opening is blocked
2. **Given** mixed-VIN selection is active in a grid sheet, **When** the user hovers or focuses the disabled edit action, **Then** a tooltip explains that opening different VINs is not allowed
3. **Given** selected rows include both blank VIN and non-blank VIN values, **When** edit is attempted, **Then** the action remains blocked as a mixed-VIN selection
4. **Given** the user has unsaved edits and navigates to another tab with a different VIN context, **When** navigation is attempted, **Then** the system requires save-first confirmation before allowing the switch

---

### User Story 7 - Update Company Field Options (Priority: P1)

Order entry staff need an updated company dropdown containing only "Zeekr" and "Renalt" options, eliminating "pendingsystem" which is no longer used for actual order creation.

**Why this priority**: Fixes a core data entry issue affecting every order creation, prevents invalid company selections.

**Independent Test**: Can be fully tested by opening the order entry form and verifying the company dropdown displays only "Zeekr" and "Renalt" options.

**Acceptance Scenarios**:

1. **Given** the order entry form is open, **When** the user clicks the company dropdown, **Then** only "Zeekr" and "Renalt" are displayed as options
2. **Given** "pendingsystem" was previously an option, **When** the form loads, **Then** "pendingsystem" is completely removed from the dropdown
3. **Given** the company dropdown is displayed, **When** the user selects a company, **Then** the selected value is saved with the order

---

### User Story 8 - Update Requester Field Icon (Priority: P2)

Order staff need the requester field (for names) to display an appropriate person icon instead of the current location icon, improving UI clarity and reducing user confusion.

**Why this priority**: Improves user experience and UI clarity, helps users understand the field purpose at a glance.

**Independent Test**: Can be fully tested by opening the order entry form and verifying the requester field displays a person icon instead of a location icon.

**Acceptance Scenarios**:

1. **Given** the order entry form is open, **When** the requester field is displayed, **Then** it shows a person icon (not a location icon)
2. **Given** the requester field is focused, **When** the user hovers over the icon, **Then** a tooltip indicates "Requester Name" or similar

### Edge Cases

- What happens when a user switches between default and beast modes with an incomplete order?
- How does the system handle concurrent edits in different tabs with conflicting VIN selections?
- How does the system handle mixed selections where VIN values differ only by casing or accidental leading/trailing spaces?
- What happens if rows with blank VIN values are selected together with rows that have populated VIN values?
- What happens when a part number has been assigned multiple descriptions over time and an older description reappears?
- How does the system behave if validation rules are changed mid-session (e.g., mode switch during entry)?
- What occurs when a duplicate is detected after the user has already filled in additional fields and is attempting to save?

## Requirements *(mandatory)*

### Functional Requirements

#### Company Field Requirements
- **FR-001**: System MUST display only "Zeekr" and "Renalt" in the company dropdown field in the order entry form
- **FR-002**: System MUST remove "pendingsystem" as a selectable company option
- **FR-003**: System MUST validate that a company selection is made before order submission in beast mode

#### Requester Field Requirements
- **FR-004**: System MUST display a person/contact icon for the requester name field instead of a location icon
- **FR-005**: System MUST provide a tooltip or label indicating the field represents the requester's name

#### Default Mode (Permissive) Requirements
- **FR-006**: System MUST allow entry of partial VIN (e.g., last 5 characters) without validation warnings in default mode
- **FR-007**: System MUST allow entry of part description without requiring other fields to be complete in default mode
- **FR-008**: System MUST NOT display validation warnings for incomplete fields when in default mode
- **FR-009**: System MUST save incomplete orders when in default mode

#### Beast Mode (Restrictive) Requirements
- **FR-010**: System MUST require all mandatory fields to be filled before allowing order advancement in beast mode
- **FR-011**: System MUST apply all validation rules when in beast mode
- **FR-012**: System MUST display validation error messages for any empty or invalid fields before allowing progression to the next workflow step
- **FR-013**: System MUST prevent order advancement if any validation rule fails in beast mode

#### Duplicate Prevention - VIN + Part Number
- **FR-014**: System MUST check for duplicate VIN + part number combinations across all historical orders and all open tabs when creating an order with a complete VIN
- **FR-015**: System MUST NOT display warnings for duplicate VIN + part number combinations in default mode, allowing duplicates silently
- **FR-016**: System MUST display a warning modal if a VIN + part number combination already exists when in beast mode
- **FR-017**: System MUST identify and display which tab contains the existing duplicate order when warning is displayed
- **FR-018**: System MUST allow user to cancel and return to edit after acknowledging a duplicate warning in beast mode
- **FR-019**: System MUST prevent duplicate VIN + part number combinations in beast mode (blocking, not just warning)
- **FR-019a**: System MUST skip VIN + part number duplicate checks for entries that contain only partial VIN values in default mode

#### Duplicate Prevention - Part Number Descriptions
- **FR-020**: System MUST check for conflicting part number descriptions across all historical data in the system (not just current session)
- **FR-021**: System MUST prevent assigning different descriptions to the same part number across all tabs and all historical orders
- **FR-022**: System MUST show inline red warning text under the description field in default mode when a part number is entered with a different historical description
- **FR-023**: System MUST show which description is already assigned to the part number
- **FR-023a**: System MUST provide a one-click action to copy the existing approved description into the current field
- **FR-024**: System MUST block order advancement in beast mode if conflicting part descriptions are detected
- **FR-025**: System MUST allow users to view all existing descriptions for a part number across the system's history

#### Duplicate Prevention - Within Single Order
- **FR-026**: System MUST prevent the same part number from being added twice within a single order
- **FR-027**: System MUST display a validation error if a user attempts to add a duplicate part number to the current order
- **FR-028**: System MUST identify which part number is duplicated when validation fails

#### Cross-Tab and Mixed-VIN Editing Restrictions
- **FR-029**: System MUST enforce mixed-VIN edit blocking across all grid sheets that support opening the order form.
- **FR-030**: System MUST block form opening when the current selection contains more than one normalized VIN value.
- **FR-031**: System MUST apply mixed-VIN blocking to all form-opening entry points (edit icon, row-level edit triggers, keyboard shortcuts, and equivalent UI paths).
- **FR-032**: System MUST treat blank VIN as a distinct VIN value; mixed blank/non-blank selections are blocked from form opening.
- **FR-033**: System MUST compare VIN values using normalization (trimmed, case-insensitive) before determining uniqueness.
- **FR-033a**: System MUST display disabled-action guidance stating that opening different VINs is not allowed.
- **FR-033b**: System MUST expose the same disabled-action guidance on hover and keyboard focus.
- **FR-033c**: System MUST prompt the user when attempting to switch tabs with different VINs selected.
- **FR-033d**: System MUST display the VINs being compared in the prompt when available.
- **FR-033e**: System MUST allow the user to switch tabs only if the current tab data is saved first.
- **FR-033f**: System MUST allow the user to cancel the tab switch and return to the current tab.

#### Mode Selection and Switching
- **FR-034**: System MUST provide a clear mechanism for selecting between default mode and beast mode
- **FR-035**: System MUST display the current mode to the user at all times
- **FR-036**: System MUST allow switching between modes with appropriate warnings about validation implications

### Key Entities

- **Order**: Represents a complete order containing one or more order line items, company selection, and requester information
- **OrderLineItem**: Represents a single line within an order, containing VIN (partial or complete), part number, description, and quantity
- **Company**: Enum representing supported companies (Zeekr, Renalt)
- **ValidationMode**: Enum representing the validation strictness (Default, Beast)
- **PartNumberDescriptionMapping**: Maps part numbers to their assigned descriptions across all tabs to detect conflicts

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can enter a complete order in default mode within 2 minutes during peak load periods
- **SC-002**: All validation rules in beast mode are applied before allowing order advancement, with 100% coverage of defined validations
- **SC-003**: In beast mode, duplicate VIN + part number warnings appear within 500ms of attempting to save
- **SC-004**: Users successfully prevent duplicate entries in 95% of cases where duplicates are detected
- **SC-005**: Data entry errors caused by duplicate part numbers within a single order are eliminated (0 occurrences in production)
- **SC-006**: Users report improved UI clarity after requester icon change (qualitative feedback in user testing)
- **SC-007**: Order advancement failures due to missing validation are reduced to 0% in beast mode
- **SC-008**: Company dropdown now contains exactly 2 options (Zeekr, Renalt) with no "pendingsystem" option
- **SC-009**: In UAT, 100% of mixed-VIN selections across grid sheets keep form-open actions disabled until selection resolves to a single normalized VIN.
- **SC-010**: In UAT, 100% of blocked mixed-VIN edit actions display the guidance message on both mouse hover and keyboard focus.

## Assumptions

1. **Mode Switching**: Users can switch between default and beast modes via a UI control (button, toggle, or dropdown) at the order level
2. **Tab Scope**: "Tabs" refer to workflow stage tabs (not browser tabs) where orders can be viewed in different stages of completion
3. **Duplicate Detection Scope**: Duplicate checks include all workflow tabs and historical orders, not just current session
4. **Validation Persistence**: When switching to beast mode, all previously entered data in default mode is retained and validated
5. **Part Number Format**: Part numbers are case-sensitive and compared exactly as entered
6. **VIN Comparison**: VINs are compared using normalized values (trimmed and case-insensitive)
7. **Warning Handling**: In default mode, warnings can be informational and non-blocking; in beast mode, duplicate VIN + part warnings block progression until resolved
8. **Cross-Tab Restrictions**: Mixed-VIN edit blocking is enforced on all grid sheets and all form-opening entry points, while save-first prompts apply to cross-tab VIN mismatch navigation
9. **Icon Change**: Person icon follows standard UI conventions for contact/name fields
10. **Error Messages**: All validation errors are displayed in user-friendly language with guidance on how to resolve them

## Resolved Clarifications

**Q1 - Part Number Description Validation Scope**: Part number description conflicts SHALL be checked across **all historical data in the system**. This ensures strong data integrity and prevents conflicting descriptions from ever appearing system-wide, even across multiple order sessions.

**Q2 - Default Mode Duplicate Behavior**: In default mode, duplicate VIN + part number combinations SHALL be allowed **silently without any warnings or restrictions**. This aligns with the "without restrictions or warnings" requirement for busy periods while still maintaining duplicate prevention in beast mode.

**Q3 - Cross-Tab Navigation Logic**: When attempting to navigate to a different tab with a different VIN selected, the system SHALL **allow navigation if the current tab data is saved first**. This provides flexibility while ensuring no unsaved work is lost and prevents accidental data corruption from concurrent multi-VIN editing.

**Q4 - Mixed-VIN Blocking Scope**: Mixed-VIN edit blocking SHALL apply to **all grid sheets that support order-form editing**, not only one tab. This prevents bypassing edit restrictions by switching sheets.

**Q5 - Blank VIN Behavior**: Blank VIN values SHALL be treated as a **distinct VIN value** during mixed-selection checks. Selecting blank + non-blank VIN rows is considered mixed and blocks form opening.

**Q6 - Edit Entry Points**: Mixed-VIN blocking SHALL apply to **all form-opening entry points** (icon, keyboard, row-level triggers, and equivalent paths), not just the primary edit icon.

**Q7 - Accessibility for Blocked Action Guidance**: The blocked-action explanation SHALL be available on **hover and keyboard focus** to ensure accessible guidance parity.

**Q8 - VIN Normalization Rule**: VIN uniqueness checks for mixed-selection gating SHALL use **trimmed, case-insensitive normalization** to avoid false mismatches from formatting differences.
