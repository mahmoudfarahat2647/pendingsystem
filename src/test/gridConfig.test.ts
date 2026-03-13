import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useColumnDefs } from "../components/grid/hooks/useColumnDefs";
import {
	getBaseColumns,
	getBookingColumns,
	getMainSheetColumns,
	getOrdersColumns,
} from "../components/shared/GridConfig";

// Mock the store
vi.mock("@/store/useStore", () => ({
	useAppStore: Object.assign((fn: any) => fn({ bookingStatuses: [] }), {
		getState: () => ({ bookingStatuses: [] }),
	}),
}));

describe("Grid Column Configuration Selection Fix", () => {
	describe("getBaseColumns", () => {
		it("should have actions as the first column, selection is now handled natively", () => {
			const columns = getBaseColumns();
			const firstCol = columns[0];
			expect(firstCol).toBeDefined();
			expect(firstCol?.headerName).toBe("ACTIONS");
			expect(firstCol?.colId).toBe("actions");
		});
	});

	describe("useColumnDefs hook", () => {
		it("should have actions as the first column for all grid types", () => {
			const gridTypes: Array<
				"main" | "orders" | "booking" | "archive" | "call"
			> = ["main", "orders", "booking", "archive", "call"];

			for (const type of gridTypes) {
				const { result } = renderHook(() => useColumnDefs(type));
				const firstCol = result.current[0];

				expect(
					firstCol,
					`Actions column missing as first column for type ${type}`,
				).toBeDefined();
				expect(firstCol?.colId).toBe("actions");
			}
		});
	});

	describe("Other column getters", () => {
		it("getOrdersColumns should include actions column as first", () => {
			const columns = getOrdersColumns([]);
			const firstCol = columns[0];
			expect(firstCol?.colId).toBe("actions");
		});

		it("getMainSheetColumns should include actions column as first", () => {
			const columns = getMainSheetColumns([]);
			const firstCol = columns[0];
			expect(firstCol?.colId).toBe("actions");
		});

		it("getBookingColumns should include actions column as first", () => {
			const columns = getBookingColumns();
			const firstCol = columns[0];
			expect(firstCol?.colId).toBe("actions");
		});
	});
});
