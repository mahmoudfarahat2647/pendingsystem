import { normalizeVin } from "@/domain/order/orderWorkflow";
import type { PendingRow } from "@/types";

/**
 * Identifies a Booked Vehicle: one VIN on one Booking Date.
 *
 * A customer with two vehicles on the same day is two Booked Vehicles; one vehicle
 * needing four parts is one.
 *
 * `vin` is `z.string().default("")` on PendingRow, so an absent VIN arrives as an empty
 * string rather than undefined. Empty VINs collapse onto a single "unknown" key, matching
 * how the existing calendar already groups them. No booked line lacks a VIN in practice —
 * Beast Mode requires one before a line can reach the booking stage.
 */
export const bookedVehicleKey = (
	vin: string | undefined,
	bookingDate: string | undefined,
): string => `${vin || "unknown"}|${bookingDate || ""}`;

/**
 * Which Booking Dates and Booked Vehicles still have work outstanding.
 *
 * Membership means "Active Booking"; absence means "Archived Booking".
 */
export interface BookingActivityIndex {
	/** Booking Dates holding at least one Active Booking. */
	activeDates: ReadonlySet<string>;
	/** Booked Vehicles (see {@link bookedVehicleKey}) with at least one active line. */
	activeVehicles: ReadonlySet<string>;
}

export const EMPTY_BOOKING_ACTIVITY_INDEX: BookingActivityIndex = {
	activeDates: new Set<string>(),
	activeVehicles: new Set<string>(),
};

/**
 * Builds the activity index from the lines currently in the `booking` stage.
 *
 * Callers must pass lines classified by their source stage query rather than by reading
 * `PendingRow.stage`, which is optional in the schema and therefore unreliable. Every
 * line is considered, not a deduplicated representative: a VIN may have one line archived
 * and another still active on the same Booking Date, and that day is active.
 *
 * See docs/adr/0001-booking-inquiry-distinguishes-by-stage-not-date.md
 */
export const buildBookingActivityIndex = (
	activeBookingLines: readonly PendingRow[],
): BookingActivityIndex => {
	const activeDates = new Set<string>();
	const activeVehicles = new Set<string>();

	for (const line of activeBookingLines) {
		if (!line.bookingDate) continue;
		activeDates.add(line.bookingDate);
		activeVehicles.add(bookedVehicleKey(line.vin, line.bookingDate));
	}

	return { activeDates, activeVehicles };
};

/** True when the given Booking Date holds at least one Active Booking. */
export const isBookingDateActive = (
	index: BookingActivityIndex,
	bookingDate: string,
): boolean => index.activeDates.has(bookingDate);

/** True when the given line's Booked Vehicle is an Archived Booking. */
export const isBookedVehicleArchived = (
	index: BookingActivityIndex,
	line: Pick<PendingRow, "vin" | "bookingDate">,
): boolean =>
	!index.activeVehicles.has(bookedVehicleKey(line.vin, line.bookingDate));

/**
 * The local `yyyy-MM-dd` key for a given moment, in the caller's own timezone.
 *
 * This is the one "today" helper the header badge uses. `Intl`/`Date` local getters
 * (not `toISOString`, which is UTC) keep it consistent with how Booking Dates are
 * written across the app (see `useBookingCalendar`'s `parseLocalDate`).
 */
export const toLocalDateKey = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

/**
 * Counts how many distinct Booked Vehicles fall on a given local date, among lines
 * still in the `booking` stage.
 *
 * Groups by normalized VIN, the same identity as `bookedVehicleKey` with the date
 * already fixed: a customer with two vehicles booked the same day counts as two, not
 * one. A blank VIN never merges with another blank VIN; each such line counts on its
 * own, keyed by row id, so unrelated walk-ins with no VIN on file are never undercounted.
 *
 * Every status still counts: a line stays a "booked today" line for as long as it
 * remains in the `booking` stage on this date, regardless of status text.
 *
 * `bookingDate` is expected as a leading `yyyy-MM-dd`; a value with a trailing
 * timestamp (legacy data) still matches on its date portion. A value that doesn't
 * start with a parseable date is skipped rather than mis-scored.
 */
export const countBookedVehiclesOnDate = (
	lines: readonly PendingRow[],
	dateKey: string,
): number => {
	const vehicles = new Set<string>();

	for (const line of lines) {
		if (line.stage !== "booking") continue;
		const bookingDateKey = line.bookingDate?.slice(0, 10);
		if (!bookingDateKey || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDateKey))
			continue;
		if (bookingDateKey !== dateKey) continue;

		const vin = normalizeVin(line.vin || "");
		vehicles.add(vin ? `vin:${vin}` : `id:${line.id}`);
	}

	return vehicles.size;
};
