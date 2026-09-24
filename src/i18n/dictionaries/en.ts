/**
 * English dictionary — source of truth for all UI translations.
 *
 * Later waves extend these namespaces with their own keys; Arabic
 * (`ar.ts`) is typed as {@link Dictionary} so a missing key fails
 * `pnpm run type-check`.
 *
 * Namespaces: `common`, `sidebar`, `notifications`, `settings`, `modals`.
 * Wave 1 starts with `common.*` and `settings.language.*`.
 */
export const en = {
	common: {
		cancel: "Cancel",
		confirm: "Confirm",
		saveChanges: "Save Changes",
		saving: "Saving…",
		add: "Add",
		addNew: "Add New",
		remove: "Remove",
		move: "Move",
		understood: "Understood",
	},
	sidebar: {
		mainNavigation: "Main navigation",
		goToDashboard: "Go to Dashboard",
		signOutMenu: "Sign out menu",
		userFallback: "User",
		systemCreator: "System Creator",
		signOut: "Sign out",
		unsavedTitle: "Unsaved Changes",
		unsavedDescriptionBeforeVin: "You have an active edit for VIN",
		unsavedDescriptionAfterVin:
			". Navigating to another tab will discard your changes.",
		discardAndContinue: "Discard & Continue",
	},
	notifications: {
		title: "Notifications",
		clearAll: "Clear All",
		empty: "No notifications yet",
		close: "Close notifications",
		snoozeTwoMonths: "Snooze for two months",
		remove: "Remove notification",
		reminderTitle: "Reminder Due",
		reminderDescription: "Due: {date} {time} - {customer}: {subject}",
		warrantyTitle: "Warranty Expiring",
		warrantyDescription: "Warranty expires in {days} days ({date})",
		bookingFollowUpTitle: "Booking Follow-up",
		bookingFollowUpDescription: "{customer} — VIN {vin}",
		cntrWarningHighTitle: "High Risk: CNTR RDG Warning",
		cntrWarningEarlyTitle: "Early Warning: CNTR RDG",
		cntrWarningDescription: "{customer} — {km} KM (VIN: {vin})",
		releaseFollowUpTitle: "Release Follow-up Due",
		releaseFollowUpDescription:
			"Warranty chassis VIN {vin} may now be past 5,000 km — re-confirm release before moving to Call List.",
	},
	settings: {
		modal: {
			title: "Settings",
			locked: "Locked",
			unlocked: "Unlocked",
			password: "Password",
			incorrectPassword: "Incorrect password",
			unlock: "Unlock",
			version: "Version",
			close: "Close",
		},
		tabs: {
			statuses: "Statuses",
			themeColor: "Theme Color",
			backupReports: "Backup & Reports",
			permission: "Permission",
		},
		sections: {
			statusTitle: "Status Management",
			statusDescription: "Customize status labels and colors used in the grid.",
			appearanceTitle: "System Appearance",
			appearanceDescription: "Manage theme colors and UI preferences.",
			backupTitle: "Backup & Reports Settings",
			backupDescription: "Configure automated reports and manage data backups.",
			permissionTitle: "Grid Edit Permission",
			permissionDescription:
				"Control whether grid cells can be edited directly on non-Orders stages.",
		},
		statuses: {
			addNewStatus: "Add New Status",
			managedStatuses: "Managed Statuses",
			editorsLocked: "Editors Locked",
			labelPlaceholder: "Enter status label (e.g., In Transit)",
			addStatus: "Add Status",
			statusColor: "Status Color",
			selectColor: "Select Color",
			save: "Save",
			usedCount: "{count} used",
			cannotDeleteOne: "Cannot delete: Currently used by {count} item",
			cannotDeleteMany: "Cannot delete: Currently used by {count} items",
		},
		theme: {
			title: "Appearance Settings",
			comingSoon: "Custom themes and color presets are coming soon.",
		},
		permission: {
			allowGridEditing: "Allow Grid Editing",
			allowGridEditingAria: "Allow grid editing",
			description:
				"When enabled, cells on Main Sheet, Call List, Booking, and Archive can be edited directly. Changes require clicking Save to persist. Orders stage is unaffected.",
			unlockHint: "Unlock settings to change this permission.",
		},
		reports: {
			schedulingTitle: "Scheduling",
			schedulingDescription:
				"Configure how often you want to receive automated backups.",
			automaticBackups: "Automatic Backups",
			automaticBackupsHint: "Enable scheduled reports sent to your email.",
			frequency: "Frequency",
			setFrequencyTo: "Set frequency to {frequency}",
			confirmFrequency: "Confirm frequency",
			openFrequencyPicker: "Open frequency picker",
			selectDay: "Select {day}",
			recipientsTitle: "Recipients",
			recipientsDescription:
				"Manage who receives the automated reports suitable for backup.",
			emailPlaceholder: "Email address",
			addEmailRecipient: "Add email recipient",
			addEmail: "Add Email",
			removeRecipient: "Remove {email}",
			noRecipients: "No recipients added yet.",
			manualActionTitle: "Manual Action",
			manualActionDescription:
				"Immediately generate and send a backup report to all recipients.",
			lastSent: "Last sent: {date}",
			noReportsSent: "No reports sent yet.",
			sending: "Sending...",
			sendBackupNow: "Send Backup Now",
		},
		language: {
			label: "Language",
			english: "English",
			arabic: "Arabic",
			englishShort: "EN",
			arabicShort: "AR",
			switchToEnglish: "Switch to English",
			switchToArabic: "Switch to Arabic",
		},
	},
	modals: {},
} as const;

export type Language = "en" | "ar";

/** Deep-string shape of {@link en}: every leaf is `string`. */
export type DeepStrings<T> = T extends string
	? string
	: T extends Record<string, unknown>
		? { [K in keyof T]: DeepStrings<T[K]> }
		: never;

/** Arabic dictionary must match this shape exactly. */
export type Dictionary = DeepStrings<typeof en>;

/** Dot-joined leaf paths of the dictionary, e.g. `"common.cancel"`. */
export type TranslationKey = LeafPaths<typeof en>;

/** Values substituted into `{placeholder}` tokens of a translation. */
export type TranslationParams = Record<string, string | number>;

type LeafPaths<T, Prefix extends string = ""> = {
	[K in keyof T & string]: T[K] extends string
		? `${Prefix}${K}`
		: T[K] extends Record<string, unknown>
			? LeafPaths<T[K], `${Prefix}${K}.`>
			: never;
}[keyof T & string];
