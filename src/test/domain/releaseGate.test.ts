import { describe, expect, it } from "vitest";
import {
	addCalendarMonths,
	computeReleaseFingerprint,
	getQualifyingChassis,
	hasValidMileage,
	RELEASE_MILEAGE_THRESHOLD_KM,
	rowRequiresRelease,
	WARRANTY_REPAIR_SYSTEM,
} from "@/domain/order/releaseGate";
import type { PendingRow } from "@/types";

function createRow(overrides: Partial<PendingRow> = {}): PendingRow {
	return {
		id: "row-1",
		baseId: "row-1",
		trackingId: "ORD-1",
		customerName: "Test Customer",
		company: "Renault",
		vin: "VF1RFA00000000001",
		mobile: "01000000000",
		cntrRdg: 4999,
		model: "Megane",
		parts: [],
		sabNumber: "",
		acceptedBy: "",
		requester: "",
		partNumber: "PN-001",
		description: "Brake pad",
		quantity: 1,
		status: "Pending",
		rDate: "",
		repairSystem: WARRANTY_REPAIR_SYSTEM,
		startWarranty: "",
		endWarranty: "",
		remainTime: "",
		stage: "main",
		...overrides,
	} as PendingRow;
}

describe("hasValidMileage", () => {
	it("treats a genuine numeric 0 as valid", () => {
		expect(hasValidMileage({ cntrRdg: 0, cntrRdgProvided: true })).toBe(true);
	});
	it("treats a normalized blank 0 as not present", () => {
		expect(hasValidMileage({ cntrRdg: 0, cntrRdgProvided: false })).toBe(false);
	});
	it("treats NaN as invalid", () => {
		expect(hasValidMileage({ cntrRdg: Number.NaN })).toBe(false);
	});
	it("treats a positive number as valid", () => {
		expect(hasValidMileage({ cntrRdg: 4999 })).toBe(true);
	});
});

describe("rowRequiresRelease", () => {
	it("warranty + 4999 -> requires release", () => {
		expect(
			rowRequiresRelease({
				repairSystem: WARRANTY_REPAIR_SYSTEM,
				cntrRdg: 4999,
			}),
		).toBe(true);
	});

	it("warranty + 5000 -> no release (boundary, not below threshold)", () => {
		expect(
			rowRequiresRelease({
				repairSystem: WARRANTY_REPAIR_SYSTEM,
				cntrRdg: RELEASE_MILEAGE_THRESHOLD_KM,
			}),
		).toBe(false);
	});

	it("warranty + 5001 -> no release", () => {
		expect(
			rowRequiresRelease({
				repairSystem: WARRANTY_REPAIR_SYSTEM,
				cntrRdg: 5001,
			}),
		).toBe(false);
	});

	it("warranty + genuine 0 -> requires release", () => {
		expect(
			rowRequiresRelease({
				repairSystem: WARRANTY_REPAIR_SYSTEM,
				cntrRdg: 0,
				cntrRdgProvided: true,
			}),
		).toBe(true);
	});

	it("warranty + blank normalized to 0 -> no release", () => {
		expect(
			rowRequiresRelease({
				repairSystem: WARRANTY_REPAIR_SYSTEM,
				cntrRdg: 0,
				cntrRdgProvided: false,
			}),
		).toBe(false);
	});

	it("warranty + NaN -> no release", () => {
		expect(
			rowRequiresRelease({
				repairSystem: WARRANTY_REPAIR_SYSTEM,
				cntrRdg: Number.NaN,
			}),
		).toBe(false);
	});

	it("non-warranty + 4999 -> no release", () => {
		expect(rowRequiresRelease({ repairSystem: "Cash", cntrRdg: 4999 })).toBe(
			false,
		);
	});

	it("is an AND, not an OR", () => {
		expect(rowRequiresRelease({ repairSystem: "Cash", cntrRdg: 0 })).toBe(
			false,
		);
		expect(
			rowRequiresRelease({
				repairSystem: WARRANTY_REPAIR_SYSTEM,
				cntrRdg: 6000,
			}),
		).toBe(false);
	});
});

describe("getQualifyingChassis", () => {
	it("groups multiple rows of the same VIN into one chassis decision", () => {
		const rows = [
			createRow({ id: "a", vin: "vf1rfa00000000001", cntrRdg: 4999 }),
			createRow({ id: "b", vin: "VF1RFA00000000001", cntrRdg: 4999 }),
		];
		const result = getQualifyingChassis(rows);
		expect(result).toHaveLength(1);
		expect(result[0].rowIds.sort()).toEqual(["a", "b"]);
		expect(result[0].vin).toBe("VF1RFA00000000001");
	});

	it("formats mileage for display (e.g. 4,999)", () => {
		const result = getQualifyingChassis([createRow({ cntrRdg: 4999 })]);
		expect(result[0].formattedMileage).toBe("4,999");
	});

	it("returns nothing when no row qualifies", () => {
		const rows = [createRow({ repairSystem: "Cash" })];
		expect(getQualifyingChassis(rows)).toHaveLength(0);
	});

	it("does not combine warranty from one row with under-5000 from an unrelated inconsistent row", () => {
		// Same VIN, but neither row alone satisfies both halves.
		const rows = [
			createRow({
				id: "a",
				vin: "VF1RFA00000000001",
				repairSystem: WARRANTY_REPAIR_SYSTEM,
				cntrRdg: 9000, // warranty but not under threshold
			}),
			createRow({
				id: "b",
				vin: "VF1RFA00000000001",
				repairSystem: "Cash",
				cntrRdg: 1000, // under threshold but not warranty
			}),
		];
		expect(getQualifyingChassis(rows)).toHaveLength(0);
	});

	it("never groups distinct blank-VIN rows together", () => {
		const rows = [
			createRow({ id: "a", vin: "" }),
			createRow({ id: "b", vin: "" }),
		];
		const result = getQualifyingChassis(rows);
		expect(result).toHaveLength(2);
		expect(result[0].rowIds).toEqual(["a"]);
		expect(result[1].rowIds).toEqual(["b"]);
	});
});

describe("addCalendarMonths", () => {
	it("adds two calendar months to an ordinary date", () => {
		const result = addCalendarMonths(new Date(2026, 0, 15), 2);
		expect(result.getFullYear()).toBe(2026);
		expect(result.getMonth()).toBe(2); // March
		expect(result.getDate()).toBe(15);
	});

	it("clamps month-end overflow (Jan 31 + 1 month -> Feb 28)", () => {
		const result = addCalendarMonths(new Date(2026, 0, 31), 1);
		expect(result.getMonth()).toBe(1); // February
		expect(result.getDate()).toBe(28);
	});

	it("clamps for a leap year (Jan 31 2028 + 1 month -> Feb 29)", () => {
		const result = addCalendarMonths(new Date(2028, 0, 31), 1);
		expect(result.getMonth()).toBe(1);
		expect(result.getDate()).toBe(29);
	});
});

describe("computeReleaseFingerprint", () => {
	it("is stable regardless of row order", () => {
		const rowA = createRow({ id: "a" });
		const rowB = createRow({ id: "b" });
		expect(computeReleaseFingerprint([rowA, rowB])).toBe(
			computeReleaseFingerprint([rowB, rowA]),
		);
	});

	it("changes when mileage changes", () => {
		const row = createRow({ id: "a", cntrRdg: 4999 });
		const changed = createRow({ id: "a", cntrRdg: 5000 });
		expect(computeReleaseFingerprint([row])).not.toBe(
			computeReleaseFingerprint([changed]),
		);
	});

	it("changes when an affected part number changes", () => {
		const row = createRow({ id: "a", partNumber: "PN-001" });
		const changed = createRow({ id: "a", partNumber: "PN-002" });
		expect(computeReleaseFingerprint([row])).not.toBe(
			computeReleaseFingerprint([changed]),
		);
	});
});
