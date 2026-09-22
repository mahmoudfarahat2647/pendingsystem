import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { LanguageTab } from "@/components/shared/settings/LanguageTab";
import { useAppStore } from "@/store/useStore";

function renderLanguageTab() {
	return render(
		<LocaleProvider>
			<LanguageTab />
		</LocaleProvider>,
	);
}

describe("LanguageTab", () => {
	beforeEach(() => {
		localStorage.clear();
		useAppStore.setState({ locale: "en" });
	});

	it("is discoverable as a labelled radiogroup with English and Arabic options", () => {
		renderLanguageTab();

		expect(screen.getByRole("radiogroup")).toBeInTheDocument();
		expect(screen.getByRole("radio", { name: "English" })).toBeInTheDocument();
		expect(screen.getByRole("radio", { name: "العربية" })).toBeInTheDocument();
	});

	it("exposes English as selected by default", () => {
		renderLanguageTab();

		expect(screen.getByRole("radio", { name: "English" })).toBeChecked();
		expect(screen.getByRole("radio", { name: "العربية" })).not.toBeChecked();
	});

	it("switches immediately on click, updating the accessible state and the document direction", async () => {
		const user = userEvent.setup();
		renderLanguageTab();

		await user.click(screen.getByRole("radio", { name: "العربية" }));

		expect(screen.getByRole("radio", { name: "العربية" })).toBeChecked();
		expect(screen.getByRole("radio", { name: "English" })).not.toBeChecked();
		expect(document.documentElement.lang).toBe("ar");
		expect(document.documentElement.dir).toBe("rtl");
	});

	it("supports keyboard operation via arrow keys", async () => {
		const user = userEvent.setup();
		renderLanguageTab();

		const english = screen.getByRole("radio", { name: "English" });
		english.focus();
		await user.keyboard("{ArrowRight}");

		expect(screen.getByRole("radio", { name: "العربية" })).toBeChecked();
		expect(screen.getByRole("radio", { name: "العربية" })).toHaveFocus();
	});

	it("is fully usable even conceptually while Settings is locked (no lock-related props gate it)", () => {
		// LanguageTab intentionally takes no `isLocked` prop — language is a
		// presentation preference, independent of the Settings edit lock.
		renderLanguageTab();
		const arabic = screen.getByRole("radio", { name: "العربية" });
		expect(arabic).not.toBeDisabled();
	});
});
