"use client";

import { useCallback } from "react";
import type { Language, TranslationKey } from "@/i18n/dictionaries/en";
import { type TranslationParams, translate } from "@/lib/i18n/translate";
import { useAppStore } from "@/store/useStore";

export type { Language, TranslationKey, TranslationParams };

/**
 * Translation hook. Reads the persisted `language` field and returns a
 * bound `t()` plus the current language and text direction.
 *
 * Falls back to `"en"` when an old persisted snapshot has no `language`
 * field yet, so existing browsers keep English until they switch.
 */
export const useT = () => {
	const lang: Language = useAppStore((s) => s.language) ?? "en";

	const t = useCallback(
		(key: TranslationKey, params?: TranslationParams) =>
			translate(lang, key, params),
		[lang],
	);

	const dir = lang === "ar" ? "rtl" : "ltr";

	return {
		t,
		lang,
		dir,
		scopeProps: { lang, dir } as const,
	};
};
