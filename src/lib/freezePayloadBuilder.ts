import type { OrderStage } from "@/domain/order/orderStage";
import {
	appendTaggedUserNote,
	getEffectiveNoteHistory,
} from "@/domain/order/orderWorkflow";
import { FreezeReasonRequiredError } from "@/lib/errors";
import type { PendingRow } from "@/types";

/**
 * Transition guard for the freeze action. A freeze without a reason is
 * rejected here — at the command layer — so the requirement cannot rely on
 * the reason modal alone (generic repository methods can write arbitrary
 * stages, and the modal can be bypassed by direct applyCommand calls).
 *
 * @throws FreezeReasonRequiredError when `reason` is empty or whitespace-only.
 */
export function assertFreezeReason(reason: string): void {
	if (!reason.trim()) {
		throw new FreezeReasonRequiredError();
	}
}

/**
 * Builds the full freeze update payload for a row.
 * Sets stage to "freeze" and records previousStage (the row's stage at freeze
 * time), freezeReason, frozenAt, plus a tagged note in noteHistory.
 *
 * This is the single source of truth for freeze payloads — used by the freeze
 * command builder. The row's user-managed `status` is intentionally left
 * untouched so arrival/reserve semantics survive the freeze.
 */
export function buildFreezePayload(
	row: PendingRow,
	reason: string,
	sourceStage: OrderStage,
): Partial<PendingRow> {
	assertFreezeReason(reason);

	const noteHistory = appendTaggedUserNote(
		getEffectiveNoteHistory(row),
		reason,
		"freeze",
	);

	return {
		stage: "freeze",
		previousStage: row.stage ?? sourceStage,
		freezeReason: reason,
		frozenAt: new Date().toISOString(),
		noteHistory,
	};
}
