import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BookingCalendarGrid } from "@/components/booking/BookingCalendarGrid";
import { EMPTY_BOOKING_ACTIVITY_INDEX } from "@/domain/booking/bookingInquiry";
import type { PendingRow } from "@/types";

/**
 * Regression tests for issue #227.
 *
 * Month navigation used to call `currentMonth.setMonth(currentMonth.getMonth() ± 1)`,
 * which both mutated the date passed in as a prop and preserved the day number — so
 * stepping forward from 31 January produced "31 February", which JavaScript normalises
 * into March. February was unreachable by forward navigation from a 31st.
 */

const renderGrid = (currentMonth: Date, onMonthChange = vi.fn()) => {
	render(
		<BookingCalendarGrid
			currentMonth={currentMonth}
			selectedDate={currentMonth}
			onMonthChange={onMonthChange}
			onDateSelect={vi.fn()}
			bookingsByDateMap={{} as Record<string, PendingRow[]>}
			searchQuery=""
			searchMatchDates={new Set<string>()}
			activeCustomerDateSet={new Set<string>()}
			activityIndex={EMPTY_BOOKING_ACTIVITY_INDEX}
		/>,
	);

	return {
		onMonthChange,
		previous: screen.getByRole("button", { name: /previous month/i }),
		next: screen.getByRole("button", { name: /next month/i }),
	};
};

describe("BookingCalendarGrid month navigation", () => {
	it("lands on February when stepping forward from 31 January", () => {
		const { onMonthChange, next } = renderGrid(new Date(2026, 0, 31));

		fireEvent.click(next);

		const received = onMonthChange.mock.calls[0][0] as Date;
		expect(received.getFullYear()).toBe(2026);
		expect(received.getMonth()).toBe(1); // February, not March
	});

	it("lands on December when stepping back from 31 January", () => {
		const { onMonthChange, previous } = renderGrid(new Date(2026, 0, 31));

		fireEvent.click(previous);

		const received = onMonthChange.mock.calls[0][0] as Date;
		expect(received.getFullYear()).toBe(2025);
		expect(received.getMonth()).toBe(11);
	});

	it("lands on February when stepping back from 31 March", () => {
		const { onMonthChange, previous } = renderGrid(new Date(2026, 2, 31));

		fireEvent.click(previous);

		const received = onMonthChange.mock.calls[0][0] as Date;
		expect(received.getMonth()).toBe(1);
	});

	it("lands on a leap-year February when stepping back from 31 March", () => {
		// The leap year has to be the *target*, not the origin, for this to guard
		// anything. Stepping forward from 29 February gives "29 March" under the old
		// implementation too — no overflow, so such a test passes either way.
		// Going backward from 31 March asks for "31 February", which the old code
		// normalised to 2 March in a leap year.
		const { onMonthChange, previous } = renderGrid(new Date(2024, 2, 31));

		fireEvent.click(previous);

		const received = onMonthChange.mock.calls[0][0] as Date;
		expect(received.getFullYear()).toBe(2024);
		expect(received.getMonth()).toBe(1);
	});

	it("does not mutate the date passed in as a prop", () => {
		const currentMonth = new Date(2026, 0, 31);
		const before = currentMonth.getTime();
		const { next } = renderGrid(currentMonth);

		fireEvent.click(next);

		expect(currentMonth.getTime()).toBe(before);
	});

	it("keeps stepping forward one month at a time from a 31st", () => {
		// Two consecutive clicks from the same rendered grid must not compound the
		// old overflow: January -> February, never January -> March.
		const { onMonthChange, next } = renderGrid(new Date(2026, 0, 31));

		fireEvent.click(next);
		fireEvent.click(next);

		const [first, second] = onMonthChange.mock.calls.map(
			(call) => call[0] as Date,
		);
		expect(first.getMonth()).toBe(1);
		expect(second.getMonth()).toBe(1);
	});
});
