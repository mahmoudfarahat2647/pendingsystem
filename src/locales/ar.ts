import type { TranslationCatalog } from "./types";

export const ar: TranslationCatalog = {
	common: {
		languageEnglish: "English",
		languageArabic: "العربية",
	},
	nav: {
		dashboard: "لوحة التحكم",
		orders: "الطلبات",
		mainSheet: "الكشف الرئيسي",
		call: "الاتصال",
		booking: "الحجز",
		archive: "الأرشيف",
		freeze: "التجميد",
		reports: "التقارير",
	},
	shell: {
		searchPlaceholder: "بحث في النظام (Cmd+K)...",
	},
	settings: {
		title: "الإعدادات",
		language: {
			navLabel: "اللغة",
			sectionTitle: "اللغة",
			sectionDescription:
				"اختر لغة الواجهة. يتم تطبيق التغيير فورًا ويُحفظ الاختيار على هذا المتصفح.",
			english: "English",
			arabic: "العربية",
		},
	},
};
