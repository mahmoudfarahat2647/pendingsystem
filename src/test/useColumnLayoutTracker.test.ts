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
import { useAppStore } from "../store/useStore";

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		info: vi.fn(),
	},
}));

// Mock window.location.reload
const originalLocation = window.location;
// biome-ignore lint/suspicious/noExplicitAny: redefining window.location for test mocking requires bypassing the DOM type
delete (window as any).location;
Object.defineProperty(window, "location", {
	value: { ...originalLocation, reload: vi.fn() },
	configurable: true,
	writable: true,
});

describe("useColumnLayoutTracker", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		useAppStore.setState({
			gridStates: {},
			liveGridStates: {},
			dirtyLayouts: {},
			defaultLayouts: {},
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
		useAppStore.getState().setLiveGridState("test-grid", liveState);
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

		useAppStore.getState().setLiveGridState("test-grid", liveState);
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
		const { result } = renderHook(() => useColumnLayoutTracker("test-grid"));

		act(() => {
			result.current.resetLayout();
		});

		expect(window.location.reload).toHaveBeenCalled();
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
