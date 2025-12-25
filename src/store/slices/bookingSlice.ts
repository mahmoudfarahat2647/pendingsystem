import type { StateCreator } from "zustand";
import type { CombinedStore, BookingState, BookingActions } from "../types";
import type { PendingRow, PartStatusDef } from "@/types";

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

    sendToBooking: (ids, bookingDate, bookingNote, bookingStatus) => {
        set((state) => {
            const rowsFromMainSheet = state.rowData.filter((r) =>
                ids.includes(r.id)
            );
            const rowsFromOrders = state.ordersRowData.filter((r) =>
                ids.includes(r.id)
            );
            const rowsFromCallList = state.callRowData.filter((r) =>
                ids.includes(r.id)
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
                ordersRowData: state.ordersRowData.filter(
                    (r) => !ids.includes(r.id)
                ),
                callRowData: state.callRowData.filter((r) => !ids.includes(r.id)),
                bookingRowData: [...state.bookingRowData, ...updatedRows],
            };
        });
        get().addCommit("Send to Booking");
    },

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

    addBookingStatusDef: (status) => {
        set((state) => ({
            bookingStatuses: [...state.bookingStatuses, status],
        }));
        get().addCommit("Add Booking Status Definition");
    },

    removeBookingStatusDef: (id) => {
        set((state) => ({
            bookingStatuses: state.bookingStatuses.filter((s) => s.id !== id),
        }));
        get().addCommit("Remove Booking Status Definition");
    },
});
