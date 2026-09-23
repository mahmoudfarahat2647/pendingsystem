import { afterEach, describe, expect, it } from "vitest";
import { ar } from "@/i18n/dictionaries/ar";
import { en } from "@/i18n/dictionaries/en";
import { translate } from "@/lib/i18n/translate";

const arRecords = ar as unknown as Record<string, Record<string, unknown>>;
const enRecords = en as unknown as Record<string, Record<string, unknown>>;

afterEach(() => {
	// Restore any runtime mutations made by fallback/interpolation tests.
	arRecords.common.cancel = "إلغاء";
	delete enRecords.common.greetingProbe;
});

describe("translate", () => {
	it("returns the English string for a known key", () => {
		expect(translate("en", "common.cancel")).toBe("Cancel");
	});

	it("returns the Arabic string when the language is ar", () => {
		expect(translate("ar", "common.cancel")).toBe("إلغاء");
	});

	it("interpolates {param} placeholders", () => {
		enRecords.common.greetingProbe = "Hello {name}, {count} orders";
		expect(
			translate("en", "common.greetingProbe", { name: "Sara", count: 3 }),
		).toBe("Hello Sara, 3 orders");
	});

	it("ignores params when the template has no placeholders", () => {
		expect(translate("en", "common.cancel", { date: "2026-01-01" })).toBe(
			"Cancel",
		);
	});

	it("falls back to English when the key is missing in Arabic", () => {
		arRecords.common.cancel = undefined as unknown as string;
		expect(translate("ar", "common.cancel")).toBe("Cancel");
	});

	it("returns the key itself when missing in every language", () => {
		expect(translate("ar", "does.not.exist")).toBe("does.not.exist");
		expect(translate("en", "does.not.exist")).toBe("does.not.exist");
	});

	it("leaves placeholders untouched when params are missing", () => {
		enRecords.common.greetingProbe = "Due {date}";
		expect(translate("en", "common.greetingProbe")).toBe("Due {date}");
		expect(translate("en", "common.greetingProbe", {})).toBe("Due {date}");
	});
});
