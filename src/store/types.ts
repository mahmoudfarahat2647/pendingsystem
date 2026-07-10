import type { GridState } from "ag-grid-community";
import type { OrderStage } from "@/domain/order/orderStage";
import type {
	AppNotification,
	PartStatusDef,
	PendingRow,
	ReportSettings,
	StickyNote,
} from "@/types";
import type {
	DraftCommand,
	DraftRecoverySnapshot,
	DraftSaveMutations,
	DraftSession,
} from "./slices/draftSessionCommands";

export type { ReportSettings };

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
	gridEditPermission: boolean;
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
	setGridEditPermission: (value: boolean) => void;
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
	lastSaveResult: "success" | "error" | null;
	lastCommandError: string | null;
}

export interface DraftSessionActions {
	applyCommand: (cmd: DraftCommand) => boolean;
	undoDraft: () => void;
	redoDraft: () => void;
	saveDraft: (mutations: DraftSaveMutations) => Promise<void>;
	skipFailedCommand: () => void;
	discardDraft: () => void;
	restoreFromRecovery: (snapshot: DraftRecoverySnapshot) => void;
	getWorkingRows: (stage: OrderStage) => PendingRow[] | undefined;
	clearSaveResult: () => void;
	clearCommandError: () => void;
	_captureBaseline: () => void;
	_deriveWorkingRows: () => Record<OrderStage, PendingRow[]>;
	_persistRecovery: () => void;
	_clearRecovery: () => void;
}

export type StoreState = NotificationState &
	UIState &
	DraftSessionState &
	GridSliceState;
export type StoreActions = NotificationActions &
	UIActions &
	DraftSessionActions &
	GridSliceActions;
export type CombinedStore = StoreState & StoreActions;
