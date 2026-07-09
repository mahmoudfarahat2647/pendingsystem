import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeNullableCompanyName } from "@/domain/company/company";
import { logger } from "@/lib/logger";
import type { MobileQuickOrderPayload } from "@/schemas/mobileOrder.schema";

function todayString(): string {
	const d = new Date();
	const dd = String(d.getDate()).padStart(2, "0");
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const yyyy = d.getFullYear();
	return `${dd}/${mm}/${yyyy}`;
}

export interface CreateOrdersResult {
	inserted: number;
	errors: string[];
}

export const mobileOrderService = {
	async createOrders(
		supabase: SupabaseClient,
		input: MobileQuickOrderPayload,
	): Promise<CreateOrdersResult> {
		const {
			customerName,
			company,
			vin,
			mobile,
			sabNumber,
			model,
			repairSystem,
			parts,
		} = input;

		const rDate = todayString();
		const sharedIdentity = {
			customer_name: customerName || null,
			customer_phone: mobile || null,
			vin: vin || null,
			company: normalizeNullableCompanyName(company) as string,
		};

		const sharedMetadata = {
			requester: "mobile",
			status: "Pending",
			stage: "orders",
			sabNumber,
			model,
			repairSystem,
			rDate,
			sourceType: "mobile",
		};

		// If no valid parts, insert one blank row so the intake appears on desktop.
		const rowsToInsert =
			parts.length === 0 ? [{ partNumber: "", description: "" }] : parts;

		const errors: string[] = [];

		const results = await Promise.allSettled(
			rowsToInsert.map((part) => {
				const partId = crypto.randomUUID();
				const partEntry = {
					id: partId,
					partNumber: part.partNumber,
					description: part.description,
				};
				const row = {
					...sharedIdentity,
					stage: "orders",
					metadata: {
						...sharedMetadata,
						parts: [partEntry],
						partNumber: part.partNumber,
						description: part.description,
					},
				};
				return supabase.from("orders").insert([row]).select().single();
			}),
		);

		for (const result of results) {
			if (result.status === "fulfilled" && result.value.error) {
				logger.error(
					"[mobile-order] insert error:",
					result.value.error.message,
				);
				errors.push(result.value.error.message);
			} else if (result.status === "rejected") {
				const msg =
					result.reason instanceof Error
						? result.reason.message
						: String(result.reason);
				logger.error("[mobile-order] insert error:", msg);
				errors.push(msg);
			}
		}

		return { inserted: rowsToInsert.length - errors.length, errors };
	},
};
