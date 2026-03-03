/**
 * Shared validation constants for Orders tab validation refactor.
 * Contains mode enums, company allowed values, and validation thresholds.
 */

export enum ValidationMode {
	DEFAULT = "easy",
	BEAST = "beast",
}

export const ALLOWED_COMPANIES = ["Zeekr", "Renalt"] as const;

export type AllowedCompany = (typeof ALLOWED_COMPANIES)[number];

export const DEFAULT_COMPANY: AllowedCompany = "Zeekr";

export const VIN_MIN_LENGTH = 5;
export const VIN_STANDARD_LENGTH = 17;

export const DUPLICATE_CHECK_VIN_MIN_LENGTH = 6;

export const VALIDATION_MODE_LABELS: Record<ValidationMode, string> = {
	[ValidationMode.DEFAULT]: "Default",
	[ValidationMode.BEAST]: "Beast Mode",
};

export const VALIDATION_MODE_DESCRIPTIONS: Record<ValidationMode, string> = {
	[ValidationMode.DEFAULT]:
		"Fast entry mode - partial data allowed, no validation warnings",
	[ValidationMode.BEAST]:
		"Strict mode - all fields required, validation enforced",
};

export const DEFAULT_MODE_TIMEOUT_SECONDS = 30;
