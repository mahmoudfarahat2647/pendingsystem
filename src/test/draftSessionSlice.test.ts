import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
	toast: {
		custom: vi.fn(),
		dismiss: vi.fn(),
		error: vi.fn(),
		success: vi.fn(),
	},
}));

import {
	getOrdersQueryKey,
	ORDER_STAGES,
	queryClient,
} from "@/lib/queryClient";
import type { OrderStage } from "@/services/orderService";
import type {
	DraftRecoverySnapshot,
	PatchRowCommand,
} from "@/store/slices/draftSessionSlice";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

const EMPTY_BASELINE: Record<OrderStage, PendingRow[]> = {
	orders: [],
	main: [],
	call: [],
	booking: [],
	archive: [],
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
		cntrRdg: 12345,
		model: "Megane",
		parts: [
			{
				id: `part-${id}`,
				partNumber: "PN-001",
				description: "Brake pad",
			},
		],
		sabNumber: "SAB-001",
		acceptedBy: "Agent",
		requester: "Branch",
		partNumber: "PN-001",
		description: "Brake pad",
		status: "Pending",
		rDate: "2026-03-23",
		repairSystem: "Cash",
		startWarranty: "",
		endWarranty: "",
		remainTime: "",
		attachmentLink: "https://example.com/spec-sheet",
		hasAttachment: true,
		stage,
		...overrides,
	};
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

describe("draftSessionSlice", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		queryClient.clear();
		resetDraftSession();
	});

	it("replays cross-stage patchRow commands into the destination stage", () => {
		const row = createRow("00000000-0000-4000-8000-000000000001", "main");
		seedStageData({ main: [row] });

		useAppStore.getState().applyCommand({
			type: "patchRow",
			id: row.id,
			sourceStage: "main",
			destinationStage: "booking",
			updates: {
				bookingDate: "2026-03-24",
				bookingNote: "Bring documents",
				bookingStatus: "Scheduled",
			},
			previousValues: {},
		});

		expect(useAppStore.getState().getWorkingRows("main")).toEqual([]);
		expect(useAppStore.getState().getWorkingRows("booking")).toEqual([
			expect.objectContaining({
				id: row.id,
				stage: "booking",
				bookingDate: "2026-03-24",
				bookingNote: "Bring documents",
				bookingStatus: "Scheduled",
			}),
		]);
	});

	it("restores pending commands without rebuilding undo or redo history", () => {
		const row = createRow("00000000-0000-4000-8000-000000000002", "orders");
		seedStageData({ orders: [row] });

		const pendingCommand: PatchRowCommand = {
			type: "patchRow",
			id: row.id,
			sourceStage: "orders",
			destinationStage: "orders",
			updates: {
				status: "Arrived",
			},
			previousValues: {
				status: "Pending",
			},
		};

		const snapshot: DraftRecoverySnapshot = {
			workspaceId: useAppStore.getState().draftSession.workspaceId,
			updatedAt: Date.now(),
			pendingCommands: [pendingCommand],
		};

		useAppStore.getState().restoreFromRecovery(snapshot);

		const { draftSession, getWorkingRows } = useAppStore.getState();

		expect(draftSession.dirty).toBe(true);
		expect(draftSession.pendingCommands).toEqual([pendingCommand]);
		expect(draftSession.past).toEqual([]);
		expect(draftSession.future).toEqual([]);
		expect(getWorkingRows("orders")).toEqual([
			expect.objectContaining({
				id: row.id,
				status: "Arrived",
			}),
		]);
	});

	it("uses the latest draft commands when undo and re-apply happen in the same millisecond", () => {
		const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_712_345_678_000);
		const row = createRow("00000000-0000-4000-8000-000000000004", "orders");
		seedStageData({ orders: [row] });
		try {
			useAppStore.getState().applyCommand({
				type: "patchRow",
				id: row.id,
				sourceStage: "orders",
				destinationStage: "orders",
				updates: { partNumber: "" },
				previousValues: { partNumber: row.partNumber },
			});

			expect(useAppStore.getState().getWorkingRows("orders")).toEqual([
				expect.objectContaining({
					id: row.id,
					partNumber: "",
				}),
			]);

			useAppStore.getState().undoDraft();

			useAppStore.getState().applyCommand({
				type: "patchRow",
				id: row.id,
				sourceStage: "orders",
				destinationStage: "orders",
				updates: { status: "Ready" },
				previousValues: { status: row.status },
			});

			const moveAccepted = useAppStore.getState().applyCommand({
				type: "moveRows",
				ids: [row.id],
				sourceStage: "orders",
				destinationStage: "main",
			});

			expect(moveAccepted).toBe(true);
			expect(useAppStore.getState().getWorkingRows("orders")).toEqual([]);
			expect(useAppStore.getState().getWorkingRows("main")).toEqual([
				expect.objectContaining({
					id: row.id,
					stage: "main",
					status: "Ready",
					partNumber: row.partNumber,
				}),
			]);
		} finally {
			nowSpy.mockRestore();
		}
	});

	it("restores recovery snapshots against the freshest captured baseline", () => {
		const row = createRow("00000000-0000-4000-8000-000000000005", "orders");
		seedStageData({ orders: [row] });

		useAppStore.getState().applyCommand({
			type: "patchRow",
			id: row.id,
			sourceStage: "orders",
			destinationStage: "orders",
			updates: { customerName: "Cached Name" },
			previousValues: { customerName: row.customerName },
		});
		expect(useAppStore.getState().getWorkingRows("orders")).toEqual([
			expect.objectContaining({
				id: row.id,
				customerName: "Cached Name",
			}),
		]);

		const refreshedBaselineRow = createRow(row.id, "orders", {
			customerName: "Fresh Baseline",
			description: "Updated from query cache",
		});
		seedStageData({ orders: [refreshedBaselineRow] });

		const snapshot: DraftRecoverySnapshot = {
			workspaceId: useAppStore.getState().draftSession.workspaceId,
			updatedAt: 1_712_345_678_000,
			pendingCommands: [
				{
					type: "patchRow",
					id: row.id,
					sourceStage: "orders",
					destinationStage: "orders",
					updates: { status: "Recovered" },
					previousValues: { status: refreshedBaselineRow.status },
				},
			],
		};

		useAppStore.getState().restoreFromRecovery(snapshot);

		expect(useAppStore.getState().getWorkingRows("orders")).toEqual([
			expect.objectContaining({
				id: row.id,
				customerName: "Fresh Baseline",
				description: "Updated from query cache",
				status: "Recovered",
			}),
		]);
	});

	describe("saveDraft temp ID reconciliation", () => {
		const REAL_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
		const TEMP_ID = "temp-11111111-2222-3333-4444-555555555555";

		it("remaps temp ID so deleteRows after createRows deletes the real row", async () => {
			seedStageData({ orders: [] });

			const tempRow = createRow(TEMP_ID, "orders");
			useAppStore.getState().applyCommand({
				type: "createRows",
				stage: "orders",
				rows: [tempRow],
			});
			useAppStore.getState().applyCommand({
				type: "deleteRows",
				ids: [TEMP_ID],
			});

			const saveOrder = vi.fn().mockResolvedValue({ id: REAL_UUID });
			const bulkUpdateStage = vi.fn().mockResolvedValue([]);
			const bulkDelete = vi.fn().mockResolvedValue(undefined);

			await useAppStore
				.getState()
				.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

			expect(saveOrder).toHaveBeenCalledWith(
				expect.objectContaining({ id: "" }),
			);
			expect(bulkDelete).toHaveBeenCalledWith([REAL_UUID]);
		});

		it("remaps temp ID so moveRows after createRows moves the real row", async () => {
			seedStageData({ orders: [] });

			const tempRow = createRow(TEMP_ID, "orders");
			useAppStore.getState().applyCommand({
				type: "createRows",
				stage: "orders",
				rows: [tempRow],
			});
			useAppStore.getState().applyCommand({
				type: "moveRows",
				ids: [TEMP_ID],
				sourceStage: "orders",
				destinationStage: "main",
			});

			const saveOrder = vi.fn().mockResolvedValue({ id: REAL_UUID });
			const bulkUpdateStage = vi.fn().mockResolvedValue([]);
			const bulkDelete = vi.fn().mockResolvedValue(undefined);

			await useAppStore
				.getState()
				.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

			expect(bulkUpdateStage).toHaveBeenCalledWith(
				expect.objectContaining({ ids: [REAL_UUID] }),
			);
		});

		it("remaps temp ID so patchRow after createRows updates rather than duplicates", async () => {
			seedStageData({ orders: [] });

			const tempRow = createRow(TEMP_ID, "orders");
			useAppStore.getState().applyCommand({
				type: "createRows",
				stage: "orders",
				rows: [tempRow],
			});
			useAppStore.getState().applyCommand({
				type: "patchRow",
				id: TEMP_ID,
				sourceStage: "orders",
				destinationStage: "orders",
				updates: { status: "Arrived" },
				previousValues: { status: "Pending" },
			});

			const saveOrder = vi.fn().mockResolvedValue({ id: REAL_UUID });
			const bulkUpdateStage = vi.fn().mockResolvedValue([]);
			const bulkDelete = vi.fn().mockResolvedValue(undefined);

			await useAppStore
				.getState()
				.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

			// Second saveOrder call (the patchRow) must use the real UUID, not the temp ID
			expect(saveOrder).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({ id: REAL_UUID }),
			);
		});

		it("remaps temp IDs inside a composite command", async () => {
			seedStageData({ orders: [] });

			const tempRow = createRow(TEMP_ID, "orders");
			useAppStore.getState().applyCommand({
				type: "composite",
				label: "create-then-delete",
				children: [
					{ type: "createRows", stage: "orders", rows: [tempRow] },
					{ type: "deleteRows", ids: [TEMP_ID] },
				],
			});

			const saveOrder = vi.fn().mockResolvedValue({ id: REAL_UUID });
			const bulkUpdateStage = vi.fn().mockResolvedValue([]);
			const bulkDelete = vi.fn().mockResolvedValue(undefined);

			await useAppStore
				.getState()
				.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

			expect(bulkDelete).toHaveBeenCalledWith([REAL_UUID]);
		});
	});

	it("keeps the draft dirty after a save failure and clears it after retry", async () => {
		const row = createRow("00000000-0000-4000-8000-000000000003", "orders");
		seedStageData({ orders: [row] });

		useAppStore.getState().applyCommand({
			type: "patchRow",
			id: row.id,
			sourceStage: "orders",
			destinationStage: "orders",
			updates: {
				status: "Arrived",
			},
			previousValues: {
				status: "Pending",
			},
		});

		const saveOrder = vi
			.fn()
			.mockRejectedValueOnce(new Error("network down"))
			.mockResolvedValue(undefined);
		const bulkUpdateStage = vi.fn().mockResolvedValue(undefined);
		const bulkDelete = vi.fn().mockResolvedValue(undefined);

		await useAppStore.getState().saveDraft({
			saveOrder,
			bulkUpdateStage,
			bulkDelete,
		});

		expect(useAppStore.getState().draftSession.dirty).toBe(true);
		expect(useAppStore.getState().draftSession.saveError).toBe("network down");
		expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(1);

		await useAppStore.getState().saveDraft({
			saveOrder,
			bulkUpdateStage,
			bulkDelete,
		});

		expect(useAppStore.getState().draftSession.dirty).toBe(false);
		expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(0);
		expect(saveOrder).toHaveBeenCalledTimes(2);
	});

	it("preserves all pending commands beyond COMMAND_LIMIT (30) but caps the past stack", async () => {
		const row = createRow("00000000-0000-4000-8000-000000000010", "orders");
		seedStageData({ orders: [row] });

		for (let i = 1; i <= 31; i++) {
			useAppStore.getState().applyCommand({
				type: "patchRow",
				id: row.id,
				sourceStage: "orders",
				destinationStage: "orders",
				updates: { status: `Edit-${i}` },
				previousValues: { status: `Edit-${i - 1}` },
			});
		}

		const { draftSession } = useAppStore.getState();
		expect(draftSession.pendingCommands).toHaveLength(31);
		expect(draftSession.past).toHaveLength(30);

		const saveOrder = vi.fn().mockResolvedValue({ id: "real-id" });
		const bulkUpdateStage = vi.fn().mockResolvedValue(undefined);
		const bulkDelete = vi.fn().mockResolvedValue(undefined);

		await useAppStore.getState().saveDraft({
			saveOrder,
			bulkUpdateStage,
			bulkDelete,
		});

		expect(saveOrder).toHaveBeenCalledTimes(31);
	});
});
