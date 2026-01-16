import { describe, expect, it, vi } from "vitest";
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
					addCommit: vi.fn(),
					debouncedCommit: vi.fn(),
					bookingRowData: [],
					// biome-ignore lint/suspicious/noExplicitAny: Mock store structure
				}) as unknown as any,
		);
	};

	it("should commit orders to main sheet", () => {
		const store = createTestStore();
		store.getState().setOrdersRowData([mockRow]);

		store.getState().commitToMainSheet(["1"]);

		const state = store.getState();
		expect(state.ordersRowData).toHaveLength(0);
		expect(state.rowData).toHaveLength(1);
		expect(state.rowData[0].status).toBe("Pending");
		expect(state.rowData[0].trackingId).toBe("MAIN-B1");
		expect(state.addCommit).toHaveBeenCalledWith("Commit to Main Sheet");
	});

	it("should send main sheet rows to call list", () => {
		const store = createTestStore();
		store.getState().setRowData([mockRow]);

		store.getState().sendToCallList(["1"]);

		const state = store.getState();
		expect(state.rowData).toHaveLength(0);
		expect(state.callRowData).toHaveLength(1);
		expect(state.callRowData[0].status).toBe("Call");
		expect(state.callRowData[0].trackingId).toBe("CALL-B1");
		expect(state.addCommit).toHaveBeenCalledWith("Send to Call List");
	});

	it("should archive rows from any sheet", () => {
		const store = createTestStore();
		store.getState().setRowData([{ ...mockRow, id: "main-1" }]);
		store.getState().setCallRowData([{ ...mockRow, id: "call-1" }]);

		store.getState().sendToArchive(["main-1", "call-1"], "Test Archive");

		const state = store.getState();
		expect(state.rowData).toHaveLength(0);
		expect(state.callRowData).toHaveLength(0);
		expect(state.archiveRowData).toHaveLength(2);
		expect(state.archiveRowData[0].status).toBe("Archived");
		expect(state.archiveRowData[0].actionNote).toContain("Test Archive");
		expect(state.addCommit).toHaveBeenCalledWith("Send to Archive");
	});

	it("should send rows back to reorder", () => {
		const store = createTestStore();
		store.getState().setArchiveRowData([mockRow]);

		store.getState().sendToReorder(["1"], "Defective Part");

		const state = store.getState();
		expect(state.archiveRowData).toHaveLength(0);
		expect(state.ordersRowData).toHaveLength(1);
		expect(state.ordersRowData[0].status).toBe("Reorder");
		expect(state.ordersRowData[0].trackingId).toBe("ORD-B1");
		expect(state.ordersRowData[0].actionNote).toContain("Defective Part");
		expect(state.addCommit).toHaveBeenCalledWith("Send to Reorder");
	});

	it("should update part status correctly", () => {
		const store = createTestStore();
		store.getState().setRowData([mockRow]);

		store.getState().updatePartStatus("1", "Arrived");

		expect(store.getState().rowData[0].partStatus).toBe("Arrived");
		expect(store.getState().debouncedCommit).toHaveBeenCalledWith(
			"Update Part Status",
		);
	});
});
