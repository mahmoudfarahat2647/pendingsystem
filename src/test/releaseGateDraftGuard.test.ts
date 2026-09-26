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
			saveBlockedIndex: null,
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

	it("rejects save when a part number changes after release confirmation", async () => {
		const row = createRow("00000000-0000-4000-8000-00000000a008", "main");
		seedStageData({ main: [row] });

		expect(
			useAppStore.getState().applyCommand({
				type: "moveRows",
				ids: [row.id],
				sourceStage: "main",
				destinationStage: "call",
				releaseAuthorization: buildReleaseAuthorization(
					[row],
					["VF1RFA00000000001"],
				),
			}),
		).toBe(true);
		expect(
			useAppStore.getState().applyCommand({
				type: "patchRow",
				id: row.id,
				sourceStage: "call",
				destinationStage: "call",
				updates: { partNumber: "PN-002" },
				previousValues: { partNumber: "PN-001" },
			}),
		).toBe(true);

		const bulkUpdateStage = vi.fn().mockResolvedValue(undefined);
		await useAppStore.getState().saveDraft({
			saveOrder: vi.fn().mockResolvedValue(undefined),
			bulkUpdateStage,
			bulkDelete: vi.fn().mockResolvedValue(undefined),
		});

		expect(bulkUpdateStage).not.toHaveBeenCalled();
		expect(useAppStore.getState().draftSession.saveError).toMatch(/stale/i);
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

	describe("Issue #317: failed release re-check must not skip earlier unsaved commands", () => {
		it("REGRESSION: preflight failure leaves earlier commands unsaved, keeps saveCheckpoint.nextIndex at 0, sets saveBlockedIndex, and allows skip to preserve earlier commands", async () => {
			const rowA = createRow("00000000-0000-4000-8000-0000000000a1", "main");
			const rowB = createRow("00000000-0000-4000-8000-0000000000b2", "main");
			const rowC = createRow("00000000-0000-4000-8000-0000000000c3", "main");
			seedStageData({ main: [rowA, rowB, rowC] });

			useAppStore.getState().applyCommand({
				type: "patchRow",
				id: rowA.id,
				sourceStage: "main",
				destinationStage: "main",
				updates: { status: "Done" },
				previousValues: { status: "Pending" },
			});
			useAppStore.getState().applyCommand({
				type: "patchRow",
				id: rowB.id,
				sourceStage: "main",
				destinationStage: "main",
				updates: { status: "Done" },
				previousValues: { status: "Pending" },
			});

			const staleAuth = {
				fingerprint: "stale-fingerprint-mismatch",
				vins: [rowC.vin],
				grantedAt: Date.now(),
			};
			const currentSession = useAppStore.getState().draftSession;
			useAppStore.setState({
				draftSession: {
					...currentSession,
					pendingCommands: [
						...currentSession.pendingCommands,
						{
							type: "moveRows",
							ids: [rowC.id],
							sourceStage: "main",
							destinationStage: "call",
							releaseAuthorization: staleAuth,
						},
					],
				},
			});

			expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(
				3,
			);

			const saveOrder = vi.fn().mockResolvedValue(undefined);
			const bulkUpdateStage = vi.fn().mockResolvedValue(undefined);
			const bulkDelete = vi.fn().mockResolvedValue(undefined);

			await useAppStore
				.getState()
				.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

			expect(saveOrder).not.toHaveBeenCalled();
			expect(bulkUpdateStage).not.toHaveBeenCalled();
			expect(bulkDelete).not.toHaveBeenCalled();
			expect(useAppStore.getState().draftSession.saveError).toMatch(/stale/i);

			// Under the bug, saveCheckpoint.nextIndex was 2 and saveBlockedIndex was undefined
			expect(
				useAppStore.getState().draftSession.saveCheckpoint?.nextIndex,
			).toBe(0);
			expect(useAppStore.getState().draftSession.saveBlockedIndex).toBe(2);

			useAppStore.getState().skipFailedCommand();

			const afterSkip = useAppStore.getState().draftSession;
			expect(afterSkip.pendingCommands).toHaveLength(2);
			expect(afterSkip.pendingCommands[0]).toMatchObject({ id: rowA.id });
			expect(afterSkip.pendingCommands[1]).toMatchObject({ id: rowB.id });

			await useAppStore
				.getState()
				.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

			expect(saveOrder).toHaveBeenCalledTimes(2);
			expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(
				0,
			);
			expect(useAppStore.getState().draftSession.dirty).toBe(false);
		});

		it("preflight failure when a checkpoint already exists keeps nextIndex unchanged and sets saveBlockedIndex", async () => {
			const rowA = createRow("00000000-0000-4000-8000-0000000000a2", "main");
			const rowB = createRow("00000000-0000-4000-8000-0000000000b3", "main");
			const rowC = createRow("00000000-0000-4000-8000-0000000000c4", "main");
			seedStageData({ main: [rowA, rowB, rowC] });

			const staleAuth = {
				fingerprint: "stale-fingerprint-mismatch",
				vins: [rowC.vin],
				grantedAt: Date.now(),
			};

			useAppStore.setState({
				draftSession: {
					...useAppStore.getState().draftSession,
					isActive: true,
					dirty: true,
					// Simulate that command 0 already executed in a previous saveDraft run
					saveCheckpoint: {
						nextIndex: 1,
						idMapEntries: [],
					},
					pendingCommands: [
						{
							type: "patchRow",
							id: rowA.id,
							sourceStage: "main",
							destinationStage: "main",
							updates: { status: "Done" },
							previousValues: { status: "Pending" },
						},
						{
							type: "patchRow",
							id: rowB.id,
							sourceStage: "main",
							destinationStage: "main",
							updates: { status: "Done" },
							previousValues: { status: "Pending" },
						},
						{
							type: "moveRows",
							ids: [rowC.id],
							sourceStage: "main",
							destinationStage: "call",
							releaseAuthorization: staleAuth,
						},
					],
				},
			});

			const saveOrder = vi.fn().mockResolvedValue(undefined);
			const bulkUpdateStage = vi.fn().mockResolvedValue(undefined);
			const bulkDelete = vi.fn().mockResolvedValue(undefined);

			await useAppStore
				.getState()
				.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

			expect(saveOrder).not.toHaveBeenCalled();
			expect(useAppStore.getState().draftSession.saveError).toMatch(/stale/i);
			// nextIndex must remain 1 (unchanged)
			expect(
				useAppStore.getState().draftSession.saveCheckpoint?.nextIndex,
			).toBe(1);
			// saveBlockedIndex points at the stale command (index 2)
			expect(useAppStore.getState().draftSession.saveBlockedIndex).toBe(2);

			// When skipping, the stale command at index 2 is removed; checkpoint remains at nextIndex 1
			useAppStore.getState().skipFailedCommand();

			const afterSkip = useAppStore.getState().draftSession;
			expect(afterSkip.pendingCommands).toHaveLength(2);
			expect((afterSkip.pendingCommands[0] as { id: string }).id).toBe(rowA.id);
			expect((afterSkip.pendingCommands[1] as { id: string }).id).toBe(rowB.id);
			expect(afterSkip.saveCheckpoint?.nextIndex).toBe(1);
			expect(afterSkip.saveBlockedIndex).toBeNull();
		});
	});
});
