import type { StateCreator } from "zustand";
import { generateId } from "@/lib/utils";
import type {
	CombinedStore,
	NotificationActions,
	NotificationState,
} from "../types";

export const createNotificationSlice: StateCreator<
	CombinedStore,
	[["zustand/persist", unknown]],
	[],
	NotificationState & NotificationActions
> = (set, _get) => ({
	notifications: [],

	addNotification: (notification) => {
		const id = generateId();
		const timestamp = new Date().toISOString();
		set((state) => ({
			notifications: [
				{ ...notification, id, timestamp, isRead: false },
				...state.notifications,
			].slice(0, 100), // Keep last 100
		}));
	},

	markNotificationAsRead: (id) => {
		set((state) => ({
			notifications: state.notifications.map((n) =>
				n.id === id ? { ...n, isRead: true } : n,
			),
		}));
	},

	removeNotification: (id) => {
		set((state) => ({
			notifications: state.notifications.filter((n) => n.id !== id),
		}));
	},

	clearNotifications: () => {
		set({ notifications: [] });
	},

	/**
	 * Check notifications - NOW READ-ONLY
	 *
	 * CRITICAL: This function has been converted to a read-only check per Audit Report finding #2.
	 * Previously, this function would auto-archive rows, causing destructive mutations on UI polling.
	 *
	 * Auto-archive functionality should be moved to a controlled backend job/cron instead.
	 * This function is now a NO-OP placeholder. Notification checking should be implemented
	 * by consuming React Query data directly from components.
	 */
	checkNotifications: () => {
		// NO-OP: Removed server data access and auto-archive side effects
		// Notifications should now be checked by components using React Query data
		// TODO: Implement notification checking using React Query cache if needed
	},
});
