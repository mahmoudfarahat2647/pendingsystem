import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Supabase before importing anything that might use it
vi.mock("@/lib/supabase", () => ({
	supabase: {
		from: vi.fn(() => ({
			select: vi.fn(() => ({
				eq: vi.fn(() => ({
					single: vi.fn(() => Promise.resolve({ data: null, error: null })),
				})),
			})),
		})),
	},
}));

import { useColumnLayoutTracker } from "../hooks/useColumnLayoutTracker";
import { useLiveGridStore } from "../store/useLiveGridStore";
import { useAppStore } from "../store/useStore";

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		info: vi.fn(),
	},
}));

// jsdom marks `window.location` (and its methods) as [LegacyUnforgeable] as of
// jsdom v21+, so it can no longer be deleted/redefined via `delete` or
// `Object.defineProperty` under Vitest's `vmForks`/`vmThreads` pools (this repo
// uses `pool: "vmForks"` in vitest.config.ts). See jsdom/jsdom#3739 and
// vitest-dev/vitest#4018 (closed as "works as expected" by the Vitest team,
// since the strict pool intentionally mirrors real browser unforgeable
// semantics). `window.location.reload()` is a documented no-op under jsdom
// (navigation is "not implemented"), so calling it for real is safe; we spy on
// jsdom's internal virtual console to observe that the reload was attempted
// instead of replacing `window.location`.
function spyOnReloadAttempt() {
	const handler = vi.fn();
	const virtualConsole = (
		window as unknown as {
			_virtualConsole?: {
				on: (event: string, cb: (err: Error) => void) => void;
			};
		}
	)._virtualConsole;
	virtualConsole?.on("jsdomError", handler);
	return handler;
}

describe("useColumnLayoutTracker", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		useAppStore.setState({
			gridStates: {},
			dirtyLayouts: {},
			defaultLayouts: {},
		});
		useLiveGridStore.setState({
			liveGridStates: {},
		});
	});

	it("should initialize with isDirty as false", () => {
		const { result } = renderHook(() => useColumnLayoutTracker("test-grid"));
		expect(result.current.isDirty).toBe(false);
	});

	it("should mark layout as dirty", () => {
		const { result } = renderHook(() => useColumnLayoutTracker("test-grid"));

		act(() => {
			result.current.markDirty();
		});

		expect(result.current.isDirty).toBe(true);
	});

	it("should save layout and reset dirty state", () => {
		const { result } = renderHook(() => useColumnLayoutTracker("test-grid"));

		act(() => {
			result.current.markDirty();
		});
		expect(result.current.isDirty).toBe(true);

		act(() => {
			result.current.saveLayout();
		});

		expect(result.current.isDirty).toBe(false);
	});

	it("should save the latest live layout snapshot", () => {
		const persistedState = {
			columnOrder: { orderedColIds: ["vin", "customer"] },
		} as never;
		const liveState = {
			columnOrder: { orderedColIds: ["customer", "vin"] },
		} as never;

		useAppStore.getState().saveGridState("test-grid", persistedState);
		useLiveGridStore.getState().setLiveGridState("test-grid", liveState);
		useAppStore.getState().setLayoutDirty("test-grid", true);

		const { result } = renderHook(() => useColumnLayoutTracker("test-grid"));

		act(() => {
			result.current.saveLayout();
		});

		expect(useAppStore.getState().getGridState("test-grid")).toEqual(liveState);
		expect(result.current.isDirty).toBe(false);
	});

	it("should save the latest live layout as the default layout", () => {
		const liveState = {
			columnOrder: { orderedColIds: ["status", "vin"] },
		} as never;

		useLiveGridStore.getState().setLiveGridState("test-grid", liveState);
		useAppStore.getState().setLayoutDirty("test-grid", true);

		const { result } = renderHook(() => useColumnLayoutTracker("test-grid"));

		act(() => {
			result.current.saveAsDefault();
		});

		expect(useAppStore.getState().getDefaultLayout("test-grid")).toEqual(
			liveState,
		);
		expect(useAppStore.getState().getGridState("test-grid")).toEqual(liveState);
		expect(result.current.isDirty).toBe(false);
	});

	it("should reset layout and reload page", () => {
		const reloadAttempted = spyOnReloadAttempt();
		const { result } = renderHook(() => useColumnLayoutTracker("test-grid"));

		act(() => {
			result.current.resetLayout();
		});

		expect(reloadAttempted).toHaveBeenCalled();
	});

	it("should persist default layouts in the storage snapshot", () => {
		const defaultState = {
			columnOrder: { orderedColIds: ["partNumber", "description"] },
		} as never;

		useAppStore.getState().saveAsDefaultLayout("test-grid", defaultState);

		const partializedState = (
			useAppStore as typeof useAppStore & {
				persist: {
					getOptions: () => {
						partialize?: (
							state: ReturnType<typeof useAppStore.getState>,
						) => unknown;
					};
				};
			}
		).persist
			.getOptions()
			.partialize?.(useAppStore.getState()) as {
			defaultLayouts?: Record<string, unknown>;
		};

		expect(partializedState.defaultLayouts).toEqual({
			"test-grid": defaultState,
		});
	});
});
