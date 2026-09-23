/**
 * English dictionary — source of truth for all UI translations.
 *
 * Later waves extend these namespaces with their own keys; Arabic
 * (`ar.ts`) is typed as {@link Dictionary} so a missing key fails
 * `npm run type-check`.
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
	notifications: {},
	settings: {
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

type LeafPaths<T, Prefix extends string = ""> = {
	[K in keyof T & string]: T[K] extends string
		? `${Prefix}${K}`
		: T[K] extends Record<string, unknown>
			? LeafPaths<T[K], `${Prefix}${K}.`>
			: never;
}[keyof T & string];
