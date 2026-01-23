import type { StateCreator } from "zustand";
import type { PendingRow } from "@/types";
import type { CombinedStore, InventoryActions, InventoryState } from "../types";

export const createInventorySlice: StateCreator<
	CombinedStore,
	[["zustand/persist", unknown]],
	[],
	InventoryState & InventoryActions
> = (set, get) => ({
	rowData: [],
	callRowData: [],
	archiveRowData: [],

	/**
	 * Moves rows from Orders to the Main Sheet (Pending status).
	 * @param ids - Array of row IDs to commit.
	 */
	commitToMainSheet: (ids) => {
		get().pushUndo();
		set((state) => {
			const ordersToMove = state.ordersRowData.filter((r) =>
				ids.includes(r.id),
			);
			const updatedOrders = ordersToMove.map((r) => ({
				...r,
				status: "Pending" as const,
				trackingId: `MAIN-${r.baseId}`,
			}));

			return {
				ordersRowData: state.ordersRowData.filter((r) => !ids.includes(r.id)),
				rowData: [...state.rowData, ...updatedOrders],
			};
		});
		get().addCommit("Commit to Main Sheet");
	},

	/**
	 * Moves rows from the Main Sheet to the Call List.
	 * @param ids - Array of row IDs to send.
	 */
	sendToCallList: (ids) => {
		get().pushUndo();
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
		get().addCommit("Send to Call List");
	},

	/**
	 * Moves rows from any active list (Booking, Call, Main) to the Archive.
	 * @param ids - Array of row IDs to archive.
	 * @param actionNote - Optional note explaining the archive action.
	 */
	sendToArchive: (ids, actionNote) => {
		get().pushUndo();
		set((state) => {
			// Check all possible source lists
			const bookingRows = state.bookingRowData.filter((r) =>
				ids.includes(r.id),
			);
			const callRows = state.callRowData.filter((r) => ids.includes(r.id));
			const mainRows = state.rowData.filter((r) => ids.includes(r.id));
			const orderRows = state.ordersRowData.filter((r) => ids.includes(r.id));

			const rowsToMove = [
				...bookingRows,
				...callRows,
				...mainRows,
				...orderRows,
			];

			const updatedRows = rowsToMove.map((r) => {
				const tag = "#archive";
				const reason = actionNote?.trim();
				const newNote = reason ? `${reason} ${tag}` : "";
				const combinedNote = r.actionNote
					? reason
						? `${r.actionNote}\n${newNote}`
						: r.actionNote
					: newNote;

				return {
					...r,
					status: "Archived" as const,
					trackingId: `ARCH-${r.baseId}`,
					actionNote: combinedNote,
				};
			});

			return {
				bookingRowData: state.bookingRowData.filter((r) => !ids.includes(r.id)),
				callRowData: state.callRowData.filter((r) => !ids.includes(r.id)),
				rowData: state.rowData.filter((r) => !ids.includes(r.id)),
				ordersRowData: state.ordersRowData.filter((r) => !ids.includes(r.id)),
				archiveRowData: [...state.archiveRowData, ...updatedRows],
			};
		});
		get().addCommit("Send to Archive");
	},

	/**
	 * Moves rows from any active list (Booking, Call, Archive) back to Orders for re-processing.
	 * @param ids - Array of row IDs to reorder.
	 * @param actionNote - Required note explaining the reorder reason.
	 */
	sendToReorder: (ids, actionNote) => {
		get().pushUndo();
		set((state) => {
			// Check all possible source lists
			const bookingRows = state.bookingRowData.filter((r) =>
				ids.includes(r.id),
			);
			const callRows = state.callRowData.filter((r) => ids.includes(r.id));
			const archiveRows = state.archiveRowData.filter((r) =>
				ids.includes(r.id),
			);

			const rowsToMove = [...bookingRows, ...callRows, ...archiveRows];

			const updatedRows = rowsToMove.map((r) => {
				const tag = "#reorder";
				const reason = actionNote?.trim();
				const newNote = reason ? `${reason} ${tag}` : "";
				const combinedNote = r.actionNote
					? reason
						? `${r.actionNote}\n${newNote}`
						: r.actionNote
					: newNote;

				return {
					...r,
					status: "Reorder" as const,
					trackingId: `ORD-${r.baseId}`,
					actionNote: combinedNote,
					bookingDate: undefined,
					bookingNote: undefined,
				};
			});

			return {
				bookingRowData: state.bookingRowData.filter((r) => !ids.includes(r.id)),
				callRowData: state.callRowData.filter((r) => !ids.includes(r.id)),
				archiveRowData: state.archiveRowData.filter((r) => !ids.includes(r.id)),
				ordersRowData: [...state.ordersRowData, ...updatedRows],
			};
		});
		get().addCommit("Send to Reorder");
	},

	/**
	 * Updates the part status of a specific row across all slices.
	 * @param id - The ID of the row to update.
	 * @param partStatus - The new part status value.
	 */
	updatePartStatus: (id, partStatus) => {
		get().pushUndo();
		const updateInArray = (arr: PendingRow[]) =>
			arr.map((row) => (row.id === id ? { ...row, partStatus } : row));

		set((state) => ({
			rowData: updateInArray(state.rowData),
			ordersRowData: updateInArray(state.ordersRowData),
			bookingRowData: updateInArray(state.bookingRowData),
			callRowData: updateInArray(state.callRowData),
			archiveRowData: updateInArray(state.archiveRowData),
		}));
		get().debouncedCommit("Update Part Status");
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
