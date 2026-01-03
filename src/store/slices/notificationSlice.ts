import type { StateCreator } from "zustand";
import { generateId } from "@/lib/utils";
import type { AppNotification } from "@/types";
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
> = (set, get) => ({
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

	checkNotifications: () => {
		const state = get() as CombinedStore;
		const now = new Date();

		// CRITICAL: Notification Sync Strategy
		// This function implements a strict synchronization strategy.
		// 1. We identify ONLY reminders that are currently due (now >= reminderDate).
		// 2. We then REBUILD the notification list to match this exact set.
		// 3. This automatically handles REMOVAL of notifications if a reminder is:
		//    a) Deleted
		//    b) Rescheduled to the future
		// DO NOT revert to a simple "append only" logic, or future reminders will get stuck in the list.

		// 1. Identify all reminders that should currently be showing
		const currentlyDueReminders: Omit<
			AppNotification,
			"id" | "timestamp" | "isRead"
		>[] = [];

		const sources = [
			{ data: state.rowData, name: "Main Sheet", path: "/main-sheet" },
			{ data: state.ordersRowData, name: "Orders", path: "/orders" },
			{ data: state.bookingRowData, name: "Booking", path: "/booking" },
			{ data: state.callRowData, name: "Call List", path: "/call-list" },
		];

		for (const source of sources) {
			for (const row of source.data) {
				if (row.reminder) {
					const reminderDateStr = `${row.reminder.date}T${row.reminder.time || "00:00"}`;
					const reminderDate = new Date(reminderDateStr);

					if (now >= reminderDate) {
						currentlyDueReminders.push({
							type: "reminder",
							title: "Reminder Due",
							description: `Due: ${row.reminder.date} ${row.reminder.time || ""} - ${row.customerName}: ${row.reminder.subject}`,
							referenceId: row.id,
							vin: row.vin,
							trackingId: row.trackingId,
							tabName: source.name,
							path: source.path,
						});
					}
				}
			}
		}

		// 2. Synchronize store state
		set((state) => {
			// Keep non-reminder notifications
			const nonReminderNotifications = state.notifications.filter(
				(n) => n.type !== "reminder",
			);

			// Rebuild the reminder notifications list
			const updatedReminderNotifications: AppNotification[] = [];
			let hasChanges = false;

			for (const due of currentlyDueReminders) {
				// Check if we already have a notification for this exact reminder (refId + description)
				const existing = state.notifications.find(
					(n) =>
						n.type === "reminder" &&
						n.referenceId === due.referenceId &&
						n.description === due.description,
				);

				if (existing) {
					updatedReminderNotifications.push(existing);
				} else {
					// New due reminder found
					updatedReminderNotifications.push({
						...due,
						id: generateId(),
						timestamp: new Date().toISOString(),
						isRead: false,
					});
					hasChanges = true;
				}
			}

			// Check if any old reminders were removed
			const oldReminderCount = state.notifications.filter(
				(n) => n.type === "reminder",
			).length;
			if (updatedReminderNotifications.length !== oldReminderCount) {
				hasChanges = true;
			}

			if (!hasChanges) return state;

			return {
				notifications: [
					...updatedReminderNotifications,
					...nonReminderNotifications,
				].slice(0, 100),
			};
		});
	},
});
