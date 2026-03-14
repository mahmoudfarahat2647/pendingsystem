import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BookingSidebarHeader } from "@/components/booking/BookingSidebarHeader";
import "@testing-library/jest-dom";
import type { BookingStatus, PendingRow } from "@/types";

describe("BookingSidebarHeader", () => {
	const mockSelectedRows = [
		{
			id: "1",
			customerName: "John Doe",
			vin: "VIN123",
		} as PendingRow,
	];

	const mockStatuses: BookingStatus[] = [
		{ id: "1", label: "Confirmed", color: "#00ff00" },
		{ id: "2", label: "Pending", color: "#ffff00" },
	];

	const defaultProps = {
		selectedRows: mockSelectedRows,
		preBookingStatus: "",
		setPreBookingStatus: vi.fn(),
		bookingStatuses: mockStatuses,
		bookingNote: "",
		setBookingNote: vi.fn(),
		onClose: vi.fn(),
	};

	it("renders correctly with multiple items and customer name", () => {
		render(<BookingSidebarHeader {...defaultProps} />);
		expect(screen.getByText(/1 Items/)).toBeInTheDocument();
		expect(screen.getByText(/John Doe/)).toBeInTheDocument();
	});

	it("renders the status dropdown with 'None' when no status is selected", () => {
		render(<BookingSidebarHeader {...defaultProps} />);
		// When preBookingStatus is "", the Select is set to "__none__" which renders "None"
		expect(screen.getByText("None")).toBeInTheDocument();
	});

	it("does not throw when preBookingStatus is an empty string", () => {
		expect(() => {
			render(<BookingSidebarHeader {...defaultProps} preBookingStatus="" />);
		}).not.toThrow();
	});

	it("calls onClose when the close button is clicked", () => {
		render(<BookingSidebarHeader {...defaultProps} />);
		const closeButton = screen.getByRole("button", { name: "" }); // The X icon button
		closeButton.click();
		expect(defaultProps.onClose).toHaveBeenCalled();
	});
});
