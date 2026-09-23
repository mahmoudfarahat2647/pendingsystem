import type { Dictionary } from "./en";

/**
 * Arabic dictionary. Typed as {@link Dictionary} (the deep-string shape
 * of `en.ts`), so a missing or extra key fails `npm run type-check`.
 *
 * Conventions from the epic: Western digits 0–9, existing date/time
 * formats, stage names stay English, user data is never translated.
 */
export const ar: Dictionary = {
	common: {
		cancel: "إلغاء",
		confirm: "تأكيد",
		saveChanges: "حفظ التغييرات",
		saving: "جارٍ الحفظ…",
		add: "إضافة",
		addNew: "إضافة جديد",
		remove: "إزالة",
		move: "نقل",
		understood: "تم",
	},
	sidebar: {},
	notifications: {},
	settings: {
		language: {
			label: "اللغة",
			english: "الإنجليزية",
			arabic: "العربية",
			englishShort: "EN",
			arabicShort: "AR",
			switchToEnglish: "التبديل إلى الإنجليزية",
			switchToArabic: "التبديل إلى العربية",
		},
	},
	modals: {},
};
