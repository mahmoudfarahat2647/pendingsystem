import type { AppNotification, AppStateSnapshot, PartStatusDef, PendingRow, TodoItem, StickyNote, CommitLog } from "@/types";

export interface OrdersState {
    ordersRowData: PendingRow[];
}

export interface OrdersActions {
    addOrder: (order: PendingRow) => void;
    addOrders: (orders: PendingRow[]) => void;
    updateOrder: (id: string, updates: Partial<PendingRow>) => void;
    updateOrders: (ids: string[], updates: Partial<PendingRow>) => void;
    deleteOrders: (ids: string[]) => void;
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
        bookingStatus?: string
    ) => void;
    updateBookingStatus: (id: string, bookingStatus: string) => void;
    addBookingStatusDef: (status: PartStatusDef) => void;
    removeBookingStatusDef: (id: string) => void;
}

export interface NotificationState {
    notifications: AppNotification[];
}

export interface NotificationActions {
    addNotification: (
        notification: Omit<AppNotification, "id" | "timestamp" | "isRead">
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
    addPartStatusDef: (status: PartStatusDef) => void;
    removePartStatusDef: (id: string) => void;
    resetStore: () => void;
}

export interface HistoryState {
    commits: CommitLog[];
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

export type StoreState = OrdersState & InventoryState & BookingState & NotificationState & UIState & HistoryState;
export type StoreActions = OrdersActions & InventoryActions & BookingActions & NotificationActions & UIActions & HistoryActions;
export type CombinedStore = StoreState & StoreActions;
