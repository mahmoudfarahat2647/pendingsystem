import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reportSettingsService } from "@/services/reportSettingsService";
import type { ReportSettings } from "@/store/types";

export const REPORT_SETTINGS_QUERY_KEY = ["report-settings"] as const;

type ReportSettingsPatch = Partial<ReportSettings>;

export function useReportSettingsQuery() {
	return useQuery({
		queryKey: REPORT_SETTINGS_QUERY_KEY,
		queryFn: reportSettingsService.getReportSettings,
	});
}

export function useUpdateReportSettingsMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (settings: ReportSettingsPatch) => {
			const currentSettings = queryClient.getQueryData<ReportSettings>(
				REPORT_SETTINGS_QUERY_KEY,
			);

			if (!currentSettings) {
				throw new Error("Report settings not loaded");
			}

			return reportSettingsService.updateReportSettings(
				currentSettings.id,
				settings,
			);
		},
		onMutate: async (settings) => {
			await queryClient.cancelQueries({ queryKey: REPORT_SETTINGS_QUERY_KEY });

			const previousSettings = queryClient.getQueryData<ReportSettings>(
				REPORT_SETTINGS_QUERY_KEY,
			);

			if (previousSettings) {
				queryClient.setQueryData<ReportSettings>(REPORT_SETTINGS_QUERY_KEY, {
					...previousSettings,
					...settings,
				});
			}

			return { previousSettings };
		},
		onError: (_error, _variables, context) => {
			if (context?.previousSettings) {
				queryClient.setQueryData(
					REPORT_SETTINGS_QUERY_KEY,
					context.previousSettings,
				);
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData(REPORT_SETTINGS_QUERY_KEY, data);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: REPORT_SETTINGS_QUERY_KEY });
		},
	});
}

export function useAddEmailRecipientMutation() {
	const queryClient = useQueryClient();
	const updateMutation = useUpdateReportSettingsMutation();

	return useMutation({
		mutationFn: async (email: string) => {
			const currentSettings = queryClient.getQueryData<ReportSettings>(
				REPORT_SETTINGS_QUERY_KEY,
			);

			if (!currentSettings) {
				throw new Error("Report settings not loaded");
			}

			const nextEmails = [...(currentSettings.emails || []), email];
			return updateMutation.mutateAsync({ emails: nextEmails });
		},
	});
}

export function useRemoveEmailRecipientMutation() {
	const queryClient = useQueryClient();
	const updateMutation = useUpdateReportSettingsMutation();

	return useMutation({
		mutationFn: async (email: string) => {
			const currentSettings = queryClient.getQueryData<ReportSettings>(
				REPORT_SETTINGS_QUERY_KEY,
			);

			if (!currentSettings) {
				throw new Error("Report settings not loaded");
			}

			const nextEmails = currentSettings.emails.filter(
				(item) => item !== email,
			);
			return updateMutation.mutateAsync({ emails: nextEmails });
		},
	});
}

export function useTriggerManualBackupMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: reportSettingsService.triggerManualBackup,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: REPORT_SETTINGS_QUERY_KEY });
		},
	});
}
