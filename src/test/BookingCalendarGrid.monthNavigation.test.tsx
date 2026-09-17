import "@testing-library/jest-dom";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BookingCalendarGrid } from "@/components/booking/BookingCalendarGrid";
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
	const view = render(
		<BookingCalendarGrid
			currentMonth={currentMonth}
			selectedDate={currentMonth}
			onMonthChange={onMonthChange}
			onDateSelect={vi.fn()}
			bookingsByDateMap={{} as Record<string, PendingRow[]>}
			searchQuery=""
			searchMatchDates={new Set<string>()}
			activeCustomerDateSet={new Set<string>()}
		/>,
	);

	// The two month chevrons are the first buttons rendered, ahead of the day cells.
	// They carry no accessible name today; naming them is part of the Booking Inquiry
	// accessibility work in #226 and deliberately kept out of this bug fix.
	const buttons = view.container.querySelectorAll("button");
	return { onMonthChange, previous: buttons[0], next: buttons[1] };
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

	it("steps from a leap-year February onto March", () => {
		const { onMonthChange, next } = renderGrid(new Date(2024, 1, 29));

		fireEvent.click(next);

		const received = onMonthChange.mock.calls[0][0] as Date;
		expect(received.getFullYear()).toBe(2024);
		expect(received.getMonth()).toBe(2);
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
