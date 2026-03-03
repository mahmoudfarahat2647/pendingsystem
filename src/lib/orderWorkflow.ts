import {
	DUPLICATE_CHECK_VIN_MIN_LENGTH,
	ValidationMode,
	VIN_MIN_LENGTH,
	VIN_STANDARD_LENGTH,
} from "@/lib/ordersValidationConstants";
import type { PartEntry, PendingRow } from "@/types";

/**
 * Validates if a string is a valid UUID v4.
 * @param id - The string to validate
 * @returns True if valid UUID
 */
export const isUuid = (id: string): boolean =>
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/**
 * Appends a tagged note to an existing action note string.
 * @param existing - The current note string
 * @param note - The new note to append
 * @param tag - The tag to append (e.g. 'archive')
 * @returns The new combined note string
 */

export const appendTaggedActionNote = (
	existing: string | undefined,
	note: string,
	tag: string,
): string => {
	const trimmedNote = note.trim();
	if (!trimmedNote) {
		return existing || "";
	}

	const taggedNote = `${trimmedNote} #${tag}`;
	return existing ? `${existing}\n${taggedNote}` : taggedNote;
};

/**
 * Extracts valid UUIDs from an array of order rows.
 * @param rows - The order rows to extract IDs from
 * @returns Array of valid UUID strings
 */
export const getSelectedIds = (rows: PendingRow[]): string[] =>
	rows.map((row) => row.id).filter(isUuid);

export interface DuplicateCheckResult {
	isDuplicate: boolean;
	existingRow?: PendingRow;
	location?: string;
}

export interface DescriptionConflictResult {
	hasConflict: boolean;
	existingDescription?: string;
	existingRow?: PendingRow;
}

export function normalizeVin(vin: string): string {
	return vin.trim().toUpperCase();
}

export function isVinComplete(vin: string): boolean {
	const normalized = normalizeVin(vin);
	return normalized.length >= VIN_STANDARD_LENGTH;
}

export function isVinLongEnoughForDuplicateCheck(vin: string): boolean {
	const normalized = normalizeVin(vin);
	return normalized.length >= DUPLICATE_CHECK_VIN_MIN_LENGTH;
}

export function isVinTooShortForDefaultMode(vin: string): boolean {
	const normalized = normalizeVin(vin);
	return normalized.length > 0 && normalized.length < VIN_MIN_LENGTH;
}

export function checkVinPartDuplicate(
	vin: string,
	partNumber: string,
	existingRows: PendingRow[],
	currentRowId?: string,
): DuplicateCheckResult {
	const normalizedVin = normalizeVin(vin);
	const normalizedPart = partNumber.trim().toUpperCase();

	if (!isVinLongEnoughForDuplicateCheck(normalizedVin) || !normalizedPart) {
		return { isDuplicate: false };
	}

	for (const row of existingRows) {
		if (currentRowId && row.id === currentRowId) continue;

		const rowVin = normalizeVin(row.vin || "");
		const rowPart = (row.partNumber || "").trim().toUpperCase();

		if (rowVin === normalizedVin && rowPart === normalizedPart) {
			return {
				isDuplicate: true,
				existingRow: row,
				location: row.stage || "unknown",
			};
		}
	}

	return { isDuplicate: false };
}

export function checkDescriptionConflict(
	partNumber: string,
	currentDescription: string,
	existingRows: PendingRow[],
	currentRowId?: string,
): DescriptionConflictResult {
	const normalizedPart = partNumber.trim().toUpperCase();

	if (!normalizedPart || !currentDescription.trim()) {
		return { hasConflict: false };
	}

	for (const row of existingRows) {
		if (currentRowId && row.id === currentRowId) continue;

		const rowPart = (row.partNumber || "").trim().toUpperCase();
		const rowDescription = (row.description || "").trim().toLowerCase();
		const currentDescTrimmed = currentDescription.trim().toLowerCase();

		if (rowPart === normalizedPart && rowDescription !== currentDescTrimmed) {
			return {
				hasConflict: true,
				existingDescription: row.description,
				existingRow: row,
			};
		}
	}

	return { hasConflict: false };
}

export function findSameOrderDuplicates(parts: PartEntry[]): PartEntry[] {
	const seen = new Map<string, PartEntry>();
	const duplicates: PartEntry[] = [];

	for (const part of parts) {
		const key = part.partNumber.trim().toUpperCase();
		if (!key) continue;

		if (seen.has(key)) {
			duplicates.push(part);
		} else {
			seen.set(key, part);
		}
	}

	return duplicates;
}

export function findSameOrderDuplicateIndices(parts: PartEntry[]): number[] {
	const seen = new Map<string, number>();
	const duplicateIndices: number[] = [];

	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		const key = part.partNumber.trim().toUpperCase();
		if (!key) continue;

		if (seen.has(key)) {
			duplicateIndices.push(i);
		} else {
			seen.set(key, i);
		}
	}

	return duplicateIndices;
}

export function shouldSkipDuplicateCheck(
	vin: string,
	mode: ValidationMode,
): boolean {
	if (mode === ValidationMode.DEFAULT) {
		return !isVinLongEnoughForDuplicateCheck(vin);
	}
	return false;
}

export function getValidationModeFromString(
	mode: "easy" | "beast",
): ValidationMode {
	return mode === "beast" ? ValidationMode.BEAST : ValidationMode.DEFAULT;
}
