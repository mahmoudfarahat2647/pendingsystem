import { supabase } from "@/lib/supabase";

export interface AppSettings {
	models: string[];
	repairSystems: string[];
}

export const appSettingsService = {
	async fetchAppSettings(): Promise<AppSettings> {
		const { data, error } = await supabase
			.from("app_settings")
			.select("models, repair_systems")
			.eq("id", 1)
			.single();
		if (error) throw error;
		return {
			models: data.models as string[],
			repairSystems: data.repair_systems as string[],
		};
	},

	async updateAppSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
		const updatePayload: Record<string, unknown> = {
			updated_at: new Date().toISOString(),
		};
		if (patch.models !== undefined) updatePayload.models = patch.models;
		if (patch.repairSystems !== undefined)
			updatePayload.repair_systems = patch.repairSystems;

		const { data, error } = await supabase
			.from("app_settings")
			.update(updatePayload)
			.eq("id", 1)
			.select("models, repair_systems")
			.single();
		if (error) throw error;
		return {
			models: data.models as string[],
			repairSystems: data.repair_systems as string[],
		};
	},
};
