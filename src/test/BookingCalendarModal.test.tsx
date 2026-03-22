import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import type { BookingStatus, PendingRow } from "@/types";

const modalMocks = vi.hoisted(() => ({
	storeState: {
		bookingStatuses: [
			{ id: "status-1", label: "Scheduled", color: "#ffce00" },
		] as BookingStatus[],
	},
	bookingCalendarState: {
		currentMonth: new Date(2026, 0, 15),
		setCurrentMonth: vi.fn(),
		selectedDate: new Date(2026, 0, 15),
		bookingNote: "Initial note",
		setBookingNote: vi.fn(),
		preBookingStatus: "",
		setPreBookingStatus: vi.fn(),
		searchQuery: "",
		setSearchQuery: vi.fn(),
		selectedBookingId: null as string | null,
		setSelectedBookingId: vi.fn(),
		searchMatchDates: new Set<string>(),
		bookingsByDateMap: {} as Record<string, PendingRow[]>,
		sidebarGroupedBookings: [] as PendingRow[],
		activeBookingRep: undefined as PendingRow | undefined,
		activeCustomerBookings: [] as PendingRow[],
		consolidatedNotes: [] as string[],
		activeCustomerHistoryDates: [] as string[],
		handleDateSelect: vi.fn(),
		isDateInPast: false,
	},
}));

vi.mock("@/store/useStore", () => ({
	useAppStore: (selector: (state: typeof modalMocks.storeState) => unknown) =>
		selector(modalMocks.storeState),
}));

vi.mock("@/components/booking/hooks/useBookingCalendar", () => ({
	useBookingCalendar: vi.fn(() => modalMocks.bookingCalendarState),
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
		open ? <div data-testid="booking-dialog">{children}</div> : null,
	DialogContent: ({
		children,
		className,
	}: {
		children: ReactNode;
		className?: string;
	}) => <div className={className}>{children}</div>,
	DialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/booking/BookingCalendarGrid", () => ({
	BookingCalendarGrid: () => <div data-testid="booking-calendar-grid" />,
}));

vi.mock("@/components/booking/BookingSidebarCustomerList", () => ({
	BookingSidebarCustomerList: () => (
		<div data-testid="booking-sidebar-customer-list" />
	),
}));

vi.mock("@/components/booking/BookingSidebarDetails", () => ({
	BookingSidebarDetails: () => <div data-testid="booking-sidebar-details" />,
}));

vi.mock("@/components/booking/BookingSidebarHeader", () => ({
	BookingSidebarHeader: () => <div data-testid="booking-sidebar-header" />,
}));

vi.mock("@/components/booking/BookingTasks", () => ({
	BookingTasks: () => <div data-testid="booking-tasks" />,
}));

const createSelectedRow = (): PendingRow =>
	({
		id: "row-1",
		customerName: "Test Customer",
		stage: "main",
	}) as PendingRow;

const renderModal = (onConfirm = vi.fn()) =>
	render(
		<BookingCalendarModal
			open={true}
			onOpenChange={vi.fn()}
			onConfirm={onConfirm}
			selectedRows={[createSelectedRow()]}
		/>,
	);

describe("BookingCalendarModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		Object.assign(modalMocks.bookingCalendarState, {
			currentMonth: new Date(2026, 0, 15),
			selectedDate: new Date(2026, 0, 15),
			bookingNote: "Initial note",
			preBookingStatus: "",
			searchQuery: "",
			selectedBookingId: null,
			searchMatchDates: new Set<string>(),
			bookingsByDateMap: {},
			sidebarGroupedBookings: [],
			activeBookingRep: undefined,
			activeCustomerBookings: [],
			consolidatedNotes: [],
			activeCustomerHistoryDates: [],
			isDateInPast: false,
		});
	});

	it("renders the confirm CTA when opened with selected rows", () => {
		renderModal();

		expect(
			screen.getByRole("button", { name: /confirm jan 15/i }),
		).toBeInTheDocument();
	});

	it("passes undefined status when no pre-booking status is selected", () => {
		const onConfirm = vi.fn();
		modalMocks.bookingCalendarState.bookingNote = "Note without status";
		modalMocks.bookingCalendarState.preBookingStatus = "";

		renderModal(onConfirm);
		fireEvent.click(screen.getByRole("button", { name: /confirm jan 15/i }));

		expect(onConfirm).toHaveBeenCalledWith(
			"2026-01-15",
			"Note without status",
			undefined,
		);
	});

	it("passes the selected pre-booking status when one is set", () => {
		const onConfirm = vi.fn();
		modalMocks.bookingCalendarState.bookingNote = "Note with status";
		modalMocks.bookingCalendarState.preBookingStatus = "Follow Up";

		renderModal(onConfirm);
		fireEvent.click(screen.getByRole("button", { name: /confirm jan 15/i }));

		expect(onConfirm).toHaveBeenCalledWith(
			"2026-01-15",
			"Note with status",
			"Follow Up",
		);
	});
});
