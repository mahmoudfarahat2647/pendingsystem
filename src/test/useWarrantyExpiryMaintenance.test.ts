import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWarrantyExpiryMaintenance } from "@/hooks/useWarrantyExpiryMaintenance";
import type { PendingRow } from "@/types";

// --- Mocks ---

const mockInvalidateQueries = vi.fn();
vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock("@/lib/queryClient", () => ({
	getOrdersQueryKey: (stage: string) => ["orders", stage],
	DASHBOARD_STATS_QUERY_KEY: ["dashboard-stats"],
}));

vi.mock("@/lib/logger", () => ({
	logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const mockBuildArchivePayload = vi.fn((..._args: unknown[]) => ({
	stage: "archive",
}));
vi.mock("@/lib/archivePayloadBuilder", () => ({
	buildArchivePayload: (...args: unknown[]) => mockBuildArchivePayload(...args),
}));

const mockFetchMappedOrders = vi.fn();
vi.mock("@/services/orderService", () => ({
	orderService: {
		fetchMappedOrders: (...args: unknown[]) => mockFetchMappedOrders(...args),
	},
}));

const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
vi.mock("@/hooks/queries/useSaveOrderMutation", () => ({
	useSaveOrderMutation: () => ({ mutateAsync: mockMutateAsync }),
}));

let mockIsDraftDirty = false;
vi.mock("@/store/useStore", () => ({
	useAppStore: (selector: (s: unknown) => unknown) =>
		selector({ draftSession: { dirty: mockIsDraftDirty } }),
}));

// --- Helpers ---

function makeWarrantyRow(overrides: Partial<PendingRow>): PendingRow {
	return {
		id: "row-1",
		stage: "orders",
		vin: "VIN0001",
		repairSystem: "ضمان",
		startWarranty: "",
		endWarranty: "2000-01-01", // long past → expired
		...overrides,
	} as unknown as PendingRow;
}

// ACTIVE_STAGES in the hook: orders, main, call, booking → 4 fetches per pass.
const STAGES_PER_PASS = 4;

// --- Tests ---

describe("useWarrantyExpiryMaintenance", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockIsDraftDirty = false;
		mockFetchMappedOrders.mockResolvedValue([]);
		mockMutateAsync.mockResolvedValue(undefined);
	});

	it("does not re-fetch all stages on a second run within the hour when there is nothing to archive (regression)", async () => {
		const { result } = renderHook(() => useWarrantyExpiryMaintenance());

		await act(async () => {
			await result.current.runMaintenance();
		});
		// First pass fetched every active stage exactly once.
		expect(mockFetchMappedOrders).toHaveBeenCalledTimes(STAGES_PER_PASS);

		await act(async () => {
			await result.current.runMaintenance();
		});
		// Cooldown must hold: the empty-result pass still stamps the timestamp, so the
		// second run is rate-limited and performs no additional fetches.
		expect(mockFetchMappedOrders).toHaveBeenCalledTimes(STAGES_PER_PASS);
	});

	it("archives an expired warranty VIN, then holds the cooldown on the next run", async () => {
		const expiredRow = makeWarrantyRow({ id: "exp-1", stage: "orders" });
		mockFetchMappedOrders.mockImplementation(async (stage: string) =>
			stage === "orders" ? [expiredRow] : [],
		);

		const { result } = renderHook(() => useWarrantyExpiryMaintenance());

		await act(async () => {
			await result.current.runMaintenance();
		});

		expect(mockBuildArchivePayload).toHaveBeenCalledWith(
			expiredRow,
			"انتهاء فترة الضمان",
		);
		expect(mockMutateAsync).toHaveBeenCalledTimes(1);
		expect(mockMutateAsync).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "exp-1",
				stage: "archive",
				sourceStage: "orders",
			}),
		);
		// 4 active stages + archive invalidation.
		expect(mockInvalidateQueries).toHaveBeenCalledTimes(STAGES_PER_PASS + 2);

		// Second run within the hour is rate-limited — no further fetch/archive.
		mockFetchMappedOrders.mockClear();
		await act(async () => {
			await result.current.runMaintenance();
		});
		expect(mockFetchMappedOrders).not.toHaveBeenCalled();
	});

	it("skips the pass without fetching when a draft is dirty", async () => {
		mockIsDraftDirty = true;
		const { result } = renderHook(() => useWarrantyExpiryMaintenance());

		await act(async () => {
			await result.current.runMaintenance();
		});

		expect(mockFetchMappedOrders).not.toHaveBeenCalled();
	});

	it("does not stamp the cooldown when the fetch fails, so the next run retries", async () => {
		mockFetchMappedOrders.mockRejectedValue(new Error("network down"));
		const { result } = renderHook(() => useWarrantyExpiryMaintenance());

		await act(async () => {
			await result.current.runMaintenance();
		});
		expect(mockFetchMappedOrders).toHaveBeenCalledTimes(STAGES_PER_PASS);

		// Recover and run again — a failed fetch must not have engaged the cooldown.
		mockFetchMappedOrders.mockReset();
		mockFetchMappedOrders.mockResolvedValue([]);
		await act(async () => {
			await result.current.runMaintenance();
		});
		expect(mockFetchMappedOrders).toHaveBeenCalledTimes(STAGES_PER_PASS);
	});
});
