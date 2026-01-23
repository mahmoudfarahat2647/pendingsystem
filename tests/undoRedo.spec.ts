import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/restoreService", () => ({
	restoreService: {
		restoreSnapshot: vi.fn(async () => undefined),
	},
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

const makePendingRow = (id: string) =>
	({ id, baseId: `B-${id}` } as unknown as import("@/types").PendingRow);

describe("undo/redo core logic (session-only)", () => {
	beforeEach(async () => {
		vi.restoreAllMocks();
		localStorage.clear();

		const { useAppStore } = await import("@/store/useStore");
		useAppStore.setState(useAppStore.getInitialState(), true);
		// Ensure persist middleware doesn't leak state between tests
		await useAppStore.persist.rehydrate();
	});

	afterEach(async () => {
		const { useAppStore } = await import("@/store/useStore");
		useAppStore.setState(useAppStore.getInitialState(), true);
		localStorage.clear();
	});

	it("1) pushUndo() is called BEFORE each data mutation in slices", async () => {
		const { useAppStore } = await import("@/store/useStore");

		const pushUndoSpy = vi.spyOn(useAppStore.getState(), "pushUndo");
		const setStateSpy = vi.spyOn(useAppStore, "setState");

		const assertPushUndoBeforeMutation = (beforeSetCalls: number) => {
			const afterCalls = setStateSpy.mock.calls.length;
			const delta = afterCalls - beforeSetCalls;
			// Expected at least:
			// - 1 setState from pushUndo()
			// - 1 setState from the actual mutation
			expect(delta).toBeGreaterThanOrEqual(2);

			const pushOrder = pushUndoSpy.mock.invocationCallOrder.at(-1);
			const mutationSetOrder =
				setStateSpy.mock.invocationCallOrder[beforeSetCalls + 1];
			expect(pushOrder).toBeTypeOf("number");
			expect(mutationSetOrder).toBeTypeOf("number");
			expect(pushOrder as number).toBeLessThan(mutationSetOrder as number);
		};

		// Orders slice mutation
		const beforeOrders = setStateSpy.mock.calls.length;
		useAppStore.getState().addOrder(makePendingRow("order-1"));
		assertPushUndoBeforeMutation(beforeOrders);

		// Booking slice mutation
		const beforeBooking = setStateSpy.mock.calls.length;
		useAppStore.setState(
			{
				rowData: [makePendingRow("m-1")],
				ordersRowData: [makePendingRow("o-1")],
				callRowData: [makePendingRow("c-1")],
			},
			false,
		);
		// reset baseline after seeding state
		const beforeSendToBooking = setStateSpy.mock.calls.length;
		useAppStore
			.getState()
			.sendToBooking(["m-1", "o-1", "c-1"], "2026-01-01", undefined);
		// sanity: seeding state should not be counted in this assertion
		expect(beforeSendToBooking).toBeGreaterThan(beforeBooking);
		assertPushUndoBeforeMutation(beforeSendToBooking);

		// Inventory slice mutation
		const beforeInventorySeed = setStateSpy.mock.calls.length;
		useAppStore.setState(
			{
				ordersRowData: [makePendingRow("inv-1")],
				rowData: [],
			},
			false,
		);
		const beforeCommitToMain = setStateSpy.mock.calls.length;
		useAppStore.getState().commitToMainSheet(["inv-1"]);
		expect(beforeCommitToMain).toBeGreaterThan(beforeInventorySeed);
		assertPushUndoBeforeMutation(beforeCommitToMain);

		// UI slice mutation
		const beforeUi = setStateSpy.mock.calls.length;
		useAppStore.getState().addTodo("x");
		assertPushUndoBeforeMutation(beforeUi);
	});

	it("2) clearUndoRedo() is called exactly once when commitSave() is triggered", async () => {
		const { useAppStore } = await import("@/store/useStore");

		const clearSpy = vi.spyOn(useAppStore.getState(), "clearUndoRedo");

		useAppStore.setState(
			{
				rowData: [makePendingRow("r1")],
			},
			false,
		);
		useAppStore.getState().pushUndo();
		expect(useAppStore.getState().undoStack.length).toBe(1);

		useAppStore.getState().commitSave();

		expect(clearSpy).toHaveBeenCalledTimes(1);
		expect(useAppStore.getState().undoStack).toHaveLength(0);
		expect(useAppStore.getState().redoStack).toHaveLength(0);
	});

	it("3) Undo stack does not exceed UNDO_STACK_LIMIT = 30", async () => {
		const { useAppStore } = await import("@/store/useStore");

		for (let i = 0; i < 35; i++) {
			useAppStore.setState({ rowData: [makePendingRow(String(i))] }, false);
			useAppStore.getState().pushUndo();
		}

		expect(useAppStore.getState().undoStack).toHaveLength(30);
	});

	it("4) Redo stack works correctly after undo", async () => {
		const { useAppStore } = await import("@/store/useStore");

		useAppStore.setState({ rowData: [makePendingRow("A")] }, false);
		useAppStore.getState().pushUndo();

		useAppStore.setState({ rowData: [makePendingRow("B")] }, false);
		useAppStore.getState().undo();

		expect(useAppStore.getState().rowData[0]?.id).toBe("A");
		expect(useAppStore.getState().redoStack).toHaveLength(1);

		useAppStore.getState().redo();		
		expect(useAppStore.getState().rowData[0]?.id).toBe("B");
	});

	it("5) undoStack and redoStack are NOT persisted in localStorage", async () => {
		const { useAppStore } = await import("@/store/useStore");

		useAppStore.setState({ rowData: [makePendingRow("p1")] }, false);
		useAppStore.getState().pushUndo();
		useAppStore.getState().undo();

		const options = useAppStore.persist.getOptions();
		expect(options.partialize).toBeTypeOf("function");
		if (!options.partialize) throw new Error("persist.partialize is undefined");
		const partial = options.partialize(useAppStore.getState() as any) as Record<
			string,
			unknown
		>;

		expect(partial).not.toHaveProperty("undoStack");
		expect(partial).not.toHaveProperty("redoStack");

		const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
		useAppStore.setState({ notes: [] }, false);

		const writePayload = setItemSpy.mock.calls
			.map((c) => c[1])
			.filter((v): v is string => typeof v === "string")
			.join("\n");
		expect(writePayload).not.toContain("undoStack");
		expect(writePayload).not.toContain("redoStack");
	});

	it("6) No references to historySlice or audit log exist in undoRedoSlice", async () => {
		const filePath = path.join(
			process.cwd(),
			"src",
			"store",
			"slices",
			"undoRedoSlice.ts",
		);
		const src = fs.readFileSync(filePath, "utf8");

		expect(src).not.toMatch(/historySlice/i);
		expect(src).not.toMatch(/audit/i);
		expect(src).not.toMatch(/48\s*-?\s*hour/i);
	});

	it("7) Reset / page refresh clears undoRedo state in memory", async () => {
		const { useAppStore } = await import("@/store/useStore");

		useAppStore.setState({ rowData: [makePendingRow("x")], notes: [] }, false);
		useAppStore.getState().pushUndo();
		expect(useAppStore.getState().undoStack).toHaveLength(1);

		// Simulate refresh: new module instance + rehydrate from persisted partial state
		vi.resetModules();
		const { useAppStore: useAppStore2 } = await import("@/store/useStore");
		await useAppStore2.persist.rehydrate();

		expect(useAppStore2.getState().undoStack).toHaveLength(0);
		expect(useAppStore2.getState().redoStack).toHaveLength(0);
	});
});
