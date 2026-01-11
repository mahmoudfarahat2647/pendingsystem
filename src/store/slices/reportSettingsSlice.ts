import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type { ApiResponse } from "@/lib/apiResponse";
import type { CombinedStore } from "../types";

export interface ReportSettings {
    id: string;
    emails: string[];
    frequency: "Weekly" | "Monthly" | "Yearly";
    is_enabled: boolean;
    last_sent_at: string | null;
}

export interface ReportSettingsState {
    reportSettings: ReportSettings | null;
    isReportSettingsLoading: boolean;
    reportSettingsError: string | null;
}

export interface ReportSettingsActions {
    fetchReportSettings: () => Promise<void>;
    updateReportSettings: (settings: Partial<ReportSettings>) => Promise<void>;
    addEmailRecipient: (email: string) => Promise<void>;
    removeEmailRecipient: (email: string) => Promise<void>;
    triggerManualBackup: () => Promise<void>;
}

export type ReportSettingsSlice = ReportSettingsState & ReportSettingsActions;

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
            const { data, error } = await supabase
                .from("report_settings")
                .select("*")
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error && error.code !== "PGRST116") {
                throw error;
            }

            // If no settings exist, create default
            if (!data) {
                const { data: newData, error: createError } = await supabase
                    .from("report_settings")
                    .insert([
                        {
                            emails: [],
                            frequency: "Weekly",
                            is_enabled: false,
                        },
                    ])
                    .select()
                    .single();

                if (createError) throw createError;
                set({ reportSettings: newData });
            } else {
                set({ reportSettings: data });
            }
        } catch (error: any) {
            console.error("Failed to fetch report settings:", error);
            // Fallback to default in-memory settings so UI isn't disabled
            // This handles cases where migration hasn't run yet
            set({
                reportSettings: {
                    id: "temp-id",
                    emails: [],
                    frequency: "Weekly",
                    is_enabled: false,
                    last_sent_at: null,
                },
                reportSettingsError: error.message
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
            const { data, error } = await supabase
                .from("report_settings")
                .update(settings)
                .eq("id", currentSettings.id)
                .select()
                .single();

            if (error) throw error;
            set({ reportSettings: data });
        } catch (error: any) {
            set({ reportSettingsError: error.message });
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

        const newEmails = currentSettings.emails.filter((e) => e !== email);
        await get().updateReportSettings({ emails: newEmails });
    },

    triggerManualBackup: async () => {
        set({ isReportSettingsLoading: true, reportSettingsError: null });
        try {
            // Call our Next.js API route which has server-side credentials
            const response = await fetch("/api/trigger-backup", {
                method: "POST",
            });

            if (!response.ok) {
                const errorData = (await response.json()) as ApiResponse;
                const errorMessage = !errorData.success
                    ? errorData.error.message
                    : "Backup failed";
                throw new Error(errorMessage);
            }

            const data = (await response.json()) as ApiResponse;
            console.log("Backup triggered successfully:", data);

            // Refresh settings to update last_sent_at
            await get().fetchReportSettings();
        } catch (error: any) {
            console.error("Trigger backup error:", error);
            set({ reportSettingsError: error.message });
        } finally {
            set({ isReportSettingsLoading: false });
        }
    },
});
