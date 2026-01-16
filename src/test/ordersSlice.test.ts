import { describe, expect, it, vi } from "vitest";
import { create } from "zustand";
import { createOrdersSlice } from "../store/slices/ordersSlice";
import type { CombinedStore } from "../store/types";
import type { PendingRow } from "../types";

// Mock row for testing
const mockRow: PendingRow = {
	id: "1",
	baseId: "B1",
	trackingId: "T1",
	customerName: "John Doe",
	vin: "VIN1",
	mobile: "123456789",
	cntrRdg: 1000,
	model: "Clio",
	parts: [],
	sabNumber: "S1",
	acceptedBy: "Admin",
	requester: "Admin",
	partNumber: "P1",
	description: "Part 1",
	status: "Orders",
	rDate: "2024-01-01",
	repairSystem: "None",
	startWarranty: "",
	endWarranty: "",
	remainTime: "",
};

describe("ordersSlice", () => {
	const createTestStore = () => {
		return create<CombinedStore>(
			(...a) =>
				({
					// biome-ignore lint/suspicious/noExplicitAny: Bypass middleware checks for testing
					...createOrdersSlice(a[0], a[1], a[2] as any),
					// Mock other slices that ordersSlice depends on
					addCommit: vi.fn(),
					debouncedCommit: vi.fn(),
					rowData: [],
					bookingRowData: [],
					callRowData: [],
					archiveRowData: [],
					// biome-ignore lint/suspicious/noExplicitAny: Mock store structure
				}) as unknown as any,
		);
	};

	it("should initialize with empty ordersRowData", () => {
		const store = createTestStore();
		expect(store.getState().ordersRowData).toEqual([]);
	});

	it("should add an order", () => {
		const store = createTestStore();
		store.getState().addOrder(mockRow);

		expect(store.getState().ordersRowData).toHaveLength(1);
		expect(store.getState().ordersRowData[0]).toEqual(mockRow);
		expect(store.getState().addCommit).toHaveBeenCalledWith("Add Order");
	});

	it("should add multiple orders", () => {
		const store = createTestStore();
		const orders = [mockRow, { ...mockRow, id: "2" }];
		store.getState().addOrders(orders);

		expect(store.getState().ordersRowData).toHaveLength(2);
		expect(store.getState().addCommit).toHaveBeenCalledWith(
			"Add Multiple Orders",
		);
	});

	it("should update an order using updateOrder", () => {
		const store = createTestStore();
		store.getState().addOrder(mockRow);

		store.getState().updateOrder("1", { customerName: "Jane Doe" });

		expect(store.getState().ordersRowData[0].customerName).toBe("Jane Doe");
		expect(store.getState().debouncedCommit).toHaveBeenCalledWith(
			"Update Order: 1",
		);
	});

	it("should bulk update orders using updateOrders", () => {
		const store = createTestStore();
		const orders = [
			{ ...mockRow, id: "1" },
			{ ...mockRow, id: "2" },
			{ ...mockRow, id: "3" },
		];
		store.getState().addOrders(orders);

		store.getState().updateOrders(["1", "2"], { status: "Main Sheet" });

		const state = store.getState();
		expect(state.ordersRowData.find((r) => r.id === "1")?.status).toBe(
			"Main Sheet",
		);
		expect(state.ordersRowData.find((r) => r.id === "2")?.status).toBe(
			"Main Sheet",
		);
		expect(state.ordersRowData.find((r) => r.id === "3")?.status).toBe(
			"Orders",
		);
		expect(state.debouncedCommit).toHaveBeenCalledWith("Bulk Update Orders");
	});

	it("should delete orders using deleteOrders", () => {
		const store = createTestStore();
		const orders = [
			{ ...mockRow, id: "1" },
			{ ...mockRow, id: "2" },
		];
		store.getState().addOrders(orders);

		store.getState().deleteOrders(["1"]);

		expect(store.getState().ordersRowData).toHaveLength(1);
		expect(store.getState().ordersRowData[0].id).toBe("2");
		expect(store.getState().addCommit).toHaveBeenCalledWith("Delete Orders");
	});
});
