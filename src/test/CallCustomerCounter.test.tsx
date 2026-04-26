import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CallCustomerCounter } from "@/components/shared/CallCustomerCounter";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { PendingRow } from "@/types";

const renderWithProvider = (ui: React.ReactElement) => {
	return render(<TooltipProvider>{ui}</TooltipProvider>);
};

describe("CallCustomerCounter", () => {
	it("renders '0 Customers' for an empty list", () => {
		renderWithProvider(<CallCustomerCounter rows={[]} />);
		expect(screen.getByText("0")).toBeInTheDocument();
		expect(screen.getByText("Customers")).toBeInTheDocument();
	});

	it("counts duplicate VINs once", () => {
		const rows = [
			{ id: "1", vin: "VIN123" },
			{ id: "2", vin: "VIN123" },
			{ id: "3", vin: "VIN456" },
		] as PendingRow[];
		renderWithProvider(<CallCustomerCounter rows={rows} />);
		expect(screen.getByText("2")).toBeInTheDocument();
		expect(screen.getByText("Customers")).toBeInTheDocument();
	});

	it("ignores empty/missing VIN values", () => {
		const rows = [
			{ id: "1", vin: "VIN123" },
			{ id: "2", vin: "" },
			{ id: "3" },
			{ id: "4", vin: null },
		] as unknown as PendingRow[];
		renderWithProvider(<CallCustomerCounter rows={rows} />);
		expect(screen.getByText("1")).toBeInTheDocument();
		expect(screen.getByText("Customer")).toBeInTheDocument();
	});

	it("renders '1 Customer' singular form", () => {
		const rows = [{ id: "1", vin: "VIN123" }] as PendingRow[];
		renderWithProvider(<CallCustomerCounter rows={rows} />);
		expect(screen.getByText("1")).toBeInTheDocument();
		expect(screen.getByText("Customer")).toBeInTheDocument();
	});
});
