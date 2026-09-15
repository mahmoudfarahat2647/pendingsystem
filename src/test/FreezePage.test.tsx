import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FreezePage from "@/app/(app)/freeze/page";
import type { UnfreezeMoveDialogProps } from "@/components/freeze/UnfreezeMoveDialog";
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

const mockDialogProps = vi.hoisted(() => ({
	props: null as UnfreezeMoveDialogProps | null,
}));

vi.mock("@/components/freeze/UnfreezeMoveDialog", async () => {
	const actual = await vi.importActual<
		typeof import("@/components/freeze/UnfreezeMoveDialog")
	>("@/components/freeze/UnfreezeMoveDialog");
	return {
		...actual,
		UnfreezeMoveDialog: (props: UnfreezeMoveDialogProps) => {
			mockDialogProps.props = props;
			return null;
		},
	};
});

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
	PendingRowSchema.parse({
		id: "freeze-row-2",
		stage: "freeze",
		vin: "VIN-FREEZE-002",
		customerName: "Frozen Customer 2",
		parts: [
			{ id: "p2", partNumber: "PART-2", description: "Fender", quantity: 1 },
		],
		partNumber: "PART-2",
		description: "Fender",
		status: "Pending",
		rDate: "2026-09-01",
		previousStage: "call",
		frozenAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
	}),
	PendingRowSchema.parse({
		id: "freeze-row-3",
		stage: "freeze",
		vin: "VIN-FREEZE-003",
		customerName: "Frozen Customer 3",
		parts: [
			{ id: "p3", partNumber: "PART-3", description: "Mirror", quantity: 1 },
		],
		partNumber: "PART-3",
		description: "Mirror",
		status: "Pending",
		rDate: "2026-09-01",
		previousStage: "booking",
		frozenAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
	}),
];

const [rowNoOrigin, rowFromCall, rowFromBooking] = mockFreezeRows;

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
		mockDialogProps.props = null;
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

	describe("Move to… origin derivation", () => {
		const renderPage = () => {
			render(
				<QueryClientProvider client={queryClient}>
					<TooltipProvider>
						<FreezePage />
					</TooltipProvider>
				</QueryClientProvider>,
			);
		};

		const selectRows = (rows: PendingRow[]) => {
			act(() => {
				mockGridProps.props?.onSelectionChange?.(rows);
			});
		};

		it("reports a single origin and defaults to it when every row shares one", () => {
			renderPage();
			selectRows([rowFromCall]);

			expect(mockDialogProps.props?.origin).toEqual({
				kind: "single",
				stage: "call",
			});
			expect(mockDialogProps.props?.initialStage).toBe("call");
		});

		it("reports mixed origins and preserves the first-valid destination default", () => {
			renderPage();
			selectRows([rowFromCall, rowFromBooking]);

			expect(mockDialogProps.props?.origin).toEqual({ kind: "mixed" });
			expect(mockDialogProps.props?.initialStage).toBe("call");
		});

		it("reports a partial origin when only some rows have one recorded", () => {
			renderPage();
			selectRows([rowFromCall, rowNoOrigin]);

			expect(mockDialogProps.props?.origin).toEqual({ kind: "partial" });
			expect(mockDialogProps.props?.initialStage).toBe("call");
		});

		it("reports no origin and falls back to main when nothing is recorded", () => {
			renderPage();
			selectRows([rowNoOrigin]);

			expect(mockDialogProps.props?.origin).toEqual({ kind: "none" });
			expect(mockDialogProps.props?.initialStage).toBe("main");
		});
	});
});
