import type { StateCreator } from "zustand";
import type { PendingRow } from "@/types";
import type { CombinedStore, OrdersActions, OrdersState } from "../types";

/**
 * Orders slice - Manages new part requests and order staging
 *
 * Orders are stored in a staging area before being committed to the Main Sheet.
 * This slice provides CRUD operations for order management with automatic
 * history tracking and multi-sheet synchronization.
 *
 * @see docs/STORE_API.md - Full API reference
 * @see docs/ARCHITECTURE.md - System architecture and data flow
 */
export const createOrdersSlice: StateCreator<
	CombinedStore,
	[["zustand/persist", unknown]],
	[],
	OrdersState & OrdersActions
> = (set, get) => ({
	ordersRowData: [],

	/**
	 * Create a single new order in staging
	 * @param order - Order data with id, baseId, vin, partNumber, etc.
	 * @example
	 * addOrder({
	 *   id: "order-1",
	 *   baseId: "B001",
	 *   vin: "VF1AB000123456789",
	 *   partNumber: "8200123456",
	 *   partDescription: "Front Door Assembly",
	 *   quantity: 1,
	 *   status: "Pending"
	 * })
	 */
	addOrder: (order) => {
		set((state) => ({
			ordersRowData: [...state.ordersRowData, order],
		}));
		get().addCommit("Add Order");
	},

	/**
	 * Batch import multiple orders (optimized for bulk operations)
	 *
	 * Performance: O(n) single state update vs O(n*m) with repeated addOrder calls
	 *
	 * @param orders - Array of order objects to import
	 * @example
	 * addOrders([
	 *   { id: "1", baseId: "B001", vin: "...", ... },
	 *   { id: "2", baseId: "B002", vin: "...", ... },
	 * ])
	 */
	addOrders: (orders) => {
		set((state) => ({
			ordersRowData: [...state.ordersRowData, ...orders],
		}));
		get().addCommit("Add Multiple Orders");
	},

	/**
	 * Update single order with partial data
	 *
	 * Updates order across all sheets (Orders, Main, Booking, Call, Archive).
	 * Uses optimized index-based lookup for performance.
	 *
	 * @param id - Order ID to update
	 * @param updates - Partial object with fields to update
	 * @example
	 * updateOrder("order-1", {
	 *   quantity: 2,
	 *   notes: "Priority request"
	 * })
	 */
	updateOrder: (id, updates) => {
		// Optimized: Use index-based lookup instead of full array map
		const updateInArray = (arr: PendingRow[]) => {
			const idx = arr.findIndex((row) => row.id === id);
			if (idx === -1) return arr;
			const newArr = [...arr];
			newArr[idx] = { ...newArr[idx], ...updates };
			return newArr;
		};

		set((state) => ({
			rowData: updateInArray(state.rowData),
			ordersRowData: updateInArray(state.ordersRowData),
			bookingRowData: updateInArray(state.bookingRowData),
			callRowData: updateInArray(state.callRowData),
			archiveRowData: updateInArray(state.archiveRowData),
		}));
		get().debouncedCommit(`Update Order: ${id}`);
	},

	/**
	 * Bulk update multiple orders with same changes (optimized with Set-based lookup)
	 *
	 * Performance: O(n) with Set lookup vs O(n²) with array.includes()
	 * Updates across all sheets simultaneously.
	 *
	 * @param ids - Array of order IDs to update
	 * @param updates - Partial object with fields to update
	 * @example
	 * updateOrders(["id1", "id2", "id3"], {
	 *   status: "Verified",
	 *   notes: "Quality checked"
	 * })
	 */
	updateOrders: (ids, updates) => {
		// Optimized: Create Set for O(1) lookup instead of O(n) includes check
		const idSet = new Set(ids);
		const updateInArray = (arr: PendingRow[]) => {
			const newArr = [...arr];
			for (let i = 0; i < newArr.length; i++) {
				if (idSet.has(newArr[i].id)) {
					newArr[i] = { ...newArr[i], ...updates };
				}
			}
			return newArr;
		};

		set((state) => ({
			rowData: updateInArray(state.rowData),
			ordersRowData: updateInArray(state.ordersRowData),
			bookingRowData: updateInArray(state.bookingRowData),
			callRowData: updateInArray(state.callRowData),
			archiveRowData: updateInArray(state.archiveRowData),
		}));
		get().debouncedCommit("Bulk Update Orders");
	},

	/**
	 * Permanently delete orders from all sheets
	 *
	 * Removes orders from Orders, Main Sheet, Booking, Call List, and Archive.
	 * Creates history commit for audit trail.
	 *
	 * @param ids - Array of order IDs to delete
	 * @warning This action is permanent. Use undo() immediately after to recover.
	 * @example
	 * deleteOrders(["id1", "id2"])
	 */
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

	setOrdersRowData: (orders) => {
		set({ ordersRowData: orders });
	},
});
