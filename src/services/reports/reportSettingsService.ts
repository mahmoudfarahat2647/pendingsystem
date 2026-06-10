import type { ApiResponse } from "@/lib/apiResponse";
import type { ReportSettings } from "@/types";

export const reportSettingsService = {
	async getReportSettings(): Promise<ReportSettings> {
		const response = await fetch("/api/report-settings");
		if (!response.ok) {
			const errorData = (await response.json().catch(() => ({}))) as {
				error?: string;
			};
			throw new Error(errorData.error ?? `Server error: ${response.status}`);
		}
		return (await response.json()) as ReportSettings;
	},

	async updateReportSettings(
		id: string,
		settings: Partial<ReportSettings>,
	): Promise<ReportSettings> {
		const response = await fetch("/api/report-settings", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id, ...settings }),
		});
		if (!response.ok) {
			const errorData = (await response.json().catch(() => ({}))) as {
				error?: string;
			};
			throw new Error(errorData.error ?? `Server error: ${response.status}`);
		}
		return (await response.json()) as ReportSettings;
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
