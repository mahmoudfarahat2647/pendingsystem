import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import {
	ArchiveToolbar,
	type ArchiveToolbarProps,
} from "@/components/archive/ArchiveToolbar";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { PartStatusDef, PendingRow } from "@/types";

const renderWithProvider = (ui: React.ReactElement) => {
	return render(
		<LocaleProvider>
			<TooltipProvider>{ui}</TooltipProvider>
		</LocaleProvider>,
	);
};

const getButtonByIcon = (container: HTMLElement, iconClass: string) => {
	const btn = container.querySelector(`.${iconClass}`)?.closest("button");
	if (!btn) {
		throw new Error(`Button with icon .${iconClass} not found`);
	}
	return btn;
};

const mockSelectedRows: PendingRow[] = [
	{
		id: "1",
		vin: "VF1BB0A0F12345678",
		customerName: "Test Customer",
		stage: "archive",
	} as PendingRow,
];

const mockPartStatuses: PartStatusDef[] = [
	{ id: "1", label: "Reserve", color: "#ff0000" },
	{ id: "2", label: "Under Inspection", color: "text-blue-500" },
];

const defaultProps: ArchiveToolbarProps = {
	selectedRows: mockSelectedRows,
	partStatuses: mockPartStatuses,
	rowData: mockSelectedRows,
	onExtract: vi.fn(),
	onFilterToggle: vi.fn(),
	onUpdateStatus: vi.fn(),
	onReorder: vi.fn(),
	onBooking: vi.fn(),
	onDelete: vi.fn(),
	onSelectAllByVin: vi.fn(),
	isSelectAllByVinDisabled: false,
};

describe("ArchiveToolbar", () => {
	it("disables Update Status, Reorder, Reschedule Booking, and Delete when selectedRows is empty", () => {
		const { container } = renderWithProvider(
			<ArchiveToolbar {...defaultProps} selectedRows={[]} />,
		);

		expect(
			getButtonByIcon(container, "lucide-circle-check-big"),
		).toBeDisabled();
		expect(getButtonByIcon(container, "lucide-rotate-ccw")).toBeDisabled();
		expect(getButtonByIcon(container, "lucide-calendar")).toBeDisabled();
		expect(getButtonByIcon(container, "lucide-trash2")).toBeDisabled();
	});

	it("enables action buttons when rows are selected", () => {
		const { container } = renderWithProvider(
			<ArchiveToolbar {...defaultProps} selectedRows={mockSelectedRows} />,
		);

		expect(getButtonByIcon(container, "lucide-circle-check-big")).toBeEnabled();
		expect(getButtonByIcon(container, "lucide-rotate-ccw")).toBeEnabled();
		expect(getButtonByIcon(container, "lucide-calendar")).toBeEnabled();
		expect(getButtonByIcon(container, "lucide-trash2")).toBeEnabled();
	});

	it("calls onExtract when Extract is clicked", () => {
		const onExtract = vi.fn();
		const { container } = renderWithProvider(
			<ArchiveToolbar {...defaultProps} onExtract={onExtract} />,
		);
		const btn = getButtonByIcon(container, "lucide-download");
		fireEvent.click(btn);
		expect(onExtract).toHaveBeenCalledTimes(1);
	});

	it("calls onFilterToggle when Filter is clicked", () => {
		const onFilterToggle = vi.fn();
		const { container } = renderWithProvider(
			<ArchiveToolbar {...defaultProps} onFilterToggle={onFilterToggle} />,
		);
		const btn = getButtonByIcon(container, "lucide-filter");
		fireEvent.click(btn);
		expect(onFilterToggle).toHaveBeenCalledTimes(1);
	});

	it("calls onReorder when Reorder button is clicked", () => {
		const onReorder = vi.fn();
		const { container } = renderWithProvider(
			<ArchiveToolbar {...defaultProps} onReorder={onReorder} />,
		);
		const btn = getButtonByIcon(container, "lucide-rotate-ccw");
		fireEvent.click(btn);
		expect(onReorder).toHaveBeenCalledTimes(1);
	});

	it("calls onBooking when Reschedule Booking button is clicked", () => {
		const onBooking = vi.fn();
		const { container } = renderWithProvider(
			<ArchiveToolbar {...defaultProps} onBooking={onBooking} />,
		);
		const btn = getButtonByIcon(container, "lucide-calendar");
		fireEvent.click(btn);
		expect(onBooking).toHaveBeenCalledTimes(1);
	});

	it("calls onDelete when Delete button is clicked", () => {
		const onDelete = vi.fn();
		const { container } = renderWithProvider(
			<ArchiveToolbar {...defaultProps} onDelete={onDelete} />,
		);
		const btn = getButtonByIcon(container, "lucide-trash2");
		fireEvent.click(btn);
		expect(onDelete).toHaveBeenCalledTimes(1);
	});

	it("renders items for each partStatus and calls onUpdateStatus when clicked", async () => {
		const user = userEvent.setup();
		const onUpdateStatus = vi.fn();
		const { container } = renderWithProvider(
			<ArchiveToolbar
				{...defaultProps}
				partStatuses={mockPartStatuses}
				onUpdateStatus={onUpdateStatus}
			/>,
		);
		const trigger = getButtonByIcon(container, "lucide-circle-check-big");
		await user.click(trigger);

		const reserveItem = await screen.findByText("Reserve");
		const inspectionItem = await screen.findByText("Under Inspection");
		expect(reserveItem).toBeInTheDocument();
		expect(inspectionItem).toBeInTheDocument();

		await user.click(reserveItem);
		expect(onUpdateStatus).toHaveBeenCalledWith("Reserve");
	});
});
