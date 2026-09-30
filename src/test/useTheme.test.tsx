import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "@/hooks/useTheme";
import {
	getGridTheme,
	gridThemeDark,
	gridThemeWhite,
} from "@/lib/ag-grid-setup";
import { THEME_KEY } from "@/lib/theme";

describe("useTheme", () => {
	beforeEach(() => {
		window.localStorage.clear();
		document.documentElement.className = "dark";
	});

	it("defaults to dark, and setTheme persists and updates <html> in place", () => {
		const { result } = renderHook(() => useTheme());
		expect(result.current.theme).toBe("dark");
		act(() => result.current.setTheme("white"));
		expect(result.current.theme).toBe("white");
		expect(window.localStorage.getItem(THEME_KEY)).toBe("white");
		expect(document.documentElement.classList.contains("dark")).toBe(false);
		act(() => result.current.setTheme("dark"));
		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});

	it("picks the matching AG Grid theme object", () => {
		expect(getGridTheme("dark")).toBe(gridThemeDark);
		expect(getGridTheme("white")).toBe(gridThemeWhite);
	});

	it("keeps /mobile-order Dark when the theme changes in another tab", () => {
		window.history.pushState({}, "", "/mobile-order");
		const { result } = renderHook(() => useTheme());
		window.localStorage.setItem(THEME_KEY, "white");
		act(() => {
			window.dispatchEvent(new StorageEvent("storage", { key: THEME_KEY }));
		});
		expect(result.current.theme).toBe("white");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
		window.history.pushState({}, "", "/");
	});

	it("keeps the chosen theme in memory when storage cannot be written", () => {
		const setItem = vi
			.spyOn(Storage.prototype, "setItem")
			.mockImplementation(() => {
				throw new Error("quota");
			});
		const { result } = renderHook(() => useTheme());
		act(() => result.current.setTheme("white"));
		expect(result.current.theme).toBe("white");
		expect(document.documentElement.classList.contains("dark")).toBe(false);
		setItem.mockRestore();
		act(() => result.current.setTheme("dark"));
		expect(result.current.theme).toBe("dark");
	});

	it("installs a single storage listener however many components subscribe", () => {
		const add = vi.spyOn(window, "addEventListener");
		const hooks = Array.from({ length: 5 }, () => renderHook(() => useTheme()));
		expect(add.mock.calls.filter(([type]) => type === "storage")).toHaveLength(
			1,
		);
		for (const h of hooks) h.unmount();
		add.mockRestore();
	});
});
