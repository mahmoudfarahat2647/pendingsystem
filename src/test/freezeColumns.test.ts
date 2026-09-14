import type {
	ValueFormatterParams,
	ValueGetterParams,
} from "ag-grid-community";
import { describe, expect, it } from "vitest";
import { getFreezeColumns } from "@/components/shared/GridConfig";
import { PendingRowSchema } from "@/schemas/order.schema";
import type { PendingRow } from "@/types";

const createMockRow = (overrides: Record<string, unknown> = {}): PendingRow => {
	return PendingRowSchema.parse({
		id: "row-1",
		customerName: "Test",
		vin: "VIN123",
		parts: [{ id: "p1", partNumber: "P1", description: "D1", quantity: 1 }],
		...overrides,
	});
};

describe("getFreezeColumns", () => {
	const columns = getFreezeColumns();

	it("returns ACTIONS as first column with composite valueGetter", () => {
		const actionCol = columns[0];
		expect(actionCol.colId).toBe("row-actions");
		expect(actionCol.headerName).toBe("ACTIONS");
		expect(actionCol.field).toBeUndefined(); // MUST NOT use field: "id"
		expect(typeof actionCol.valueGetter).toBe("function");

		const mockRow = createMockRow();

		const val1 = (
			actionCol.valueGetter as (params: ValueGetterParams<PendingRow>) => string
		)({ data: mockRow } as ValueGetterParams<PendingRow>);

		expect(val1).toBe("row-1___");

		// When note/attachment/reminder updates, composite key changes
		const updatedRow = createMockRow({
			id: "row-1",
			hasAttachment: true,
			noteHistory: "Some note",
			reminder: { date: "2026-10-01", time: "10:00", subject: "Check" },
		});

		const val2 = (
			actionCol.valueGetter as (params: ValueGetterParams<PendingRow>) => string
		)({ data: updatedRow } as ValueGetterParams<PendingRow>);

		expect(val2).toBe("row-1_note_rem_att");
		expect(val2).not.toBe(val1);
	});

	it("returns DAYS FROZEN as second column with colId daysFrozen", () => {
		const daysFrozenCol = columns[1];
		expect(daysFrozenCol.colId).toBe("daysFrozen");
		expect(daysFrozenCol.headerName).toBe("DAYS FROZEN");
		expect(daysFrozenCol.filter).toBe("agNumberColumnFilter");
		expect(typeof daysFrozenCol.valueGetter).toBe("function");
		expect(typeof daysFrozenCol.valueFormatter).toBe("function");
	});

	it("calculates elapsed whole days correctly in DAYS FROZEN valueGetter", () => {
		const daysFrozenCol = columns[1];
		const getter = daysFrozenCol.valueGetter as (
			params: ValueGetterParams<PendingRow>,
		) => number | null;

		// Missing data or missing frozenAt
		expect(
			getter({ data: undefined } as ValueGetterParams<PendingRow>),
		).toBeNull();
		expect(
			getter({ data: createMockRow() } as ValueGetterParams<PendingRow>),
		).toBeNull();
		expect(
			getter({
				data: createMockRow({ frozenAt: "" }),
			} as ValueGetterParams<PendingRow>),
		).toBeNull();

		// Invalid date
		expect(
			getter({
				data: createMockRow({ frozenAt: "invalid-date" }),
			} as ValueGetterParams<PendingRow>),
		).toBeNull();

		// Exactly 5 days ago
		const fiveDaysAgo = new Date(
			Date.now() - 5 * 24 * 60 * 60 * 1000,
		).toISOString();
		expect(
			getter({
				data: createMockRow({ frozenAt: fiveDaysAgo }),
			} as ValueGetterParams<PendingRow>),
		).toBe(5);

		// Exactly 0 days ago (just now)
		const justNow = new Date().toISOString();
		expect(
			getter({
				data: createMockRow({ frozenAt: justNow }),
			} as ValueGetterParams<PendingRow>),
		).toBe(0);

		// Future date should be clamped to 0
		const futureDate = new Date(
			Date.now() + 2 * 24 * 60 * 60 * 1000,
		).toISOString();
		expect(
			getter({
				data: createMockRow({ frozenAt: futureDate }),
			} as ValueGetterParams<PendingRow>),
		).toBe(0);
	});

	it("formats DAYS FROZEN valueFormatter cleanly without throwing", () => {
		const daysFrozenCol = columns[1];
		const formatter = daysFrozenCol.valueFormatter as (
			params: ValueFormatterParams<PendingRow>,
		) => string;

		expect(formatter({ value: null } as ValueFormatterParams<PendingRow>)).toBe(
			"",
		);
		expect(
			formatter({ value: undefined } as ValueFormatterParams<PendingRow>),
		).toBe("");
		expect(formatter({ value: "" } as ValueFormatterParams<PendingRow>)).toBe(
			"",
		);
		expect(formatter({ value: 0 } as ValueFormatterParams<PendingRow>)).toBe(
			"0",
		);
		expect(formatter({ value: 12 } as ValueFormatterParams<PendingRow>)).toBe(
			"12",
		);
	});

	it("includes REQUESTER column as the last column", () => {
		const lastCol = columns[columns.length - 1];
		expect(lastCol.headerName).toBe("REQUESTER");
		expect(lastCol.field).toBe("requester");
	});
});
