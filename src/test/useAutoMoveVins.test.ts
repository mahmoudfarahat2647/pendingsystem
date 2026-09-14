// src/test/useAutoMoveVins.test.ts
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoMoveVins } from "@/hooks/useAutoMoveVins";

// --- mocks ---
const { mockMutate, mockMutateAsync, mockToastSuccess } = vi.hoisted(() => ({
	mockMutate: vi.fn(),
	mockMutateAsync: vi.fn(),
	mockToastSuccess: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: { success: mockToastSuccess },
}));

vi.mock("@/hooks/queries/useOrdersQuery", () => ({
	useOrdersQuery: vi.fn(),
}));

vi.mock("@/hooks/queries/useBulkUpdateOrderStageMutation", () => ({
	useBulkUpdateOrderStageMutation: vi.fn(() => ({
		mutate: mockMutate,
		mutateAsync: mockMutateAsync,
	})),
}));

import { useOrdersQuery } from "@/hooks/queries/useOrdersQuery";

const mockUseOrdersQuery = vi.mocked(useOrdersQuery);

function makeRow(
	overrides: Partial<{
		id: string;
		vin: string;
		stage: string;
		status: string;
	}> = {},
) {
	return {
		id: "row-1",
		vin: "VIN111",
		stage: "main",
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
		mockMutateAsync.mockReset();
		mockToastSuccess.mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("moves a single-part VIN to call when its only part is Arrived", async () => {
		mockUseOrdersQuery.mockReturnValue({
			data: [makeRow({ id: "r1", vin: "VIN111", status: "Arrived" })],
		} as unknown as ReturnType<typeof useOrdersQuery>);

		renderHook(() => useAutoMoveVins());
		await vi.runAllTimersAsync();

		expect(mockMutateAsync).toHaveBeenCalledWith({
			ids: ["r1"],
			stage: "call",
			guardFrozenVins: true,
		});
	});

	it("reports a VIN move only after the guarded mutation succeeds", async () => {
		mockMutateAsync.mockResolvedValue([{ id: "r1", stage: "call" }]);
		mockUseOrdersQuery.mockReturnValue({
			data: [makeRow({ id: "r1", vin: "VIN111", status: "Arrived" })],
		} as unknown as ReturnType<typeof useOrdersQuery>);

		renderHook(() => useAutoMoveVins());
		await vi.runAllTimersAsync();

		expect(mockMutateAsync).toHaveBeenCalledWith({
			ids: ["r1"],
			stage: "call",
			guardFrozenVins: true,
		});
		expect(mockToastSuccess).toHaveBeenCalledWith(
			"All parts for VIN VIN111 arrived! Moved to Call List.",
			{ duration: 5000 },
		);
	});

	it("moves a multi-part VIN when all parts are Arrived", async () => {
		mockUseOrdersQuery.mockReturnValue({
			data: [
				makeRow({ id: "r1", vin: "VIN222", status: "Arrived" }),
				makeRow({ id: "r2", vin: "VIN222", status: "Arrived" }),
				makeRow({ id: "r3", vin: "VIN222", status: "Arrived" }),
			],
		} as unknown as ReturnType<typeof useOrdersQuery>);

		renderHook(() => useAutoMoveVins());
		await vi.runAllTimersAsync();

		expect(mockMutateAsync).toHaveBeenCalledWith({
			ids: expect.arrayContaining(["r1", "r2", "r3"]),
			stage: "call",
			guardFrozenVins: true,
		});
	});

	it("does NOT move a VIN when at least one part is not Arrived", async () => {
		mockUseOrdersQuery.mockReturnValue({
			data: [
				makeRow({ id: "r1", vin: "VIN333", status: "Arrived" }),
				makeRow({ id: "r2", vin: "VIN333", status: "Not Arrived" }),
			],
		} as unknown as ReturnType<typeof useOrdersQuery>);

		renderHook(() => useAutoMoveVins());
		vi.runAllTimers();

		expect(mockMutateAsync).not.toHaveBeenCalled();
	});

	it("does NOT move a VIN when all its Main parts are Arrived but a frozen sibling exists", async () => {
		mockUseOrdersQuery.mockImplementation((stage) => {
			if (stage === "freeze") {
				return {
					data: [
						makeRow({
							id: "f1",
							vin: "VIN111",
							stage: "freeze",
							status: "Arrived",
						}),
					],
				} as unknown as ReturnType<typeof useOrdersQuery>;
			}
			return {
				data: [
					makeRow({
						id: "r1",
						vin: "VIN111",
						stage: "main",
						status: "Arrived",
					}),
				],
			} as unknown as ReturnType<typeof useOrdersQuery>;
		});

		renderHook(() => useAutoMoveVins());
		vi.runAllTimers();

		expect(mockMutateAsync).not.toHaveBeenCalled();
	});

	it("resumes auto-move once the frozen sibling is unfrozen", async () => {
		let isFrozen = true;
		mockUseOrdersQuery.mockImplementation((stage) => {
			if (stage === "freeze") {
				return {
					data: isFrozen
						? [
								makeRow({
									id: "f1",
									vin: "VIN111",
									stage: "freeze",
									status: "Pending",
								}),
							]
						: [],
				} as unknown as ReturnType<typeof useOrdersQuery>;
			}
			return {
				data: [
					makeRow({
						id: "r1",
						vin: "VIN111",
						stage: "main",
						status: "Arrived",
					}),
				],
			} as unknown as ReturnType<typeof useOrdersQuery>;
		});

		const { rerender } = renderHook(() => useAutoMoveVins());
		await vi.runAllTimersAsync();

		// Initially blocked by frozen sibling
		expect(mockMutateAsync).not.toHaveBeenCalled();

		// Unfreeze the sibling
		isFrozen = false;
		rerender();
		await vi.runAllTimersAsync();

		// Auto-move fires normally once unfrozen
		expect(mockMutateAsync).toHaveBeenCalledWith({
			ids: ["r1"],
			stage: "call",
			guardFrozenVins: true,
		});
	});

	it("does NOT move rows with a blank VIN", async () => {
		mockUseOrdersQuery.mockReturnValue({
			data: [makeRow({ id: "r1", vin: "", status: "Arrived" })],
		} as unknown as ReturnType<typeof useOrdersQuery>);

		renderHook(() => useAutoMoveVins());
		vi.runAllTimers();

		expect(mockMutateAsync).not.toHaveBeenCalled();
	});

	it("does NOT move rows when data is undefined", async () => {
		mockUseOrdersQuery.mockReturnValue({
			data: undefined,
		} as unknown as ReturnType<typeof useOrdersQuery>);

		renderHook(() => useAutoMoveVins());
		vi.runAllTimers();

		expect(mockMutateAsync).not.toHaveBeenCalled();
	});

	it("only moves the fully-arrived VIN, not a partially-arrived one", async () => {
		mockUseOrdersQuery.mockReturnValue({
			data: [
				// VIN_A: all arrived → should move
				makeRow({ id: "a1", vin: "VIN_A", status: "Arrived" }),
				makeRow({ id: "a2", vin: "VIN_A", status: "Arrived" }),
				// VIN_B: partial → should NOT move
				makeRow({ id: "b1", vin: "VIN_B", status: "Arrived" }),
				makeRow({ id: "b2", vin: "VIN_B", status: "Not Arrived" }),
			],
		} as unknown as ReturnType<typeof useOrdersQuery>);

		renderHook(() => useAutoMoveVins());
		await vi.runAllTimersAsync();

		expect(mockMutateAsync).toHaveBeenCalledOnce();
		expect(mockMutateAsync).toHaveBeenCalledWith({
			ids: expect.arrayContaining(["a1", "a2"]),
			stage: "call",
			guardFrozenVins: true,
		});
	});

	it("does not re-fire when the data reference changes but statuses are unchanged", async () => {
		const row = makeRow({ id: "r1", vin: "VIN444", status: "Not Arrived" });

		// Configure mock before first render so the initial key is committed correctly.
		mockUseOrdersQuery.mockReturnValue({ data: [row] } as unknown as ReturnType<
			typeof useOrdersQuery
		>);
		const { rerender } = renderHook(() => useAutoMoveVins());
		vi.runAllTimers(); // flush initial debounce; status key is now committed
		mockMutateAsync.mockReset();

		// Same logical content, new array reference — key-deduplication should block re-fire.
		mockUseOrdersQuery.mockReturnValue({
			data: [{ ...row }],
		} as unknown as ReturnType<typeof useOrdersQuery>);
		rerender();
		vi.runAllTimers();

		expect(mockMutateAsync).not.toHaveBeenCalled();
	});
});
