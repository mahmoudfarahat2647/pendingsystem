import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeNullableCompanyName } from "@/lib/company";

function todayString(): string {
	const d = new Date();
	const dd = String(d.getDate()).padStart(2, "0");
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const yyyy = d.getFullYear();
	return `${dd}/${mm}/${yyyy}`;
}

async function mergeAppSettings(
	supabase: SupabaseClient,
	model: string,
	repairSystem: string,
): Promise<void> {
	const { data, error } = await supabase
		.from("app_settings")
		.select("models, repair_systems")
		.eq("id", 1)
		.single();

	if (error || !data) return;

	const currentModels: string[] = data.models ?? [];
	const currentRepairSystems: string[] = data.repair_systems ?? [];

	const patch: Record<string, unknown> = {
		updated_at: new Date().toISOString(),
	};
	let needsUpdate = false;

	if (model && !currentModels.includes(model)) {
		patch.models = [...currentModels, model];
		needsUpdate = true;
	}
	if (repairSystem && !currentRepairSystems.includes(repairSystem)) {
		patch.repair_systems = [...currentRepairSystems, repairSystem];
		needsUpdate = true;
	}

	if (needsUpdate) {
		await supabase.from("app_settings").update(patch).eq("id", 1);
	}
}

export interface MobileOrderInput {
	customerName: string;
	company: string | null | undefined;
	vin: string;
	mobile: string;
	sabNumber: string;
	model: string;
	repairSystem: string;
	parts: { partNumber: string; description: string }[];
}

export interface CreateOrdersResult {
	inserted: number;
	errors: string[];
}

export const mobileOrderService = {
	async createOrders(
		supabase: SupabaseClient,
		input: MobileOrderInput,
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

		await mergeAppSettings(supabase, model, repairSystem);
		const errors: string[] = [];

		for (const part of rowsToInsert) {
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

			const { error } = await supabase
				.from("orders")
				.insert([row])
				.select()
				.single();

			if (error) {
				console.error("[mobile-order] insert error:", error.message);
				errors.push(error.message);
			}
		}

		return { inserted: rowsToInsert.length - errors.length, errors };
	},
};
