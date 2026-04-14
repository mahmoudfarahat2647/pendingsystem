import { useQuery } from "@tanstack/react-query";
import {
	type AppSettings,
	appSettingsService,
} from "@/services/appSettingsService";

export const APP_SETTINGS_QUERY_KEY = ["app_settings"] as const;

const DEFAULT_APP_SETTINGS: AppSettings = {
	models: [
		"Megane IV",
		"Clio V",
		"Kadjar",
		"Captur II",
		"Duster II",
		"Talisman",
	],
	repairSystems: ["Mechanical", "Electrical", "Body", "ضمان"],
};

export function useAppSettingsQuery() {
	return useQuery({
		queryKey: APP_SETTINGS_QUERY_KEY,
		queryFn: appSettingsService.fetchAppSettings,
		placeholderData: DEFAULT_APP_SETTINGS,
		staleTime: Infinity,
	});
}
