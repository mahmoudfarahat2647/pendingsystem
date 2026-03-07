import { ALLOWED_COMPANIES } from "./ordersValidationConstants";

/**
 * Normalizes a given company name input into a canonical string format.
 * Trims whitespace, ignores casing, and maps known legacy aliases
 * (e.g., "renalt", "pendingsystem") to their standard corresponding
 * company name (e.g., "Renault").
 *
 * @param value The raw company name to normalize.
 * @returns The normalized, canonical company name string, or an empty string.
 */
export const normalizeCompanyName = (value: unknown): string => {
	if (typeof value !== "string") return "";
	const trimmed = value.trim();
	if (!trimmed) return "";

	const normalized = trimmed.toLowerCase();
	if (normalized === "zeekr") return "Zeekr";
	if (
		normalized === "renault" ||
		normalized === "renalt" ||
		normalized === "pendingsystem"
	) {
		return "Renault";
	}

	return trimmed;
};

/**
 * Normalizes a company name while preserving null or undefined values.
 * Useful for processing database entries or optional API parameters
 * where a missing value should remain missing rather than becoming an empty string.
 *
 * @param value The raw company name to normalize, or null/undefined.
 * @returns The normalized company name, or the original null/undefined value.
 */
export const normalizeNullableCompanyName = (
	value: unknown,
): string | null | undefined => {
	if (value == null) return value as null | undefined;
	const normalized = normalizeCompanyName(value);
	return normalized || null;
};

/**
 * Checks if a given company name is valid according to the configured system constants.
 * The input is normalized before checking against the ALLOWED_COMPANIES array.
 *
 * @param value The raw company name to validate.
 * @returns True if the normalized company name is allowed, false otherwise.
 */
export const isAllowedCompanyName = (value: unknown): boolean => {
	const normalized = normalizeCompanyName(value);
	return ALLOWED_COMPANIES.includes(
		normalized as (typeof ALLOWED_COMPANIES)[number],
	);
};
