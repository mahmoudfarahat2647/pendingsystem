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
			sabNumber,
			model,
			repairSystem,
			rDate,
			sourceType: "mobile",
		};

		// If no valid parts, insert one blank row so the intake appears on desktop.
		const rowsToInsert =
			parts.length === 0 ? [{ partNumber: "", description: "" }] : parts;

		const rows = rowsToInsert.map((part) => {
			const partId = crypto.randomUUID();
			const partEntry = {
				id: partId,
				partNumber: part.partNumber,
				description: part.description,
			};
			return {
				...sharedIdentity,
				stage: "orders",
				metadata: {
					...sharedMetadata,
					parts: [partEntry],
					partNumber: part.partNumber,
					description: part.description,
				},
			};
		});

		const errors: string[] = [];

		try {
			const { data, error } = await supabase.rpc("insert_orders_bulk", {
				p_rows: rows,
			});

			if (error) {
				logger.error("[mobile-order] bulk insert error:", error.message);
				return { inserted: 0, errors: rows.map(() => error.message) };
			}

			const results = (data ?? []) as Array<{
				idx: number;
				success: boolean;
				error_message: string | null;
			}>;

			let inserted = 0;
			for (const result of results) {
				if (result.success) {
					inserted++;
				} else {
					const msg = result.error_message ?? "Unknown insert error";
					logger.error("[mobile-order] insert error:", msg);
					errors.push(msg);
				}
			}

			// A missing/short/malformed result set (fewer rows than submitted, with
			// no top-level error) must not be reported as full success.
			const missing = rows.length - results.length;
			if (missing > 0) {
				const msg = "No result returned for row";
				logger.error("[mobile-order] insert error:", msg);
				for (let i = 0; i < missing; i++) errors.push(msg);
			}

			return { inserted, errors };
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			logger.error("[mobile-order] insert error:", msg);
			return { inserted: 0, errors: rows.map(() => msg) };
		}
	},
};
