import { describe, expect, it } from "vitest";
import { create } from "zustand";
import { createInventorySlice } from "../store/slices/inventorySlice";
import { createOrdersSlice } from "../store/slices/ordersSlice";
import type { CombinedStore } from "../store/types";
import type { PendingRow } from "../types";

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

describe("inventorySlice", () => {
	const createTestStore = () => {
		return create<CombinedStore>(
			(...a) =>
				({
					// biome-ignore lint/suspicious/noExplicitAny: Bypass middleware checks for testing
					...createOrdersSlice(a[0], a[1], a[2] as any),
					// biome-ignore lint/suspicious/noExplicitAny: Bypass middleware checks for testing
					...createInventorySlice(a[0], a[1], a[2] as any),
					bookingRowData: [],
					// biome-ignore lint/suspicious/noExplicitAny: Mock store structure
				}) as unknown as any,
		);
	};

	it("should send main sheet rows to call list", () => {
		const store = createTestStore();
		store.getState().setRowData([mockRow]);

		store.getState().sendToCallList(["1"]);

		const state = store.getState();
		expect(state.rowData).toHaveLength(0);
		expect(state.callRowData).toHaveLength(1);
		expect(state.callRowData[0].status).toBe("Call");
		expect(state.callRowData[0].trackingId).toBe("CALL-B1");
	});

	it("should update part status correctly", () => {
		const store = createTestStore();
		store.getState().setRowData([mockRow]);

		store.getState().updatePartStatus("1", "Arrived");

		expect(store.getState().rowData[0].partStatus).toBe("Arrived");
	});
});
