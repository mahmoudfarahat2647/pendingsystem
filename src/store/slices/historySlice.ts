import type { StateCreator } from "zustand";
import type { CombinedStore, HistoryState, HistoryActions } from "../types";
import type { CommitLog } from "@/types";
import { generateId } from "@/lib/utils";

let commitTimer: NodeJS.Timeout | null = null;

export const createHistorySlice: StateCreator<
    CombinedStore,
    [["zustand/persist", unknown]],
    [],
    HistoryState & HistoryActions
> = (set, get) => ({
    commits: [],
    redos: [],

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
                (c) => new Date(c.timestamp) > fortyEightHoursAgo
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
        get().addCommit("Manual Checkpoint");
        set({ redos: [] });
    },
});
