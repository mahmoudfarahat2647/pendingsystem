"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CombinedStore } from "./types";
import { createOrdersSlice } from "./slices/ordersSlice";
import { createInventorySlice } from "./slices/inventorySlice";
import { createBookingSlice } from "./slices/bookingSlice";
import { createNotificationSlice } from "./slices/notificationSlice";
import { createUISlice } from "./slices/uiSlice";
import { createHistorySlice } from "./slices/historySlice";

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
			name: "pending-sys-storage",
			// Only persist necessary state to avoid large local storage operations blocking hydration
			// We intentionally do NOT persist commits/redos (undo/redo history) to keep localStorage lightweight
			partialize: (state) => {
				const { commits, redos, ...rest } = state;
				return rest;
			},
		}
	)
);
