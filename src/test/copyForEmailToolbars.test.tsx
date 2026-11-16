import "@testing-library/jest-dom";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { GridApi } from "ag-grid-community";
import type { ComponentProps, ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArchiveToolbar } from "@/components/archive/ArchiveToolbar";
import { BookingToolbar } from "@/components/booking/BookingToolbar";
import { CallListToolbar } from "@/components/call-list/CallListToolbar";
import { FreezeToolbar } from "@/components/freeze/FreezeToolbar";
import { MainSheetToolbar } from "@/components/main-sheet/MainSheetToolbar";
import { OrdersToolbar } from "@/components/orders/OrdersToolbar";
import { SearchToolbar } from "@/components/shared/search/SearchToolbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { PendingRow } from "@/types";
import { createMockGridApi, createMockGridNode } from "./utils/gridTestHelpers";

const mocks = vi.hoisted(() => ({
	toastSuccess: vi.fn(),
	toastError: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: {
		success: mocks.toastSuccess,
		error: mocks.toastError,
		warning: vi.fn(),
	},
}));

class MockClipboardItem {
	readonly items: Record<string, Blob>;

	constructor(items: Record<string, Blob>) {
		this.items = items;
	}
}

type ClipboardWrite = ReturnType<typeof vi.fn>;

const installClipboard = (
	implementation: () => Promise<void> = () => Promise.resolve(),
): ClipboardWrite => {
	const write = vi.fn(implementation);
	Object.defineProperty(navigator, "clipboard", {
		configurable: true,
		value: { write },
	});
	vi.stubGlobal("ClipboardItem", MockClipboardItem);
	return write;
};

const readBlob = (blob: Blob): Promise<string> =>
	typeof blob.text === "function"
		? blob.text()
		: new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(String(reader.result ?? ""));
				reader.onerror = () => reject(reader.error);
				reader.readAsText(blob);
			});

const readPayloadAt = async (write: ClipboardWrite, index: number) => {
	const items = write.mock.calls[index]?.[0] as MockClipboardItem[] | undefined;
	const item = items?.[0];
	if (!item) throw new Error(`No clipboard item was written at call ${index}`);
	return {
		html: await readBlob(item.items["text/html"]),
		text: await readBlob(item.items["text/plain"]),
	};
};

const readLastPayload = (write: ClipboardWrite) =>
	readPayloadAt(write, write.mock.calls.length - 1);

type WiredNode = ReturnType<typeof createMockGridNode>;

/**
 * A grid API fake that behaves like ag-grid's event-driven surface: rows are
 * read through the filtered+sorted iterator and the toolbar only learns about
 * changes from the registered listeners.
 */
const createWiredGridApi = (initialNodes: WiredNode[]) => {
	let nodes = initialNodes;
	const listeners = new Map<string, Set<() => void>>();

	const api = {
		isDestroyed: () => false,
		addEventListener: (type: string, handler: () => void) => {
			const handlers = listeners.get(type) ?? new Set<() => void>();
			handlers.add(handler);
			listeners.set(type, handlers);
		},
		removeEventListener: (type: string, handler: () => void) => {
			listeners.get(type)?.delete(handler);
		},
		forEachNodeAfterFilter: () => {
			throw new Error("Copy must use the filtered+sorted iterator");
		},
		forEachNodeAfterFilterAndSort: (
			callback: (node: WiredNode, index: number) => void,
		) => {
			nodes.forEach((node, index) => {
				callback(node, index);
			});
		},
		getSelectedRows: () =>
			nodes.flatMap((node) =>
				node.isSelected() && node.data ? [node.data] : [],
			),
	};

	return {
		api: api as unknown as GridApi,
		setNodes(nextNodes: WiredNode[]) {
			nodes = nextNodes;
		},
		fire(type: string) {
			for (const handler of listeners.get(type) ?? []) handler();
		},
		listenerCount(type: string) {
			return listeners.get(type)?.size ?? 0;
		},
	};
};

const makeRow = (id: string, overrides: Partial<PendingRow> = {}): PendingRow =>
	({
		id,
		customerName: `Customer ${id}`,
		vin: `VIN-${id}`,
		model: "Clio",
		partNumber: `PN-${id}`,
		description: `Part ${id}`,
		stage: "orders",
		...overrides,
	}) as PendingRow;

const renderWithProvider = (ui: ReactElement) =>
	render(<TooltipProvider>{ui}</TooltipProvider>);

const rowA = makeRow("A", { customerName: "أحمد حسن" });
const rowB = makeRow("B", { vin: "VIN-B" });
const rowC = makeRow("C", { partNumber: "0000123" });

const selectedRows = [rowA, rowB];

const ordersProps: ComponentProps<typeof OrdersToolbar> = {
	selectedCount: selectedRows.length,
	selectedRows,
	onAddEdit: vi.fn(),
	onDelete: vi.fn(),
	onCommit: vi.fn(),
	onBooking: vi.fn(),
	onBulkAttach: vi.fn(),
	onPrint: vi.fn(),
	onReserve: vi.fn(),
	onArchive: vi.fn(),
	onFreeze: vi.fn(),
	onShareToLogistics: vi.fn(),
	onExtract: vi.fn(),
	onSetAllRDate: vi.fn(),
	onFilterToggle: vi.fn(),
	onCallList: vi.fn(),
	onSelectAllByVin: vi.fn(),
	isSelectAllByVinDisabled: false,
};

const mainSheetProps: ComponentProps<typeof MainSheetToolbar> = {
	isLocked: false,
	selectedCount: selectedRows.length,
	selectedRows,
	onBooking: vi.fn(),
	onArchive: vi.fn(),
	onFreeze: vi.fn(),
	onSendToCallList: vi.fn(),
	onReorder: vi.fn(),
	onDelete: vi.fn(),
	onExtract: vi.fn(),
	onFilterToggle: vi.fn(),
	onLockToggle: vi.fn(),
	onReserve: vi.fn(),
	onSelectAllByVin: vi.fn(),
	isSelectAllByVinDisabled: false,
};

const callListProps: ComponentProps<typeof CallListToolbar> = {
	selectedRows,
	repairSystemOptions: [],
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

const bookingProps: ComponentProps<typeof BookingToolbar> = {
	selectedRows,
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

const archiveProps: ComponentProps<typeof ArchiveToolbar> = {
	selectedRows,
	onExtract: vi.fn(),
	onFilterToggle: vi.fn(),
	onUpdateStatus: vi.fn(),
	onReorder: vi.fn(),
	onBooking: vi.fn(),
	onDelete: vi.fn(),
	onSelectAllByVin: vi.fn(),
	isSelectAllByVinDisabled: false,
};

const freezeProps: ComponentProps<typeof FreezeToolbar> = {
	selectedRows,
	rowData: selectedRows,
	onExtract: vi.fn(),
	onFilterToggle: vi.fn(),
	onSelectAllByVin: vi.fn(),
	isSelectAllByVinDisabled: false,
};

const searchProps: ComponentProps<typeof SearchToolbar> = {
	selectedCount: selectedRows.length,
	selectedRows,
	isSameSource: true,
	disabledReason: "",
	onBooking: vi.fn(),
	onArchive: vi.fn(),
	onSendToCallList: vi.fn(),
	onReorder: vi.fn(),
	onMoveToMain: vi.fn(),
	canMoveToMain: false,
	isMoveToMainEligible: false,
	onDelete: vi.fn(),
	onExtract: vi.fn(),
	onFilterToggle: vi.fn(),
	onReserve: vi.fn(),
	onUpdateStatus: vi.fn(),
	partStatuses: [],
	showFilters: false,
	modelOptions: [],
	selectedModels: [],
	onModelsChange: vi.fn(),
	sourceOptions: [],
	activeSourceFilter: null,
	onSourceFilterChange: vi.fn(),
	availableCompanies: [],
	selectedCompanies: [],
	onCompanyFilterChange: vi.fn(),
	onCompanyFilterClear: vi.fn(),
};

const toolbarCases: Array<{
	name: string;
	element: ReactElement;
	leftOfIcon: string;
}> = [
	{
		name: "Orders",
		element: <OrdersToolbar {...ordersProps} />,
		leftOfIcon: ".lucide-layers",
	},
	{
		name: "Main Sheet",
		element: <MainSheetToolbar {...mainSheetProps} />,
		leftOfIcon: ".lucide-layers",
	},
	{
		name: "Call List",
		element: <CallListToolbar {...callListProps} />,
		leftOfIcon: ".lucide-layers",
	},
	{
		name: "Booking",
		element: <BookingToolbar {...bookingProps} />,
		leftOfIcon: ".lucide-layers",
	},
	{
		name: "Archive",
		element: <ArchiveToolbar {...archiveProps} />,
		leftOfIcon: ".lucide-layers",
	},
	{
		name: "Freeze",
		element: <FreezeToolbar {...freezeProps} />,
		leftOfIcon: ".lucide-layers",
	},
	{
		name: "Global Search",
		element: <SearchToolbar {...searchProps} />,
		leftOfIcon: ".lucide-trash2",
	},
];

describe("Copy for Email toolbars", () => {
	beforeEach(() => {
		mocks.toastSuccess.mockClear();
		mocks.toastError.mockClear();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it.each(
		toolbarCases,
	)("$name places Copy for Email immediately left of its right-group neighbour", ({
		element,
		leftOfIcon,
	}) => {
		renderWithProvider(element);

		const copyButton = screen.getByRole("button", { name: "Copy for Email" });
		const neighbour = copyButton.nextElementSibling;
		expect(neighbour).not.toBeNull();
		expect(neighbour?.querySelector(leftOfIcon)).not.toBeNull();
	});

	it.each(
		toolbarCases,
	)("$name copies the selected rows as a five-column table", async ({
		element,
	}) => {
		const write = installClipboard();
		renderWithProvider(element);

		fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));

		await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
		const { html, text } = await readLastPayload(write);
		const lines = text.split("\n");

		expect(lines).toHaveLength(3);
		expect(lines[0]).toBe(
			"Customer Name\tVIN\tModel\tPart Number\tDescription",
		);
		expect(lines[1]).toContain("VIN-A");
		expect(lines[2]).toContain("VIN-B");
		expect(text).toContain("أحمد حسن");
		expect(html).toContain("<table");
	});

	describe("grid selection, filtering and sorting", () => {
		const gridApiWith = (
			nodes: ReturnType<typeof createMockGridNode>[],
			selected: PendingRow[],
			sortedNodes?: ReturnType<typeof createMockGridNode>[],
		) =>
			createMockGridApi({
				filteredNodes: nodes,
				sortedNodes,
				selectedRows: selected,
			}) as unknown as GridApi;

		it("reads the filtered+sorted iterator instead of unsorted filtered order", async () => {
			const write = installClipboard();
			const nodeA = createMockGridNode({ selected: true, data: rowA });
			const nodeB = createMockGridNode({ selected: false, data: rowB });
			const nodeC = createMockGridNode({ selected: true, data: rowC });
			const api = createMockGridApi({
				filteredNodes: [nodeA, nodeB, nodeC],
				sortedNodes: [nodeC, nodeA],
				selectedRows: [rowA, rowB, rowC],
			});

			renderWithProvider(
				<OrdersToolbar
					{...ordersProps}
					selectedRows={[]}
					selectedCount={2}
					gridApi={api as unknown as GridApi}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));

			await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
			const lines = (await readLastPayload(write)).text.split("\n");
			expect(lines).toHaveLength(3);
			expect(lines[1]).toContain("VIN-C");
			expect(lines[2]).toContain("VIN-A");
			expect(lines.join("\n")).not.toContain("VIN-B");
			expect(api.forEachNodeAfterFilter).not.toHaveBeenCalled();
			expect(api.forEachNodeAfterFilterAndSort).toHaveBeenCalled();
		});

		it("copies only selected nodes that pass the filters, in sorted grid order", async () => {
			const write = installClipboard();
			const gridApi = gridApiWith(
				[
					createMockGridNode({ selected: true, data: rowA }),
					createMockGridNode({ selected: false, data: rowB }),
					createMockGridNode({ selected: true, data: rowC }),
				],
				[rowA, rowB, rowC],
				[
					createMockGridNode({ selected: true, data: rowC }),
					createMockGridNode({ selected: false, data: rowB }),
					createMockGridNode({ selected: true, data: rowA }),
				],
			);

			renderWithProvider(
				<OrdersToolbar
					{...ordersProps}
					selectedRows={[rowA, rowB, rowC]}
					selectedCount={3}
					gridApi={gridApi}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));

			await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
			const lines = (await readLastPayload(write)).text.split("\n");
			expect(lines).toHaveLength(3);
			expect(lines[1]).toContain("VIN-C");
			expect(lines[2]).toContain("VIN-A");
			expect(lines.join("\n")).not.toContain("VIN-B");
		});

		it("refreshes from selectionChanged events without new props", async () => {
			const write = installClipboard();
			const nodeA = createMockGridNode({ selected: true, data: rowA });
			const nodeB = createMockGridNode({ selected: false, data: rowB });
			const grid = createWiredGridApi([nodeA, nodeB]);

			renderWithProvider(
				<OrdersToolbar
					{...ordersProps}
					selectedRows={[]}
					selectedCount={1}
					gridApi={grid.api}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));
			await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
			expect((await readPayloadAt(write, 0)).text).toContain("VIN-A");
			expect((await readPayloadAt(write, 0)).text).not.toContain("VIN-B");

			act(() => {
				nodeA.setSelected(false);
				nodeB.setSelected(true);
				grid.fire("selectionChanged");
			});

			fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));
			await waitFor(() => expect(write).toHaveBeenCalledTimes(2));
			expect((await readPayloadAt(write, 1)).text).toContain("VIN-B");
			expect((await readPayloadAt(write, 1)).text).not.toContain("VIN-A");
		});

		it("refreshes after an edited selected cell fires cellValueChanged", async () => {
			const write = installClipboard();
			const editedRow = makeRow("edit-1", {
				customerName: "Customer Before",
			});
			const node = createMockGridNode({ selected: true, data: editedRow });
			const grid = createWiredGridApi([node]);

			renderWithProvider(
				<OrdersToolbar
					{...ordersProps}
					selectedRows={[]}
					selectedCount={1}
					gridApi={grid.api}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));
			await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
			expect((await readPayloadAt(write, 0)).text).toContain("Customer Before");
			expect((await readPayloadAt(write, 0)).text).not.toContain(
				"Customer After",
			);

			act(() => {
				node.data = { ...editedRow, customerName: "Customer After" };
				grid.fire("cellValueChanged");
			});

			fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));
			await waitFor(() => expect(write).toHaveBeenCalledTimes(2));
			expect((await readPayloadAt(write, 1)).text).toContain("Customer After");
			expect((await readPayloadAt(write, 1)).text).not.toContain(
				"Customer Before",
			);
		});

		it("drops rows hidden by a filter change and keeps the remaining order", async () => {
			const write = installClipboard();
			const nodeA = createMockGridNode({ selected: true, data: rowA });
			const nodeB = createMockGridNode({ selected: true, data: rowB });
			const nodeC = createMockGridNode({ selected: true, data: rowC });
			const grid = createWiredGridApi([nodeA, nodeB, nodeC]);

			renderWithProvider(
				<OrdersToolbar
					{...ordersProps}
					selectedRows={[]}
					selectedCount={3}
					gridApi={grid.api}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));
			await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
			expect((await readPayloadAt(write, 0)).text.split("\n")).toHaveLength(4);

			act(() => {
				grid.setNodes([nodeA, nodeC]);
				grid.fire("filterChanged");
			});

			fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));
			await waitFor(() => expect(write).toHaveBeenCalledTimes(2));
			const lines = (await readPayloadAt(write, 1)).text.split("\n");
			expect(lines).toHaveLength(3);
			expect(lines[1]).toContain("VIN-A");
			expect(lines[2]).toContain("VIN-C");
			expect(lines.join("\n")).not.toContain("VIN-B");
		});

		it("reorders copied rows after a sort change", async () => {
			const write = installClipboard();
			const nodeA = createMockGridNode({ selected: true, data: rowA });
			const nodeB = createMockGridNode({ selected: true, data: rowB });
			const grid = createWiredGridApi([nodeA, nodeB]);

			renderWithProvider(
				<OrdersToolbar
					{...ordersProps}
					selectedRows={[]}
					selectedCount={2}
					gridApi={grid.api}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));
			await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
			expect((await readPayloadAt(write, 0)).text.split("\n")[1]).toContain(
				"VIN-A",
			);

			act(() => {
				grid.setNodes([nodeB, nodeA]);
				grid.fire("sortChanged");
			});

			fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));
			await waitFor(() => expect(write).toHaveBeenCalledTimes(2));
			const lines = (await readPayloadAt(write, 1)).text.split("\n");
			expect(lines[1]).toContain("VIN-B");
			expect(lines[2]).toContain("VIN-A");
		});

		it("removes its grid listeners on unmount", () => {
			const grid = createWiredGridApi([
				createMockGridNode({ selected: true, data: rowA }),
			]);
			const { unmount } = renderWithProvider(
				<OrdersToolbar
					{...ordersProps}
					selectedRows={[]}
					selectedCount={1}
					gridApi={grid.api}
				/>,
			);

			for (const event of [
				"filterChanged",
				"sortChanged",
				"modelUpdated",
				"selectionChanged",
				"cellValueChanged",
			]) {
				expect(grid.listenerCount(event)).toBe(1);
			}

			unmount();

			for (const event of [
				"filterChanged",
				"sortChanged",
				"modelUpdated",
				"selectionChanged",
				"cellValueChanged",
			]) {
				expect(grid.listenerCount(event)).toBe(0);
			}
		});

		it("disables the button and writes nothing when filters hide every selected row", () => {
			const write = installClipboard();
			const gridApi = gridApiWith([], [rowA]);

			renderWithProvider(
				<OrdersToolbar
					{...ordersProps}
					selectedRows={[rowA]}
					selectedCount={1}
					gridApi={gridApi}
				/>,
			);

			const copyButton = screen.getByRole("button", { name: "Copy for Email" });
			expect(copyButton).toBeDisabled();
			fireEvent.click(copyButton);
			expect(write).not.toHaveBeenCalled();
		});
	});

	describe("selection changes", () => {
		it("disables the button and writes nothing with an empty selection", () => {
			const write = installClipboard();
			renderWithProvider(
				<OrdersToolbar {...ordersProps} selectedRows={[]} selectedCount={0} />,
			);

			const copyButton = screen.getByRole("button", { name: "Copy for Email" });
			expect(copyButton).toBeDisabled();
			fireEvent.click(copyButton);
			expect(write).not.toHaveBeenCalled();
		});

		it("stops copying after a prior selection is cleared", async () => {
			const write = installClipboard();
			const { rerender } = renderWithProvider(
				<OrdersToolbar
					{...ordersProps}
					selectedRows={[rowA]}
					selectedCount={1}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));
			await waitFor(() => expect(write).toHaveBeenCalledTimes(1));

			rerender(
				<TooltipProvider>
					<OrdersToolbar {...ordersProps} selectedRows={[]} selectedCount={0} />
				</TooltipProvider>,
			);

			const copyButton = screen.getByRole("button", { name: "Copy for Email" });
			expect(copyButton).toBeDisabled();
			fireEvent.click(copyButton);
			expect(write).toHaveBeenCalledTimes(1);
		});

		it("copies the latest selection on each activation", async () => {
			const write = installClipboard();
			const { rerender } = renderWithProvider(
				<OrdersToolbar
					{...ordersProps}
					selectedRows={[rowA]}
					selectedCount={1}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));
			await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
			expect((await readLastPayload(write)).text).toContain("VIN-A");

			rerender(
				<TooltipProvider>
					<OrdersToolbar
						{...ordersProps}
						selectedRows={[rowC]}
						selectedCount={1}
					/>
				</TooltipProvider>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));
			await waitFor(() => expect(write).toHaveBeenCalledTimes(2));
			expect((await readLastPayload(write)).text).toContain("0000123");
			expect((await readLastPayload(write)).text).not.toContain("VIN-A");
		});
	});

	describe("mounted view isolation", () => {
		it("keeps draft rows and selections in separate mounted views apart", async () => {
			const write = installClipboard();
			const draftRow = makeRow("draft-temp-1", {
				customerName: "Draft Customer",
			});
			const otherRow = makeRow("row-2", { customerName: "Other Customer" });
			const firstView = createWiredGridApi([
				createMockGridNode({ selected: true, data: draftRow }),
			]);
			const secondView = createWiredGridApi([
				createMockGridNode({ selected: true, data: otherRow }),
			]);

			render(
				<TooltipProvider>
					<OrdersToolbar
						{...ordersProps}
						selectedRows={[]}
						selectedCount={1}
						gridApi={firstView.api}
					/>
					<OrdersToolbar
						{...ordersProps}
						selectedRows={[]}
						selectedCount={1}
						gridApi={secondView.api}
					/>
				</TooltipProvider>,
			);

			const buttons = screen.getAllByRole("button", { name: "Copy for Email" });
			expect(buttons).toHaveLength(2);

			fireEvent.click(buttons[0]);
			await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
			fireEvent.click(buttons[1]);
			await waitFor(() => expect(write).toHaveBeenCalledTimes(2));

			const firstPayload = await readPayloadAt(write, 0);
			const secondPayload = await readPayloadAt(write, 1);
			expect(firstPayload.text).toContain("Draft Customer");
			expect(firstPayload.text).not.toContain("Other Customer");
			expect(secondPayload.text).toContain("Other Customer");
			expect(secondPayload.text).not.toContain("Draft Customer");
		});
	});

	describe("omitted selection prop", () => {
		const withoutSelectedRows = <T extends { selectedRows?: PendingRow[] }>(
			props: T,
		) => {
			const rest = { ...props };
			delete rest.selectedRows;
			return rest;
		};

		const casesWithoutSelection: Array<{
			name: string;
			element: ReactElement;
		}> = [
			{
				name: "Orders",
				element: <OrdersToolbar {...withoutSelectedRows(ordersProps)} />,
			},
			{
				name: "Main Sheet",
				element: <MainSheetToolbar {...withoutSelectedRows(mainSheetProps)} />,
			},
			{
				name: "Call List",
				element: <CallListToolbar {...withoutSelectedRows(callListProps)} />,
			},
			{
				name: "Booking",
				element: <BookingToolbar {...withoutSelectedRows(bookingProps)} />,
			},
			{
				name: "Archive",
				element: <ArchiveToolbar {...withoutSelectedRows(archiveProps)} />,
			},
			{
				name: "Freeze",
				element: <FreezeToolbar {...withoutSelectedRows(freezeProps)} />,
			},
			{
				name: "Global Search",
				element: <SearchToolbar {...withoutSelectedRows(searchProps)} />,
			},
		];

		it.each(
			casesWithoutSelection,
		)("$name renders once and stays disabled without selectedRows", ({
			element,
		}) => {
			const write = installClipboard();
			renderWithProvider(element);

			const copyButton = screen.getByRole("button", { name: "Copy for Email" });
			expect(copyButton).toBeDisabled();
			fireEvent.click(copyButton);
			expect(write).not.toHaveBeenCalled();
		});
	});

	describe("global search multi-source selection", () => {
		it("copies rows from multiple source stages together", async () => {
			const write = installClipboard();
			const mainRow = makeRow("M", { stage: "main", sourceType: "Main Sheet" });
			const archiveRow = makeRow("R", {
				stage: "archive",
				sourceType: "Archive",
			});

			renderWithProvider(
				<SearchToolbar
					{...searchProps}
					selectedRows={[mainRow, archiveRow]}
					selectedCount={2}
					isSameSource={false}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));

			await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
			const lines = (await readLastPayload(write)).text.split("\n");
			expect(lines).toHaveLength(3);
			expect(lines[1]).toContain("VIN-M");
			expect(lines[2]).toContain("VIN-R");
		});
	});

	describe("clipboard feedback", () => {
		it("reports success only after the formatted write resolves", async () => {
			let resolveWrite: (() => void) | undefined;
			const write = installClipboard(
				() =>
					new Promise<void>((resolve) => {
						resolveWrite = resolve;
					}),
			);

			renderWithProvider(
				<OrdersToolbar
					{...ordersProps}
					selectedRows={[rowA]}
					selectedCount={1}
				/>,
			);
			fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));

			await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
			expect(mocks.toastSuccess).not.toHaveBeenCalled();

			await act(async () => {
				resolveWrite?.();
			});

			await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledTimes(1));
		});

		it("reports an error and keeps the selection when the write rejects", async () => {
			const write = installClipboard(() =>
				Promise.reject(new Error("blocked")),
			);

			renderWithProvider(
				<OrdersToolbar
					{...ordersProps}
					selectedRows={[rowA]}
					selectedCount={1}
				/>,
			);
			const copyButton = screen.getByRole("button", { name: "Copy for Email" });
			fireEvent.click(copyButton);

			await waitFor(() => expect(mocks.toastError).toHaveBeenCalledTimes(1));
			expect(mocks.toastSuccess).not.toHaveBeenCalled();
			expect(write).toHaveBeenCalledTimes(1);
			expect(copyButton).toBeEnabled();
		});

		it("does not write plain text only when formatted copy is unavailable", () => {
			const write = installClipboard();
			vi.stubGlobal("ClipboardItem", undefined);

			renderWithProvider(
				<OrdersToolbar
					{...ordersProps}
					selectedRows={[rowA]}
					selectedCount={1}
				/>,
			);
			fireEvent.click(screen.getByRole("button", { name: "Copy for Email" }));

			expect(write).not.toHaveBeenCalled();
			expect(mocks.toastError).toHaveBeenCalledTimes(1);
		});
	});
});
