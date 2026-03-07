/**
 * Supabase free-tier storage limits and formatting helpers.
 *
 * Single source of truth so the API, hooks, and UI all share
 * the same quota numbers. Update here if Supabase changes limits.
 */

/** Database limit for the Supabase free tier (500 MB). */
export const DB_LIMIT_BYTES = 500 * 1024 * 1024; // 524_288_000

/** File storage limit for the Supabase free tier (1 GB). */
export const STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1_073_741_824

/** Combined allocation (DB + Storage). */
export const COMBINED_LIMIT_BYTES = DB_LIMIT_BYTES + STORAGE_LIMIT_BYTES;

/**
 * Converts a byte count to a human-readable MB string.
 *
 * @param bytes - The value in bytes to format.
 * @returns Formatted string with two decimal places, e.g. "123.45 MB".
 */
export function formatBytesToMB(bytes: number): string {
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Calculates the usage percentage of a given value against a limit.
 *
 * @param used - Used bytes.
 * @param limit - Total limit in bytes.
 * @returns Percentage value clamped to 0–100.
 */
export function usagePercent(used: number, limit: number): number {
	if (limit <= 0) return 0;
	return Math.min(100, Math.max(0, (used / limit) * 100));
}
