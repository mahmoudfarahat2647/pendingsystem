import type { Dictionary } from "./en";

/**
 * Arabic dictionary. Typed as {@link Dictionary} (the deep-string shape
 * of `en.ts`), so a missing or extra key fails `pnpm run type-check`.
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
	sidebar: {
		mainNavigation: "التنقل الرئيسي",
		goToDashboard: "الانتقال إلى لوحة التحكم",
		signOutMenu: "قائمة تسجيل الخروج",
		userFallback: "مستخدم",
		systemCreator: "منشئ النظام",
		signOut: "تسجيل الخروج",
		unsavedTitle: "تغييرات غير محفوظة",
		unsavedDescriptionBeforeVin: "لديك تعديل نشط للشاسيه",
		unsavedDescriptionAfterVin: ". الانتقال إلى تبويب آخر سيتجاهل تغييراتك.",
		discardAndContinue: "تجاهل والمتابعة",
	},
	notifications: {
		title: "الإشعارات",
		clearAll: "مسح الكل",
		empty: "لا توجد إشعارات بعد",
		close: "إغلاق الإشعارات",
		snoozeTwoMonths: "تأجيل لمدة شهرين",
		remove: "إزالة الإشعار",
		reminderTitle: "تذكير مستحق",
		reminderDescription:
			"موعد الاستحقاق: {date} {time} - {customer}: {subject}",
		warrantyTitle: "الضمان على وشك الانتهاء",
		warrantyDescription: "ينتهي الضمان خلال {days} يوم ({date})",
		bookingFollowUpTitle: "متابعة الحجز",
		bookingFollowUpDescription: "{customer} — VIN {vin}",
		cntrWarningHighTitle: "خطورة عالية: تحذير قراءة العداد",
		cntrWarningEarlyTitle: "تنبيه مبكر: قراءة العداد",
		cntrWarningDescription: "{customer} — {km} KM (VIN: {vin})",
		releaseFollowUpTitle: "متابعة الإفراج مستحقة",
		releaseFollowUpDescription:
			"قد يكون الشاسيه {vin} (ضمان) قد تجاوز 5,000 كم — أعد تأكيد الإفراج قبل النقل إلى Call List.",
	},
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
