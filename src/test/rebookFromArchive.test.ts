import { describe, expect, it } from "vitest";
import {
	isExpiredWarrantyRow,
	isProtectedRebook,
} from "@/domain/order/warranty";
import { buildArchivePayload } from "@/lib/archivePayloadBuilder";
import { buildFreezePayload } from "@/lib/freezePayloadBuilder";
import {
	buildBookingCommands,
	buildMoveToMainUpdates,
	buildRebookingCommands,
	buildReorderUpdates,
	buildUnfreezeCommands,
} from "@/lib/orderStageTransitions";
import { PendingRowSchema } from "@/schemas/order.schema";
import type { PendingRow } from "@/types";

const row = (overrides: Partial<PendingRow> = {}): PendingRow =>
	({
		id: "r1",
		parts: [],
		vin: "VIN1",
		stage: "archive",
		noteHistory: "",
		...overrides,
	}) as unknown as PendingRow;

describe("rebookedFromArchive flag (#332)", () => {
	describe("set on entry to Booking", () => {
		it("buildBookingCommands sets true from archive", () => {
			const [cmd] = buildBookingCommands([row()], "archive", "2026-10-01", "n");
			expect(cmd?.updates.rebookedFromArchive).toBe(true);
		});

		it.each([
			"main",
			"call",
			"orders",
		] as const)("buildBookingCommands sets null from %s", (source) => {
			const [cmd] = buildBookingCommands(
				[row({ stage: source, rebookedFromArchive: true })],
				source,
				"2026-10-01",
				"n",
			);
			expect(cmd?.updates).toHaveProperty("rebookedFromArchive", null);
		});

		it("buildUnfreezeCommands clears it, so unfreezing into Booking is not protected", () => {
			const [cmd] = buildUnfreezeCommands(
				[row({ stage: "freeze", rebookedFromArchive: true })],
				"booking",
			);
			expect(cmd?.updates).toHaveProperty("rebookedFromArchive", null);
		});

		it("buildRebookingCommands (booking→booking) leaves the flag untouched", () => {
			const [cmd] = buildRebookingCommands(
				[row({ stage: "booking", rebookedFromArchive: true })],
				"2026-10-02",
				"n",
			);
			expect(cmd?.updates).not.toHaveProperty("rebookedFromArchive");
		});
	});

	describe("cleared on exit from Booking", () => {
		const flagged = row({ stage: "booking", rebookedFromArchive: true });

		it("archive payload clears it", () => {
			expect(buildArchivePayload(flagged, "r")).toHaveProperty(
				"rebookedFromArchive",
				null,
			);
		});

		it("freeze payload clears it", () => {
			expect(buildFreezePayload(flagged, "r", "booking")).toHaveProperty(
				"rebookedFromArchive",
				null,
			);
		});

		it("reorder updates clear it", () => {
			expect(buildReorderUpdates(flagged, "r")).toHaveProperty(
				"rebookedFromArchive",
				null,
			);
		});

		it.each([
			"booking",
			"archive",
		] as const)("move-to-main updates from %s clear it", (source) => {
			expect(buildMoveToMainUpdates(flagged, source)).toHaveProperty(
				"rebookedFromArchive",
				null,
			);
		});
	});

	describe("domain predicates", () => {
		it("isProtectedRebook is true only for a flagged Booking row", () => {
			expect(
				isProtectedRebook({ stage: "booking", rebookedFromArchive: true }),
			).toBe(true);
			expect(
				isProtectedRebook({ stage: "booking", rebookedFromArchive: null }),
			).toBe(false);
			expect(isProtectedRebook({ stage: "booking" })).toBe(false);
			expect(
				isProtectedRebook({ stage: "call", rebookedFromArchive: true }),
			).toBe(false);
		});

		it("isExpiredWarrantyRow matches the sweep rule", () => {
			const base = {
				repairSystem: "ضمان",
				startWarranty: "",
				endWarranty: "2000-01-01",
			};
			expect(isExpiredWarrantyRow(base)).toBe(true);
			expect(isExpiredWarrantyRow({ ...base, repairSystem: "عادي" })).toBe(
				false,
			);
			expect(isExpiredWarrantyRow({ ...base, endWarranty: "2999-01-01" })).toBe(
				false,
			);
			expect(isExpiredWarrantyRow({ ...base, endWarranty: "" })).toBe(false);
		});
	});

	describe("schema read-back", () => {
		it.each([
			true,
			null,
		])("PendingRowSchema keeps rebookedFromArchive=%s", (value) => {
			const parsed = PendingRowSchema.parse({
				id: "r1",
				parts: [],
				rebookedFromArchive: value,
			});
			expect(parsed.rebookedFromArchive).toBe(value);
		});
	});
});
