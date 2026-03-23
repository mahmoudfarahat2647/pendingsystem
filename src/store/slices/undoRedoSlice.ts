import type { StateCreator } from "zustand";
import type { CombinedStore, UndoRedoActions, UndoRedoState } from "../types";

const UNDO_STACK_LIMIT = 30;

export const createUndoRedoSlice: StateCreator<
	CombinedStore,
	[["zustand/persist", unknown]],
	[],
	UndoRedoState & UndoRedoActions
> = (set, get) => ({
	undoStack: [],
	redoStack: [],

	pushUndo: () => {
		// DEPRECATED: Use applyCommand() from draftSessionSlice instead
		// This is a no-op to maintain compatibility during migration
	},

	undo: () => {
		// DEPRECATED: Use undoDraft() from draftSessionSlice instead
		// This is a no-op to maintain compatibility during migration
	},

	redo: () => {
		// DEPRECATED: Use redoDraft() from draftSessionSlice instead
		// This is a no-op to maintain compatibility during migration
	},

	clearUndoRedo: () => {
		// DEPRECATED: Use discardDraft() from draftSessionSlice instead
		// This is a no-op to maintain compatibility during migration
	},
});

// TODO: If state size grows significantly, consider diff-based snapshots instead of full clones.
