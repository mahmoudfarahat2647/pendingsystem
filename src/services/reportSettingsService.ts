import type { ApiResponse } from "@/lib/apiResponse";
import { supabase } from "@/lib/supabase";
import type { ReportSettings } from "@/store/types";

const DEFAULT_REPORT_SETTINGS = {
	emails: [],
	frequency: "Weekly",
	is_enabled: false,
} as const;

export const reportSettingsService = {
	async getReportSettings(): Promise<ReportSettings> {
		const { data, error } = await supabase
			.from("report_settings")
			.select("*")
			.order("updated_at", { ascending: false })
			.limit(1)
			.maybeSingle();

		if (error && error.code !== "PGRST116") {
			throw new Error(error.message);
		}

		if (data) {
			return data;
		}

		const { data: newData, error: createError } = await supabase
			.from("report_settings")
			.insert([DEFAULT_REPORT_SETTINGS])
			.select()
			.single();

		if (createError) {
			throw new Error(createError.message);
		}

		return newData;
	},

	async updateReportSettings(
		id: string,
		settings: Partial<ReportSettings>,
	): Promise<ReportSettings> {
		const { data, error } = await supabase
			.from("report_settings")
			.update(settings)
			.eq("id", id)
			.select()
			.single();

		if (error) {
			throw new Error(error.message);
		}

		return data;
	},

	async triggerManualBackup(): Promise<ApiResponse> {
		const response = await fetch("/api/trigger-backup", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			let errorMessage = "Backup failed";
			try {
				const errorData = (await response.json()) as ApiResponse;
				if (!errorData.success) {
					errorMessage = errorData.error.message;
				}
			} catch {
				errorMessage = `Server Error: ${response.status} ${response.statusText}`;
			}

			throw new Error(errorMessage);
		}

		return (await response.json()) as ApiResponse;
	},
};
