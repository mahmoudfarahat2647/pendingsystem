export type Theme = "dark" | "white";

export const THEME_KEY = "pending-sys-theme";
export const DEFAULT_THEME: Theme = "dark";

/** Routes that always render Dark, whatever the saved preference. */
export const ALWAYS_DARK_PATH_PREFIXES = ["/mobile-order"] as const;

export const isTheme = (value: unknown): value is Theme =>
	value === "dark" || value === "white";

export const isAlwaysDarkPath = (pathname: string): boolean =>
	ALWAYS_DARK_PATH_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);

/** Missing, unreadable or unrecognised values (and throwing storage) resolve to Dark. */
export const readTheme = (): Theme => {
	try {
		const value = window.localStorage.getItem(THEME_KEY);
		return isTheme(value) ? value : DEFAULT_THEME;
	} catch {
		return DEFAULT_THEME;
	}
};

/** Returns false when storage is blocked or full (the caller keeps the choice in memory). */
export const writeTheme = (theme: Theme): boolean => {
	try {
		window.localStorage.setItem(THEME_KEY, theme);
		return true;
	} catch {
		return false;
	}
};

/** Toggles the `dark` class on <html> in place: no reload, no remount. */
export const applyThemeClass = (theme: Theme): void => {
	document.documentElement.classList.toggle("dark", theme === "dark");
};

/**
 * Inline pre-paint script for the root layout. Mirrors readTheme /
 * isAlwaysDarkPath; the SSR default stays `class="dark"`, so it only ever
 * removes the class, and only for a saved `white` choice.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=location.pathname;var a=${JSON.stringify(
	ALWAYS_DARK_PATH_PREFIXES,
)};for(var i=0;i<a.length;i++){if(p===a[i]||p.indexOf(a[i]+"/")===0)return}if(localStorage.getItem(${JSON.stringify(
	THEME_KEY,
)})==="white"){document.documentElement.classList.remove("dark")}}catch(e){}})();`;
