import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RowValueFilter } from "@/components/shared/RowValueFilter";

describe("RowValueFilter — Call List repair system configuration", () => {
	const repairSystemProps = {
		options: [{ label: "Brakes", value: "Brakes" }],
		value: [],
		onChange: vi.fn(),
		placeholder: "Repair system",
		ariaLabel: "Filter repair system",
		emptyText: "No repair systems found.",
	};

	it("renders the Repair system placeholder", () => {
		render(<RowValueFilter {...repairSystemProps} />);
		expect(screen.getByPlaceholderText("Repair system")).toBeInTheDocument();
	});

	it("renders the repair-system aria-label on the input", () => {
		render(<RowValueFilter {...repairSystemProps} />);
		expect(screen.getByLabelText("Filter repair system")).toBeInTheDocument();
	});

	it("disables the input when there are no options", () => {
		render(<RowValueFilter {...repairSystemProps} options={[]} />);
		expect(screen.getByLabelText("Filter repair system")).toBeDisabled();
	});

	it("does not disable the input when options are present", () => {
		render(<RowValueFilter {...repairSystemProps} />);
		expect(screen.getByLabelText("Filter repair system")).not.toBeDisabled();
	});
});

describe("RowValueFilter — Global Search car model configuration", () => {
	const modelProps = {
		options: [{ label: "Megane IV", value: "Megane IV" }],
		value: [],
		onChange: vi.fn(),
		placeholder: "Car model",
		ariaLabel: "Filter car model",
		emptyText: "No car models found.",
	};

	it("renders the Car model placeholder", () => {
		render(<RowValueFilter {...modelProps} />);
		expect(screen.getByPlaceholderText("Car model")).toBeInTheDocument();
	});

	it("renders the car-model aria-label on the input", () => {
		render(<RowValueFilter {...modelProps} />);
		expect(screen.getByLabelText("Filter car model")).toBeInTheDocument();
	});

	it("disables the input when there are no models", () => {
		render(<RowValueFilter {...modelProps} options={[]} />);
		expect(screen.getByLabelText("Filter car model")).toBeDisabled();
	});
});
