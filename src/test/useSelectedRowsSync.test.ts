import { useIsMutating } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { useSelectedRowsSync } from "../hooks/useSelectedRowsSync";

vi.mock("@tanstack/react-query", () => ({
	useIsMutating: vi.fn(),
}));

type TestRow = { id: string; name: string };
const mockUseIsMutating = useIsMutating as Mock;

describe("useSelectedRowsSync", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// By default, no mutations are active.
		mockUseIsMutating.mockReturnValue(0);
	});

	it("no mutation: missing rows are removed from selection", () => {
		const rowData: TestRow[] = [{ id: "1", name: "A" }];
		const selectedRows: TestRow[] = [
			{ id: "1", name: "A" },
			{ id: "2", name: "B" }, // Target missing row
		];
		const setSelectedRows = vi.fn();

		const { rerender } = renderHook(
			(props) =>
				useSelectedRowsSync(
					"orders",
					props.rowData,
					props.selectedRows,
					setSelectedRows,
				),
			{
				initialProps: { rowData, selectedRows },
			},
		);

		// Remove everything in rowData
		rerender({ rowData: [], selectedRows });

		expect(setSelectedRows).toHaveBeenCalledTimes(1);
		const updateFn = setSelectedRows.mock.calls[0][0];
		const result = updateFn(selectedRows);

		// Missing rows should be pruned
		expect(result).toEqual([]);
	});

	it("relevant mutation pending: missing rows stay selected", () => {
		const rowData: TestRow[] = [{ id: "1", name: "A" }];
		const selectedRows: TestRow[] = [
			{ id: "1", name: "A" },
			{ id: "2", name: "B" },
		];
		const setSelectedRows = vi.fn();

		// Mock that a relevant mutation starts on "orders" stage
		mockUseIsMutating.mockImplementation(
			(options: { mutationKey: string[] }) => {
				if (
					options.mutationKey[0] === "bulk-update-stage" &&
					options.mutationKey[1] === "orders"
				)
					return 1;
				return 0;
			},
		);

		const { rerender } = renderHook(
			(props) =>
				useSelectedRowsSync(
					"orders",
					props.rowData,
					props.selectedRows,
					setSelectedRows,
				),
			{
				initialProps: { rowData, selectedRows },
			},
		);

		// Remove element 1 too, mimicking optimistic removal
		rerender({ rowData: [], selectedRows });

		expect(setSelectedRows).toHaveBeenCalledTimes(1);
		const updateFn = setSelectedRows.mock.calls[0][0];
		const result = updateFn(selectedRows);

		// Since a relevant mutation is running, missing rows are kept!
		expect(result).toEqual(selectedRows);
	});

	it("relevant mutation succeeds: missing rows are pruned after settle", () => {
		const rowData: TestRow[] = [{ id: "1", name: "A" }];
		const selectedRows: TestRow[] = [{ id: "1", name: "A" }];
		const setSelectedRows = vi.fn();

		let isUpdating = 1;
		mockUseIsMutating.mockImplementation(
			(options: { mutationKey: string[] }) => {
				if (
					options.mutationKey[0] === "bulk-update-stage" &&
					options.mutationKey[1] === "orders"
				)
					return isUpdating;
				return 0;
			},
		);

		const { rerender } = renderHook(
			(props) =>
				useSelectedRowsSync(
					"orders",
					props.rowData,
					props.selectedRows,
					setSelectedRows,
				),
			{
				initialProps: { rowData, selectedRows },
			},
		);

		// 1. Optimistic removal of the row while mutating
		rerender({ rowData: [], selectedRows });

		expect(setSelectedRows).toHaveBeenCalledTimes(1);
		let updateFn = setSelectedRows.mock.calls[0][0];
		let result = updateFn(selectedRows);

		// Suspended deselection keeps the selection alive
		expect(result).toEqual(selectedRows);

		// 2. Mutation settles (isUpdating -> 0).
		isUpdating = 0;
		rerender({ rowData: [], selectedRows });

		expect(setSelectedRows).toHaveBeenCalledTimes(2);
		updateFn = setSelectedRows.mock.calls[1][0];
		result = updateFn(selectedRows);

		// The row is STILL missing, and the mutation is done. It should now prune the row.
		expect(result).toEqual([]);
	});

	it("relevant mutation rolls back: selection is preserved and references are refreshed", () => {
		const rowData: TestRow[] = [{ id: "1", name: "A" }];
		const selectedRows: TestRow[] = [rowData[0]]; // Initial selection points to original instance
		const setSelectedRows = vi.fn();

		let isUpdating = 1;
		mockUseIsMutating.mockImplementation(
			(options: { mutationKey: string[] }) => {
				if (
					options.mutationKey[0] === "bulk-update-stage" &&
					options.mutationKey[1] === "orders"
				)
					return isUpdating;
				return 0;
			},
		);

		const { rerender } = renderHook(
			(props) =>
				useSelectedRowsSync(
					"orders",
					props.rowData,
					props.selectedRows,
					setSelectedRows,
				),
			{
				initialProps: { rowData, selectedRows },
			},
		);

		// 1. Optimistic removal of the row while mutating
		rerender({ rowData: [], selectedRows });

		expect(setSelectedRows).toHaveBeenCalledTimes(1);
		let updateFn = setSelectedRows.mock.calls[0][0];
		let result = updateFn(selectedRows);

		// Suspended deselection keeps the selection alive with stale reference
		expect(result).toEqual(selectedRows);
		expect(result[0]).toBe(selectedRows[0]);

		// 2. Mutation rolls back (rowData restores as a fresh instance, AND isUpdating drops back to 0).
		isUpdating = 0;
		const restoredRowData = [{ id: "1", name: "A" }];
		rerender({ rowData: restoredRowData, selectedRows });

		expect(setSelectedRows).toHaveBeenCalledTimes(2);
		updateFn = setSelectedRows.mock.calls[1][0];
		result = updateFn(selectedRows);

		// The selection should maintain size but strictly reference the RESTORED data instance
		expect(result).toEqual([{ id: "1", name: "A" }]);
		expect(result[0]).toBe(restoredRowData[0]);
		expect(result[0]).not.toBe(selectedRows[0]); // Prove stale object is discarded
	});

	it("unrelated mutation pending: does not block pruning", () => {
		const rowData: TestRow[] = [{ id: "1", name: "A" }];
		const selectedRows: TestRow[] = [{ id: "1", name: "A" }];
		const setSelectedRows = vi.fn();

		// A mutation is running, but on the "main" stage rather than "orders".
		mockUseIsMutating.mockImplementation(
			(options: { mutationKey: string[] }) => {
				if (
					options.mutationKey[0] === "bulk-update-stage" &&
					options.mutationKey[1] === "main"
				)
					return 1;
				return 0; // The hook looking for ["bulk-update-stage", "orders"] will get 0
			},
		);

		const { rerender } = renderHook(
			(props) =>
				useSelectedRowsSync(
					"orders",
					props.rowData,
					props.selectedRows,
					setSelectedRows,
				),
			{
				initialProps: { rowData, selectedRows },
			},
		);

		rerender({ rowData: [], selectedRows });

		expect(setSelectedRows).toHaveBeenCalledTimes(1);
		const updateFn = setSelectedRows.mock.calls[0][0];
		const result = updateFn(selectedRows);

		// Because the mutation was on a different stage, this row should be correctly pruned
		expect(result).toEqual([]);
	});
});
