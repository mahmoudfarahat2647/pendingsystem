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
		const WARRANTY_THRESHOLD_DAYS = 10;

		// CRITICAL: Notification Sync Strategy
		// This function implements a strict synchronization strategy.
		// 1. We identify ONLY reminders/warranties that are currently due.
		// 2. We then REBUILD the notification list to match this exact set.
		// 3. This automatically handles REMOVAL of notifications if a reminder is:
		//    a) Deleted
		//    b) Rescheduled to the future
		// DO NOT revert to a simple "append only" logic, or future reminders will get stuck in the list.

		// 1. Identify all reminders and warranties that should currently be showing
		const currentlyDueReminders: Omit<
			AppNotification,
			"id" | "timestamp" | "isRead"
		>[] = [];

		const currentlyDueWarranties: Omit<
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
				// Check Reminders
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

				// Check Warranty Expiration
				if (row.endWarranty) {
					const endDate = new Date(row.endWarranty);
					if (!Number.isNaN(endDate.getTime())) {
						const diffTime = endDate.getTime() - now.getTime();
						const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

						if (
							daysRemaining >= 0 &&
							daysRemaining <= WARRANTY_THRESHOLD_DAYS
						) {
							currentlyDueWarranties.push({
								type: "warranty",
								title: "Warranty Expiring",
								description: `Warranty expires in ${daysRemaining} days (${row.endWarranty})`,
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
		}

		// 2. Synchronize store state
		set((state) => {
			// Keep non-reminder AND non-warranty notifications
			// We only manage reminders and warranties here
			const preservedNotifications = state.notifications.filter(
				(n) => n.type !== "reminder" && n.type !== "warranty",
			);

			const newNotifications: AppNotification[] = [];
			let hasChanges = false;

			// Helper to process a list of due items
			const processDueItems = (
				dueItems: Omit<AppNotification, "id" | "timestamp" | "isRead">[],
				type: "reminder" | "warranty",
			) => {
				for (const due of dueItems) {
					// Check if we already have a notification for this exact item
					const existing = state.notifications.find(
						(n) =>
							n.type === type &&
							n.referenceId === due.referenceId &&
							n.description === due.description,
					);

					if (existing) {
						newNotifications.push(existing);
					} else {
						// New due item found (or updated description)
						newNotifications.push({
							...due,
							id: generateId(),
							timestamp: new Date().toISOString(),
							isRead: false,
						} as AppNotification);
						hasChanges = true;
					}
				}
			};

			processDueItems(currentlyDueReminders, "reminder");
			processDueItems(currentlyDueWarranties, "warranty");

			// Check if any old items were removed
			const oldManagedCount = state.notifications.filter(
				(n) => n.type === "reminder" || n.type === "warranty",
			).length;

			if (newNotifications.length !== oldManagedCount) {
				hasChanges = true;
			}

			if (!hasChanges) return state;

			return {
				notifications: [...newNotifications, ...preservedNotifications].slice(
					0,
					100,
				),
			};
		});
	},
});
