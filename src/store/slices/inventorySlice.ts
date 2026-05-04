import type { StateCreator } from "zustand";
import type { PendingRow } from "@/types";
import type { CombinedStore, InventoryActions, InventoryState } from "../types";

export const createInventorySlice: StateCreator<
	CombinedStore,
	[["zustand/persist", unknown]],
	[],
	InventoryState & InventoryActions
> = (set, _get) => ({
	rowData: [],
	callRowData: [],
	archiveRowData: [],

	/**
	 * Moves rows from the Main Sheet to the Call List.
	 * @param ids - Array of row IDs to send.
	 */
	sendToCallList: (ids) => {
		set((state) => {
			const rowsFromMain = state.rowData.filter((r) => ids.includes(r.id));
			const rowsFromOrders = state.ordersRowData.filter((r) =>
				ids.includes(r.id),
			);

			const rowsToMove = [...rowsFromMain, ...rowsFromOrders];
			const updatedRows = rowsToMove.map((r) => ({
				...r,
				status: "Call" as const,
				trackingId: `CALL-${r.baseId}`,
			}));

			return {
				rowData: state.rowData.filter((r) => !ids.includes(r.id)),
				ordersRowData: state.ordersRowData.filter((r) => !ids.includes(r.id)),
				callRowData: [...state.callRowData, ...updatedRows],
			};
		});
	},

	/**
	 * Updates the user-managed status of a specific row across all slices.
	 * @param id - The ID of the row to update.
	 * @param status - The new status value.
	 */
	updatePartStatus: (id, status) => {
		const updateInArray = (arr: PendingRow[]) =>
			arr.map((row) => (row.id === id ? { ...row, status } : row));

		set((state) => ({
			rowData: updateInArray(state.rowData),
			ordersRowData: updateInArray(state.ordersRowData),
			bookingRowData: updateInArray(state.bookingRowData),
			callRowData: updateInArray(state.callRowData),
			archiveRowData: updateInArray(state.archiveRowData),
		}));
	},

	setRowData: (data) => {
		set({ rowData: data });
	},

	setCallRowData: (data) => {
		set({ callRowData: data });
	},

	setArchiveRowData: (data) => {
		set({ archiveRowData: data });
	},
});
