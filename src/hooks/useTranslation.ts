import { useContext } from "react";
import { LocaleContext, type LocaleContextValue } from "./localeContext";

/**
 * Access the active locale, its text direction, the translator function, and
 * the setter used by the Settings language control. Must be called under
 * `LocaleProvider` (mounted app-wide in `src/app/layout.tsx`).
 */
export function useTranslation(): LocaleContextValue {
	const ctx = useContext(LocaleContext);
	if (!ctx) {
		throw new Error("useTranslation must be used within a LocaleProvider");
	}
	return ctx;
}
