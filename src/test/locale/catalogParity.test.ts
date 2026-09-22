import { describe, expect, it, vi } from "vitest";
import { translate } from "@/locales";
import { ar } from "@/locales/ar";
import { en } from "@/locales/en";

/**
 * Type alignment between catalogs is enforced at compile time: both `en.ts`
 * and `ar.ts` assign an object literal to `TranslationCatalog`, so a missing
 * or extra key fails `npm run type-check` before this test ever runs (see
 * src/locales/types.ts). This suite is the runtime companion: it proves the
 * two catalogs really do expose the same key *paths* (not just the same
 * top-level shape) and that lookups never silently render blank.
 */

function collectPaths(value: unknown, prefix = ""): string[] {
	if (typeof value === "string") {
		return [prefix];
	}
	if (value && typeof value === "object") {
		return Object.entries(value as Record<string, unknown>).flatMap(
			([key, child]) => collectPaths(child, prefix ? `${prefix}.${key}` : key),
		);
	}
	return [];
}

describe("translation catalog parity", () => {
	it("English and Arabic catalogs expose identical key paths", () => {
		const enPaths = collectPaths(en).sort();
		const arPaths = collectPaths(ar).sort();
		expect(arPaths).toEqual(enPaths);
	});

	it("every key resolves to a non-empty string in both locales", () => {
		for (const path of collectPaths(en)) {
			expect(typeof translate("en", path as never)).toBe("string");
			expect(translate("en", path as never).length).toBeGreaterThan(0);
			expect(typeof translate("ar", path as never)).toBe("string");
			expect(translate("ar", path as never).length).toBeGreaterThan(0);
		}
	});

	it("falls back to English for a key missing from a locale's catalog", async () => {
		// Inject an Arabic catalog with this key deliberately removed so the
		// lookup genuinely exercises the English-fallback branch, rather than
		// resolving a key that is actually present in both real catalogs.
		vi.resetModules();
		vi.doMock("@/locales/ar", () => {
			const partial = structuredClone(ar) as unknown as Record<string, unknown>;
			const language = (partial.settings as Record<string, unknown>)
				.language as Record<string, unknown>;
			delete language.sectionTitle;
			return { ar: partial };
		});

		const { translate: translateWithMissingArKey } = await import("@/locales");
		const result = translateWithMissingArKey(
			"ar",
			"settings.language.sectionTitle" as never,
		);
		expect(result).toBe(en.settings.language.sectionTitle);

		vi.doUnmock("@/locales/ar");
		vi.resetModules();
	});

	it("falls back to the key itself when missing from every catalog, without throwing", () => {
		expect(() => translate("en", "does.not.exist" as never)).not.toThrow();
		expect(translate("en", "does.not.exist" as never)).toBe("does.not.exist");
	});
});
