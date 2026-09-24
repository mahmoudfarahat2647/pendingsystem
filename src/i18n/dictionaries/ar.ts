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
		modal: {
			title: "الإعدادات",
			locked: "مقفل",
			unlocked: "مفتوح",
			password: "كلمة المرور",
			incorrectPassword: "كلمة مرور غير صحيحة",
			unlock: "فتح القفل",
			version: "الإصدار",
			close: "إغلاق",
		},
		tabs: {
			statuses: "الحالات",
			themeColor: "لون المظهر",
			backupReports: "النسخ الاحتياطي والتقارير",
			permission: "الصلاحيات",
		},
		sections: {
			statusTitle: "إدارة الحالات",
			statusDescription: "خصّص أسماء الحالات وألوانها المستخدمة في الجدول.",
			appearanceTitle: "مظهر النظام",
			appearanceDescription: "إدارة ألوان المظهر وتفضيلات الواجهة.",
			backupTitle: "إعدادات النسخ الاحتياطي والتقارير",
			backupDescription:
				"اضبط التقارير التلقائية وأدِر النسخ الاحتياطية للبيانات.",
			permissionTitle: "صلاحية تعديل الجدول",
			permissionDescription:
				"تحكّم في إمكانية تعديل خلايا الجدول مباشرةً في المراحل غير Orders.",
		},
		statuses: {
			addNewStatus: "إضافة حالة جديدة",
			managedStatuses: "الحالات المُدارة",
			editorsLocked: "التعديل مقفل",
			labelPlaceholder: "أدخل اسم الحالة، مثال: In Transit",
			addStatus: "إضافة حالة",
			statusColor: "لون الحالة",
			selectColor: "اختر اللون",
			save: "حفظ",
			usedCount: "{count} استخدام",
			cannotDeleteOne: "لا يمكن الحذف: مستخدمة حاليًا في {count} عنصر",
			cannotDeleteMany: "لا يمكن الحذف: مستخدمة حاليًا في {count} عناصر",
		},
		theme: {
			title: "إعدادات المظهر",
			comingSoon: "السمات المخصصة وإعدادات الألوان الجاهزة قادمة قريبًا.",
		},
		permission: {
			allowGridEditing: "السماح بتعديل الجدول",
			allowGridEditingAria: "السماح بتعديل الجدول",
			description:
				"عند التفعيل، يمكن تعديل الخلايا مباشرةً في Main Sheet وCall List وBooking وArchive. يجب الضغط على حفظ لتثبيت التغييرات. مرحلة Orders غير متأثرة.",
			unlockHint: "افتح قفل الإعدادات لتغيير هذه الصلاحية.",
		},
		reports: {
			schedulingTitle: "الجدولة",
			schedulingDescription: "اضبط عدد مرات استلام النسخ الاحتياطية التلقائية.",
			automaticBackups: "النسخ الاحتياطي التلقائي",
			automaticBackupsHint:
				"تفعيل التقارير المجدولة المرسلة إلى بريدك الإلكتروني.",
			frequency: "التكرار",
			setFrequencyTo: "تعيين التكرار إلى {frequency}",
			confirmFrequency: "تأكيد التكرار",
			openFrequencyPicker: "فتح اختيار التكرار",
			selectDay: "اختيار {day}",
			recipientsTitle: "المستلمون",
			recipientsDescription:
				"حدّد من يستلم التقارير التلقائية المخصصة للنسخ الاحتياطي.",
			emailPlaceholder: "البريد الإلكتروني",
			addEmailRecipient: "إضافة مستلم",
			addEmail: "إضافة بريد إلكتروني",
			removeRecipient: "إزالة {email}",
			noRecipients: "لم تتم إضافة مستلمين بعد.",
			manualActionTitle: "إجراء يدوي",
			manualActionDescription:
				"إنشاء تقرير نسخ احتياطي وإرساله فورًا إلى جميع المستلمين.",
			lastSent: "آخر إرسال: {date}",
			noReportsSent: "لم يتم إرسال أي تقارير بعد.",
			sending: "جارٍ الإرسال...",
			sendBackupNow: "إرسال النسخة الاحتياطية الآن",
		},
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
