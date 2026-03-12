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
		it("should have a selection column", () => {
			const columns = getBaseColumns();
			const selectionCol = columns.find((col) => col.colId === "selection");
			expect(selectionCol).toBeDefined();
			expect(selectionCol?.headerName).toBe("");
			expect(selectionCol?.width).toBe(50);
		});
	});

	describe("useColumnDefs hook", () => {
		it("should include selection column for all grid types", () => {
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
				expect(selectionCol?.width).toBe(50);
			}
		});
	});

	describe("Other column getters", () => {
		it("getOrdersColumns should include selection column", () => {
			const columns = getOrdersColumns([]);
			const selectionCol = columns.find((col) => col.colId === "selection");
			expect(selectionCol).toBeDefined();
		});

		it("getMainSheetColumns should include selection column", () => {
			const columns = getMainSheetColumns([]);
			const selectionCol = columns.find((col) => col.colId === "selection");
			expect(selectionCol).toBeDefined();
		});

		it("getBookingColumns should include selection column", () => {
			const columns = getBookingColumns();
			const selectionCol = columns.find((col) => col.colId === "selection");
			expect(selectionCol).toBeDefined();
		});
	});
});
