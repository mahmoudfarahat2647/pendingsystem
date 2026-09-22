import { normalizeCompanyName } from "@/domain/company/company";
import type { PendingRow } from "@/types";

export interface RowValueFilterOption {
	label: string;
	value: string;
}

export type RowValueAccessor = (row: PendingRow) => unknown;

/** Reads the repair system off a row. Exported so call sites keep a stable identity for memo deps. */
export const getRepairSystemValue: RowValueAccessor = (row) => row.repairSystem;

/** Reads the car model off a row. Exported so call sites keep a stable identity for memo deps. */
export const getModelValue: RowValueAccessor = (row) => row.model;

/**
 * Reads the canonical company off a row. Normalizing here (rather than reading
 * `row.company` raw) is what makes legacy aliases like "renalt" or "r" match the
 * "Renault" filter option. Exported so call sites keep a stable identity for memo deps.
 */
export const getCompanyValue: RowValueAccessor = (row) =>
	normalizeCompanyName(row.company);

const normalizeValue = (value: unknown): string =>
	typeof value === "string" ? value.trim() : "";

/**
 * Returns a deduplicated, ordered list of filter options derived from the given rows.
 * Empty and whitespace-only values are excluded.
 */
export const getRowValueFilterOptions = (
	rows: PendingRow[],
	getValue: RowValueAccessor,
): RowValueFilterOption[] => {
	const seen = new Set<string>();
	const options: RowValueFilterOption[] = [];

	for (const row of rows) {
		const value = normalizeValue(getValue(row));
		if (!value || seen.has(value)) continue;
		seen.add(value);
		options.push({ label: value, value });
	}

	return options;
};

/**
 * Filters rows to only those whose value matches one of the selected values.
 * Returns the original array reference when no filter is active, so consumers that
 * pass the result straight to a grid see a referentially identical `rowData`.
 */
export const filterRowsByValues = (
	rows: PendingRow[],
	selectedValues: string[],
	getValue: RowValueAccessor,
): PendingRow[] => {
	const selected = new Set(
		selectedValues.map((value) => value.trim()).filter(Boolean),
	);

	if (selected.size === 0) return rows;

	return rows.filter((row) => selected.has(normalizeValue(getValue(row))));
};
