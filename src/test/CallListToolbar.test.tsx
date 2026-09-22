import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import {
	CallListToolbar,
	type CallListToolbarProps,
} from "@/components/call-list/CallListToolbar";
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
		stage: "call",
	} as PendingRow,
];

const mockPartStatuses: PartStatusDef[] = [
	{ id: "1", label: "Reserve", color: "#ff0000" },
	{ id: "2", label: "Under Inspection", color: "text-blue-500" },
];

const defaultProps: CallListToolbarProps = {
	selectedRows: mockSelectedRows,
	partStatuses: mockPartStatuses,
	rowData: mockSelectedRows,
	repairSystemOptions: [{ label: "Brakes", value: "Brakes" }],
	selectedRepairSystems: [],
	onRepairSystemsChange: vi.fn(),
	onExtract: vi.fn(),
	onFilterToggle: vi.fn(),
	onReserve: vi.fn(),
	onUpdateStatus: vi.fn(),
	onSendToBooking: vi.fn(),
	onReorder: vi.fn(),
	onArchive: vi.fn(),
	onFreeze: vi.fn(),
	onDelete: vi.fn(),
	onSelectAllByVin: vi.fn(),
	isSelectAllByVinDisabled: false,
};

describe("CallListToolbar", () => {
	it("disables Reserve, Update Status, Send to Booking, Send to Reorder, Archive, and Delete when selectedRows is empty", () => {
		const { container } = renderWithProvider(
			<CallListToolbar {...defaultProps} selectedRows={[]} />,
		);

		expect(getButtonByIcon(container, "lucide-tag")).toBeDisabled();
		expect(
			getButtonByIcon(container, "lucide-circle-check-big"),
		).toBeDisabled();
		expect(getButtonByIcon(container, "lucide-calendar")).toBeDisabled();
		expect(getButtonByIcon(container, "lucide-rotate-ccw")).toBeDisabled();
		expect(getButtonByIcon(container, "lucide-archive")).toBeDisabled();
		expect(getButtonByIcon(container, "lucide-snowflake")).toBeDisabled();
		expect(getButtonByIcon(container, "lucide-trash2")).toBeDisabled();
	});

	it("enables action buttons when rows are selected", () => {
		const { container } = renderWithProvider(
			<CallListToolbar {...defaultProps} selectedRows={mockSelectedRows} />,
		);

		expect(getButtonByIcon(container, "lucide-tag")).toBeEnabled();
		expect(getButtonByIcon(container, "lucide-circle-check-big")).toBeEnabled();
		expect(getButtonByIcon(container, "lucide-calendar")).toBeEnabled();
		expect(getButtonByIcon(container, "lucide-rotate-ccw")).toBeEnabled();
		expect(getButtonByIcon(container, "lucide-archive")).toBeEnabled();
		expect(getButtonByIcon(container, "lucide-snowflake")).toBeEnabled();
		expect(getButtonByIcon(container, "lucide-trash2")).toBeEnabled();
	});

	it("calls onExtract when Extract is clicked", () => {
		const onExtract = vi.fn();
		const { container } = renderWithProvider(
			<CallListToolbar {...defaultProps} onExtract={onExtract} />,
		);
		const btn = getButtonByIcon(container, "lucide-download");
		fireEvent.click(btn);
		expect(onExtract).toHaveBeenCalledTimes(1);
	});

	it("calls onFilterToggle when Filter is clicked", () => {
		const onFilterToggle = vi.fn();
		const { container } = renderWithProvider(
			<CallListToolbar {...defaultProps} onFilterToggle={onFilterToggle} />,
		);
		const btn = getButtonByIcon(container, "lucide-filter");
		fireEvent.click(btn);
		expect(onFilterToggle).toHaveBeenCalledTimes(1);
	});

	it("calls onReserve when Reserve button is clicked", () => {
		const onReserve = vi.fn();
		const { container } = renderWithProvider(
			<CallListToolbar {...defaultProps} onReserve={onReserve} />,
		);
		const btn = getButtonByIcon(container, "lucide-tag");
		fireEvent.click(btn);
		expect(onReserve).toHaveBeenCalledTimes(1);
	});

	it("calls onSendToBooking when Booking button is clicked", () => {
		const onSendToBooking = vi.fn();
		const { container } = renderWithProvider(
			<CallListToolbar {...defaultProps} onSendToBooking={onSendToBooking} />,
		);
		const btn = getButtonByIcon(container, "lucide-calendar");
		fireEvent.click(btn);
		expect(onSendToBooking).toHaveBeenCalledTimes(1);
	});

	it("calls onReorder when Reorder button is clicked", () => {
		const onReorder = vi.fn();
		const { container } = renderWithProvider(
			<CallListToolbar {...defaultProps} onReorder={onReorder} />,
		);
		const btn = getButtonByIcon(container, "lucide-rotate-ccw");
		fireEvent.click(btn);
		expect(onReorder).toHaveBeenCalledTimes(1);
	});

	it("calls onArchive when Archive button is clicked", () => {
		const onArchive = vi.fn();
		const { container } = renderWithProvider(
			<CallListToolbar {...defaultProps} onArchive={onArchive} />,
		);
		const btn = getButtonByIcon(container, "lucide-archive");
		fireEvent.click(btn);
		expect(onArchive).toHaveBeenCalledTimes(1);
	});

	it("calls onFreeze when Freeze button is clicked", () => {
		const onFreeze = vi.fn();
		const { container } = renderWithProvider(
			<CallListToolbar {...defaultProps} onFreeze={onFreeze} />,
		);
		const btn = getButtonByIcon(container, "lucide-snowflake");
		fireEvent.click(btn);
		expect(onFreeze).toHaveBeenCalledTimes(1);
	});

	it("calls onDelete when Delete button is clicked", () => {
		const onDelete = vi.fn();
		const { container } = renderWithProvider(
			<CallListToolbar {...defaultProps} onDelete={onDelete} />,
		);
		const btn = getButtonByIcon(container, "lucide-trash2");
		fireEvent.click(btn);
		expect(onDelete).toHaveBeenCalledTimes(1);
	});

	it("renders items for each partStatus and calls onUpdateStatus when clicked", async () => {
		const user = userEvent.setup();
		const onUpdateStatus = vi.fn();
		const { container } = renderWithProvider(
			<CallListToolbar
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
