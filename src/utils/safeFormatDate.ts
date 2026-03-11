import { format, isValid } from "date-fns";

/**
 * Parses a date string or object safely, ensuring that date-only strings
 * ("yyyy-MM-dd") are parsed as local midnight instead of UTC midnight.
 * This prevents off-by-one day bugs for users west of UTC.
 */
export function parseDateLocal(dateInput: string | Date): Date {
	if (dateInput instanceof Date) return dateInput;

	const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);
	if (dateOnlyMatch) {
		const [, year, month, day] = dateOnlyMatch;
		return new Date(Number(year), Number(month) - 1, Number(day));
	}

	return new Date(dateInput);
}

/**
 * Safely formats a date string, returning a fallback if the date is invalid.
 * Uses parseDateLocal to prevent timezone shift issues for date-only strings.
 *
 * @param dateInput - The date string, Date object, or undefined/null.
 * @param formatStr - The date-fns format string.
 * @param fallback - The string to return if the date is invalid.
 * @returns The formatted date string or the fallback.
 */
export function safeFormatDate(
	dateInput: string | Date | undefined | null,
	formatStr: string,
	fallback = "—",
): string {
	if (!dateInput) return fallback;
	const parsed = parseDateLocal(dateInput);
	return isValid(parsed) ? format(parsed, formatStr) : fallback;
}
