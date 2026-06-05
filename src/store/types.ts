import type { GridState } from "ag-grid-community";
import type { OrderStage } from "@/services/orderService";
import type {
	AppNotification,
	PartStatusDef,
	PendingRow,
	StickyNote,
} from "@/types";
import type {
	DraftCommand,
	DraftRecoverySnapshot,
	DraftSaveMutations,
	DraftSession,
} from "./slices/draftSessionSlice";

export interface OrdersState {
	ordersRowData: PendingRow[];
}

export interface OrdersActions {
	addOrder: (order: PendingRow) => void;
	addOrders: (orders: PendingRow[]) => void;
	updateOrder: (id: string, updates: Partial<PendingRow>) => void;
	updateOrders: (ids: string[], updates: Partial<PendingRow>) => void;
	deleteOrders: (ids: string[]) => void;
	setOrdersRowData: (orders: PendingRow[]) => void;
}

export interface InventoryState {
	rowData: PendingRow[];
	callRowData: PendingRow[];
	archiveRowData: PendingRow[];
}

export interface InventoryActions {
	sendToCallList: (ids: string[]) => void;
	updatePartStatus: (id: string, status: string) => void;
	setRowData: (data: PendingRow[]) => void;
	setCallRowData: (data: PendingRow[]) => void;
	setArchiveRowData: (data: PendingRow[]) => void;
}

export interface BookingState {
	bookingRowData: PendingRow[];
}

export interface BookingActions {
	sendToBooking: (
		ids: string[],
		bookingDate: string,
		bookingNote?: string,
		bookingStatus?: string,
	) => void;
	updateBookingStatus: (id: string, bookingStatus: string) => void;
	setBookingRowData: (data: PendingRow[]) => void;
}

export interface NotificationState {
	notifications: AppNotification[];
	// Using Record<string, true> instead of Set<string> because it serializes cleanly to JSON for localStorage persistence via Zustand persist
	dismissedManagedNotificationKeys: Record<string, true>;
}

export interface NotificationActions {
	addNotification: (
		notification: Omit<AppNotification, "id" | "timestamp" | "isRead">,
	) => void;
	markNotificationAsRead: (id: string) => void;
	removeNotification: (id: string) => void;
	clearNotifications: () => void;
	checkNotifications: () => void;
}

export interface UIState {
	searchTerm: string;
	highlightedRowId: string | null;
	pendingVinSelection: { vin: string; bookingDate?: string } | string | null;
	notes: StickyNote[];
	partStatuses: PartStatusDef[];
	bookingStatuses: PartStatusDef[];
	isLocked: boolean;
	beastModeTriggers: Record<string, number>;
	currentEditVin: string | null;
	currentEditId: string | null;
	pendingSearchSelection: { stage: string; ids: string[] } | null;
}

export interface UIActions {
	setSearchTerm: (term: string) => void;
	setHighlightedRowId: (id: string | null) => void;
	setPendingVinSelection: (
		vin: { vin: string; bookingDate?: string } | string | null,
	) => void;
	addNote: (content: string, color: string) => void;
	updateNote: (id: string, content: string) => void;
	deleteNote: (id: string) => void;
	addPartStatusDef: (status: PartStatusDef) => void;
	updatePartStatusDef: (id: string, updates: Partial<PartStatusDef>) => void;
	removePartStatusDef: (id: string) => void;
	setIsLocked: (isLocked: boolean) => void;
	triggerBeastMode: (id: string, timestamp: number) => void;
	clearBeastMode: (id: string) => void;
	setCurrentEditVin: (vin: string | null, editId: string | null) => void;
	clearCurrentEditVin: () => void;
	setPendingSearchSelection: (
		val: { stage: string; ids: string[] } | null,
	) => void;
}

interface GridSliceState {
	gridStates: Record<string, GridState>;
	dirtyLayouts: Record<string, boolean>;
	positionDirtyLayouts: Record<string, boolean>;
	defaultLayouts: Record<string, GridState>;
}

interface GridSliceActions {
	saveGridState: (gridKey: string, state: GridState) => void;
	getGridState: (gridKey: string) => GridState | null;
	clearGridState: (gridKey: string) => void;
	setLayoutDirty: (gridKey: string, dirty: boolean) => void;
	setPositionLayoutDirty: (gridKey: string, dirty: boolean) => void;
	saveAsDefaultLayout: (gridKey: string, state: GridState) => void;
	getDefaultLayout: (gridKey: string) => GridState | null;
}

export interface DraftSessionState {
	draftSession: DraftSession;
}

export interface DraftSessionActions {
	applyCommand: (cmd: DraftCommand) => boolean;
	undoDraft: () => void;
	redoDraft: () => void;
	saveDraft: (mutations: DraftSaveMutations) => Promise<void>;
	discardDraft: () => void;
	restoreFromRecovery: (snapshot: DraftRecoverySnapshot) => void;
	getWorkingRows: (stage: OrderStage) => PendingRow[] | undefined;
	_captureBaseline: () => void;
	_deriveWorkingRows: () => Record<OrderStage, PendingRow[]>;
	_persistRecovery: () => void;
	_clearRecovery: () => void;
}

export type StoreState = OrdersState &
	InventoryState &
	BookingState &
	NotificationState &
	UIState &
	DraftSessionState &
	GridSliceState &
	ReportSettingsState;
export type StoreActions = OrdersActions &
	InventoryActions &
	BookingActions &
	NotificationActions &
	UIActions &
	DraftSessionActions &
	GridSliceActions &
	ReportSettingsActions;
export type CombinedStore = StoreState & StoreActions;

export interface ReportSettings {
	id: string;
	emails: string[];
	frequency: string;
	is_enabled: boolean;
	last_sent_at: string | null;
}

export interface ReportSettingsState {
	reportSettings: ReportSettings | null;
	isReportSettingsLoading: boolean;
	reportSettingsError: string | null;
}

export interface ReportSettingsActions {
	fetchReportSettings: () => Promise<void>;
	updateReportSettings: (settings: Partial<ReportSettings>) => Promise<void>;
	addEmailRecipient: (email: string) => Promise<void>;
	removeEmailRecipient: (email: string) => Promise<void>;
	triggerManualBackup: () => Promise<void>;
}
