/**
 * Shared validation constants for Orders tab validation refactor.
 * Contains mode enums, company allowed values, and validation thresholds.
 */

export enum ValidationMode {
	DEFAULT = "easy",
	BEAST = "beast",
}

export const ALLOWED_COMPANIES = ["Zeekr", "Renault"] as const;

export type AllowedCompany = (typeof ALLOWED_COMPANIES)[number];

export const DEFAULT_COMPANY: AllowedCompany = "Zeekr";

export const VIN_MIN_LENGTH = 5;
export const VIN_STANDARD_LENGTH = 17;

export const DUPLICATE_CHECK_VIN_MIN_LENGTH = 6;
