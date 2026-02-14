import type { StateCreator } from "zustand";
import type { CombinedStore, UndoRedoActions, UndoRedoState } from "../types";

/**
 * Undo/Redo slice - Removed
 *
 * The undo/redo system has been removed as it relied on snapshotting server data.
 * React Query's optimistic updates provide immediate feedback, making undo/redo less critical.
 * Manual undo can be implemented via UI if needed in the future.
 *
 * This slice is kept as an empty placeholder to avoid breaking imports.
 */
export const createUndoRedoSlice: StateCreator<
	CombinedStore,
	[["zustand/persist", unknown]],
	[],
	UndoRedoState & UndoRedoActions
> = (_set, _get) => ({
	// Empty - undo/redo system removed
});
