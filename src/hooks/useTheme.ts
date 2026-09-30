"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
	applyThemeClass,
	DEFAULT_THEME,
	isAlwaysDarkPath,
	readTheme,
	THEME_KEY,
	type Theme,
	writeTheme,
} from "@/lib/theme";

const listeners = new Set<() => void>();

const notify = () => {
	for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	const onStorage = (event: StorageEvent) => {
		if (event.key === THEME_KEY || event.key === null) {
			// Always-dark routes (/mobile-order) keep their forced Dark class.
			if (!isAlwaysDarkPath(window.location.pathname)) {
				applyThemeClass(readTheme());
			}
			notify();
		}
	};
	window.addEventListener("storage", onStorage);
	return () => {
		listeners.delete(listener);
		window.removeEventListener("storage", onStorage);
	};
};

/**
 * Browser-local theme preference (`pending-sys-theme`). Deliberately not in
 * the persisted Zustand store: that hydrates after first render and would
 * flash the wrong theme. Setting it updates <html> in place.
 */
export const useTheme = () => {
	const theme = useSyncExternalStore(subscribe, readTheme, () => DEFAULT_THEME);

	const setTheme = useCallback((next: Theme) => {
		writeTheme(next);
		if (!isAlwaysDarkPath(window.location.pathname)) applyThemeClass(next);
		notify();
	}, []);

	return { theme, setTheme };
};
