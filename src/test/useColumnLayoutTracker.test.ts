import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

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
delete (window as any).location;
Object.defineProperty(window, "location", {
    value: { ...originalLocation, reload: vi.fn() },
    configurable: true,
    writable: true,
});

describe("useColumnLayoutTracker", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset store state if possible, or ensure it's clean for each test
        useAppStore.getState().setLayoutDirty("test-grid", false);
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

    it("should reset layout and reload page", () => {
        const { result } = renderHook(() => useColumnLayoutTracker("test-grid"));

        act(() => {
            result.current.resetLayout();
        });

        expect(window.location.reload).toHaveBeenCalled();
    });
});
