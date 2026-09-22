"use client";

import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
	DEFAULT_LOCALE,
	getDirection,
	type Locale,
	normalizeLocale,
} from "@/domain/locale/locale";
import { LocaleContext, type LocaleContextValue } from "@/hooks/localeContext";
import { translate } from "@/locales";
import { useAppStore } from "@/store/useStore";

/**
 * Mounts the localization boundary for the whole app (see `src/app/layout.tsx`).
 *
 * Startup boundary: both the server render and the very first client render
 * use `DEFAULT_LOCALE` ("en"), identical to what the server sent — this is
 * what keeps hydration mismatch-free. The persisted preference (already
 * available synchronously from the Zustand store on the client, since
 * localStorage reads are synchronous) is only applied inside a
 * `useLayoutEffect`, which commits before the browser paints. That single,
 * synchronous post-hydrate correction is the entire "boundary": there is no
 * hidden/blank state to get stuck in, and the shell is never remounted on a
 * later switch — only this provider's context value changes.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
	const storeLocale = useAppStore((state) => state.locale);
	const setStoreLocale = useAppStore((state) => state.setLocale);

	const [resolvedLocale, setResolvedLocale] = useState<Locale>(DEFAULT_LOCALE);

	// Sync the resolved locale from the persisted store once mounted, and on
	// every later change (e.g. the Settings language toggle). Runs before
	// paint so there is no visible flash between the neutral startup default
	// and the restored preference.
	useLayoutEffect(() => {
		setResolvedLocale(normalizeLocale(storeLocale));
	}, [storeLocale]);

	// Keep the root document's lang/dir attributes in sync. This mutates the
	// DOM imperatively rather than through JSX props on <html>, so it never
	// participates in hydration diffing.
	useLayoutEffect(() => {
		if (typeof document === "undefined") return;
		document.documentElement.lang = resolvedLocale;
		document.documentElement.dir = getDirection(resolvedLocale);
	}, [resolvedLocale]);

	const setLocale = useCallback(
		(next: Locale) => {
			setStoreLocale(next);
		},
		[setStoreLocale],
	);

	const t = useCallback<LocaleContextValue["t"]>(
		(key) => translate(resolvedLocale, key),
		[resolvedLocale],
	);

	const value = useMemo<LocaleContextValue>(
		() => ({
			locale: resolvedLocale,
			dir: getDirection(resolvedLocale),
			setLocale,
			t,
		}),
		[resolvedLocale, setLocale, t],
	);

	return (
		<LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
	);
}
