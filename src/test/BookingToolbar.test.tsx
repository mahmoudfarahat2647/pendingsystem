import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BookingToolbar } from "@/components/booking/BookingToolbar";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { PendingRow } from "@/types";

const renderWithProvider = (ui: React.ReactElement) => {
	return render(
		<LocaleProvider>
			<TooltipProvider>{ui}</TooltipProvider>
		</LocaleProvider>,
	);
};

const mockSelectedRows: PendingRow[] = [
	{
		id: "1",
		vin: "VIN123",
		customerName: "Customer 1",
	} as PendingRow,
];

const defaultProps = {
	selectedRows: mockSelectedRows,
	partStatuses: [],
	rowData: mockSelectedRows,
	draftDirty: false,
	hasMixedVins: false,
	onExtract: vi.fn(),
	onFilterToggle: vi.fn(),
	onReserve: vi.fn(),
	onUpdateStatus: vi.fn(),
	onArchive: vi.fn(),
	onFreeze: vi.fn(),
	onRebook: vi.fn(),
	onReorder: vi.fn(),
	onDelete: vi.fn(),
	onSelectAllByVin: vi.fn(),
	isSelectAllByVinDisabled: false,
};

describe("BookingToolbar", () => {
	it("disables the Reschedule Booking button when draftDirty is true (with a selection)", () => {
		const { container } = renderWithProvider(
			<BookingToolbar
				{...defaultProps}
				selectedRows={mockSelectedRows}
				draftDirty={true}
			/>,
		);
		const rescheduleButton = container
			.querySelector(".lucide-calendar")
			?.closest("button");
		expect(rescheduleButton).toBeDisabled();
	});

	it("disables Archive, Reschedule, and Reorder buttons when hasMixedVins is true", () => {
		const { container } = renderWithProvider(
			<BookingToolbar
				{...defaultProps}
				selectedRows={mockSelectedRows}
				hasMixedVins={true}
			/>,
		);
		const archiveButton = container
			.querySelector(".lucide-archive")
			?.closest("button");
		const rescheduleButton = container
			.querySelector(".lucide-calendar")
			?.closest("button");
		const reorderButton = container
			.querySelector(".lucide-rotate-ccw")
			?.closest("button");

		expect(archiveButton).toBeDisabled();
		expect(rescheduleButton).toBeDisabled();
		expect(reorderButton).toBeDisabled();
	});

	it("disables the Delete button when selectedRows is empty", () => {
		const { container } = renderWithProvider(
			<BookingToolbar {...defaultProps} selectedRows={[]} />,
		);
		const deleteButton = container
			.querySelector(".lucide-trash2")
			?.closest("button");
		expect(deleteButton).toBeDisabled();
	});

	it("calls onReorder when clicking the Reorder button with a valid selection", () => {
		const onReorder = vi.fn();
		const { container } = renderWithProvider(
			<BookingToolbar
				{...defaultProps}
				selectedRows={mockSelectedRows}
				hasMixedVins={false}
				onReorder={onReorder}
			/>,
		);
		const reorderButton = container
			.querySelector(".lucide-rotate-ccw")
			?.closest("button");
		expect(reorderButton).toBeEnabled();
		if (!reorderButton) {
			throw new Error("Reorder button not found");
		}
		fireEvent.click(reorderButton);
		expect(onReorder).toHaveBeenCalledTimes(1);
	});

	it("disables the Freeze button when selectedRows is empty or hasMixedVins is true", () => {
		const { container: emptyContainer } = renderWithProvider(
			<BookingToolbar {...defaultProps} selectedRows={[]} />,
		);
		const emptyFreezeButton = emptyContainer
			.querySelector(".lucide-snowflake")
			?.closest("button");
		expect(emptyFreezeButton).toBeDisabled();

		const { container: mixedContainer } = renderWithProvider(
			<BookingToolbar
				{...defaultProps}
				selectedRows={mockSelectedRows}
				hasMixedVins={true}
			/>,
		);
		const mixedFreezeButton = mixedContainer
			.querySelector(".lucide-snowflake")
			?.closest("button");
		expect(mixedFreezeButton).toBeDisabled();
	});

	it("calls onFreeze when clicking the Freeze button with a valid selection", () => {
		const onFreeze = vi.fn();
		const { container } = renderWithProvider(
			<BookingToolbar
				{...defaultProps}
				selectedRows={mockSelectedRows}
				hasMixedVins={false}
				onFreeze={onFreeze}
			/>,
		);
		const freezeButton = container
			.querySelector(".lucide-snowflake")
			?.closest("button");
		expect(freezeButton).toBeEnabled();
		if (!freezeButton) {
			throw new Error("Freeze button not found");
		}
		fireEvent.click(freezeButton);
		expect(onFreeze).toHaveBeenCalledTimes(1);
	});
});
