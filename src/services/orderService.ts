import { processBatch } from "@/lib/batchUtils";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { PendingRowSchema } from "@/schemas/order.schema";
import type { PendingRow } from "@/types";

export type OrderStage = "orders" | "main" | "call" | "booking" | "archive";

export class ServiceError extends Error {
	code: string;
	details?: unknown;

	constructor(code: string, message: string, details?: unknown) {
		super(message);
		this.code = code;
		this.details = details;
	}
}

function handleSupabaseError(error: PostgrestError): never {
	throw new ServiceError(error.code || "DATABASE_ERROR", error.message, {
		hint: error.hint,
		details: error.details,
	});
}

export const orderService = {
	async getOrders(stage?: OrderStage) {
		// Use explicit selection to avoid potential schema cache issues with '*'
		// and use a clear alias for the related reminders table
		let query = supabase
			.from("orders")
			.select(`
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
			`)
			.order("created_at", { ascending: false });

		if (stage) {
			query = query.eq("stage", stage);
		}
		const { data, error } = await query;
		if (error) handleSupabaseError(error);
		return data;
	},

	async updateOrderStage(id: string, stage: OrderStage) {
		const { data, error } = await supabase
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
				const { data, error } = await supabase
					.from("orders")
					.update({ stage })
					.in("id", batch)
					.select();
				if (error) handleSupabaseError(error);
				return data || [];
			});
		}

		const { data, error } = await supabase
			.from("orders")
			.update({ stage })
			.in("id", ids)
			.select();
		if (error) handleSupabaseError(error);
		return data;
	},

	async saveOrder(order: Partial<PendingRow> & { stage: OrderStage }) {
		const { id, stage, reminder, ...rest } = order;

		// 1. Prepare Metadata Merge
		let currentMetadata: Record<string, unknown> = {};
		if (id && id.length === 36) {
			const { data: existing } = await supabase
				.from("orders")
				.select("metadata")
				.eq("id", id)
				.maybeSingle();
			if (existing) {
				currentMetadata = (existing.metadata as Record<string, unknown>) || {};
			}
		}

		// Ensure we don't store id, stage, or reminder in the metadata JSON itself
		// to avoid confusion, though it wouldn't cause a schema error.
		const metadataToStore = { ...currentMetadata, ...rest };
		delete (metadataToStore as Record<string, unknown>).id;
		delete (metadataToStore as Record<string, unknown>).stage;
		delete (metadataToStore as Record<string, unknown>).reminder;

		// 2. Map strictly to table columns to avoid "column not found" errors
		const supabaseOrder = {
			order_number:
				rest.trackingId ||
				(rest as Record<string, unknown>).order_number ||
				null,
			customer_name:
				rest.customerName || (rest as Record<string, unknown>).customer_name,
			customer_phone:
				rest.mobile || (rest as Record<string, unknown>).customer_phone,
			vin: rest.vin,
			company: rest.company,
			stage: stage,
			metadata: metadataToStore,
		};

		let orderId = id;
		// biome-ignore lint/suspicious/noExplicitAny: Supabase return type
		let resultData: any;

		if (id && id.length === 36) {
			const { data, error } = await supabase
				.from("orders")
				.update(supabaseOrder)
				.eq("id", id)
				.select()
				.single();
			if (error) handleSupabaseError(error);
			resultData = data;
		} else {
			const { data, error } = await supabase
				.from("orders")
				.insert([supabaseOrder])
				.select()
				.single();
			if (error) handleSupabaseError(error);
			orderId = data.id;
			resultData = data;
		}

		// 3. Handle Reminder in separate table
		if (reminder !== undefined && orderId) {
			// Clear existing pending reminders
			await supabase
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

				const { error: reminderError } = await supabase
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

		return resultData;
	},

	async deleteOrder(id: string) {
		if (!id || id.length !== 36) {
			console.warn(`Skipping delete for non-UUID id: ${id}`);
			return;
		}
		const { error } = await supabase.from("orders").delete().eq("id", id);
		if (error) handleSupabaseError(error);
	},

	async getActivityLog() {
		const { data, error } = await supabase.from("recent_activity").select("*");
		if (error) handleSupabaseError(error);
		return data;
	},

	// biome-ignore lint/suspicious/noExplicitAny: Supabase row type is loosely defined
	mapSupabaseOrder(row: any): PendingRow {
		// Map back the first active reminder if exists via the join
		let reminder: { date: string; time: string; subject: string } | null = null;
		if (
			row.order_reminders &&
			Array.isArray(row.order_reminders) &&
			row.order_reminders.length > 0
		) {
			// Find the first uncompleted one
			const active = row.order_reminders.find(
				(r: { is_completed: boolean; remind_at: string; title: string }) =>
					!r.is_completed,
			);
			if (active?.remind_at) {
				// Parse the remind_at timestamp back into date and time
				const remindAt = new Date(active.remind_at);
				// CRITICAL: Timezone Handling
				// Parse the UTC remind_at timestamp back into local time components.
				// We construct the "YYYY-MM-DD" string using local getFullYear/getMonth/getDate
				// to match the user's local day, reversing the logic used in saveOrder.
				const resultDate = [
					remindAt.getFullYear(),
					String(remindAt.getMonth() + 1).padStart(2, "0"),
					String(remindAt.getDate()).padStart(2, "0"),
				].join("-");

				reminder = {
					date: resultDate,
					time: remindAt.toTimeString().slice(0, 5), // .toTimeString() returns local time string
					subject: active.title || "",
				};
			}
		}

		const resultObj = {
			...(row.metadata || {}),
			id: row.id,
			trackingId: row.order_number,
			customerName: row.customer_name,
			mobile: row.customer_phone,
			vin: row.vin,
			company: row.company,
			reminder: reminder,
			// stage logic is handled by the tab we are in
		};

		// Safe parse with Zod to validate and normalize data structure
		// This handles legacy field synchronization via the schema transform
		const parseResult = PendingRowSchema.safeParse(resultObj);

		if (process.env.NODE_ENV === "development") {
			if (!parseResult.success) {
				console.error(
					`[Strict Validation Failed] Order ID ${row.id}:`,
					parseResult.error.flatten().fieldErrors,
				);
				// In development, catch these early to prevent "water leak" regressions
				throw new Error(
					`Data Constraint Violation: ${JSON.stringify(parseResult.error.flatten().fieldErrors)}`,
				);
			}
			return parseResult.data;
		}

		// Production: Log but fallback to best-effort data to prevent crash
		if (!parseResult.success) {
			console.warn(
				`[Zod Validation Warning] Invalid order data for ID ${row.id}:`,
				parseResult.error.flatten().fieldErrors,
			);
			// Even if validation fails, return raw object cast to PendingRow.
			// Note: Transforms did NOT run, so legacy fields might be out of sync if validation failed.
			return resultObj as PendingRow;
		}

		return parseResult.data;


	},
};
