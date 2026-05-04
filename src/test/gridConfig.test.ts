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
	useAppStore: Object.assign(
		(fn: (state: { bookingStatuses: unknown[] }) => unknown) =>
			fn({ bookingStatuses: [] }),
		{
			getState: () => ({ bookingStatuses: [] }),
		},
	),
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
		it("should expose ACTIONS as the first configured column", () => {
			const columns = getBaseColumns();
			const actionsCol = columns[0];
			expect(actionsCol).toBeDefined();
			expect(actionsCol?.headerName).toBe("ACTIONS");
			expect(actionsCol?.colId).toBe("row-actions");
			expect(columns.find((c) => c.colId === "checkbox-selection-col")).toBe(
				undefined,
			);
		});

		it("should use a pure comparator for COMPANY column aligning with pendingsystem display value", () => {
			const columns = getBaseColumns();
			const companyCol = columns.find((c) => c.headerName === "COMPANY");

			expect(companyCol).toBeDefined();
			expect(typeof companyCol?.comparator).toBe("function");

			const compare = companyCol?.comparator as (
				a: unknown,
				b: unknown,
			) => number;

			// 1. Equal fallbacks (empty, null, undefined) all sort identically
			expect(compare("", "")).toBe(0);
			expect(compare(null, undefined)).toBe(0);

			// 2. Empty/null/undefined fall back to "pendingsystem" (lowercase),
			// which sorts before "Toyota" after case normalization ("p" < "t")
			expect(compare("", "Toyota")).toBeLessThan(0);
			expect(compare(undefined, "Toyota")).toBeLessThan(0);
			expect(compare(null, "Toyota")).toBeLessThan(0);

			// 3. Transitive negative behaviour ("Toyota" > "pendingsystem" after normalization)
			expect(compare("Toyota", "")).toBeGreaterThan(0);

			// 4. Normal string comparison for non-empty values (case-insensitive)
			expect(compare("Abc", "Xyz")).toBeLessThan(0);
			expect(compare("BMW", "Audi")).toBeGreaterThan(0);

			// 5. Case-insensitive equivalence (mixed case treated as equal)
			expect(compare("renault", "Renault")).toBe(0);
		});
	});

	describe("useColumnDefs hook", () => {
		it("should expose ACTIONS as the first configured column for all grid types", () => {
			const gridTypes: Array<
				"main" | "orders" | "booking" | "archive" | "call"
			> = ["main", "orders", "booking", "archive", "call"];

			for (const type of gridTypes) {
				const { result } = renderHook(() => useColumnDefs(type));

				const actionsCol = result.current[0];
				expect(
					actionsCol,
					`Actions column missing at index 0 for type ${type}`,
				).toBeDefined();
				expect(actionsCol?.colId).toBe("row-actions");
				expect(
					result.current.find((c) => c.colId === "checkbox-placeholder"),
					`Checkbox placeholder should be absent for type ${type}`,
				).toBeUndefined();
			}
		});
	});

	describe("Other column getters", () => {
		it("getOrdersColumns: ACTIONS should be the first configured column", () => {
			const columns = getOrdersColumns([]);
			const actionsCol = columns[0];
			expect(actionsCol?.colId).toBe("row-actions");
		});

		it("getMainSheetColumns: ACTIONS should be the first configured column", () => {
			const columns = getMainSheetColumns([]);
			const actionsCol = columns[0];
			expect(actionsCol?.colId).toBe("row-actions");
		});

		it("getBookingColumns: ACTIONS should be the first configured column", () => {
			const columns = getBookingColumns();
			const actionsCol = columns[0];
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
			const fields = columns.map((c) => c.field || c.colId);
			expect(fields).toContain("vin");
			expect(fields).toContain("mobile");
			expect(fields).toContain("customerName");
			expect(fields[fields.length - 1]).toBe("requester");

			// 5. MinWidth protections
			const vinCol = columns.find((c) => c.field === "vin");
			const mobileCol = columns.find((c) => c.field === "mobile");
			const customerCol = columns.find((c) => c.field === "customerName");

			expect(vinCol?.minWidth).toBeGreaterThanOrEqual(180);
			expect(mobileCol?.minWidth).toBeGreaterThanOrEqual(130);
			expect(customerCol?.minWidth).toBeGreaterThanOrEqual(180);

			// 6. Native checkbox placeholder must be ABSENT
			expect(
				columns.find((c) => c.colId === "ag-Grid-AutoColumn"),
			).toBeUndefined();
		});
	});
});
