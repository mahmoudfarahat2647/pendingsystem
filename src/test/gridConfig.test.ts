import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultGridOptions } from "../components/grid/config/defaultOptions";
import { useColumnDefs } from "../components/grid/hooks/useColumnDefs";
import {
	getBaseColumns,
	getBookingColumns,
	getGlobalSearchWorkspaceColumns,
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
			expect(checkboxCol?.colId).toBe("checkbox-selection-col");
			// ACTIONS column at index 1
			const actionsCol = columns[1];
			expect(actionsCol).toBeDefined();
			expect(actionsCol?.headerName).toBe("ACTIONS");
			expect(actionsCol?.colId).toBe("row-actions");
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
				expect(actionsCol?.colId).toBe("row-actions");
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
			expect(actionsCol?.colId).toBe("row-actions");
		});

		it("getMainSheetColumns: Checkbox at index 0, ACTIONS at index 1 (second column)", () => {
			const columns = getMainSheetColumns([]);
			// Checkbox column at index 0
			const checkboxCol = columns[0];
			expect(checkboxCol).toBeDefined();
			// ACTIONS column at index 1
			const actionsCol = columns[1];
			expect(actionsCol?.colId).toBe("row-actions");
		});

		it("getBookingColumns: Checkbox at index 0, ACTIONS at index 1 (second column)", () => {
			const columns = getBookingColumns();
			// Checkbox column at index 0
			const checkboxCol = columns[0];
			expect(checkboxCol).toBeDefined();
			// ACTIONS column at index 1
			const actionsCol = columns[1];
			expect(actionsCol?.colId).toBe("row-actions");
		});
	});

	describe("getGlobalSearchWorkspaceColumns", () => {
		it("should have correct column order and fit-mode protections", () => {
			const columns = getGlobalSearchWorkspaceColumns([]);
			
			// 1. SOURCE (Index 0)
			expect(columns[0].field).toBe("sourceType");
			expect(columns[0].width).toBe(96);
			expect(columns[0].suppressSizeToFit).toBe(true);
			expect(columns[0].pinned).toBe("left");

			// 2. CHECKBOX (Index 1)
			expect(columns[1].colId).toBe("search-checkbox");
			expect(columns[1].width).toBe(52);
			expect(columns[1].suppressSizeToFit).toBe(true);
			expect(columns[1].pinned).toBe("left");

			// 3. ACTIONS (Index 2)
			expect(columns[2].colId).toBe("row-actions");
			expect(columns[2].width).toBe(96);
			expect(columns[2].suppressSizeToFit).toBe(true);
			expect(columns[2].pinned).toBe("left");

			// 4. Sequence Assertions
			const fields = columns.map(c => c.field || c.colId);
			expect(fields).toContain("vin");
			expect(fields).toContain("mobile");
			expect(fields).toContain("customerName");
			expect(fields[fields.length - 1]).toBe("partStatus");

			// 5. MinWidth protections
			const vinCol = columns.find(c => c.field === "vin");
			const mobileCol = columns.find(c => c.field === "mobile");
			const customerCol = columns.find(c => c.field === "customerName");

			expect(vinCol?.minWidth).toBeGreaterThanOrEqual(180);
			expect(mobileCol?.minWidth).toBeGreaterThanOrEqual(130);
			expect(customerCol?.minWidth).toBeGreaterThanOrEqual(180);

			// 6. Native checkbox placeholder must be ABSENT
			expect(columns.find(c => c.colId === "ag-Grid-AutoColumn")).toBeUndefined();
		});
	});
});
