import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ForceDarkTheme } from "@/components/providers/ForceDarkTheme";
import { THEME_KEY } from "@/lib/theme";

const isDark = () => document.documentElement.classList.contains("dark");

describe("ForceDarkTheme (/mobile-order client navigation)", () => {
	beforeEach(() => {
		window.localStorage.setItem(THEME_KEY, "white");
		document.documentElement.classList.remove("dark");
	});

	it("forces dark while mounted and restores the saved theme on leave", () => {
		const { unmount } = render(<ForceDarkTheme />);
		expect(isDark()).toBe(true);
		unmount();
		expect(isDark()).toBe(false);
	});
});
