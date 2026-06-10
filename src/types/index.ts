import type { PartEntry, PendingRow } from "@/schemas/order.schema";

export type { PartEntry, PendingRow };

export type OrderStage = "orders" | "main" | "call" | "booking" | "archive";

export interface DuplicateCheckResult {
	isDuplicate: boolean;
	existingRow?: PendingRow;
	location?: string;
}

export interface DescriptionConflictResult {
	hasConflict: boolean;
	existingDescription?: string;
	existingRow?: PendingRow;
}

export interface AppNotification {
	id: string;
	type: "reminder" | "warranty" | "booking_followup" | "cntr_rdg_warning";
	title: string;
	description: string;
	timestamp: string;
	isRead: boolean;
	referenceId: string; // ID of the row it relates to
	vin: string;
	bookingDate?: string;
	trackingId: string;
	tabName: string;
	path: string;
	/**
	 * Unique identifier for managing automated notifications to prevent duplicates.
	 * Format: `reminder:{id}:{date}:{time}:{subject}` | `warranty:{id}:{date}` | `cntr_rdg_warning:{id}:{level}`
	 */
	managedKey?: string;
	/** Only present for cntr_rdg_warning notifications */
	cntrRdgLevel?: "high" | "early";
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

/** Response shape returned by GET /api/storage-stats. */
export interface StorageStatsResponse {
	dbUsedBytes: number | null;
	dbLimitBytes: number;
	dbAvailable: boolean;
	storageUsedBytes: number;
	storageLimitBytes: number;
	storageAvailable: boolean;
	combinedUsedBytes: number | null;
	combinedLimitBytes: number;
	dataComplete: boolean;
}

export interface ReportSettings {
	id: string;
	emails: string[];
	frequency: string;
	is_enabled: boolean;
	last_sent_at: string | null;
}

export interface PatchRowCommand {
	type: "patchRow";
	id: string;
	sourceStage: OrderStage;
	destinationStage: OrderStage;
	updates: Partial<PendingRow>;
	previousValues: Partial<PendingRow>;
}
