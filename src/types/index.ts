import type { GridState } from "ag-grid-community";
import type { PartEntry, PendingRow } from "@/schemas/order.schema";

export type { PartEntry, PendingRow, GridState };

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
