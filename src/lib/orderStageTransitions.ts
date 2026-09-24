import type { OrderStage } from "@/domain/order/orderStage";
import {
	appendTaggedUserNote,
	getEffectiveNoteHistory,
} from "@/domain/order/orderWorkflow";
import { buildArchivePayload } from "@/lib/archivePayloadBuilder";
import { hasAttachment, sanitizeAttachmentLink } from "@/lib/attachment";
import { buildFreezePayload } from "@/lib/freezePayloadBuilder";
import type { PatchRowCommand, PendingRow } from "@/types";
import { safeFormatDate } from "@/utils/safeFormatDate";

/** Matches the BOOKING column display format on the Archive/Booking pages. */
const BOOKING_DATE_FORMAT = "EEE, MMM d, yyyy";

/**
 * Appends a `<label>: <value> #<tag>` line to note history, recording a value
 * that is about to be overwritten so it stays reviewable in the audit trail.
 * No-op when `value` is empty.
 */
function appendPreviousValueNote(
	history: string,
	label: string,
	value: string | undefined,
	tag: string,
): string {
	if (!value) return history;
	return appendTaggedUserNote(history, `${label}: ${value}`, tag);
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
 * Returns patchRow commands to freeze the given rows.
 *
 * Uses buildFreezePayload as the single source of truth — every frozen row
 * gets stage:"freeze", previousStage (the row's stage at freeze time),
 * freezeReason, frozenAt, and an updated noteHistory regardless of which
 * stage it came from. Granularity is exactly the rows passed in: sibling
 * lines of the same chassis are untouched unless they are selected too.
 *
 * @throws FreezeReasonRequiredError when `reason` is empty or whitespace-only.
 */
export function buildSendToFreezeCommands(
	rows: PendingRow[],
	reason: string,
	sourceStage: OrderStage,
): PatchRowCommand[] {
	return rows.map((row) => ({
		type: "patchRow",
		id: row.id,
		sourceStage,
		destinationStage: "freeze" as const,
		updates: buildFreezePayload(row, reason, sourceStage),
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
export function buildReorderUpdates(
	row: PendingRow,
	reason: string,
): Partial<PendingRow> {
	let newNoteHistory = appendTaggedUserNote(
		getEffectiveNoteHistory(row),
		`Reorder Reason: ${reason}`,
		"reorder",
	);

	const previousLink = sanitizeAttachmentLink(row.attachmentLink ?? "");
	newNoteHistory = appendPreviousValueNote(
		newNoteHistory,
		"Previous link",
		previousLink,
		"reorder",
	);

	const attachmentUpdates: Partial<PendingRow> = {};
	if (previousLink) {
		attachmentUpdates.attachmentLink = "";
		attachmentUpdates.hasAttachment = hasAttachment({
			attachmentFilePath: row.attachmentFilePath,
			attachmentFilePaths: row.attachmentFilePaths,
		});
	}

	return {
		noteHistory: newNoteHistory,
		status: "Reorder",
		...attachmentUpdates,
	};
}

export function buildReorderCommands(
	rows: PendingRow[],
	sourceStage: OrderStage,
	reason: string,
): PatchRowCommand[] {
	return rows.map((row) => ({
		type: "patchRow",
		id: row.id,
		sourceStage,
		destinationStage: "orders" as const,
		updates: buildReorderUpdates(row, reason),
		previousValues: {},
	}));
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
		const previousDate = safeFormatDate(
			row.bookingDate?.trim() || null,
			BOOKING_DATE_FORMAT,
			"",
		);
		const history = appendPreviousValueNote(
			getEffectiveNoteHistory(row),
			"Previous booking",
			previousDate ? `${previousDate}.` : undefined,
			"rebooking",
		);
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
 * Returns patchRow commands to unfreeze rows into any chosen destination stage.
 *
 * This is the NEUTRAL unfreeze transition for the FREEZE tab ("Move to…"
 * picker). It intentionally does NOT reuse the reorder/booking/archive/
 * rebooking builders above because each of those carries destination-specific
 * side effects that would violate the unfreeze data-preservation guarantee:
 * reorder hard-sets status="Reorder" and clears the attachment link, booking
 * requires/overwrites booking date/note/status, archive sets archive
 * status/reason/date, and none of them target `main` or `call`.
 *
 * Each command does exactly four things:
 *   (a) moves the row to the chosen destination stage,
 *   (b) appends a tagged freeze-history note (preserving the freeze reason),
 *   (c) clears the freeze metadata (`previousStage`, `freezeReason`,
 *       `frozenAt`) by persisting `null` — metadata is merged on write, so
 *       omitting a key would preserve it and `undefined` does not reliably
 *       delete a JSON key; `null` is the explicit cleared representation and
 *       the schema fields are nullable to accept it on the read-back path,
 *   (d) leaves status, booking fields, and attachments completely untouched
 *       (they are absent from `updates`, so the merge preserves them).
 *
 * Naming note: the persisted metadata field `previousStage` (cleared here) is
 * unrelated to the `previousStage?` rollback-destination parameter of
 * `orderRepository.updateOrdersStage`. This builder takes only
 * `destinationStage` to avoid any collision between the two concepts.
 */
export function buildUnfreezeCommands(
	rows: PendingRow[],
	destinationStage: OrderStage,
): PatchRowCommand[] {
	return rows.map((row) => {
		const reason = row.freezeReason?.trim();
		const note = reason
			? `Unfrozen to ${destinationStage}. Freeze reason: ${reason}`
			: `Unfrozen to ${destinationStage}`;
		return {
			type: "patchRow",
			id: row.id,
			sourceStage: "freeze" as const,
			destinationStage,
			updates: {
				stage: destinationStage,
				noteHistory: appendTaggedUserNote(
					getEffectiveNoteHistory(row),
					note,
					"unfreeze",
				),
				previousStage: null,
				freezeReason: null,
				frozenAt: null,
			},
			previousValues: {},
		};
	});
}
/**
 * Returns the update payload for moving a single row to Main Sheet from
 * Call List, Booking, or Archive (the "Move to Main Sheet" toolbar action,
 * guarded by the `moveToMainPermission` Settings toggle).
 *
 * Appends a `Moved to Main Sheet from <Stage>` history note. When the source
 * is `archive`, also clears the archive markers — `status` resets to
 * "Pending" (the schema default) and `archiveReason`/`archivedAt` are
 * persisted as `null` (metadata is merged on write, so omitting a key would
 * preserve it) — while the old archive reason is preserved in the note
 * history. Booking and attachment fields are left untouched for every
 * source stage.
 */
export function buildMoveToMainUpdates(
	row: PendingRow,
	sourceStage: OrderStage,
): Partial<PendingRow> {
	const stageLabel = sourceStage.charAt(0).toUpperCase() + sourceStage.slice(1);
	let newNoteHistory = appendTaggedUserNote(
		getEffectiveNoteHistory(row),
		`Moved to Main Sheet from ${stageLabel}`,
		"main",
	);

	if (sourceStage !== "archive") {
		return { noteHistory: newNoteHistory };
	}

	newNoteHistory = appendPreviousValueNote(
		newNoteHistory,
		"Previous archive reason",
		row.archiveReason ?? undefined,
		"main",
	);

	return {
		noteHistory: newNoteHistory,
		status: "Pending",
		archiveReason: null,
		archivedAt: null,
	};
}

/**
 * Returns patchRow commands to move rows to Main Sheet from Call List,
 * Booking, or Archive. See {@link buildMoveToMainUpdates} for the per-row
 * update semantics.
 */
export function buildMoveToMainCommands(
	rows: PendingRow[],
	sourceStage: OrderStage,
): PatchRowCommand[] {
	return rows.map((row) => ({
		type: "patchRow",
		id: row.id,
		sourceStage,
		destinationStage: "main" as const,
		updates: buildMoveToMainUpdates(row, sourceStage),
		previousValues: {},
	}));
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
