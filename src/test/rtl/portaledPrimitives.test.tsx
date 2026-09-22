import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactElement, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { LayoutSaveButton } from "@/components/shared/LayoutSaveButton";
import { ReleaseConfirmationModal } from "@/components/shared/ReleaseConfirmationModal";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/origin-select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useStore";

/**
 * Issue #265 acceptance criterion: "A real portaled dialog, menu, select and
 * popover are each exercised in both directions: open side, arrow-key
 * navigation and submenu behaviour are correct in RTL." Every primitive
 * exercised here is a real, in-app component (not a bespoke test double),
 * rendered through the real `LocaleProvider` so direction reaches Radix the
 * same way it does in production.
 */

type TestLocale = "en" | "ar";

function renderLocale(locale: TestLocale, ui: ReactElement) {
	useAppStore.setState({ locale });
	return render(
		<LocaleProvider>
			<TooltipProvider>{ui}</TooltipProvider>
		</LocaleProvider>,
	);
}

const directionFor = (locale: TestLocale) => (locale === "ar" ? "rtl" : "ltr");

beforeEach(() => {
	localStorage.clear();
	document.documentElement.dir = "ltr";
});

describe("Dialog (ReleaseConfirmationModal) in RTL", () => {
	it("renders as a real dialog and Escape triggers cancellation, in Arabic", async () => {
		const onCancel = vi.fn();
		const user = userEvent.setup();
		renderLocale(
			"ar",
			<ReleaseConfirmationModal
				open
				vin="VF1JZKYK5MY123456"
				formattedMileage="1,200"
				onCancel={onCancel}
				onConfirm={vi.fn()}
			/>,
		);

		const dialog = await screen.findByRole("dialog");
		expect(dialog).toBeInTheDocument();
		// Radix reads document direction context, not just <html dir>: assert
		// the dialog is reachable and functional under the ar locale.
		await user.keyboard("{Escape}");
		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it("isolates the VIN as LTR even while the surrounding dialog is RTL", async () => {
		renderLocale(
			"ar",
			<ReleaseConfirmationModal
				open
				vin="VF1JZKYK5MY123456"
				formattedMileage="1,200"
				onCancel={vi.fn()}
				onConfirm={vi.fn()}
			/>,
		);

		const dialog = await screen.findByRole("dialog");
		const vinNode = within(dialog).getByText("VF1JZKYK5MY123456");
		expect(vinNode.getAttribute("dir")).toBe("ltr");

		const confirmInput = within(dialog).getByLabelText(
			"Enter confirmation word",
		);
		expect(confirmInput.getAttribute("dir")).toBe("ltr");
	});
});

describe("Menu + Popover (LayoutSaveButton)", () => {
	function setup(locale: TestLocale, onSaveAsDefault = vi.fn()) {
		return renderLocale(
			locale,
			<LayoutSaveButton
				isDirty
				isPositionDirty={false}
				onSave={vi.fn()}
				onSaveAsDefault={onSaveAsDefault}
				onReset={vi.fn()}
			/>,
		);
	}

	it.each([
		"en",
		"ar",
	] as const)("opens a %s menu and activates the ArrowDown selection with Enter", async (locale) => {
		const user = userEvent.setup();
		const onSaveAsDefault = vi.fn();
		setup(locale, onSaveAsDefault);

		const trigger = screen.getByRole("button");
		await user.click(trigger);

		const menu = await screen.findByRole("menu");
		expect(menu).toBeInTheDocument();
		expect(document.documentElement.dir).toBe(directionFor(locale));

		// Arrow-key navigation through menu items is native Radix behavior,
		// driven by the same direction context wired for the app.
		await user.keyboard("{ArrowDown}");
		const items = within(menu).getAllByRole("menuitem");
		await waitFor(() => {
			expect(document.activeElement).toBe(items[0]);
		});
		await user.keyboard("{ArrowDown}");
		expect(document.activeElement).toBe(items[1]);
		await user.keyboard("{Enter}");
		expect(onSaveAsDefault).toHaveBeenCalledTimes(1);
	});

	it("opens the confirmation popover from a menu item (a real portaled popover) in RTL", async () => {
		const user = userEvent.setup();
		setup("ar");

		await user.click(screen.getByRole("button"));
		const menu = await screen.findByRole("menu");
		await user.click(within(menu).getByText("Save Current Layout"));

		// The popover is a distinct portaled surface from the menu.
		expect(await screen.findByText("Save Layout?")).toBeInTheDocument();
	});
});

describe("Select", () => {
	function renderSelect(locale: TestLocale) {
		function ControlledSelect() {
			const [value, setValue] = useState("a");
			return (
				<>
					<Select value={value} onValueChange={setValue}>
						<SelectTrigger aria-label="Choose">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="a">Option A</SelectItem>
							<SelectItem value="b">Option B</SelectItem>
							<SelectItem value="c">Option C</SelectItem>
						</SelectContent>
					</Select>
					<output data-testid="selected-value">{value}</output>
				</>
			);
		}

		return renderLocale(locale, <ControlledSelect />);
	}

	it.each([
		"en",
		"ar",
	] as const)("opens a %s select and commits the ArrowDown choice with Enter", async (locale) => {
		const user = userEvent.setup();
		renderSelect(locale);

		await user.click(screen.getByRole("combobox"));
		const listbox = await screen.findByRole("listbox");
		expect(listbox).toBeInTheDocument();

		await user.keyboard("{ArrowDown}");
		await user.keyboard("{Enter}");

		await waitFor(() => {
			expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
		});
		expect(screen.getByTestId("selected-value")).toHaveTextContent("b");
	});
});

describe("Submenu direction wiring in RTL", () => {
	/**
	 * No shipped screen currently composes a Radix DropdownMenu submenu (see
	 * `src/components/ui/dropdown-menu.tsx` — Sub/SubTrigger/SubContent are
	 * defined for future use but not yet wired into any route), so this
	 * exercises the raw Radix submenu primitives directly under the real
	 * `LocaleProvider`/`DirectionProvider` stack to prove the direction
	 * wiring itself — not a bespoke reimplementation — drives correct
	 * open-toward-start keyboard behavior for whichever screen adopts it.
	 */
	it("opens the submenu with the start-facing arrow key (ArrowLeft) in RTL", async () => {
		const user = userEvent.setup();
		renderLocale(
			"ar",
			<DropdownMenu open>
				<DropdownMenuTrigger>Menu</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem>Top level</DropdownMenuItem>
					<DropdownMenuPrimitive.Sub>
						<DropdownMenuPrimitive.SubTrigger data-testid="sub-trigger">
							More
						</DropdownMenuPrimitive.SubTrigger>
						<DropdownMenuPrimitive.Portal>
							<DropdownMenuPrimitive.SubContent>
								<DropdownMenuItem>Nested item</DropdownMenuItem>
							</DropdownMenuPrimitive.SubContent>
						</DropdownMenuPrimitive.Portal>
					</DropdownMenuPrimitive.Sub>
				</DropdownMenuContent>
			</DropdownMenu>,
		);

		const subTrigger = await screen.findByTestId("sub-trigger");
		subTrigger.focus();
		// In RTL, Radix opens a submenu on ArrowLeft (mirrored from ArrowRight
		// in LTR) — this is the direction-aware keyboard semantics the
		// acceptance criteria require.
		await user.keyboard("{ArrowLeft}");

		await waitFor(() => {
			const nestedItem = screen.getByText("Nested item");
			expect(nestedItem).toBeInTheDocument();
			expect(nestedItem.closest("[data-side]")?.getAttribute("data-side")).toBe(
				"left",
			);
		});
	});

	it("opens the submenu with ArrowRight and positions it to the right in LTR", async () => {
		const user = userEvent.setup();
		renderLocale(
			"en",
			<DropdownMenu open>
				<DropdownMenuTrigger>Menu</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuPrimitive.Sub>
						<DropdownMenuPrimitive.SubTrigger data-testid="ltr-sub-trigger">
							More
						</DropdownMenuPrimitive.SubTrigger>
						<DropdownMenuPrimitive.Portal>
							<DropdownMenuPrimitive.SubContent>
								<DropdownMenuItem>LTR nested item</DropdownMenuItem>
							</DropdownMenuPrimitive.SubContent>
						</DropdownMenuPrimitive.Portal>
					</DropdownMenuPrimitive.Sub>
				</DropdownMenuContent>
			</DropdownMenu>,
		);

		const subTrigger = await screen.findByTestId("ltr-sub-trigger");
		subTrigger.focus();
		await user.keyboard("{ArrowRight}");

		await waitFor(() => {
			const nestedItem = screen.getByText("LTR nested item");
			expect(nestedItem.closest("[data-side]")?.getAttribute("data-side")).toBe(
				"right",
			);
		});
	});
});
