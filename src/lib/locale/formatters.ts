/**
 * Shared, explicitly configured English/Arabic display formatters.
 *
 * Scope (#266, building on the `#263` locale foundation in
 * `src/domain/locale/locale.ts` and `src/locales/`): these are DISPLAY-ONLY
 * formatters for dates, times and ordinary quantities. Nothing here is meant
 * to feed a form field, a sort/filter input, a clipboard value, an export, or
 * a schema — those stay canonical (English digits, machine-parseable ISO
 * strings) regardless of the active UI locale. Callers decide what is safe to
 * format; this module only turns an already-canonical Date/number into
 * locale-appropriate display text.
 *
 * Dependency direction: this file lives in `lib/`, which may depend on
 * `domain/`, `schemas/`, `types/` and other `lib/` utilities, but never on
 * React, `services/`, or `store/` (see CLAUDE.md "Architecture Standards").
 * `parseDateLocal` is reused from `src/utils/safeFormatDate.ts` — an existing
 * `lib/` → `utils/` import already used by `src/lib/orderStageTransitions.ts`.
 *
 * ---------------------------------------------------------------------------
 * Arabic numbering convention (documented per #266 acceptance criteria)
 * ---------------------------------------------------------------------------
 * We render Arabic-locale dates, times and quantities with WESTERN (Latin,
 * "0-9") digits, not Eastern Arabic-Indic numerals (٠-٩), by explicitly
 * forcing `numberingSystem: "latn"` on every `Intl.DateTimeFormat` /
 * `Intl.NumberFormat` call for both locales.
 *
 * Why: VINs, part numbers, mileage readings, tracking IDs and every other
 * operator-facing identifier in this product are, and remain, plain Western
 * digits — that is canonical data this ticket explicitly must not touch (see
 * module doc above). If Arabic-mode dates/quantities rendered with
 * Eastern Arabic-Indic digits while every identifier next to them kept
 * Western digits, the UI would show two different digit systems side by
 * side, which is confusing for warehouse/desk operators scanning a grid full
 * of VINs and quantities. Keeping one digit system everywhere, and only
 * localizing the surrounding words/labels/calendar text, matches how this
 * product's professional/back-office Arabic users already expect numerals to
 * read. This choice is deliberate and covered by deterministic tests in
 * `src/test/locale/formatters.test.ts`.
 *
 * ---------------------------------------------------------------------------
 * Gregorian calendar
 * ---------------------------------------------------------------------------
 * Some `ar` locale tags/environments default `Intl.DateTimeFormat` to a
 * non-Gregorian calendar (e.g. Islamic). This product's calendar, booking
 * dates and reminder due dates are always Gregorian and that must never
 * change with the display language (per #266's acceptance criteria), so
 * every date/time formatter below forces `calendar: "gregory"` explicitly.
 */

import type { Locale } from "@/domain/locale/locale";
import { parseDateLocal } from "@/utils/safeFormatDate";

/**
 * Canonical BCP-47 tag used per supported locale. Chosen explicitly rather
 * than left to `Intl`'s locale negotiation, so formatting is deterministic
 * across environments/CI/production.
 */
export const LOCALE_TAGS: Record<Locale, string> = {
	en: "en-US",
	ar: "ar-EG",
};

/** Forced on every DateTimeFormat/NumberFormat call — see module doc above. */
const GREGORIAN_LATIN_DIGITS = {
	calendar: "gregory" as const,
	numberingSystem: "latn" as const,
};

function intlTag(locale: Locale): string {
	return LOCALE_TAGS[locale];
}

/**
 * Normalizes a date-only ("yyyy-MM-dd"), full ISO, or `Date` input into a
 * `Date` that represents that same calendar day at local midnight — never a
 * UTC instant that can roll over to the previous/next day depending on the
 * viewer's timezone offset. Reuses the same parsing rule already trusted
 * elsewhere in the codebase (`src/utils/safeFormatDate.ts`).
 */
function toDisplayDate(input: Date | string | number): Date {
	if (input instanceof Date) return input;
	if (typeof input === "number") return new Date(input);
	return parseDateLocal(input);
}

function isValidDate(date: Date): boolean {
	return !Number.isNaN(date.getTime());
}

/**
 * Formats a date for display. Date-only inputs ("yyyy-MM-dd") always render
 * as that same calendar day, in both locales, regardless of viewer timezone
 * — see `toDisplayDate`. Defaults to a long, unambiguous "Month d, yyyy"
 * style; pass `options` for a different shape (e.g. weekday, short month).
 */
export function formatDate(
	input: Date | string | number | null | undefined,
	locale: Locale,
	options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "long",
		day: "numeric",
	},
	fallback = "—",
): string {
	if (input === null || input === undefined || input === "") return fallback;
	const date = toDisplayDate(input);
	if (!isValidDate(date)) return fallback;
	return new Intl.DateTimeFormat(intlTag(locale), {
		...options,
		...GREGORIAN_LATIN_DIGITS,
	}).format(date);
}

/** Formats just the time portion of a Date/ISO instant for display. */
export function formatTime(
	input: Date | string | number | null | undefined,
	locale: Locale,
	options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" },
	fallback = "—",
): string {
	if (input === null || input === undefined || input === "") return fallback;
	const date = toDisplayDate(input);
	if (!isValidDate(date)) return fallback;
	return new Intl.DateTimeFormat(intlTag(locale), {
		...options,
		...GREGORIAN_LATIN_DIGITS,
	}).format(date);
}

/** Formats a full date + time (e.g. a timestamped notification/log entry). */
export function formatDateTime(
	input: Date | string | number | null | undefined,
	locale: Locale,
	options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	},
	fallback = "—",
): string {
	return formatDate(input, locale, options, fallback);
}

/** Locale-aware month name only (e.g. "September" / "سبتمبر"), Gregorian. */
export function formatMonthName(
	input: Date | string | number,
	locale: Locale,
	options: Intl.DateTimeFormatOptions = { month: "long" },
): string {
	return formatDate(input, locale, options, "");
}

/**
 * Formats an ordinary number (counts, mileage, totals) for display. Always
 * Western digits (see module doc). Never use this on identifiers, codes or
 * version numbers — those must keep their exact canonical characters and
 * ordering regardless of locale, and are never routed through this module.
 */
export function formatNumber(
	value: number | null | undefined,
	locale: Locale,
	options?: Intl.NumberFormatOptions,
	fallback = "—",
): string {
	if (value === null || value === undefined || Number.isNaN(value)) {
		return fallback;
	}
	return new Intl.NumberFormat(intlTag(locale), {
		...options,
		numberingSystem: GREGORIAN_LATIN_DIGITS.numberingSystem,
	}).format(value);
}

// ---------------------------------------------------------------------------
// Pluralized quantity phrases
// ---------------------------------------------------------------------------

/** CLDR plural categories, as returned by `Intl.PluralRules#select`. */
type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";

/**
 * A discrete, fully-formed phrase per plural category — never a
 * singular/plural suffix glued onto a shared stem. `{n}` is substituted with
 * the locale-formatted count. Every set must supply `other`; the remaining
 * categories are only meaningful for Arabic (English only distinguishes
 * "one" vs "other").
 */
type QuantityForms = Partial<Record<PluralCategory, string>> & {
	other: string;
};

const QUANTITY_UNITS = {
	/** Order/work lines, e.g. dashboard "Total Lines" tiles. */
	line: {
		en: { one: "{n} Line", other: "{n} Lines" },
		ar: {
			zero: "لا توجد أسطر",
			one: "سطر واحد",
			two: "سطران",
			few: "{n} أسطر",
			many: "{n} سطرًا",
			other: "{n} سطر",
		},
	},
	/** Days a chassis has been parked in FREEZE, or similar day counts. */
	day: {
		en: { one: "{n} Day", other: "{n} Days" },
		ar: {
			zero: "0 يوم",
			one: "يوم واحد",
			two: "يومان",
			few: "{n} أيام",
			many: "{n} يومًا",
			other: "{n} يوم",
		},
	},
	/** Kilometers on the odometer (`cntrRdg`). */
	km: {
		en: { one: "{n} KM", other: "{n} KM" },
		ar: {
			zero: "0 كم",
			one: "كم واحد",
			two: "كم اثنان",
			few: "{n} كم",
			many: "{n} كم",
			other: "{n} كم",
		},
	},
} satisfies Record<string, Record<Locale, QuantityForms>>;

export type QuantityUnit = keyof typeof QUANTITY_UNITS;

/**
 * Formats a count as a correctly pluralized phrase for the active locale,
 * using real CLDR plural categories (`Intl.PluralRules`) rather than
 * string-concatenating an English-style singular/plural suffix onto a
 * translated word — see #266 acceptance criteria.
 */
export function formatQuantity(
	count: number,
	unit: QuantityUnit,
	locale: Locale,
): string {
	const category = new Intl.PluralRules(intlTag(locale)).select(count);
	const forms: QuantityForms = QUANTITY_UNITS[unit][locale];
	const template = forms[category] ?? forms.other;
	return template.replace("{n}", formatNumber(count, locale));
}
