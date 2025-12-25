import type { StateCreator } from "zustand";
import type { CombinedStore, InventoryState, InventoryActions } from "../types";
import type { PendingRow } from "@/types";

export const createInventorySlice: StateCreator<
    CombinedStore,
    [["zustand/persist", unknown]],
    [],
    InventoryState & InventoryActions
> = (set, get) => ({
    rowData: [],
    callRowData: [],
    archiveRowData: [],

    commitToMainSheet: (ids) => {
        set((state) => {
            const ordersToMove = state.ordersRowData.filter((r) =>
                ids.includes(r.id)
            );
            const updatedOrders = ordersToMove.map((r) => ({
                ...r,
                status: "Pending" as const,
                trackingId: `MAIN-${r.baseId}`,
            }));

            return {
                ordersRowData: state.ordersRowData.filter(
                    (r) => !ids.includes(r.id)
                ),
                rowData: [...state.rowData, ...updatedOrders],
            };
        });
        get().addCommit("Commit to Main Sheet");
    },

    sendToCallList: (ids) => {
        set((state) => {
            const rowsToMove = state.rowData.filter((r) => ids.includes(r.id));
            const updatedRows = rowsToMove.map((r) => ({
                ...r,
                status: "Call" as const,
                trackingId: `CALL-${r.baseId}`,
            }));

            return {
                rowData: state.rowData.filter((r) => !ids.includes(r.id)),
                callRowData: [...state.callRowData, ...updatedRows],
            };
        });
        get().addCommit("Send to Call List");
    },

    sendToArchive: (ids, actionNote) => {
        set((state) => {
            const rowsToMove = state.bookingRowData.filter((r) =>
                ids.includes(r.id)
            );
            const updatedRows = rowsToMove.map((r) => ({
                ...r,
                status: "Archived" as const,
                trackingId: `ARCH-${r.baseId}`,
                actionNote,
            }));

            return {
                bookingRowData: state.bookingRowData.filter(
                    (r) => !ids.includes(r.id)
                ),
                archiveRowData: [...state.archiveRowData, ...updatedRows],
            };
        });
        get().addCommit("Send to Archive");
    },

    sendToReorder: (ids, actionNote) => {
        set((state) => {
            const rowsToMove = state.bookingRowData.filter((r) =>
                ids.includes(r.id)
            );
            const updatedRows = rowsToMove.map((r) => ({
                ...r,
                status: "Reorder" as const,
                trackingId: `ORD-${r.baseId}`,
                actionNote,
                bookingDate: undefined,
                bookingNote: undefined,
            }));

            return {
                bookingRowData: state.bookingRowData.filter(
                    (r) => !ids.includes(r.id)
                ),
                ordersRowData: [...state.ordersRowData, ...updatedRows],
            };
        });
        get().addCommit("Send to Reorder");
    },

    updatePartStatus: (id, partStatus) => {
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
});
