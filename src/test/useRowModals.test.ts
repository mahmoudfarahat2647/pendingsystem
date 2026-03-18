import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRowModals } from "@/hooks/useRowModals";
import type { PendingRow } from "@/types";

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Mock dynamic import for sonner inside useRowModals
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("useRowModals Stage Routing", () => {
	const mockRow: PendingRow = {
		id: "test-row-123",
		actionNote: "initial note",
		vin: "VIN123456789",
		customerName: "Test Customer",
	} as any;

	const mockOnUpdate = vi.fn();
	const mockOnArchive = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		mockOnUpdate.mockResolvedValue({ success: true });
	});

	it("should pass sourceTag as stage when saveNote is called", async () => {
		const { result } = renderHook(() =>
			useRowModals(mockOnUpdate, mockOnArchive),
		);

		// Set the current row and sourceTag
		act(() => {
			result.current.handleNoteClick(mockRow, "Orders");
		});

		// Save the note
		await act(async () => {
			await result.current.saveNote("Updated test note");
		});

		// Verify onUpdate was called with the correct arguments including the stage
		expect(mockOnUpdate).toHaveBeenCalledWith(
			"test-row-123",
			{ actionNote: "Updated test note" },
			"Orders",
		);
	});

	it("should pass sourceTag as stage when saveReminder is called", async () => {
		const { result } = renderHook(() =>
			useRowModals(mockOnUpdate, mockOnArchive),
		);

		act(() => {
			// handleReminderClick doesn't currently accept a tag, but we can set it via handleNoteClick
			// or we can test if sourceTag persists
			result.current.handleNoteClick(mockRow, "Booking");
			result.current.handleReminderClick(mockRow);
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
			"Booking",
		);
	});

	it("should use the tag passed directly to handleAttachClick", async () => {
		const { result } = renderHook(() =>
			useRowModals(mockOnUpdate, mockOnArchive),
		);

		act(() => {
			result.current.handleAttachClick(mockRow, "Call");
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
			"Call",
		);
	});

	it("should NOT carry over stale sourceTag from a prior modal when handleAttachClick sets its own tag", async () => {
		const { result } = renderHook(() =>
			useRowModals(mockOnUpdate, mockOnArchive),
		);

		// First, open a note modal with "Orders" tag and close it
		act(() => {
			result.current.handleNoteClick(mockRow, "Orders");
		});
		act(() => {
			result.current.closeModal();
		});

		// Then open attachment modal for an "Archive" row — must NOT use "Orders"
		act(() => {
			result.current.handleAttachClick(mockRow, "Archive");
		});

		await act(async () => {
			await result.current.saveAttachment({
				attachmentFilePath: "x/y.pdf",
			});
		});

		expect(mockOnUpdate).toHaveBeenCalledWith(
			"test-row-123",
			expect.objectContaining({ attachmentFilePath: "x/y.pdf" }),
			"Archive", // must be Archive, not Orders
		);
	});

	it("should pass sourceTag as stage when saveArchive is called", async () => {
		const { result } = renderHook(() => useRowModals(mockOnUpdate, undefined));

		act(() => {
			result.current.handleNoteClick(mockRow, "Main Sheet");
			result.current.handleArchiveClick(mockRow);
		});

		act(() => {
			result.current.saveArchive("Completed repair");
		});

		// saveArchive constructs a combined note
		expect(mockOnUpdate).toHaveBeenCalledWith(
			"test-row-123",
			expect.objectContaining({
				status: "Archived",
				archiveReason: "Completed repair",
				actionNote: expect.stringContaining("Completed repair"),
			}),
			"Main Sheet",
		);
	});

	it("should use undefined stage when no sourceTag is provided", async () => {
		const { result } = renderHook(() =>
			useRowModals(mockOnUpdate, mockOnArchive),
		);

		act(() => {
			result.current.handleNoteClick(mockRow); // No tag
		});

		await act(async () => {
			await result.current.saveNote("No tag note");
		});

		expect(mockOnUpdate).toHaveBeenCalledWith(
			"test-row-123",
			{ actionNote: "No tag note" },
			undefined,
		);
	});
});
