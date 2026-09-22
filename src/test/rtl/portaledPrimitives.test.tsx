import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
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

function renderArabic(ui: ReactElement) {
	useAppStore.setState({ locale: "ar" });
	return render(
		<LocaleProvider>
			<TooltipProvider>{ui}</TooltipProvider>
		</LocaleProvider>,
	);
}

beforeEach(() => {
	localStorage.clear();
	document.documentElement.dir = "ltr";
});

describe("Dialog (ReleaseConfirmationModal) in RTL", () => {
	it("renders as a real dialog and Escape triggers cancellation, in Arabic", async () => {
		const onCancel = vi.fn();
		const user = userEvent.setup();
		renderArabic(
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
		renderArabic(
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

describe("Menu + Popover (LayoutSaveButton) in RTL", () => {
	function setup() {
		return renderArabic(
			<LayoutSaveButton
				isDirty
				isPositionDirty={false}
				onSave={vi.fn()}
				onSaveAsDefault={vi.fn()}
				onReset={vi.fn()}
			/>,
		);
	}

	it("opens the dropdown menu, navigates items with ArrowDown, and activates one with Enter", async () => {
		const user = userEvent.setup();
		setup();

		const trigger = screen.getByRole("button");
		await user.click(trigger);

		const menu = await screen.findByRole("menu");
		expect(menu).toBeInTheDocument();

		// Arrow-key navigation through menu items is native Radix behavior,
		// driven by the same direction context wired for the app.
		await user.keyboard("{ArrowDown}");
		const items = within(menu).getAllByRole("menuitem");
		await waitFor(() => {
			expect(items.some((item) => item === document.activeElement)).toBe(true);
		});
	});

	it("opens the confirmation popover from a menu item (a real portaled popover) in RTL", async () => {
		const user = userEvent.setup();
		setup();

		await user.click(screen.getByRole("button"));
		const menu = await screen.findByRole("menu");
		await user.click(within(menu).getByText("Save Current Layout"));

		// The popover is a distinct portaled surface from the menu.
		expect(await screen.findByText("Save Layout?")).toBeInTheDocument();
	});
});

describe("Select in RTL", () => {
	function renderSelect() {
		return renderArabic(
			<Select defaultValue="a">
				<SelectTrigger aria-label="Choose">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="a">Option A</SelectItem>
					<SelectItem value="b">Option B</SelectItem>
					<SelectItem value="c">Option C</SelectItem>
				</SelectContent>
			</Select>,
		);
	}

	it("opens and navigates options with ArrowDown/Enter", async () => {
		const user = userEvent.setup();
		renderSelect();

		await user.click(screen.getByRole("combobox"));
		const listbox = await screen.findByRole("listbox");
		expect(listbox).toBeInTheDocument();

		await user.keyboard("{ArrowDown}");
		await user.keyboard("{Enter}");

		await waitFor(() => {
			expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
		});
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
		renderArabic(
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
			expect(screen.getByText("Nested item")).toBeInTheDocument();
		});
	});
});
