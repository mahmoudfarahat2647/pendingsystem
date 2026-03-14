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
		it("Checkbox should be at index 0, ACTIONS column should be at index 1 (second column)", () => {
			const columns = getBaseColumns();
			// Checkbox column at index 0
			const checkboxCol = columns[0];
			expect(checkboxCol).toBeDefined();
			expect(checkboxCol?.colId).toBe("ag-Grid-AutoColumn");
			// ACTIONS column at index 1
			const actionsCol = columns[1];
			expect(actionsCol).toBeDefined();
			expect(actionsCol?.headerName).toBe("ACTIONS");
			expect(actionsCol?.colId).toBe("actions");
		});
	});

	describe("useColumnDefs hook", () => {
		it("Checkbox should be at index 0, ACTIONS column should be at index 1 (second column) for all grid types", () => {
			const gridTypes: Array<
				"main" | "orders" | "booking" | "archive" | "call"
			> = ["main", "orders", "booking", "archive", "call"];

			for (const type of gridTypes) {
				const { result } = renderHook(() => useColumnDefs(type));

				// Checkbox column at index 0
				const checkboxCol = result.current[0];
				expect(
					checkboxCol,
					`Checkbox column missing at index 0 for type ${type}`,
				).toBeDefined();

				// ACTIONS column at index 1
				const actionsCol = result.current[1];
				expect(
					actionsCol,
					`Actions column missing at index 1 for type ${type}`,
				).toBeDefined();
				expect(actionsCol?.colId).toBe("actions");
			}
		});
	});

	describe("Other column getters", () => {
		it("getOrdersColumns: Checkbox at index 0, ACTIONS at index 1 (second column)", () => {
			const columns = getOrdersColumns([]);
			// Checkbox column at index 0
			const checkboxCol = columns[0];
			expect(checkboxCol).toBeDefined();
			// ACTIONS column at index 1
			const actionsCol = columns[1];
			expect(actionsCol?.colId).toBe("actions");
		});

		it("getMainSheetColumns: Checkbox at index 0, ACTIONS at index 1 (second column)", () => {
			const columns = getMainSheetColumns([]);
			// Checkbox column at index 0
			const checkboxCol = columns[0];
			expect(checkboxCol).toBeDefined();
			// ACTIONS column at index 1
			const actionsCol = columns[1];
			expect(actionsCol?.colId).toBe("actions");
		});

		it("getBookingColumns: Checkbox at index 0, ACTIONS at index 1 (second column)", () => {
			const columns = getBookingColumns();
			// Checkbox column at index 0
			const checkboxCol = columns[0];
			expect(checkboxCol).toBeDefined();
			// ACTIONS column at index 1
			const actionsCol = columns[1];
			expect(actionsCol?.colId).toBe("actions");
		});
	});
});
