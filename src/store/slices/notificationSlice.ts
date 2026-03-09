import type { StateCreator } from "zustand";
import {
	getOrdersByStageFromCache,
	isStageCacheLoaded,
} from "@/lib/queryClient";
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
	dismissedManagedNotificationKeys: {},

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
		set((state) => {
			const notification = state.notifications.find((n) => n.id === id);
			const newDismissed = { ...state.dismissedManagedNotificationKeys };

			if (notification?.managedKey) {
				newDismissed[notification.managedKey] = true;
			}

			return {
				notifications: state.notifications.filter((n) => n.id !== id),
				dismissedManagedNotificationKeys: newDismissed,
			};
		});
	},

	clearNotifications: () => {
		set((state) => {
			const newDismissed = { ...state.dismissedManagedNotificationKeys };
			for (const notification of state.notifications) {
				if (notification.managedKey) {
					newDismissed[notification.managedKey] = true;
				}
			}
			return {
				notifications: [],
				dismissedManagedNotificationKeys: newDismissed,
			};
		});
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
			{
				data: getOrdersByStageFromCache("main"),
				isLoaded: isStageCacheLoaded("main"),
				name: "Main Sheet",
				path: "/main-sheet",
			},
			{
				data: getOrdersByStageFromCache("orders"),
				isLoaded: isStageCacheLoaded("orders"),
				name: "Orders",
				path: "/orders",
			},
			{
				data: getOrdersByStageFromCache("booking"),
				isLoaded: isStageCacheLoaded("booking"),
				name: "Booking",
				path: "/booking",
			},
			{
				data: getOrdersByStageFromCache("call"),
				isLoaded: isStageCacheLoaded("call"),
				name: "Call List",
				path: "/call-list",
			},
		];

		const allCachesLoaded = sources.every((s) => s.isLoaded);
		const activeManagedKeys = new Set<string>();

		for (const source of sources) {
			for (const row of source.data) {
				// Check Reminders
				if (row.reminder) {
					const reminderTimeStr = row.reminder.time || "00:00";
					const reminderDateStr = `${row.reminder.date}T${reminderTimeStr}`;
					const reminderDate = new Date(reminderDateStr);

					if (now >= reminderDate) {
						const managedKey = `reminder:${row.id}:${row.reminder.date}:${reminderTimeStr}:${row.reminder.subject}`;
						activeManagedKeys.add(managedKey);

						currentlyDueReminders.push({
							type: "reminder",
							title: "Reminder Due",
							description: `Due: ${row.reminder.date} ${row.reminder.time || ""} - ${row.customerName}: ${row.reminder.subject}`,
							referenceId: row.id,
							vin: row.vin,
							trackingId: row.trackingId,
							tabName: source.name,
							path: source.path,
							managedKey,
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
							const managedKey = `warranty:${row.id}:${row.endWarranty}`;
							activeManagedKeys.add(managedKey);

							currentlyDueWarranties.push({
								type: "warranty",
								title: "Warranty Expiring",
								description: `Warranty expires in ${daysRemaining} days (${row.endWarranty})`,
								referenceId: row.id,
								vin: row.vin,
								trackingId: row.trackingId,
								tabName: source.name,
								path: source.path,
								managedKey,
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
					if (
						due.managedKey &&
						state.dismissedManagedNotificationKeys[due.managedKey]
					) {
						continue; // User already dismissed this managed item
					}

					// Check if we already have a notification for this exact managed item
					const existing = state.notifications.find(
						(n) =>
							n.type === type &&
							n.referenceId === due.referenceId &&
							due.managedKey !== undefined &&
							n.managedKey === due.managedKey,
					);

					if (existing) {
						newNotifications.push(existing);
					} else {
						// New due item found (or updated subject causing a different key)
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

			// Memory Leak Guard: Prune dismissed keys for items that are no longer actively due
			// ONLY run this pruning if all caches are fully loaded. Because if a cache is unloaded,
			// activeManagedKeys will be incomplete and we would falsely delete valid dismissals.
			if (allCachesLoaded) {
				const nextDismissedKeys: Record<string, true> = {};
				let keysChanged = false;

				for (const dismissedKey of Object.keys(
					state.dismissedManagedNotificationKeys,
				)) {
					if (activeManagedKeys.has(dismissedKey)) {
						nextDismissedKeys[dismissedKey] = true;
					} else {
						keysChanged = true;
					}
				}

				if (!hasChanges && !keysChanged) return state;

				return {
					notifications: [...newNotifications, ...preservedNotifications].slice(
						0,
						100,
					),
					dismissedManagedNotificationKeys: nextDismissedKeys,
				};
			}

			if (!hasChanges) return state;

			return {
				notifications: [...newNotifications, ...preservedNotifications].slice(
					0,
					100,
				),
				dismissedManagedNotificationKeys:
					state.dismissedManagedNotificationKeys,
			};
		});
		// 3. Auto-archive expired warranties
		const expiredIds = sources.flatMap((source) =>
			source.data
				.filter((row) => {
					if (!row.endWarranty) return false;
					const endDate = new Date(row.endWarranty);
					return (
						!Number.isNaN(endDate.getTime()) &&
						endDate.getTime() < now.getTime()
					);
				})
				.map((row) => row.id),
		);

		if (expiredIds.length > 0) {
			state.sendToArchive(expiredIds, "Auto-archived: Warranty expired");
			// Trigger background update if orderService available
			import("@/services/orderService")
				.then(({ orderService }) => {
					orderService.updateOrdersStage(expiredIds, "archive");
				})
				.catch((err) =>
					console.error("Auto-archive background sync failed:", err),
				);
		}
	},
});
