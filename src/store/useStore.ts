"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId, getCalculatorValues } from "@/lib/utils";
import type { AppNotification, AppState, CommitLog, PartStatusDef, PendingRow } from "@/types";

interface AppActions {
	// Order Actions
	addOrder: (order: PendingRow) => void;
	addOrders: (orders: PendingRow[]) => void;
	updateOrder: (id: string, updates: Partial<PendingRow>) => void;
	updateOrders: (ids: string[], updates: Partial<PendingRow>) => void;
	deleteOrders: (ids: string[]) => void;

	// Dynamic List Actions
	addModel: (model: string) => void;
	removeModel: (model: string) => void;
	addRepairSystem: (system: string) => void;
	removeRepairSystem: (system: string) => void;

	// Movement Actions
	commitToMainSheet: (ids: string[]) => void;
	sendToCallList: (ids: string[]) => void;
	sendToBooking: (
		ids: string[],
		bookingDate: string,
		bookingNote?: string,
		bookingStatus?: string,
	) => void;
	sendToArchive: (ids: string[], actionNote?: string) => void;
	sendToReorder: (ids: string[], actionNote: string) => void;

	// Part Status
	updatePartStatus: (id: string, partStatus: string) => void;
	addPartStatusDef: (status: PartStatusDef) => void;
	removePartStatusDef: (id: string) => void;

	// Booking Status
	updateBookingStatus: (id: string, bookingStatus: string) => void;
	addBookingStatusDef: (status: PartStatusDef) => void;
	removeBookingStatusDef: (id: string) => void;

	// History
	addCommit: (actionName: string) => void;
	restoreToCommit: (commitId: string) => void;
	undo: () => void;
	redo: () => void;
	clearHistory: () => void;
	commitSave: () => void;
	debouncedCommit: (actionName: string) => void;

	// Todos
	addTodo: (text: string) => void;
	toggleTodo: (id: string) => void;
	deleteTodo: (id: string) => void;

	// Notes
	addNote: (content: string, color: string) => void;
	updateNote: (id: string, content: string) => void;
	deleteNote: (id: string) => void;

	// Reset
	resetStore: () => void;

	// Template Actions
	addNoteTemplate: (template: string) => void;
	removeNoteTemplate: (template: string) => void;
	addReminderTemplate: (template: string) => void;
	removeReminderTemplate: (template: string) => void;

	searchTerm: string;
	setSearchTerm: (term: string) => void;

	// Notifications
	addNotification: (
		notification: Omit<AppNotification, "id" | "timestamp" | "isRead">,
	) => void;
	markNotificationAsRead: (id: string) => void;
	removeNotification: (id: string) => void;
	clearNotifications: () => void;
	checkNotifications: () => void;
	setHighlightedRowId: (id: string | null) => void;
}



const defaultPartStatuses: PartStatusDef[] = [
	{ id: "arrived", label: "Arrived", color: "bg-emerald-500" },
	{ id: "not_arrived", label: "Not Arrived", color: "bg-gray-800" },
	{ id: "logistics", label: "Logistics Pending", color: "bg-yellow-400" },
	{ id: "branch", label: "Other Branch", color: "bg-amber-800" },
	{ id: "issue", label: "Has Issue", color: "bg-red-500" },
];

const defaultBookingStatuses: PartStatusDef[] = [
	{ id: "add", label: "Add", color: "bg-emerald-500" },
	{ id: "cancel", label: "Cancel", color: "bg-red-500" },
	{ id: "reschedule", label: "Reschedule", color: "bg-blue-500" },
];

const initialState: AppState = {
	rowData: [],
	ordersRowData: [],
	bookingRowData: [],
	callRowData: [],
	archiveRowData: [],
	todos: [],
	notes: [],
	partStatuses: defaultPartStatuses,
	bookingStatuses: defaultBookingStatuses,
	models: [
		"Megane IV",
		"Clio V",
		"Kadjar",
		"Captur II",
		"Duster II",
		"Talisman",
	],
	repairSystems: ["Mechanical", "Electrical", "Body", "ضمان"],
	noteTemplates: ["Customer not available", "Wrong number", "Will call back"],
	reminderTemplates: ["Follow up call", "Check part status", "Confirm booking"],
	bookingTemplates: ["Morning slot", "Afternoon slot", "Next available"],
	reasonTemplates: ["Wrong part", "Customer cancelled", "Part damaged"],
	commits: [],
	redos: [],
	searchTerm: "",
	notifications: [],
	highlightedRowId: null,
};



let commitTimer: NodeJS.Timeout | null = null;

export const useAppStore = create<AppState & AppActions>()(
	persist(
		(set, get) => ({
			...initialState,

			// Order Actions
			addOrder: (order) => {
				set((state) => ({
					ordersRowData: [...state.ordersRowData, order],
				}));
				get().addCommit("Add Order");
			},

			addOrders: (orders) => {
				set((state) => ({
					ordersRowData: [...state.ordersRowData, ...orders],
				}));
				get().addCommit("Add Multiple Orders");
			},

			updateOrder: (id, updates) => {
				console.log(`[Store] Updating order ${id}:`, updates);
				const updateInArray = (arr: PendingRow[]) =>
					arr.map((row) => (row.id === id ? { ...row, ...updates } : row));

				set((state) => ({
					rowData: updateInArray(state.rowData),
					ordersRowData: updateInArray(state.ordersRowData),
					bookingRowData: updateInArray(state.bookingRowData),
					callRowData: updateInArray(state.callRowData),
					archiveRowData: updateInArray(state.archiveRowData),
				}));
				get().debouncedCommit(`Update Order: ${id}`);
			},

			updateOrders: (ids, updates) => {
				const updateInArray = (arr: PendingRow[]) =>
					arr.map((row) =>
						ids.includes(row.id) ? { ...row, ...updates } : row,
					);

				set((state) => ({
					rowData: updateInArray(state.rowData),
					ordersRowData: updateInArray(state.ordersRowData),
					bookingRowData: updateInArray(state.bookingRowData),
					callRowData: updateInArray(state.callRowData),
					archiveRowData: updateInArray(state.archiveRowData),
				}));
				get().debouncedCommit("Bulk Update Orders");
			},

			deleteOrders: (ids) => {
				const filterArray = (arr: PendingRow[]) =>
					arr.filter((row) => !ids.includes(row.id));

				set((state) => ({
					rowData: filterArray(state.rowData),
					ordersRowData: filterArray(state.ordersRowData),
					bookingRowData: filterArray(state.bookingRowData),
					callRowData: filterArray(state.callRowData),
					archiveRowData: filterArray(state.archiveRowData),
				}));
				get().addCommit("Delete Orders");
			},

			// Dynamic List Actions
			addModel: (model) => {
				set((state) => ({
					models: state.models.includes(model)
						? state.models
						: [...state.models, model],
				}));
				get().addCommit("Add Model");
			},
			removeModel: (model) => {
				set((state) => ({
					models: state.models.filter((m) => m !== model),
				}));
				get().addCommit("Remove Model");
			},
			addRepairSystem: (system) => {
				set((state) => ({
					repairSystems: state.repairSystems.includes(system)
						? state.repairSystems
						: [...state.repairSystems, system],
				}));
				get().addCommit("Add Repair System");
			},
			removeRepairSystem: (system) => {
				set((state) => ({
					repairSystems: state.repairSystems.filter((s) => s !== system),
				}));
				get().addCommit("Remove Repair System");
			},

			// Movement Actions
			commitToMainSheet: (ids) => {
				set((state) => {
					const ordersToMove = state.ordersRowData.filter((r) =>
						ids.includes(r.id),
					);
					const updatedOrders = ordersToMove.map((r) => ({
						...r,
						status: "Pending" as const,
						trackingId: `MAIN-${r.baseId}`,
					}));

					return {
						ordersRowData: state.ordersRowData.filter(
							(r) => !ids.includes(r.id),
						),
						rowData: [...state.rowData, ...updatedOrders],
					};
				});
				get().addCommit("Commit to Main Sheet");
			},

			sendToCallList: (ids) => {
				set((state) => {
					const rowsToMove = state.rowData.filter((r) => ids.includes(r.id));
					const updatedRows = rowsToMove.map((r) => ({
						...r,
						status: "Call" as const,
						trackingId: `CALL-${r.baseId}`,
					}));

					return {
						rowData: state.rowData.filter((r) => !ids.includes(r.id)),
						callRowData: [...state.callRowData, ...updatedRows],
					};
				});
				get().addCommit("Send to Call List");
			},

			sendToBooking: (ids, bookingDate, bookingNote, bookingStatus) => {
				set((state) => {
					// Check all three possible sources: Main Sheet, Orders, and Call List
					const rowsFromMainSheet = state.rowData.filter((r) =>
						ids.includes(r.id),
					);
					const rowsFromOrders = state.ordersRowData.filter((r) =>
						ids.includes(r.id),
					);
					const rowsFromCallList = state.callRowData.filter((r) =>
						ids.includes(r.id),
					);

					// Combine all found rows
					const rowsToMove = [
						...rowsFromMainSheet,
						...rowsFromOrders,
						...rowsFromCallList,
					];

					const updatedRows = rowsToMove.map((r) => ({
						...r,
						status: "Booked" as const,
						trackingId: `BOOK-${r.baseId}`,
						bookingDate,
						bookingNote,
						bookingStatus: bookingStatus || r.bookingStatus,
					}));

					return {
						rowData: state.rowData.filter((r) => !ids.includes(r.id)),
						ordersRowData: state.ordersRowData.filter(
							(r) => !ids.includes(r.id),
						),
						callRowData: state.callRowData.filter((r) => !ids.includes(r.id)),
						bookingRowData: [...state.bookingRowData, ...updatedRows],
					};
				});
				get().addCommit("Send to Booking");
			},

			sendToArchive: (ids, actionNote) => {
				set((state) => {
					const rowsToMove = state.bookingRowData.filter((r) =>
						ids.includes(r.id),
					);
					const updatedRows = rowsToMove.map((r) => ({
						...r,
						status: "Archived" as const,
						trackingId: `ARCH-${r.baseId}`,
						actionNote,
					}));

					return {
						bookingRowData: state.bookingRowData.filter(
							(r) => !ids.includes(r.id),
						),
						archiveRowData: [...state.archiveRowData, ...updatedRows],
					};
				});
				get().addCommit("Send to Archive");
			},

			sendToReorder: (ids, actionNote) => {
				set((state) => {
					const rowsToMove = state.bookingRowData.filter((r) =>
						ids.includes(r.id),
					);
					const updatedRows = rowsToMove.map((r) => ({
						...r,
						status: "Reorder" as const,
						trackingId: `ORD-${r.baseId}`,
						actionNote,
						bookingDate: undefined,
						bookingNote: undefined,
					}));

					return {
						bookingRowData: state.bookingRowData.filter(
							(r) => !ids.includes(r.id),
						),
						ordersRowData: [...state.ordersRowData, ...updatedRows],
					};
				});
				get().addCommit("Send to Reorder");
			},

			// Part Status
			updatePartStatus: (id, partStatus) => {
				const updateInArray = (arr: PendingRow[]) =>
					arr.map((row) => (row.id === id ? { ...row, partStatus } : row));

				set((state) => ({
					rowData: updateInArray(state.rowData),
					ordersRowData: updateInArray(state.ordersRowData),
					bookingRowData: updateInArray(state.bookingRowData),
					callRowData: updateInArray(state.callRowData),
					archiveRowData: updateInArray(state.archiveRowData),
				}));
				get().debouncedCommit("Update Part Status");
			},

			addPartStatusDef: (status) => {
				set((state) => ({
					partStatuses: [...state.partStatuses, status],
				}));
				get().addCommit("Add Part Status Definition");
			},

			removePartStatusDef: (id) => {
				set((state) => ({
					partStatuses: state.partStatuses.filter((s) => s.id !== id),
				}));
				get().addCommit("Remove Part Status Definition");
			},

			// Booking Status
			updateBookingStatus: (id, bookingStatus) => {
				const updateInArray = (arr: PendingRow[]) =>
					arr.map((row) => (row.id === id ? { ...row, bookingStatus } : row));

				set((state) => ({
					rowData: updateInArray(state.rowData),
					ordersRowData: updateInArray(state.ordersRowData),
					bookingRowData: updateInArray(state.bookingRowData),
					callRowData: updateInArray(state.callRowData),
					archiveRowData: updateInArray(state.archiveRowData),
				}));
				get().debouncedCommit("Update Booking Status");
			},

			addBookingStatusDef: (status) => {
				set((state) => ({
					bookingStatuses: [...state.bookingStatuses, status],
				}));
				get().addCommit("Add Booking Status Definition");
			},

			removeBookingStatusDef: (id) => {
				set((state) => ({
					bookingStatuses: state.bookingStatuses.filter((s) => s.id !== id),
				}));
				get().addCommit("Remove Booking Status Definition");
			},

			// History
			addCommit: (actionName) => {
				if (commitTimer) {
					clearTimeout(commitTimer);
					commitTimer = null;
				}

				const state = get();
				const snapshot = {
					rowData: structuredClone(state.rowData),
					ordersRowData: structuredClone(state.ordersRowData),
					bookingRowData: structuredClone(state.bookingRowData),
					callRowData: structuredClone(state.callRowData),
					archiveRowData: structuredClone(state.archiveRowData),
					bookingStatuses: structuredClone(state.bookingStatuses),
				};

				const commit: CommitLog = {
					id: generateId(),
					actionName,
					timestamp: new Date().toISOString(),
					snapshot,
				};

				set((state) => {
					// Filter history to keep only last 48 hours
					const fortyEightHoursAgo = new Date();
					fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

					const filteredCommits = state.commits.filter(
						(c) => new Date(c.timestamp) > fortyEightHoursAgo,
					);

					return {
						commits: [...filteredCommits.slice(-49), commit],
						redos: [],
					};
				});
			},

			debouncedCommit: (actionName) => {
				if (commitTimer) clearTimeout(commitTimer);
				commitTimer = setTimeout(() => {
					get().addCommit(actionName);
					commitTimer = null;
				}, 1000);
			},

			restoreToCommit: (commitId) => {
				const state = get();
				const targetCommit = state.commits.find((c) => c.id === commitId);

				if (targetCommit) {
					set({
						...targetCommit.snapshot,
						redos: [],
					});
					// Add a restoration record to history
					get().addCommit(`Restored to: ${targetCommit.actionName}`);
				}
			},

			undo: () => {
				const state = get();
				if (state.commits.length === 0) return;

				const currentSnapshot = {
					rowData: structuredClone(state.rowData),
					ordersRowData: structuredClone(state.ordersRowData),
					bookingRowData: structuredClone(state.bookingRowData),
					callRowData: structuredClone(state.callRowData),
					archiveRowData: structuredClone(state.archiveRowData),
					bookingStatuses: structuredClone(state.bookingStatuses),
				};

				const lastCommit = state.commits[state.commits.length - 1];

				set({
					...lastCommit.snapshot,
					commits: state.commits.slice(0, -1),
					redos: [
						...state.redos,
						{
							id: generateId(),
							actionName: "Redo",
							timestamp: new Date().toISOString(),
							snapshot: currentSnapshot,
						},
					],
				});
			},

			redo: () => {
				const state = get();
				if (state.redos.length === 0) return;

				const currentSnapshot = {
					rowData: structuredClone(state.rowData),
					ordersRowData: structuredClone(state.ordersRowData),
					bookingRowData: structuredClone(state.bookingRowData),
					callRowData: structuredClone(state.callRowData),
					archiveRowData: structuredClone(state.archiveRowData),
					bookingStatuses: structuredClone(state.bookingStatuses),
				};

				const lastRedo = state.redos[state.redos.length - 1];

				set({
					...lastRedo.snapshot,
					redos: state.redos.slice(0, -1),
					commits: [
						...state.commits,
						{
							id: generateId(),
							actionName: "Undo",
							timestamp: new Date().toISOString(),
							snapshot: currentSnapshot,
						},
					],
				});
			},

			clearHistory: () => {
				set({ commits: [], redos: [] });
			},

			commitSave: () => {
				// Manual checkpoint
				get().addCommit("Manual Checkpoint");
				// Clear future redo history since we branch from here
				set({ redos: [] });
			},

			// Todos
			addTodo: (text) => {
				set((state) => ({
					todos: [
						...state.todos,
						{
							id: generateId(),
							text,
							completed: false,
							createdAt: new Date().toISOString(),
						},
					],
				}));
				get().addCommit("Add Todo");
			},

			toggleTodo: (id) => {
				set((state) => ({
					todos: state.todos.map((todo) =>
						todo.id === id ? { ...todo, completed: !todo.completed } : todo,
					),
				}));
				get().debouncedCommit("Toggle Todo");
			},

			deleteTodo: (id) => {
				set((state) => ({
					todos: state.todos.filter((todo) => todo.id !== id),
				}));
				get().addCommit("Delete Todo");
			},

			// Notes
			addNote: (content, color) => {
				set((state) => ({
					notes: [
						...state.notes,
						{
							id: generateId(),
							content,
							color,
							createdAt: new Date().toISOString(),
						},
					],
				}));
				get().addCommit("Add Note");
			},

			updateNote: (id, content) => {
				set((state) => ({
					notes: state.notes.map((note) =>
						note.id === id ? { ...note, content } : note,
					),
				}));
				get().addCommit("Update Note");
			},

			deleteNote: (id) => {
				set((state) => ({
					notes: state.notes.filter((note) => note.id !== id),
				}));
				get().addCommit("Delete Note");
			},

			// Template Actions
			addNoteTemplate: (template) => {
				set((state) => ({
					noteTemplates: [...state.noteTemplates, template],
				}));
				get().addCommit("Add Note Template");
			},

			removeNoteTemplate: (template) => {
				set((state) => ({
					noteTemplates: state.noteTemplates.filter((t) => t !== template),
				}));
				get().addCommit("Remove Note Template");
			},

			addReminderTemplate: (template) => {
				set((state) => ({
					reminderTemplates: [...state.reminderTemplates, template],
				}));
				get().addCommit("Add Reminder Template");
			},

			removeReminderTemplate: (template) => {
				set((state) => ({
					reminderTemplates: state.reminderTemplates.filter(
						(t) => t !== template,
					),
				}));
				get().addCommit("Remove Reminder Template");
			},

			// Reset
			resetStore: () => {
				set(initialState);
				get().addCommit("Reset Store");
			},

			// Search
			searchTerm: "",
			setSearchTerm: (term) => set({ searchTerm: term }),

			// Notifications
			addNotification: (notification: Omit<AppNotification, "id" | "timestamp" | "isRead">) => {
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
				const state = get();
				const now = new Date();

				const newNotifications: Omit<
					AppNotification,
					"id" | "timestamp" | "isRead"
				>[] = [];

				// Helpers to check if already notified
				// For reminders, we check if we've notified for this specific reminder content/time
				const hasReminder = (rowId: string, reminderDate: string) =>
					state.notifications.some(
						(n) =>
							n.type === "reminder" &&
							n.referenceId === rowId &&
							// Basic check to see if it's the same reminder (could be enhanced with a unique ID per reminder if needed)
							// For now, if we have a notification for this row, we assume it's handled unless the user clears it.
							// However, re-notifying for the SAME reminder is bad. Notifying for a CHANGED reminder is good.
							// Let's rely on the user clearing the notification for now, or check timestamp if available.
							// Simplest approach: ONE active reminder notification per row. User must clear it to get another.
							true,
					);
				const hasWarrantyAlert = (vin: string) =>
					state.notifications.some(
						(n) => n.type === "warranty" && n.vin === vin,
					);

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

							// Check if we already have a notification for this row
							const alreadyNotified = state.notifications.some(
								(n) => n.type === "reminder" && n.referenceId === row.id
							);

							if (!alreadyNotified && now >= reminderDate) {
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
							!hasWarrantyAlert(row.vin)
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
					// Add notifications if any
					for (const n of newNotifications) {
						get().addNotification(n);
					}
				}
			},

			setHighlightedRowId: (id) => {
				set({ highlightedRowId: id });
				if (id) {
					// Auto-clear after 5 seconds
					setTimeout(() => {
						if (get().highlightedRowId === id) {
							set({ highlightedRowId: null });
						}
					}, 5000);
				}
			},
		}),


		{
			name: "pending-sys-storage",
			// Only persist necessary state to avoid large local storage operations blocking hydration
			// We intentionally do NOT persist commits/redos (undo/redo history) to keep localStorage lightweight
			// and ensure a clean state after a system restart/refresh, as requested.
			partialize: (state) => ({
				rowData: state.rowData,
				ordersRowData: state.ordersRowData,
				bookingRowData: state.bookingRowData,
				callRowData: state.callRowData,
				archiveRowData: state.archiveRowData,
				todos: state.todos,
				notes: state.notes,
				partStatuses: state.partStatuses,
				bookingStatuses: state.bookingStatuses,
				models: state.models,
				repairSystems: state.repairSystems,
				noteTemplates: state.noteTemplates,
				reminderTemplates: state.reminderTemplates,
				notifications: state.notifications,
			}),

		},
	),
);

import { useStore } from "zustand";

// Selector hook for better performance pattern usage
export const useAppStoreSelector = <T>(
	selector: (state: AppState & AppActions) => T,
): T => {
	return useStore(useAppStore, selector);
};
