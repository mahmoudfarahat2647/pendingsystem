import type { StateCreator } from "zustand";
import type { GridState } from "ag-grid-community";
import type { CombinedStore } from "../types";

export interface GridSlice {
    /**
     * Map of grid states indexed by a unique grid key (e.g., 'orders', 'main-sheet').
     */
    gridStates: Record<string, GridState>;

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
     * Clears the saved state for a specific grid.
     * @param gridKey Unique identifier for the grid.
     */
    clearGridState: (gridKey: string) => void;
}

export const createGridSlice: StateCreator<
    CombinedStore,
    [],
    [],
    GridSlice
> = (set, get) => ({
    gridStates: {},

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

    clearGridState: (gridKey) => {
        set((prev) => {
            const newStates = { ...prev.gridStates };
            delete newStates[gridKey];
            return { gridStates: newStates };
        });
    },
});
