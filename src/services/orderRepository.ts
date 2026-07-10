import { normalizeNullableCompanyName } from "@/domain/company/company";
import { isUuid } from "@/domain/order/orderWorkflow";
import { processBatch } from "@/lib/batchUtils";
import { logger } from "@/lib/logger";
import { supabase as supabaseDefault } from "@/lib/supabase";
import type { OrderStage, PendingRow } from "@/types";
import { mapSupabaseOrder } from "./orderMapper";
import {
	ORDERS_SELECT_BASE,
	ORDERS_SELECT_WITH_ATTACHMENTS,
} from "./orderRepositorySelects";
import {
	handleSupabaseError,
	isMissingAttachmentColumnError,
	ServiceError,
} from "./orderServiceErrors";

export { createOrderQueryRepository } from "./order/orderQueryRepository";

type ZeroRowMatchOutcome =
	| { type: "no-op" }
	| { type: "conflict"; message: string }
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
		logger.debug(
			`[${context}] Skipped for ${id}: row no longer in stage "${expectedCurrentStage}"`,
		);
		return { type: "no-op" };
	}

	if (attempt >= maxAttempts) {
		logger.warn(
			`[${context}] Exhausted ${maxAttempts} attempts for id ${id} due to concurrent metadata writes`,
		);
		return { type: "conflict", message: WRITE_CONFLICT_MESSAGE };
	}

	return {
		type: "retry",
		metadata: (recheck.metadata as Record<string, unknown>) || {},
		updatedAt: recheck.updated_at as string | undefined,
	};
}

type ZeroRowHandling =
	| { action: "return-null" }
	| { action: "throw"; message: string }
	| {
			action: "retry";
			metadata: Record<string, unknown>;
			updatedAt: string | undefined;
	  };

// Shared branch logic for a conditional UPDATE that matched 0 rows: used by
// both the primary update and the missing-attachment-column fallback update
// in saveOrder, which otherwise duplicate this exact decision.
async function handleZeroRowMatch(
	args: Parameters<typeof resolveZeroRowMatch>[0],
): Promise<ZeroRowHandling> {
	const outcome = await resolveZeroRowMatch(args);
	if (outcome.type === "no-op") return { action: "return-null" };
	if (outcome.type === "conflict")
		return { action: "throw", message: outcome.message };
	return {
		action: "retry",
		metadata: outcome.metadata,
		updatedAt: outcome.updatedAt,
	};
}

export function createOrderRepository(
	db: typeof supabaseDefault = supabaseDefault,
) {
	const service = {
		async updateOrderStage(id: string, stage: OrderStage) {
			const { data, error } = await db
				.from("orders")
				.update({ stage })
				.eq("id", id)
				.select()
				.single();
			if (error) handleSupabaseError(error);
			return data;
		},

		async updateOrdersStage(ids: string[], stage: OrderStage) {
			if (ids.length === 0) return [];

			// For large batches, process in chunks to avoid connection pool exhaustion
			const BATCH_SIZE = 50;

			if (ids.length > BATCH_SIZE) {
				return processBatch(ids, BATCH_SIZE, async (batch) => {
					const { data, error } = await db
						.from("orders")
						.update({ stage })
						.in("id", batch)
						.select();
					if (error) handleSupabaseError(error);
					return data || [];
				});
			}

			const { data, error } = await db
				.from("orders")
				.update({ stage })
				.in("id", ids)
				.select();
			if (error) handleSupabaseError(error);
			return data;
		},

		async saveOrder(
			order: Partial<PendingRow> & {
				stage: OrderStage;
				expectedCurrentStage?: OrderStage;
				idempotencyKey?: string;
			},
		) {
			const {
				id,
				stage,
				reminder,
				expectedCurrentStage,
				idempotencyKey,
				...rest
			} = order;

			// Builds the metadata merge + column-mapped payload against a given
			// metadata snapshot. Re-invoked on each optimistic-concurrency retry so
			// a retry always merges against the row's latest metadata instead of
			// the stale snapshot that lost the race.
			function buildPayload(currentMetadata: Record<string, unknown>) {
				// Ensure we don't store id, stage, or reminder in the metadata JSON itself
				// to avoid confusion, though it wouldn't cause a schema error.
				const metadataBase = { ...currentMetadata, ...rest };

				if (
					"partNumber" in rest ||
					"description" in rest ||
					"quantity" in rest
				) {
					const existingParts: unknown[] = Array.isArray(metadataBase.parts)
						? (metadataBase.parts as unknown[])
						: [];
					const firstPart = existingParts[0] as
						| Record<string, unknown>
						| undefined;
					const seed = firstPart ?? {
						id: crypto.randomUUID(),
						partNumber: (currentMetadata.partNumber as string) ?? "",
						description: (currentMetadata.description as string) ?? "",
						quantity: (currentMetadata.quantity as number) ?? 1,
					};
					const updatedFirst = {
						...seed,
						...("partNumber" in rest ? { partNumber: rest.partNumber } : {}),
						...("description" in rest ? { description: rest.description } : {}),
						...("quantity" in rest ? { quantity: rest.quantity } : {}),
					};
					(metadataBase as Record<string, unknown>).parts =
						existingParts.length > 0
							? [updatedFirst, ...existingParts.slice(1)]
							: [updatedFirst];
				}

				delete (metadataBase as Record<string, unknown>).id;
				delete (metadataBase as Record<string, unknown>).stage;
				delete (metadataBase as Record<string, unknown>).reminder;
				delete (metadataBase as Record<string, unknown>).hasAttachment;

				// When the payload explicitly includes `noteHistory`, clear legacy note keys
				// so a deliberate save of noteHistory: "" cannot be revived by stale fields.
				if ("noteHistory" in rest) {
					delete (metadataBase as Record<string, unknown>).actionNote;
					delete (metadataBase as Record<string, unknown>).noteContent;
				}

				const metadataToStore = { ...metadataBase };
				delete (metadataToStore as Record<string, unknown>).attachmentLink;
				delete (metadataToStore as Record<string, unknown>).attachmentFilePath;
				delete (metadataToStore as Record<string, unknown>).attachmentFilePaths;

				const fallbackMetadataToStore = { ...metadataBase };

				// 2. Map strictly to table columns to avoid "column not found" errors
				// Only include columns that are present in the patch so a single-field
				// inline edit cannot overwrite unrelated columns (e.g. order_number → null).
				const baseSupabaseOrder: Record<string, unknown> = { stage };
				if ("trackingId" in rest || "order_number" in rest)
					baseSupabaseOrder.order_number =
						rest.trackingId !== undefined
							? rest.trackingId
							: ((rest as Record<string, unknown>).order_number ?? null);
				if ("customerName" in rest || "customer_name" in rest)
					baseSupabaseOrder.customer_name =
						rest.customerName !== undefined
							? rest.customerName
							: (rest as Record<string, unknown>).customer_name;
				if ("mobile" in rest || "customer_phone" in rest)
					baseSupabaseOrder.customer_phone =
						rest.mobile !== undefined
							? rest.mobile
							: (rest as Record<string, unknown>).customer_phone;
				if ("vin" in rest) baseSupabaseOrder.vin = rest.vin;
				if ("company" in rest)
					baseSupabaseOrder.company = normalizeNullableCompanyName(
						rest.company,
					);

				const dbOrder = {
					...baseSupabaseOrder,
					...("attachmentLink" in rest && {
						attachment_link: rest.attachmentLink ?? null,
					}),
					...("attachmentFilePath" in rest && {
						attachment_file_path: rest.attachmentFilePath ?? null,
					}),
					...("attachmentFilePaths" in rest && {
						attachment_file_paths: rest.attachmentFilePaths ?? [],
					}),
					metadata: metadataToStore,
				};

				const fallbackSupabaseOrder = {
					...baseSupabaseOrder,
					metadata: fallbackMetadataToStore,
				};

				return { dbOrder, fallbackSupabaseOrder };
			}

			let orderId = id;
			// biome-ignore lint/suspicious/noExplicitAny: Supabase return type
			let resultData: any;

			if (id && id.length === 36) {
				// Snapshot current metadata + updated_at for the optimistic-concurrency
				// guard below. The `orders_updated_at` trigger bumps updated_at on every
				// UPDATE, so an equality match on it detects a concurrent write between
				// this read and our write.
				const { data: existing, error: existingError } = await db
					.from("orders")
					.select("metadata, updated_at")
					.eq("id", id)
					.maybeSingle();

				if (existingError) handleSupabaseError(existingError);

				let snapshotMetadata =
					(existing?.metadata as Record<string, unknown>) || {};
				let snapshotUpdatedAt = existing?.updated_at as string | undefined;

				// Bounded retry: a concurrent saveOrder on the same row (two tabs, or a
				// user edit racing a background maintenance scan) can update the row
				// between our read and write. Rather than silently overwriting the
				// other writer's metadata fields, re-merge against the fresh row and
				// retry, up to MAX_ATTEMPTS.
				const MAX_ATTEMPTS = 3;
				let attempt = 0;

				for (;;) {
					attempt += 1;
					const { dbOrder, fallbackSupabaseOrder } =
						buildPayload(snapshotMetadata);

					// When expectedCurrentStage is set, the UPDATE is conditional: it only matches
					// the row if it is still in that stage. This prevents duplicate archives when
					// multiple tabs run the maintenance scan concurrently — if another client already
					// archived the row, stage will be "archive" and this update matches 0 rows (no-op).
					// The updated_at equality guard additionally protects the metadata merge: if
					// another writer changed the row after our snapshot, this update matches 0 rows
					// too, and we retry the merge against the fresh data instead of clobbering it.
					let updateQuery = db.from("orders").update(dbOrder).eq("id", id);
					if (expectedCurrentStage) {
						updateQuery = updateQuery.eq("stage", expectedCurrentStage);
					}
					if (snapshotUpdatedAt) {
						updateQuery = updateQuery.eq("updated_at", snapshotUpdatedAt);
					}
					const { data, error } = await updateQuery.select().maybeSingle();

					if (!data && !error) {
						const zeroRow = await handleZeroRowMatch({
							db,
							id,
							expectedCurrentStage,
							attempt,
							maxAttempts: MAX_ATTEMPTS,
							context: "saveOrder",
						});
						if (zeroRow.action === "return-null") return null;
						if (zeroRow.action === "throw")
							throw new ServiceError("WRITE_CONFLICT", zeroRow.message);
						snapshotMetadata = zeroRow.metadata;
						snapshotUpdatedAt = zeroRow.updatedAt;
						continue;
					}

					if (error && isMissingAttachmentColumnError(error)) {
						let fallbackQuery = db
							.from("orders")
							.update(fallbackSupabaseOrder)
							.eq("id", id);
						if (expectedCurrentStage) {
							fallbackQuery = fallbackQuery.eq("stage", expectedCurrentStage);
						}
						if (snapshotUpdatedAt) {
							fallbackQuery = fallbackQuery.eq("updated_at", snapshotUpdatedAt);
						}
						const { data: fallbackData, error: fallbackError } =
							await fallbackQuery.select().maybeSingle();

						if (!fallbackData && !fallbackError) {
							const zeroRow = await handleZeroRowMatch({
								db,
								id,
								expectedCurrentStage,
								attempt,
								maxAttempts: MAX_ATTEMPTS,
								context: "saveOrder fallback",
							});
							if (zeroRow.action === "return-null") return null;
							if (zeroRow.action === "throw")
								throw new ServiceError("WRITE_CONFLICT", zeroRow.message);
							snapshotMetadata = zeroRow.metadata;
							snapshotUpdatedAt = zeroRow.updatedAt;
							continue;
						}
						if (fallbackError) handleSupabaseError(fallbackError);
						resultData = fallbackData;
						break;
					}

					if (error) handleSupabaseError(error);
					resultData = data;
					break;
				}
			} else {
				const { dbOrder, fallbackSupabaseOrder } = buildPayload({});
				const insertOrder = idempotencyKey
					? { ...dbOrder, idempotency_key: idempotencyKey }
					: dbOrder;
				const insertFallback = idempotencyKey
					? { ...fallbackSupabaseOrder, idempotency_key: idempotencyKey }
					: fallbackSupabaseOrder;

				const insertQuery = idempotencyKey
					? db.from("orders").upsert([insertOrder], {
							onConflict: "idempotency_key",
							ignoreDuplicates: true,
						})
					: db.from("orders").insert([insertOrder]);

				// ignoreDuplicates: true → ON CONFLICT DO NOTHING returns no row; use maybeSingle to handle that
				const primaryResult = idempotencyKey
					? await insertQuery.select().maybeSingle()
					: await insertQuery.select().single();
				let { data, error } = primaryResult;

				// ON CONFLICT DO NOTHING returned null — fetch the existing row without overwriting it
				if (!data && !error && idempotencyKey) {
					const { data: existing, error: existingError } = await db
						.from("orders")
						.select(ORDERS_SELECT_WITH_ATTACHMENTS)
						.eq("idempotency_key", idempotencyKey)
						.single();
					if (existingError) handleSupabaseError(existingError);
					data = existing;
				}

				if (error && isMissingAttachmentColumnError(error)) {
					const fallbackQuery = idempotencyKey
						? db.from("orders").upsert([insertFallback], {
								onConflict: "idempotency_key",
								ignoreDuplicates: true,
							})
						: db.from("orders").insert([insertFallback]);
					const fallbackResult = idempotencyKey
						? await fallbackQuery.select().maybeSingle()
						: await fallbackQuery.select().single();
					let { data: fallbackData, error: fallbackError } = fallbackResult;
					if (!fallbackData && !fallbackError && idempotencyKey) {
						const { data: existing, error: existingError } = await db
							.from("orders")
							.select(ORDERS_SELECT_BASE)
							.eq("idempotency_key", idempotencyKey)
							.single();
						if (existingError) handleSupabaseError(existingError);
						fallbackData = existing;
					}
					if (fallbackError) handleSupabaseError(fallbackError);
					if (!fallbackData)
						throw new ServiceError(
							"INSERT_FAILED",
							"Idempotent insert returned no data",
						);
					orderId = fallbackData.id;
					resultData = fallbackData;
				} else {
					if (error) handleSupabaseError(error);
					if (!data)
						throw new ServiceError(
							"INSERT_FAILED",
							"Idempotent insert returned no data",
						);
					orderId = data.id;
					resultData = data;
				}
			}

			// 3. Handle Reminder in separate table
			if (reminder !== undefined && orderId) {
				// Clear existing pending reminders
				await db
					.from("order_reminders")
					.delete()
					.eq("order_id", orderId)
					.eq("is_completed", false);

				if (reminder) {
					let remindAt: string | null = null;
					if (reminder.date && reminder.time) {
						// CRITICAL: Timezone Handling
						// We must construct the Date object using local time components (year, month, day, hours, minutes)
						// and then convert to UTC via toISOString().
						// DO NOT simply concatenate strings or use new Date() on a string without timezone,
						// as that will be interpreted as UTC and shift the time by the timezone offset (e.g. +2h for Egypt).
						const [year, month, day] = reminder.date.split("-").map(Number);
						const [hours, minutes] = reminder.time.split(":").map(Number);
						const localDate = new Date(year, month - 1, day, hours, minutes);
						remindAt = localDate.toISOString();
					} else {
						remindAt = new Date().toISOString();
					}

					const { error: reminderError } = await db
						.from("order_reminders")
						.insert({
							order_id: orderId,
							title: reminder.subject,
							remind_at: remindAt,
							is_completed: false,
						});
					if (reminderError) handleSupabaseError(reminderError);
				}
			}

			// Re-fetch the complete row with the order_reminders join so the mutation
			// response reflects the true DB state (including any reminder just saved).
			// Without this, the bare SELECT above returns no order_reminders data and
			// mapSupabaseOrder maps reminder: null, briefly wiping the reminder from the UI.
			const { data: finalData, error: finalError } = await db
				.from("orders")
				.select(ORDERS_SELECT_WITH_ATTACHMENTS)
				.eq("id", orderId)
				.maybeSingle();

			if (finalError) {
				if (isMissingAttachmentColumnError(finalError)) {
					const { data: fallbackFinalData, error: fallbackFinalError } =
						await db
							.from("orders")
							.select(ORDERS_SELECT_BASE)
							.eq("id", orderId)
							.maybeSingle();
					if (fallbackFinalError) handleSupabaseError(fallbackFinalError);
					return fallbackFinalData ?? resultData;
				}
				// Any other reread failure: surface the error so the mutation rolls back
				// instead of silently returning stale data with reminder: null.
				handleSupabaseError(finalError);
			}

			return finalData ?? resultData;
		},

		async deleteOrder(id: string) {
			if (!id || !isUuid(id)) {
				logger.warn(`Skipping delete for non-UUID id: ${id}`);
				return;
			}

			const { error } = await db.from("orders").delete().eq("id", id);
			if (error) handleSupabaseError(error);
		},

		async deleteOrders(ids: string[]) {
			if (ids.length === 0) return;

			const validIds = ids.filter(isUuid);
			if (validIds.length === 0) {
				logger.warn("Skipping bulk delete; no valid UUID ids", {
					count: ids.length,
				});
				return;
			}

			if (validIds.length !== ids.length) {
				logger.warn("Skipping non-UUID ids during bulk delete", {
					totalIds: ids.length,
					validIds: validIds.length,
				});
			}

			const { error } = await db.from("orders").delete().in("id", validIds);
			if (error) handleSupabaseError(error);
		},

		mapSupabaseOrder(row: Record<string, unknown>): PendingRow {
			return mapSupabaseOrder(row);
		},
	};
	return service;
}
