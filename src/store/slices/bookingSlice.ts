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
		{ id: "add", label: "Add", color: "bg-emerald-500" },
		{ id: "cancel", label: "Cancel", color: "bg-red-500" },
		{ id: "reschedule", label: "Reschedule", color: "bg-blue-500" },
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
	removeBookingStatusDef: (id) => {
		set((state) => ({
			bookingStatuses: state.bookingStatuses.filter((s) => s.id !== id),
		}));
		get().addCommit("Remove Booking Status Definition");
	},
});
