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
import { ORDER_STAGES } from "@/lib/constants";
import { buildMoveToMainCommands } from "@/lib/orderStageTransitions";
import { getOrdersQueryKey } from "@/lib/queryClient";
import type { DraftRecoverySnapshot } from "@/store/slices/draftSessionSlice";
import { useAppStore } from "@/store/useStore";
import type { PatchRowCommand, PendingRow } from "@/types";
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
		cntrRdg: 12345,
		model: "Megane",
		parts: [
			{
				id: `part-${id}`,
				partNumber: "PN-001",
				description: "Brake pad",
				quantity: 1,
			},
		],
		sabNumber: "SAB-001",
		acceptedBy: "Agent",
		requester: "Branch",
		partNumber: "PN-001",
		description: "Brake pad",
		quantity: 1,
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

describe("draftSessionSlice", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		queryClient.clear();
		resetDraftSession();
		useAppStore.setState({ lastCommandError: null });
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

	describe("Move to Main Sheet (#314)", () => {
		const ARCHIVED_ID = "00000000-0000-4000-8000-000000000314";
		const CALL_ID = "00000000-0000-4000-8000-000000000315";

		const archivedRow = () =>
			createRow(ARCHIVED_ID, "archive", {
				status: "Archived",
				archiveReason: "Customer no-show",
				archivedAt: "2026-01-01T00:00:00.000Z",
				bookingDate: "2026-02-01",
				noteHistory: "existing note",
			});

		it("moves an archived row into main with the archive markers cleared, and undo/redo round-trips it", () => {
			seedStageData({ archive: [archivedRow()] });

			for (const cmd of buildMoveToMainCommands([archivedRow()], "archive")) {
				expect(useAppStore.getState().applyCommand(cmd)).toBe(true);
			}

			const state = () => useAppStore.getState();
			expect(state().getWorkingRows("archive")).toEqual([]);
			expect(state().getWorkingRows("main")).toEqual([
				expect.objectContaining({
					id: ARCHIVED_ID,
					stage: "main",
					status: "Pending",
					archiveReason: null,
					archivedAt: null,
					bookingDate: "2026-02-01",
					attachmentLink: "https://example.com/spec-sheet",
				}),
			]);
			expect(state().getWorkingRows("main")?.[0]?.noteHistory).toContain(
				"existing note",
			);

			state().undoDraft();
			expect(state().getWorkingRows("main")).toEqual([]);
			expect(state().getWorkingRows("archive")).toEqual([
				expect.objectContaining({ id: ARCHIVED_ID, status: "Archived" }),
			]);

			state().redoDraft();
			expect(state().getWorkingRows("archive")).toEqual([]);
			expect(state().getWorkingRows("main")).toEqual([
				expect.objectContaining({ id: ARCHIVED_ID, status: "Pending" }),
			]);
		});

		it("keeps business fields unchanged when moving from call", () => {
			const row = createRow(CALL_ID, "call", { status: "Arrived" });
			seedStageData({ call: [row] });

			for (const cmd of buildMoveToMainCommands([row], "call")) {
				useAppStore.getState().applyCommand(cmd);
			}

			expect(useAppStore.getState().getWorkingRows("main")).toEqual([
				expect.objectContaining({
					id: CALL_ID,
					stage: "main",
					status: "Arrived",
					attachmentLink: row.attachmentLink,
					partNumber: row.partNumber,
				}),
			]);
		});

		it("saveDraft persists the move through the guarded saveOrder with sourceStage and null archive markers", async () => {
			seedStageData({ archive: [archivedRow()] });
			for (const cmd of buildMoveToMainCommands([archivedRow()], "archive")) {
				useAppStore.getState().applyCommand(cmd);
			}

			const saveOrder = vi.fn().mockResolvedValue({ id: ARCHIVED_ID });
			const bulkUpdateStage = vi.fn().mockResolvedValue([]);
			const bulkDelete = vi.fn().mockResolvedValue(undefined);
			await useAppStore
				.getState()
				.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

			expect(saveOrder).toHaveBeenCalledTimes(1);
			expect(saveOrder).toHaveBeenCalledWith(
				expect.objectContaining({
					id: ARCHIVED_ID,
					stage: "main",
					sourceStage: "archive",
					updates: expect.objectContaining({
						status: "Pending",
						archiveReason: null,
						archivedAt: null,
					}),
				}),
			);
			expect(bulkUpdateStage).not.toHaveBeenCalled();
			expect(useAppStore.getState().draftSession.dirty).toBe(false);
		});
	});

	describe("applyCommand — freeze reason guard (#196)", () => {
		it("rejects a cross-stage patchRow into freeze with no reason, and does not record the command", () => {
			const row = createRow("00000000-0000-4000-8000-000000000010", "main");
			seedStageData({ main: [row] });

			const accepted = useAppStore.getState().applyCommand({
				type: "patchRow",
				id: row.id,
				sourceStage: "main",
				destinationStage: "freeze",
				updates: { freezeReason: "" },
				previousValues: {},
			});

			expect(accepted).toBe(false);
			expect(useAppStore.getState().lastCommandError).toBe(
				"A reason is required to freeze rows.",
			);
			// Row must still be in its source stage — the command was never queued.
			expect(useAppStore.getState().getWorkingRows("main")).toEqual([
				expect.objectContaining({ id: row.id, stage: "main" }),
			]);
			expect(useAppStore.getState().getWorkingRows("freeze")).toEqual([]);
			expect(useAppStore.getState().draftSession.pendingCommands).toEqual([]);
		});

		it("rejects a cross-stage patchRow into freeze with a whitespace-only reason", () => {
			const row = createRow("00000000-0000-4000-8000-000000000011", "main");
			seedStageData({ main: [row] });

			const accepted = useAppStore.getState().applyCommand({
				type: "patchRow",
				id: row.id,
				sourceStage: "main",
				destinationStage: "freeze",
				updates: { freezeReason: "   " },
				previousValues: {},
			});

			expect(accepted).toBe(false);
			expect(useAppStore.getState().lastCommandError).toBe(
				"A reason is required to freeze rows.",
			);
		});

		it("accepts a cross-stage patchRow into freeze once a non-empty reason is provided", () => {
			const row = createRow("00000000-0000-4000-8000-000000000012", "main");
			seedStageData({ main: [row] });

			const accepted = useAppStore.getState().applyCommand({
				type: "patchRow",
				id: row.id,
				sourceStage: "main",
				destinationStage: "freeze",
				updates: { freezeReason: "Waiting on customer decision" },
				previousValues: {},
			});

			expect(accepted).toBe(true);
			expect(useAppStore.getState().lastCommandError).toBeNull();
			expect(useAppStore.getState().getWorkingRows("main")).toEqual([]);
			expect(useAppStore.getState().getWorkingRows("freeze")).toEqual([
				expect.objectContaining({
					id: row.id,
					stage: "freeze",
					freezeReason: "Waiting on customer decision",
				}),
			]);
		});

		it("does not require a reason for a same-stage patchRow on an already-frozen row (e.g. a note edit from the Freeze tab)", () => {
			const row = createRow("00000000-0000-4000-8000-000000000013", "freeze");
			seedStageData({ freeze: [row] });

			const accepted = useAppStore.getState().applyCommand({
				type: "patchRow",
				id: row.id,
				sourceStage: "freeze",
				destinationStage: "freeze",
				updates: { noteHistory: "Called customer, still waiting" },
				previousValues: {},
			});

			expect(accepted).toBe(true);
			expect(useAppStore.getState().getWorkingRows("freeze")).toEqual([
				expect.objectContaining({
					id: row.id,
					stage: "freeze",
					noteHistory: "Called customer, still waiting",
				}),
			]);
		});
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

		it("forwards sourceStage on a moveRows command so bulkUpdateStage gets compare-and-set guarded (Issue #202, Hole #3)", async () => {
			seedStageData({
				orders: [createRow(REAL_UUID, "orders")],
			});
			useAppStore.getState().applyCommand({
				type: "moveRows",
				ids: [REAL_UUID],
				sourceStage: "orders",
				destinationStage: "main",
			});

			const saveOrder = vi.fn().mockResolvedValue({ id: REAL_UUID });
			const bulkUpdateStage = vi.fn().mockResolvedValue([]);
			const bulkDelete = vi.fn().mockResolvedValue(undefined);

			await useAppStore
				.getState()
				.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

			// Dropping sourceStage here would silently disable compare-and-set on
			// bulk moves (orderRepository.ts's updateOrdersStage only guards when
			// previousStage is supplied), which is exactly the class of regression
			// Issue #202 closes for patchRow — moveRows needs the same guarantee.
			expect(bulkUpdateStage).toHaveBeenCalledWith(
				expect.objectContaining({
					ids: [REAL_UUID],
					sourceStage: "orders",
				}),
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

	it("does not re-execute already-succeeded commands when retrying after a partial failure", async () => {
		const REAL_UUID = "cccccccc-dddd-4eee-8fff-000000000001";
		const TEMP_ID = "temp-cccc-dddd-eeee-ffff-000000000001";

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

		// createRows succeeds, patchRow fails on first attempt
		const saveOrder = vi
			.fn()
			.mockResolvedValueOnce({ id: REAL_UUID }) // createRows succeeds
			.mockRejectedValueOnce(new Error("network down")) // patchRow fails
			.mockResolvedValue({ id: REAL_UUID }); // patchRow succeeds on retry
		const bulkUpdateStage = vi.fn().mockResolvedValue(undefined);
		const bulkDelete = vi.fn().mockResolvedValue(undefined);

		await useAppStore
			.getState()
			.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

		expect(useAppStore.getState().draftSession.saveError).toBe("network down");
		expect(useAppStore.getState().draftSession.saveCheckpoint).toEqual({
			nextIndex: 1,
			idMapEntries: [[TEMP_ID, REAL_UUID]],
		});

		// Retry
		await useAppStore
			.getState()
			.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

		// createRows must NOT be re-executed on retry: saveOrder called 3 times total
		// (1 createRows on first attempt + 1 failed patchRow + 1 retry patchRow).
		// If createRows had duplicated we'd see 4 calls with two id:"" calls.
		expect(saveOrder).toHaveBeenCalledTimes(3);
		const insertCalls = saveOrder.mock.calls.filter(([v]) => v.id === "");
		expect(insertCalls).toHaveLength(1);
		// patchRow on retry must use the real ID (idMap restored from checkpoint)
		expect(saveOrder).toHaveBeenLastCalledWith(
			expect.objectContaining({ id: REAL_UUID }),
		);
		// Session cleared after successful retry
		expect(useAppStore.getState().draftSession.dirty).toBe(false);
		expect(useAppStore.getState().draftSession.saveCheckpoint).toBeNull();
	});

	it("clears saveCheckpoint after a fully successful save", async () => {
		const REAL_UUID = "cccccccc-dddd-4eee-8fff-000000000002";
		const TEMP_ID = "temp-cccc-dddd-eeee-ffff-000000000002";

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
		const bulkUpdateStage = vi.fn().mockResolvedValue(undefined);
		const bulkDelete = vi.fn().mockResolvedValue(undefined);

		await useAppStore
			.getState()
			.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

		expect(useAppStore.getState().draftSession.dirty).toBe(false);
		expect(useAppStore.getState().draftSession.saveCheckpoint).toBeNull();
		expect(saveOrder).toHaveBeenCalledTimes(2);
	});

	it("clears saveCheckpoint on undo so retry executes all remaining commands", async () => {
		const REAL_UUID_A = "aaaaaaaa-1111-4000-8000-000000000010";
		const REAL_UUID_B = "bbbbbbbb-2222-4000-8000-000000000010";
		const TEMP_ID_A = "temp-aaaa-1111-2222-3333-000000000010";
		const TEMP_ID_B = "temp-bbbb-1111-2222-3333-000000000010";

		seedStageData({ orders: [] });

		const tempRowA = createRow(TEMP_ID_A, "orders");
		useAppStore.getState().applyCommand({
			type: "createRows",
			stage: "orders",
			rows: [tempRowA],
		});
		useAppStore.getState().applyCommand({
			type: "patchRow",
			id: TEMP_ID_A,
			sourceStage: "orders",
			destinationStage: "orders",
			updates: { status: "Arrived" },
			previousValues: { status: "Pending" },
		});

		// createRows(A) succeeds, patchRow fails on first attempt
		const saveOrder = vi
			.fn()
			.mockResolvedValueOnce({ id: REAL_UUID_A }) // createRows(A) — 1st attempt
			.mockRejectedValueOnce(new Error("network down")) // patchRow — fails
			.mockResolvedValueOnce({ id: REAL_UUID_A }) // createRows(A) — retry (upsert returns existing)
			.mockResolvedValueOnce({ id: REAL_UUID_B }); // createRows(B) — retry
		const bulkUpdateStage = vi.fn().mockResolvedValue(undefined);
		const bulkDelete = vi.fn().mockResolvedValue(undefined);

		// First save: partial failure after createRows(A) succeeds
		await useAppStore
			.getState()
			.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });
		expect(useAppStore.getState().draftSession.saveError).toBe("network down");
		expect(useAppStore.getState().draftSession.saveCheckpoint).toEqual({
			nextIndex: 1,
			idMapEntries: [[TEMP_ID_A, REAL_UUID_A]],
		});

		// Undo the failed patchRow — checkpoint must be cleared
		useAppStore.getState().undoDraft();
		expect(useAppStore.getState().draftSession.saveCheckpoint).toBeNull();
		expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(1);

		// Add new command that would be silently lost without the fix
		const tempRowB = createRow(TEMP_ID_B, "orders");
		useAppStore.getState().applyCommand({
			type: "createRows",
			stage: "orders",
			rows: [tempRowB],
		});
		expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(2);

		// Retry: checkpoint is null so both commands must execute from index 0
		await useAppStore
			.getState()
			.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

		// 4 total calls: createRows(A) x2 + patchRow fail + createRows(B)
		expect(saveOrder).toHaveBeenCalledTimes(4);
		// 3 insert calls (id==""): createRows(A) first attempt + createRows(A) retry + createRows(B)
		const insertCalls = saveOrder.mock.calls.filter(([v]) => v.id === "");
		expect(insertCalls).toHaveLength(3);
		// Session fully cleared
		expect(useAppStore.getState().draftSession.dirty).toBe(false);
		expect(useAppStore.getState().draftSession.saveCheckpoint).toBeNull();
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

	describe("unrecognized command type dispatch guards", () => {
		it("applyCommand throws instead of silently dropping an unrecognized command type", () => {
			const row = createRow("00000000-0000-4000-8000-000000000020", "orders");
			seedStageData({ orders: [row] });

			expect(() => {
				useAppStore.getState().applyCommand({
					type: "teleportRows",
					ids: [row.id],
				} as unknown as PatchRowCommand);
			}).toThrow(/Unknown draft command type/);
		});

		it("getWorkingRows throws instead of silently dropping an unrecognized command type", () => {
			const row = createRow("00000000-0000-4000-8000-000000000021", "orders");
			seedStageData({ orders: [row] });

			useAppStore.setState({
				draftSession: {
					...useAppStore.getState().draftSession,
					isActive: true,
					baselineByStage: { ...EMPTY_BASELINE, orders: [row] },
					pendingCommands: [
						{
							type: "teleportRows",
							ids: [row.id],
						} as unknown as PatchRowCommand,
					],
					derivedRowsRevision: 1,
				},
			});

			expect(() => useAppStore.getState().getWorkingRows("orders")).toThrow(
				/Unknown draft command type/,
			);
		});

		it("saveDraft surfaces an unrecognized command type as a saveError instead of hanging or no-oping", async () => {
			useAppStore.setState({
				draftSession: {
					...useAppStore.getState().draftSession,
					isActive: true,
					dirty: true,
					pendingCommands: [
						{
							type: "teleportRows",
							ids: ["row-x"],
						} as unknown as PatchRowCommand,
					],
				},
			});

			const saveOrder = vi.fn();
			const bulkUpdateStage = vi.fn();
			const bulkDelete = vi.fn();

			await useAppStore
				.getState()
				.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

			expect(useAppStore.getState().draftSession.saveError).toMatch(
				/Unknown draft command type/,
			);
			// Draft state must be preserved for retry/discard, not silently cleared.
			expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(
				1,
			);
		});
	});

	describe("skipFailedCommand", () => {
		it("removes only the currently-failing command and lets saveDraft proceed with the rest", async () => {
			const REAL_UUID = "dddddddd-eeee-4fff-8000-000000000001";
			const TEMP_ID = "temp-dddd-eeee-ffff-0000-000000000001";

			seedStageData({ orders: [] });

			useAppStore.getState().applyCommand({
				type: "createRows",
				stage: "orders",
				rows: [createRow(TEMP_ID, "orders")],
			});
			useAppStore.getState().applyCommand({
				type: "patchRow",
				id: TEMP_ID,
				sourceStage: "orders",
				destinationStage: "orders",
				updates: { status: "Bad" },
				previousValues: { status: "Pending" },
			});
			useAppStore.getState().applyCommand({
				type: "deleteRows",
				ids: [TEMP_ID],
			});

			const saveOrder = vi
				.fn()
				.mockResolvedValueOnce({ id: REAL_UUID }) // createRows succeeds
				.mockRejectedValueOnce(new Error("permanent validation error")); // patchRow fails permanently
			const bulkUpdateStage = vi.fn().mockResolvedValue(undefined);
			const bulkDelete = vi.fn().mockResolvedValue(undefined);

			await useAppStore
				.getState()
				.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

			expect(useAppStore.getState().draftSession.saveError).toBe(
				"permanent validation error",
			);
			expect(useAppStore.getState().draftSession.saveCheckpoint).toEqual({
				nextIndex: 1,
				idMapEntries: [[TEMP_ID, REAL_UUID]],
			});
			expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(
				3,
			);

			useAppStore.getState().skipFailedCommand();

			const afterSkip = useAppStore.getState().draftSession;
			expect(afterSkip.pendingCommands).toHaveLength(2);
			expect(afterSkip.pendingCommands[0]).toMatchObject({
				type: "createRows",
			});
			expect(afterSkip.pendingCommands[1]).toEqual({
				type: "deleteRows",
				ids: [TEMP_ID],
			});
			expect(afterSkip.saveCheckpoint).toEqual({
				nextIndex: 1,
				idMapEntries: [[TEMP_ID, REAL_UUID]],
			});
			expect(afterSkip.dirty).toBe(true);
			// past/future must be untouched by skipping a pending command.
			expect(afterSkip.past).toHaveLength(3);
			expect(afterSkip.future).toEqual([]);

			// Retry: only the remaining deleteRows command should execute (now at index 1).
			await useAppStore
				.getState()
				.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

			expect(bulkDelete).toHaveBeenCalledWith([REAL_UUID]);
			expect(useAppStore.getState().draftSession.dirty).toBe(false);
			expect(useAppStore.getState().draftSession.saveCheckpoint).toBeNull();
			expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(
				0,
			);
		});

		it("keeps the persisted-prefix checkpoint when the failing command was the last pending command, so the next save does not replay it", async () => {
			const REAL_UUID = "dddddddd-eeee-4fff-8000-000000000002";
			const TEMP_ID = "temp-dddd-eeee-ffff-0000-000000000002";

			seedStageData({ orders: [] });

			useAppStore.getState().applyCommand({
				type: "createRows",
				stage: "orders",
				rows: [createRow(TEMP_ID, "orders")],
			});
			useAppStore.getState().applyCommand({
				type: "patchRow",
				id: TEMP_ID,
				sourceStage: "orders",
				destinationStage: "orders",
				updates: { status: "Bad" },
				previousValues: { status: "Pending" },
			});

			const saveOrder = vi
				.fn()
				.mockResolvedValueOnce({ id: REAL_UUID })
				.mockRejectedValueOnce(new Error("permanent error"));
			const bulkUpdateStage = vi.fn().mockResolvedValue(undefined);
			const bulkDelete = vi.fn().mockResolvedValue(undefined);

			await useAppStore
				.getState()
				.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });
			expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(
				2,
			);

			useAppStore.getState().skipFailedCommand();

			const state = useAppStore.getState().draftSession;
			expect(state.pendingCommands).toHaveLength(1);
			expect(state.pendingCommands[0]).toMatchObject({ type: "createRows" });
			// The createRows command already persisted; the checkpoint must keep
			// pointing past it rather than resetting to 0 (which would replay it).
			expect(state.saveCheckpoint).toEqual({
				nextIndex: 1,
				idMapEntries: [[TEMP_ID, REAL_UUID]],
			});
			expect(state.dirty).toBe(true);

			// Retry: nothing is re-executed; the save just finalizes the session.
			await useAppStore
				.getState()
				.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

			expect(saveOrder).toHaveBeenCalledTimes(2);
			const afterRetry = useAppStore.getState().draftSession;
			expect(afterRetry.dirty).toBe(false);
			expect(afterRetry.pendingCommands).toHaveLength(0);
			expect(afterRetry.saveCheckpoint).toBeNull();
		});

		it("is a no-op when there is no active saveCheckpoint", () => {
			const row = createRow("00000000-0000-4000-8000-000000000022", "orders");
			seedStageData({ orders: [row] });

			useAppStore.getState().applyCommand({
				type: "patchRow",
				id: row.id,
				sourceStage: "orders",
				destinationStage: "orders",
				updates: { status: "Arrived" },
				previousValues: { status: "Pending" },
			});

			expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(
				1,
			);

			useAppStore.getState().skipFailedCommand();

			expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(
				1,
			);
		});

		it("execution failure sets saveBlockedIndex equal to saveCheckpoint.nextIndex, and skipFailedCommand yields same state as before", async () => {
			const rowA = createRow("00000000-0000-4000-8000-0000000000a3", "orders");
			const rowB = createRow("00000000-0000-4000-8000-0000000000b4", "orders");
			seedStageData({ orders: [rowA, rowB] });

			useAppStore.getState().applyCommand({
				type: "patchRow",
				id: rowA.id,
				sourceStage: "orders",
				destinationStage: "orders",
				updates: { status: "Done" },
				previousValues: { status: "Pending" },
			});
			useAppStore.getState().applyCommand({
				type: "patchRow",
				id: rowB.id,
				sourceStage: "orders",
				destinationStage: "orders",
				updates: { status: "Done" },
				previousValues: { status: "Pending" },
			});

			const saveOrder = vi
				.fn()
				.mockResolvedValueOnce(undefined) // rowA succeeds
				.mockRejectedValueOnce(new Error("execution failure at rowB")); // rowB fails
			const bulkUpdateStage = vi.fn().mockResolvedValue(undefined);
			const bulkDelete = vi.fn().mockResolvedValue(undefined);

			await useAppStore
				.getState()
				.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

			const state = useAppStore.getState().draftSession;
			expect(state.saveError).toBe("execution failure at rowB");
			expect(state.saveCheckpoint?.nextIndex).toBe(1);
			expect(state.saveBlockedIndex).toBe(1);
			expect(state.saveBlockedIndex).toBe(state.saveCheckpoint?.nextIndex);

			useAppStore.getState().skipFailedCommand();

			const afterSkip = useAppStore.getState().draftSession;
			expect(afterSkip.pendingCommands).toHaveLength(1);
			expect((afterSkip.pendingCommands[0] as { id: string }).id).toBe(rowA.id);
			// rowA already persisted, so the checkpoint stays past it even though
			// the skipped command was the last pending one.
			expect(afterSkip.saveCheckpoint).toEqual({
				nextIndex: 1,
				idMapEntries: [],
			});
			expect(afterSkip.saveBlockedIndex).toBeNull();

			// Retry must not re-apply rowA's patch (it could overwrite a newer edit).
			await useAppStore
				.getState()
				.saveDraft({ saveOrder, bulkUpdateStage, bulkDelete });

			expect(saveOrder).toHaveBeenCalledTimes(2);
			expect(useAppStore.getState().draftSession.dirty).toBe(false);
			expect(useAppStore.getState().draftSession.saveCheckpoint).toBeNull();
		});
	});
});
