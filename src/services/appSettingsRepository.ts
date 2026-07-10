import { createServiceClient } from "@/lib/supabase-admin";
import { mapKeysToCamel } from "@/lib/utils";
import type { AppSettingsPatch } from "@/schemas/appSettings.schema";
import type { AppSettings } from "@/services/appSettingsService";

const PROTECTED_REPAIR_SYSTEMS = ["ضمان"];

/**
 * Merges a validated PATCH payload against the protected repair-systems
 * invariant and maps it onto the `app_settings` table's snake_case update
 * payload. Kept separate from the Supabase call so the merge/mapping logic
 * can be unit tested without a database.
 */
export function applyAppSettingsPatch(
	patch: AppSettingsPatch,
): Record<string, unknown> {
	let effectivePatch = patch;

	if (effectivePatch.repairSystems !== undefined) {
		const current = effectivePatch.repairSystems;
		const missing = PROTECTED_REPAIR_SYSTEMS.filter(
			(s) => !current.includes(s),
		);
		if (missing.length > 0) {
			effectivePatch = {
				...effectivePatch,
				repairSystems: [...current, ...missing],
			};
		}
	}

	const updatePayload: Record<string, unknown> = {
		updated_at: new Date().toISOString(),
	};
	if (effectivePatch.models !== undefined)
		updatePayload.models = effectivePatch.models;
	if (effectivePatch.repairSystems !== undefined)
		updatePayload.repair_systems = effectivePatch.repairSystems;
	if (effectivePatch.requesters !== undefined)
		updatePayload.requesters = effectivePatch.requesters;

	return updatePayload;
}

export async function updateAppSettings(
	patch: AppSettingsPatch,
): Promise<AppSettings> {
	const updatePayload = applyAppSettingsPatch(patch);

	const supabase = createServiceClient();
	const { data, error } = await supabase
		.from("app_settings")
		.update(updatePayload)
		.eq("id", 1)
		.select("models, repair_systems, requesters")
		.single();

	if (error) throw new Error(error.message);

	return mapKeysToCamel<AppSettings>(data as Record<string, unknown>);
}
