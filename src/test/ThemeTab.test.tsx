import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeTab } from "@/components/shared/settings/ThemeTab";
import { THEME_KEY } from "@/lib/theme";

describe("ThemeTab card picker", () => {
	beforeEach(() => {
		window.localStorage.clear();
		document.documentElement.className = "dark";
	});

	it("renders Dark and White as a radio group with Dark selected by default", () => {
		render(<ThemeTab />);
		expect(screen.getByRole("radiogroup")).toBeInTheDocument();
		expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
		expect(screen.getByRole("radio", { name: "White" })).not.toBeChecked();
	});

	it("selecting a card saves the theme and updates <html> in place", () => {
		render(<ThemeTab />);
		fireEvent.click(screen.getByRole("radio", { name: "White" }));
		expect(window.localStorage.getItem(THEME_KEY)).toBe("white");
		expect(document.documentElement.classList.contains("dark")).toBe(false);
		expect(screen.getByRole("radio", { name: "White" })).toBeChecked();

		fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
		expect(window.localStorage.getItem(THEME_KEY)).toBe("dark");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});
});
