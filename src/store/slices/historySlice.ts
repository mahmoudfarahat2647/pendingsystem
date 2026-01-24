

import type { StateCreator } from "zustand";
import type { CombinedStore, HistoryActions, HistoryState } from "../types";

export const createHistorySlice: StateCreator<
	CombinedStore,
	[["zustand/persist", unknown]],
	[],
	HistoryState & HistoryActions
> = (set, get) => ({
	// Simplified History Slice (No longer tracking 48h history)

	addCommit: () => {
		// No-op: History feature removed
	},

	debouncedCommit: () => {
		// No-op: History feature removed
	},

	commitSave: () => {
		// Ctrl+S functionality: Checkpoint/Save
		// Just clears session undo/redo history as a "save point"
		get().clearUndoRedo();
	},
});
