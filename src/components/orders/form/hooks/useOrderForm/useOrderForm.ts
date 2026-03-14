"use client";

import { useEffect } from "react";
import { generateId } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { PartEntry, PendingRow } from "@/types";
import type { FormData } from "../../types";
import { useOrderFormState } from "../useOrderFormState";
import {
	buildEmptyFormData,
	buildInitialFormData,
	buildInitialParts,
} from "./orderFormUtils";
import { useOrderParts } from "./useOrderParts";
import { useOrderSubmit } from "./useOrderSubmit";
import { useOrderValidation } from "./useOrderValidation";

// ---------------------------------------------------------------------------
// Inline helpers — not exported, only used by this hook
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseOrderFormOptions {
	open: boolean;
	isEditMode: boolean;
	selectedRows: PendingRow[];
	onSubmit: (formData: FormData, parts: PartEntry[]) => void;
}

/**
 * Manages all state, effects, and handlers for the order form modal.
 * Bulk-import UI state is intentionally left to sub-components.
 */
export const useOrderForm = ({
	open,
	isEditMode,
	selectedRows,
	onSubmit,
}: UseOrderFormOptions) => {
	// Store selectors
	const rowData = useAppStore((state) => state.rowData);
	const ordersRowData = useAppStore((state) => state.ordersRowData);
	const callRowData = useAppStore((state) => state.callRowData);
	const bookingRowData = useAppStore((state) => state.bookingRowData);
	const archiveRowData = useAppStore((state) => state.archiveRowData);
	const beastModeTriggers = useAppStore((state) => state.beastModeTriggers);
	const setCurrentEditVin = useAppStore((state) => state.setCurrentEditVin);
	const clearCurrentEditVin = useAppStore((state) => state.clearCurrentEditVin);

	// Core form state
	const { formData, setFormData, isMultiSelection, isHighMileage } =
		useOrderFormState(selectedRows);

	// Parts state
	const {
		parts,
		setParts,
		descriptionRefs,
		handleAddPartRow,
		handleRemovePartRow,
		handlePartChange,
		handleBulkImportParts,
	} = useOrderParts();

	// Validation state
	const {
		errors,
		validationMode,
		setValidationMode,
		beastModeTimer,
		setBeastModeTimer,
		beastModeErrors,
		setBeastModeErrors,
		duplicateWarning,
		setDuplicateWarning,
		isCheckingDuplicates,
		setIsCheckingDuplicates,
		checkBeastModeTimer,
		resetValidation,
		checkDuplicateForPart,
		partValidationWarnings,
		hasValidationErrors,
		getFieldError,
		validateForm,
	} = useOrderValidation({ formData, parts, isEditMode, selectedRows });

	const { handleLocalSubmit } = useOrderSubmit({
		formData,
		parts,
		validationMode,
		isEditMode,
		selectedRows,
		hasValidationErrors,
		partValidationWarnings,
		setValidationMode,
		setBeastModeTimer,
		setBeastModeErrors,
		setIsCheckingDuplicates,
		setDuplicateWarning,
		onSubmit,
	});

	// -----------------------------------------------------------------------
	// Effect: modal open/close initialisation
	// -----------------------------------------------------------------------
	useEffect(() => {
		if (open) {
			let initialFormData: FormData;
			if (isEditMode && selectedRows.length > 0) {
				const first = selectedRows[0];
				initialFormData = buildInitialFormData(first);

				const initialParts = buildInitialParts(selectedRows);
				setParts(initialParts);
				setFormData(initialFormData);

				if (first.vin) {
					setCurrentEditVin(first.vin, first.id);
				}

				checkBeastModeTimer(first.id, initialFormData);
			} else {
				setFormData(buildEmptyFormData());
				setParts([{ id: generateId(), partNumber: "", description: "" }]);
				resetValidation();
			}
		} else {
			clearCurrentEditVin();
		}
	}, [open, isEditMode, selectedRows, setCurrentEditVin, clearCurrentEditVin]);

	return {
		// Form state
		formData,
		setFormData,
		errors,

		// Validation state
		validationMode,
		beastModeTimer,
		beastModeErrors,
		getFieldError,

		// Parts state
		parts,
		setParts,
		descriptionRefs,

		// Duplicate warning
		duplicateWarning,
		setDuplicateWarning,

		// Derived / computed
		isMultiSelection,
		isHighMileage,
		partValidationWarnings,
		hasValidationErrors,

		// Handlers
		handleAddPartRow,
		handleRemovePartRow,
		handlePartChange,
		handleBulkImportParts,
		checkDuplicateForPart,
		handleLocalSubmit,
	};
};
