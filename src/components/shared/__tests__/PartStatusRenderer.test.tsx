import { render, screen } from "@testing-library/react";
import type { ICellRendererParams } from "ag-grid-community";
import { describe, expect, it } from "vitest";
import type { PartStatusDef, PendingRow } from "@/types";
import { PartStatusRenderer } from "../GridConfig";

const mockPartStatuses: PartStatusDef[] = [
	{ id: "1", label: "Available", color: "bg-green-500" },
	{ id: "2", label: "Ordered", color: "bg-blue-500" },
];

const createMockParams = (
	value: string | null | undefined,
	partStatuses?: PartStatusDef[],
): ICellRendererParams<PendingRow> & { partStatuses?: PartStatusDef[] } => ({
	value,
	data: {} as PendingRow,
	node: {} as any,
	colDef: {} as any,
	column: {} as any,
	api: {} as any,
	context: {},
	refreshCell: () => {},
	eGridCell: {} as any,
	eParentOfValue: {} as any,
	getValue: () => value,
	setValue: () => {},
	formatValue: () => String(value || ""),
	valueFormatted: String(value || ""),
	registerRowDragger: () => {},
	setTooltip: () => {},
	partStatuses,
});

describe("PartStatusRenderer", () => {
	it("should show empty state with dropdown arrow when no status selected", () => {
		const params = createMockParams("", mockPartStatuses);
		render(<PartStatusRenderer {...params} />);

		expect(screen.getByText("Select status")).toBeInTheDocument();
		expect(screen.getByText("▼")).toBeInTheDocument();
	});

	it("should display status with correct color when selected", () => {
		const params = createMockParams("Available", mockPartStatuses);
		render(<PartStatusRenderer {...params} />);

		expect(screen.getByTitle("Available")).toBeInTheDocument();
		expect(screen.queryByText("▼")).not.toBeInTheDocument();

		const colorIndicator = screen.getByTitle("Available").firstElementChild;
		expect(colorIndicator).toHaveClass("bg-green-500");
	});

	it("should use fallback color for unknown status", () => {
		const params = createMockParams("Unknown", mockPartStatuses);
		render(<PartStatusRenderer {...params} />);

		expect(screen.getByTitle("Unknown")).toBeInTheDocument();

		const colorIndicator = screen.getByTitle("Unknown").firstElementChild;
		expect(colorIndicator).toHaveClass("bg-gray-400");
	});
});
