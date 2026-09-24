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
		close: "Close",
	},
	sidebar: {
		mainNavigation: "Main navigation",
		navDashboard: "Dashboard",
		navOrders: "Orders",
		navMainSheet: "Main Sheet",
		navCall: "Call",
		navBooking: "Booking",
		navArchive: "Archive",
		navFreeze: "Freeze",
		navReports: "Reports",
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
			permissionTitle: "Permissions",
			permissionDescription:
				"Control grid editing and stage-move permissions across the app.",
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
			allowMoveToMain: "Allow Move to Main Sheet",
			allowMoveToMainAria: "Allow move to Main Sheet",
			allowMoveToMainDescription:
				"When enabled, a Move to Main Sheet action appears on Call List, Booking, Archive, and Global Search for eligible selections.",
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
	modals: {
		shared: {
			quickTemplates: "QUICK TEMPLATES",
			newTemplatePlaceholder: "New template...",
		},
		confirm: {
			typeToConfirmBefore: "Type",
			typeToConfirmAfter: "to confirm",
			typeToConfirmTitle: "Type {word} to confirm",
		},
		stageConfirm: {
			delete: "Delete",
			permanentlyDelete: "Permanently Delete",
			searchDeleteTitle: "Confirm Delete",
			searchDeleteDescription:
				"Are you sure you want to delete {count} selected records? This action cannot be undone.",
			ordersDeleteTitle: "Delete Orders",
			ordersDeleteDescription:
				"Are you sure you want to delete {count} selected order(s)? This action cannot be undone.",
			commitTitle: "Commit to Main Sheet",
			commitDescription:
				"Have you verified the request date for all selected orders before committing?",
			commit: "Commit",
			noGoBack: "No, Go Back",
			bookingDeleteTitle: "Delete Bookings",
			bookingDeleteDescription:
				"Are you sure you want to delete {count} selected booking(s)?",
			recordsDeleteTitle: "Delete Records",
			recordsDeleteDescription:
				"Are you sure you want to delete {count} selected record(s)?",
			archiveDeleteTitle: "Delete Archived Records",
			archiveDeleteDescription:
				"Are you sure you want to permanently delete {count} selected record(s)?",
			moveToMainTitle: "Move to Main Sheet",
			moveToMainDescription:
				"Are you sure you want to move {count} line(s) to Main Sheet?",
			moveToMainYes: "Yes",
			moveToMainNo: "No",
		},
		moveToMain: {
			action: "Move to Main Sheet",
			notEligible:
				"Only available for lines from Call List, Booking, or Archive",
			permissionOff:
				"Move to Main Sheet is turned off in Settings. No lines were moved.",
			success: "{count} line(s) moved to Main Sheet",
			partial:
				"Moved {moved} of {total} line(s) to Main Sheet: {skipped} skipped (changed elsewhere), {failed} failed. Remaining lines stay selected.",
			noneMoved:
				"No lines were moved — they may have already been moved by another session.",
			failed: "Move to Main Sheet failed",
		},
		freeze: {
			title: "Freeze Record",
			reasonLabel: "Reason for Freezing",
			reasonPlaceholder: "Please enter a reason for freezing this record...",
			hint: "* Freezing will move this record to the freeze stage with its previous stage recorded.",
			confirm: "Confirm Freeze",
		},
		archive: {
			title: "Archive Record",
			reasonLabel: "Reason for Archiving",
			reasonPlaceholder: "Please enter a reason for archiving this record...",
			hint: "* Archiving will move this record to the archive history.",
			confirm: "Confirm Archive",
		},
		reorder: {
			title: "Reorder - Reason Required",
			reasonLabel: "Reason for Reorder",
			confirm: "Confirm Reorder",
			placeholderMainSheet: "e.g., Customer called back, error on main sheet",
			placeholderArchive: "e.g., Customer called back, error in archive",
			placeholderWrongPart: "e.g., Wrong part, Customer cancelled",
			helperBackToOrders:
				"This will send the selected items back to the Orders view.",
			srDescription:
				"Provide a reason why this order is being sent back for reordering.",
		},
		release: {
			title: "Release required",
			subtitle:
				"Warranty chassis under 5,000 km — confirm approval before moving to Call List.",
			vin: "VIN",
			mileage: "Mileage",
			mileageValue: "{mileage} km",
			repairSystem: "Repair system",
			warranty: "Warranty",
			enterWord: "Enter confirmation word",
			appliesOnce: "This approval applies to this move only.",
			confirm: "Release to Call List",
		},
		unfreeze: {
			moveOne: "Move 1 row",
			moveMany: "Move {count} rows",
			descriptionOne: "Choose the next stage for this frozen row.",
			descriptionMany: "Choose the next stage for these frozen rows.",
			destinationAria: "Destination stage",
			originSingle: "Came from {stage}",
			originMixed: "Mixed origin stages",
			originPartial: "Some origins not recorded",
			originNone: "Origin stage not recorded",
			detailsRemoved: "Freeze details will be removed. All other data is kept.",
		},
		duplicate: {
			title: "Duplicate Order Detected",
			descriptionBeforeVin: "An order with the same VIN",
			descriptionBeforePart: "and Part Number",
			descriptionAfter: "already exists.",
			locatedIn: "This order is currently located in:",
		},
		note: {
			title: "Notes",
			srDescription: "Add, edit, or remove notes for this row.",
			existingNotes: "EXISTING NOTES",
			editHistory: "Edit History",
			editHistoryTitle: "Edit existing notes?",
			editHistoryDescription:
				"History should normally be append-only. Are you sure you want to directly edit the past notes?",
			no: "No",
			yesUnlock: "Yes, Unlock",
			emptyPlaceholder: "No notes yet...",
			addNewNote: "ADD NEW NOTE",
			newNotePlaceholder: "Type a note for #{tag}...",
			autoTags: "Auto-tags with #{tag}",
			addNewTemplate: "ADD NEW",
			cancelTemplate: "CANCEL",
			templatesUnavailable:
				"Quick templates are unavailable because this record's stage could not be determined.",
			templatePlaceholder: "Template text...",
			addTemplate: "ADD",
			cancel: "CANCEL",
			save: "SAVE NOTES",
		},
		reminder: {
			clearReminder: "Clear Reminder",
			title: "Set Reminder",
			srDescription: "Set or update a reminder date and subject.",
			clearConfirmTitle: "Clear Reminder?",
			clearConfirmDescription:
				"This will permanently remove the reminder from this row.",
			no: "No",
			yesClear: "Yes, Clear",
			dateTime: "Date & Time",
			subject: "Subject",
			subjectPlaceholder: "What needs to be done?",
			save: "Save Reminder",
			pickDate: "Pick a date",
			am: "AM",
			pm: "PM",
		},
		attachment: {
			title: "Attachments",
			close: "Close",
			srDescription: "Attach up to 5 files (JPG, PNG, PDF) for this order.",
			externalLink: "External Link",
			linkPlaceholder: "Paste local path or URL…",
			removeLink: "Remove link",
			copyLink: "Copy link",
			uploading: 'Uploading "{name}"…',
			limitReached: "Limit reached",
			dropOrBrowse: "Drop files or click to browse",
			fileHint: "JPG, PNG, PDF · max 5 MB each",
			errorUnsupported: "Only JPG, PNG, and PDF files are supported.",
			errorTooLarge: "File size must be 5 MB or less.",
			openFile: "Open file",
			openName: "Open {name}",
			remove: "Remove",
			removeName: "Remove {name}",
		},
	},
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
