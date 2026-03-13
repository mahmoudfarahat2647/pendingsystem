import type { GridApi, IRowNode } from "ag-grid-community";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { tryJumpToRow } from "../lib/ag-grid-helpers";

describe("tryJumpToRow", () => {
	let mockGridApi: Partial<GridApi>;
	let mockRowNode: Partial<IRowNode>;

	beforeEach(() => {
		mockRowNode = {
			setSelected: vi.fn(),
		};

		mockGridApi = {
			isDestroyed: vi.fn().mockReturnValue(false),
			getDisplayedRowCount: vi.fn().mockReturnValue(10),
			getRowNode: vi.fn().mockReturnValue(mockRowNode),
			deselectAll: vi.fn(),
			ensureNodeVisible: vi.fn(),
			flashCells: vi.fn(),
		};
	});

	it("should return false with reason no-row-id when rowId is null, undefined, or empty", () => {
		expect(tryJumpToRow(mockGridApi as GridApi, null)).toEqual({
			success: false,
			reason: "no-row-id",
		});
		expect(tryJumpToRow(mockGridApi as GridApi, undefined)).toEqual({
			success: false,
			reason: "no-row-id",
		});
		expect(tryJumpToRow(mockGridApi as GridApi, "")).toEqual({
			success: false,
			reason: "no-row-id",
		});
	});

	it("should return false with reason grid-not-ready when gridApi is null or undefined", () => {
		expect(tryJumpToRow(null, "row-1")).toEqual({
			success: false,
			reason: "grid-not-ready",
		});
		expect(tryJumpToRow(undefined, "row-1")).toEqual({
			success: false,
			reason: "grid-not-ready",
		});
	});

	it("should return false with reason grid-destroyed when isDestroyed returns true", () => {
		mockGridApi.isDestroyed = vi.fn().mockReturnValue(true);
		expect(tryJumpToRow(mockGridApi as GridApi, "row-1")).toEqual({
			success: false,
			reason: "grid-destroyed",
		});
	});

	it("should return false with reason grid-destroyed when getDisplayedRowCount throws an error", () => {
		mockGridApi.getDisplayedRowCount = vi.fn().mockImplementation(() => {
			throw new Error("test");
		});
		expect(tryJumpToRow(mockGridApi as GridApi, "row-1")).toEqual({
			success: false,
			reason: "grid-destroyed",
		});
	});

	it("should return false with reason row-not-found when getRowNode returns null or undefined", () => {
		mockGridApi.getRowNode = vi.fn().mockReturnValue(null);
		expect(tryJumpToRow(mockGridApi as GridApi, "row-1")).toEqual({
			success: false,
			reason: "row-not-found",
		});

		mockGridApi.getRowNode = vi.fn().mockReturnValue(undefined);
		expect(tryJumpToRow(mockGridApi as GridApi, "row-1")).toEqual({
			success: false,
			reason: "row-not-found",
		});
	});

	it("should perform grid actions and return success true on happy path", () => {
		const result = tryJumpToRow(mockGridApi as GridApi, "row-1");

		expect(result).toEqual({ success: true });

		expect(mockGridApi.getRowNode).toHaveBeenCalledWith("row-1");
		expect(mockGridApi.deselectAll).toHaveBeenCalled();
		expect(mockRowNode.setSelected).toHaveBeenCalledWith(true, true, "api");
		expect(mockGridApi.ensureNodeVisible).toHaveBeenCalledWith(
			mockRowNode,
			"middle",
		);
		expect(mockGridApi.flashCells).toHaveBeenCalledWith({
			rowNodes: [mockRowNode],
			flashDuration: 500,
			fadeDuration: 500,
		});
	});
});
