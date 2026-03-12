import { clone, diff, patch } from "jsondiffpatch";
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
	lastSavedState: null,

	pushUndo: () => {
		const state = get();
		const currentSnapshot = {
			rowData: state.rowData,
			ordersRowData: state.ordersRowData,
			bookingRowData: state.bookingRowData,
			callRowData: state.callRowData,
			archiveRowData: state.archiveRowData,
		};

		set((state) => {
			if (!state.lastSavedState) {
				return {
					lastSavedState: clone(currentSnapshot),
					undoStack: [],
					redoStack: [],
				};
			}

			const diffPatch = diff(currentSnapshot, state.lastSavedState);
			if (!diffPatch) return {}; // No state changes

			const newUndoStack = [...state.undoStack, diffPatch].slice(
				-UNDO_STACK_LIMIT,
			);

			return {
				undoStack: newUndoStack,
				redoStack: [], // New action clears redo stack
				lastSavedState: clone(currentSnapshot),
			};
		});
	},

	undo: () => {
		const state = get();
		if (!state.lastSavedState) return;

		const currentSnapshot = {
			rowData: state.rowData,
			ordersRowData: state.ordersRowData,
			bookingRowData: state.bookingRowData,
			callRowData: state.callRowData,
			archiveRowData: state.archiveRowData,
		};

		// The forward patch from B (lastSavedState) to C (current)
		const redoPatch = diff(state.lastSavedState, currentSnapshot);

		// If undoStack is empty AND there's no difference between lastSavedState and current state,
		// there's nothing to undo anymore.
		if (state.undoStack.length === 0 && !redoPatch) return;

		// We restore to lastSavedState
		const appState = clone(state.lastSavedState);

		// Now we pop the last undo patch and compute the new lastSavedState
		let newLastSavedState = clone(appState);
		const newUndoStack = [...state.undoStack];

		if (newUndoStack.length > 0) {
			const lastPatch = newUndoStack.pop();
			newLastSavedState = patch(clone(appState), lastPatch);
		}

		set({
			...appState,
			undoStack: newUndoStack,
			redoStack: redoPatch ? [...state.redoStack, redoPatch] : state.redoStack,
			lastSavedState: newLastSavedState,
		});
	},

	redo: () => {
		const state = get();
		if (state.redoStack.length === 0 || !state.lastSavedState) return;

		const currentSnapshot = {
			rowData: state.rowData,
			ordersRowData: state.ordersRowData,
			bookingRowData: state.bookingRowData,
			callRowData: state.callRowData,
			archiveRowData: state.archiveRowData,
		};

		const newRedoStack = [...state.redoStack];
		// Pop redo patch to apply to current state
		const forwardPatch = newRedoStack.pop();
		if (!forwardPatch) return; // shouldn't happen but for type safety

		const nextState = patch(clone(currentSnapshot), forwardPatch);

		// Compute undo patch for the new state (diff from nextState back to currentSnapshot)
		const undoPatch = diff(nextState, currentSnapshot);

		set({
			...nextState,
			redoStack: newRedoStack,
			undoStack: undoPatch ? [...state.undoStack, undoPatch] : state.undoStack,
			// The state we are reverting to if we click 'undo' next time is the currentSnapshot
			lastSavedState: clone(currentSnapshot),
		});
	},

	clearUndoRedo: () => {
		set({ undoStack: [], redoStack: [], lastSavedState: null });
	},
});
