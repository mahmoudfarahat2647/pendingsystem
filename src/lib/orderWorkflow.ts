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
	/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
		id,
	);

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

interface DuplicateCheckResult {
	isDuplicate: boolean;
	existingRow?: PendingRow;
	location?: string;
}

interface DescriptionConflictResult {
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

function _isVinTooShortForDefaultMode(vin: string): boolean {
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
	const duplicates = new Set<PartEntry>();

	for (const part of parts) {
		const key = part.partNumber.trim().toUpperCase();
		if (!key) continue;

		if (seen.has(key)) {
			duplicates.add(
				seen.get(key) as import("@/schemas/order.schema").PartEntry,
			);
			duplicates.add(part);
		} else {
			seen.set(key, part);
		}
	}

	return Array.from(duplicates);
}

export function findSameOrderDuplicateIndices(parts: PartEntry[]): number[] {
	const seen = new Map<string, number>();
	const duplicateIndices = new Set<number>();

	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		const key = part.partNumber.trim().toUpperCase();
		if (!key) continue;

		if (seen.has(key)) {
			const firstIndex = seen.get(key) as number;
			duplicateIndices.add(firstIndex);
			duplicateIndices.add(i);
		} else {
			seen.set(key, i);
		}
	}

	return Array.from(duplicateIndices);
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

function _getValidationModeFromString(mode: "easy" | "beast"): ValidationMode {
	return mode === "beast" ? ValidationMode.BEAST : ValidationMode.DEFAULT;
}

export const BLANK_VIN_BUCKET = "(blank VIN)";

export function getVinBucket(vin: string | null | undefined): string {
	if (!vin) return BLANK_VIN_BUCKET;
	const normalized = normalizeVin(vin);
	return normalized || BLANK_VIN_BUCKET;
}

export function getNormalizedVinBuckets(
	rows: PendingRow[],
): Map<string, PendingRow[]> {
	const buckets = new Map<string, PendingRow[]>();
	for (const row of rows) {
		const bucket = getVinBucket(row.vin);
		if (!buckets.has(bucket)) {
			buckets.set(bucket, []);
		}
		buckets.get(bucket)?.push(row);
	}
	return buckets;
}

export function formatVinForDisplay(vin: string | null | undefined): string {
	if (!vin) return "(blank VIN)";
	const normalized = normalizeVin(vin);
	return normalized || "(blank VIN)";
}

export function hasMixedVinSelection(rows: PendingRow[]): boolean {
	if (rows.length <= 1) return false;
	const firstVin = normalizeVin(rows[0].vin || "");
	return rows.some((row) => normalizeVin(row.vin || "") !== firstVin);
}

/**
 * Maps an internal stage key to a user-friendly display name.
 * @param stage - The internal stage string (e.g. "main", "booking")
 * @returns The professional display name for the UI
 */
export function getStageDisplayName(stage: string | undefined): string {
	if (!stage) return "Unknown Stage";

	const stageMap: Record<string, string> = {
		orders: "Orders",
		main: "Main Sheet",
		booking: "Booking",
		call: "Call List",
		archive: "Archive",
	};

	const lowerStage = stage.toLowerCase();
	if (stageMap[lowerStage]) {
		return stageMap[lowerStage];
	}

	// Fallback to capitalized string
	return stage.charAt(0).toUpperCase() + stage.slice(1);
}
