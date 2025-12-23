"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
    AppState,
    PendingRow,
    CommitLog,
    PartStatusDef,
    TodoItem,
    StickyNote
} from "@/types";
import { generateId } from "@/lib/utils";

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
    sendToBooking: (ids: string[], bookingDate: string, bookingNote?: string) => void;
    sendToArchive: (ids: string[], actionNote?: string) => void;
    sendToReorder: (ids: string[], actionNote: string) => void;

    // Part Status
    updatePartStatus: (id: string, partStatus: string) => void;
    addPartStatusDef: (status: PartStatusDef) => void;
    removePartStatusDef: (id: string) => void;

    // History
    addCommit: (actionName: string) => void;
    restoreToCommit: (commitId: string) => void;
    undo: () => void;
    redo: () => void;
    clearHistory: () => void;
    commitSave: () => void;

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
}

const defaultPartStatuses: PartStatusDef[] = [
    { id: 'arrived', label: 'Arrived', color: 'bg-emerald-500' },
    { id: 'not_arrived', label: 'Not Arrived', color: 'bg-gray-800' },
    { id: 'logistics', label: 'Logistics Pending', color: 'bg-yellow-400' },
    { id: 'branch', label: 'Other Branch', color: 'bg-amber-800' },
    { id: 'issue', label: 'Has Issue', color: 'bg-red-500' }
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
    models: ["Megane IV", "Clio V", "Kadjar", "Captur II", "Duster II", "Talisman"],
    repairSystems: ["Mechanical", "Electrical", "Body", "ضمان"],
    noteTemplates: ["Customer not available", "Wrong number", "Will call back"],
    reminderTemplates: ["Follow up call", "Check part status", "Confirm booking"],
    bookingTemplates: ["Morning slot", "Afternoon slot", "Next available"],
    reasonTemplates: ["Wrong part", "Customer cancelled", "Part damaged"],
    commits: [],
    redos: [],
    searchTerm: "",
};

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
                const updateInArray = (arr: PendingRow[]) =>
                    arr.map((row) => (row.id === id ? { ...row, ...updates } : row));

                set((state) => ({
                    rowData: updateInArray(state.rowData),
                    ordersRowData: updateInArray(state.ordersRowData),
                    bookingRowData: updateInArray(state.bookingRowData),
                    callRowData: updateInArray(state.callRowData),
                    archiveRowData: updateInArray(state.archiveRowData),
                }));
                get().addCommit("Update Order");
            },

            updateOrders: (ids, updates) => {
                const updateInArray = (arr: PendingRow[]) =>
                    arr.map((row) => (ids.includes(row.id) ? { ...row, ...updates } : row));

                set((state) => ({
                    rowData: updateInArray(state.rowData),
                    ordersRowData: updateInArray(state.ordersRowData),
                    bookingRowData: updateInArray(state.bookingRowData),
                    callRowData: updateInArray(state.callRowData),
                    archiveRowData: updateInArray(state.archiveRowData),
                }));
                get().addCommit("Bulk Update Orders");
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
                    models: state.models.includes(model) ? state.models : [...state.models, model]
                }));
                get().addCommit("Add Model");
            },
            removeModel: (model) => {
                set((state) => ({
                    models: state.models.filter(m => m !== model)
                }));
                get().addCommit("Remove Model");
            },
            addRepairSystem: (system) => {
                set((state) => ({
                    repairSystems: state.repairSystems.includes(system) ? state.repairSystems : [...state.repairSystems, system]
                }));
                get().addCommit("Add Repair System");
            },
            removeRepairSystem: (system) => {
                set((state) => ({
                    repairSystems: state.repairSystems.filter(s => s !== system)
                }));
                get().addCommit("Remove Repair System");
            },

            // Movement Actions
            commitToMainSheet: (ids) => {
                set((state) => {
                    const ordersToMove = state.ordersRowData.filter((r) =>
                        ids.includes(r.id)
                    );
                    const updatedOrders = ordersToMove.map((r) => ({
                        ...r,
                        status: "Pending" as const,
                        trackingId: `MAIN-${r.baseId}`,
                    }));

                    return {
                        ordersRowData: state.ordersRowData.filter(
                            (r) => !ids.includes(r.id)
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

            sendToBooking: (ids, bookingDate, bookingNote) => {
                set((state) => {
                    const rowsToMove = state.callRowData.filter((r) =>
                        ids.includes(r.id)
                    );
                    const updatedRows = rowsToMove.map((r) => ({
                        ...r,
                        status: "Booked" as const,
                        trackingId: `BOOK-${r.baseId}`,
                        bookingDate,
                        bookingNote,
                    }));

                    return {
                        callRowData: state.callRowData.filter((r) => !ids.includes(r.id)),
                        bookingRowData: [...state.bookingRowData, ...updatedRows],
                    };
                });
                get().addCommit("Send to Booking");
            },

            sendToArchive: (ids, actionNote) => {
                set((state) => {
                    const rowsToMove = state.bookingRowData.filter((r) =>
                        ids.includes(r.id)
                    );
                    const updatedRows = rowsToMove.map((r) => ({
                        ...r,
                        status: "Archived" as const,
                        trackingId: `ARCH-${r.baseId}`,
                        actionNote,
                    }));

                    return {
                        bookingRowData: state.bookingRowData.filter(
                            (r) => !ids.includes(r.id)
                        ),
                        archiveRowData: [...state.archiveRowData, ...updatedRows],
                    };
                });
                get().addCommit("Send to Archive");
            },

            sendToReorder: (ids, actionNote) => {
                set((state) => {
                    const rowsToMove = state.bookingRowData.filter((r) =>
                        ids.includes(r.id)
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
                            (r) => !ids.includes(r.id)
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
                get().addCommit("Update Part Status");
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

            // History
            addCommit: (actionName) => {
                const state = get();
                const snapshot = {
                    rowData: structuredClone(state.rowData),
                    ordersRowData: structuredClone(state.ordersRowData),
                    bookingRowData: structuredClone(state.bookingRowData),
                    callRowData: structuredClone(state.callRowData),
                    archiveRowData: structuredClone(state.archiveRowData),
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

                    const filteredCommits = state.commits.filter(c =>
                        new Date(c.timestamp) > fortyEightHoursAgo
                    );

                    return {
                        commits: [...filteredCommits.slice(-49), commit],
                        redos: [],
                    };
                });
            },

            restoreToCommit: (commitId) => {
                const state = get();
                const targetCommit = state.commits.find(c => c.id === commitId);

                if (targetCommit) {
                    set({
                        ...targetCommit.snapshot,
                        redos: []
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
                        todo.id === id ? { ...todo, completed: !todo.completed } : todo
                    ),
                }));
                get().addCommit("Toggle Todo");
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
                        note.id === id ? { ...note, content } : note
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
                    reminderTemplates: state.reminderTemplates.filter((t) => t !== template),
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
        }),
        {
            name: "pending-sys-storage",
            // Only persist necessary state to avoid large local storage operations blocking hydration
            // Note: We intentionally do NOT persist commits/redos (undo/redo history) to keep localStorage lightweight
            // Data is persisted for crash protection, but undo/redo history is session-only
            partialize: (state) => ({
                rowData: state.rowData,
                ordersRowData: state.ordersRowData,
                bookingRowData: state.bookingRowData,
                callRowData: state.callRowData,
                archiveRowData: state.archiveRowData,
                todos: state.todos,
                notes: state.notes,
                partStatuses: state.partStatuses,
                models: state.models,
                repairSystems: state.repairSystems,
                noteTemplates: state.noteTemplates,
                reminderTemplates: state.reminderTemplates,
                commits: state.commits, // Persist history for crash protection
            }),
        }
    )
);

import { useStore } from 'zustand';

// Selector hook for better performance pattern usage
export const useAppStoreSelector = <T>(selector: (state: AppState & AppActions) => T): T => {
    return useStore(useAppStore, selector);
};

