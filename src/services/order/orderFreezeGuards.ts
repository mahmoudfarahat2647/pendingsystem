import type { OrderStage } from "@/types";
import { ServiceError } from "../orderServiceErrors";

/**
 * Transition guard for the freeze stage. Generic repository methods can write
 * arbitrary stages, so a freeze that reaches this layer without a reason is
 * rejected here — independent of the reason modal and the command builders.
 *
 * - `updateOrderStage` / `updateOrdersStage` write only the stage column and
 *   can never carry freeze metadata, so any freeze through them is rejected.
 * - `saveOrder` merges reason metadata: same-stage freeze writes (e.g. note
 *   edits on already-frozen rows) are allowed, but a cross-stage transition
 *   into `freeze` requires a non-empty `freezeReason` in the patch. Direct
 *   writes without `expectedCurrentStage` are checked against the row's
 *   current stage from the snapshot read instead.
 */
export function freezeReasonOf(value: unknown): string {
	return typeof value === "string" ? value : "";
}

export function throwFreezeReasonRequired(): never {
	throw new ServiceError(
		"FREEZE_REASON_REQUIRED",
		"A reason is required to move rows to the freeze stage.",
	);
}

/**
 * Early (no-DB-read) freeze check for saveOrder: a declared cross-stage
 * transition into `freeze` must carry a non-empty `freezeReason` in the
 * patch. Same-stage writes and writes without a declared source stage are
 * resolved against live row state at the saveOrder call sites instead.
 */
export function assertFreezeTransitionAllowed(args: {
	stage: OrderStage;
	expectedCurrentStage?: OrderStage;
	freezeReason: unknown;
}): void {
	if (
		args.stage === "freeze" &&
		args.expectedCurrentStage &&
		args.expectedCurrentStage !== "freeze" &&
		!freezeReasonOf(args.freezeReason).trim()
	) {
		throwFreezeReasonRequired();
	}
}
