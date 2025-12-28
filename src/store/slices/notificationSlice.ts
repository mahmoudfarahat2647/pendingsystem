import type { StateCreator } from "zustand";
import type { CombinedStore, NotificationState, NotificationActions } from "../types";
import type { AppNotification } from "@/types";
import { generateId, getCalculatorValues } from "@/lib/utils";

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
                n.id === id ? { ...n, isRead: true } : n
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

        const newNotifications: Omit<
            AppNotification,
            "id" | "timestamp" | "isRead"
        >[] = [];

        // Optimized: Cache existing IDs once instead of filtering/mapping multiple times
        const existingReminders = new Set<string>();
        const existingWarranties = new Set<string>();

        for (const n of state.notifications) {
            if (n.type === "reminder") {
                existingReminders.add(n.referenceId);
            } else if (n.type === "warranty") {
                existingWarranties.add(n.vin);
            }
        }

        const sources = [
            { data: state.rowData, name: "Main Sheet", path: "/main-sheet" },
            { data: state.ordersRowData, name: "Orders", path: "/orders" },
            { data: state.bookingRowData, name: "Booking", path: "/booking" },
            { data: state.callRowData, name: "Call List", path: "/call-list" },
        ];

        for (const source of sources) {
            for (const row of source.data) {
                // 1. Reminders
                if (row.reminder) {
                    const reminderDateStr = `${row.reminder.date}T${row.reminder.time || "00:00"}`;
                    const reminderDate = new Date(reminderDateStr);

                    if (!existingReminders.has(row.id) && now >= reminderDate) {
                        newNotifications.push({
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

                // 2. Warranty Expirations
                if (
                    row.repairSystem === "ضمان" &&
                    row.startWarranty &&
                    !existingWarranties.has(row.vin)
                ) {
                    const values = getCalculatorValues(row.startWarranty);
                    if (values && !values.expired) {
                        const endDate = new Date(row.startWarranty);
                        endDate.setFullYear(endDate.getFullYear() + 3);

                        const diffTime = endDate.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays <= 10 && diffDays > 0) {
                            newNotifications.push({
                                type: "warranty",
                                title: "Warranty Expiring",
                                description: `VIN ${row.vin} expires in ${diffDays} days`,
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

        if (newNotifications.length > 0) {
            const timestamp = new Date().toISOString();
            const notificationsWithIds = newNotifications.map(n => ({
                ...n,
                id: generateId(),
                timestamp,
                isRead: false
            }));

            set((state) => ({
                notifications: [
                    ...notificationsWithIds,
                    ...state.notifications,
                ].slice(0, 100),
            }));
        }
    },
});
