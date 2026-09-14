import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFreezePageActions } from "@/app/(app)/freeze/useFreezePageActions";

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
});
