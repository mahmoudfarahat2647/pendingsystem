import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpsert = vi.fn();
const mockClear = vi.fn();

vi.mock("@/hooks/queries/useReleaseFollowUpsQuery", () => ({
	useReleaseFollowUpsQuery: () => ({ data: [] }),
	useUpsertReleaseFollowUpMutation: () => ({ mutateAsync: mockUpsert }),
	useClearReleaseFollowUpsMutation: () => ({ mutateAsync: mockClear }),
}));

const warnSpy = vi.fn();
vi.mock("@/lib/logger", () => ({
	logger: { warn: (...args: unknown[]) => warnSpy(...args), error: vi.fn() },
}));

import { ReleaseGateProvider } from "@/components/shared/release/ReleaseGateProvider";
import { useReleaseGate } from "@/hooks/useReleaseGate";
import type { PendingRow } from "@/types";

const blankVinRow: PendingRow = {
	id: "row-1",
	baseId: "row-1",
	trackingId: "ORD-1",
	customerName: "Test Customer",
	company: "Renault",
	vin: "",
	mobile: "01000000000",
	cntrRdg: 4999,
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
	stage: "main",
} as PendingRow;

function Harness({ onResult }: { onResult: (result: unknown) => void }) {
	const { requestCallRelease } = useReleaseGate();
	return (
		<button
			type="button"
			onClick={async () => {
				const result = await requestCallRelease({
					rows: [blankVinRow],
					automatic: false,
				});
				onResult(result);
			}}
		>
			trigger
		</button>
	);
}

describe("ReleaseGateProvider — blank-VIN cancel (regression)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("cancelling a blank-VIN chassis does not throw and skips the follow-up upsert", async () => {
		const user = userEvent.setup();
		const onResult = vi.fn();

		render(
			<ReleaseGateProvider>
				<Harness onResult={onResult} />
			</ReleaseGateProvider>,
		);

		await user.click(screen.getByRole("button", { name: "trigger" }));

		const cancelButton = await screen.findByRole("button", {
			name: "Cancel",
		});
		await act(async () => {
			await user.click(cancelButton);
		});

		await waitFor(() => expect(onResult).toHaveBeenCalled());

		// The blank-VIN chassis has nothing to key a follow-up row on, so the
		// upsert (which would otherwise throw on a blank VIN) is never called.
		expect(mockUpsert).not.toHaveBeenCalled();

		const result = onResult.mock.calls[0][0] as {
			cancelledVins: string[];
			approvedRows: PendingRow[];
		};
		expect(result.cancelledVins).toEqual([""]);
		expect(result.approvedRows).toEqual([]);
	});
});
