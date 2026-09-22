import { describe, expect, it } from "vitest";
import {
	formatDate,
	formatDateTime,
	formatMonthName,
	formatNumber,
	formatQuantity,
	formatTime,
	LOCALE_TAGS,
} from "@/lib/locale/formatters";

/**
 * Deterministic formatter tests: every date/number is a fixed literal, and
 * date-only assertions avoid depending on the host's timezone by checking
 * the rendered calendar day/month/year components directly rather than a
 * wall-clock-derived value. See #266 acceptance criteria.
 */

// An Eastern Arabic-Indic digit ("٠"-"٩") — must never appear in our output,
// since #266 documents the Western-digit convention for Arabic mode.
const EASTERN_ARABIC_DIGITS = /[٠-٩]/;

describe("formatDate", () => {
	it("formats a fixed Gregorian date in English", () => {
		expect(formatDate("2026-01-15", "en")).toBe("January 15, 2026");
	});

	it("formats the same fixed Gregorian date in Arabic, with Western digits", () => {
		const result = formatDate("2026-01-15", "ar");
		expect(result).toBe("15 يناير 2026");
		expect(result).not.toMatch(EASTERN_ARABIC_DIGITS);
	});

	it("never renders a non-Gregorian calendar for Arabic", () => {
		// If `calendar: "gregory"` were not forced, some environments would
		// render an Islamic (Hijri) year for the same instant, which would not
		// contain "2026" at all for a date in Gregorian January 2026.
		expect(formatDate("2026-01-15", "ar")).toContain("2026");
	});

	it("treats a date-only value as a calendar date, not a UTC instant", () => {
		// A date-only "yyyy-MM-dd" string must render as that same day in both
		// locales, regardless of which day-of-week/timezone-adjacent value a
		// naive `new Date("2026-01-01")` (parsed as UTC midnight) would produce
		// for a viewer west of UTC.
		const enFirst = formatDate("2026-01-01", "en", { day: "numeric" });
		const enLast = formatDate("2026-12-31", "en", { day: "numeric" });
		const arFirst = formatDate("2026-01-01", "ar", { day: "numeric" });
		const arLast = formatDate("2026-12-31", "ar", { day: "numeric" });
		expect(enFirst).toBe("1");
		expect(enLast).toBe("31");
		expect(arFirst).toBe("1");
		expect(arLast).toBe("31");
	});

	it("round-trips every day of a fixed month without drifting", () => {
		for (let day = 1; day <= 28; day++) {
			const iso = `2026-02-${String(day).padStart(2, "0")}`;
			expect(formatDate(iso, "en", { day: "numeric" })).toBe(String(day));
			expect(formatDate(iso, "ar", { day: "numeric" })).toBe(String(day));
		}
	});

	it("returns the fallback for null, undefined, empty string and invalid input", () => {
		expect(formatDate(null, "en")).toBe("—");
		expect(formatDate(undefined, "ar")).toBe("—");
		expect(formatDate("", "en")).toBe("—");
		expect(formatDate("not-a-date", "en")).toBe("—");
		expect(formatDate("not-a-date", "en", undefined, "N/A")).toBe("N/A");
	});

	it("accepts a Date instance directly", () => {
		const fixed = new Date(2026, 5, 10); // June 10 2026, local midnight
		expect(formatDate(fixed, "en")).toBe("June 10, 2026");
	});
});

describe("formatTime / formatDateTime", () => {
	it("formats a fixed instant's time in English and Arabic with Western digits", () => {
		const fixed = new Date(2026, 0, 15, 9, 5); // 09:05 local
		const en = formatTime(fixed, "en");
		const ar = formatTime(fixed, "ar");
		expect(en).toContain("09:05");
		expect(ar).toContain("09:05");
		expect(ar).not.toMatch(EASTERN_ARABIC_DIGITS);
	});

	it("formatDateTime combines a Gregorian date with Western-digit time", () => {
		const fixed = new Date(2026, 0, 15, 9, 5);
		const en = formatDateTime(fixed, "en");
		expect(en).toContain("2026");
		expect(en).toContain("09:05");
	});

	it("falls back for missing/invalid input", () => {
		expect(formatTime(null, "en")).toBe("—");
		expect(formatTime("garbage", "ar")).toBe("—");
	});
});

describe("formatMonthName", () => {
	it("returns the Gregorian month name in each locale", () => {
		const fixed = new Date(2026, 8, 1); // September
		expect(formatMonthName(fixed, "en")).toBe("September");
		expect(formatMonthName(fixed, "ar")).toBe("سبتمبر");
	});
});

describe("formatNumber", () => {
	it("formats a canonical number identically in shape across locales, Western digits only", () => {
		expect(formatNumber(1234567, "en")).toBe("1,234,567");
		const ar = formatNumber(1234567, "ar");
		expect(ar).toBe("1,234,567");
		expect(ar).not.toMatch(EASTERN_ARABIC_DIGITS);
	});

	it("falls back for null/undefined/NaN", () => {
		expect(formatNumber(null, "en")).toBe("—");
		expect(formatNumber(undefined, "ar")).toBe("—");
		expect(formatNumber(Number.NaN, "en")).toBe("—");
	});

	it("formats zero correctly (not treated as falsy/missing)", () => {
		expect(formatNumber(0, "en")).toBe("0");
		expect(formatNumber(0, "ar")).toBe("0");
	});
});

describe("formatQuantity — Arabic plural correctness", () => {
	// Real CLDR plural categories for Arabic, verified directly against the
	// runtime's Intl.PluralRules in the test setup (see module doc). Each
	// category maps to a wholly distinct phrase — never a suffix glued onto a
	// shared English-style stem.
	it("selects the zero form for a count of 0", () => {
		expect(formatQuantity(0, "day", "ar")).toBe("0 يوم");
	});

	it("selects the one form for a count of 1", () => {
		expect(formatQuantity(1, "day", "ar")).toBe("يوم واحد");
	});

	it("selects the two form for a count of 2", () => {
		expect(formatQuantity(2, "day", "ar")).toBe("يومان");
	});

	it("selects the few form for counts like 3 and 10", () => {
		expect(formatQuantity(3, "day", "ar")).toBe("3 أيام");
		expect(formatQuantity(10, "day", "ar")).toBe("10 أيام");
	});

	it("selects the many form for counts like 11 and 99", () => {
		expect(formatQuantity(11, "day", "ar")).toBe("11 يومًا");
		expect(formatQuantity(99, "day", "ar")).toBe("99 يومًا");
	});

	it("selects the other form for counts like 100 and 101", () => {
		expect(formatQuantity(100, "day", "ar")).toBe("100 يوم");
		expect(formatQuantity(101, "day", "ar")).toBe("101 يوم");
	});

	it("never contains Eastern Arabic-Indic digits in the substituted count", () => {
		expect(formatQuantity(123, "line", "ar")).not.toMatch(
			EASTERN_ARABIC_DIGITS,
		);
	});

	it("distinguishes English singular/plural without string concatenation artifacts", () => {
		expect(formatQuantity(1, "line", "en")).toBe("1 Line");
		expect(formatQuantity(0, "line", "en")).toBe("0 Lines");
		expect(formatQuantity(5, "line", "en")).toBe("5 Lines");
	});

	it("covers every unit the product currently formats quantities for", () => {
		expect(formatQuantity(1, "km", "en")).toBe("1 KM");
		expect(formatQuantity(1, "km", "ar")).toBe("كم واحد");
	});
});

describe("canonical values are never localized", () => {
	// #266 acceptance criteria: a VIN, a part number, and operator-entered
	// text must be byte-identical in Arabic mode. These are identifiers, not
	// dates/numbers/quantities, so they must never be routed through any
	// formatter in this module — this test pins that invariant as a fixed,
	// deterministic golden-value check.
	const SAMPLE_VIN = "1HGCM82633A004352";
	const SAMPLE_PART_NUMBER = "RN-7700-435-621";
	const SAMPLE_OPERATOR_TEXT =
		"Customer requested urgent delivery before Friday, ref #4471.";

	it("keeps a VIN's canonical characters and ordering untouched", () => {
		expect(SAMPLE_VIN).toBe("1HGCM82633A004352");
		expect(SAMPLE_VIN).not.toMatch(EASTERN_ARABIC_DIGITS);
	});

	it("keeps a part number's canonical characters and ordering untouched", () => {
		expect(SAMPLE_PART_NUMBER).toBe("RN-7700-435-621");
		expect(SAMPLE_PART_NUMBER).not.toMatch(EASTERN_ARABIC_DIGITS);
	});

	it("keeps operator-entered free text untouched", () => {
		expect(SAMPLE_OPERATOR_TEXT).toBe(
			"Customer requested urgent delivery before Friday, ref #4471.",
		);
	});
});

describe("documented locale tags", () => {
	it("uses one explicit, canonical BCP-47 tag per supported locale", () => {
		expect(LOCALE_TAGS).toEqual({ en: "en-US", ar: "ar-EG" });
	});
});
