import type { GridState } from "ag-grid-community";
import type {
	AppNotification,
	PartStatusDef,
	StickyNote,
	TodoItem,
} from "@/types";

// Orders state removed - all order data now managed by React Query
// This slice is kept as a placeholder for potential future UI-only order state
export type OrdersState = {};

export type OrdersActions = {};

// Inventory state removed - all inventory data now managed by React Query
// This slice is kept as a placeholder for potential future UI-only inventory state
export type InventoryState = {};

export type InventoryActions = {};

// Booking state removed - all booking data now managed by React Query
// This slice is kept as a placeholder for potential future UI-only booking state
export type BookingState = {};

export type BookingActions = {};

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
	bookingStatuses: PartStatusDef[];
	isLocked: boolean;
	beastModeTriggers: Record<string, number>;
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
	triggerBeastMode: (id: string, timestamp: number) => void;
	clearBeastMode: (id: string) => void;
}

// Undo/Redo system removed - React Query optimistic updates provide immediate feedback
// Manual undo can be implemented via UI if needed
export type UndoRedoState = {};

export type UndoRedoActions = {};

interface GridSliceState {
	gridStates: Record<string, GridState>;
	dirtyLayouts: Record<string, boolean>;
	defaultLayouts: Record<string, GridState>;
}

interface GridSliceActions {
	saveGridState: (gridKey: string, state: GridState) => void;
	getGridState: (gridKey: string) => GridState | null;
	clearGridState: (gridKey: string) => void;
	setLayoutDirty: (gridKey: string, dirty: boolean) => void;
	saveAsDefaultLayout: (gridKey: string, state: GridState) => void;
	getDefaultLayout: (gridKey: string) => GridState | null;
}

export type StoreState = OrdersState &
	InventoryState &
	BookingState &
	NotificationState &
	UIState &
	UndoRedoState &
	GridSliceState &
	ReportSettingsState;
export type StoreActions = OrdersActions &
	InventoryActions &
	BookingActions &
	NotificationActions &
	UIActions &
	UndoRedoActions &
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
