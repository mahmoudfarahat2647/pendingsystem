import { ar } from "@/i18n/dictionaries/ar";
import { en, type Language } from "@/i18n/dictionaries/en";

export type { Language, TranslationKey } from "@/i18n/dictionaries/en";

export type TranslationParams = Record<string, string | number>;

const dictionaries = { en, ar } as const;

const lookup = (root: unknown, key: string): string | undefined => {
	let current: unknown = root;
	for (const segment of key.split(".")) {
		if (typeof current !== "object" || current === null) return undefined;
		current = (current as Record<string, unknown>)[segment];
	}
	return typeof current === "string" ? current : undefined;
};

const interpolate = (template: string, params?: TranslationParams): string => {
	if (!params) return template;
	return template.replace(/\{(\w+)\}/g, (match, name: string) =>
		params[name] === undefined ? match : String(params[name]),
	);
};

/**
 * Pure dictionary lookup with `{param}` interpolation.
 *
 * Falls back to English when the key is missing in the requested language,
 * and returns the key itself when it is missing everywhere. No React, no
 * store access — safe to call from anywhere.
 */
export const translate = (
	lang: Language,
	key: string,
	params?: TranslationParams,
): string => {
	const template =
		lookup(dictionaries[lang], key) ?? lookup(dictionaries.en, key) ?? key;
	return interpolate(template, params);
};
