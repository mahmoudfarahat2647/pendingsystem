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
	validation: {
		customerNameRequired: "اسم العميل مطلوب",
		vinRequired: "رقم الهيكل (VIN) مطلوب",
		mobileRequired: "رقم الجوال مطلوب",
		invalidMileageFormat: "صيغة قراءة العداد غير صالحة",
		companyRequired: "الشركة مطلوبة",
		invalidCompany: "شركة غير صالحة. يُسمح فقط بـ Zeekr و Renault",
		warrantyMileageExceeded: "غير مؤهل للضمان: تجاوزت السيارة 100,000 كم",
		kmReadingRequired: "قراءة العداد (كم) مطلوبة",
		vehicleModelRequired: "طراز السيارة مطلوب",
		repairSystemRequired: "نظام الإصلاح مطلوب",
		sabNumberRequired: "رقم SAB مطلوب",
		requesterRequired: "الفرع/مقدم الطلب مطلوب",
		acceptedByRequired: "اسم المستلم مطلوب",
		generic: "يرجى مراجعة هذا الحقل.",
	},
	toast: {
		identityFieldsUpdated: "تم تحديث بيانات الهوية",
		beastModeMissingInfo: "معلومات ناقصة: يرجى إكمال الحقول المميزة.",
		duplicatePartNumbersRemove:
			"أرقام قطع مكررة في هذا الطلب. يرجى إزالة التكرار.",
		vinPartDuplicateReview:
			"مجموعة رقم الهيكل وقطعة الغيار هذه موجودة بالفعل. يرجى المراجعة.",
		descriptionConflictResolve:
			"يجب حل تعارضات الوصف. يرجى استخدام الوصف الحالي.",
		beastModePartRequired:
			"رقم القطعة والوصف مطلوبان. يرجى إكمال قسم المكونات.",
		duplicateCheckFailed:
			"تعذر التحقق من القطع المكررة. يرجى المحاولة مرة أخرى.",
		draftSaveSuccess: "تم حفظ المسودة بنجاح.",
		draftSaveFailed: "فشل حفظ المسودة. يرجى المحاولة مرة أخرى.",
		saveFailedPrefix: "فشل الحفظ:",
		skipThisChange: "تخطي هذا التغيير",
		saveOrderErrorPrefix: "خطأ في حفظ الطلب:",
		moveOrdersErrorPrefix: "فشل نقل الطلبات:",
		deleteOrdersErrorPrefix: "فشل حذف الطلبات:",
	},
	warnings: {
		duplicatePartInOrder: "رقم قطعة مكرر في هذا الطلب",
		orderAlreadyExists: "الطلب موجود بالفعل",
		orderAlreadyExistsDb: "الطلب موجود بالفعل (قاعدة البيانات)",
		inLocationConnector: "في",
		existingNameLabel: "الاسم الحالي:",
	},
};
