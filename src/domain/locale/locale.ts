/**
 * Pure locale domain primitives. No React, no storage, no environment access —
 * see CLAUDE.md "Architecture Standards": domain/ depends only on types/.
 */

export const SUPPORTED_LOCALES = ["en", "ar"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export type TextDirection = "ltr" | "rtl";

const RTL_LOCALES: ReadonlySet<Locale> = new Set(["ar"]);

/** Runtime type guard: is `value` one of the supported locale codes. */
export function isLocale(value: unknown): value is Locale {
	return (
		typeof value === "string" &&
		(SUPPORTED_LOCALES as readonly string[]).includes(value)
	);
}

/**
 * Normalizes an arbitrary (possibly malformed, legacy, or missing) value into
 * a supported locale, falling back to English. Used on every store hydration
 * — not only on version migration — so a corrupt/legacy persisted value never
 * produces an unsupported runtime locale.
 */
export function normalizeLocale(value: unknown): Locale {
	return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Text direction for a given locale. Arabic is the only RTL locale supported. */
export function getDirection(locale: Locale): TextDirection {
	return RTL_LOCALES.has(locale) ? "rtl" : "ltr";
}
