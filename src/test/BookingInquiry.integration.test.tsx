import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingSidebarCustomerList } from "@/components/booking/BookingSidebarCustomerList";
import { BookingInquiryModal } from "@/components/shared/BookingInquiryModal";
import type { PendingRow } from "@/types";

/**
 * Integration seam for the Booking Inquiry.
 *
 * Everything below is real — the calendar hook, the activity index, the calendar grid and
 * the customer list. Only the stage queries are mocked, keyed by the stage they are asked
 * for. This is the only seam that covers the chain the feature actually depends on: which
 * query a line came from, through classification, to what is rendered.
 */

interface QueryState {
	isLoading: boolean;
	isError: boolean;
	isSuccess: boolean;
}

const LOADED: QueryState = {
	isLoading: false,
	isError: false,
	isSuccess: true,
};
const FAILED: QueryState = {
	isLoading: false,
	isError: true,
	isSuccess: false,
};
const LOADING: QueryState = {
	isLoading: true,
	isError: false,
	isSuccess: false,
};
/** Neither loading nor errored, but not successful either — e.g. paused offline. */
const PAUSED: QueryState = {
	isLoading: false,
	isError: false,
	isSuccess: false,
};

// Status is per stage, not shared. A single shared status object cannot express a
// mixed state, so a test claiming "archive succeeds while booking fails" would
// silently fail both instead.
const queryMocks = vi.hoisted(() => ({
	rowsByStage: {} as Record<string, PendingRow[]>,
	stateByStage: {} as Record<
		string,
		{ isLoading: boolean; isError: boolean; isSuccess: boolean }
	>,
	refetch: vi.fn(),
}));

vi.mock("@/hooks/queries/useOrdersQuery", () => ({
	useOrdersQuery: (stage: string) => {
		const state = queryMocks.stateByStage[stage] ?? {
			isLoading: false,
			isError: false,
			isSuccess: true,
		};
		return {
			data: queryMocks.rowsByStage[stage] ?? [],
			isLoading: state.isLoading,
			isError: state.isError,
			isSuccess: state.isSuccess,
			refetch: queryMocks.refetch,
		};
	},
}));

const setStages = (booking: QueryState, archive: QueryState) => {
	queryMocks.stateByStage = { booking, archive };
};

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
		open ? <div data-testid="inquiry-dialog">{children}</div> : null,
	DialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const row = (
	over: Partial<PendingRow> & { id: string; vin: string; bookingDate: string },
): PendingRow =>
	({
		customerName: `Customer ${over.vin}`,
		description: "A part",
		...over,
	}) as PendingRow;

const renderInquiry = () =>
	render(<BookingInquiryModal open={true} onOpenChange={vi.fn()} />);

/** The 16th is "today" in every test below. */
const dayCell = (label: RegExp) => screen.getByLabelText(label);

describe("Booking Inquiry (integration)", () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		vi.setSystemTime(new Date(2026, 8, 16, 9, 0, 0));
		queryMocks.rowsByStage = {};
		setStages(LOADED, LOADED);
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("classification by source query", () => {
		it("marks a day holding a booking-stage line as active", () => {
			queryMocks.rowsByStage = {
				booking: [row({ id: "b1", vin: "VIN1", bookingDate: "2026-09-16" })],
				archive: [],
			};

			renderInquiry();

			const badge = within(dayCell(/16 September 2026/)).getByText("1");
			expect(badge.className).toContain("bg-renault-yellow");
			expect(badge.className).not.toContain("border-dashed");
		});

		it("marks a day holding only archive-stage lines as archived", () => {
			queryMocks.rowsByStage = {
				booking: [],
				archive: [row({ id: "a1", vin: "VIN2", bookingDate: "2026-09-16" })],
			};

			renderInquiry();

			const badge = within(dayCell(/16 September 2026/)).getByText("1");
			expect(badge.className).toContain("border-dashed");
			expect(badge.className).not.toContain("bg-renault-yellow");
		});

		it("marks a mixed day active when one line of the VIN is still in booking", () => {
			// Same VIN, same date, one line archived and one still active. The
			// deduplicated representative could be either, so the day must be judged
			// across all lines.
			queryMocks.rowsByStage = {
				booking: [row({ id: "b1", vin: "VIN3", bookingDate: "2026-09-16" })],
				archive: [row({ id: "a1", vin: "VIN3", bookingDate: "2026-09-16" })],
			};

			renderInquiry();

			const badge = within(dayCell(/16 September 2026/)).getByText("1");
			expect(badge.className).toContain("bg-renault-yellow");
		});

		it("counts Booked Vehicles, not parts", () => {
			queryMocks.rowsByStage = {
				booking: [
					row({ id: "b1", vin: "VIN4", bookingDate: "2026-09-16" }),
					row({ id: "b2", vin: "VIN4", bookingDate: "2026-09-16" }),
					row({ id: "b3", vin: "VIN5", bookingDate: "2026-09-16" }),
				],
				archive: [],
			};

			renderInquiry();

			expect(
				within(dayCell(/16 September 2026/)).getByText("2"),
			).toBeInTheDocument();
		});

		it("keeps an Active Booking whose date has passed marked active", () => {
			// 10 September is in the past relative to the 16th, but the line is still
			// in the booking stage: overdue work, not finished work.
			queryMocks.rowsByStage = {
				booking: [row({ id: "b1", vin: "VIN6", bookingDate: "2026-09-10" })],
				archive: [],
			};

			renderInquiry();

			const badge = within(dayCell(/10 September 2026/)).getByText("1");
			expect(badge.className).toContain("bg-renault-yellow");
		});
	});

	describe("the customer list", () => {
		it("tags an archived vehicle", () => {
			queryMocks.rowsByStage = {
				booking: [],
				archive: [row({ id: "a1", vin: "VIN7", bookingDate: "2026-09-16" })],
			};

			renderInquiry();

			expect(screen.getByText("Archived")).toBeInTheDocument();
		});

		it("does not tag an active vehicle", () => {
			queryMocks.rowsByStage = {
				booking: [row({ id: "b1", vin: "VIN8", bookingDate: "2026-09-16" })],
				archive: [],
			};

			renderInquiry();

			expect(screen.queryByText("Archived")).not.toBeInTheDocument();
		});
	});

	describe("navigation", () => {
		it("does not move the selected day when a customer is selected", () => {
			// VIN9 is booked on the 16th and again on the 20th. Selecting it must not
			// throw the calendar forward to the 20th — the whole point of a date-first
			// inquiry is that the chosen day stays chosen.
			queryMocks.rowsByStage = {
				booking: [row({ id: "b2", vin: "VIN9", bookingDate: "2026-09-20" })],
				archive: [row({ id: "a1", vin: "VIN9", bookingDate: "2026-09-16" })],
			};

			renderInquiry();

			// The name also appears in the details panel; target the list entry.
			fireEvent.click(screen.getByText(/Customer VIN9/, { selector: "bdi" }));

			expect(dayCell(/16 September 2026/)).toHaveAttribute(
				"aria-current",
				"date",
			);
			expect(dayCell(/20 September 2026/)).not.toHaveAttribute("aria-current");
		});
	});

	describe("a day with nothing booked", () => {
		it("says so plainly rather than looking broken", () => {
			// The most common state the modal opens into: most days have no bookings.
			queryMocks.rowsByStage = {
				booking: [row({ id: "b1", vin: "VIN11", bookingDate: "2026-09-20" })],
				archive: [],
			};

			renderInquiry();

			expect(screen.getByText(/no bookings found/i)).toBeInTheDocument();
			expect(screen.getByText(/select a customer/i)).toBeInTheDocument();
			// The 16th carries no badge; the 20th still does.
			expect(
				within(dayCell(/16 September 2026/)).queryByText("1"),
			).not.toBeInTheDocument();
			expect(
				within(dayCell(/20 September 2026/)).getByText("1"),
			).toBeInTheDocument();
		});
	});

	describe("the booking flow is unaffected when inquiry props are omitted", () => {
		const bookingFlowList = (extra: Record<string, unknown> = {}) =>
			render(
				<BookingSidebarCustomerList
					searchQuery=""
					sidebarGroupedBookings={[
						row({ id: "x1", vin: "VIN12", bookingDate: "2026-09-16" }),
					]}
					selectedBookingId={null}
					setSelectedBookingId={vi.fn()}
					{...extra}
				/>,
			);

		it("renders no Archived tag", () => {
			bookingFlowList();

			expect(screen.queryByText("Archived")).not.toBeInTheDocument();
		});

		it("renders the customer name without bidi isolation", () => {
			// Inquiry wraps names in <bdi> so the adjacent Archived tag cannot reorder
			// the line. With the props omitted that markup must not appear.
			const { container } = bookingFlowList();

			expect(container.querySelector("bdi")).toBeNull();
			expect(screen.getByText("Customer VIN12")).toBeInTheDocument();
		});

		it("adds the isolation only once inquiry props are supplied", () => {
			const { container } = bookingFlowList({
				activeVehicleKeys: new Set<string>(),
			});

			expect(container.querySelector("bdi")).not.toBeNull();
		});
	});

	describe("incomplete data", () => {
		/** An archived vehicle that would be tagged if classification were trusted. */
		const archivedOnly = () => {
			queryMocks.rowsByStage = {
				booking: [],
				archive: [row({ id: "a1", vin: "VIN10", bookingDate: "2026-09-16" })],
			};
		};

		it("refuses to classify anything while loading", () => {
			archivedOnly();
			setStages(LOADING, LOADED);

			renderInquiry();

			expect(screen.getByText(/loading bookings/i)).toBeInTheDocument();
			expect(screen.queryByText("Archived")).not.toBeInTheDocument();
		});

		it("refuses to mark anything archived when the booking query alone fails", () => {
			// The genuinely mixed case: archive succeeded and holds rows, booking
			// failed. Absent the completeness gate, every vehicle would be classified
			// as finished work purely because the active set could not be fetched.
			archivedOnly();
			setStages(FAILED, LOADED);

			renderInquiry();

			expect(screen.getByText(/incomplete data/i)).toBeInTheDocument();
			expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
			expect(screen.queryByText("Archived")).not.toBeInTheDocument();
		});

		it("refuses to mark anything archived when the booking query is merely unsuccessful", () => {
			// Neither loading nor errored, but not successful — a query paused while
			// offline. This is the state that fell through the old "not loading and
			// not errored" gate and rendered every booked day as archived.
			archivedOnly();
			setStages(PAUSED, LOADED);

			renderInquiry();

			expect(screen.getByText(/incomplete data/i)).toBeInTheDocument();
			expect(screen.getByText(/has not finished loading/i)).toBeInTheDocument();
			expect(screen.queryByText("Archived")).not.toBeInTheDocument();
		});

		it("refuses to classify when the archive query alone fails", () => {
			queryMocks.rowsByStage = {
				booking: [row({ id: "b1", vin: "VIN11", bookingDate: "2026-09-16" })],
				archive: [],
			};
			setStages(LOADED, FAILED);

			renderInquiry();

			expect(screen.getByText(/incomplete data/i)).toBeInTheDocument();
		});

		it("offers a retry that refetches", () => {
			setStages(FAILED, LOADED);

			renderInquiry();
			fireEvent.click(screen.getByRole("button", { name: /retry/i }));

			expect(queryMocks.refetch).toHaveBeenCalled();
		});

		it("retries a query that is unsuccessful without having errored", () => {
			setStages(PAUSED, LOADED);

			renderInquiry();
			fireEvent.click(screen.getByRole("button", { name: /retry/i }));

			expect(queryMocks.refetch).toHaveBeenCalled();
		});
	});
});
