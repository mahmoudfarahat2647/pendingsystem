import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useAppStore } from "@/store/useStore";

afterEach(() => {
	useAppStore.getState().setLanguage("en");
});

describe("LanguageToggle", () => {
	it("renders an EN | AR switch usable without lock props", () => {
		// No isLocked prop exists on purpose — the switch must work while
		// Settings is locked. Rendering bare proves that contract.
		render(<LanguageToggle />);

		expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Switch to English" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Switch to Arabic" }),
		).toBeInTheDocument();
	});

	it("marks English as pressed by default", () => {
		render(<LanguageToggle />);

		expect(
			screen.getByRole("button", { name: "Switch to English" }),
		).toHaveAttribute("aria-pressed", "true");
		expect(
			screen.getByRole("button", { name: "Switch to Arabic" }),
		).toHaveAttribute("aria-pressed", "false");
	});

	it("switches the store language instantly on click", async () => {
		const user = userEvent.setup();
		render(<LanguageToggle />);

		const arabicButton = screen.getByRole("button", {
			name: "Switch to Arabic",
		});
		await user.click(arabicButton);

		expect(useAppStore.getState().language).toBe("ar");
		// Same element, now pressed — and its label re-rendered in Arabic.
		expect(arabicButton).toHaveAttribute("aria-pressed", "true");
		expect(arabicButton).toHaveAccessibleName("التبديل إلى العربية");
	});
});
