import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrdersRealtimeSync } from "@/hooks/useOrdersRealtimeSync";

// --- Mocks ---

const mockInvalidateQueries = vi.fn();
// Stable object identity across renders — a fresh object per call would make
// the channel effect's `[queryClient]` dependency appear to change every
// render, causing spurious channel re-creation that the tests below would
// otherwise misattribute to the hook itself.
const mockQueryClient = { invalidateQueries: mockInvalidateQueries };
vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => mockQueryClient,
}));

vi.mock("@/lib/queryClient", () => ({
	getOrdersQueryKey: (stage: string) => ["orders", stage],
	DASHBOARD_STATS_QUERY_KEY: ["dashboard-stats"],
	NOTIFICATION_CANDIDATES_QUERY_KEY: ["notifications", "candidates"],
}));

let capturedInsertCallback: ((payload?: unknown) => void) | null = null;
let capturedUpdateCallback: ((payload?: unknown) => void) | null = null;
let capturedDeleteCallback: ((payload?: unknown) => void) | null = null;
const mockRemoveChannel = vi.fn().mockResolvedValue(undefined);
const mockChannel = vi.fn();

vi.mock("@/lib/supabase-browser", () => ({
	getSupabaseBrowserClient: () => ({
		channel: (...args: unknown[]) => {
			mockChannel(...args);
			const channelObj = {
				on: (
					_type: string,
					filter: { event?: string },
					cb: (payload?: unknown) => void,
				) => {
					if (filter?.event === "INSERT") capturedInsertCallback = cb;
					if (filter?.event === "UPDATE") capturedUpdateCallback = cb;
					if (filter?.event === "DELETE") capturedDeleteCallback = cb;
					return channelObj;
				},
				subscribe: () => ({}),
			};
			return channelObj;
		},
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
		capturedUpdateCallback = null;
		capturedDeleteCallback = null;
		mockIsDraftActive = false;
	});

	it("creates the realtime channel exactly once across draft-session toggles", () => {
		mockIsDraftActive = false;
		const { rerender } = renderHook(() => useOrdersRealtimeSync());
		expect(mockChannel).toHaveBeenCalledTimes(1);

		// Enter a draft session
		mockIsDraftActive = true;
		rerender();
		expect(mockChannel).toHaveBeenCalledTimes(1);
		expect(mockRemoveChannel).not.toHaveBeenCalled();

		// Exit the draft session
		mockIsDraftActive = false;
		rerender();
		expect(mockChannel).toHaveBeenCalledTimes(1);
		expect(mockRemoveChannel).not.toHaveBeenCalled();
	});

	it("reads the current draft state via ref so an INSERT right after a draft ends invalidates immediately", () => {
		mockIsDraftActive = true;
		const { rerender } = renderHook(() => useOrdersRealtimeSync());

		// Draft ends
		mockIsDraftActive = false;
		rerender();
		mockInvalidateQueries.mockClear();

		// INSERT arrives after the draft ended — the ref must reflect the
		// latest value even though the channel (and its closure) was created
		// while the draft was still active.
		act(() => {
			capturedInsertCallback?.();
		});

		expect(mockInvalidateQueries).toHaveBeenCalledTimes(3);
		expect(mockToastInfo).not.toHaveBeenCalled();
	});

	it("invalidates orders query immediately on INSERT when draft is inactive", () => {
		renderHook(() => useOrdersRealtimeSync());

		act(() => {
			capturedInsertCallback?.();
		});

		expect(mockInvalidateQueries).toHaveBeenCalledTimes(3);
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["orders", "orders"],
		});
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["dashboard-stats"],
		});
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["notifications", "candidates"],
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

		expect(mockInvalidateQueries).toHaveBeenCalledTimes(3);
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["orders", "orders"],
		});
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["dashboard-stats"],
		});
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["notifications", "candidates"],
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

	it("invalidates old and new stage queries on UPDATE when row stage changes", () => {
		renderHook(() => useOrdersRealtimeSync());

		act(() => {
			capturedUpdateCallback?.({
				new: { stage: "freeze" },
				old: { stage: "main" },
			});
		});

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["orders", "freeze"],
		});
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["orders", "main"],
		});
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["dashboard-stats"],
		});
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["notifications", "candidates"],
		});
	});

	it("invalidates stage query on DELETE", () => {
		renderHook(() => useOrdersRealtimeSync());

		act(() => {
			capturedDeleteCallback?.({
				old: { stage: "freeze" },
			});
		});

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["orders", "freeze"],
		});
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["dashboard-stats"],
		});
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["notifications", "candidates"],
		});
	});

	it("shows toast and defers invalidation when UPDATE arrives during active draft", () => {
		mockIsDraftActive = true;
		const { rerender } = renderHook(() => useOrdersRealtimeSync());

		act(() => {
			capturedUpdateCallback?.({
				new: { stage: "freeze" },
				old: { stage: "main" },
			});
		});

		expect(mockToastInfo).toHaveBeenCalledTimes(1);
		expect(mockInvalidateQueries).not.toHaveBeenCalled();

		// Exit draft session
		mockIsDraftActive = false;
		act(() => {
			rerender();
		});

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["orders", "freeze"],
		});
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["orders", "main"],
		});
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["dashboard-stats"],
		});
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["notifications", "candidates"],
		});
	});
});
