import { DEFAULT_LOCALE, type Locale } from "@/domain/locale/locale";
import { logger } from "@/lib/logger";
import { ar } from "./ar";
import { en } from "./en";
import type { TranslationCatalog, TranslationKey } from "./types";

export const CATALOGS: Record<Locale, TranslationCatalog> = { en, ar };

export type { TranslationCatalog, TranslationKey };

function getByPath(source: TranslationCatalog, path: string): unknown {
	return path.split(".").reduce<unknown>((acc, segment) => {
		if (acc && typeof acc === "object" && segment in acc) {
			return (acc as Record<string, unknown>)[segment];
		}
		return undefined;
	}, source);
}

/**
 * Resolves a translation key for the active locale, falling back to English
 * when the key is missing from that locale's catalog, and finally to the key
 * itself if even English is missing it. Never returns blank and never throws
 * — see #263 acceptance criteria on runtime fallback behavior.
 */
export function translate(locale: Locale, key: TranslationKey): string {
	const primary = getByPath(CATALOGS[locale], key);
	if (typeof primary === "string") return primary;

	const fallback = getByPath(CATALOGS[DEFAULT_LOCALE], key);
	if (typeof fallback === "string") {
		logger.warn("Missing translation key for locale, using English fallback", {
			locale,
			key,
		});
		return fallback;
	}

	logger.warn("Translation key missing from every catalog", { locale, key });
	return key;
}
