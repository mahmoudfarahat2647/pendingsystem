import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
	toast: {
		custom: vi.fn(),
		dismiss: vi.fn(),
		error: vi.fn(),
		success: vi.fn(),
	},
}));

import type { OrderStage } from "@/domain/order/orderStage";
import {
	buildReleaseAuthorization,
	WARRANTY_REPAIR_SYSTEM,
} from "@/domain/order/releaseGate";
import { ORDER_STAGES } from "@/lib/constants";
import { getOrdersQueryKey } from "@/lib/queryClient";
import type { DraftRecoverySnapshot } from "@/store/slices/draftSessionSlice";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import { queryClient } from "./testQueryClient";

const EMPTY_BASELINE: Record<OrderStage, PendingRow[]> = {
	orders: [],
	main: [],
	call: [],
	booking: [],
	archive: [],
	freeze: [],
};

function createRow(
	id: string,
	stage: OrderStage,
	overrides: Partial<PendingRow> = {},
): PendingRow {
	return {
		id,
		baseId: id.slice(-6),
		trackingId: `ORD-${id.slice(-6)}`,
		customerName: "Test Customer",
		company: "Renault",
		vin: "VF1RFA00000000001",
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
		repairSystem: WARRANTY_REPAIR_SYSTEM,
		startWarranty: "",
		endWarranty: "",
		remainTime: "",
		stage,
		...overrides,
	} as PendingRow;
}

function resetDraftSession() {
	const workspaceId = useAppStore.getState().draftSession.workspaceId;
	useAppStore.setState({
		draftSession: {
			isActive: false,
			baselineByStage: structuredClone(EMPTY_BASELINE),
			derivedRowsRevision: 0,
			pendingCommands: [],
			past: [],
			future: [],
			dirty: false,
			saving: false,
			saveError: null,
			touchedStages: new Set<OrderStage>(),
			lastTouchedAt: null,
			workspaceId,
			saveCheckpoint: null,
		},
	});
}

function seedStageData(dataByStage: Partial<Record<OrderStage, PendingRow[]>>) {
	for (const stage of ORDER_STAGES) {
		queryClient.setQueryData(
			getOrdersQueryKey(stage),
			structuredClone(dataByStage[stage] ?? []),
		);
	}
}

describe("release-gate draft guard (issue #242 §4)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		queryClient.clear();
		resetDraftSession();
		useAppStore.setState({ lastCommandError: null });
	});

	it("rejects a *->call moveRows command for a qualifying chassis with no authorization", () => {
		const row = createRow("00000000-0000-4000-8000-00000000a001", "main");
		seedStageData({ main: [row] });

		const accepted = useAppStore.getState().applyCommand({
			type: "moveRows",
			ids: [row.id],
			sourceStage: "main",
			destinationStage: "call",
		});

		expect(accepted).toBe(false);
		expect(useAppStore.getState().lastCommandError).toMatch(/release/i);
		expect(useAppStore.getState().getWorkingRows("call")).toEqual([]);
	});

	it("accepts a *->call moveRows command carrying a matching authorization", () => {
		const row = createRow("00000000-0000-4000-8000-00000000a002", "main");
		seedStageData({ main: [row] });

		const accepted = useAppStore.getState().applyCommand({
			type: "moveRows",
			ids: [row.id],
			sourceStage: "main",
			destinationStage: "call",
			releaseAuthorization: buildReleaseAuthorization(
				[row],
				["VF1RFA00000000001"],
			),
		});

		expect(accepted).toBe(true);
		expect(useAppStore.getState().getWorkingRows("call")).toHaveLength(1);
	});

	it("allows a *->call move for a non-qualifying chassis with no authorization", () => {
		const row = createRow("00000000-0000-4000-8000-00000000a003", "main", {
			repairSystem: "Cash",
		});
		seedStageData({ main: [row] });

		const accepted = useAppStore.getState().applyCommand({
			type: "moveRows",
			ids: [row.id],
			sourceStage: "main",
			destinationStage: "call",
		});

		expect(accepted).toBe(true);
	});

	it("rejects a stale authorization whose fingerprint no longer matches the row", () => {
		const row = createRow("00000000-0000-4000-8000-00000000a004", "main");
		const staleAuth = buildReleaseAuthorization([row], ["VF1RFA00000000001"]);
		// Mileage changed after the authorization was granted.
		const changedRow = { ...row, cntrRdg: 4000 };
		seedStageData({ main: [changedRow] });

		const accepted = useAppStore.getState().applyCommand({
			type: "moveRows",
			ids: [row.id],
			sourceStage: "main",
			destinationStage: "call",
			releaseAuthorization: staleAuth,
		});

		expect(accepted).toBe(false);
	});

	describe("restoreFromRecovery", () => {
		it("drops a stale *->call command instead of replaying it", () => {
			const row = createRow("00000000-0000-4000-8000-00000000a005", "main");
			seedStageData({ main: [row] });

			const snapshot: DraftRecoverySnapshot = {
				workspaceId: useAppStore.getState().draftSession.workspaceId,
				updatedAt: Date.now(),
				pendingCommands: [
					{
						type: "moveRows",
						ids: [row.id],
						sourceStage: "main",
						destinationStage: "call",
						// No releaseAuthorization at all — definitely stale/missing.
					},
				],
			};

			useAppStore.getState().restoreFromRecovery(snapshot);

			expect(useAppStore.getState().draftSession.pendingCommands).toEqual([]);
			expect(useAppStore.getState().lastCommandError).toMatch(/release/i);
		});

		it("replays a *->call command whose authorization still matches", () => {
			const row = createRow("00000000-0000-4000-8000-00000000a006", "main");
			seedStageData({ main: [row] });

			const auth = buildReleaseAuthorization([row], ["VF1RFA00000000001"]);
			const snapshot: DraftRecoverySnapshot = {
				workspaceId: useAppStore.getState().draftSession.workspaceId,
				updatedAt: Date.now(),
				pendingCommands: [
					{
						type: "moveRows",
						ids: [row.id],
						sourceStage: "main",
						destinationStage: "call",
						releaseAuthorization: auth,
					},
				],
			};

			useAppStore.getState().restoreFromRecovery(snapshot);

			expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(
				1,
			);
		});

		it("keeps a non-call command untouched", () => {
			const row = createRow("00000000-0000-4000-8000-00000000a007", "orders");
			seedStageData({ orders: [row] });

			const snapshot: DraftRecoverySnapshot = {
				workspaceId: useAppStore.getState().draftSession.workspaceId,
				updatedAt: Date.now(),
				pendingCommands: [
					{
						type: "patchRow",
						id: row.id,
						sourceStage: "orders",
						destinationStage: "orders",
						updates: { status: "Arrived" },
						previousValues: { status: "Pending" },
					},
				],
			};

			useAppStore.getState().restoreFromRecovery(snapshot);

			expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(
				1,
			);
			expect(useAppStore.getState().lastCommandError).toBeNull();
		});
	});
});
