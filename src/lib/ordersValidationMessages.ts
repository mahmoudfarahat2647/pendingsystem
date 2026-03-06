/**
 * Validation and warning messages for Orders tab validation refactor.
 * Centralized message strings for consistent UI feedback.
 */

import type { ValidationMode } from "./ordersValidationConstants";

export interface ValidationMessage {
	type: "error" | "warning" | "info";
	key: string;
	message: string;
	suggestion?: string;
}

export const VALIDATION_MESSAGES: Record<string, ValidationMessage> = {
	// Company field messages
	COMPANY_REQUIRED: {
		type: "error",
		key: "COMPANY_REQUIRED",
		message: "Company is required",
		suggestion: "Select either Zeekr or Renault",
	},
	COMPANY_INVALID: {
		type: "error",
		key: "COMPANY_INVALID",
		message: "Invalid company selection",
		suggestion: "Only Zeekr and Renault are allowed",
	},

	// VIN messages
	VIN_REQUIRED: {
		type: "error",
		key: "VIN_REQUIRED",
		message: "VIN is required",
	},
	VIN_TOO_SHORT: {
		type: "warning",
		key: "VIN_TOO_SHORT",
		message: "VIN appears incomplete",
		suggestion: "Complete VIN will be required for Beast Mode",
	},

	// Part number messages
	PART_NUMBER_REQUIRED: {
		type: "error",
		key: "PART_NUMBER_REQUIRED",
		message: "Part number is required",
	},
	DUPLICATE_PART_IN_ORDER: {
		type: "error",
		key: "DUPLICATE_PART_IN_ORDER",
		message: "Duplicate part number in this order",
		suggestion: "Each part number can only appear once per order",
	},

	// Description conflict messages
	DESCRIPTION_CONFLICT: {
		type: "warning",
		key: "DESCRIPTION_CONFLICT",
		message: "Different description already exists for this part",
		suggestion: "Click to use existing description",
	},
	DESCRIPTION_CONFLICT_BLOCKING: {
		type: "error",
		key: "DESCRIPTION_CONFLICT_BLOCKING",
		message: "Description conflict must be resolved",
		suggestion: "Use the existing description or update in Beast Mode",
	},

	// VIN+Part duplicate messages
	VIN_PART_DUPLICATE_WARNING: {
		type: "warning",
		key: "VIN_PART_DUPLICATE_WARNING",
		message: "This VIN + part combination already exists",
	},
	VIN_PART_DUPLICATE_BLOCKING: {
		type: "error",
		key: "VIN_PART_DUPLICATE_BLOCKING",
		message: "Duplicate VIN + part number",
		suggestion: "Resolve duplicate before proceeding",
	},

	// Beast mode messages
	BEAST_MODE_BLOCKING: {
		type: "error",
		key: "BEAST_MODE_BLOCKING",
		message: "Please complete all required fields",
		suggestion: "Fill in the highlighted fields to proceed",
	},
	BEAST_MODE_TIMER: {
		type: "info",
		key: "BEAST_MODE_TIMER",
		message: "Strict validation window",
	},

	// Cross-tab messages
	CROSS_TAB_VIN_MISMATCH: {
		type: "warning",
		key: "CROSS_TAB_VIN_MISMATCH",
		message: "Different VIN selected in target tab",
		suggestion: "Save current changes before switching tabs",
	},
};

export function getValidationMessage(
	key: string,
	mode?: ValidationMode,
): ValidationMessage | undefined {
	const baseMessage = VALIDATION_MESSAGES[key];
	if (!baseMessage) return undefined;

	if (mode === "beast" && key === "DESCRIPTION_CONFLICT") {
		return VALIDATION_MESSAGES["DESCRIPTION_CONFLICT_BLOCKING"];
	}

	if (mode === "beast" && key === "VIN_PART_DUPLICATE_WARNING") {
		return VALIDATION_MESSAGES["VIN_PART_DUPLICATE_BLOCKING"];
	}

	return baseMessage;
}
