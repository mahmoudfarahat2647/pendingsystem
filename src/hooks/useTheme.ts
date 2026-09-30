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

/**
 * Choice made while storage could not be written (private mode, blocked site
 * data, full quota). Without it the <html> class and the snapshot would
 * disagree, leaving grids, charts and toasts on the old theme.
 */
let unsavedTheme: Theme | null = null;

/** Current theme: an unsaved in-memory choice wins over storage. */
export const getCurrentTheme = (): Theme => unsavedTheme ?? readTheme();

const notify = () => {
	for (const listener of listeners) listener();
};

// One shared window listener for every subscriber (grid cells can mount
// hundreds), so a cross-tab change is O(N), not O(N^2).
const onStorage = (event: StorageEvent) => {
	if (event.key !== THEME_KEY && event.key !== null) return;
	unsavedTheme = null;
	// Always-dark routes (/mobile-order) keep their forced Dark class.
	if (!isAlwaysDarkPath(window.location.pathname)) {
		applyThemeClass(readTheme());
	}
	notify();
};

const subscribe = (listener: () => void) => {
	if (listeners.size === 0) window.addEventListener("storage", onStorage);
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
		if (listeners.size === 0) window.removeEventListener("storage", onStorage);
	};
};

/**
 * Browser-local theme preference (`pending-sys-theme`). Deliberately not in
 * the persisted Zustand store: that hydrates after first render and would
 * flash the wrong theme. Setting it updates <html> in place.
 */
export const useTheme = () => {
	const theme = useSyncExternalStore(
		subscribe,
		getCurrentTheme,
		() => DEFAULT_THEME,
	);

	const setTheme = useCallback((next: Theme) => {
		unsavedTheme = writeTheme(next) ? null : next;
		if (!isAlwaysDarkPath(window.location.pathname)) applyThemeClass(next);
		notify();
	}, []);

	return { theme, setTheme };
};
