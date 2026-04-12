// src/test/useAutoMoveVins.test.ts
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoMoveVins } from "@/hooks/useAutoMoveVins";

// --- mocks ---
const mockMutate = vi.fn();

vi.mock("@/hooks/queries/useOrdersQuery", () => ({
	useOrdersQuery: vi.fn(),
}));

vi.mock("@/hooks/queries/useBulkUpdateOrderStageMutation", () => ({
	useBulkUpdateOrderStageMutation: vi.fn(() => ({ mutate: mockMutate })),
}));

import { useOrdersQuery } from "@/hooks/queries/useOrdersQuery";

const mockUseOrdersQuery = vi.mocked(useOrdersQuery);

function makeRow(
	overrides: Partial<{
		id: string;
		vin: string;
		stage: string;
		partStatus: string;
	}> = {},
) {
	return {
		id: "row-1",
		vin: "VIN111",
		stage: "main",
		partStatus: "Not Arrived",
		baseId: "B1",
		trackingId: "T1",
		customerName: "Test",
		mobile: "123",
		parts: [],
		status: "Orders" as const,
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
		...overrides,
	};
}

describe("useAutoMoveVins", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		mockMutate.mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("moves a single-part VIN to call when its only part is Arrived", async () => {
		mockUseOrdersQuery.mockReturnValue({
			data: [makeRow({ id: "r1", vin: "VIN111", partStatus: "Arrived" })],
		} as unknown as ReturnType<typeof useOrdersQuery>);

		renderHook(() => useAutoMoveVins());
		vi.runAllTimers();

		expect(mockMutate).toHaveBeenCalledWith({ ids: ["r1"], stage: "call" });
	});

	it("moves a multi-part VIN when all parts are Arrived", async () => {
		mockUseOrdersQuery.mockReturnValue({
			data: [
				makeRow({ id: "r1", vin: "VIN222", partStatus: "Arrived" }),
				makeRow({ id: "r2", vin: "VIN222", partStatus: "Arrived" }),
				makeRow({ id: "r3", vin: "VIN222", partStatus: "Arrived" }),
			],
		} as unknown as ReturnType<typeof useOrdersQuery>);

		renderHook(() => useAutoMoveVins());
		vi.runAllTimers();

		expect(mockMutate).toHaveBeenCalledWith({
			ids: expect.arrayContaining(["r1", "r2", "r3"]),
			stage: "call",
		});
	});

	it("does NOT move a VIN when at least one part is not Arrived", async () => {
		mockUseOrdersQuery.mockReturnValue({
			data: [
				makeRow({ id: "r1", vin: "VIN333", partStatus: "Arrived" }),
				makeRow({ id: "r2", vin: "VIN333", partStatus: "Not Arrived" }),
			],
		} as unknown as ReturnType<typeof useOrdersQuery>);

		renderHook(() => useAutoMoveVins());
		vi.runAllTimers();

		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("does NOT move rows with a blank VIN", async () => {
		mockUseOrdersQuery.mockReturnValue({
			data: [makeRow({ id: "r1", vin: "", partStatus: "Arrived" })],
		} as unknown as ReturnType<typeof useOrdersQuery>);

		renderHook(() => useAutoMoveVins());
		vi.runAllTimers();

		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("does NOT move rows when data is undefined", async () => {
		mockUseOrdersQuery.mockReturnValue({
			data: undefined,
		} as unknown as ReturnType<typeof useOrdersQuery>);

		renderHook(() => useAutoMoveVins());
		vi.runAllTimers();

		expect(mockMutate).not.toHaveBeenCalled();
	});

	it("only moves the fully-arrived VIN, not a partially-arrived one", async () => {
		mockUseOrdersQuery.mockReturnValue({
			data: [
				// VIN_A: all arrived → should move
				makeRow({ id: "a1", vin: "VIN_A", partStatus: "Arrived" }),
				makeRow({ id: "a2", vin: "VIN_A", partStatus: "Arrived" }),
				// VIN_B: partial → should NOT move
				makeRow({ id: "b1", vin: "VIN_B", partStatus: "Arrived" }),
				makeRow({ id: "b2", vin: "VIN_B", partStatus: "Not Arrived" }),
			],
		} as unknown as ReturnType<typeof useOrdersQuery>);

		renderHook(() => useAutoMoveVins());
		vi.runAllTimers();

		expect(mockMutate).toHaveBeenCalledOnce();
		expect(mockMutate).toHaveBeenCalledWith({
			ids: expect.arrayContaining(["a1", "a2"]),
			stage: "call",
		});
	});

	it("does not re-fire when the data reference changes but statuses are unchanged", async () => {
		const row = makeRow({ id: "r1", vin: "VIN444", partStatus: "Not Arrived" });
		const { rerender } = renderHook(() => useAutoMoveVins());

		mockUseOrdersQuery.mockReturnValue({ data: [row] } as unknown as ReturnType<
			typeof useOrdersQuery
		>);
		vi.runAllTimers();
		mockMutate.mockReset();

		// Same logical content, new array reference
		mockUseOrdersQuery.mockReturnValue({
			data: [{ ...row }],
		} as unknown as ReturnType<typeof useOrdersQuery>);
		rerender();
		vi.runAllTimers();

		expect(mockMutate).not.toHaveBeenCalled();
	});
});
