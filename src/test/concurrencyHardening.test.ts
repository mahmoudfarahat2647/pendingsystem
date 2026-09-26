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
import { getOrdersQueryKey } from "@/lib/queryClient";
import { createOrderRepository } from "@/services/orderRepository";
import { ServiceError } from "@/services/orderServiceErrors";
import type { DraftRecoverySnapshot } from "@/store/slices/draftSessionSlice";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import { queryClient } from "./testQueryClient";

const VALID_UUID = "123e4567-e89b-42d3-a456-426614174000";
const VALID_UUID_2 = "123e4567-e89b-42d3-a456-426614174001";

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

function makeSequentialDb(responses: Array<{ data: unknown; error: unknown }>) {
	let call = 0;
	const from = vi.fn(() => {
		const response = responses[Math.min(call, responses.length - 1)];
		call++;
		// biome-ignore lint/suspicious/noExplicitAny: chainable test mock
		const chain: any = {};
		chain.select = vi.fn(() => chain);
		chain.eq = vi.fn(() => chain);
		chain.update = vi.fn(() => chain);
		chain.order = vi.fn(() => chain);
		chain.insert = vi.fn(() => chain);
		chain.delete = vi.fn(() => chain);
		chain.in = vi.fn(() => chain);
		chain.maybeSingle = vi.fn().mockResolvedValue(response);
		chain.single = vi.fn().mockResolvedValue(response);
		return chain;
	});
	return {
		db: { from } as unknown as Parameters<typeof createOrderRepository>[0],
		callCount: () => call,
	};
}

describe("Issue #202: Concurrency Hardening & Compare-and-Set", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		queryClient.clear();
		resetDraftSession();
		useAppStore.setState({ lastCommandError: null });
	});

	describe("saveOrder compare-and-set guards (Hole #1 & #2)", () => {
		it("surfaces a visible ROW_FROZEN_ELSEWHERE conflict when a row was frozen elsewhere", async () => {
			const { db } = makeSequentialDb([
				// 1. Initial snapshot read: caller reads row in "main"
				{
					data: { metadata: {}, updated_at: "t1", stage: "main" },
					error: null,
				},
				// 2. Conditional UPDATE matches 0 rows (because stage != "main" in DB)
				{ data: null, error: null },
				// 3. Recheck query reveals row was moved to "freeze"
				{
					data: { stage: "freeze", metadata: {}, updated_at: "t2" },
					error: null,
				},
			]);

			const repo = createOrderRepository(db);

			await expect(
				repo.saveOrder({
					id: VALID_UUID,
					stage: "main",
					expectedCurrentStage: "main",
					customerName: "Jane",
				}),
			).rejects.toMatchObject({
				code: "ROW_FROZEN_ELSEWHERE",
				message:
					"This order was frozen by someone else. Please refresh and try again.",
			});
		});

		it("surfaces a visible STAGE_CHANGED_ELSEWHERE conflict when caller expected freeze but row moved", async () => {
			const { db } = makeSequentialDb([
				// 1. Initial snapshot read
				{
					data: { metadata: {}, updated_at: "t1", stage: "freeze" },
					error: null,
				},
				// 2. Conditional UPDATE matches 0 rows
				{ data: null, error: null },
				// 3. Recheck reveals row is no longer in "freeze" (unfrozen/moved to "call")
				{
					data: { stage: "call", metadata: {}, updated_at: "t2" },
					error: null,
				},
			]);

			const repo = createOrderRepository(db);

			await expect(
				repo.saveOrder({
					id: VALID_UUID,
					stage: "freeze",
					expectedCurrentStage: "freeze",
					customerName: "Jane",
				}),
			).rejects.toMatchObject({
				code: "STAGE_CHANGED_ELSEWHERE",
				message:
					"This order is no longer in freeze (currently in call). Please refresh and try again.",
			});
		});

		it("maintains silent no-op for routine non-freeze stage divergence (e.g. concurrent archive sweep)", async () => {
			const { db } = makeSequentialDb([
				// 1. Initial snapshot read
				{
					data: { metadata: {}, updated_at: "t1", stage: "main" },
					error: null,
				},
				// 2. Conditional UPDATE matches 0 rows
				{ data: null, error: null },
				// 3. Recheck reveals row was already archived by a concurrent scan
				{
					data: { stage: "archive", metadata: {}, updated_at: "t2" },
					error: null,
				},
			]);

			const repo = createOrderRepository(db);

			const result = await repo.saveOrder({
				id: VALID_UUID,
				stage: "archive",
				expectedCurrentStage: "main",
				customerName: "Jane",
			});

			expect(result).toBeNull();
		});
	});

	describe("Draft session same-stage CAS & stale draft conflict handling", () => {
		it("passes sourceStage for same-stage patchRow commands so server-side CAS is active", async () => {
			const row = createRow(VALID_UUID, "main");
			seedStageData({ main: [row] });

			useAppStore.getState().applyCommand({
				type: "patchRow",
				id: row.id,
				sourceStage: "main",
				destinationStage: "main",
				updates: { noteHistory: "Updated note" },
				previousValues: { noteHistory: "" },
			});

			const saveOrder = vi.fn().mockResolvedValue({ id: row.id });
			const bulkUpdateStage = vi.fn().mockResolvedValue(undefined);
			const bulkDelete = vi.fn().mockResolvedValue(undefined);

			await useAppStore.getState().saveDraft({
				saveOrder,
				bulkUpdateStage,
				bulkDelete,
			});

			// Verify sourceStage was NOT stripped to undefined:
			expect(saveOrder).toHaveBeenCalledWith(
				expect.objectContaining({
					id: row.id,
					stage: "main",
					sourceStage: "main",
				}),
			);
		});

		it("halts saveDraft and surfaces conflict when a stale draft targets a row frozen elsewhere", async () => {
			const row = createRow(VALID_UUID, "main");
			seedStageData({ main: [row] });

			useAppStore.getState().applyCommand({
				type: "patchRow",
				id: row.id,
				sourceStage: "main",
				destinationStage: "main",
				updates: { status: "Arrived" },
				previousValues: { status: "Pending" },
			});

			const saveOrder = vi
				.fn()
				.mockRejectedValueOnce(
					new ServiceError(
						"ROW_FROZEN_ELSEWHERE",
						"This order was frozen by someone else. Please refresh and try again.",
					),
				);
			const bulkUpdateStage = vi.fn().mockResolvedValue(undefined);
			const bulkDelete = vi.fn().mockResolvedValue(undefined);

			await useAppStore.getState().saveDraft({
				saveOrder,
				bulkUpdateStage,
				bulkDelete,
			});

			const state = useAppStore.getState().draftSession;
			expect(state.dirty).toBe(true);
			expect(state.saveError).toBe(
				"This order was frozen by someone else. Please refresh and try again.",
			);
			expect(state.pendingCommands).toHaveLength(1);
			expect(state.saveCheckpoint?.nextIndex).toBe(0);
		});

		it("allows user to skip the conflicting command via skipFailedCommand", async () => {
			const row1 = createRow(VALID_UUID, "main");
			const row2 = createRow(VALID_UUID_2, "main");
			seedStageData({ main: [row1, row2] });

			// Two commands: row1 fails because it was frozen; row2 should succeed after skipping
			useAppStore.getState().applyCommand({
				type: "patchRow",
				id: row1.id,
				sourceStage: "main",
				destinationStage: "main",
				updates: { status: "Arrived" },
				previousValues: { status: "Pending" },
			});
			useAppStore.getState().applyCommand({
				type: "patchRow",
				id: row2.id,
				sourceStage: "main",
				destinationStage: "main",
				updates: { status: "Arrived" },
				previousValues: { status: "Pending" },
			});

			const saveOrder = vi
				.fn()
				.mockRejectedValueOnce(
					new ServiceError(
						"ROW_FROZEN_ELSEWHERE",
						"This order was frozen by someone else. Please refresh and try again.",
					),
				)
				.mockResolvedValue({ id: row2.id });
			const bulkUpdateStage = vi.fn().mockResolvedValue(undefined);
			const bulkDelete = vi.fn().mockResolvedValue(undefined);

			await useAppStore.getState().saveDraft({
				saveOrder,
				bulkUpdateStage,
				bulkDelete,
			});

			expect(useAppStore.getState().draftSession.saveError).toBeTruthy();
			expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(
				2,
			);

			// User clicks "Skip this change"
			useAppStore.getState().skipFailedCommand();

			expect(useAppStore.getState().draftSession.saveError).toBeNull();
			expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(
				1,
			);
			const remainingCmd =
				useAppStore.getState().draftSession.pendingCommands[0];
			expect(remainingCmd?.type).toBe("patchRow");
			if (remainingCmd?.type === "patchRow") {
				expect(remainingCmd.id).toBe(row2.id);
			}

			// Saving again now succeeds for row2
			await useAppStore.getState().saveDraft({
				saveOrder,
				bulkUpdateStage,
				bulkDelete,
			});

			expect(useAppStore.getState().draftSession.dirty).toBe(false);
			expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(
				0,
			);
		});
	});

	describe("Recovery snapshot conflict policy: surfaced for manual reconciliation", () => {
		it("surfaces conflict when restored snapshot command targets a frozen row", async () => {
			const row = createRow(VALID_UUID, "main");
			seedStageData({ main: [row] });

			const snapshot: DraftRecoverySnapshot = {
				workspaceId: "test-workspace",
				updatedAt: Date.now(),
				pendingCommands: [
					{
						type: "patchRow",
						id: row.id,
						sourceStage: "main",
						destinationStage: "main",
						updates: { noteHistory: "Recovered draft edit" },
						previousValues: { noteHistory: "" },
					},
				],
			};

			// Restore snapshot from recovery storage
			useAppStore.getState().restoreFromRecovery(snapshot);

			expect(useAppStore.getState().draftSession.dirty).toBe(true);
			expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(
				1,
			);

			// Attempting to save encounters ROW_FROZEN_ELSEWHERE
			const saveOrder = vi
				.fn()
				.mockRejectedValueOnce(
					new ServiceError(
						"ROW_FROZEN_ELSEWHERE",
						"This order was frozen by someone else. Please refresh and try again.",
					),
				);
			const bulkUpdateStage = vi.fn().mockResolvedValue(undefined);
			const bulkDelete = vi.fn().mockResolvedValue(undefined);

			await useAppStore.getState().saveDraft({
				saveOrder,
				bulkUpdateStage,
				bulkDelete,
			});

			// Confirms the policy decision: surfaced for manual reconciliation, NOT dropped or wiped
			const state = useAppStore.getState().draftSession;
			expect(state.saveError).toBe(
				"This order was frozen by someone else. Please refresh and try again.",
			);
			expect(state.dirty).toBe(true);
			expect(state.pendingCommands).toHaveLength(1);

			// User can explicitly discard if they choose
			useAppStore.getState().discardDraft();
			expect(useAppStore.getState().draftSession.dirty).toBe(false);
			expect(useAppStore.getState().draftSession.pendingCommands).toHaveLength(
				0,
			);
		});
	});

	describe("Bulk stage move compare-and-set (Hole #3)", () => {
		it("guards on previousStage and throws BULK_STAGE_MOVE_CONFLICT when rows diverged", async () => {
			// Mock DB where row-2 was not in "main" (already frozen), so only row-1 was updated
			const mockEq = vi.fn().mockReturnThis();
			const mockIn = vi.fn().mockReturnThis();
			const mockUpdate = vi.fn().mockReturnThis();
			const mockSelect = vi
				.fn()
				.mockResolvedValue({ data: [{ id: "row-1" }], error: null });

			const db = {
				from: () => ({
					update: mockUpdate,
					eq: mockEq,
					in: mockIn,
					select: mockSelect,
				}),
			};

			// biome-ignore lint/suspicious/noExplicitAny: mock DB
			const repo = createOrderRepository(db as any);

			await expect(
				repo.updateOrdersStage(["row-1", "row-2"], "call", "main"),
			).rejects.toMatchObject({
				code: "BULK_STAGE_MOVE_CONFLICT",
				message:
					'1 of 2 orders could not be moved because they are no longer in "main".',
				details: {
					unmatchedIds: ["row-2"],
					successfulIds: ["row-1"],
					expectedStage: "main",
				},
			});

			expect(mockEq).toHaveBeenCalledWith("stage", "main");
		});

		it("throws BULK_STAGE_MOVE_CONFLICT when no rows matched previousStage", async () => {
			const mockEq = vi.fn().mockReturnThis();
			const mockIn = vi.fn().mockReturnThis();
			const mockUpdate = vi.fn().mockReturnThis();
			const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null });

			const db = {
				from: () => ({
					update: mockUpdate,
					eq: mockEq,
					in: mockIn,
					select: mockSelect,
				}),
			};

			// biome-ignore lint/suspicious/noExplicitAny: mock DB
			const repo = createOrderRepository(db as any);

			await expect(
				repo.updateOrdersStage(["row-1", "row-2"], "call", "main"),
			).rejects.toMatchObject({
				code: "BULK_STAGE_MOVE_CONFLICT",
				message:
					'None of the 2 orders could be moved because they are no longer in "main".',
				details: {
					unmatchedIds: ["row-1", "row-2"],
					expectedStage: "main",
				},
			});
		});

		it("succeeds when all rows matched previousStage", async () => {
			const mockEq = vi.fn().mockReturnThis();
			const mockIn = vi.fn().mockReturnThis();
			const mockUpdate = vi.fn().mockReturnThis();
			const mockSelect = vi.fn().mockResolvedValue({
				data: [{ id: "row-1" }, { id: "row-2" }],
				error: null,
			});

			const db = {
				from: () => ({
					update: mockUpdate,
					eq: mockEq,
					in: mockIn,
					select: mockSelect,
				}),
			};

			// biome-ignore lint/suspicious/noExplicitAny: mock DB
			const repo = createOrderRepository(db as any);

			const result = await repo.updateOrdersStage(
				["row-1", "row-2"],
				"call",
				"main",
			);
			expect(result).toHaveLength(2);
			expect(mockEq).toHaveBeenCalledWith("stage", "main");
		});

		it("throws BULK_STAGE_MOVE_CONFLICT for a partial mismatch spanning the batched (>50 ids) path", async () => {
			// 60 ids -> 2 chunks (50 + 10). No chunk hits a hard DB error; instead,
			// one id in each chunk no longer matches "main" (frozen elsewhere), so
			// this exercises the batched branch's own unmatched-id accounting
			// (orderRepository.ts's `allUnmatchedIds`), which is separate code from
			// the non-batched conflict path covered by the two tests above.
			const chunk1Ids = Array.from({ length: 50 }, (_, i) => `row-${i}`);
			const chunk2Ids = Array.from({ length: 10 }, (_, i) => `row-${i + 50}`);
			const allIds = [...chunk1Ids, ...chunk2Ids];

			// One divergent id per chunk: row-7 (chunk 1) and row-55 (chunk 2).
			const chunk1Matched = chunk1Ids.filter((id) => id !== "row-7");
			const chunk2Matched = chunk2Ids.filter((id) => id !== "row-55");

			const mockEq = vi.fn().mockReturnThis();
			const mockIn = vi.fn().mockReturnThis();
			const mockUpdate = vi.fn().mockReturnThis();
			const mockSelect = vi
				.fn()
				.mockResolvedValueOnce({
					data: chunk1Matched.map((id) => ({ id })),
					error: null,
				})
				.mockResolvedValueOnce({
					data: chunk2Matched.map((id) => ({ id })),
					error: null,
				});

			const db = {
				from: () => ({
					update: mockUpdate,
					eq: mockEq,
					in: mockIn,
					select: mockSelect,
				}),
			};

			// biome-ignore lint/suspicious/noExplicitAny: mock DB
			const repo = createOrderRepository(db as any);

			await expect(
				repo.updateOrdersStage(allIds, "call", "main"),
			).rejects.toMatchObject({
				code: "BULK_STAGE_MOVE_CONFLICT",
				message:
					'2 of 60 orders could not be moved because they are no longer in "main".',
				details: {
					unmatchedIds: ["row-7", "row-55"],
					expectedStage: "main",
				},
			});

			expect(mockSelect).toHaveBeenCalledTimes(2);
			expect(mockEq).toHaveBeenCalledWith("stage", "main");
		});
	});
});
