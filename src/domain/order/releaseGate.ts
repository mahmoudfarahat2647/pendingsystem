/**
 * Release gate: chassis-level safety check before any row moves into Call List.
 *
 * A chassis requires a typed "release" confirmation only when, on at least one
 * of its rows, BOTH of these hold together:
 *   1. repairSystem.trim() === WARRANTY_REPAIR_SYSTEM ("ضمان")
 *   2. mileage (cntrRdg) is a valid, present numeric value strictly below
 *      RELEASE_MILEAGE_THRESHOLD_KM.
 *
 * `PendingRow.cntrRdgProvided` preserves whether the original mileage field
 * was present, so a genuine numeric 0 remains distinguishable from blank.
 *
 * See issue #242.
 */
import { normalizeVin } from "@/domain/order/orderWorkflow";
import type { PendingRow, ReleaseAuthorization } from "@/types";

export const WARRANTY_REPAIR_SYSTEM = "ضمان";
export const RELEASE_MILEAGE_THRESHOLD_KM = 5_000;
export const RELEASE_CONFIRMATION_WORD = "release";
export const RELEASE_FOLLOW_UP_MONTHS = 2;

/** True only when mileage is present and a valid non-negative number (not blank, not NaN). */
export function hasValidMileage(
	row: Pick<PendingRow, "cntrRdg"> &
		Partial<Pick<PendingRow, "cntrRdgProvided">>,
): boolean {
	const value = row.cntrRdg;
	return (
		row.cntrRdgProvided !== false &&
		typeof value === "number" &&
		Number.isFinite(value) &&
		value >= 0
	);
}

/** Warranty AND valid mileage AND mileage < threshold — evaluated together on one row. */
export function rowRequiresRelease(
	row: Pick<PendingRow, "repairSystem" | "cntrRdg"> &
		Partial<Pick<PendingRow, "cntrRdgProvided">>,
): boolean {
	const repairSystem = (row.repairSystem ?? "").trim();
	if (repairSystem !== WARRANTY_REPAIR_SYSTEM) return false;
	if (!hasValidMileage(row)) return false;
	return row.cntrRdg < RELEASE_MILEAGE_THRESHOLD_KM;
}

export interface ReleaseChassis {
	/** Normalized VIN (trim + uppercase). */
	vin: string;
	/** Display-safe VIN, e.g. "(blank VIN)" fallback. */
	displayVin: string;
	/** Mileage of the row that established qualification. */
	mileage: number;
	/** Mileage formatted for display, e.g. "4,999". */
	formattedMileage: string;
	/** Every row id for this VIN present in the attempted move. */
	rowIds: string[];
	/** The qualifying row's id — used for notification navigation. */
	referenceRowId: string;
}

/**
 * Group the given rows by normalized VIN and return one ReleaseChassis per
 * VIN where at least one row satisfies `rowRequiresRelease`. Rows with a
 * blank VIN are never grouped together (each blank-VIN row is its own group)
 * so an unrelated blank-VIN row can never combine with another to qualify.
 */
export function getQualifyingChassis(rows: PendingRow[]): ReleaseChassis[] {
	const groups = new Map<string, PendingRow[]>();
	let blankIndex = 0;

	for (const row of rows) {
		const normalized = normalizeVin(row.vin || "");
		const key = normalized ? normalized : `__blank_${blankIndex++}__`;
		const existing = groups.get(key);
		if (existing) {
			existing.push(row);
		} else {
			groups.set(key, [row]);
		}
	}

	const chassisList: ReleaseChassis[] = [];
	for (const [key, groupRows] of groups) {
		const qualifyingRow = groupRows.find((row) => rowRequiresRelease(row));
		if (!qualifyingRow) continue;

		chassisList.push({
			vin: key.startsWith("__blank_") ? "" : key,
			displayVin: qualifyingRow.vin?.trim()
				? normalizeVin(qualifyingRow.vin)
				: "(blank VIN)",
			mileage: qualifyingRow.cntrRdg,
			formattedMileage: qualifyingRow.cntrRdg.toLocaleString(),
			rowIds: groupRows.map((row) => row.id),
			referenceRowId: qualifyingRow.id,
		});
	}

	return chassisList;
}

/**
 * Add N calendar months to a date, matching JS `Date` month-end clamping
 * (e.g. Jan 31 + 1 month -> Feb 28/29, not Mar 3).
 */
export function addCalendarMonths(date: Date, months: number): Date {
	const result = new Date(date.getTime());
	const targetMonth = result.getMonth() + months;
	result.setMonth(targetMonth);
	// If the day overflowed into the following month (e.g. Jan 31 -> Mar 3),
	// clamp back to the last day of the intended target month.
	if (result.getMonth() !== ((targetMonth % 12) + 12) % 12) {
		result.setDate(0);
	}
	return result;
}

/** Two-calendar-month follow-up due date from `from` (defaults to now). */
export function computeReleaseFollowUpDueDate(from: Date = new Date()): Date {
	return addCalendarMonths(from, RELEASE_FOLLOW_UP_MONTHS);
}

/**
 * Fingerprints the affected rows' ids plus the exact values the release
 * decision depended on (VIN, repair system, mileage). A draft command's
 * `releaseAuthorization.fingerprint` must match this recomputed value before
 * the authorization is honored — otherwise the underlying data changed since
 * the user typed "release" and the authorization is stale (issue #242 §4).
 */
export function computeReleaseFingerprint(
	rows: Pick<
		PendingRow,
		| "id"
		| "vin"
		| "repairSystem"
		| "cntrRdg"
		| "cntrRdgProvided"
		| "partNumber"
		| "parts"
	>[],
): string {
	const parts = rows
		.map((row) => {
			const partNumbers = [
				row.partNumber ?? "",
				...(row.parts ?? []).map((part) => part.partNumber ?? ""),
			]
				.map((partNumber) => partNumber.trim())
				.filter(Boolean)
				.sort()
				.join(",");
			return `${row.id}:${normalizeVin(row.vin || "")}:${(row.repairSystem ?? "").trim()}:${row.cntrRdg}:${row.cntrRdgProvided !== false}:${partNumbers}`;
		})
		.sort();
	return parts.join("|");
}

/** Builds a `ReleaseAuthorization` for the exact rows that were just released. */
export function buildReleaseAuthorization(
	rows: PendingRow[],
	vins: string[],
): ReleaseAuthorization {
	return {
		vins,
		fingerprint: computeReleaseFingerprint(rows),
		grantedAt: Date.now(),
	};
}

/** True when the current rows do not need release, or the authorization still exactly covers them. */
export function releaseAuthorizationCoversRows(
	rows: PendingRow[],
	authorization?: ReleaseAuthorization,
): boolean {
	const qualifying = getQualifyingChassis(rows);
	if (qualifying.length === 0) return true;
	if (!authorization) return false;

	const authorizedVins = new Set(authorization.vins);
	return (
		authorization.fingerprint === computeReleaseFingerprint(rows) &&
		qualifying.every((chassis) => authorizedVins.has(chassis.vin))
	);
}
