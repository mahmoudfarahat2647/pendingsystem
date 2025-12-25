import type { StateCreator } from "zustand";
import type { CombinedStore, OrdersState, OrdersActions } from "../types";
import type { PendingRow } from "@/types";

export const createOrdersSlice: StateCreator<
    CombinedStore,
    [["zustand/persist", unknown]],
    [],
    OrdersState & OrdersActions
> = (set, get) => ({
    ordersRowData: [],

    addOrder: (order) => {
        set((state) => ({
            ordersRowData: [...state.ordersRowData, order],
        }));
        get().addCommit("Add Order");
    },

    addOrders: (orders) => {
        set((state) => ({
            ordersRowData: [...state.ordersRowData, ...orders],
        }));
        get().addCommit("Add Multiple Orders");
    },

    updateOrder: (id, updates) => {
        const updateInArray = (arr: PendingRow[]) =>
            arr.map((row) => (row.id === id ? { ...row, ...updates } : row));

        set((state) => ({
            rowData: updateInArray(state.rowData),
            ordersRowData: updateInArray(state.ordersRowData),
            bookingRowData: updateInArray(state.bookingRowData),
            callRowData: updateInArray(state.callRowData),
            archiveRowData: updateInArray(state.archiveRowData),
        }));
        get().debouncedCommit(`Update Order: ${id}`);
    },

    updateOrders: (ids, updates) => {
        const updateInArray = (arr: PendingRow[]) =>
            arr.map((row) =>
                ids.includes(row.id) ? { ...row, ...updates } : row
            );

        set((state) => ({
            rowData: updateInArray(state.rowData),
            ordersRowData: updateInArray(state.ordersRowData),
            bookingRowData: updateInArray(state.bookingRowData),
            callRowData: updateInArray(state.callRowData),
            archiveRowData: updateInArray(state.archiveRowData),
        }));
        get().debouncedCommit("Bulk Update Orders");
    },

    deleteOrders: (ids) => {
        const filterArray = (arr: PendingRow[]) =>
            arr.filter((row) => !ids.includes(row.id));

        set((state) => ({
            rowData: filterArray(state.rowData),
            ordersRowData: filterArray(state.ordersRowData),
            bookingRowData: filterArray(state.bookingRowData),
            callRowData: filterArray(state.callRowData),
            archiveRowData: filterArray(state.archiveRowData),
        }));
        get().addCommit("Delete Orders");
    },
});
