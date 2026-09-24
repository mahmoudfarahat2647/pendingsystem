import type { TranslationKey, TranslationParams } from "@/i18n/dictionaries/en";
import type { PartEntry, PendingRow } from "@/schemas/order.schema";

export type { PartEntry, PendingRow };

/**
 * Release-gate authorization (issue #242) attached to a *→call draft
 * command. Defined here (not in `domain/order/releaseGate.ts`) so that
 * `domain/` keeps its one-way dependency on `types/` only — the domain
 * module imports this type back from `@/types`, mirroring how it already
 * imports `PendingRow` rather than defining its own copy.
 */
export interface ReleaseAuthorization {
	/** Normalized VINs this authorization covers. */
	vins: string[];
	/** Fingerprint of the exact rows/values that were released. */
	fingerprint: string;
	grantedAt: number;
}

export type OrderStage =
	| "orders"
	| "main"
	| "call"
	| "booking"
	| "archive"
	| "freeze";

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

/** Per-stage row counts, computed via SQL aggregation (see get_order_stage_counts RPC). */
export interface OrderStageCounts {
	orders: number;
	main: number;
	call: number;
	booking: number;
	archive: number;
	freeze: number;
	/** Distinct VIN count within the "call" stage. */
	callUniqueVehicles: number;
}

export interface AppNotification {
	id: string;
	type:
		| "reminder"
		| "warranty"
		| "booking_followup"
		| "cntr_rdg_warning"
		| "release_followup";
	title?: string;
	description?: string;
	titleKey?: TranslationKey;
	descriptionKey?: TranslationKey;
	params?: TranslationParams;
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
	 * Format: `reminder:{id}:{date}:{time}:{subject}` | `warranty:{id}:{date}` | `cntr_rdg_warning:{id}:{level}` | `release_followup:{vin}:{dueISO}`
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
	/** Release-gate authorization (issue #242) for a call-destination patch; see `computeReleaseFingerprint`. */
	releaseAuthorization?: ReleaseAuthorization;
}
