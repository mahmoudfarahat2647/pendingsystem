export type Status =
	| "Pending"
	| "Ordered"
	| "Hold"
	| "Booked"
	| "Archived"
	| "Reorder"
	| "Call"
	| "Main Sheet"
	| "Orders"
	| "Booking"
	| "Archive"
	| "Search Result";

export interface PartEntry {
	id: string;
	partNumber: string;
	description: string;
	rowId?: string; // Links back to a grid row for bulk edits
}

export interface PendingRow {
	id: string;
	baseId: string;
	trackingId: string;

	// Customer Info
	customerName: string;
	vin: string;
	mobile: string;
	cntrRdg: number;
	model: string;

	// Logistics Info
	parts: PartEntry[]; // Support for multiple parts
	sabNumber: string;
	acceptedBy: string;
	requester: string;
	requestedBy?: string;
	partStatus?: string;

	// Legacy fields for grid compatibility (will use first part info for these)
	partNumber: string;
	description: string;

	// Workflow Info
	status: Status;
	rDate: string;

	// Warranty Logic
	repairSystem: string;
	startWarranty: string;
	endWarranty: string;
	remainTime: string;

	// Meta / Actions
	noteContent?: string;
	actionNote?: string;
	bookingDate?: string;
	bookingNote?: string;
	bookingStatus?: string;
	hasAttachment?: boolean;
	attachmentPath?: string;
	reminder?: {
		date: string;
		time: string;
		subject: string;
	} | null;
	sourceType?: string; // For global search identification
}

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


