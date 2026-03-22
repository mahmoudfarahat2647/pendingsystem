import type { GridState } from "ag-grid-community";
import { create } from "zustand";

interface LiveGridStore {
	liveGridStates: Record<string, GridState>;
	setLiveGridState: (gridKey: string, state: GridState) => void;
	getLiveGridState: (gridKey: string) => GridState | null;
	clearLiveGridState: (gridKey: string) => void;
	clearAllLiveGridStates: () => void;
}

/**
 * In-memory store for ephemeral grid layout snapshots.
 * This is deliberately kept outside the persisted useAppStore to avoid
 * high-frequency localStorage writes during column resize/move drags.
 */
export const useLiveGridStore = create<LiveGridStore>()((set, get) => ({
	liveGridStates: {},

	setLiveGridState: (gridKey, state) =>
		set((store) => ({
			liveGridStates: { ...store.liveGridStates, [gridKey]: state },
		})),

	getLiveGridState: (gridKey) => get().liveGridStates[gridKey] || null,

	clearLiveGridState: (gridKey) =>
		set((store) => {
			const next = { ...store.liveGridStates };
			delete next[gridKey];
			return { liveGridStates: next };
		}),

	clearAllLiveGridStates: () => set({ liveGridStates: {} }),
}));
