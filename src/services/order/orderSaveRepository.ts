import { normalizeNullableCompanyName } from "@/domain/company/company";
import { isUuid } from "@/domain/order/orderWorkflow";
import { supabase as supabaseDefault } from "@/lib/supabase";
import type { OrderStage, PendingRow } from "@/types";
import {
	ORDERS_SELECT_BASE,
	ORDERS_SELECT_WITH_ATTACHMENTS,
} from "../orderRepositorySelects";
import {
	handleSupabaseError,
	isMissingAttachmentColumnError,
	ServiceError,
} from "../orderServiceErrors";
import {
	assertFreezeTransitionAllowed,
	freezeReasonOf,
	throwFreezeReasonRequired,
} from "./orderFreezeGuards";
import { handleZeroRowMatch } from "./orderWriteConflicts";

// Insert/update of a full order row: metadata merge, optimistic-concurrency
// retry, freeze-reason enforcement, and the reminder side table.
export function createOrderSaveRepository(
	db: typeof supabaseDefault = supabaseDefault,
) {
	const repository = {
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

			assertFreezeTransitionAllowed({
				stage,
				expectedCurrentStage,
				freezeReason: rest.freezeReason,
			});

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

			if (id && isUuid(id)) {
				// Snapshot current metadata + updated_at for the optimistic-concurrency
				// guard below. The `orders_updated_at` trigger bumps updated_at on every
				// UPDATE, so an equality match on it detects a concurrent write between
				// this read and our write.
				const { data: existing, error: existingError } = await db
					.from("orders")
					.select("metadata, updated_at, stage")
					.eq("id", id)
					.maybeSingle();

				if (existingError) handleSupabaseError(existingError);

				// Snapshot-aware freeze check: a direct write that moves a live row
				// into `freeze` without declaring expectedCurrentStage is still a
				// transition and needs a reason. Same-stage writes on already-frozen
				// rows (e.g. note edits from the Freeze tab) pass through.
				if (
					stage === "freeze" &&
					existing &&
					(existing.stage as string) !== "freeze" &&
					!freezeReasonOf(rest.freezeReason).trim()
				) {
					throwFreezeReasonRequired();
				}

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
							throw new ServiceError(
								zeroRow.code,
								zeroRow.message,
								zeroRow.details,
							);
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
								throw new ServiceError(
									zeroRow.code,
									zeroRow.message,
									zeroRow.details,
								);
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
				// Inserts have no prior row state, so creating a row directly in
				// `freeze` always counts as a transition and needs a reason.
				if (stage === "freeze" && !freezeReasonOf(rest.freezeReason).trim()) {
					throwFreezeReasonRequired();
				}
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
				// Insert the new reminder (if any) before clearing the stale ones, and
				// exclude the newly-inserted row from that delete. This keeps the
				// reminder set from ever being briefly empty: if the process fails
				// after the insert but before the delete, the new reminder is still
				// present rather than lost.
				let newReminderId: string | undefined;

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

					const { data: insertedReminder, error: reminderError } = await db
						.from("order_reminders")
						.insert({
							order_id: orderId,
							title: reminder.subject,
							remind_at: remindAt,
							is_completed: false,
						})
						.select("id")
						.single();
					if (reminderError) handleSupabaseError(reminderError);
					newReminderId = insertedReminder?.id as string | undefined;

					// Defensive guard: .single() should make this unreachable (a
					// successful insert with no matching error must return the row),
					// but if it ever happens, newReminderId would stay undefined and
					// the delete below would have nothing to exclude — wiping the
					// reminder we just inserted. Fail loudly instead of silently
					// deleting the new reminder.
					if (!newReminderId) {
						throw new ServiceError(
							"REMINDER_INSERT_FAILED",
							"Reminder insert reported success but returned no id",
						);
					}
				}

				// Clear the now-stale pending reminders, excluding the one just inserted.
				let clearStaleQuery = db
					.from("order_reminders")
					.delete()
					.eq("order_id", orderId)
					.eq("is_completed", false);
				if (newReminderId) {
					clearStaleQuery = clearStaleQuery.neq("id", newReminderId);
				}
				const { error: clearStaleError } = await clearStaleQuery;
				if (clearStaleError) handleSupabaseError(clearStaleError);
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
	};
	return repository;
}
