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
			// Optimize: Only persist critical data to reduce localStorage overhead
			partialize: (state) => {
				// Skip heavy arrays and non-critical state
				const {
					commits,
					redos,
					undoStack,
					todos,
					notes,
					attachments,
					templates,
					searchResults,
					highlightedRowId,
					...rest
				} = state;
				return rest;
			},
		},
	),
);
