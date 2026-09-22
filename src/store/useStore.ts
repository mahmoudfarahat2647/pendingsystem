"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { normalizeLocale } from "@/domain/locale/locale";
import { createDraftSessionSlice } from "./slices/draftSessionSlice";
import { createGridSlice } from "./slices/gridSlice";
import { createNotificationSlice } from "./slices/notificationSlice";
import { createUISlice, defaultPartStatuses } from "./slices/uiSlice";
import type { CombinedStore } from "./types";

// Wraps localStorage so a quota-limited or unavailable storage never throws
// out of the persist middleware. In-memory `set()` calls (e.g. switching
// language) must always succeed even when the disk write behind them fails —
// see #263 acceptance criteria.
const safeStorage = {
	getItem: (name: string): string | null => {
		if (typeof window === "undefined") return null;
		try {
			return window.localStorage.getItem(name);
		} catch {
			return null;
		}
	},
	setItem: (name: string, value: string): void => {
		if (typeof window === "undefined") return;
		try {
			window.localStorage.setItem(name, value);
		} catch {
			// Storage unavailable or quota-limited: the in-memory store already
			// applied the update via `set()`; only persistence is skipped.
		}
	},
	removeItem: (name: string): void => {
		if (typeof window === "undefined") return;
		try {
			window.localStorage.removeItem(name);
		} catch {
			// ignore
		}
	},
};

export const useAppStore = create<CombinedStore>()(
	persist(
		(...a) => ({
			...createNotificationSlice(...a),
			...createUISlice(...a),
			...createDraftSessionSlice(...a),
			...createGridSlice(...a),
		}),
		{
			name: "pending-sys-storage-v1.1",
			version: 1,
			// Migrate v0 (pre-static-colors) → v1: reset partStatuses to new locked defaults
			// while preserving all other persisted data (templates, notes, grid layouts, etc.)
			migrate: (persistedState: unknown, version: number) => {
				if (version === 0) {
					const old = persistedState as Record<string, unknown>;
					return { ...old, partStatuses: defaultPartStatuses };
				}
				return persistedState;
			},
			// Runs on *every* hydration, regardless of whether `migrate` ran —
			// unlike `migrate`, this also covers a malformed `locale` sitting
			// inside an otherwise-valid current-version snapshot (a legacy value,
			// a hand-edited storage entry, a future locale this build doesn't
			// know about, etc.). Everything else round-trips through the default
			// shallow merge unchanged.
			merge: (persistedState, currentState) => {
				const persisted = (persistedState ?? {}) as Partial<CombinedStore>;
				return {
					...currentState,
					...persisted,
					locale: normalizeLocale(persisted.locale),
				};
			},
			storage: createJSONStorage(() => safeStorage),
			partialize: (state) => ({
				partStatuses: state.partStatuses,
				bookingStatuses: state.bookingStatuses,
				isLocked: state.isLocked,
				gridEditPermission: state.gridEditPermission,
				notes: state.notes,
				gridStates: state.gridStates,
				defaultLayouts: state.defaultLayouts,
				dismissedManagedNotificationKeys:
					state.dismissedManagedNotificationKeys,
				locale: state.locale,
			}),
		},
	),
);
