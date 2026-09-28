import { describe, expect, it } from "vitest";
import {
	bookedVehicleKey,
	buildBookingActivityIndex,
	countBookedVehiclesOnDate,
	isBookedVehicleArchived,
	isBookingDateActive,
	toLocalDateKey,
} from "@/domain/booking/bookingInquiry";
import type { PendingRow } from "@/types";

const line = (
	vin: string,
	bookingDate: string | undefined,
	id = `${vin}-${bookingDate}`,
): PendingRow => ({ id, vin, bookingDate }) as PendingRow;

const bookingLine = (
	overrides: Partial<PendingRow> & { id: string },
): PendingRow =>
	({
		vin: "",
		bookingDate: undefined,
		stage: "booking",
		...overrides,
	}) as PendingRow;

describe("bookedVehicleKey", () => {
	it("keys a Booked Vehicle by VIN and Booking Date together", () => {
		expect(bookedVehicleKey("VIN1", "2026-09-16")).toBe("VIN1|2026-09-16");
	});

	it("treats the same VIN on different days as different Booked Vehicles", () => {
		expect(bookedVehicleKey("VIN1", "2026-09-16")).not.toBe(
			bookedVehicleKey("VIN1", "2026-09-17"),
		);
	});

	it("collapses an empty VIN onto a single key, matching existing grouping", () => {
		// PendingRow.vin is z.string().default(""), so an absent VIN arrives empty
		// rather than undefined. The existing calendar already groups these together.
		expect(bookedVehicleKey("", "2026-09-16")).toBe("unknown|2026-09-16");
		expect(bookedVehicleKey(undefined, "2026-09-16")).toBe(
			"unknown|2026-09-16",
		);
	});
});

describe("buildBookingActivityIndex", () => {
	it("marks a date active when it holds an active line", () => {
		const index = buildBookingActivityIndex([line("VIN1", "2026-09-20")]);

		expect(isBookingDateActive(index, "2026-09-20")).toBe(true);
	});

	it("leaves a date with no active lines inactive", () => {
		const index = buildBookingActivityIndex([line("VIN1", "2026-09-20")]);

		expect(isBookingDateActive(index, "2026-09-16")).toBe(false);
	});

	it("treats an archived-only vehicle as archived", () => {
		// Archive lines are never passed in; absence from the index is what marks them.
		const index = buildBookingActivityIndex([]);

		expect(
			isBookedVehicleArchived(index, {
				vin: "VIN9",
				bookingDate: "2026-04-22",
			}),
		).toBe(true);
	});

	it("treats a mixed day as active when one line of a VIN is still active", () => {
		// The same VIN and date may have one line archived and another still in booking.
		// Only the active line reaches the index, and that is enough.
		const index = buildBookingActivityIndex([line("VIN1", "2026-09-16", "a")]);

		expect(isBookingDateActive(index, "2026-09-16")).toBe(true);
		expect(
			isBookedVehicleArchived(index, {
				vin: "VIN1",
				bookingDate: "2026-09-16",
			}),
		).toBe(false);
	});

	it("keeps a second vehicle on a mixed day archived", () => {
		const index = buildBookingActivityIndex([line("VIN1", "2026-09-16")]);

		expect(
			isBookedVehicleArchived(index, {
				vin: "VIN2",
				bookingDate: "2026-09-16",
			}),
		).toBe(true);
	});

	it("ignores lines carrying no Booking Date", () => {
		const index = buildBookingActivityIndex([
			line("VIN1", undefined),
			line("VIN2", ""),
		]);

		expect(index.activeDates.size).toBe(0);
		expect(index.activeVehicles.size).toBe(0);
	});

	it("does not collapse distinct VINs sharing a date", () => {
		const index = buildBookingActivityIndex([
			line("VIN1", "2026-09-20"),
			line("VIN2", "2026-09-20"),
		]);

		expect(index.activeDates.size).toBe(1);
		expect(index.activeVehicles.size).toBe(2);
	});

	it("returns an empty index for no active lines", () => {
		const index = buildBookingActivityIndex([]);

		expect(index.activeDates.size).toBe(0);
		expect(index.activeVehicles.size).toBe(0);
	});
});

describe("toLocalDateKey", () => {
	it("formats a local date as yyyy-MM-dd", () => {
		expect(toLocalDateKey(new Date(2026, 8, 28))).toBe("2026-09-28");
	});

	it("pads single-digit months and days", () => {
		expect(toLocalDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
	});
});

describe("countBookedVehiclesOnDate", () => {
	const TODAY = "2026-09-28";

	it("counts the same VIN with different case or spacing as one customer", () => {
		const count = countBookedVehiclesOnDate(
			[
				bookingLine({ id: "1", vin: " vin1 ", bookingDate: TODAY }),
				bookingLine({ id: "2", vin: "VIN1", bookingDate: TODAY }),
			],
			TODAY,
		);

		expect(count).toBe(1);
	});

	it("counts two blank-VIN lines as two separate customers", () => {
		const count = countBookedVehiclesOnDate(
			[
				bookingLine({ id: "1", vin: "", bookingDate: TODAY }),
				bookingLine({ id: "2", vin: "", bookingDate: TODAY }),
			],
			TODAY,
		);

		expect(count).toBe(2);
	});

	it("excludes lines on other dates", () => {
		const count = countBookedVehiclesOnDate(
			[bookingLine({ id: "1", vin: "VIN1", bookingDate: "2026-09-27" })],
			TODAY,
		);

		expect(count).toBe(0);
	});

	it("excludes lines not in the booking stage", () => {
		const count = countBookedVehiclesOnDate(
			[
				bookingLine({
					id: "1",
					vin: "VIN1",
					bookingDate: TODAY,
					stage: "archive",
				}),
			],
			TODAY,
		);

		expect(count).toBe(0);
	});

	it("matches a legacy bookingDate carrying a trailing timestamp", () => {
		const count = countBookedVehiclesOnDate(
			[
				bookingLine({
					id: "1",
					vin: "VIN1",
					bookingDate: `${TODAY}T10:00:00Z`,
				}),
			],
			TODAY,
		);

		expect(count).toBe(1);
	});

	it("skips a malformed bookingDate rather than mis-scoring it", () => {
		const count = countBookedVehiclesOnDate(
			[bookingLine({ id: "1", vin: "VIN1", bookingDate: "not-a-date" })],
			TODAY,
		);

		expect(count).toBe(0);
	});

	it("returns 0 for an empty list", () => {
		expect(countBookedVehiclesOnDate([], TODAY)).toBe(0);
	});
});
