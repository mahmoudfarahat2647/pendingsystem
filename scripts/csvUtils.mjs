// Side-effect-free CSV helpers for the backup path (issue #252).
// Imported by scripts/generate-backup.mjs (which cannot be imported in tests
// due to top-level Supabase/SMTP side effects). Mirrors `sanitizeCsvField`
// in src/lib/exportUtils.ts (scripts cannot import TS; keep the two in sync).

/**
 * CSV formula-injection sanitizer (issue #252).
 * Rule: after converting to string, prefix a single quote when the first
 * character is `=`, `+`, `-`, or `@`.
 * @param {unknown} val - Cell value from DB/user input.
 * @returns {string} Sanitized string safe for spreadsheet apps.
 */
// Only a trigger at char 0 executes in Excel/Sheets, so leading-whitespace payloads intentionally pass.
export function sanitizeCsvValue(val) {
	if (val === null || val === undefined) return "";
	const stringVal =
		typeof val === "object" ? JSON.stringify(val) : String(val);
	if (
		stringVal.startsWith("=") ||
		stringVal.startsWith("+") ||
		stringVal.startsWith("-") ||
		stringVal.startsWith("@")
	) {
		return `'${stringVal}`;
	}
	return stringVal;
}

/**
 * Builds a BOM-prefixed CSV string with `"`-escaping and formula neutralization.
 * @param {Array<Record<string, unknown>>} data - Mapped row records.
 * @param {string[]} [headers] - Column order; defaults to first-row keys.
 * @returns {string} BOM-prefixed CSV content.
 */
export function generateCSV(data, headers) {
	if (data.length === 0) return "";
	const columnHeaders = headers || Object.keys(data[0]);
	const rows = [columnHeaders.join(",")];

	for (const item of data) {
		const values = columnHeaders.map((header) => {
			const val = item[header];
			if (val === null || val === undefined) return "";
			const stringVal = sanitizeCsvValue(val);
			if (
				stringVal.includes(",") ||
				stringVal.includes('"') ||
				stringVal.includes("\n") ||
				stringVal.includes("\r")
			) {
				return `"${stringVal.replaceAll('"', '""')}"`;
			}
			return stringVal;
		});
		rows.push(values.join(","));
	}

	return `\uFEFF${rows.join("\n")}`;
}
