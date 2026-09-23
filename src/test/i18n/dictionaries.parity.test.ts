import { describe, expect, it } from "vitest";
import { ar } from "@/i18n/dictionaries/ar";
import { en } from "@/i18n/dictionaries/en";

const leafPaths = (root: unknown, prefix = ""): string[] => {
	if (typeof root === "string") return [prefix];
	if (typeof root !== "object" || root === null) return [prefix];
	return Object.entries(root as Record<string, unknown>).flatMap(
		([key, value]) =>
			leafPaths(value, prefix === "" ? key : `${prefix}.${key}`),
	);
};

/**
 * Runtime complement to the `ar: Dictionary` type-check: every English
 * leaf key must exist as a string in Arabic and vice versa, so neither
 * language silently drifts as later waves add keys.
 */
describe("dictionary key parity", () => {
	it("has identical leaf key sets in en and ar", () => {
		const enKeys = leafPaths(en).sort();
		const arKeys = leafPaths(ar).sort();
		expect(enKeys.length).toBeGreaterThan(0);
		expect(arKeys).toEqual(enKeys);
	});

	it("has non-empty strings for every leaf in both languages", () => {
		const assertNonEmpty = (root: unknown, path: string) => {
			if (typeof root === "string") {
				expect(root.trim().length, path).toBeGreaterThan(0);
				return;
			}
			for (const [key, value] of Object.entries(
				root as Record<string, unknown>,
			)) {
				assertNonEmpty(value, path === "" ? key : `${path}.${key}`);
			}
		};
		assertNonEmpty(en, "");
		assertNonEmpty(ar, "");
	});

	it("keeps language codes untranslated", () => {
		expect(en.settings.language.englishShort).toBe("EN");
		expect(en.settings.language.arabicShort).toBe("AR");
		expect(ar.settings.language.englishShort).toBe("EN");
		expect(ar.settings.language.arabicShort).toBe("AR");
	});
});
