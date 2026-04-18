import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrdersRealtimeSync } from "@/hooks/useOrdersRealtimeSync";

// --- Mocks ---

const mockInvalidateQueries = vi.fn();
vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock("@/lib/queryClient", () => ({
	getOrdersQueryKey: (stage: string) => ["orders", stage],
}));

let capturedInsertCallback: (() => void) | null = null;
const mockRemoveChannel = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/supabase-browser", () => ({
	getSupabaseBrowserClient: () => ({
		channel: () => ({
			on: (_event: string, _filter: unknown, cb: () => void) => {
				capturedInsertCallback = cb;
				return {
					subscribe: () => ({}),
				};
			},
		}),
		removeChannel: mockRemoveChannel,
	}),
}));

const mockToastInfo = vi.fn();
vi.mock("sonner", () => ({
	toast: { info: (...args: unknown[]) => mockToastInfo(...args) },
}));

let mockIsDraftActive = false;
vi.mock("@/store/useStore", () => ({
	useAppStore: (selector: (s: unknown) => unknown) =>
		selector({ draftSession: { isActive: mockIsDraftActive } }),
}));

// --- Tests ---

describe("useOrdersRealtimeSync", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		capturedInsertCallback = null;
		mockIsDraftActive = false;
	});

	it("invalidates orders query immediately on INSERT when draft is inactive", () => {
		renderHook(() => useOrdersRealtimeSync());

		act(() => {
			capturedInsertCallback?.();
		});

		expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["orders", "orders"],
		});
		expect(mockToastInfo).not.toHaveBeenCalled();
	});

	it("shows toast and defers invalidation when INSERT arrives during active draft", () => {
		mockIsDraftActive = true;
		renderHook(() => useOrdersRealtimeSync());

		act(() => {
			capturedInsertCallback?.();
		});

		expect(mockToastInfo).toHaveBeenCalledTimes(1);
		expect(mockInvalidateQueries).not.toHaveBeenCalled();
	});

	it("flushes deferred invalidation when draft ends after a suppressed INSERT", () => {
		mockIsDraftActive = true;
		const { rerender } = renderHook(() => useOrdersRealtimeSync());

		// INSERT fires while draft is active — deferred
		act(() => {
			capturedInsertCallback?.();
		});
		expect(mockInvalidateQueries).not.toHaveBeenCalled();

		// Draft ends (save or discard)
		mockIsDraftActive = false;
		act(() => {
			rerender();
		});

		expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["orders", "orders"],
		});
	});

	it("does not flush if draft ends with no pending INSERT", () => {
		mockIsDraftActive = true;
		const { rerender } = renderHook(() => useOrdersRealtimeSync());

		// No INSERT fires — draft just ends
		mockIsDraftActive = false;
		act(() => {
			rerender();
		});

		expect(mockInvalidateQueries).not.toHaveBeenCalled();
	});
});
