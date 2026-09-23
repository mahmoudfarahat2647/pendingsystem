import { processBatch } from "@/lib/batchUtils";
import { logger } from "@/lib/logger";
import { supabase as supabaseDefault } from "@/lib/supabase";
import type { OrderStage } from "@/types";
import { handleSupabaseError, ServiceError } from "../orderServiceErrors";
import { throwFreezeReasonRequired } from "./orderFreezeGuards";

// Stage-only writes for orders: single-row and compare-and-set bulk moves.
// Both reject `freeze`, which needs reason metadata only saveOrder can carry.
export function createOrderStageTransitionRepository(
	db: typeof supabaseDefault = supabaseDefault,
) {
	const repository = {
		async updateOrderStage(id: string, stage: OrderStage) {
			if (stage === "freeze") throwFreezeReasonRequired();
			const { data, error } = await db
				.from("orders")
				.update({ stage })
				.eq("id", id)
				.select()
				.single();
			if (error) handleSupabaseError(error);
			return data;
		},

		async updateOrdersStage(
			ids: string[],
			stage: OrderStage,
			previousStage?: OrderStage,
			options?: { guardFrozenVins?: boolean },
		) {
			if (ids.length === 0) return [];

			if (stage === "freeze") throwFreezeReasonRequired();

			if (options?.guardFrozenVins) {
				const { data, error } = await db.rpc(
					"auto_move_orders_to_stage_if_unfrozen",
					{
						p_ids: ids,
						p_source_stage: previousStage ?? stage,
						p_stage: stage,
					},
				);
				if (error) handleSupabaseError(error);

				const result = (data?.[0] ?? {}) as {
					moved_ids?: string[] | null;
					blocked_vins?: string[] | null;
				};
				const blockedVins = result.blocked_vins ?? [];
				if (blockedVins.length > 0) {
					throw new ServiceError(
						"AUTO_MOVE_FROZEN_VIN_BLOCKED",
						"Auto-move blocked: one or more lines for this VIN are currently frozen.",
						{ frozenVins: blockedVins },
					);
				}

				return result.moved_ids ?? [];
			}

			const idsToUpdate = ids;

			// Compare-and-set bulk stage moves:
			// When `previousStage` is provided, the UPDATE guards on `stage = previousStage`
			// so rows that have been concurrently frozen or moved out from under the caller
			// are not modified.
			//
			// Architectural Decision (Partial application vs Transactional RPC):
			// Partial application with clear error reporting is chosen over a transactional RPC.
			// 1. Freeze transitions carry metadata (freezeReason, frozenAt) and execute as sequential
			//    `patchRow` commands via `saveOrder()`, each individually guarded by CAS.
			// 2. If a command fails mid-sequence, `saveDraft()` checkpoints progress and surfaces
			//    the conflict via `saveError`, giving the user explicit control via `skipFailedCommand`
			//    or `discardDraft`.
			// 3. For bulk stage moves, CAS (`.eq("stage", previousStage)`) prevents touching rows that
			//    diverged. If any requested IDs did not match, `BULK_STAGE_MOVE_CONFLICT` is thrown,
			//    triggering optimistic rollback and query invalidation.

			// For large batches, process in chunks to avoid connection pool exhaustion
			const BATCH_SIZE = 50;

			if (idsToUpdate.length > BATCH_SIZE) {
				const successfulIds: string[] = [];
				let encounteredError: Error | null = null;
				let returnData: Record<string, unknown>[] = [];
				const allUnmatchedIds: string[] = [];

				try {
					returnData = await processBatch(
						idsToUpdate,
						BATCH_SIZE,
						async (batch) => {
							let query = db.from("orders").update({ stage });
							if (previousStage) {
								query = query.eq("stage", previousStage);
							}
							const { data, error } = await query.in("id", batch).select();
							if (error) handleSupabaseError(error);

							if (data) {
								const batchUpdatedIds = new Set(
									data.map((r) => r.id as string),
								);
								successfulIds.push(...batchUpdatedIds);
								if (previousStage) {
									for (const id of batch) {
										if (!batchUpdatedIds.has(id)) {
											allUnmatchedIds.push(id);
										}
									}
								}
							} else if (previousStage) {
								allUnmatchedIds.push(...batch);
							}
							return data || [];
						},
					);
				} catch (err: unknown) {
					encounteredError =
						err instanceof Error ? err : new Error(String(err));
				}

				if (encounteredError) {
					if (successfulIds.length > 0) {
						if (previousStage) {
							logger.warn(
								`Bulk move failed, rolling back ${successfulIds.length} rows to ${previousStage}...`,
							);
							try {
								// CAS-guard the rollback too: only revert rows that are still
								// in `stage` (the destination we just moved them to). Without
								// this guard, a row that a concurrent writer moved again in the
								// meantime (e.g. another client froze it) would be silently
								// stomped back to `previousStage` here — reintroducing the exact
								// "stale write clobbers a concurrent freeze" bug this CAS layer
								// exists to prevent, just in the rollback path instead of the
								// forward one.
								const rolledBackIds = new Set<string>();
								await processBatch(successfulIds, BATCH_SIZE, async (batch) => {
									const { data: rolledBack, error: rollbackError } = await db
										.from("orders")
										.update({ stage: previousStage })
										.eq("stage", stage)
										.in("id", batch)
										.select("id");
									if (rollbackError) handleSupabaseError(rollbackError);
									for (const row of rolledBack ?? []) {
										rolledBackIds.add(row.id as string);
									}
									return [];
								});
								const unrolledBackIds = successfulIds.filter(
									(id) => !rolledBackIds.has(id),
								);
								if (unrolledBackIds.length > 0) {
									logger.warn(
										`Rollback left ${unrolledBackIds.length} row(s) in "${stage}" because they no longer matched that stage (moved by another writer in the meantime): ${unrolledBackIds.join(", ")}`,
									);
								}
							} catch (rollbackErr) {
								logger.error(
									"Failed to rollback partial bulk update:",
									rollbackErr,
								);
							}
						} else {
							logger.warn(
								`Partial bulk move failure with ${successfulIds.length} committed rows — no previousStage provided, cannot rollback DB state.`,
							);
						}
					}
					throw new ServiceError(
						"BULK_STAGE_MOVE_PARTIAL_FAILURE",
						encounteredError.message || "Bulk update failed",
					);
				}

				if (previousStage && allUnmatchedIds.length > 0) {
					const total = idsToUpdate.length;
					const unmatchedCount = allUnmatchedIds.length;
					const msg =
						unmatchedCount === total
							? `None of the ${total} orders could be moved because they are no longer in "${previousStage}".`
							: `${unmatchedCount} of ${total} orders could not be moved because they are no longer in "${previousStage}".`;
					throw new ServiceError("BULK_STAGE_MOVE_CONFLICT", msg, {
						unmatchedIds: allUnmatchedIds,
						successfulIds,
						expectedStage: previousStage,
					});
				}

				return returnData;
			}

			let query = db.from("orders").update({ stage });
			if (previousStage) {
				query = query.eq("stage", previousStage);
			}
			const { data, error } = await query.in("id", idsToUpdate).select();
			if (error) handleSupabaseError(error);

			const updatedRows = (data ?? []) as Record<string, unknown>[];
			if (previousStage) {
				const updatedIdSet = new Set(updatedRows.map((r) => r.id as string));
				const unmatchedIds = idsToUpdate.filter((id) => !updatedIdSet.has(id));
				if (unmatchedIds.length > 0) {
					const total = idsToUpdate.length;
					const unmatchedCount = unmatchedIds.length;
					const msg =
						unmatchedCount === total
							? `None of the ${total} orders could be moved because they are no longer in "${previousStage}".`
							: `${unmatchedCount} of ${total} orders could not be moved because they are no longer in "${previousStage}".`;
					throw new ServiceError("BULK_STAGE_MOVE_CONFLICT", msg, {
						unmatchedIds,
						successfulIds: Array.from(updatedIdSet),
						expectedStage: previousStage,
					});
				}
			}

			return updatedRows;
		},
	};
	return repository;
}
