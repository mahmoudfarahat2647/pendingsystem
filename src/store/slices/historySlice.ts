import type { StateCreator } from "zustand";
import { generateId } from "@/lib/utils";
import type { CommitLog } from "@/types";
import type { CombinedStore, HistoryActions, HistoryState } from "../types";
import { restoreService } from "@/services/restoreService";
import { toast } from "sonner";

let commitTimer: NodeJS.Timeout | null = null;

export const createHistorySlice: StateCreator<
	CombinedStore,
	[["zustand/persist", unknown]],
	[],
	HistoryState & HistoryActions
> = (set, get) => ({
	commits: [],
	undoStack: [],
	redos: [],
	isRestoring: false,

	setIsRestoring: (val: boolean) => set({ isRestoring: val }),

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
			// Filter history to keep only last 48 hours for Audit Log
			const fortyEightHoursAgo = new Date();
			fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

			const filteredCommits = state.commits.filter(
				(c) => new Date(c.timestamp) > fortyEightHoursAgo,
			);

			return {
				commits: [...filteredCommits.slice(-49), commit], // Audit Log (Persistent)
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

	restoreToCommit: async (commitId) => {
		const state = get();
		const targetCommit = state.commits.find((c) => c.id === commitId);

		if (targetCommit) {
			try {
				set({ isRestoring: true });

				// 1. Sync to Supabase
				await restoreService.restoreSnapshot(targetCommit.snapshot);

				// 2. Update Local State
				set({
					...targetCommit.snapshot,
					isRestoring: false,
				});

				// 3. Record the restoration in history
				get().addCommit(`Restored to: ${targetCommit.actionName}`);

				toast.success(`System restored to: ${targetCommit.actionName}`);
			} catch (error) {
				console.error("Restoration failed:", error);
				set({ isRestoring: false });
				toast.error("Restoration failed. Please check your connection.");
			}
		}
	},

	clearHistory: () => {
		set({ commits: [] });
	},

	commitSave: () => {
		// Ctrl+S functionality: Checkpoint/Save
		get().addCommit("Manual Checkpoint (Saved)");
		get().clearUndoRedo(); // Clear session undo/redo history (intentional)
	},
});
