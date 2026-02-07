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
		const state = get();
		const snapshot = {
			rowData: structuredClone(state.rowData),
			ordersRowData: structuredClone(state.ordersRowData),
			bookingRowData: structuredClone(state.bookingRowData),
			callRowData: structuredClone(state.callRowData),
			archiveRowData: structuredClone(state.archiveRowData),
		};

		set((state) => ({
			undoStack: [...state.undoStack, snapshot].slice(-UNDO_STACK_LIMIT),
			redoStack: [], // New action clears redo stack
		}));
	},

	undo: () => {
		const state = get();
		if (state.undoStack.length === 0) return;

		const currentSnapshot = {
			rowData: structuredClone(state.rowData),
			ordersRowData: structuredClone(state.ordersRowData),
			bookingRowData: structuredClone(state.bookingRowData),
			callRowData: structuredClone(state.callRowData),
			archiveRowData: structuredClone(state.archiveRowData),
		};

		const lastSnapshot = state.undoStack[state.undoStack.length - 1];

		set({
			...lastSnapshot,
			undoStack: state.undoStack.slice(0, -1),
			redoStack: [...state.redoStack, currentSnapshot],
		});
	},

	redo: () => {
		const state = get();
		if (state.redoStack.length === 0) return;

		const currentSnapshot = {
			rowData: structuredClone(state.rowData),
			ordersRowData: structuredClone(state.ordersRowData),
			bookingRowData: structuredClone(state.bookingRowData),
			callRowData: structuredClone(state.callRowData),
			archiveRowData: structuredClone(state.archiveRowData),
		};

		const nextSnapshot = state.redoStack[state.redoStack.length - 1];

		set({
			...nextSnapshot,
			redoStack: state.redoStack.slice(0, -1),
			undoStack: [...state.undoStack, currentSnapshot],
		});
	},

	clearUndoRedo: () => {
		set({ undoStack: [], redoStack: [] });
	},
});

// TODO: If state size grows significantly, consider diff-based snapshots instead of full clones.
