import { beforeEach, describe, expect, it, vi } from "vitest";
import { warrantyMaintenanceService } from "@/services/warrantyMaintenanceService";
import type { PendingRow } from "@/types";

// --- Mocks ---

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
const mockSaveOrder = vi.fn();
vi.mock("@/services/orderService", () => ({
	orderService: {
		fetchMappedOrders: (...args: unknown[]) => mockFetchMappedOrders(...args),
		saveOrder: (...args: unknown[]) => mockSaveOrder(...args),
	},
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

const ACTIVE_STAGES_COUNT = 4;

// --- Tests ---

describe("warrantyMaintenanceService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchMappedOrders.mockResolvedValue([]);
		mockSaveOrder.mockResolvedValue(undefined);
	});

	it("never fetches the freeze stage during maintenance passes and fetches exactly the four active stages", async () => {
		const result = await warrantyMaintenanceService.archiveExpiredWarranties();

		expect(result).toEqual({ archived: 0, errors: 0 });
		expect(mockFetchMappedOrders).toHaveBeenCalledTimes(ACTIVE_STAGES_COUNT);
		expect(mockFetchMappedOrders).toHaveBeenCalledTimes(4);
		expect(mockFetchMappedOrders).not.toHaveBeenCalledWith("freeze");
		expect(mockFetchMappedOrders).toHaveBeenCalledWith("orders");
		expect(mockFetchMappedOrders).toHaveBeenCalledWith("main");
		expect(mockFetchMappedOrders).toHaveBeenCalledWith("call");
		expect(mockFetchMappedOrders).toHaveBeenCalledWith("booking");
	});

	it("archives expired warranty rows found in active stages", async () => {
		const expiredRow = makeWarrantyRow({ id: "exp-1", stage: "orders" });
		mockFetchMappedOrders.mockImplementation(async (stage: string) =>
			stage === "orders" ? [expiredRow] : [],
		);

		const result = await warrantyMaintenanceService.archiveExpiredWarranties();

		expect(result).toEqual({ archived: 1, errors: 0 });
		expect(mockBuildArchivePayload).toHaveBeenCalledWith(
			expiredRow,
			"انتهاء فترة الضمان",
		);
		expect(mockSaveOrder).toHaveBeenCalledWith({
			stage: "archive",
			id: "exp-1",
			expectedCurrentStage: "orders",
		});
	});

	it("handles errors during archiving and counts them", async () => {
		const expiredRow = makeWarrantyRow({ id: "exp-2", stage: "main" });
		mockFetchMappedOrders.mockImplementation(async (stage: string) =>
			stage === "main" ? [expiredRow] : [],
		);
		mockSaveOrder.mockRejectedValue(new Error("Save failed"));

		const result = await warrantyMaintenanceService.archiveExpiredWarranties();

		expect(result).toEqual({ archived: 0, errors: 1 });
	});

	it("skips non-warranty rows and unexpired rows", async () => {
		const nonWarrantyRow = makeWarrantyRow({
			id: "row-nw",
			repairSystem: "other",
		});
		const unexpiredRow = makeWarrantyRow({
			id: "row-future",
			repairSystem: "ضمان",
			endWarranty: "2099-01-01",
		});
		mockFetchMappedOrders.mockResolvedValue([nonWarrantyRow, unexpiredRow]);

		const result = await warrantyMaintenanceService.archiveExpiredWarranties();

		expect(result).toEqual({ archived: 0, errors: 0 });
		expect(mockSaveOrder).not.toHaveBeenCalled();
	});
});
