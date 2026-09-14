import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFreezePageActions } from "@/app/(app)/freeze/useFreezePageActions";
import { PendingRowSchema } from "@/schemas/order.schema";
import type { PendingRow } from "@/types";

const frozenRow: PendingRow = PendingRowSchema.parse({
	id: "11111111-1111-4111-8111-111111111111",
	vin: "VF1BB0A0F12345678",
	customerName: "Test Customer",
	stage: "freeze",
	status: "Arrived",
	previousStage: "main",
	freezeReason: "Awaiting approval",
	frozenAt: "2026-09-10T10:00:00.000Z",
});

describe("useFreezePageActions", () => {
	it("dispatches patchRow command when handleUpdateOrder is called", async () => {
		const applyCommand = vi.fn();
		const { result } = renderHook(() =>
			useFreezePageActions({
				applyCommand,
			}),
		);

		await act(async () => {
			await result.current.handleUpdateOrder("row-123", {
				noteHistory: "Updated note",
			});
		});

		expect(applyCommand).toHaveBeenCalledTimes(1);
		expect(applyCommand).toHaveBeenCalledWith({
			type: "patchRow",
			id: "row-123",
			sourceStage: "freeze",
			destinationStage: "freeze",
			updates: { noteHistory: "Updated note" },
			previousValues: {},
		});
	});

	it("dispatches a neutral unfreeze patchRow when handleConfirmUnfreeze is called", async () => {
		const applyCommand = vi.fn(() => true);
		const setSelectedRows = vi.fn();
		const { result } = renderHook(() =>
			useFreezePageActions({
				applyCommand,
				selectedRows: [frozenRow],
				setSelectedRows,
			}),
		);

		await act(async () => {
			result.current.handleConfirmUnfreeze("main");
		});

		expect(applyCommand).toHaveBeenCalledTimes(1);
		expect(applyCommand).toHaveBeenCalledWith({
			type: "patchRow",
			id: frozenRow.id,
			sourceStage: "freeze",
			destinationStage: "main",
			updates: {
				stage: "main",
				noteHistory: expect.stringContaining(
					"Unfrozen to main. Freeze reason: Awaiting approval #unfreeze",
				),
				previousStage: null,
				freezeReason: null,
				frozenAt: null,
			},
			previousValues: {},
		});
		expect(setSelectedRows).toHaveBeenCalledWith([]);
	});

	it("supports any destination stage for handleConfirmUnfreeze", async () => {
		const applyCommand = vi.fn(() => true);
		const { result } = renderHook(() =>
			useFreezePageActions({
				applyCommand,
				selectedRows: [frozenRow],
				setSelectedRows: vi.fn(),
			}),
		);

		await act(async () => {
			result.current.handleConfirmUnfreeze("call");
		});

		expect(applyCommand).toHaveBeenCalledWith(
			expect.objectContaining({ destinationStage: "call" }),
		);
	});
});
