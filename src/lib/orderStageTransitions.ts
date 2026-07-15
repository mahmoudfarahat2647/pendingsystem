import type { OrderStage } from "@/domain/order/orderStage";
import {
	appendTaggedUserNote,
	getEffectiveNoteHistory,
} from "@/domain/order/orderWorkflow";
import { buildArchivePayload } from "@/lib/archivePayloadBuilder";
import { hasAttachment } from "@/lib/attachment";
import type { PatchRowCommand, PendingRow } from "@/types";
import { safeFormatDate } from "@/utils/safeFormatDate";

/** Matches the BOOKING column display format on the Archive/Booking pages. */
const BOOKING_DATE_FORMAT = "EEE, MMM d, yyyy";

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
 *
 * When a row carries an External Link attachment (`attachmentLink`), the link is
 * preserved into the note history and then cleared from the attachment. This
 * keeps the previous link reviewable in the audit trail while giving the
 * reordered line a clean External Link field for its next round — otherwise the
 * link the operator later attaches on the way back to Main Sheet would silently
 * overwrite the old one (MAH-47). Uploaded file attachments are left untouched.
 */
export function buildReorderCommands(
	rows: PendingRow[],
	sourceStage: OrderStage,
	reason: string,
): PatchRowCommand[] {
	return rows.map((row) => {
		let newNoteHistory = appendTaggedUserNote(
			getEffectiveNoteHistory(row),
			`Reorder Reason: ${reason}`,
			"reorder",
		);

		const previousLink = row.attachmentLink?.trim();
		const attachmentUpdates: Partial<PendingRow> = {};
		if (previousLink) {
			newNoteHistory = appendTaggedUserNote(
				newNoteHistory,
				`Previous link: ${previousLink}`,
				"reorder",
			);
			attachmentUpdates.attachmentLink = "";
			attachmentUpdates.hasAttachment = hasAttachment({
				attachmentLink: "",
				attachmentFilePath: row.attachmentFilePath,
				attachmentFilePaths: row.attachmentFilePaths,
			});
		}

		return {
			type: "patchRow",
			id: row.id,
			sourceStage,
			destinationStage: "orders" as const,
			updates: {
				noteHistory: newNoteHistory,
				status: "Reorder",
				...attachmentUpdates,
			},
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
		// note history before it is overwritten, so past appointments remain
		// reviewable. Wording stays neutral ("Previous booking") because nothing
		// clears bookingDate — the prior appointment may also have been kept.
		let history = getEffectiveNoteHistory(row);
		const previousDate = safeFormatDate(
			row.bookingDate?.trim() || null,
			BOOKING_DATE_FORMAT,
			"",
		);
		if (previousDate) {
			history = appendTaggedUserNote(
				history,
				`Previous booking: ${previousDate}.`,
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
		const oldDate = row.bookingDate
			? safeFormatDate(row.bookingDate, BOOKING_DATE_FORMAT, row.bookingDate)
			: "Unknown Date";
		const formattedNewDate = safeFormatDate(
			newDate,
			BOOKING_DATE_FORMAT,
			newDate,
		);
		const historyLog = `Rescheduled from ${oldDate} to ${formattedNewDate}.`;
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
