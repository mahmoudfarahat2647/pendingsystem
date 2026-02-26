import type { StateCreator } from "zustand";
import { reportSettingsService } from "@/services/reportSettingsService";
import type {
	CombinedStore,
	ReportSettingsActions,
	ReportSettingsState,
} from "../types";

type ReportSettingsSlice = ReportSettingsState & ReportSettingsActions;

export const createReportSettingsSlice: StateCreator<
	CombinedStore,
	[["zustand/persist", unknown]],
	[],
	ReportSettingsSlice
> = (set, get) => ({
	reportSettings: null,
	isReportSettingsLoading: false,
	reportSettingsError: null,

	fetchReportSettings: async () => {
		set({ isReportSettingsLoading: true, reportSettingsError: null });
		try {
			const reportSettings = await reportSettingsService.getReportSettings();
			set({ reportSettings });
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Unknown error";
			console.error("Failed to fetch report settings:", error);
			set({
				reportSettings: {
					id: "temp-id",
					emails: [],
					frequency: "Weekly",
					is_enabled: false,
					last_sent_at: null,
				},
				reportSettingsError: message,
			});
		} finally {
			set({ isReportSettingsLoading: false });
		}
	},

	updateReportSettings: async (settings) => {
		const currentSettings = get().reportSettings;
		if (!currentSettings) return;

		set({ isReportSettingsLoading: true, reportSettingsError: null });
		try {
			const reportSettings = await reportSettingsService.updateReportSettings(
				currentSettings.id,
				settings,
			);
			set({ reportSettings });
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Unknown error";
			set({ reportSettingsError: message });
		} finally {
			set({ isReportSettingsLoading: false });
		}
	},

	addEmailRecipient: async (email) => {
		const currentSettings = get().reportSettings;
		if (!currentSettings) return;

		const newEmails = [...(currentSettings.emails || []), email];
		await get().updateReportSettings({ emails: newEmails });
	},

	removeEmailRecipient: async (email) => {
		const currentSettings = get().reportSettings;
		if (!currentSettings) return;

		const newEmails = currentSettings.emails.filter((item) => item !== email);
		await get().updateReportSettings({ emails: newEmails });
	},

	triggerManualBackup: async () => {
		set({ isReportSettingsLoading: true, reportSettingsError: null });
		try {
			await reportSettingsService.triggerManualBackup();
			await get().fetchReportSettings();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Unknown error";
			console.error("Trigger backup error:", error);
			set({ reportSettingsError: message });
		} finally {
			set({ isReportSettingsLoading: false });
		}
	},
});
