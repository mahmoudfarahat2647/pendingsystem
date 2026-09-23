import { logger } from "@/lib/logger";
import type { supabase as supabaseDefault } from "@/lib/supabase";
import type { OrderStage } from "@/types";
import { handleSupabaseError } from "../orderServiceErrors";

type ZeroRowMatchOutcome =
	| { type: "no-op" }
	| {
			type: "conflict";
			code?: string;
			message: string;
			details?: unknown;
	  }
	| {
			type: "retry";
			metadata: Record<string, unknown>;
			updatedAt: string | undefined;
	  };

// User-facing message for a WRITE_CONFLICT error. The full diagnostic
// (attempt count, row id) is logged via logger.warn instead, so it never
// reaches a toast.
const WRITE_CONFLICT_MESSAGE =
	"This order was just updated by someone else. Please refresh and try again.";

const ROW_FROZEN_CONFLICT_MESSAGE =
	"This order was frozen by someone else. Please refresh and try again.";

// Decides why a conditional UPDATE matched 0 rows: the row moved to a
// different stage (legitimate no-op — e.g. concurrent maintenance-scan
// archive), the row was deleted (no-op), or another writer changed
// `metadata`/`updated_at` concurrently (retry the merge, or surface a
// conflict once the retry budget is exhausted).
async function resolveZeroRowMatch({
	db,
	id,
	expectedCurrentStage,
	attempt,
	maxAttempts,
	context,
}: {
	db: typeof supabaseDefault;
	id: string;
	expectedCurrentStage?: OrderStage;
	attempt: number;
	maxAttempts: number;
	context: string;
}): Promise<ZeroRowMatchOutcome> {
	const { data: recheck, error: recheckError } = await db
		.from("orders")
		.select("stage, metadata, updated_at")
		.eq("id", id)
		.maybeSingle();

	if (recheckError) handleSupabaseError(recheckError);

	if (!recheck) {
		logger.debug(`[${context}] Skipped for ${id}: row no longer exists`);
		return { type: "no-op" };
	}

	if (expectedCurrentStage && recheck.stage !== expectedCurrentStage) {
		// When the row has moved into freeze elsewhere, or was expected to be in freeze
		// but was moved/unfrozen elsewhere, surface a clear, visible conflict instead of
		// silently ignoring the update.
		if (recheck.stage === "freeze") {
			logger.warn(
				`[${context}] Conflict for ${id}: row was frozen by another user (expected stage: "${expectedCurrentStage}", actual: "freeze")`,
			);
			return {
				type: "conflict",
				code: "ROW_FROZEN_ELSEWHERE",
				message: ROW_FROZEN_CONFLICT_MESSAGE,
				details: {
					id,
					expectedStage: expectedCurrentStage,
					actualStage: "freeze",
				},
			};
		}

		if (expectedCurrentStage === "freeze") {
			logger.warn(
				`[${context}] Conflict for ${id}: row is no longer in freeze (expected stage: "freeze", actual: "${recheck.stage}")`,
			);
			return {
				type: "conflict",
				code: "STAGE_CHANGED_ELSEWHERE",
				message: `This order is no longer in freeze (currently in ${recheck.stage}). Please refresh and try again.`,
				details: {
					id,
					expectedStage: "freeze",
					actualStage: recheck.stage,
				},
			};
		}

		// Other stage changes (e.g. concurrent maintenance-scan archive sweeps)
		// legitimately remain silent no-ops.
		logger.debug(
			`[${context}] Skipped for ${id}: row no longer in stage "${expectedCurrentStage}"`,
		);
		return { type: "no-op" };
	}

	if (attempt >= maxAttempts) {
		logger.warn(
			`[${context}] Exhausted ${maxAttempts} attempts for id ${id} due to concurrent metadata writes`,
		);
		return {
			type: "conflict",
			code: "WRITE_CONFLICT",
			message: WRITE_CONFLICT_MESSAGE,
		};
	}

	return {
		type: "retry",
		metadata: (recheck.metadata as Record<string, unknown>) || {},
		updatedAt: recheck.updated_at as string | undefined,
	};
}

type ZeroRowHandling =
	| { action: "return-null" }
	| { action: "throw"; code: string; message: string; details?: unknown }
	| {
			action: "retry";
			metadata: Record<string, unknown>;
			updatedAt: string | undefined;
	  };

// Shared branch logic for a conditional UPDATE that matched 0 rows: used by
// both the primary update and the missing-attachment-column fallback update
// in saveOrder, which otherwise duplicate this exact decision.
export async function handleZeroRowMatch(
	args: Parameters<typeof resolveZeroRowMatch>[0],
): Promise<ZeroRowHandling> {
	const outcome = await resolveZeroRowMatch(args);
	if (outcome.type === "no-op") return { action: "return-null" };
	if (outcome.type === "conflict")
		return {
			action: "throw",
			code: outcome.code ?? "WRITE_CONFLICT",
			message: outcome.message,
			details: outcome.details,
		};
	return {
		action: "retry",
		metadata: outcome.metadata,
		updatedAt: outcome.updatedAt,
	};
}
