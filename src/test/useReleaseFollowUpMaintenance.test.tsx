import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PendingRow } from "@/types";

const { fetchMappedOrders, listFollowUps, clearFollowUps } = vi.hoisted(() => ({
	fetchMappedOrders: vi.fn(),
	listFollowUps: vi.fn(),
	clearFollowUps: vi.fn(),
}));

vi.mock("@/services/orderService", () => ({
	orderService: { fetchMappedOrders },
}));

vi.mock("@/services/releaseFollowUpService", () => ({
	releaseFollowUpService: {
		list: listFollowUps,
		clear: clearFollowUps,
	},
}));

import { useReleaseFollowUpMaintenance } from "@/hooks/useReleaseFollowUpMaintenance";

const frozenWarrantyRow = {
	id: "00000000-0000-4000-8000-000000000001",
	baseId: "000001",
	trackingId: "ORD-000001",
	customerName: "Test",
	vin: "VF1RFA00000000001",
	mobile: "01000000000",
	cntrRdg: 4999,
	cntrRdgProvided: true,
	model: "Megane",
	parts: [],
	sabNumber: "",
	acceptedBy: "",
	requester: "",
	partNumber: "PN-001",
	description: "Brake pad",
	quantity: 1,
	status: "Pending",
	rDate: "",
	repairSystem: "ضمان",
	startWarranty: "",
	endWarranty: "",
	remainTime: "",
	stage: "freeze",
} as PendingRow;

describe("useReleaseFollowUpMaintenance", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		listFollowUps.mockResolvedValue([
			{
				vin: frozenWarrantyRow.vin,
				nextDueAt: "2026-11-20T00:00:00.000Z",
				referenceRowId: frozenWarrantyRow.id,
				createdAt: "2026-09-20T00:00:00.000Z",
				updatedAt: "2026-09-20T00:00:00.000Z",
			},
		]);
		fetchMappedOrders.mockImplementation(async (stage: string) =>
			stage === "freeze" ? [frozenWarrantyRow] : [],
		);
		clearFollowUps.mockResolvedValue(undefined);
	});

	it("keeps a qualifying follow-up while the chassis remains in Freeze", async () => {
		const queryClient = new QueryClient();
		const wrapper = ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
		const { result } = renderHook(() => useReleaseFollowUpMaintenance(), {
			wrapper,
		});

		await act(async () => result.current.runMaintenance());

		expect(fetchMappedOrders).toHaveBeenCalledWith("freeze");
		expect(clearFollowUps).not.toHaveBeenCalled();
	});
});
