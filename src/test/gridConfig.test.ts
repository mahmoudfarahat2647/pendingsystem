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
		it("should have headerCheckboxSelectionFilteredOnly set to true in the selection column", () => {
			const columns = getBaseColumns();
			const selectionCol = columns.find((col) => col.colId === "selection");
			expect(selectionCol).toBeDefined();
			expect(selectionCol?.headerCheckboxSelection).toBe(true);
			// @ts-expect-error - headerCheckboxSelectionFilteredOnly might not be in the ColDef types if using an older version but it is a valid ag-grid property
			expect(selectionCol?.headerCheckboxSelectionFilteredOnly).toBe(true);
		});
	});

	describe("useColumnDefs hook", () => {
		it("should include headerCheckboxSelectionFilteredOnly: true for all grid types", () => {
			const gridTypes: Array<
				"main" | "orders" | "booking" | "archive" | "call"
			> = ["main", "orders", "booking", "archive", "call"];

			for (const type of gridTypes) {
				const { result } = renderHook(() => useColumnDefs(type));
				const selectionCol = result.current.find(
					(col) => col.colId === "selection",
				);

				expect(
					selectionCol,
					`Selection column missing for type ${type}`,
				).toBeDefined();
				expect(selectionCol?.headerCheckboxSelection).toBe(true);
				// @ts-expect-error
				expect(selectionCol?.headerCheckboxSelectionFilteredOnly).toBe(true);
			}
		});
	});

	describe("Other column getters", () => {
		it("getOrdersColumns should include updated selection config", () => {
			const columns = getOrdersColumns([]);
			const selectionCol = columns.find((col) => col.colId === "selection");
			// @ts-expect-error
			expect(selectionCol?.headerCheckboxSelectionFilteredOnly).toBe(true);
		});

		it("getMainSheetColumns should include updated selection config", () => {
			const columns = getMainSheetColumns([]);
			const selectionCol = columns.find((col) => col.colId === "selection");
			// @ts-expect-error
			expect(selectionCol?.headerCheckboxSelectionFilteredOnly).toBe(true);
		});

		it("getBookingColumns should include updated selection config", () => {
			const columns = getBookingColumns();
			const selectionCol = columns.find((col) => col.colId === "selection");
			// @ts-expect-error
			expect(selectionCol?.headerCheckboxSelectionFilteredOnly).toBe(true);
		});
	});
});
