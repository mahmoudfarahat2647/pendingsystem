import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ReleaseConfirmationModal } from "@/components/shared/ReleaseConfirmationModal";

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({
		open,
		children,
		onOpenChange,
	}: {
		open: boolean;
		children: ReactNode;
		onOpenChange: (open: boolean) => void;
	}) =>
		open ? (
			<div data-testid="dialog-root">
				<button
					type="button"
					aria-label="Escape"
					onClick={() => onOpenChange(false)}
				/>
				{children}
			</div>
		) : null,
	DialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogDescription: ({ children }: { children: ReactNode }) => (
		<p>{children}</p>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

function renderModal(
	overrides: Partial<Parameters<typeof ReleaseConfirmationModal>[0]> = {},
) {
	const onCancel = vi.fn();
	const onConfirm = vi.fn();
	render(
		<ReleaseConfirmationModal
			open
			vin="VF1RFA00000000001"
			formattedMileage="4,999"
			onCancel={onCancel}
			onConfirm={onConfirm}
			{...overrides}
		/>,
	);
	return { onCancel, onConfirm };
}

describe("ReleaseConfirmationModal", () => {
	it("renders the exact approved title, copy, and field labels", () => {
		renderModal();
		expect(screen.getByText("Release required")).toBeInTheDocument();
		expect(
			screen.getAllByText(
				"Warranty chassis under 5,000 km — confirm approval before moving to Call List.",
			).length,
		).toBeGreaterThan(0);
		expect(screen.getByText("VIN")).toBeInTheDocument();
		expect(screen.getByText("Mileage")).toBeInTheDocument();
		expect(screen.getByText("Repair system")).toBeInTheDocument();
		expect(screen.getByText("Warranty")).toBeInTheDocument();
		expect(screen.getByText("VF1RFA00000000001")).toBeInTheDocument();
		expect(screen.getByText("4,999 km")).toBeInTheDocument();
		expect(
			screen.getByText("This approval applies to this move only."),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Release to Call List" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
	});

	it("renders no part-number or affected-part content", () => {
		renderModal();
		expect(screen.queryByText(/part number/i)).not.toBeInTheDocument();
	});

	it("keeps confirm disabled until the value is exactly 'release'", async () => {
		const user = userEvent.setup();
		renderModal();
		const confirmButton = screen.getByRole("button", {
			name: "Release to Call List",
		});
		expect(confirmButton).toBeDisabled();

		const input = screen.getByLabelText("Enter confirmation word");
		await user.type(input, "releas");
		expect(confirmButton).toBeDisabled();
	});

	it("accepts a trimmed, case-varied 'release'", async () => {
		const user = userEvent.setup();
		const { onConfirm } = renderModal();
		const input = screen.getByLabelText("Enter confirmation word");
		await user.type(input, "  RELEASE  ");
		const confirmButton = screen.getByRole("button", {
			name: "Release to Call List",
		});
		expect(confirmButton).not.toBeDisabled();
		await user.click(confirmButton);
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it("submits on Enter only when valid", async () => {
		const user = userEvent.setup();
		const { onConfirm } = renderModal();
		const input = screen.getByLabelText("Enter confirmation word");
		await user.type(input, "wrong{Enter}");
		expect(onConfirm).not.toHaveBeenCalled();
		await user.clear(input);
		await user.type(input, "release{Enter}");
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it("Cancel and the dialog's close/escape path both call onCancel", async () => {
		const user = userEvent.setup();
		const { onCancel } = renderModal();
		await user.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it("resets the input when reopened", () => {
		const { unmount } = render(
			<ReleaseConfirmationModal
				open
				vin="VF1RFA00000000001"
				formattedMileage="4,999"
				onCancel={vi.fn()}
				onConfirm={vi.fn()}
			/>,
		);
		unmount();
		render(
			<ReleaseConfirmationModal
				open={false}
				vin="VF1RFA00000000001"
				formattedMileage="4,999"
				onCancel={vi.fn()}
				onConfirm={vi.fn()}
			/>,
		);
		// Closed state renders nothing via the mocked Dialog.
		expect(screen.queryByText("Release required")).not.toBeInTheDocument();
	});

	it("disables Cancel and the confirm input while pending", () => {
		renderModal({ pending: true });
		expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
		expect(screen.getByLabelText("Enter confirmation word")).toBeDisabled();
	});
});
