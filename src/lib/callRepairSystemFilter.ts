import type { PendingRow } from "@/types";

export interface RepairSystemFilterOption {
	label: string;
	value: string;
}

const normalizeRepairSystem = (value: PendingRow["repairSystem"]): string =>
	typeof value === "string" ? value.trim() : "";

/**
 * Returns a deduplicated, ordered list of repair-system options derived from the given rows.
 * Empty and whitespace-only values are excluded.
 */
export const getRepairSystemFilterOptions = (
	rows: PendingRow[],
): RepairSystemFilterOption[] => {
	const seen = new Set<string>();
	const options: RepairSystemFilterOption[] = [];

	for (const row of rows) {
		const repairSystem = normalizeRepairSystem(row.repairSystem);
		if (!repairSystem || seen.has(repairSystem)) continue;
		seen.add(repairSystem);
		options.push({ label: repairSystem, value: repairSystem });
	}

	return options;
};

/**
 * Filters rows to only those whose repair system matches one of the selected values.
 * Returns the original array reference when no filter is active (zero allocations).
 */
export const filterRowsByRepairSystems = (
	rows: PendingRow[],
	selectedRepairSystems: string[],
): PendingRow[] => {
	const selected = new Set(
		selectedRepairSystems.map((value) => value.trim()).filter(Boolean),
	);

	if (selected.size === 0) return rows;

	return rows.filter((row) =>
		selected.has(normalizeRepairSystem(row.repairSystem)),
	);
};
