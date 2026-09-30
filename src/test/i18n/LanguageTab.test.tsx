import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageTab } from "@/components/shared/settings/LanguageTab";
import { useAppStore } from "@/store/useStore";

beforeEach(() => {
	useAppStore.getState().setLanguage("en");
	useAppStore.getState().setIsLocked(true);
});

afterEach(() => {
	useAppStore.getState().setLanguage("en");
});

describe("LanguageTab", () => {
	it("renders a Language radiogroup with English checked by default", () => {
		// No isLocked prop exists on purpose — the picker must work while
		// Settings is locked (the store is locked in beforeEach).
		render(<LanguageTab />);

		expect(
			screen.getByRole("radiogroup", { name: "Language" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("radio", { name: "English, English" }),
		).toBeChecked();
		expect(
			screen.getByRole("radio", { name: "العربية, Arabic" }),
		).not.toBeChecked();
	});

	it("switches the store language instantly and re-renders secondary labels", async () => {
		const user = userEvent.setup();
		render(<LanguageTab />);

		await user.click(screen.getByRole("radio", { name: "العربية, Arabic" }));

		expect(useAppStore.getState().language).toBe("ar");
		expect(
			screen.getByRole("radiogroup", { name: "اللغة" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("radio", { name: "العربية, العربية" }),
		).toBeChecked();
		expect(screen.getByText("الإنجليزية")).toBeInTheDocument();
	});

	it("moves the selection with the arrow keys", async () => {
		const user = userEvent.setup();
		render(<LanguageTab />);

		const english = screen.getByRole("radio", { name: "English, English" });
		english.focus();
		await user.keyboard("{ArrowRight}");

		expect(useAppStore.getState().language).toBe("ar");
		const arabic = screen.getByRole("radio", { name: "العربية, العربية" });
		expect(arabic).toBeChecked();
		expect(arabic).toHaveFocus();
	});

	it("keeps native names fixed in both UI languages", () => {
		// EN UI: "English" is both the native name and the secondary label.
		const { unmount } = render(<LanguageTab />);
		expect(screen.getAllByText("English")).toHaveLength(2);
		expect(screen.getByText("العربية")).toHaveAttribute("lang", "ar");
		unmount();

		useAppStore.getState().setLanguage("ar");
		render(<LanguageTab />);
		expect(screen.getByText("English")).toBeInTheDocument();
		expect(screen.getAllByText("العربية")).toHaveLength(2);
		for (const el of screen.getAllByText("العربية")) {
			expect(el).toHaveAttribute("lang", "ar");
		}
	});
});
