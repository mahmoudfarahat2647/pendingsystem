import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultGridOptions } from "../components/grid/config/defaultOptions";
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
	describe("Native Checkbox Selection", () => {
		it("should enable native checkbox selection with header checkbox", () => {
			const selection = defaultGridOptions.rowSelection;
			expect(selection).toBeDefined();
			expect(typeof selection).toBe("object");
			expect((selection as { checkboxes?: boolean }).checkboxes).toBe(true);
			expect((selection as { headerCheckbox?: boolean }).headerCheckbox).toBe(
				true,
			);
		});
	});

	describe("getBaseColumns", () => {
		it("ACTIONS column should be the second column (first user-defined after native checkbox)", () => {
			const columns = getBaseColumns();
			const firstCol = columns[0];
			expect(firstCol).toBeDefined();
			expect(firstCol?.headerName).toBe("ACTIONS");
			expect(firstCol?.colId).toBe("actions");
		});
	});

	describe("useColumnDefs hook", () => {
		it("ACTIONS column should be the second column (first user-defined) for all grid types", () => {
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
		it("getOrdersColumns: ACTIONS column should be the second column (first user-defined)", () => {
			const columns = getOrdersColumns([]);
			const firstCol = columns[0];
			expect(firstCol?.colId).toBe("actions");
		});

		it("getMainSheetColumns: ACTIONS column should be the second column (first user-defined)", () => {
			const columns = getMainSheetColumns([]);
			const firstCol = columns[0];
			expect(firstCol?.colId).toBe("actions");
		});

		it("getBookingColumns: ACTIONS column should be the second column (first user-defined)", () => {
			const columns = getBookingColumns();
			const firstCol = columns[0];
			expect(firstCol?.colId).toBe("actions");
		});
	});
});
