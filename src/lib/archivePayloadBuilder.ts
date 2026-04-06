import {
	appendTaggedUserNote,
	getEffectiveNoteHistory,
} from "@/lib/orderWorkflow";
import type { PendingRow } from "@/types";

/**
 * Builds the full archive update payload for a row.
 * Sets stage to "archive", status to "Archived", archiveReason, archivedAt,
 * and appends a tagged note to noteHistory.
 *
 * This is the single source of truth for archive payloads — used by both
 * manual archive handlers and the auto-archive maintenance hook.
 */
export function buildArchivePayload(
	row: PendingRow,
	reason: string,
): Partial<PendingRow> {
	const noteHistory = appendTaggedUserNote(
		getEffectiveNoteHistory(row),
		reason,
		"archive",
	);

	return {
		stage: "archive",
		status: "Archived",
		archiveReason: reason,
		archivedAt: new Date().toISOString(),
		noteHistory,
	};
}
