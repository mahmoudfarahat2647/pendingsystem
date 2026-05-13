import { supabase } from "@/lib/supabase";

export interface AppSettings {
	models: string[];
	repairSystems: string[];
	requesters: string[];
}

export const appSettingsService = {
	async fetchAppSettings(): Promise<AppSettings> {
		const { data, error } = await supabase
			.from("app_settings")
			.select("models, repair_systems, requesters")
			.eq("id", 1)
			.single();
		if (error) throw error;
		return {
			models: data.models as string[],
			repairSystems: data.repair_systems as string[],
			requesters: data.requesters as string[],
		};
	},

	async updateAppSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
		const updatePayload: Record<string, unknown> = {
			updated_at: new Date().toISOString(),
		};
		if (patch.models !== undefined) updatePayload.models = patch.models;
		if (patch.repairSystems !== undefined)
			updatePayload.repair_systems = patch.repairSystems;
		if (patch.requesters !== undefined)
			updatePayload.requesters = patch.requesters;

		const { data, error } = await supabase
			.from("app_settings")
			.update(updatePayload)
			.eq("id", 1)
			.select("models, repair_systems, requesters")
			.single();
		if (error) throw error;
		return {
			models: data.models as string[],
			repairSystems: data.repair_systems as string[],
			requesters: data.requesters as string[],
		};
	},
};
