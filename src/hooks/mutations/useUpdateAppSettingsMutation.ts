import { useMutation, useQueryClient } from "@tanstack/react-query";
import { APP_SETTINGS_QUERY_KEY } from "@/hooks/queries/useAppSettingsQuery";
import {
	type AppSettings,
	appSettingsService,
} from "@/services/appSettingsService";
import { PROTECTED_REPAIR_SYSTEMS } from "@/store/slices/uiSlice";

export function useUpdateAppSettingsMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (patch: Partial<AppSettings>) => {
			// Guard: never allow protected repair systems to be removed
			if (patch.repairSystems !== undefined) {
				const currentRepairSystems = patch.repairSystems;
				const missing = PROTECTED_REPAIR_SYSTEMS.filter(
					(s) => !currentRepairSystems.includes(s),
				);
				if (missing.length > 0) {
					patch = {
						...patch,
						repairSystems: [...currentRepairSystems, ...missing],
					};
				}
			}
			return appSettingsService.updateAppSettings(patch);
		},
		onMutate: async (patch) => {
			await queryClient.cancelQueries({ queryKey: APP_SETTINGS_QUERY_KEY });
			const previous = queryClient.getQueryData<AppSettings>(
				APP_SETTINGS_QUERY_KEY,
			);
			if (previous) {
				queryClient.setQueryData<AppSettings>(APP_SETTINGS_QUERY_KEY, {
					...previous,
					...patch,
				});
			}
			return { previous };
		},
		onError: (_error, _variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(APP_SETTINGS_QUERY_KEY, context.previous);
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData(APP_SETTINGS_QUERY_KEY, data);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: APP_SETTINGS_QUERY_KEY });
		},
	});
}
