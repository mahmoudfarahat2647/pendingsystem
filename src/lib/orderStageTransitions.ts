import { format } from "date-fns";
import type { OrderStage } from "@/domain/order/orderStage";
import {
	appendTaggedUserNote,
	getEffectiveNoteHistory,
} from "@/domain/order/orderWorkflow";
import { buildArchivePayload } from "@/lib/archivePayloadBuilder";
import type { PatchRowCommand, PendingRow } from "@/types";

/**
 * Formats a stored booking date for display inside note history, matching the
 * Archive/Booking BOOKING column format ("EEE, MMM d, yyyy"). Falls back to the
 * raw value when the stored string is not a parseable date.
 */
function formatBookingDate(value: string): string {
	try {
		return format(new Date(value), "EEE, MMM d, yyyy");
	} catch {
		return value;
	}
}

/**
 * Returns patchRow commands to archive the given rows.
 *
 * Uses buildArchivePayload as the single source of truth — every archived row
 * gets stage:"archive", status:"Archived", archiveReason, archivedAt, and an
 * updated noteHistory regardless of which stage it came from.
 */
export function buildSendToArchiveCommands(
	rows: PendingRow[],
	reason: string,
	sourceStage: OrderStage,
): PatchRowCommand[] {
	return rows.map((row) => ({
		type: "patchRow",
		id: row.id,
		sourceStage,
		destinationStage: "archive" as const,
		updates: buildArchivePayload(row, reason),
		previousValues: {},
	}));
}

/**
 * Returns patchRow commands to send rows back to the Orders stage with
 * status "Reorder" and the reason appended to the note history.
 */
export function buildReorderCommands(
	rows: PendingRow[],
	sourceStage: OrderStage,
	reason: string,
): PatchRowCommand[] {
	return rows.map((row) => {
		const newNoteHistory = appendTaggedUserNote(
			getEffectiveNoteHistory(row),
			`Reorder Reason: ${reason}`,
			"reorder",
		);
		return {
			type: "patchRow",
			id: row.id,
			sourceStage,
			destinationStage: "orders" as const,
			updates: { noteHistory: newNoteHistory, status: "Reorder" },
			previousValues: {},
		};
	});
}

/**
 * Returns patchRow commands to send rows to the Booking stage.
 *
 * Used by main-sheet, call-list, and archive pages.
 * The orders page booking handler is NOT migrated here — it wraps commands
 * in a composite for atomic undo and stores per-row previousValues; both are
 * caller-level concerns that live in useOrdersPageHandlers.ts.
 */
export function buildBookingCommands(
	rows: PendingRow[],
	sourceStage: OrderStage,
	date: string,
	note: string,
	status?: string,
): PatchRowCommand[] {
	return rows.map((row) => {
		// If the row already has a booking date (e.g. re-booking an archived,
		// previously missed/cancelled appointment), record the prior date in the
		// note history before it is overwritten, so absences remain reviewable.
		let history = getEffectiveNoteHistory(row);
		if (row.bookingDate) {
			history = appendTaggedUserNote(
				history,
				`Missed booking: ${formatBookingDate(row.bookingDate)}.`,
				"rebooking",
			);
		}
		const newNoteHistory = appendTaggedUserNote(history, note, "booking");
		return {
			type: "patchRow",
			id: row.id,
			sourceStage,
			destinationStage: "booking" as const,
			updates: {
				bookingDate: date,
				bookingNote: note,
				noteHistory: newNoteHistory,
				...(status ? { bookingStatus: status } : {}),
			},
			previousValues: {},
		};
	});
}

/**
 * Returns patchRow commands to reschedule existing bookings.
 * Rows stay in the "booking" stage; only the date, note, and history change.
 */
export function buildRebookingCommands(
	rows: PendingRow[],
	newDate: string,
	newNote: string,
	status?: string,
): PatchRowCommand[] {
	return rows.map((row) => {
		const oldDate = row.bookingDate || "Unknown Date";
		const historyLog = `Rescheduled from ${oldDate} to ${newDate}.`;
		const fullNote = `${historyLog} ${newNote}`.trim();
		const updatedBookingNote = row.bookingNote
			? `${row.bookingNote}\n[System]: ${fullNote}`
			: `[System]: ${fullNote}`;
		const newNoteHistory = appendTaggedUserNote(
			getEffectiveNoteHistory(row),
			fullNote,
			"rebooking",
		);
		return {
			type: "patchRow",
			id: row.id,
			sourceStage: "booking" as const,
			destinationStage: "booking" as const,
			updates: {
				bookingDate: newDate,
				bookingNote: updatedBookingNote,
				noteHistory: newNoteHistory,
				...(status ? { bookingStatus: status } : {}),
			},
			previousValues: {},
		};
	});
}
