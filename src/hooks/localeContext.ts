import { createContext } from "react";
import type { Locale, TextDirection } from "@/domain/locale/locale";
import type { TranslationKey } from "@/locales";

export interface LocaleContextValue {
	locale: Locale;
	dir: TextDirection;
	setLocale: (locale: Locale) => void;
	t: (key: TranslationKey) => string;
}

/**
 * Context object only — the provider implementation lives in
 * `src/components/providers/LocaleProvider.tsx`. Kept separate so hooks never
 * import from `components/` (see CLAUDE.md dependency-direction rules).
 */
export const LocaleContext = createContext<LocaleContextValue | null>(null);
