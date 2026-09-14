import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMainSheetPageActions } from "@/app/(app)/main-sheet/useMainSheetPageActions";
import {
	buildBookingCommands,
	buildReorderCommands,
	buildSendToArchiveCommands,
} from "@/lib/orderStageTransitions";
import type { PendingRow } from "@/types";

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("@/lib/orderStageTransitions", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@/lib/orderStageTransitions")>();
	return {
		...actual,
		buildReorderCommands: vi.fn(actual.buildReorderCommands),
		buildBookingCommands: vi.fn(actual.buildBookingCommands),
		buildSendToArchiveCommands: vi.fn(actual.buildSendToArchiveCommands),
	};
});

const createRow = (overrides: Partial<PendingRow> = {}): PendingRow => ({
	id: crypto.randomUUID(),
	baseId: "B1",
	trackingId: "T1",
	customerName: "Test Customer",
	mobile: "123456789",
	parts: [],
	status: "Pending",
	rDate: "2024-01-01",
	requester: "Admin",
	acceptedBy: "Admin",
	sabNumber: "S1",
	model: "Clio",
	cntrRdg: 1000,
	repairSystem: "None",
	startWarranty: "",
	endWarranty: "",
	remainTime: "",
	partNumber: "P1",
	description: "Test Part",
	quantity: 1,
	vin: "VF1BB0A0F12345678",
	stage: "main",
	...overrides,
});

describe("useMainSheetPageActions", () => {
	const applyCommand = vi.fn();
	const setSelectedRows = vi.fn();

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
		vi.clearAllMocks();
		applyCommand.mockReturnValue(true);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("handleConfirmReorder", () => {
		it("rejects reorder when reason is empty or whitespace-only without calling applyCommand, setSelectedRows, or onComplete", async () => {
			const row = createRow();
			const onComplete = vi.fn();
			const { result } = renderHook(() =>
				useMainSheetPageActions({
					applyCommand,
					effectiveRows: [row],
					selectedRows: [row],
					setSelectedRows,
				}),
			);

			await act(async () => {
				await result.current.handleConfirmReorder("", onComplete);
			});

			expect(toast.error).toHaveBeenCalledWith(
				"Please provide a reason for reorder",
			);
			expect(applyCommand).not.toHaveBeenCalled();
			expect(setSelectedRows).not.toHaveBeenCalled();
			expect(onComplete).not.toHaveBeenCalled();

			vi.clearAllMocks();

			await act(async () => {
				await result.current.handleConfirmReorder("   ", onComplete);
			});

			expect(toast.error).toHaveBeenCalledWith(
				"Please provide a reason for reorder",
			);
			expect(applyCommand).not.toHaveBeenCalled();
			expect(setSelectedRows).not.toHaveBeenCalled();
			expect(onComplete).not.toHaveBeenCalled();
		});

		it("reorders rows individually, clears selection, calls onComplete, and toasts with correct order", async () => {
			const row1 = createRow({ id: crypto.randomUUID() });
			const row2 = createRow({ id: crypto.randomUUID() });
			const selected = [row1, row2];
			const onComplete = vi.fn();

			const { result } = renderHook(() =>
				useMainSheetPageActions({
					applyCommand,
					effectiveRows: selected,
					selectedRows: selected,
					setSelectedRows,
				}),
			);

			await act(async () => {
				await result.current.handleConfirmReorder("Damaged item", onComplete);
			});

			expect(buildReorderCommands).toHaveBeenCalledTimes(1);
			expect(buildReorderCommands).toHaveBeenCalledWith(
				selected,
				"main",
				"Damaged item",
			);

			expect(applyCommand).toHaveBeenCalledTimes(selected.length);
			for (const call of applyCommand.mock.calls) {
				expect(call[0]).toMatchObject({
					type: "patchRow",
					sourceStage: "main",
					destinationStage: "orders",
				});
			}

			expect(setSelectedRows).toHaveBeenCalledWith([]);
			expect(onComplete).toHaveBeenCalledTimes(1);
			expect(toast.success).toHaveBeenCalledWith(
				"2 row(s) sent back to Orders (Reorder)",
			);

			// Preserved order: applyCommand -> setSelectedRows -> onComplete -> toast.success
			const lastApply = Math.max(...applyCommand.mock.invocationCallOrder);
			const setSel = setSelectedRows.mock.invocationCallOrder[0];
			const complete = onComplete.mock.invocationCallOrder[0];
			const toastSuccess = vi.mocked(toast.success).mock.invocationCallOrder[0];

			expect(lastApply).toBeLessThan(setSel);
			expect(setSel).toBeLessThan(complete);
			expect(complete).toBeLessThan(toastSuccess);
		});
	});

	describe("handleConfirmBooking", () => {
		it("replays buildBookingCommands output, clears selection, and toasts success", async () => {
			const row1 = createRow({ id: crypto.randomUUID() });
			const row2 = createRow({ id: crypto.randomUUID() });
			const selected = [row1, row2];

			const { result } = renderHook(() =>
				useMainSheetPageActions({
					applyCommand,
					effectiveRows: selected,
					selectedRows: selected,
					setSelectedRows,
				}),
			);

			await act(async () => {
				await result.current.handleConfirmBooking(
					"2026-02-15",
					"Customer requested booking",
					"Confirmed",
				);
			});

			expect(buildBookingCommands).toHaveBeenCalledTimes(1);
			expect(buildBookingCommands).toHaveBeenCalledWith(
				selected,
				"main",
				"2026-02-15",
				"Customer requested booking",
				"Confirmed",
			);

			expect(applyCommand).toHaveBeenCalledTimes(selected.length);
			for (const call of applyCommand.mock.calls) {
				expect(call[0]).toMatchObject({
					type: "patchRow",
					sourceStage: "main",
					destinationStage: "booking",
				});
			}

			expect(setSelectedRows).toHaveBeenCalledWith([]);
			expect(toast.success).toHaveBeenCalledWith("2 row(s) sent to Booking");

			const lastApply = Math.max(...applyCommand.mock.invocationCallOrder);
			const setSel = setSelectedRows.mock.invocationCallOrder[0];
			const toastSuccess = vi.mocked(toast.success).mock.invocationCallOrder[0];

			expect(lastApply).toBeLessThan(setSel);
			expect(setSel).toBeLessThan(toastSuccess);
		});
	});

	describe("handleSendToCallList", () => {
		it("no-ops when selectedRows is empty", async () => {
			const { result } = renderHook(() =>
				useMainSheetPageActions({
					applyCommand,
					effectiveRows: [],
					selectedRows: [],
					setSelectedRows,
				}),
			);

			await act(async () => {
				await result.current.handleSendToCallList();
			});

			expect(applyCommand).not.toHaveBeenCalled();
			expect(setSelectedRows).not.toHaveBeenCalled();
			expect(toast.success).not.toHaveBeenCalled();
		});

		it("moves selected rows to call list, clears selection, and toasts success", async () => {
			const uuid1 = crypto.randomUUID();
			const uuid2 = crypto.randomUUID();
			const row1 = createRow({ id: uuid1 });
			const row2 = createRow({ id: uuid2 });
			const selected = [row1, row2];

			const { result } = renderHook(() =>
				useMainSheetPageActions({
					applyCommand,
					effectiveRows: selected,
					selectedRows: selected,
					setSelectedRows,
				}),
			);

			await act(async () => {
				await result.current.handleSendToCallList();
			});

			expect(applyCommand).toHaveBeenCalledTimes(1);
			expect(applyCommand).toHaveBeenCalledWith({
				type: "moveRows",
				ids: [uuid1, uuid2],
				sourceStage: "main",
				destinationStage: "call",
			});
			expect(setSelectedRows).toHaveBeenCalledWith([]);
			expect(toast.success).toHaveBeenCalledWith("2 item(s) sent to Call List");

			// Preserved order: applyCommand -> setSelectedRows -> toast.success
			const applyOrder = applyCommand.mock.invocationCallOrder[0];
			const setSel = setSelectedRows.mock.invocationCallOrder[0];
			const toastSuccess = vi.mocked(toast.success).mock.invocationCallOrder[0];

			expect(applyOrder).toBeLessThan(setSel);
			expect(setSel).toBeLessThan(toastSuccess);
		});
	});

	describe("handleConfirmDelete", () => {
		it("deletes selected rows in a single batch, clears selection, and toasts", async () => {
			const uuid1 = crypto.randomUUID();
			const uuid2 = crypto.randomUUID();
			const row1 = createRow({ id: uuid1 });
			const row2 = createRow({ id: uuid2 });
			const selected = [row1, row2];

			const { result } = renderHook(() =>
				useMainSheetPageActions({
					applyCommand,
					effectiveRows: selected,
					selectedRows: selected,
					setSelectedRows,
				}),
			);

			await act(async () => {
				await result.current.handleConfirmDelete();
			});

			expect(applyCommand).toHaveBeenCalledTimes(1);
			expect(applyCommand).toHaveBeenCalledWith({
				type: "deleteRows",
				ids: [uuid1, uuid2],
			});
			expect(setSelectedRows).toHaveBeenCalledWith([]);
			expect(toast.success).toHaveBeenCalledWith("Row(s) deleted");

			// Preserved order: applyCommand -> setSelectedRows -> toast.success
			const applyOrder = applyCommand.mock.invocationCallOrder[0];
			const setSel = setSelectedRows.mock.invocationCallOrder[0];
			const toastSuccess = vi.mocked(toast.success).mock.invocationCallOrder[0];

			expect(applyOrder).toBeLessThan(setSel);
			expect(setSel).toBeLessThan(toastSuccess);
		});
	});

	describe("handleUpdateOrder", () => {
		it("dispatches patchRow command targeting main stage and resolves", async () => {
			const row = createRow();
			const { result } = renderHook(() =>
				useMainSheetPageActions({
					applyCommand,
					effectiveRows: [row],
					selectedRows: [row],
					setSelectedRows,
				}),
			);

			let resolvedValue: unknown;
			await act(async () => {
				resolvedValue = await result.current.handleUpdateOrder(row.id, {
					customerName: "New Name",
				});
			});

			expect(resolvedValue).toBeUndefined();
			expect(applyCommand).toHaveBeenCalledTimes(1);
			expect(applyCommand).toHaveBeenCalledWith({
				type: "patchRow",
				id: row.id,
				sourceStage: "main",
				destinationStage: "main",
				updates: { customerName: "New Name" },
				previousValues: {},
			});
		});
	});

	describe("handleSendToArchive", () => {
		it("preserves ID ordering and silently drops unknown IDs when archiving", () => {
			const row1 = createRow({ id: crypto.randomUUID() });
			const row2 = createRow({ id: crypto.randomUUID() });
			const row3 = createRow({ id: crypto.randomUUID() });
			const unknownId = crypto.randomUUID();

			const { result } = renderHook(() =>
				useMainSheetPageActions({
					applyCommand,
					effectiveRows: [row1, row2, row3],
					selectedRows: [],
					setSelectedRows,
				}),
			);

			act(() => {
				result.current.handleSendToArchive(
					[row3.id, unknownId, row1.id],
					"Scrapped",
				);
			});

			expect(applyCommand).toHaveBeenCalledTimes(2);
			expect(applyCommand).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({
					id: row3.id,
					sourceStage: "main",
					destinationStage: "archive",
					updates: expect.objectContaining({
						status: "Archived",
						archiveReason: "Scrapped",
						archivedAt: "2026-01-01T00:00:00.000Z",
					}),
				}),
			);
			expect(applyCommand).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					id: row1.id,
					sourceStage: "main",
					destinationStage: "archive",
					updates: expect.objectContaining({
						status: "Archived",
						archiveReason: "Scrapped",
						archivedAt: "2026-01-01T00:00:00.000Z",
					}),
				}),
			);
		});

		it("resolves rows from refreshed effectiveRows after rerender", () => {
			const rowA = createRow({ id: crypto.randomUUID() });
			const rowB = createRow({ id: crypto.randomUUID() });

			const { result, rerender } = renderHook(
				({ rows }) =>
					useMainSheetPageActions({
						applyCommand,
						effectiveRows: rows,
						selectedRows: [],
						setSelectedRows,
					}),
				{ initialProps: { rows: [rowA] } },
			);

			// rowB is not in initial rows, so it should be dropped
			act(() => {
				result.current.handleSendToArchive([rowB.id], "Initial attempt");
			});
			expect(applyCommand).not.toHaveBeenCalled();

			// Rerender with refreshed rows containing rowB
			rerender({ rows: [rowA, rowB] });

			act(() => {
				result.current.handleSendToArchive([rowB.id], "After rerender");
			});

			expect(applyCommand).toHaveBeenCalledTimes(1);
			expect(applyCommand).toHaveBeenCalledWith(
				expect.objectContaining({
					id: rowB.id,
					sourceStage: "main",
					destinationStage: "archive",
					updates: expect.objectContaining({
						archiveReason: "After rerender",
					}),
				}),
			);
		});
	});

	describe("handleUpdatePartStatus", () => {
		it("no-ops when selectedRows is empty", async () => {
			const { result } = renderHook(() =>
				useMainSheetPageActions({
					applyCommand,
					effectiveRows: [],
					selectedRows: [],
					setSelectedRows,
				}),
			);

			await act(async () => {
				await result.current.handleUpdatePartStatus("Reserve");
			});

			expect(applyCommand).not.toHaveBeenCalled();
			expect(toast.success).not.toHaveBeenCalled();
		});

		it("updates part status with previousValues containing each row's previous status and no moveRows when VIN arrival is not triggered", async () => {
			const row1 = createRow({
				id: crypto.randomUUID(),
				status: "Pending",
				vin: "VF1BB0A0F12345671",
			});
			const row2 = createRow({
				id: crypto.randomUUID(),
				status: "Ordered",
				vin: "VF1BB0A0F12345672",
			});
			const selected = [row1, row2];

			const { result } = renderHook(() =>
				useMainSheetPageActions({
					applyCommand,
					effectiveRows: selected,
					selectedRows: selected,
					setSelectedRows,
				}),
			);

			await act(async () => {
				await result.current.handleUpdatePartStatus("Reserve");
			});

			expect(applyCommand).toHaveBeenCalledTimes(2);
			expect(applyCommand).toHaveBeenNthCalledWith(1, {
				type: "patchRow",
				id: row1.id,
				sourceStage: "main",
				destinationStage: "main",
				updates: { status: "Reserve" },
				previousValues: { status: "Pending" },
			});
			expect(applyCommand).toHaveBeenNthCalledWith(2, {
				type: "patchRow",
				id: row2.id,
				sourceStage: "main",
				destinationStage: "main",
				updates: { status: "Reserve" },
				previousValues: { status: "Ordered" },
			});

			// No moveRows command
			for (const call of applyCommand.mock.calls) {
				expect(call[0].type).toBe("patchRow");
			}

			expect(toast.success).toHaveBeenCalledTimes(1);
			expect(toast.success).toHaveBeenCalledWith(
				'Part status updated to "Reserve"',
			);
		});

		it("triggers VIN auto-move to Call List when all parts for a VIN reach Arrived status", async () => {
			const vin = "VF1BB0A0F12345678";
			const uuid1 = crypto.randomUUID();
			const uuid2 = crypto.randomUUID();

			// row1 already arrived in main stage
			const row1 = createRow({
				id: uuid1,
				vin,
				stage: "main",
				status: "Arrived",
			});
			// row2 is currently pending in main stage and will be updated to Arrived
			const row2 = createRow({
				id: uuid2,
				vin,
				stage: "main",
				status: "Pending",
			});

			const effectiveRows = [row1, row2];
			const selectedRows = [row2];

			const { result } = renderHook(() =>
				useMainSheetPageActions({
					applyCommand,
					effectiveRows,
					selectedRows,
					setSelectedRows,
				}),
			);

			await act(async () => {
				await result.current.handleUpdatePartStatus("Arrived");
			});

			// 1. patchRow command for row2
			expect(applyCommand).toHaveBeenNthCalledWith(1, {
				type: "patchRow",
				id: uuid2,
				sourceStage: "main",
				destinationStage: "main",
				updates: { status: "Arrived" },
				previousValues: { status: "Pending" },
			});

			// 2. moveRows command for all rows of the completed VIN
			expect(applyCommand).toHaveBeenNthCalledWith(2, {
				type: "moveRows",
				ids: [uuid1, uuid2],
				sourceStage: "main",
				destinationStage: "call",
				guardFrozenVins: true,
			});

			// 3. Per-VIN toast with duration 5000
			expect(toast.success).toHaveBeenNthCalledWith(
				1,
				`All parts for VIN ${vin} arrived! Moved to Call List.`,
				{ duration: 5000 },
			);

			// 4. Final toast
			expect(toast.success).toHaveBeenNthCalledWith(
				2,
				'Part status updated to "Arrived"',
			);

			// Invocation order: patchRow -> moveRows -> per-VIN toast -> final toast
			const patchOrder = applyCommand.mock.invocationCallOrder[0];
			const moveOrder = applyCommand.mock.invocationCallOrder[1];
			const vinToastOrder = vi.mocked(toast.success).mock
				.invocationCallOrder[0];
			const finalToastOrder = vi.mocked(toast.success).mock
				.invocationCallOrder[1];

			expect(patchOrder).toBeLessThan(moveOrder);
			expect(moveOrder).toBeLessThan(vinToastOrder);
			expect(vinToastOrder).toBeLessThan(finalToastOrder);
		});

		it("does not auto-move if some parts for the VIN remain non-arrived", async () => {
			const vin = "VF1BB0A0F12345678";
			const uuid1 = crypto.randomUUID();
			const uuid2 = crypto.randomUUID();
			const uuid3 = crypto.randomUUID();

			// row1 and row2 are pending, row3 is pending
			const row1 = createRow({
				id: uuid1,
				vin,
				stage: "main",
				status: "Pending",
			});
			const row2 = createRow({
				id: uuid2,
				vin,
				stage: "main",
				status: "Pending",
			});
			const row3 = createRow({
				id: uuid3,
				vin,
				stage: "main",
				status: "Pending",
			});

			const effectiveRows = [row1, row2, row3];
			// Only row1 is selected to be marked Arrived, leaving row2 and row3 Pending
			const selectedRows = [row1];

			const { result } = renderHook(() =>
				useMainSheetPageActions({
					applyCommand,
					effectiveRows,
					selectedRows,
					setSelectedRows,
				}),
			);

			await act(async () => {
				await result.current.handleUpdatePartStatus("Arrived");
			});

			expect(applyCommand).toHaveBeenCalledTimes(1);
			expect(applyCommand).toHaveBeenCalledWith({
				type: "patchRow",
				id: uuid1,
				sourceStage: "main",
				destinationStage: "main",
				updates: { status: "Arrived" },
				previousValues: { status: "Pending" },
			});

			expect(toast.success).toHaveBeenCalledTimes(1);
			expect(toast.success).toHaveBeenCalledWith(
				'Part status updated to "Arrived"',
			);
		});
	});

	describe("builder delegation", () => {
		it("explicitly delegates to real builder functions (buildReorderCommands, buildBookingCommands, buildSendToArchiveCommands) with expected arguments", async () => {
			const row = createRow({
				id: crypto.randomUUID(),
			});
			const onComplete = vi.fn();

			const { result } = renderHook(() =>
				useMainSheetPageActions({
					applyCommand,
					effectiveRows: [row],
					selectedRows: [row],
					setSelectedRows,
				}),
			);

			// 1. buildReorderCommands delegation
			await act(async () => {
				await result.current.handleConfirmReorder("Defective part", onComplete);
			});
			expect(vi.mocked(buildReorderCommands)).toHaveBeenCalledWith(
				[row],
				"main",
				"Defective part",
			);

			// 2. buildBookingCommands delegation
			await act(async () => {
				await result.current.handleConfirmBooking(
					"2026-02-10",
					"Customer confirmed",
					"Confirmed",
				);
			});
			expect(vi.mocked(buildBookingCommands)).toHaveBeenCalledWith(
				[row],
				"main",
				"2026-02-10",
				"Customer confirmed",
				"Confirmed",
			);

			// 3. buildSendToArchiveCommands delegation
			act(() => {
				result.current.handleSendToArchive([row.id], "Customer cancelled");
			});
			expect(vi.mocked(buildSendToArchiveCommands)).toHaveBeenCalledWith(
				[row],
				"Customer cancelled",
				"main",
			);
		});
	});
});
