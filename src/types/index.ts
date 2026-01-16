import { Status, PartEntry, PendingRow } from "@/schemas/order.schema";

export type { Status, PartEntry, PendingRow };

export interface AppNotification {
	id: string;
	type: "reminder" | "warranty";
	title: string;
	description: string;
	timestamp: string;
	isRead: boolean;
	referenceId: string; // ID of the row it relates to
	vin: string;
	trackingId: string;
	tabName: string;
	path: string;
}

export interface TodoItem {
	id: string;
	text: string;
	completed: boolean;
	createdAt: string;
}

export interface StickyNote {
	id: string;
	content: string;
	color: string;
	createdAt: string;
}

export interface PartStatusDef {
	id: string;
	label: string;
	color: string;
}

export type BookingStatus = PartStatusDef;
export type PartStatus = PartStatusDef;

export interface CommitLog {
	id: string;
	actionName: string;
	timestamp: string;
	snapshot: AppStateSnapshot;
}

export interface AppStateSnapshot {
	rowData: PendingRow[];
	ordersRowData: PendingRow[];
	bookingRowData: PendingRow[];
	callRowData: PendingRow[];
	archiveRowData: PendingRow[];
	bookingStatuses: PartStatusDef[];
}

export interface AppState extends AppStateSnapshot {
	// Auxiliary Data
	todos: TodoItem[];
	notes: StickyNote[];
	partStatuses: PartStatusDef[];
	bookingStatuses: PartStatusDef[];

	// Dynamic Managed Lists
	models: string[];
	repairSystems: string[];

	// Templates
	noteTemplates: string[];
	reminderTemplates: string[];
	bookingTemplates: string[];
	reasonTemplates: string[];

	// History
	commits: CommitLog[];
	redos: CommitLog[];
	searchTerm: string;

	// Notifications
	notifications: AppNotification[];
	highlightedRowId: string | null;
}
