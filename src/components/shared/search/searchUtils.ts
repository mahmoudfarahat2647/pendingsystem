import type { PendingRow } from "@/types";

// Global search corpus. Keep in sync with PendingRow.
export const SEARCH_FIELDS: (keyof PendingRow)[] = [
	"sourceType",
	"vin",
	"customerName",
	"partNumber",
	"description",
	"mobile",
	"baseId",
	"trackingId",
	"model",
	"company",
	"requester",
	"sabNumber",
	"acceptedBy",
	"rDate",
	"noteContent",
	"noteHistory",
	"repairSystem",
	"actionNote",
	"bookingDate",
	"bookingNote",
	"archiveReason",
	"stage",
];

export const buildGlobalSearchString = (row: PendingRow): string =>
	SEARCH_FIELDS.map((field) => {
		const value = row[field];
		return value == null ? "" : String(value).toLowerCase();
	}).join(" ");

export const getMissingPartRows = (rows: PendingRow[]): PendingRow[] =>
	rows.filter((row) => !row.partNumber?.trim() || !row.description?.trim());
