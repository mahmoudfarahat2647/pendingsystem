import "@testing-library/jest-dom";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { ButtonHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as orderWorkflow from "@/lib/orderWorkflow";
import { appendTaggedUserNote } from "@/lib/orderWorkflow";
import type { PendingRow } from "@/types";
import {
	createMockGridApi,
	createMockGridNode,
	type MockGridApi,
} from "./utils/gridTestHelpers";

type MockCellValueChangedEvent = {
	colDef: { field?: string };
	data: PendingRow;
	newValue: string;
	oldValue: string;
};

type MockSelectionChangedEvent = {
	api: MockGridApi;
};

type MockGridProps = {
	rowData: PendingRow[];
	onCellValueChanged: (event: MockCellValueChangedEvent) => Promise<void>;
	onSelectionChanged: (event: MockSelectionChangedEvent) => void;
	onGridApiReady?: (api: MockGridApi) => void;
	onDisplayedRowsChanged?: (api: MockGridApi) => void;
	onGridPreDestroyed?: () => void;
};

type MockSearchToolbarProps = {
	selectedCount: number;
	isSameSource: boolean;
	onReserve: () => void;
	onUpdateStatus: (status: string) => void;
	onBooking: () => void;
	onArchive: () => void;
	onSendToCallList: () => void;
	onReorder: () => void;
};

type MockBookingModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (date: string, note: string, status?: string) => void;
	selectedRows: PendingRow[];
	bookingOnly?: boolean;
};

type MockArchiveModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (reason: string) => void;
};

const mocks = vi.hoisted(() => ({
	toastSuccess: vi.fn(),
	toastError: vi.fn(),
	toastWarning: vi.fn(),
	printReservationLabels: vi.fn(),
	saveMutateAsync: vi.fn(),
	deleteMutateAsync: vi.fn(),
	bulkMutations: {
		main: vi.fn(),
		orders: vi.fn(),
		booking: vi.fn(),
		call: vi.fn(),
		archive: vi.fn(),
	},
	gridProps: null as MockGridProps | null,
	gridRowData: null as PendingRow[] | null,
	gridColumnsArgs: null as unknown[] | null,
	searchToolbarProps: null as MockSearchToolbarProps | null,
	bookingModalProps: null as MockBookingModalProps | null,
	lastOpenedBookingModalProps: null as MockBookingModalProps | null,
	archiveModalProps: null as MockArchiveModalProps | null,
	bookingConfirmPayload: {
		date: "2026-03-20",
		note: "Bulk booking note",
		status: undefined as string | undefined,
	},
	archiveConfirmReason: "duplicate",
	rowModalOnUpdate: null as
		| ((id: string, updates: Partial<PendingRow>, stage?: string) => unknown)
		| null,
	storeState: {
		searchTerm: "VIN123",
		setSearchTerm: vi.fn(),
		partStatuses: [] as { id: string; label: string; color: string }[],
		bookingStatuses: [] as { id: string; label: string; color: string }[],
	},
	queryData: {
		main: [] as PendingRow[],
		orders: [] as PendingRow[],
		booking: [] as PendingRow[],
		call: [] as PendingRow[],
		archive: [] as PendingRow[],
	},
	rowModals: {
		activeModal: null,
		currentRow: null,
		handleNoteClick: vi.fn(),
		handleReminderClick: vi.fn(),
		handleAttachClick: vi.fn(),
		closeModal: vi.fn(),
		saveNote: vi.fn(),
		saveReminder: vi.fn(),
		saveAttachment: vi.fn(),
		saveArchive: vi.fn(),
		sourceTag: "search",
	},
}));

vi.mock("sonner", () => ({
	toast: {
		success: mocks.toastSuccess,
		error: mocks.toastError,
		warning: mocks.toastWarning,
	},
}));

vi.mock("@/lib/printing/reservationLabels", () => ({
	printReservationLabels: mocks.printReservationLabels,
}));

vi.mock("@/store/useStore", () => ({
	useAppStore: Object.assign(
		(selector: (state: typeof mocks.storeState) => unknown) =>
			selector(mocks.storeState),
		{
			getState: () => mocks.storeState,
		},
	),
}));

vi.mock("@/hooks/queries/useOrdersQuery", () => ({
	useOrdersQuery: vi.fn((stage?: keyof typeof mocks.queryData) => ({
		data: stage ? mocks.queryData[stage] : [],
	})),
	useSaveOrderMutation: vi.fn(() => ({
		mutateAsync: mocks.saveMutateAsync,
	})),
	useBulkDeleteOrdersMutation: vi.fn(() => ({
		mutateAsync: mocks.deleteMutateAsync,
	})),
	useBulkUpdateOrderStageMutation: vi.fn(
		(stage: keyof typeof mocks.bulkMutations) => ({
			mutateAsync: mocks.bulkMutations[stage],
		}),
	),
}));

vi.mock("@/hooks/useRowModals", () => ({
	useRowModals: vi.fn(
		(
			onUpdate: (
				id: string,
				updates: Partial<PendingRow>,
				stage?: string,
			) => unknown,
		) => {
			mocks.rowModalOnUpdate = onUpdate;
			return mocks.rowModals;
		},
	),
}));

vi.mock("@/components/shared/GridConfig", () => ({
	getGlobalSearchWorkspaceColumns: vi.fn((...args: unknown[]) => {
		mocks.gridColumnsArgs = args;
		return [];
	}),
}));

vi.mock("@/components/shared/search/SearchResultsGrid", () => ({
	SearchResultsGrid: (props: MockGridProps) => {
		mocks.gridProps = props;
		mocks.gridRowData = props.rowData;
		return <div data-testid="search-results-grid" />;
	},
}));

vi.mock("@/components/shared/search/SearchResultsHeader", () => ({
	SearchResultsHeader: () => <div data-testid="search-results-header" />,
}));

vi.mock("@/components/shared/search/SearchToolbar", () => ({
	SearchToolbar: (props: MockSearchToolbarProps) => {
		mocks.searchToolbarProps = props;
		return (
			<div data-testid="search-toolbar">
				<button
					type="button"
					data-testid="search-toolbar-reserve"
					disabled={props.selectedCount === 0}
					onClick={props.onReserve}
				>
					Reserve
				</button>
				<button
					type="button"
					data-testid="search-toolbar-status-arrived"
					disabled={props.selectedCount === 0 || !props.isSameSource}
					onClick={() => props.onUpdateStatus("Arrived")}
				>
					Status Arrived
				</button>
				<button
					type="button"
					data-testid="search-toolbar-booking"
					disabled={props.selectedCount === 0 || !props.isSameSource}
					onClick={props.onBooking}
				>
					Booking
				</button>
				<button
					type="button"
					data-testid="search-toolbar-archive"
					disabled={props.selectedCount === 0 || !props.isSameSource}
					onClick={props.onArchive}
				>
					Archive
				</button>
				<button
					type="button"
					data-testid="search-toolbar-call"
					onClick={props.onSendToCallList}
				>
					Call
				</button>
				<button
					type="button"
					data-testid="search-toolbar-reorder"
					disabled={props.selectedCount === 0 || !props.isSameSource}
					onClick={props.onReorder}
				>
					Reorder
				</button>
			</div>
		);
	},
}));

vi.mock("@/components/shared/RowModals", () => ({
	RowModals: () => null,
}));

vi.mock("@/components/shared/ConfirmDialog", () => ({
	ConfirmDialog: () => null,
}));

vi.mock("@/components/shared/BookingCalendarModal", () => ({
	BookingCalendarModal: (props: MockBookingModalProps) => {
		mocks.bookingModalProps = props;
		if (props.open) {
			mocks.lastOpenedBookingModalProps = props;
		}

		if (!props.open) {
			return null;
		}

		return (
			<div data-testid="booking-modal">
				<div data-testid="booking-modal-selected-count">
					{props.selectedRows.length}
				</div>
				<button
					type="button"
					data-testid="booking-modal-confirm"
					onClick={() =>
						props.onConfirm(
							mocks.bookingConfirmPayload.date,
							mocks.bookingConfirmPayload.note,
							mocks.bookingConfirmPayload.status,
						)
					}
				>
					Confirm booking
				</button>
			</div>
		);
	},
}));

vi.mock("@/components/shared/ArchiveReasonModal", () => ({
	ArchiveReasonModal: (props: MockArchiveModalProps) => {
		mocks.archiveModalProps = props;
		if (!props.open) {
			return null;
		}

		return (
			<div data-testid="archive-modal">
				<button
					type="button"
					data-testid="archive-modal-confirm"
					onClick={() => props.onSave(mocks.archiveConfirmReason)}
				>
					Confirm archive
				</button>
			</div>
		);
	},
}));

vi.mock("@/components/ui/button", () => ({
	Button: (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
		<button type="button" {...props} />
	),
}));

import { SearchResultsView } from "@/components/shared/SearchResultsView";

const createRow = (overrides: Partial<PendingRow> = {}): PendingRow =>
	({
		id: "row-1",
		baseId: "B1",
		trackingId: "T1",
		customerName: "Test Customer",
		company: "pendingsystem",
		vin: "VIN123",
		mobile: "0100000000",
		cntrRdg: 0,
		model: "Clio",
		parts: [],
		sabNumber: "SAB-1",
		acceptedBy: "Agent",
		requester: "Requester",
		partNumber: "P1",
		description: "Front bumper",
		status: "Not Arrived",
		rDate: "2024-01-01",
		repairSystem: "System",
		startWarranty: "",
		endWarranty: "",
		remainTime: "",
		stage: "main",
		sourceType: "Main Sheet",
		...overrides,
	}) as PendingRow;

const renderView = () => render(<SearchResultsView />);

const getRenderedRowIds = () => (mocks.gridRowData ?? []).map((row) => row.id);

const getMasterCheckboxState = () =>
	(mocks.gridColumnsArgs?.[4] as { current?: unknown } | undefined)?.current;

const getOnSelectAllFiltered = () =>
	mocks.gridColumnsArgs?.[5] as ((selected: boolean) => void) | undefined;

const triggerCellValueChanged = async (event: MockCellValueChangedEvent) => {
	expect(mocks.gridProps).toBeTruthy();
	await act(async () => {
		await mocks.gridProps?.onCellValueChanged(event);
	});
};

const connectGridApi = async (api: MockGridApi) => {
	expect(mocks.gridProps).toBeTruthy();
	await act(async () => {
		mocks.gridProps?.onGridApiReady?.(api);
	});
};

const triggerSelectionChanged = async (
	rows: PendingRow[],
	api = createMockGridApi({
		filteredNodes: rows.map((r) =>
			createMockGridNode({ selected: true, data: r }),
		),
	}),
) => {
	expect(mocks.gridProps).toBeTruthy();
	await act(async () => {
		mocks.gridProps?.onSelectionChanged({ api });
	});
};

const triggerDisplayedRowsChanged = async (api: MockGridApi) => {
	expect(mocks.gridProps).toBeTruthy();
	await act(async () => {
		mocks.gridProps?.onDisplayedRowsChanged?.(api);
	});
};

const triggerGridPreDestroyed = async () => {
	expect(mocks.gridProps).toBeTruthy();
	await act(async () => {
		mocks.gridProps?.onGridPreDestroyed?.();
	});
};

const openBookingModal = async (rows: PendingRow[]) => {
	await triggerSelectionChanged(rows);

	const bookingButton = screen.getByTestId("search-toolbar-booking");
	expect(bookingButton).toBeEnabled();

	fireEvent.click(bookingButton);

	await waitFor(() => {
		expect(screen.getByTestId("booking-modal")).toBeInTheDocument();
	});
};

const openArchiveModal = async (rows: PendingRow[]) => {
	await triggerSelectionChanged(rows);

	const archiveButton = screen.getByTestId("search-toolbar-archive");
	expect(archiveButton).toBeEnabled();

	fireEvent.click(archiveButton);

	await screen.findByTestId("archive-modal");
};

describe("SearchResultsView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.gridProps = null;
		mocks.gridRowData = null;
		mocks.gridColumnsArgs = null;
		mocks.searchToolbarProps = null;
		mocks.bookingModalProps = null;
		mocks.lastOpenedBookingModalProps = null;
		mocks.archiveModalProps = null;
		mocks.rowModalOnUpdate = null;
		mocks.bookingConfirmPayload = {
			date: "2026-03-20",
			note: "Bulk booking note",
			status: undefined,
		};
		mocks.archiveConfirmReason = "duplicate";
		mocks.storeState.searchTerm = "VIN123";
		mocks.storeState.partStatuses = [
			{ id: "reserve", label: "Reserve", color: "#2563eb" },
			{ id: "arrived", label: "Arrived", color: "#10b981" },
			{ id: "not_arrived", label: "Not Arrived", color: "#1f2937" },
		];
		mocks.queryData.main = [];
		mocks.queryData.orders = [];
		mocks.queryData.booking = [];
		mocks.queryData.call = [];
		mocks.queryData.archive = [];
		mocks.printReservationLabels.mockReset();
		mocks.saveMutateAsync.mockResolvedValue(undefined);
		mocks.deleteMutateAsync.mockResolvedValue(undefined);
		for (const mutation of Object.values(mocks.bulkMutations)) {
			mutation.mockResolvedValue(undefined);
		}
	});

	it.each([
		{
			label: "baseId",
			query: "base-search-hit-1",
			matchingOverrides: { baseId: "BASE-SEARCH-HIT-1" },
			nonMatchingOverrides: { baseId: "BASE-OTHER-1" },
		},
		{
			label: "trackingId",
			query: "trk-search-hit-1",
			matchingOverrides: { trackingId: "TRK-SEARCH-HIT-1" },
			nonMatchingOverrides: { trackingId: "TRK-OTHER-1" },
		},
		{
			label: "requester",
			query: "requester-search-hit",
			matchingOverrides: { requester: "Requester-Search-Hit" },
			nonMatchingOverrides: { requester: "Different Requester" },
		},
		{
			label: "noteContent",
			query: "notecontent-search-hit",
			matchingOverrides: { noteContent: "NoteContent-Search-Hit" },
		},
		{
			label: "noteHistory",
			query: "notehistory-search-hit",
			matchingOverrides: { noteHistory: "NoteHistory-Search-Hit" },
		},
		{
			label: "actionNote",
			query: "actionnote-search-hit",
			matchingOverrides: { actionNote: "ActionNote-Search-Hit" },
		},
		{
			label: "bookingDate",
			query: "2031-07-19",
			matchingOverrides: { bookingDate: "2031-07-19" },
			nonMatchingOverrides: { bookingDate: "2031-07-20" },
		},
		{
			label: "bookingNote",
			query: "bookingnote-search-hit",
			matchingOverrides: { bookingNote: "BookingNote-Search-Hit" },
		},
		{
			label: "archiveReason",
			query: "archive-search-hit",
			matchingOverrides: { archiveReason: "Archive-Search-Hit" },
		},
		{
			label: "rDate",
			query: "2032-08-21",
			matchingOverrides: { rDate: "2032-08-21" },
			nonMatchingOverrides: { rDate: "2032-08-22" },
		},
	])("matches rows by restored $label field", (testCase) => {
		const matchingRow = createRow({
			id: "search-match",
			...testCase.matchingOverrides,
		});
		const nonMatchingRow = createRow({
			id: "search-other",
			vin: "VIN999",
			...testCase.nonMatchingOverrides,
		});
		mocks.storeState.searchTerm = testCase.query;
		mocks.queryData.main = [matchingRow, nonMatchingRow];

		renderView();

		expect(screen.getByTestId("search-results-grid")).toBeInTheDocument();
		expect(getRenderedRowIds()).toEqual(["search-match"]);
	});

	it("keeps AND semantics when a query mixes existing and restored fields", () => {
		const matchingRow = createRow({
			id: "and-match",
			customerName: "Alice Johnson",
			trackingId: "AND-TRACK-123",
		});
		const wrongTrackingRow = createRow({
			id: "and-wrong-tracking",
			customerName: "Alice Johnson",
			trackingId: "AND-TRACK-999",
		});
		const wrongNameRow = createRow({
			id: "and-wrong-name",
			customerName: "Bob Stone",
			trackingId: "AND-TRACK-123",
		});
		mocks.storeState.searchTerm = "alice and-track-123";
		mocks.queryData.main = [matchingRow, wrongTrackingRow, wrongNameRow];

		renderView();

		expect(screen.getByTestId("search-results-grid")).toBeInTheDocument();
		expect(getRenderedRowIds()).toEqual(["and-match"]);
	});

	it("treats missing restored fields as empty strings without producing false matches", () => {
		const row = createRow({
			id: "search-empty-fields",
			baseId: "",
			trackingId: "",
			requester: "",
			rDate: "",
			company: undefined,
			noteContent: undefined,
			noteHistory: undefined,
			actionNote: undefined,
			bookingDate: undefined,
			bookingNote: undefined,
			archiveReason: undefined,
		});
		mocks.storeState.searchTerm = "missing-restored-field-token";
		mocks.queryData.main = [row];

		renderView();

		expect(screen.queryByTestId("search-results-grid")).not.toBeInTheDocument();
		expect(screen.getByText("No results found")).toBeInTheDocument();
		expect(mocks.gridRowData).toBeNull();
	});

	it("does not inject pendingsystem into rows with an empty company field", () => {
		const emptyCompanyRow = createRow({
			id: "company-empty",
			company: undefined,
			noteContent: undefined,
			noteHistory: undefined,
			actionNote: undefined,
			bookingNote: undefined,
			archiveReason: undefined,
		});
		const legitimateMatchRow = createRow({
			id: "company-real-match",
			company: undefined,
			noteContent: "Pendingsystem follow-up note",
		});
		mocks.storeState.searchTerm = "pendingsystem";
		mocks.queryData.main = [emptyCompanyRow, legitimateMatchRow];

		renderView();

		expect(screen.getByTestId("search-results-grid")).toBeInTheDocument();
		expect(getRenderedRowIds()).toEqual(["company-real-match"]);
	});

	it("wires the header checkbox to filtered select-all and clear-all", async () => {
		const firstRow = createRow({ id: "main-1" });
		const secondRow = createRow({ id: "main-2", vin: "VIN456" });
		mocks.queryData.main = [firstRow, secondRow];

		renderView();

		const gridApi = createMockGridApi();
		await connectGridApi(gridApi);

		const onSelectAllFiltered = getOnSelectAllFiltered();
		expect(onSelectAllFiltered).toBeTypeOf("function");

		await act(async () => {
			onSelectAllFiltered?.(true);
		});
		expect(gridApi.selectAllFiltered).toHaveBeenCalledTimes(1);

		await act(async () => {
			onSelectAllFiltered?.(false);
		});
		expect(gridApi.deselectAllFiltered).toHaveBeenCalledTimes(1);
		expect(mocks.searchToolbarProps?.selectedCount).toBe(0);
	});

	it("enables bulk actions only after the grid emits selectionChanged", async () => {
		const firstRow = createRow({ id: "main-1" });
		const secondRow = createRow({ id: "main-2", vin: "VIN456" });
		mocks.queryData.main = [firstRow, secondRow];

		renderView();

		const gridApi = createMockGridApi();
		await connectGridApi(gridApi);

		await act(async () => {
			getOnSelectAllFiltered()?.(true);
		});
		expect(mocks.searchToolbarProps?.selectedCount).toBe(0);

		await triggerSelectionChanged(
			[firstRow, secondRow],
			createMockGridApi({
				selectedRows: [firstRow, secondRow],
				filteredNodes: [
					createMockGridNode({ selected: true, data: firstRow }),
					createMockGridNode({ selected: true, data: secondRow }),
				],
			}),
		);

		expect(mocks.searchToolbarProps?.selectedCount).toBe(2);
		expect(screen.getByTestId("search-toolbar-booking")).toBeEnabled();
	});

	it("sets the header checkbox state to indeterminate for partial visible selection", async () => {
		const firstRow = createRow({ id: "main-1" });
		const secondRow = createRow({ id: "main-2", vin: "VIN456" });
		const thirdRow = createRow({ id: "main-3", vin: "VIN789" });
		mocks.queryData.main = [firstRow, secondRow, thirdRow];

		renderView();

		const gridApi = createMockGridApi({
			filteredNodes: [
				createMockGridNode({ selected: true }),
				createMockGridNode({ selected: false }),
				createMockGridNode({ selected: false }),
			],
		});

		await connectGridApi(gridApi);
		await triggerDisplayedRowsChanged(gridApi);

		expect(getMasterCheckboxState()).toBe("indeterminate");
	});

	it("recomputes the header checkbox state from visible rows on model updates", async () => {
		mocks.storeState.searchTerm = "VIN";
		const rows = [
			createRow({ id: "main-1", vin: "VIN001" }),
			createRow({ id: "main-2", vin: "VIN002" }),
			createRow({ id: "main-3", vin: "VIN003" }),
			createRow({ id: "main-4", vin: "VIN004" }),
			createRow({ id: "main-5", vin: "VIN005" }),
		];
		mocks.queryData.main = rows;

		renderView();

		const mockNodes = rows.map((r) =>
			createMockGridNode({ selected: true, data: r }),
		);
		await triggerSelectionChanged(
			rows,
			createMockGridApi({
				filteredNodes: mockNodes,
			}),
		);
		expect(getMasterCheckboxState()).toBe(true);

		await triggerDisplayedRowsChanged(
			createMockGridApi({
				filteredNodes: [
					createMockGridNode({ selected: false }),
					createMockGridNode({ selected: false }),
				],
				allNodes: mockNodes,
			}),
		);

		expect(getMasterCheckboxState()).toBe(false);
		expect(mocks.searchToolbarProps?.selectedCount).toBe(0);
	});

	it("filter prunes selection count and prevents hidden rows from reaching bulk actions", async () => {
		const rows = [
			createRow({ id: "main-1", vin: "VIN123" }),
			createRow({ id: "main-2", vin: "VIN123" }),
			createRow({ id: "main-3", vin: "VIN123" }),
		];
		mocks.queryData.main = rows;
		renderView();

		const mockNodes = rows.map((r) =>
			createMockGridNode({ selected: true, data: r }),
		);

		await triggerSelectionChanged(
			rows,
			createMockGridApi({
				filteredNodes: mockNodes,
			}),
		);

		// Now filter to just 1 row visible
		const visibleNode = mockNodes[0];
		await triggerDisplayedRowsChanged(
			createMockGridApi({
				filteredNodes: [visibleNode],
				allNodes: mockNodes,
			}),
		);

		expect(mocks.searchToolbarProps?.selectedCount).toBe(1);

		// Open booking - should only have 1 row
		await openBookingModal([rows[0]]);
		await act(async () => {
			fireEvent.click(screen.getByTestId("booking-modal-confirm"));
		});

		await waitFor(() => {
			expect(mocks.saveMutateAsync).toHaveBeenCalledTimes(1);
			expect(mocks.saveMutateAsync).toHaveBeenCalledWith(
				expect.objectContaining({ id: "main-1" }),
			);
		});
	});

	it("clears the stored grid API state when the grid is destroyed", async () => {
		const firstRow = createRow({ id: "main-1" });
		const secondRow = createRow({ id: "main-2", vin: "VIN456" });
		mocks.queryData.main = [firstRow, secondRow];

		renderView();

		const gridApi = createMockGridApi({
			filteredNodes: [
				createMockGridNode({ selected: true }),
				createMockGridNode({ selected: false }),
			],
		});
		await connectGridApi(gridApi);
		await triggerDisplayedRowsChanged(gridApi);
		await triggerSelectionChanged(
			[firstRow],
			createMockGridApi({
				selectedRows: [firstRow],
				filteredNodes: [
					createMockGridNode({ selected: true, data: firstRow }),
					createMockGridNode({ selected: false, data: secondRow }),
				],
			}),
		);

		expect(getMasterCheckboxState()).toBe("indeterminate");
		expect(mocks.searchToolbarProps?.selectedCount).toBe(1);

		await triggerGridPreDestroyed();
		expect(getMasterCheckboxState()).toBe(false);
		expect(mocks.searchToolbarProps?.selectedCount).toBe(0);

		await act(async () => {
			getOnSelectAllFiltered()?.(true);
		});
		expect(gridApi.selectAllFiltered).not.toHaveBeenCalled();
	});

	it("moves a main VIN group to call when the last part becomes Arrived", async () => {
		const firstRow = createRow({
			id: "main-1",
			stage: "main",
			sourceType: "Main Sheet",
			status: "Not Arrived",
		});
		const secondRow = createRow({
			id: "main-2",
			stage: "main",
			sourceType: "Main Sheet",
			status: "Arrived",
		});
		mocks.queryData.main = [firstRow, secondRow];

		renderView();

		await triggerCellValueChanged({
			colDef: { field: "status" },
			data: firstRow,
			newValue: "Arrived",
			oldValue: "Not Arrived",
		});

		expect(mocks.saveMutateAsync).toHaveBeenCalledWith({
			id: "main-1",
			updates: { status: "Arrived" },
			stage: "main",
			sourceStage: "main",
		});
		expect(mocks.bulkMutations.main).toHaveBeenCalledWith({
			ids: ["main-1", "main-2"],
			stage: "call",
			silentErrorToast: true,
		});
		expect(mocks.toastSuccess).toHaveBeenCalledWith(
			"All parts for VIN VIN123 arrived! Moved to Call List.",
			{ duration: 5000 },
		);
	});

	it("opens bulk booking with selected rows and without the removed bookingOnly prop", async () => {
		const firstRow = createRow({
			id: "main-1",
			stage: "main",
			sourceType: "Main Sheet",
		});
		const secondRow = createRow({
			id: "main-2",
			stage: "main",
			sourceType: "Main Sheet",
		});
		mocks.queryData.main = [firstRow, secondRow];

		renderView();
		await openBookingModal([firstRow, secondRow]);

		expect(mocks.lastOpenedBookingModalProps?.selectedRows).toEqual([
			firstRow,
			secondRow,
		]);
		expect(
			mocks.lastOpenedBookingModalProps
				? "bookingOnly" in mocks.lastOpenedBookingModalProps
				: true,
		).toBe(false);
		expect(
			screen.getByTestId("booking-modal-selected-count"),
		).toHaveTextContent("2");
	});

	it("prints reservation labels for selected search rows without mutating orders", async () => {
		const firstRow = createRow({
			id: "main-1",
			stage: "main",
			sourceType: "Main Sheet",
			status: "Reserve",
		});
		const secondRow = createRow({
			id: "main-2",
			stage: "main",
			sourceType: "Main Sheet",
			status: "Reserve",
		});
		mocks.queryData.main = [firstRow, secondRow];

		renderView();
		await triggerSelectionChanged([firstRow, secondRow]);

		const reserveButton = screen.getByTestId("search-toolbar-reserve");
		expect(reserveButton).toBeEnabled();

		fireEvent.click(reserveButton);

		expect(mocks.printReservationLabels).toHaveBeenCalledTimes(1);
		expect(mocks.printReservationLabels).toHaveBeenCalledWith([
			firstRow,
			secondRow,
		]);
		expect(mocks.saveMutateAsync).not.toHaveBeenCalled();
		expect(mocks.toastSuccess).not.toHaveBeenCalled();
		expect(mocks.toastError).not.toHaveBeenCalled();
	});

	it("updates the STATS status field from the toolbar for selected search rows", async () => {
		const firstRow = createRow({
			id: "main-1",
			stage: "main",
			sourceType: "Main Sheet",
		});
		const secondRow = createRow({
			id: "main-2",
			stage: "main",
			sourceType: "Main Sheet",
		});
		mocks.queryData.main = [firstRow, secondRow];

		renderView();
		await triggerSelectionChanged([firstRow, secondRow]);

		fireEvent.click(screen.getByTestId("search-toolbar-status-arrived"));

		await waitFor(() => {
			expect(mocks.saveMutateAsync).toHaveBeenCalledTimes(2);
		});
		expect(mocks.saveMutateAsync).toHaveBeenNthCalledWith(1, {
			id: "main-1",
			updates: { status: "Arrived" },
			stage: "main",
			sourceStage: "main",
		});
		expect(mocks.saveMutateAsync).toHaveBeenNthCalledWith(2, {
			id: "main-2",
			updates: { status: "Arrived" },
			stage: "main",
			sourceStage: "main",
		});
		expect(mocks.toastSuccess).toHaveBeenCalledWith(
			"Updated status for 2 rows",
		);
	});

	it("books all selected rows and closes the modal on confirm", async () => {
		const firstRow = createRow({
			id: "main-1",
			stage: "main",
			sourceType: "Main Sheet",
		});
		const secondRow = createRow({
			id: "main-2",
			stage: "main",
			sourceType: "Main Sheet",
		});
		mocks.queryData.main = [firstRow, secondRow];

		renderView();
		await openBookingModal([firstRow, secondRow]);

		await act(async () => {
			fireEvent.click(screen.getByTestId("booking-modal-confirm"));
		});

		await waitFor(() => {
			expect(mocks.saveMutateAsync).toHaveBeenCalledTimes(2);
		});
		expect(mocks.saveMutateAsync).toHaveBeenNthCalledWith(1, {
			id: "main-1",
			updates: {
				bookingDate: "2026-03-20",
				bookingNote: "Bulk booking note",
				noteHistory: "Bulk booking note #booking",
			},
			stage: "booking",
			sourceStage: "main",
		});
		expect(mocks.saveMutateAsync).toHaveBeenNthCalledWith(2, {
			id: "main-2",
			updates: {
				bookingDate: "2026-03-20",
				bookingNote: "Bulk booking note",
				noteHistory: "Bulk booking note #booking",
			},
			stage: "booking",
			sourceStage: "main",
		});
		expect(mocks.toastSuccess).toHaveBeenCalledWith(
			"Booked 2 rows for 2026-03-20",
		);
		await waitFor(() => {
			expect(screen.queryByTestId("booking-modal")).not.toBeInTheDocument();
		});
	});

	it("blank status omits bookingStatus but writes noteHistory", async () => {
		const row = createRow({ id: "main-1", noteHistory: "Old note" });
		mocks.queryData.main = [row];
		mocks.bookingConfirmPayload.status = undefined;

		renderView();
		await openBookingModal([row]);
		await act(async () => {
			fireEvent.click(screen.getByTestId("booking-modal-confirm"));
		});

		await waitFor(() => {
			expect(mocks.saveMutateAsync).toHaveBeenCalledTimes(1);
		});
		const payload = mocks.saveMutateAsync.mock.calls[0][0];
		expect(payload.updates).not.toHaveProperty("bookingStatus");
		expect(payload.updates.noteHistory).toBe(
			"Old note\nBulk booking note #booking",
		);
	});

	it("explicit status includes bookingStatus alongside noteHistory", async () => {
		const row = createRow({ id: "main-1" });
		mocks.queryData.main = [row];
		mocks.bookingConfirmPayload.status = "Delivered";

		renderView();
		await openBookingModal([row]);
		await act(async () => {
			fireEvent.click(screen.getByTestId("booking-modal-confirm"));
		});

		await waitFor(() => {
			expect(mocks.saveMutateAsync).toHaveBeenCalledTimes(1);
		});
		const payload = mocks.saveMutateAsync.mock.calls[0][0];
		expect(payload.updates.bookingStatus).toBe("Delivered");
		expect(payload.updates.noteHistory).toBe("Bulk booking note #booking");
	});

	it("shows a booking error toast and keeps the modal open when any booking save fails", async () => {
		const firstRow = createRow({
			id: "main-1",
			stage: "main",
			sourceType: "Main Sheet",
		});
		const secondRow = createRow({
			id: "main-2",
			stage: "main",
			sourceType: "Main Sheet",
		});
		mocks.queryData.main = [firstRow, secondRow];
		mocks.saveMutateAsync.mockReset();
		mocks.saveMutateAsync
			.mockResolvedValueOnce(undefined)
			.mockRejectedValueOnce(new Error("save failed"));

		renderView();
		await openBookingModal([firstRow, secondRow]);

		await act(async () => {
			fireEvent.click(screen.getByTestId("booking-modal-confirm"));
		});

		await waitFor(() => {
			expect(mocks.toastError).toHaveBeenCalledWith("Booking failed");
		});
		expect(mocks.saveMutateAsync).toHaveBeenCalledTimes(2);
		expect(mocks.toastSuccess).not.toHaveBeenCalled();
		expect(screen.getByTestId("booking-modal")).toBeInTheDocument();
	});

	it("archives legacy notes by seeding from effective note history", async () => {
		const row = createRow({
			id: "main-1",
			stage: "main",
			sourceType: "Main Sheet",
			noteHistory: undefined,
			actionNote: "legacy action text",
		});
		const noteHistorySpy = vi.spyOn(orderWorkflow, "getEffectiveNoteHistory");
		mocks.queryData.main = [row];

		try {
			renderView();
			await openArchiveModal([row]);

			await act(async () => {
				fireEvent.click(screen.getByTestId("archive-modal-confirm"));
			});

			await waitFor(() => {
				expect(mocks.saveMutateAsync).toHaveBeenCalledTimes(1);
			});

			expect(noteHistorySpy).toHaveBeenCalledTimes(1);
			expect(noteHistorySpy).toHaveBeenCalledWith(row);
			expect(mocks.saveMutateAsync).toHaveBeenCalledWith({
				id: "main-1",
				updates: {
					archiveReason: "duplicate",
					noteHistory: appendTaggedUserNote(
						"legacy action text",
						"duplicate",
						"archive",
					),
				},
				stage: "archive",
				sourceStage: "main",
			});
			await waitFor(() => {
				expect(screen.queryByTestId("archive-modal")).not.toBeInTheDocument();
			});
		} finally {
			noteHistorySpy.mockRestore();
		}
	});

	it("does not revive legacy notes when noteHistory was explicitly cleared", async () => {
		const row = createRow({
			id: "main-1",
			stage: "main",
			sourceType: "Main Sheet",
			noteHistory: "",
			actionNote: "stale legacy data",
		});
		const noteHistorySpy = vi.spyOn(orderWorkflow, "getEffectiveNoteHistory");
		mocks.queryData.main = [row];

		try {
			renderView();
			await openArchiveModal([row]);

			await act(async () => {
				fireEvent.click(screen.getByTestId("archive-modal-confirm"));
			});

			await waitFor(() => {
				expect(mocks.saveMutateAsync).toHaveBeenCalledTimes(1);
			});

			expect(noteHistorySpy).toHaveBeenCalledTimes(1);
			expect(noteHistorySpy).toHaveBeenCalledWith(row);

			const savedPayload = mocks.saveMutateAsync.mock.calls[0][0];
			expect(savedPayload).toEqual({
				id: "main-1",
				updates: {
					archiveReason: "duplicate",
					noteHistory: appendTaggedUserNote("", "duplicate", "archive"),
				},
				stage: "archive",
				sourceStage: "main",
			});
			expect(savedPayload.updates.noteHistory).not.toContain(
				"stale legacy data",
			);
			expect(savedPayload.updates.noteHistory).toBe("duplicate #archive");
			await waitFor(() => {
				expect(screen.queryByTestId("archive-modal")).not.toBeInTheDocument();
			});
		} finally {
			noteHistorySpy.mockRestore();
		}
	});

	it("keeps the booking action disabled for mixed-source selections", async () => {
		const mainRow = createRow({
			id: "main-1",
			stage: "main",
			sourceType: "Main Sheet",
		});
		const ordersRow = createRow({
			id: "orders-1",
			stage: "orders",
			sourceType: "Orders",
		});
		mocks.queryData.main = [mainRow];
		mocks.queryData.orders = [ordersRow];

		renderView();
		await triggerSelectionChanged([mainRow, ordersRow]);

		const bookingButton = screen.getByTestId("search-toolbar-booking");
		expect(bookingButton).toBeDisabled();
		expect(screen.queryByTestId("booking-modal")).not.toBeInTheDocument();
		expect(mocks.lastOpenedBookingModalProps).toBeNull();
	});

	it("keeps reserve enabled for mixed-source selections while booking stays disabled", async () => {
		const mainRow = createRow({
			id: "main-1",
			stage: "main",
			sourceType: "Main Sheet",
			status: "Reserve",
		});
		const ordersRow = createRow({
			id: "orders-1",
			stage: "orders",
			sourceType: "Orders",
			status: "Not Arrived",
		});
		mocks.queryData.main = [mainRow];
		mocks.queryData.orders = [ordersRow];

		renderView();
		await triggerSelectionChanged([mainRow, ordersRow]);

		const reserveButton = screen.getByTestId("search-toolbar-reserve");
		const bookingButton = screen.getByTestId("search-toolbar-booking");

		expect(reserveButton).toBeEnabled();
		expect(bookingButton).toBeDisabled();

		fireEvent.click(reserveButton);

		// Only the reserved row (mainRow) should be passed; ordersRow is skipped
		expect(mocks.printReservationLabels).toHaveBeenCalledTimes(1);
		expect(mocks.printReservationLabels).toHaveBeenCalledWith([mainRow]);
		expect(mocks.saveMutateAsync).not.toHaveBeenCalled();
	});

	it("does not call printReservationLabels when no selected rows are reserved", async () => {
		const mainRow = createRow({
			id: "main-1",
			stage: "main",
			sourceType: "Main Sheet",
			status: "Not Arrived",
		});
		const ordersRow = createRow({
			id: "orders-1",
			stage: "orders",
			sourceType: "Orders",
			status: "Arrived",
		});
		mocks.queryData.main = [mainRow];
		mocks.queryData.orders = [ordersRow];

		renderView();
		await triggerSelectionChanged([mainRow, ordersRow]);

		const reserveButton = screen.getByTestId("search-toolbar-reserve");
		expect(reserveButton).toBeEnabled();

		fireEvent.click(reserveButton);

		expect(mocks.printReservationLabels).not.toHaveBeenCalled();
		expect(mocks.saveMutateAsync).not.toHaveBeenCalled();
	});

	it("normalizes explicit Main Sheet stage input before saving modal updates", async () => {
		renderView();

		expect(mocks.rowModalOnUpdate).toBeTruthy();

		await act(async () => {
			await mocks.rowModalOnUpdate?.(
				"row-1",
				{ noteHistory: "Saved from modal" },
				"Main Sheet",
			);
		});

		expect(mocks.saveMutateAsync).toHaveBeenCalledWith({
			id: "row-1",
			updates: { noteHistory: "Saved from modal" },
			stage: "main",
			sourceStage: "main",
		});
	});

	it("logs and falls back to the selected stage when an explicit stage is invalid", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const ordersRow = createRow({
			id: "orders-1",
			stage: "orders",
			sourceType: "Orders",
		});
		mocks.queryData.orders = [ordersRow];

		renderView();
		await triggerSelectionChanged([ordersRow]);

		expect(mocks.rowModalOnUpdate).toBeTruthy();

		await act(async () => {
			await mocks.rowModalOnUpdate?.(
				"orders-1",
				{ noteHistory: "Fallback save" },
				"Unknown Stage",
			);
		});

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"[SearchResultsView] invalid_stage_fallback",
			{
				rowId: "orders-1",
				rawStage: "Unknown Stage",
				fallbackStage: "orders",
			},
		);
		expect(mocks.saveMutateAsync).toHaveBeenCalledWith({
			id: "orders-1",
			updates: { noteHistory: "Fallback save" },
			stage: "orders",
			sourceStage: "orders",
		});

		consoleErrorSpy.mockRestore();
	});

	it("falls back to main when no stage context is available", async () => {
		renderView();

		expect(mocks.rowModalOnUpdate).toBeTruthy();

		await act(async () => {
			await mocks.rowModalOnUpdate?.("row-1", { noteHistory: "Default stage" });
		});

		expect(mocks.saveMutateAsync).toHaveBeenCalledWith({
			id: "row-1",
			updates: { noteHistory: "Default stage" },
			stage: "main",
			sourceStage: "main",
		});
	});

	it("moves an orders VIN group to call when the last part becomes Arrived", async () => {
		const firstRow = createRow({
			id: "orders-1",
			stage: "orders",
			sourceType: "Orders",
			status: "Backordered",
		});
		const secondRow = createRow({
			id: "orders-2",
			stage: "orders",
			sourceType: "Orders",
			status: "Arrived",
		});
		mocks.queryData.orders = [firstRow, secondRow];

		renderView();

		await triggerCellValueChanged({
			colDef: { field: "status" },
			data: firstRow,
			newValue: "Arrived",
			oldValue: "Backordered",
		});

		expect(mocks.saveMutateAsync).toHaveBeenCalledWith({
			id: "orders-1",
			updates: { status: "Arrived" },
			stage: "orders",
			sourceStage: "orders",
		});
		expect(mocks.bulkMutations.orders).toHaveBeenCalledWith({
			ids: ["orders-1", "orders-2"],
			stage: "call",
			silentErrorToast: true,
		});
	});

	it("only saves the edited status when the VIN group is still incomplete", async () => {
		const firstRow = createRow({
			id: "main-1",
			stage: "main",
			sourceType: "Main Sheet",
			status: "Not Arrived",
		});
		const secondRow = createRow({
			id: "main-2",
			stage: "main",
			sourceType: "Main Sheet",
			status: "Backordered",
		});
		mocks.queryData.main = [firstRow, secondRow];

		renderView();

		await triggerCellValueChanged({
			colDef: { field: "status" },
			data: firstRow,
			newValue: "Arrived",
			oldValue: "Not Arrived",
		});

		expect(mocks.bulkMutations.main).not.toHaveBeenCalled();
		expect(mocks.toastSuccess).toHaveBeenCalledWith("Status updated");
	});

	it("only saves the edited status for non-eligible stages", async () => {
		const bookingRow = createRow({
			id: "booking-1",
			stage: "booking",
			sourceType: "Booking",
			status: "Not Arrived",
		});
		mocks.queryData.booking = [bookingRow];

		renderView();

		await triggerCellValueChanged({
			colDef: { field: "status" },
			data: bookingRow,
			newValue: "Arrived",
			oldValue: "Not Arrived",
		});

		for (const mutation of Object.values(mocks.bulkMutations)) {
			expect(mutation).not.toHaveBeenCalled();
		}
		expect(mocks.toastSuccess).toHaveBeenCalledWith("Status updated");
	});

	it("stops after a save failure and never attempts auto-move", async () => {
		const mainRow = createRow({
			id: "main-1",
			stage: "main",
			sourceType: "Main Sheet",
		});
		mocks.queryData.main = [mainRow];
		mocks.saveMutateAsync.mockImplementationOnce(async () => {
			mocks.toastError("Error saving order: boom");
			throw new Error("boom");
		});

		renderView();

		await triggerCellValueChanged({
			colDef: { field: "status" },
			data: mainRow,
			newValue: "Arrived",
			oldValue: "Not Arrived",
		});

		expect(mocks.bulkMutations.main).not.toHaveBeenCalled();
		expect(mocks.toastError).toHaveBeenCalledWith("Error saving order: boom");
		expect(mocks.toastSuccess).not.toHaveBeenCalled();
	});

	it("shows a contextual error toast when the VIN auto-move fails", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const firstRow = createRow({
			id: "main-1",
			stage: "main",
			sourceType: "Main Sheet",
			status: "Not Arrived",
		});
		const secondRow = createRow({
			id: "main-2",
			stage: "main",
			sourceType: "Main Sheet",
			status: "Arrived",
		});
		mocks.queryData.main = [firstRow, secondRow];
		mocks.bulkMutations.main.mockRejectedValueOnce(new Error("move failed"));

		renderView();

		await triggerCellValueChanged({
			colDef: { field: "status" },
			data: firstRow,
			newValue: "Arrived",
			oldValue: "Not Arrived",
		});

		expect(mocks.toastError).toHaveBeenCalledWith(
			"Part saved, but VIN group move failed - refresh and try again.",
		);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"[SearchResultsView] vin_auto_move_failed",
			expect.objectContaining({
				vin: "VIN123",
				stage: "main",
				ids: ["main-1", "main-2"],
			}),
		);
	});

	describe("Orders missing parts guards", () => {
		it("orders rows missing part data -> booking shows Orders error toast and no save", async () => {
			const row = createRow({
				id: "orders-1",
				stage: "orders",
				sourceType: "Orders",
				partNumber: "",
			});
			mocks.queryData.orders = [row];

			renderView();
			await openBookingModal([row]);

			await act(async () => {
				fireEvent.click(screen.getByTestId("booking-modal-confirm"));
			});

			expect(mocks.toastError).toHaveBeenCalledWith(
				"1 order(s) missing part number or description. Complete all part fields before booking.",
			);
			expect(mocks.saveMutateAsync).not.toHaveBeenCalled();
		});

		it("orders rows missing part data -> Call List shows Orders error toast and no bulk stage mutation", async () => {
			const row = createRow({
				id: "orders-1",
				stage: "orders",
				sourceType: "Orders",
				description: "",
			});
			mocks.queryData.orders = [row];

			renderView();
			await triggerSelectionChanged([row]);

			await act(async () => {
				mocks.searchToolbarProps?.onSendToCallList();
			});

			expect(mocks.toastError).toHaveBeenCalledWith(
				"1 order(s) missing part number or description. Complete all part fields before sending to Call List.",
			);
			expect(mocks.bulkMutations.orders).not.toHaveBeenCalled();
		});

		it("non-orders rows missing part data -> booking bypasses guard", async () => {
			const row = createRow({
				id: "main-1",
				stage: "main",
				sourceType: "Main Sheet",
				partNumber: "",
			});
			mocks.queryData.main = [row];

			renderView();
			await openBookingModal([row]);

			await act(async () => {
				fireEvent.click(screen.getByTestId("booking-modal-confirm"));
			});

			expect(mocks.toastError).not.toHaveBeenCalled();
			expect(mocks.saveMutateAsync).toHaveBeenCalledTimes(1);
		});

		it("non-orders rows missing part data -> Call List bypasses guard", async () => {
			const row = createRow({
				id: "main-1",
				stage: "main",
				sourceType: "Main Sheet",
				description: "",
			});
			mocks.queryData.main = [row];

			renderView();
			await triggerSelectionChanged([row]);

			await act(async () => {
				mocks.searchToolbarProps?.onSendToCallList();
			});

			expect(mocks.toastError).not.toHaveBeenCalled();
			expect(mocks.bulkMutations.main).toHaveBeenCalledTimes(1);
		});
	});

	describe("reorder flow", () => {
		const openReorderModal = async (rows: PendingRow[]) => {
			await triggerSelectionChanged(rows);
			const reorderButton = screen.getByTestId("search-toolbar-reorder");
			expect(reorderButton).toBeEnabled();
			fireEvent.click(reorderButton);
			await waitFor(() => {
				expect(
					screen.getByPlaceholderText(/customer called back/i),
				).toBeInTheDocument();
			});
		};

		it("toasts full success when all rows are moved successfully", async () => {
			const row = createRow({ id: "row-1", stage: "main" });
			mocks.queryData.main = [row];
			mocks.saveMutateAsync.mockResolvedValueOnce({
				id: "row-1",
				stage: "orders",
			});

			renderView();
			await openReorderModal([row]);

			fireEvent.change(screen.getByPlaceholderText(/customer called back/i), {
				target: { value: "Test reason" },
			});

			await act(async () => {
				fireEvent.click(
					screen.getByRole("button", { name: /confirm reorder/i }),
				);
			});

			await waitFor(() => {
				expect(mocks.toastSuccess).toHaveBeenCalledWith(
					expect.stringContaining("1 row(s) sent back to Orders (Reorder)"),
				);
			});
			expect(mocks.toastError).not.toHaveBeenCalled();
		});

		it("Bug 1: toasts warning (not success) when some rows are skipped (null return)", async () => {
			const row1 = createRow({ id: "row-1", stage: "main" });
			const row2 = createRow({ id: "row-2", stage: "main" });
			mocks.queryData.main = [row1, row2];

			// row1 succeeds, row2 is skipped (already moved — null return)
			mocks.saveMutateAsync
				.mockResolvedValueOnce({ id: "row-1", stage: "orders" })
				.mockResolvedValueOnce(null);

			renderView();
			await openReorderModal([row1, row2]);

			fireEvent.change(screen.getByPlaceholderText(/customer called back/i), {
				target: { value: "Test reason" },
			});

			await act(async () => {
				fireEvent.click(
					screen.getByRole("button", { name: /confirm reorder/i }),
				);
			});

			await waitFor(() => {
				expect(mocks.toastSuccess).not.toHaveBeenCalled();
				expect(mocks.toastError).not.toHaveBeenCalled();
				// Warning should mention how many succeeded and how many could not be moved
				expect(mocks.toastWarning).toHaveBeenCalledWith(
					expect.stringContaining("1 reordered"),
				);
			});
		});

		it("Bug 1: toasts warning when all rows are skipped (all null returns)", async () => {
			const row = createRow({ id: "row-1", stage: "main" });
			mocks.queryData.main = [row];
			mocks.saveMutateAsync.mockResolvedValueOnce(null);

			renderView();
			await openReorderModal([row]);

			fireEvent.change(screen.getByPlaceholderText(/customer called back/i), {
				target: { value: "Test reason" },
			});

			await act(async () => {
				fireEvent.click(
					screen.getByRole("button", { name: /confirm reorder/i }),
				);
			});

			await waitFor(() => {
				expect(mocks.toastSuccess).not.toHaveBeenCalled();
				expect(mocks.toastError).not.toHaveBeenCalled();
			});
		});

		it("Bug 2: clears reason when Cancel button is clicked", async () => {
			const row = createRow({ id: "row-1", stage: "main" });
			mocks.queryData.main = [row];

			renderView();
			await openReorderModal([row]);

			const input = screen.getByPlaceholderText(/customer called back/i);
			fireEvent.change(input, { target: { value: "stale reason" } });
			expect(input).toHaveValue("stale reason");

			// Click Cancel
			fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

			// Reopen
			await act(async () => {
				fireEvent.click(screen.getByTestId("search-toolbar-reorder"));
			});

			await waitFor(() => {
				expect(
					screen.getByPlaceholderText(/customer called back/i),
				).toHaveValue("");
			});
		});
	});
});
