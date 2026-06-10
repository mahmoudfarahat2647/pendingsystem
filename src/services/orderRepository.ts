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

			// 1. Prepare Metadata Merge
			let currentMetadata: Record<string, unknown> = {};
			if (id && id.length === 36) {
				const { data: existing } = await db
					.from("orders")
					.select("metadata")
					.eq("id", id)
					.maybeSingle();
				if (existing) {
					currentMetadata =
						(existing.metadata as Record<string, unknown>) || {};
				}
			}

			// Ensure we don't store id, stage, or reminder in the metadata JSON itself
			// to avoid confusion, though it wouldn't cause a schema error.
			const metadataBase = { ...currentMetadata, ...rest };

			if ("partNumber" in rest || "description" in rest || "quantity" in rest) {
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
					rest.trackingId ||
					(rest as Record<string, unknown>).order_number ||
					null;
			if ("customerName" in rest || "customer_name" in rest)
				baseSupabaseOrder.customer_name =
					rest.customerName || (rest as Record<string, unknown>).customer_name;
			if ("mobile" in rest || "customer_phone" in rest)
				baseSupabaseOrder.customer_phone =
					rest.mobile || (rest as Record<string, unknown>).customer_phone;
			if ("vin" in rest) baseSupabaseOrder.vin = rest.vin;
			if ("company" in rest)
				baseSupabaseOrder.company = normalizeNullableCompanyName(rest.company);

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

			let orderId = id;
			// biome-ignore lint/suspicious/noExplicitAny: Supabase return type
			let resultData: any;

			if (id && id.length === 36) {
				// When expectedCurrentStage is set, the UPDATE is conditional: it only matches
				// the row if it is still in that stage. This prevents duplicate archives when
				// multiple tabs run the maintenance scan concurrently — if another client already
				// archived the row, stage will be "archive" and this update matches 0 rows (no-op).
				let updateQuery = db.from("orders").update(dbOrder).eq("id", id);
				if (expectedCurrentStage) {
					updateQuery = updateQuery.eq("stage", expectedCurrentStage);
				}
				const { data, error } = await updateQuery.select().maybeSingle();

				if (!data && !error) {
					// 0 rows matched — row was already moved to a different stage by another client.
					logger.debug(
						`[saveOrder] Skipped update for ${id}: row no longer in stage "${expectedCurrentStage}"`,
					);
					return null;
				}

				if (error && isMissingAttachmentColumnError(error)) {
					let fallbackQuery = db
						.from("orders")
						.update(fallbackSupabaseOrder)
						.eq("id", id);
					if (expectedCurrentStage) {
						fallbackQuery = fallbackQuery.eq("stage", expectedCurrentStage);
					}
					const { data: fallbackData, error: fallbackError } =
						await fallbackQuery.select().maybeSingle();
					if (!fallbackData && !fallbackError) {
						logger.debug(
							`[saveOrder] Fallback skipped for ${id}: row no longer in stage "${expectedCurrentStage}"`,
						);
						return null;
					}
					if (fallbackError) handleSupabaseError(fallbackError);
					resultData = fallbackData;
				} else {
					if (error) handleSupabaseError(error);
					resultData = data;
				}
			} else {
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
