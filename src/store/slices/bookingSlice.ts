import type { StateCreator } from "zustand";
import type { PendingRow } from "@/types";
import type { BookingActions, BookingState, CombinedStore } from "../types";

export const createBookingSlice: StateCreator<
	CombinedStore,
	[["zustand/persist", unknown]],
	[],
	BookingState & BookingActions
> = (set, get) => ({
	bookingRowData: [],
	bookingStatuses: [
		{ id: "add", label: "Add", color: "#10b981" },
		{ id: "cancel", label: "Cancel", color: "#ef4444" },
		{ id: "reschedule", label: "Reschedule", color: "#3b82f6" },
	],

	/**
	 * Moves rows from various source lists (Main, Orders, Call) to the Booking list.
	 * @param ids - Array of row IDs to book.
	 * @param bookingDate - The scheduled date for the appointment.
	 * @param bookingNote - Optional note for the booking.
	 * @param bookingStatus - Optional initial booking status.
	 */
	sendToBooking: (ids, bookingDate, bookingNote, bookingStatus) => {
		set((state) => {
			const rowsFromMainSheet = state.rowData.filter((r) => ids.includes(r.id));
			const rowsFromOrders = state.ordersRowData.filter((r) =>
				ids.includes(r.id),
			);
			const rowsFromCallList = state.callRowData.filter((r) =>
				ids.includes(r.id),
			);

			const rowsToMove = [
				...rowsFromMainSheet,
				...rowsFromOrders,
				...rowsFromCallList,
			];

			const updatedRows = rowsToMove.map((r) => ({
				...r,
				status: "Booked" as const,
				trackingId: `BOOK-${r.baseId}`,
				bookingDate,
				bookingNote,
				bookingStatus: bookingStatus || r.bookingStatus,
			}));

			return {
				rowData: state.rowData.filter((r) => !ids.includes(r.id)),
				ordersRowData: state.ordersRowData.filter((r) => !ids.includes(r.id)),
				callRowData: state.callRowData.filter((r) => !ids.includes(r.id)),
				bookingRowData: [...state.bookingRowData, ...updatedRows],
			};
		});
		get().addCommit("Send to Booking");
	},

	/**
	 * Updates the booking status of a specific row across all slices.
	 * @param id - The ID of the row to update.
	 * @param bookingStatus - The new booking status value.
	 */
	updateBookingStatus: (id, bookingStatus) => {
		const updateInArray = (arr: PendingRow[]) =>
			arr.map((row) => (row.id === id ? { ...row, bookingStatus } : row));

		set((state) => ({
			rowData: updateInArray(state.rowData),
			ordersRowData: updateInArray(state.ordersRowData),
			bookingRowData: updateInArray(state.bookingRowData),
			callRowData: updateInArray(state.callRowData),
			archiveRowData: updateInArray(state.archiveRowData),
		}));
		get().debouncedCommit("Update Booking Status");
	},

	/**
	 * Adds a new booking status definition to the system.
	 * @param status - The status definition object (id, label, color).
	 */
	addBookingStatusDef: (status) => {
		set((state) => ({
			bookingStatuses: [...state.bookingStatuses, status],
		}));
		get().addCommit("Add Booking Status Definition");
	},

	/**
	 * Removes a booking status definition from the system by ID.
	 * @param id - The ID of the status definition to remove.
	 */
	updateBookingStatusDef: (id, updates) => {
		const state = get();
		const statusToUpdate = state.bookingStatuses.find((s) => s.id === id);
		if (!statusToUpdate) return;

		const oldLabel = statusToUpdate.label;
		const newLabel = updates.label;

		set((state) => ({
			bookingStatuses: state.bookingStatuses.map((s) =>
				s.id === id ? { ...s, ...updates } : s,
			),
		}));

		// If label changed, bulk update all rows
		if (newLabel && newLabel !== oldLabel) {
			const updateRows = (rows: PendingRow[]) =>
				rows.map((row) =>
					row.bookingStatus === oldLabel
						? { ...row, bookingStatus: newLabel }
						: row,
				);

			set((state) => ({
				ordersRowData: updateRows(state.ordersRowData),
				rowData: updateRows(state.rowData),
				callRowData: updateRows(state.callRowData),
				archiveRowData: updateRows(state.archiveRowData),
				bookingRowData: updateRows(state.bookingRowData),
			}));
		}

		get().addCommit("Update Booking Status Definition");
	},

	removeBookingStatusDef: (id) => {
		set((state) => ({
			bookingStatuses: state.bookingStatuses.filter((s) => s.id !== id),
		}));
		get().addCommit("Remove Booking Status Definition");
	},

	setBookingRowData: (data) => {
		set({ bookingRowData: data });
	},
});
