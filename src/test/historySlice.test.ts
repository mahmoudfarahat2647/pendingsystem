import { describe, expect, it, vi } from "vitest";
import { create } from "zustand";
import { createHistorySlice } from "../store/slices/historySlice";
import type { CombinedStore } from "../store/types";

// Mock dependencies
vi.mock("@/services/restoreService", () => ({
    restoreService: {
        restoreSnapshot: vi.fn(),
    },
}));

describe("historySlice", () => {
    const createTestStore = () => {
        return create<CombinedStore>(
            (...a) =>
                ({
                    ...createHistorySlice(a[0], a[1], a[2] as any),
                    clearUndoRedo: vi.fn(), // Mock the dependency from undoRedoSlice
                }) as any,
        );
    };

    it("should clear undo/redo history on commitSave", () => {
        const store = createTestStore();
        store.getState().commitSave();
        expect(store.getState().clearUndoRedo).toHaveBeenCalled();
    });
});
