/**
 * Shared configuration for the Dark screenshot baseline tool (issue #341).
 *
 * Pure data module with no side effects so it can be unit-tested directly.
 * Viewports and views are frozen: every later white-theme ticket re-captures
 * exactly this set and diffs Dark against the committed baseline.
 */

/** Fixed clock injected into the page before any script runs (local noon). */
export const FIXED_DATE_ISO = "2026-09-15T12:00:00.000";

/** Search term typed into the header global search for the search view. */
export const SEARCH_TERM = "Baseline";

/** Desktop viewports required by the spec (1672x941 + one more width). */
export const VIEWPORTS = [
	{ name: "1672x941", width: 1672, height: 941 },
	{ name: "1440x900", width: 1440, height: 900 },
];

/**
 * Views to capture. `kind` controls how capture.mjs produces the state:
 * - "route": navigate and screenshot.
 * - "search": navigate to `path`, type SEARCH_TERM into the header search.
 * - "settings": navigate to `path`, open the Settings modal from the sidebar.
 * - "dialog": navigate to `path`, open the representative order dialog.
 * `auth: false` views are captured in a signed-out context.
 */
export const VIEWS = [
	{ key: "dashboard", path: "/dashboard", kind: "route", auth: true },
	{ key: "orders", path: "/orders", kind: "route", auth: true },
	{ key: "main-sheet", path: "/main-sheet", kind: "route", auth: true },
	{ key: "call-list", path: "/call-list", kind: "route", auth: true },
	{ key: "booking", path: "/booking", kind: "route", auth: true },
	{ key: "archive", path: "/archive", kind: "route", auth: true },
	{ key: "freeze", path: "/freeze", kind: "route", auth: true },
	{ key: "reports", path: "/reports", kind: "route", auth: true },
	{ key: "search", path: "/dashboard", kind: "search", auth: true },
	{ key: "settings", path: "/dashboard", kind: "settings", auth: true },
	{ key: "dialog", path: "/orders", kind: "dialog", auth: true },
	{ key: "login", path: "/login", kind: "route", auth: false },
	{
		key: "forgot-password",
		path: "/forgot-password",
		kind: "route",
		auth: false,
	},
	{
		key: "reset-password",
		path: "/reset-password",
		kind: "route",
		auth: false,
	},
	{ key: "mobile-order", path: "/mobile-order", kind: "route", auth: false },
];

/** File name for a baseline/current screenshot of a view at a viewport. */
export function screenshotFileName(viewKey, viewportName) {
	return `${viewKey}@${viewportName}.png`;
}

/** Manifest file written next to every capture run. */
export const MANIFEST_FILE = "manifest.json";
