import { act, renderHook } from "@testing-library/react";
import type { GridApi } from "ag-grid-community";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ag-grid-helpers", () => ({
	trySelectRowsByVin: vi.fn(),
}));

vi.mock("@/lib/orderWorkflow", () => ({
	hasMixedVinSelection: vi.fn(),
}));

import { trySelectRowsByVin } from "@/lib/ag-grid-helpers";
import { hasMixedVinSelection } from "@/lib/orderWorkflow";
import type { PendingRow } from "@/types";
import { useSelectAllByVin } from "../hooks/useSelectAllByVin";

const makeRow = (vin: string): PendingRow =>
	({ id: crypto.randomUUID(), vin }) as PendingRow;

describe("useSelectAllByVin", () => {
	let mockGridApi: Partial<GridApi>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockGridApi = {};
		vi.mocked(hasMixedVinSelection).mockReturnValue(false);
	});

	it("is disabled when selectedRows is empty", () => {
		const { result } = renderHook(() =>
			useSelectAllByVin([], mockGridApi as GridApi),
		);
		expect(result.current.isSelectAllByVinDisabled).toBe(true);
	});

	it("is enabled when all selected rows share the same VIN", () => {
		vi.mocked(hasMixedVinSelection).mockReturnValue(false);
		const rows = [makeRow("VIN1"), makeRow("VIN1")];
		const { result } = renderHook(() =>
			useSelectAllByVin(rows, mockGridApi as GridApi),
		);
		expect(result.current.isSelectAllByVinDisabled).toBe(false);
	});

	it("is disabled when selected rows have mixed VINs", () => {
		vi.mocked(hasMixedVinSelection).mockReturnValue(true);
		const rows = [makeRow("VIN1"), makeRow("VIN2")];
		const { result } = renderHook(() =>
			useSelectAllByVin(rows, mockGridApi as GridApi),
		);
		expect(result.current.isSelectAllByVinDisabled).toBe(true);
	});

	it("calls trySelectRowsByVin with the first row's vin when invoked while enabled", () => {
		vi.mocked(hasMixedVinSelection).mockReturnValue(false);
		const rows = [makeRow("VIN123"), makeRow("VIN123")];
		const { result } = renderHook(() =>
			useSelectAllByVin(rows, mockGridApi as GridApi),
		);
		act(() => {
			result.current.onSelectAllByVin();
		});
		expect(trySelectRowsByVin).toHaveBeenCalledWith(mockGridApi, "VIN123");
	});

	it("does not call trySelectRowsByVin when disabled (empty selection)", () => {
		const { result } = renderHook(() =>
			useSelectAllByVin([], mockGridApi as GridApi),
		);
		act(() => {
			result.current.onSelectAllByVin();
		});
		expect(trySelectRowsByVin).not.toHaveBeenCalled();
	});

	it("does not call trySelectRowsByVin when disabled (mixed VINs)", () => {
		vi.mocked(hasMixedVinSelection).mockReturnValue(true);
		const rows = [makeRow("VIN1"), makeRow("VIN2")];
		const { result } = renderHook(() =>
			useSelectAllByVin(rows, mockGridApi as GridApi),
		);
		act(() => {
			result.current.onSelectAllByVin();
		});
		expect(trySelectRowsByVin).not.toHaveBeenCalled();
	});
});
