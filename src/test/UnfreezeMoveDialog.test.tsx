import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	UnfreezeMoveDialog,
	type UnfreezeOrigin,
} from "@/components/freeze/UnfreezeMoveDialog";

const baseProps = {
	open: true,
	onOpenChange: vi.fn(),
	initialStage: "main" as const,
	onCancel: vi.fn(),
	onConfirm: vi.fn(),
};

describe("UnfreezeMoveDialog", () => {
	it("renders a singular row count title", () => {
		render(
			<UnfreezeMoveDialog
				{...baseProps}
				rowCount={1}
				origin={{ kind: "none" }}
			/>,
		);
		expect(screen.getByText("Move 1 row")).toBeInTheDocument();
		expect(
			screen.getByText("Choose the next stage for this frozen row."),
		).toBeInTheDocument();
	});

	it("renders a plural row count title", () => {
		render(
			<UnfreezeMoveDialog
				{...baseProps}
				rowCount={3}
				origin={{ kind: "none" }}
			/>,
		);
		expect(screen.getByText("Move 3 rows")).toBeInTheDocument();
		expect(
			screen.getByText("Choose the next stage for these frozen rows."),
		).toBeInTheDocument();
	});

	const originCases: Array<{ origin: UnfreezeOrigin; expected: string }> = [
		{
			origin: { kind: "single", stage: "call" },
			expected: "Came from Call List",
		},
		{ origin: { kind: "mixed" }, expected: "Mixed origin stages" },
		{ origin: { kind: "partial" }, expected: "Some origins not recorded" },
		{ origin: { kind: "none" }, expected: "Origin stage not recorded" },
	];

	for (const { origin, expected } of originCases) {
		it(`renders "${expected}" for origin kind "${origin.kind}"`, () => {
			render(
				<UnfreezeMoveDialog {...baseProps} rowCount={1} origin={origin} />,
			);
			expect(screen.getByText(expected)).toBeInTheDocument();
		});
	}

	it("shows the replacement freeze-details copy", () => {
		render(
			<UnfreezeMoveDialog
				{...baseProps}
				rowCount={1}
				origin={{ kind: "none" }}
			/>,
		);
		expect(
			screen.getByText(
				"Freeze details will be removed. All other data is kept.",
			),
		).toBeInTheDocument();
	});

	it("exposes the destination select with an accessible name", () => {
		render(
			<UnfreezeMoveDialog
				{...baseProps}
				rowCount={1}
				origin={{ kind: "none" }}
			/>,
		);
		expect(screen.getByLabelText("Destination stage")).toBeInTheDocument();
	});

	it("calls onConfirm with the initial stage when Move is clicked", () => {
		const onConfirm = vi.fn();
		render(
			<UnfreezeMoveDialog
				{...baseProps}
				initialStage="booking"
				rowCount={1}
				origin={{ kind: "none" }}
				onConfirm={onConfirm}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Move" }));
		expect(onConfirm).toHaveBeenCalledWith("booking");
	});

	it("calls onCancel when Cancel is clicked", () => {
		const onCancel = vi.fn();
		render(
			<UnfreezeMoveDialog
				{...baseProps}
				rowCount={1}
				origin={{ kind: "none" }}
				onCancel={onCancel}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it("renders nothing meaningful when closed", () => {
		render(
			<UnfreezeMoveDialog
				{...baseProps}
				open={false}
				rowCount={1}
				origin={{ kind: "none" }}
			/>,
		);
		expect(screen.queryByText("Move 1 row")).not.toBeInTheDocument();
	});
});
