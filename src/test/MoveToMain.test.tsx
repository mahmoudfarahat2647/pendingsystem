import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
	toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

import { toast } from "sonner";
import { BookingToolbar } from "@/components/booking/BookingToolbar";
import { MoveToMainButton } from "@/components/shared/MoveToMainButton";
import { MoveToMainConfirmDialog } from "@/components/shared/MoveToMainConfirmDialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

const renderDialog = (onConfirm = vi.fn(), onOpenChange = vi.fn()) => {
	render(
		<MoveToMainConfirmDialog
			open
			onOpenChange={onOpenChange}
			count={3}
			onConfirm={onConfirm}
		/>,
	);
	return { onConfirm, onOpenChange };
};

describe("MoveToMainConfirmDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useAppStore.setState({ moveToMainPermission: true, language: "en" });
	});

	afterEach(() => {
		useAppStore.setState({ moveToMainPermission: false, language: "en" });
	});

	it("shows the Yes / No confirmation with the selected line count", () => {
		renderDialog();
		expect(
			screen.getByText(
				"Are you sure you want to move 3 line(s) to Main Sheet?",
			),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument();
		// Plain confirmation — no type-to-confirm input.
		expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
	});

	it("moves on Yes", async () => {
		const user = userEvent.setup();
		const { onConfirm } = renderDialog();
		await user.click(screen.getByRole("button", { name: "Yes" }));
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it("does nothing on No", async () => {
		const user = userEvent.setup();
		const { onConfirm, onOpenChange } = renderDialog();
		await user.click(screen.getByRole("button", { name: "No" }));
		expect(onConfirm).not.toHaveBeenCalled();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("aborts without changes when the switch is turned off while the dialog is open", async () => {
		const user = userEvent.setup();
		const { onConfirm } = renderDialog();
		act(() => {
			useAppStore.setState({ moveToMainPermission: false });
		});
		await user.click(screen.getByRole("button", { name: "Yes" }));
		expect(onConfirm).not.toHaveBeenCalled();
		expect(toast.error).toHaveBeenCalledWith(
			"Move to Main Sheet is turned off in Settings. No lines were moved.",
		);
	});

	it("renders the confirmation in Arabic", () => {
		useAppStore.setState({ language: "ar" });
		renderDialog();
		expect(screen.getByText("النقل إلى Main Sheet")).toBeInTheDocument();
		expect(
			screen.getByText("هل أنت متأكد من نقل 3 سطر إلى Main Sheet؟"),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "نعم" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "لا" })).toBeInTheDocument();
	});
});

describe("MoveToMainButton", () => {
	afterEach(() => {
		useAppStore.setState({ language: "en" });
	});

	it("has an English accessible name", () => {
		render(
			<TooltipProvider>
				<MoveToMainButton onClick={vi.fn()} disabled={false} />
			</TooltipProvider>,
		);
		expect(
			screen.getByRole("button", { name: "Move to Main Sheet" }),
		).toBeInTheDocument();
	});

	it("has an Arabic accessible name", () => {
		useAppStore.setState({ language: "ar" });
		render(
			<TooltipProvider>
				<MoveToMainButton onClick={vi.fn()} disabled={false} />
			</TooltipProvider>,
		);
		expect(
			screen.getByRole("button", { name: "النقل إلى Main Sheet" }),
		).toBeInTheDocument();
	});
});

describe("BookingToolbar Move to Main Sheet", () => {
	const rows = [
		{ id: "1", vin: "VIN-A", stage: "booking" },
		{ id: "2", vin: "VIN-B", stage: "booking" },
	] as PendingRow[];

	const renderToolbar = (onMoveToMain = vi.fn()) => {
		render(
			<TooltipProvider>
				<BookingToolbar
					selectedRows={rows}
					rowData={rows}
					draftDirty={false}
					hasMixedVins={true}
					onExtract={vi.fn()}
					onFilterToggle={vi.fn()}
					onReserve={vi.fn()}
					onUpdateStatus={vi.fn()}
					onArchive={vi.fn()}
					onFreeze={vi.fn()}
					onRebook={vi.fn()}
					onReorder={vi.fn()}
					onMoveToMain={onMoveToMain}
					canMoveToMain={true}
					onDelete={vi.fn()}
					onSelectAllByVin={vi.fn()}
					isSelectAllByVinDisabled={false}
				/>
			</TooltipProvider>,
		);
		return onMoveToMain;
	};

	it("stays enabled for a mixed-VIN selection", async () => {
		const user = userEvent.setup();
		const onMoveToMain = renderToolbar();
		const button = screen.getByRole("button", { name: "Move to Main Sheet" });
		expect(button).toBeEnabled();
		await user.click(button);
		expect(onMoveToMain).toHaveBeenCalledTimes(1);
	});
});
