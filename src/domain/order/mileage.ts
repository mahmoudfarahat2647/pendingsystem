/**
 * Normalize mileage input by stripping separators (commas, whitespace)
 * Used for form state - returns cleaned string or empty string
 */
export function normalizeMileage(
	input: string | number | null | undefined,
): string {
	if (input === null || input === undefined) {
		return "";
	}
	const str = String(input).trim();
	if (str === "") {
		return "";
	}
	return str.replace(/[,\s]/g, "");
}

/**
 * Normalize mileage and return as number (for validation/persistence)
 * Returns NaN for invalid strings containing non-digits, and 0 for empty inputs
 */
export function normalizeMileageAsNumber(
	input: string | number | null | undefined,
): number {
	const normalized = normalizeMileage(input);
	if (normalized === "") {
		return 0;
	}

	if (!/^\d+$/.test(normalized)) {
		return NaN;
	}

	return parseInt(normalized, 10);
}
