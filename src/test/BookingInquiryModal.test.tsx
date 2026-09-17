import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingInquiryModal } from "@/components/shared/BookingInquiryModal";
import { EMPTY_BOOKING_ACTIVITY_INDEX } from "@/domain/booking/bookingInquiry";
import type { PendingRow } from "@/types";

const inquiryMocks = vi.hoisted(() => ({
	calendarState: {
		currentMonth: new Date(2026, 8, 17),
		setCurrentMonth: vi.fn(),
		selectedDate: new Date(2026, 8, 17),
		bookingNote: "",
		setBookingNote: vi.fn(),
		preBookingStatus: "",
		setPreBookingStatus: vi.fn(),
		searchQuery: "",
		setSearchQuery: vi.fn(),
		selectedBookingId: null as string | null,
		setSelectedBookingId: vi.fn(),
		searchMatchDates: new Set<string>(),
		bookingsByDateMap: {} as Record<string, PendingRow[]>,
		bookingActivityIndex: {
			activeDates: new Set<string>(),
			activeVehicles: new Set<string>(),
		},
		sidebarGroupedBookings: [] as PendingRow[],
		activeBookingRep: undefined as PendingRow | undefined,
		activeCustomerBookings: [] as PendingRow[],
		consolidatedNotes: [] as string[],
		activeCustomerHistoryDates: [] as string[],
		handleDateSelect: vi.fn(),
		isDateInPast: false,
		isLoadingBookings: false,
		hasBookingLoadError: false,
		isBookingDataComplete: true,
		retryBookingLoad: vi.fn(),
	},
	useBookingCalendar: vi.fn(),
}));

vi.mock("@/components/booking/hooks/useBookingCalendar", () => ({
	useBookingCalendar: (options: unknown) => {
		inquiryMocks.useBookingCalendar(options);
		return inquiryMocks.calendarState;
	},
}));

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

const renderInquiry = (onOpenChange = vi.fn()) =>
	render(<BookingInquiryModal open={true} onOpenChange={onOpenChange} />);

describe("BookingInquiryModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		Object.assign(inquiryMocks.calendarState, {
			sidebarGroupedBookings: [],
			activeBookingRep: undefined,
			activeCustomerBookings: [],
			activeCustomerHistoryDates: [],
			isLoadingBookings: false,
			hasBookingLoadError: false,
			isBookingDataComplete: true,
			bookingActivityIndex: EMPTY_BOOKING_ACTIVITY_INDEX,
		});
	});

	describe("the read-only contract", () => {
		it("renders no confirm control", () => {
			renderInquiry();

			expect(
				screen.queryByRole("button", { name: /confirm/i }),
			).not.toBeInTheDocument();
		});

		it("renders no booking checklist", () => {
			renderInquiry();

			expect(screen.queryByText(/required checks/i)).not.toBeInTheDocument();
			expect(screen.queryByText(/warranty expired/i)).not.toBeInTheDocument();
		});

		it("renders no note entry", () => {
			renderInquiry();

			expect(
				screen.queryByPlaceholderText(/add initial note/i),
			).not.toBeInTheDocument();
			expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
		});

		it("gives no control a tooltip", () => {
			const { container } = renderInquiry();

			expect(container.querySelector("[title]")).toBeNull();
		});
	});

	describe("navigation", () => {
		it("asks the calendar to suppress the history jump", () => {
			renderInquiry();

			expect(inquiryMocks.useBookingCalendar).toHaveBeenCalledWith(
				expect.objectContaining({ suppressHistoryJump: true }),
			);
		});
	});

	describe("data states", () => {
		it("shows a loading state distinct from an empty day", () => {
			inquiryMocks.calendarState.isLoadingBookings = true;

			renderInquiry();

			expect(screen.getByText(/loading bookings/i)).toBeInTheDocument();
			expect(screen.queryByText(/no bookings found/i)).not.toBeInTheDocument();
		});

		it("shows an incomplete-data state with a retry when loading fails", () => {
			inquiryMocks.calendarState.hasBookingLoadError = true;
			inquiryMocks.calendarState.isBookingDataComplete = false;

			renderInquiry();

			expect(screen.getByText(/incomplete data/i)).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: /retry/i }),
			).toBeInTheDocument();
		});

		it("states plainly that nothing is marked archived on failure", () => {
			inquiryMocks.calendarState.hasBookingLoadError = true;
			inquiryMocks.calendarState.isBookingDataComplete = false;

			renderInquiry();

			expect(
				screen.getByText(/nothing is marked as archived/i),
			).toBeInTheDocument();
		});
	});
});
