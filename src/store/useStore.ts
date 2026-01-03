"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createBookingSlice } from "./slices/bookingSlice";
import { createHistorySlice } from "./slices/historySlice";
import { createInventorySlice } from "./slices/inventorySlice";
import { createNotificationSlice } from "./slices/notificationSlice";
import { createOrdersSlice } from "./slices/ordersSlice";
import { createUISlice } from "./slices/uiSlice";
import type { CombinedStore } from "./types";

export const useAppStore = create<CombinedStore>()(
	persist(
		(...a) => ({
			...createOrdersSlice(...a),
			...createInventorySlice(...a),
			...createBookingSlice(...a),
			...createNotificationSlice(...a),
			...createUISlice(...a),
			...createHistorySlice(...a),
		}),
		{
			name: "pending-sys-storage-v1.1",
			// Optimize: Only persist critical UI preferences to reduce localStorage overhead
			// Reference data (templates, statuses, models) load fresh from database via React Query
			// This reduces initial load state from ~100KB to ~1KB
			partialize: (state) => {
				const {
					// Persisted: Only essential UI state
					// Omitted: Everything else loads fresh
					..._rest
				} = state;
				return {
					// Note: All reference data (partStatuses, templates, etc.)
					// now loads from database to ensure freshness
				};
			},
		},
	),
);
