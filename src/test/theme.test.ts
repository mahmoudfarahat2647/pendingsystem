import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	applyThemeClass,
	isAlwaysDarkPath,
	readTheme,
	THEME_INIT_SCRIPT,
	THEME_KEY,
	writeTheme,
} from "@/lib/theme";

const runInitScript = (pathname: string) => {
	window.history.pushState({}, "", pathname);
	new Function(THEME_INIT_SCRIPT)();
};

describe("theme storage contract", () => {
	beforeEach(() => {
		window.localStorage.clear();
		document.documentElement.className = "dark";
	});
	afterEach(() => vi.restoreAllMocks());

	it("uses the pending-sys-theme key", () => {
		expect(THEME_KEY).toBe("pending-sys-theme");
	});

	it("defaults to dark when nothing, or an unrecognised value, is saved", () => {
		expect(readTheme()).toBe("dark");
		window.localStorage.setItem(THEME_KEY, "system");
		expect(readTheme()).toBe("dark");
	});

	it("round-trips white and dark", () => {
		writeTheme("white");
		expect(readTheme()).toBe("white");
		writeTheme("dark");
		expect(readTheme()).toBe("dark");
	});

	it("falls back to dark without throwing when storage throws", () => {
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new Error("blocked");
		});
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("blocked");
		});
		expect(readTheme()).toBe("dark");
		expect(() => writeTheme("white")).not.toThrow();
	});

	it("toggles the dark class in place", () => {
		applyThemeClass("white");
		expect(document.documentElement.classList.contains("dark")).toBe(false);
		applyThemeClass("dark");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});
});

describe("pre-paint script", () => {
	beforeEach(() => {
		window.localStorage.clear();
		document.documentElement.className = "dark";
	});

	it("keeps dark with no saved choice", () => {
		runInitScript("/dashboard");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});

	it("removes dark for a saved white choice", () => {
		window.localStorage.setItem(THEME_KEY, "white");
		runInitScript("/dashboard");
		expect(document.documentElement.classList.contains("dark")).toBe(false);
	});

	it("ignores an unrecognised value", () => {
		window.localStorage.setItem(THEME_KEY, "purple");
		runInitScript("/login");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});

	it("skips /mobile-order on direct load", () => {
		window.localStorage.setItem(THEME_KEY, "white");
		runInitScript("/mobile-order");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});

	it("matches isAlwaysDarkPath", () => {
		expect(isAlwaysDarkPath("/mobile-order")).toBe(true);
		expect(isAlwaysDarkPath("/mobile-order/x")).toBe(true);
		expect(isAlwaysDarkPath("/mobile-orders")).toBe(false);
	});
});
