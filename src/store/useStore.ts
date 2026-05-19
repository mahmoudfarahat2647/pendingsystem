"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createBookingSlice } from "./slices/bookingSlice";
import { createDraftSessionSlice } from "./slices/draftSessionSlice";
import { createGridSlice } from "./slices/gridSlice";
import { createInventorySlice } from "./slices/inventorySlice";
import { createNotificationSlice } from "./slices/notificationSlice";
import { createOrdersSlice } from "./slices/ordersSlice";
import { createReportSettingsSlice } from "./slices/reportSettingsSlice";
import { createUISlice, defaultPartStatuses } from "./slices/uiSlice";
import type { CombinedStore } from "./types";

export const useAppStore = create<CombinedStore>()(
	persist(
		(...a) => ({
			...createOrdersSlice(...a),
			...createInventorySlice(...a),
			...createBookingSlice(...a),
			...createNotificationSlice(...a),
			...createUISlice(...a),
			...createDraftSessionSlice(...a),
			...createGridSlice(...a),
			...createReportSettingsSlice(...a),
		}),
		{
			name: "pending-sys-storage-v1.1",
			version: 1,
			// Migrate v0 (pre-static-colors) → v1: reset partStatuses to new locked defaults
			// while preserving all other persisted data (templates, notes, grid layouts, etc.)
			migrate: (persistedState: unknown, version: number) => {
				if (version === 0) {
					const old = persistedState as Record<string, unknown>;
					return { ...old, partStatuses: defaultPartStatuses };
				}
				return persistedState;
			},
			storage: createJSONStorage(() =>
				typeof window !== "undefined"
					? localStorage
					: {
							getItem: () => null,
							setItem: () => {},
							removeItem: () => {},
						},
			),
			partialize: (state) => ({
				partStatuses: state.partStatuses,
				bookingStatuses: state.bookingStatuses,
				isLocked: state.isLocked,
				notes: state.notes,
				gridStates: state.gridStates,
				defaultLayouts: state.defaultLayouts,
				dismissedManagedNotificationKeys:
					state.dismissedManagedNotificationKeys,
			}),
		},
	),
);
