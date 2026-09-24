import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBookingPageActions } from "@/app/(app)/booking/useBookingPageActions";
import {
	buildRebookingCommands,
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
		buildRebookingCommands: vi.fn(actual.buildRebookingCommands),
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
	stage: "booking",
	...overrides,
});

describe("useBookingPageActions", () => {
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
				useBookingPageActions({
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
				useBookingPageActions({
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
				"booking",
				"Damaged item",
			);

			expect(applyCommand).toHaveBeenCalledTimes(selected.length);
			for (const call of applyCommand.mock.calls) {
				expect(call[0]).toMatchObject({
					type: "patchRow",
					sourceStage: "booking",
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

	describe("handleConfirmRebooking", () => {
		it("no-ops for rebooking when selectedRows is empty", async () => {
			const onComplete = vi.fn();
			const { result } = renderHook(() =>
				useBookingPageActions({
					applyCommand,
					effectiveRows: [],
					selectedRows: [],
					setSelectedRows,
				}),
			);

			await act(async () => {
				await result.current.handleConfirmRebooking(
					"2026-02-01",
					"Rescheduled",
					"Confirmed",
					onComplete,
				);
			});

			expect(applyCommand).not.toHaveBeenCalled();
			expect(buildRebookingCommands).not.toHaveBeenCalled();
			expect(onComplete).not.toHaveBeenCalled();
			expect(setSelectedRows).not.toHaveBeenCalled();
			expect(toast.success).not.toHaveBeenCalled();
		});

		it("reschedules bookings, calls onComplete BEFORE setSelectedRows, and toasts success", async () => {
			const row1 = createRow({
				id: crypto.randomUUID(),
				bookingDate: "2026-01-10",
			});
			const row2 = createRow({
				id: crypto.randomUUID(),
				bookingDate: "2026-01-12",
			});
			const selected = [row1, row2];
			const onComplete = vi.fn();

			const { result } = renderHook(() =>
				useBookingPageActions({
					applyCommand,
					effectiveRows: selected,
					selectedRows: selected,
					setSelectedRows,
				}),
			);

			await act(async () => {
				await result.current.handleConfirmRebooking(
					"2026-02-15",
					"Customer requested delay",
					"Scheduled",
					onComplete,
				);
			});

			expect(buildRebookingCommands).toHaveBeenCalledWith(
				selected,
				"2026-02-15",
				"Customer requested delay",
				"Scheduled",
			);

			expect(applyCommand).toHaveBeenCalledTimes(2);
			expect(setSelectedRows).toHaveBeenCalledWith([]);
			expect(toast.success).toHaveBeenCalledWith(
				"Rescheduled 2 booking(s) successfully",
			);

			// Preserved order: applyCommand -> onComplete BEFORE setSelectedRows -> toast.success
			const lastApply = Math.max(...applyCommand.mock.invocationCallOrder);
			const complete = onComplete.mock.invocationCallOrder[0];
			const setSel = setSelectedRows.mock.invocationCallOrder[0];
			const toastSuccess = vi.mocked(toast.success).mock.invocationCallOrder[0];

			expect(lastApply).toBeLessThan(complete);
			expect(complete).toBeLessThan(setSel);
			expect(setSel).toBeLessThan(toastSuccess);
		});
	});

	describe("handleUpdatePartStatus", () => {
		it("updates part status for all selected rows with individual patchRow commands", () => {
			const row1 = createRow({ id: crypto.randomUUID() });
			const row2 = createRow({ id: crypto.randomUUID() });
			const selected = [row1, row2];

			const { result } = renderHook(() =>
				useBookingPageActions({
					applyCommand,
					effectiveRows: selected,
					selectedRows: selected,
					setSelectedRows,
				}),
			);

			act(() => {
				result.current.handleUpdatePartStatus("Reserve");
			});

			expect(applyCommand).toHaveBeenCalledTimes(2);
			expect(applyCommand).toHaveBeenNthCalledWith(1, {
				type: "patchRow",
				id: row1.id,
				sourceStage: "booking",
				destinationStage: "booking",
				updates: { status: "Reserve" },
				previousValues: {},
			});
			expect(applyCommand).toHaveBeenNthCalledWith(2, {
				type: "patchRow",
				id: row2.id,
				sourceStage: "booking",
				destinationStage: "booking",
				updates: { status: "Reserve" },
				previousValues: {},
			});
			expect(toast.success).toHaveBeenCalledWith(
				"Updated 2 item(s) to Reserve",
			);
		});

		it("no-ops for handleUpdatePartStatus when selectedRows is empty", () => {
			const { result } = renderHook(() =>
				useBookingPageActions({
					applyCommand,
					effectiveRows: [],
					selectedRows: [],
					setSelectedRows,
				}),
			);

			act(() => {
				result.current.handleUpdatePartStatus("Reserve");
			});

			expect(applyCommand).not.toHaveBeenCalled();
			expect(toast.success).not.toHaveBeenCalled();
		});
	});

	describe("handleConfirmDelete", () => {
		it("deletes selected rows in a single batch, clears selection, toasts, and calls onComplete last", async () => {
			const uuid1 = crypto.randomUUID();
			const uuid2 = crypto.randomUUID();
			const row1 = createRow({ id: uuid1 });
			const row2 = createRow({ id: uuid2 });
			const selected = [row1, row2];
			const onComplete = vi.fn();

			const { result } = renderHook(() =>
				useBookingPageActions({
					applyCommand,
					effectiveRows: selected,
					selectedRows: selected,
					setSelectedRows,
				}),
			);

			await act(async () => {
				await result.current.handleConfirmDelete(onComplete);
			});

			expect(applyCommand).toHaveBeenCalledTimes(1);
			expect(applyCommand).toHaveBeenCalledWith({
				type: "deleteRows",
				ids: [uuid1, uuid2],
			});
			expect(setSelectedRows).toHaveBeenCalledWith([]);
			expect(toast.success).toHaveBeenCalledWith("Booking(s) deleted");
			expect(onComplete).toHaveBeenCalledTimes(1);

			// Preserved order: applyCommand -> setSelectedRows -> toast.success -> onComplete (last)
			const applyOrder = applyCommand.mock.invocationCallOrder[0];
			const setSel = setSelectedRows.mock.invocationCallOrder[0];
			const toastSuccess = vi.mocked(toast.success).mock.invocationCallOrder[0];
			const complete = onComplete.mock.invocationCallOrder[0];

			expect(applyOrder).toBeLessThan(setSel);
			expect(setSel).toBeLessThan(toastSuccess);
			expect(toastSuccess).toBeLessThan(complete);
		});
	});

	describe("handleUpdateOrder", () => {
		it("dispatches patchRow command targeting booking stage and resolves", async () => {
			const row = createRow();
			const { result } = renderHook(() =>
				useBookingPageActions({
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
				sourceStage: "booking",
				destinationStage: "booking",
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
				useBookingPageActions({
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
					sourceStage: "booking",
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
					sourceStage: "booking",
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
					useBookingPageActions({
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
					sourceStage: "booking",
					destinationStage: "archive",
					updates: expect.objectContaining({
						archiveReason: "After rerender",
					}),
				}),
			);
		});
	});

	describe("builder delegation", () => {
		it("explicitly delegates to real builder functions (buildReorderCommands, buildRebookingCommands, buildSendToArchiveCommands) with expected arguments", async () => {
			const row = createRow({
				id: crypto.randomUUID(),
				bookingDate: "2026-01-05",
			});
			const onComplete = vi.fn();

			const { result } = renderHook(() =>
				useBookingPageActions({
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
				"booking",
				"Defective part",
			);

			// 2. buildRebookingCommands delegation
			await act(async () => {
				await result.current.handleConfirmRebooking(
					"2026-02-10",
					"Pushed back",
					"Pending",
					onComplete,
				);
			});
			expect(vi.mocked(buildRebookingCommands)).toHaveBeenCalledWith(
				[row],
				"2026-02-10",
				"Pushed back",
				"Pending",
			);

			// 3. buildSendToArchiveCommands delegation
			act(() => {
				result.current.handleSendToArchive([row.id], "Customer cancelled");
			});
			expect(vi.mocked(buildSendToArchiveCommands)).toHaveBeenCalledWith(
				[row],
				"Customer cancelled",
				"booking",
			);
		});
	});

	describe("handleConfirmMoveToMain", () => {
		it("applies one booking→main patchRow per selected row, clears the selection, and toasts", () => {
			const rows = [
				createRow({ stage: "booking" }),
				createRow({ stage: "booking" }),
			];
			const { result } = renderHook(() =>
				useBookingPageActions({
					applyCommand,
					effectiveRows: rows,
					selectedRows: rows,
					setSelectedRows,
				}),
			);

			act(() => {
				result.current.handleConfirmMoveToMain();
			});

			expect(applyCommand).toHaveBeenCalledTimes(2);
			for (const [i, row] of rows.entries()) {
				expect(applyCommand).toHaveBeenNthCalledWith(
					i + 1,
					expect.objectContaining({
						type: "patchRow",
						id: row.id,
						sourceStage: "booking",
						destinationStage: "main",
					}),
				);
			}
			expect(setSelectedRows).toHaveBeenCalledWith([]);
			expect(toast.success).toHaveBeenCalledWith(
				"2 line(s) moved to Main Sheet",
			);
		});

		it("does nothing with an empty selection", () => {
			const { result } = renderHook(() =>
				useBookingPageActions({
					applyCommand,
					effectiveRows: [],
					selectedRows: [],
					setSelectedRows,
				}),
			);

			act(() => {
				result.current.handleConfirmMoveToMain();
			});

			expect(applyCommand).not.toHaveBeenCalled();
			expect(setSelectedRows).not.toHaveBeenCalled();
		});
	});
});
