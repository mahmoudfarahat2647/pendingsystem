import type { TranslationCatalog } from "./types";

export const en: TranslationCatalog = {
	common: {
		languageEnglish: "English",
		languageArabic: "العربية",
	},
	nav: {
		dashboard: "Dashboard",
		orders: "Orders",
		mainSheet: "Main Sheet",
		call: "Call",
		booking: "Booking",
		archive: "Archive",
		freeze: "Freeze",
		reports: "Reports",
	},
	shell: {
		searchPlaceholder: "Search system (Cmd+K)...",
	},
	settings: {
		title: "Settings",
		language: {
			navLabel: "Language",
			sectionTitle: "Language",
			sectionDescription:
				"Choose the interface language. This changes immediately and is remembered on this browser.",
			english: "English",
			arabic: "العربية",
		},
	},
	statuses: {
		partStatus: {
			noStats: "Pending",
			hold: "Hold",
			reserve: "Reserve",
			branch: "Branch",
			arrive: "Arrived",
		},
		bookingStatus: {
			confirmed: "Confirmed",
			pending: "Pending",
			cancelled: "Cancelled",
			completed: "Completed",
		},
	},
};
