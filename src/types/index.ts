import type { PartEntry, PendingRow } from "@/schemas/order.schema";

export type { PartEntry, PendingRow };

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
	type: "reminder" | "warranty" | "booking_followup";
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
	 * Format: `reminder:{id}:{date}:{time}:{subject}` or `warranty:{id}:{date}`
	 */
	managedKey?: string;
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
