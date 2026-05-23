import type { PostgrestError } from "@supabase/supabase-js";
import { processBatch } from "@/lib/batchUtils";
import { normalizeNullableCompanyName } from "@/lib/company";
import { logger } from "@/lib/logger";
import { isUuid } from "@/lib/orderWorkflow";
import { supabase as supabaseDefault } from "@/lib/supabase";
import type {
	DescriptionConflictResult,
	DuplicateCheckResult,
	PendingRow,
} from "@/types";
import { mapSupabaseOrder } from "./orderMapper";

export { mapSupabaseOrder } from "./orderMapper";

export type OrderStage = "orders" | "main" | "call" | "booking" | "archive";

class ServiceError extends Error {
	code: string;
	details?: unknown;

	constructor(code: string, message: string, details?: unknown) {
		super(message);
		this.code = code;
		this.details = details;
	}
}

const ORDERS_SELECT_BASE = `
	id,
	stage,
	order_number,
	customer_name,
	customer_email,
	customer_phone,
	vin,
	company,
	status,
	metadata,
	created_at,
	updated_at,
	order_reminders (*)
`;

const ORDERS_SELECT_WITH_ATTACHMENTS = `
	id,
	stage,
	order_number,
	customer_name,
	customer_email,
	customer_phone,
	vin,
	company,
	attachment_link,
	attachment_file_path,
	attachment_file_paths,
	status,
	metadata,
	created_at,
	updated_at,
	order_reminders (*)
`;

function isMissingAttachmentColumnError(
	error: PostgrestError | null | undefined,
): boolean {
	if (!error) return false;

	return (
		error.message.includes("schema cache") &&
		(error.message.includes("attachment_link") ||
			error.message.includes("attachment_file_path"))
	);
}

function handleSupabaseError(error: PostgrestError): never {
	throw new ServiceError(error.code || "DATABASE_ERROR", error.message, {
		hint: error.hint,
		details: error.details,
	});
}

export function createOrderService(
	db: typeof supabaseDefault = supabaseDefault,
) {
	const service = {
		async getOrders(stage?: OrderStage) {
			// Use explicit selection to avoid potential schema cache issues with '*'
			// and use a clear alias for the related reminders table
			let query = db
				.from("orders")
				.select(ORDERS_SELECT_WITH_ATTACHMENTS)
				.order("created_at", { ascending: false });

			if (stage) {
				query = query.eq("stage", stage);
			}
			const { data, error } = await query;
			if (error && isMissingAttachmentColumnError(error)) {
				let fallbackQuery = db
					.from("orders")
					.select(ORDERS_SELECT_BASE)
					.order("created_at", { ascending: false });

				if (stage) {
					fallbackQuery = fallbackQuery.eq("stage", stage);
				}

				const { data: fallbackData, error: fallbackError } =
					await fallbackQuery;
				if (fallbackError) handleSupabaseError(fallbackError);
				return fallbackData;
			}
			if (error) handleSupabaseError(error);
			return data;
		},

		/**
		 * Fetches and maps orders for a given stage into validated PendingRow objects.
		 * Combines getOrders + mapSupabaseOrder so callers don't need to inline the
		 * mapping step. Used by the auto-archive maintenance hook.
		 */
		async fetchMappedOrders(stage: OrderStage): Promise<PendingRow[]> {
			const data = await service.getOrders(stage);
			if (!data) return [];
			return data.map((row) =>
				service.mapSupabaseOrder(row as Record<string, unknown>),
			);
		},

		async getDashboardStats() {
			const { data, error } = await db.from("orders").select("id, vin, stage");

			if (error) handleSupabaseError(error);
			return data;
		},

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
			const baseSupabaseOrder = {
				order_number:
					rest.trackingId ||
					(rest as Record<string, unknown>).order_number ||
					null,
				customer_name:
					rest.customerName || (rest as Record<string, unknown>).customer_name,
				customer_phone:
					rest.mobile || (rest as Record<string, unknown>).customer_phone,
				vin: rest.vin,
				company: normalizeNullableCompanyName(rest.company),
				stage: stage,
			};

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
					// Combine date and time into a single timestamp for remind_at
					// Combine date and time into a single timestamp for remind_at
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

			// Then delete the order
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

		async checkHistoricalVinPartDuplicate(
			vin: string,
			partNumber: string,
			excludeIds?: string | string[],
		): Promise<DuplicateCheckResult> {
			if (!vin || !partNumber) {
				return { isDuplicate: false };
			}

			const normalizedVin = vin.trim().toUpperCase();
			const normalizedPart = partNumber.trim().toUpperCase();

			if (normalizedVin.length < 6 || !normalizedPart) {
				return { isDuplicate: false };
			}

			// Normalize to a Set for O(1) lookups
			const excludeSet = new Set(
				Array.isArray(excludeIds) ? excludeIds : excludeIds ? [excludeIds] : [],
			);

			const { data, error } = await db
				.from("orders")
				.select("id, vin, stage, metadata")
				.ilike("vin", normalizedVin)
				.filter("metadata->>partNumber", "ilike", normalizedPart)
				.limit(100);

			if (error) {
				logger.warn(
					"[orderService] checkHistoricalVinPartDuplicate error:",
					error,
				);
				return { isDuplicate: false };
			}

			for (const row of data || []) {
				if (excludeSet.has(row.id)) continue;

				const rowPart = (row.metadata as Record<string, unknown>)?.partNumber as
					| string
					| undefined;
				if (rowPart?.toUpperCase() === normalizedPart) {
					return {
						isDuplicate: true,
						existingRow: {
							id: row.id,
							vin: row.vin || "",
							stage: row.stage,
						} as PendingRow,
						location: row.stage || "history",
					};
				}
			}

			return { isDuplicate: false };
		},

		async checkHistoricalDescriptionConflict(
			partNumber: string,
			currentDescription: string,
			currentRowId?: string,
		): Promise<DescriptionConflictResult> {
			if (!partNumber || !currentDescription) {
				return { hasConflict: false };
			}

			const normalizedPart = partNumber.trim().toUpperCase();
			const normalizedDesc = currentDescription.trim().toLowerCase();

			const { data, error } = await db
				.from("orders")
				.select("id, vin, stage, metadata")
				.filter("metadata->>partNumber", "ilike", normalizedPart)
				.limit(100);

			if (error) {
				logger.warn(
					"[orderService] checkHistoricalDescriptionConflict error:",
					error,
				);
				return { hasConflict: false };
			}

			for (const row of data || []) {
				if (currentRowId && row.id === currentRowId) continue;

				const rowPart = (row.metadata as Record<string, unknown>)?.partNumber as
					| string
					| undefined;
				const rowDesc = (row.metadata as Record<string, unknown>)
					?.description as string | undefined;

				if (
					rowPart?.toUpperCase() === normalizedPart &&
					rowDesc?.trim().toLowerCase() !== normalizedDesc
				) {
					return {
						hasConflict: true,
						existingDescription: rowDesc,
						existingRow: {
							id: row.id,
							vin: row.vin || "",
							stage: row.stage,
						} as PendingRow,
					};
				}
			}

			return { hasConflict: false };
		},
	}; // closes `const service = {`
	return service;
} // closes createOrderService

export const orderService = createOrderService();
