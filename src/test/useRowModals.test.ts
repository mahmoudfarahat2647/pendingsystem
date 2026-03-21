import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRowModals } from "@/hooks/useRowModals";
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
			await result.current.saveAttachment({
				attachmentFilePath: "orders/test-row-123/file.pdf",
			});
		});

		expect(mockOnUpdate).toHaveBeenCalledWith(
			"test-row-123",
			{
				attachmentLink: undefined,
				attachmentFilePath: "orders/test-row-123/file.pdf",
				hasAttachment: true,
			},
			"call",
		);
	});

	it("normalizes display-label stages when saving a single-row archive", () => {
		const row = createRow({ stage: "Main Sheet" });
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
});
