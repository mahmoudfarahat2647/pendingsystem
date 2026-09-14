import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvalidOrderStageError } from "@/domain/order/orderStage";
import { resolveRowStage, useRowModals } from "@/hooks/useRowModals";
import type { PendingRow } from "@/types";

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

const createRow = (overrides: Partial<PendingRow> = {}): PendingRow =>
	({
		id: "test-row-123",
		actionNote: "initial note",
		vin: "VIN123456789",
		customerName: "Test Customer",
		stage: "orders",
		...overrides,
	}) as PendingRow;

describe("useRowModals Stage Routing", () => {
	const mockOnUpdate = vi.fn();
	const mockOnArchive = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		mockOnUpdate.mockResolvedValue({ success: true });
	});

	it("routes note saves through the current row stage instead of the source tag", async () => {
		const row = createRow({ stage: "main" });
		const { result } = renderHook(() =>
			useRowModals(mockOnUpdate, mockOnArchive),
		);

		act(() => {
			result.current.handleNoteClick(row, "Main Sheet");
		});

		await act(async () => {
			await result.current.saveNote("Updated test note");
		});

		expect(mockOnUpdate).toHaveBeenCalledWith(
			"test-row-123",
			{ noteHistory: "Updated test note" },
			"main",
		);
	});

	it("routes reminder saves through the current row stage when no source tag was ever set", () => {
		const row = createRow({ stage: "call" });
		const { result } = renderHook(() =>
			useRowModals(mockOnUpdate, mockOnArchive),
		);

		act(() => {
			result.current.handleReminderClick(row);
		});

		const reminderData = {
			date: "2024-05-20",
			time: "10:00",
			subject: "Test Call",
		};

		act(() => {
			result.current.saveReminder(reminderData);
		});

		expect(mockOnUpdate).toHaveBeenCalledWith(
			"test-row-123",
			{ reminder: reminderData },
			"call",
		);
	});

	it("routes attachment saves through the current row stage instead of the source tag", async () => {
		const row = createRow({ stage: "call" });
		const { result } = renderHook(() =>
			useRowModals(mockOnUpdate, mockOnArchive),
		);

		act(() => {
			result.current.handleAttachClick(row, "Archive");
		});

		await act(async () => {
			await result.current.saveAttachment(["orders/test-row-123/file.pdf"], "");
		});

		expect(mockOnUpdate).toHaveBeenCalledWith(
			"test-row-123",
			{
				attachmentFilePaths: ["orders/test-row-123/file.pdf"],
				attachmentFilePath: "",
				attachmentLink: "",
				hasAttachment: true,
			},
			"call",
		);
	});

	it("archives a row from main stage with correct stage argument", () => {
		const row = createRow({ stage: "main" });
		const { result } = renderHook(() => useRowModals(mockOnUpdate, undefined));

		act(() => {
			result.current.handleArchiveClick(row);
		});

		act(() => {
			result.current.saveArchive("Completed repair");
		});

		expect(mockOnUpdate).toHaveBeenCalledWith(
			"test-row-123",
			expect.objectContaining({
				status: "Archived",
				archiveReason: "Completed repair",
				noteHistory: expect.stringContaining("Completed repair"),
			}),
			"main",
		);
	});

	describe("freeze stage regression tests", () => {
		it("routes note saves through freeze stage for frozen rows", async () => {
			const row = createRow({ stage: "freeze" });
			const { result } = renderHook(() =>
				useRowModals(mockOnUpdate, mockOnArchive),
			);

			act(() => {
				result.current.handleNoteClick(row);
			});

			await act(async () => {
				await result.current.saveNote("Freeze note update");
			});

			expect(mockOnUpdate).toHaveBeenCalledWith(
				"test-row-123",
				{ noteHistory: "Freeze note update" },
				"freeze",
			);
			expect(mockOnUpdate).not.toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				"main",
			);
		});

		it("routes reminder saves through freeze stage for frozen rows", () => {
			const row = createRow({ stage: "freeze" });
			const { result } = renderHook(() =>
				useRowModals(mockOnUpdate, mockOnArchive),
			);

			act(() => {
				result.current.handleReminderClick(row);
			});

			const reminderData = {
				date: "2026-10-01",
				time: "09:00",
				subject: "Check frozen part",
			};

			act(() => {
				result.current.saveReminder(reminderData);
			});

			expect(mockOnUpdate).toHaveBeenCalledWith(
				"test-row-123",
				{ reminder: reminderData },
				"freeze",
			);
			expect(mockOnUpdate).not.toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				"main",
			);
		});

		it("routes attachment saves through freeze stage for frozen rows", async () => {
			const row = createRow({ stage: "freeze" });
			const { result } = renderHook(() =>
				useRowModals(mockOnUpdate, mockOnArchive),
			);

			act(() => {
				result.current.handleAttachClick(row);
			});

			await act(async () => {
				await result.current.saveAttachment(
					["freeze/test-row-123/spec.pdf"],
					"",
				);
			});

			expect(mockOnUpdate).toHaveBeenCalledWith(
				"test-row-123",
				{
					attachmentFilePaths: ["freeze/test-row-123/spec.pdf"],
					attachmentFilePath: "",
					attachmentLink: "",
					hasAttachment: true,
				},
				"freeze",
			);
			expect(mockOnUpdate).not.toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				"main",
			);
		});

		it("routes archive saves through freeze stage for frozen rows", () => {
			const row = createRow({ stage: "freeze" });
			const { result } = renderHook(() =>
				useRowModals(mockOnUpdate, undefined),
			);

			act(() => {
				result.current.handleArchiveClick(row);
			});

			act(() => {
				result.current.saveArchive("Permanent hold expired");
			});

			expect(mockOnUpdate).toHaveBeenCalledWith(
				"test-row-123",
				expect.objectContaining({
					status: "Archived",
					archiveReason: "Permanent hold expired",
				}),
				"freeze",
			);
			expect(mockOnUpdate).not.toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				"main",
			);
		});
	});

	describe("freeze reason modal flow", () => {
		it("opens the freeze modal and delegates saveFreeze to onFreeze with target ids", () => {
			const mockOnFreeze = vi.fn();
			const row = createRow({ stage: "call" });
			const { result } = renderHook(() =>
				useRowModals(mockOnUpdate, mockOnArchive, mockOnFreeze),
			);

			act(() => {
				result.current.handleFreezeClick(row, ["id-a", "id-b"]);
			});

			expect(result.current.activeModal).toBe("freeze");

			act(() => {
				result.current.saveFreeze("Waiting on parts");
			});

			expect(mockOnFreeze).toHaveBeenCalledWith(
				["id-a", "id-b"],
				"Waiting on parts",
			);
			expect(mockOnUpdate).not.toHaveBeenCalled();
			expect(result.current.activeModal).toBeNull();
		});

		it("falls back to a single-row freeze patch when no onFreeze handler is wired", () => {
			const row = createRow({ stage: "call" });
			const { result } = renderHook(() =>
				useRowModals(mockOnUpdate, mockOnArchive),
			);

			act(() => {
				result.current.handleFreezeClick(row);
			});

			act(() => {
				result.current.saveFreeze("Customer asked to hold");
			});

			expect(mockOnUpdate).toHaveBeenCalledWith(
				"test-row-123",
				expect.objectContaining({
					stage: "freeze",
					previousStage: "call",
					freezeReason: "Customer asked to hold",
				}),
				"call",
			);
		});
	});

	describe("unknown stage fallback rejection", () => {
		it("fails loudly when row has an undefined stage instead of defaulting to main", () => {
			const row = createRow({ stage: undefined });
			const { result } = renderHook(() =>
				useRowModals(mockOnUpdate, mockOnArchive),
			);

			act(() => {
				result.current.handleReminderClick(row);
			});

			expect(() => {
				result.current.saveReminder({
					date: "2026-10-01",
					time: "09:00",
					subject: "Test",
				});
			}).toThrow(InvalidOrderStageError);

			expect(mockOnUpdate).not.toHaveBeenCalled();
		});

		it("never updates row or defaults to main when saving note on row with undefined stage", async () => {
			const row = createRow({ stage: undefined });
			const { result } = renderHook(() =>
				useRowModals(mockOnUpdate, mockOnArchive),
			);

			act(() => {
				result.current.handleNoteClick(row);
			});

			await act(async () => {
				await result.current.saveNote("Some note");
			});

			expect(mockOnUpdate).not.toHaveBeenCalled();
		});

		it("never updates row or defaults to main when saving attachment on row with undefined stage", async () => {
			const row = createRow({ stage: undefined });
			const { result } = renderHook(() =>
				useRowModals(mockOnUpdate, mockOnArchive),
			);

			act(() => {
				result.current.handleAttachClick(row);
			});

			await act(async () => {
				await result.current.saveAttachment(["test.pdf"], "");
			});

			expect(mockOnUpdate).not.toHaveBeenCalled();
		});

		it("fails loudly when row is null instead of defaulting to main", () => {
			expect(() => resolveRowStage(null)).toThrow(InvalidOrderStageError);
		});

		it("fails loudly when stage is unrecognized instead of defaulting to main", () => {
			const invalidRow = {
				...createRow(),
				stage: "unknown_stage" as unknown as PendingRow["stage"],
			};
			expect(() => resolveRowStage(invalidRow)).toThrow(InvalidOrderStageError);
		});
	});
});
