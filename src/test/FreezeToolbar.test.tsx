import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import {
	FreezeToolbar,
	type FreezeToolbarProps,
} from "@/components/freeze/FreezeToolbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PendingRowSchema } from "@/schemas/order.schema";
import type { PendingRow } from "@/types";

const renderWithProvider = (ui: React.ReactElement) => {
	return render(<TooltipProvider>{ui}</TooltipProvider>);
};

const getButtonByIcon = (container: HTMLElement, iconClass: string) => {
	const btn = container.querySelector(`.${iconClass}`)?.closest("button");
	if (!btn) {
		throw new Error(`Button with icon .${iconClass} not found`);
	}
	return btn;
};

const mockSelectedRows: PendingRow[] = [
	PendingRowSchema.parse({
		id: "1",
		vin: "VF1BB0A0F12345678",
		customerName: "Test Customer",
		stage: "freeze",
	}),
];

const defaultProps: FreezeToolbarProps = {
	selectedRows: mockSelectedRows,
	rowData: mockSelectedRows,
	onExtract: vi.fn(),
	onFilterToggle: vi.fn(),
	onSelectAllByVin: vi.fn(),
	isSelectAllByVinDisabled: false,
};

describe("FreezeToolbar", () => {
	it("renders toolbar elements including Extract, Filter, and Line counter", () => {
		const { container } = renderWithProvider(
			<FreezeToolbar {...defaultProps} />,
		);

		expect(getButtonByIcon(container, "lucide-download")).toBeInTheDocument();
		expect(getButtonByIcon(container, "lucide-filter")).toBeInTheDocument();
		expect(screen.getByText("Lines")).toBeInTheDocument();
	});

	it("calls onExtract when Extract is clicked", () => {
		const onExtract = vi.fn();
		const { container } = renderWithProvider(
			<FreezeToolbar {...defaultProps} onExtract={onExtract} />,
		);
		const btn = getButtonByIcon(container, "lucide-download");
		fireEvent.click(btn);
		expect(onExtract).toHaveBeenCalledTimes(1);
	});

	it("calls onFilterToggle when Filter is clicked", () => {
		const onFilterToggle = vi.fn();
		const { container } = renderWithProvider(
			<FreezeToolbar {...defaultProps} onFilterToggle={onFilterToggle} />,
		);
		const btn = getButtonByIcon(container, "lucide-filter");
		fireEvent.click(btn);
		expect(onFilterToggle).toHaveBeenCalledTimes(1);
	});

	it("calls onSelectAllByVin when SelectAllByVinButton is clicked", () => {
		const onSelectAllByVin = vi.fn();
		const { container } = renderWithProvider(
			<FreezeToolbar {...defaultProps} onSelectAllByVin={onSelectAllByVin} />,
		);
		const btn = getButtonByIcon(container, "lucide-layers");
		fireEvent.click(btn);
		expect(onSelectAllByVin).toHaveBeenCalledTimes(1);
	});
});
