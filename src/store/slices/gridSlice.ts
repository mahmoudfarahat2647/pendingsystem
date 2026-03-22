import type { GridState } from "ag-grid-community";
import type { StateCreator } from "zustand";
import type { CombinedStore } from "../types";

interface GridSlice {
	/**
	 * Map of grid states indexed by a unique grid key (e.g., 'orders', 'main-sheet').
	 */
	gridStates: Record<string, GridState>;

	/**
	 * In-memory snapshots of the latest grid state before the user explicitly saves it.
	 */
	liveGridStates: Record<string, GridState>;

	/**
	 * Track which layouts have unsaved changes.
	 */
	dirtyLayouts: Record<string, boolean>;

	/**
	 * Store default layouts for each grid (user-defined defaults).
	 */
	defaultLayouts: Record<string, GridState>;

	/**
	 * Saves the state of a specific grid.
	 * @param gridKey Unique identifier for the grid.
	 * @param state The current state object from AG Grid api.getState().
	 */
	saveGridState: (gridKey: string, state: GridState) => void;

	/**
	 * Retrieves the saved state for a specific grid.
	 * @param gridKey Unique identifier for the grid.
	 * @returns The saved GridState or null if not found.
	 */
	getGridState: (gridKey: string) => GridState | null;

	/**
	 * Tracks the latest live state for a specific grid.
	 * @param gridKey Unique identifier for the grid.
	 * @param state The current state object from AG Grid api.getState().
	 */
	setLiveGridState: (gridKey: string, state: GridState) => void;

	/**
	 * Retrieves the latest live state for a specific grid.
	 * @param gridKey Unique identifier for the grid.
	 * @returns The live GridState or null if not found.
	 */
	getLiveGridState: (gridKey: string) => GridState | null;

	/**
	 * Clears the saved state for a specific grid.
	 * @param gridKey Unique identifier for the grid.
	 */
	clearGridState: (gridKey: string) => void;

	/**
	 * Marks a layout as dirty or clean.
	 */
	setLayoutDirty: (gridKey: string, dirty: boolean) => void;

	/**
	 * Saves the current layout as the default for a grid.
	 */
	saveAsDefaultLayout: (gridKey: string, state: GridState) => void;

	/**
	 * Gets the default layout for a grid.
	 */
	getDefaultLayout: (gridKey: string) => GridState | null;
}

export const createGridSlice: StateCreator<CombinedStore, [], [], GridSlice> = (
	set,
	get,
) => ({
	gridStates: {},
	liveGridStates: {},
	dirtyLayouts: {},
	defaultLayouts: {},

	saveGridState: (gridKey, state) => {
		set((prev) => ({
			gridStates: {
				...prev.gridStates,
				[gridKey]: state,
			},
		}));
	},

	getGridState: (gridKey) => {
		return get().gridStates[gridKey] || null;
	},

	setLiveGridState: (gridKey, state) => {
		set((prev) => ({
			liveGridStates: {
				...prev.liveGridStates,
				[gridKey]: state,
			},
		}));
	},

	getLiveGridState: (gridKey) => {
		return get().liveGridStates[gridKey] || null;
	},

	clearGridState: (gridKey) => {
		set((prev) => {
			const newStates = { ...prev.gridStates };
			delete newStates[gridKey];
			const newLiveStates = { ...prev.liveGridStates };
			delete newLiveStates[gridKey];
			const newDirty = { ...prev.dirtyLayouts };
			delete newDirty[gridKey];
			return {
				gridStates: newStates,
				liveGridStates: newLiveStates,
				dirtyLayouts: newDirty,
			};
		});
	},

	setLayoutDirty: (gridKey, dirty) => {
		set((prev) => ({
			dirtyLayouts: {
				...prev.dirtyLayouts,
				[gridKey]: dirty,
			},
		}));
	},

	saveAsDefaultLayout: (gridKey, state) => {
		set((prev) => ({
			defaultLayouts: {
				...prev.defaultLayouts,
				[gridKey]: state,
			},
		}));
	},

	getDefaultLayout: (gridKey) => {
		return get().defaultLayouts[gridKey] || null;
	},
});
