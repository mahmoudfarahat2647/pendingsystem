import type {
	AppNotification,
	CommitLog,
	PartStatusDef,
	PendingRow,
	StickyNote,
	TodoItem,
} from "@/types";

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
	commitToMainSheet: (ids: string[]) => void;
	sendToCallList: (ids: string[]) => void;
	sendToArchive: (ids: string[], actionNote?: string) => void;
	sendToReorder: (ids: string[], actionNote: string) => void;
	updatePartStatus: (id: string, partStatus: string) => void;
	setRowData: (data: PendingRow[]) => void;
	setCallRowData: (data: PendingRow[]) => void;
	setArchiveRowData: (data: PendingRow[]) => void;
}

export interface BookingState {
	bookingRowData: PendingRow[];
	bookingStatuses: PartStatusDef[];
}

export interface BookingActions {
	sendToBooking: (
		ids: string[],
		bookingDate: string,
		bookingNote?: string,
		bookingStatus?: string,
	) => void;
	updateBookingStatus: (id: string, bookingStatus: string) => void;
	addBookingStatusDef: (status: PartStatusDef) => void;
	updateBookingStatusDef: (id: string, updates: Partial<PartStatusDef>) => void;
	removeBookingStatusDef: (id: string) => void;
	setBookingRowData: (data: PendingRow[]) => void;
}

export interface NotificationState {
	notifications: AppNotification[];
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
	models: string[];
	repairSystems: string[];
	noteTemplates: string[];
	reminderTemplates: string[];
	bookingTemplates: string[];
	reasonTemplates: string[];
	todos: TodoItem[];
	notes: StickyNote[];
	partStatuses: PartStatusDef[];
	isLocked: boolean;
}

export interface UIActions {
	setSearchTerm: (term: string) => void;
	setHighlightedRowId: (id: string | null) => void;
	addModel: (model: string) => void;
	removeModel: (model: string) => void;
	addRepairSystem: (system: string) => void;
	removeRepairSystem: (system: string) => void;
	addTodo: (text: string) => void;
	toggleTodo: (id: string) => void;
	deleteTodo: (id: string) => void;
	addNote: (content: string, color: string) => void;
	updateNote: (id: string, content: string) => void;
	deleteNote: (id: string) => void;
	addNoteTemplate: (template: string) => void;
	removeNoteTemplate: (template: string) => void;
	addReminderTemplate: (template: string) => void;
	removeReminderTemplate: (template: string) => void;
	addReasonTemplate: (template: string) => void;
	removeReasonTemplate: (template: string) => void;
	addPartStatusDef: (status: PartStatusDef) => void;
	updatePartStatusDef: (id: string, updates: Partial<PartStatusDef>) => void;
	removePartStatusDef: (id: string) => void;
	setIsLocked: (isLocked: boolean) => void;
	resetStore: () => void;
}

export interface HistoryState {
	commits: CommitLog[];
	undoStack: CommitLog[];
	redos: CommitLog[];
}

export interface HistoryActions {
	addCommit: (actionName: string) => void;
	restoreToCommit: (commitId: string) => void;
	undo: () => void;
	redo: () => void;
	clearHistory: () => void;
	commitSave: () => void;
	debouncedCommit: (actionName: string) => void;
}

export type StoreState = OrdersState &
	InventoryState &
	BookingState &
	NotificationState &
	UIState &
	HistoryState &
	ReportSettingsState;
export type StoreActions = OrdersActions &
	InventoryActions &
	BookingActions &
	NotificationActions &
	UIActions &
	HistoryActions &
	ReportSettingsActions;
export type CombinedStore = StoreState & StoreActions;

export interface ReportSettings {
	id: string;
	emails: string[];
	frequency: "Weekly" | "Monthly" | "Yearly";
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
