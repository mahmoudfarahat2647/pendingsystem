"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createBookingSlice } from "./slices/bookingSlice";
import { createInventorySlice } from "./slices/inventorySlice";
import { createNotificationSlice } from "./slices/notificationSlice";
import { createOrdersSlice } from "./slices/ordersSlice";
import { createUISlice } from "./slices/uiSlice";
import { createGridSlice } from "./slices/gridSlice";
import { createReportSettingsSlice } from "./slices/reportSettingsSlice";
import { createUndoRedoSlice } from "./slices/undoRedoSlice";
import type { CombinedStore } from "./types";

export const useAppStore = create<CombinedStore>()(
	persist(
		(...a) => ({
			...createOrdersSlice(...a),
			...createInventorySlice(...a),
			...createBookingSlice(...a),
			...createNotificationSlice(...a),
			...createUISlice(...a),
			...createUndoRedoSlice(...a),
			...createGridSlice(...a),
			...createReportSettingsSlice(...a),
		}),
		{
			name: "pending-sys-storage-v1.1",
			// SSR-safe storage: Only access localStorage in browser environment
			storage: createJSONStorage(() =>
				typeof window !== "undefined" ? localStorage : {
					getItem: () => null,
					setItem: () => { },
					removeItem: () => { },
				}
			),
			// Optimize: Only persist critical UI preferences to reduce localStorage overhead
			// Reference data (templates, statuses, models) load fresh from database via React Query
			// This reduces initial load state from ~100KB to ~1KB
			partialize: (state) => ({
				// Persist UI preferences and reference data
				partStatuses: state.partStatuses,
				bookingStatuses: state.bookingStatuses,
				noteTemplates: state.noteTemplates,
				reminderTemplates: state.reminderTemplates,
				bookingTemplates: state.bookingTemplates,
				reasonTemplates: state.reasonTemplates,
				models: state.models,
				repairSystems: state.repairSystems,
				isLocked: state.isLocked,
				notes: state.notes,
				todos: state.todos,
				gridStates: state.gridStates,
			}),
		},
	),
);
