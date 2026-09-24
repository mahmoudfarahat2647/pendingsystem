import type { StateCreator } from "zustand";
import { getNormalizedVinBuckets } from "@/domain/order/orderWorkflow";
import { ORDER_STAGES } from "@/lib/constants";
import { ORDER_STAGE_TAB_INFO } from "@/lib/orderStage";
import { generateId } from "@/lib/utils";
import type { AppNotification, PendingRow } from "@/types";
import { getOrdersQueryAdapter } from "../ordersQueryAdapter";
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
> = (set) => ({
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

	restoreNotification: (notification) => {
		set((state) => {
			const dismissedManagedNotificationKeys = {
				...state.dismissedManagedNotificationKeys,
			};
			if (notification.managedKey) {
				delete dismissedManagedNotificationKeys[notification.managedKey];
			}
			return {
				notifications: state.notifications.some(
					(existing) => existing.id === notification.id,
				)
					? state.notifications
					: [notification, ...state.notifications].slice(0, 100),
				dismissedManagedNotificationKeys,
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
		const now = new Date();
		const WARRANTY_THRESHOLD_DAYS = 35;

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

		const adapter = getOrdersQueryAdapter();
		const rows: PendingRow[] = adapter.getDueNotificationCandidates() ?? [];
		const allCachesLoaded =
			adapter.isDueCandidatesLoaded() && adapter.areReleaseFollowUpsLoaded();
		const activeManagedKeys = new Set<string>();

		for (const row of rows) {
			const tabInfo = row.stage ? ORDER_STAGE_TAB_INFO[row.stage] : undefined;
			const tabName = tabInfo?.name ?? "Orders";
			const path = tabInfo?.path ?? "/orders";

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
						titleKey: "notifications.reminderTitle",
						descriptionKey: "notifications.reminderDescription",
						params: {
							date: row.reminder.date,
							time: row.reminder.time || "",
							customer: row.customerName,
							subject: row.reminder.subject,
						},
						title: "Reminder Due",
						description: `Due: ${row.reminder.date} ${row.reminder.time || ""} - ${row.customerName}: ${row.reminder.subject}`,
						referenceId: row.id,
						vin: row.vin,
						trackingId: row.trackingId,
						tabName,
						path,
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

					if (daysRemaining >= 0 && daysRemaining <= WARRANTY_THRESHOLD_DAYS) {
						const managedKey = `warranty:${row.id}:${row.endWarranty}`;
						activeManagedKeys.add(managedKey);

						currentlyDueWarranties.push({
							type: "warranty",
							titleKey: "notifications.warrantyTitle",
							descriptionKey: "notifications.warrantyDescription",
							params: {
								days: daysRemaining,
								date: row.endWarranty,
							},
							title: "Warranty Expiring",
							description: `Warranty expires in ${daysRemaining} days (${row.endWarranty})`,
							referenceId: row.id,
							vin: row.vin,
							trackingId: row.trackingId,
							tabName,
							path,
							managedKey,
						});
					}
				}
			}
		}

		const currentlyDueFollowUps: Omit<
			AppNotification,
			"id" | "timestamp" | "isRead"
		>[] = [];

		const bookingRows = rows.filter((row) => row.stage === "booking");
		{
			const seenKeys = new Set<string>();
			for (const row of bookingRows) {
				if (!row.bookingDate) continue;
				const key = `${row.vin}::${row.bookingDate}`;
				if (seenKeys.has(key)) continue;
				seenKeys.add(key);

				const [year, month, day] = row.bookingDate.split("-").map(Number);
				const followUpAt = new Date(year, month - 1, day + 1, 10, 0, 0);

				if (now >= followUpAt) {
					const managedKey = `booking_followup:${row.vin}:${row.bookingDate}`;
					activeManagedKeys.add(managedKey);

					currentlyDueFollowUps.push({
						type: "booking_followup",
						titleKey: "notifications.bookingFollowUpTitle",
						descriptionKey: "notifications.bookingFollowUpDescription",
						params: {
							customer: row.customerName,
							vin: row.vin,
						},
						title: "Booking Follow-up",
						description: `${row.customerName} — VIN ${row.vin}`,
						referenceId: row.id,
						vin: row.vin,
						bookingDate: row.bookingDate,
						trackingId: row.trackingId,
						tabName: "Booking",
						path: "/booking",
						managedKey,
					});
				}
			}
		}

		// CNTR RDG Warning scan — Main Sheet warranty rows only
		const HIGH_RISK_KM = 85_000;
		const EARLY_WARNING_KM = 70_000;
		const HIGH_RISK_DAYS = 10;
		const EARLY_WARNING_DAYS = 14;
		const WARRANTY_REPAIR_SYSTEM = "ضمان";
		const MS_PER_DAY = 1000 * 60 * 60 * 24;

		const currentlyDueCntrWarnings: Omit<
			AppNotification,
			"id" | "timestamp" | "isRead"
		>[] = [];

		const mainSheetRows = rows.filter((row) => row.stage === "main");
		for (const row of mainSheetRows) {
			if (row.repairSystem !== WARRANTY_REPAIR_SYSTEM) continue;
			if (!row.createdAt) continue;

			const daysSinceCreation = Math.floor(
				(now.getTime() - new Date(row.createdAt).getTime()) / MS_PER_DAY,
			);
			if (Number.isNaN(daysSinceCreation)) continue;

			let level: "high" | "early" | null = null;
			if (row.cntrRdg >= HIGH_RISK_KM && daysSinceCreation >= HIGH_RISK_DAYS) {
				level = "high";
			} else if (
				row.cntrRdg >= EARLY_WARNING_KM &&
				daysSinceCreation >= EARLY_WARNING_DAYS
			) {
				level = "early";
			}

			if (!level) continue;

			const managedKey = `cntr_rdg_warning:${row.id}:${level}`;
			activeManagedKeys.add(managedKey);

			const titleKey =
				level === "high"
					? ("notifications.cntrWarningHighTitle" as const)
					: ("notifications.cntrWarningEarlyTitle" as const);
			const descriptionKey = "notifications.cntrWarningDescription" as const;
			const params = {
				customer: row.customerName,
				km: row.cntrRdg.toLocaleString(),
				vin: row.vin,
			};

			currentlyDueCntrWarnings.push({
				type: "cntr_rdg_warning",
				cntrRdgLevel: level,
				titleKey,
				descriptionKey,
				params,
				title:
					level === "high"
						? "High Risk: CNTR RDG Warning"
						: "Early Warning: CNTR RDG",
				description: `${row.customerName} — ${row.cntrRdg.toLocaleString()} KM (VIN: ${row.vin})`,
				referenceId: row.id,
				vin: row.vin,
				trackingId: row.trackingId,
				tabName: "Main Sheet",
				path: "/main-sheet",
				managedKey,
			});
		}

		// Release follow-up notifications (issue #242) — one per normalized VIN
		// whose follow-up is currently due. Resolved from the release-follow-ups
		// adapter, not from `rows`, since a follow-up can be due while none of
		// its rows are in the notification-candidate set (e.g. it moved stage).
		const currentlyDueReleaseFollowUps: Omit<
			AppNotification,
			"id" | "timestamp" | "isRead"
		>[] = [];

		const followUps = adapter.getReleaseFollowUps() ?? [];
		const allStageRows = ORDER_STAGES.flatMap(
			(stage) => adapter.getStageRows(stage) ?? [],
		);
		const vinBuckets = getNormalizedVinBuckets(allStageRows);
		for (const followUp of followUps) {
			const dueDate = new Date(followUp.nextDueAt);
			if (Number.isNaN(dueDate.getTime()) || now < dueDate) continue;

			const siblingRows = vinBuckets.get(followUp.vin) ?? [];
			const representativeRow =
				siblingRows.find((row) => row.id === followUp.referenceRowId) ??
				siblingRows[0];
			const tabInfo = representativeRow?.stage
				? ORDER_STAGE_TAB_INFO[representativeRow.stage]
				: undefined;

			const managedKey = `release_followup:${followUp.vin}:${followUp.nextDueAt}`;
			activeManagedKeys.add(managedKey);

			currentlyDueReleaseFollowUps.push({
				type: "release_followup",
				titleKey: "notifications.releaseFollowUpTitle",
				descriptionKey: "notifications.releaseFollowUpDescription",
				params: {
					vin: followUp.vin,
				},
				title: "Release Follow-up Due",
				description: `Warranty chassis VIN ${followUp.vin} may now be past 5,000 km — re-confirm release before moving to Call List.`,
				// Never fall back to the VIN string here: `referenceId` is
				// documented as "ID of the row" and gets written straight back
				// into the `reference_row_id` UUID column when this
				// notification is later snoozed (see
				// releaseFollowUpRepository.upsert). Prefer a live sibling
				// row's real id over an unresolvable reference.
				referenceId: followUp.referenceRowId ?? representativeRow?.id ?? "",
				vin: followUp.vin,
				trackingId: representativeRow?.trackingId ?? "",
				tabName: tabInfo?.name ?? "Orders",
				path: tabInfo?.path ?? "/orders",
				managedKey,
			});
		}

		// 2. Synchronize store state
		set((state) => {
			// Keep non-reminder AND non-warranty notifications
			// We only manage reminders and warranties here
			const preservedNotifications = state.notifications.filter(
				(n) =>
					n.type !== "reminder" &&
					n.type !== "warranty" &&
					n.type !== "booking_followup" &&
					n.type !== "cntr_rdg_warning" &&
					n.type !== "release_followup",
			);

			const newNotifications: AppNotification[] = [];
			let hasChanges = false;

			// Helper to process a list of due items
			const processDueItems = (
				dueItems: Omit<AppNotification, "id" | "timestamp" | "isRead">[],
				type: AppNotification["type"],
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
						if (
							existing.path !== due.path ||
							existing.tabName !== due.tabName
						) {
							hasChanges = true;
						}
						newNotifications.push({
							...existing,
							titleKey: due.titleKey ?? existing.titleKey,
							descriptionKey: due.descriptionKey ?? existing.descriptionKey,
							params: due.params ?? existing.params,
							path: due.path,
							tabName: due.tabName,
						});
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
			processDueItems(currentlyDueFollowUps, "booking_followup");
			processDueItems(currentlyDueCntrWarnings, "cntr_rdg_warning");
			processDueItems(currentlyDueReleaseFollowUps, "release_followup");

			// Check if any old items were removed
			const oldManagedCount = state.notifications.filter(
				(n) =>
					n.type === "reminder" ||
					n.type === "warranty" ||
					n.type === "booking_followup" ||
					n.type === "cntr_rdg_warning" ||
					n.type === "release_followup",
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
	},
});
