"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useLiveGridStore } from "@/store/useLiveGridStore";
import { useAppStore } from "@/store/useStore";

/**
 * Hook to track and manage column layout changes for a specific grid.
 */
export function useColumnLayoutTracker(gridKey: string) {
	const isDirty = useAppStore((state) => state.dirtyLayouts[gridKey] || false);
	const setLayoutDirty = useAppStore((state) => state.setLayoutDirty);
	const clearGridState = useAppStore((state) => state.clearGridState);
	const saveGridState = useAppStore((state) => state.saveGridState);
	const saveAsDefaultLayout = useAppStore((state) => state.saveAsDefaultLayout);
	const getDefaultLayout = useAppStore((state) => state.getDefaultLayout);
	const getGridState = useAppStore((state) => state.getGridState);
	const getLiveGridState = useLiveGridStore((state) => state.getLiveGridState);
	const clearLiveGridState = useLiveGridStore(
		(state) => state.clearLiveGridState,
	);

	const markDirty = useCallback(() => {
		if (!isDirty) {
			setLayoutDirty(gridKey, true);
		}
	}, [gridKey, isDirty, setLayoutDirty]);

	const saveLayout = useCallback(() => {
		const currentState = getLiveGridState(gridKey) || getGridState(gridKey);
		if (currentState) {
			saveGridState(gridKey, currentState);
		}

		setLayoutDirty(gridKey, false);
		toast.success("Grid layout saved successfully");
	}, [gridKey, getGridState, getLiveGridState, saveGridState, setLayoutDirty]);

	const saveAsDefault = useCallback(() => {
		const currentState = getLiveGridState(gridKey) || getGridState(gridKey);
		if (currentState) {
			saveGridState(gridKey, currentState);
			saveAsDefaultLayout(gridKey, currentState);
			setLayoutDirty(gridKey, false);
			toast.success("Layout saved as default");
		}
	}, [
		gridKey,
		getGridState,
		getLiveGridState,
		saveAsDefaultLayout,
		saveGridState,
		setLayoutDirty,
	]);

	const resetLayout = useCallback(() => {
		const defaultLayout = getDefaultLayout(gridKey);
		if (defaultLayout) {
			// User has a saved default, restore to that
			// Clear current state will trigger a reload with the default
			clearGridState(gridKey);
			setLayoutDirty(gridKey, false);
			toast.info("Resetting to your default layout. Refreshing...");
			window.location.reload();
		} else {
			// No user-defined default, clear everything to use the original code default
			clearGridState(gridKey);
			clearLiveGridState(gridKey);
			setLayoutDirty(gridKey, false);
			toast.info("Resetting to original layout. Refreshing...");
			window.location.reload();
		}
	}, [gridKey, clearGridState, clearLiveGridState, setLayoutDirty, getDefaultLayout]);

	return {
		isDirty,
		markDirty,
		saveLayout,
		saveAsDefault,
		resetLayout,
	};
}
