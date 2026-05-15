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
		const response = await fetch("/api/app-settings", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(patch),
		});
		if (!response.ok) {
			const errorData = (await response.json().catch(() => ({}))) as {
				error?: string;
			};
			throw new Error(errorData.error ?? `Server error: ${response.status}`);
		}
		return (await response.json()) as AppSettings;
	},
};
