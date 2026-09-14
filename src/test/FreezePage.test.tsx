import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FreezePage from "@/app/(app)/freeze/page";
import type { DataGridProps } from "@/components/grid/DataGrid";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PendingRowSchema } from "@/schemas/order.schema";
import type { PendingRow } from "@/types";

const mockGridProps = vi.hoisted(() => ({
	props: null as DataGridProps<PendingRow> | null,
}));

vi.mock("@/components/grid", () => ({
	DynamicDataGrid: (props: DataGridProps<PendingRow>) => {
		mockGridProps.props = props;
		return <div data-testid="freeze-data-grid">Mock DataGrid</div>;
	},
}));

const mockFreezeRows: PendingRow[] = [
	PendingRowSchema.parse({
		id: "freeze-row-1",
		stage: "freeze",
		vin: "VIN-FREEZE-001",
		customerName: "Frozen Customer",
		parts: [
			{ id: "p1", partNumber: "PART-1", description: "Bumper", quantity: 1 },
		],
		partNumber: "PART-1",
		description: "Bumper",
		status: "Pending",
		rDate: "2026-09-01",
		frozenAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
	}),
];

vi.mock("@/hooks/queries/useOrdersQuery", () => ({
	useOrdersQuery: (stage?: string) => ({
		data: stage === "freeze" ? mockFreezeRows : [],
		isLoading: false,
		error: null,
	}),
}));

const mockApplyCommand = vi.fn();
vi.mock("@/hooks/useDraftSession", () => ({
	useDraftSession: (_stage?: string) => ({
		workingRows: null,
		applyCommand: mockApplyCommand,
		saving: false,
	}),
}));

vi.mock("@/hooks/useColumnLayoutTracker", () => ({
	useColumnLayoutTracker: () => ({
		isDirty: false,
		isPositionDirty: false,
		saveLayout: vi.fn(),
		saveAsDefault: vi.fn(),
		resetLayout: vi.fn(),
	}),
}));

describe("FreezePage", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		mockGridProps.props = null;
		vi.clearAllMocks();
	});

	it("renders FreezePage with DataGrid and FreezeToolbar", () => {
		render(
			<QueryClientProvider client={queryClient}>
				<TooltipProvider>
					<FreezePage />
				</TooltipProvider>
			</QueryClientProvider>,
		);

		expect(screen.getByTestId("freeze-data-grid")).toBeInTheDocument();
		expect(screen.getByText("Lines")).toBeInTheDocument();

		expect(mockGridProps.props).not.toBeNull();
		expect(mockGridProps.props?.stage).toBe("freeze");
		expect(mockGridProps.props?.gridStateKey).toBe("freeze");
		expect(mockGridProps.props?.rowData).toEqual(mockFreezeRows);

		const colDefs = mockGridProps.props?.columnDefs ?? [];
		const daysFrozenCol = colDefs.find((c) => c.colId === "daysFrozen");
		expect(daysFrozenCol).toBeDefined();
		expect(daysFrozenCol?.headerName).toBe("DAYS FROZEN");

		const actionsCol = colDefs.find((c) => c.colId === "row-actions");
		expect(actionsCol).toBeDefined();
		expect(actionsCol?.headerName).toBe("ACTIONS");
		expect(actionsCol?.field).toBeUndefined();
	});
});
