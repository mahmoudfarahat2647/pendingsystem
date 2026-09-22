import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MobileOrderPage from "@/app/mobile-order/page";
import { BookingSidebarDetails } from "@/components/booking/BookingSidebarDetails";
import { InfoLabel } from "@/components/shared/InfoLabel";
import type { PendingRow } from "@/types";

vi.mock("@/hooks/queries/useAppSettingsQuery", () => ({
	useAppSettingsQuery: () => ({ data: { models: [], repairSystems: [] } }),
}));

const row = {
	id: "row-1",
	customerName: "محمود Mahmoud",
	vin: "VF1JZKYK5MY123456",
	mobile: "01001234567",
	partNumber: "PART-123",
	description: "قطعة Part",
	model: "Megane",
	repairSystem: "ضمان",
	status: "Hold",
} as PendingRow;

describe("RTL identifier and free-text paths", () => {
	it("isolates technical values while allowing InfoLabel operator text to choose its own direction", () => {
		render(<InfoLabel data={row} />);

		expect(screen.getByText(row.vin).getAttribute("dir")).toBe("ltr");
		expect(screen.getByText(row.mobile).getAttribute("dir")).toBe("ltr");
		expect(screen.getByText(row.partNumber).getAttribute("dir")).toBe("ltr");
		expect(screen.getByText(row.customerName).getAttribute("dir")).toBe("auto");
		expect(screen.getByText(row.description).getAttribute("dir")).toBe("auto");
	});

	it("keeps booking technical fallbacks LTR and booking text natural", () => {
		render(
			<BookingSidebarDetails
				selectedRows={[{ ...row, description: "" }]}
				activeCustomerBookings={[]}
				consolidatedNotes={["اتصل بالعميل tomorrow"]}
				activeCustomerHistoryDates={[]}
				onHistoryDateClick={vi.fn()}
			/>,
		);

		expect(screen.getByText(row.vin).getAttribute("dir")).toBe("ltr");
		expect(screen.getByText(row.partNumber).getAttribute("dir")).toBe("ltr");
		expect(screen.getByText(row.customerName).getAttribute("dir")).toBe("auto");
	});

	it("gives mobile-order technical inputs LTR and operator text automatic direction", () => {
		render(<MobileOrderPage />);

		expect(screen.getByLabelText("Mobile").getAttribute("dir")).toBe("ltr");
		expect(screen.getByLabelText("VIN").getAttribute("dir")).toBe("ltr");
		expect(screen.getByLabelText("SAB").getAttribute("dir")).toBe("ltr");
		expect(screen.getByPlaceholderText("Part #").getAttribute("dir")).toBe(
			"ltr",
		);
		expect(screen.getByLabelText("Customer").getAttribute("dir")).toBe("auto");
		expect(screen.getByPlaceholderText("Description").getAttribute("dir")).toBe(
			"auto",
		);
	});
});
