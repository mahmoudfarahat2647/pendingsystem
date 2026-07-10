import { describe, expect, it } from "vitest";
import {
	DraftCommandSchema,
	DraftRecoverySnapshotSchema,
} from "@/schemas/draftSession.schema";

describe("DraftCommandSchema", () => {
	it("accepts a well-formed patchRow command", () => {
		const result = DraftCommandSchema.safeParse({
			type: "patchRow",
			id: "row-1",
			sourceStage: "orders",
			destinationStage: "main",
			updates: { status: "Arrived" },
			previousValues: { status: "Pending" },
		});
		expect(result.success).toBe(true);
	});

	it("accepts a well-formed composite command with atomic children", () => {
		const result = DraftCommandSchema.safeParse({
			type: "composite",
			label: "create-then-delete",
			children: [
				{ type: "createRows", stage: "orders", rows: [{ id: "temp-1" }] },
				{ type: "deleteRows", ids: ["temp-1"] },
			],
		});
		expect(result.success).toBe(true);
	});

	it("rejects a command with an unrecognized type", () => {
		const result = DraftCommandSchema.safeParse({
			type: "teleportRows",
			ids: ["row-1"],
		});
		expect(result.success).toBe(false);
	});

	it("rejects a patchRow command missing required fields", () => {
		const result = DraftCommandSchema.safeParse({
			type: "patchRow",
			id: "row-1",
			// missing sourceStage/destinationStage/updates/previousValues
		});
		expect(result.success).toBe(false);
	});

	it("rejects a moveRows command with an invalid stage", () => {
		const result = DraftCommandSchema.safeParse({
			type: "moveRows",
			ids: ["row-1"],
			sourceStage: "orders",
			destinationStage: "not-a-real-stage",
		});
		expect(result.success).toBe(false);
	});

	it("rejects a createRows command whose rows are missing an id", () => {
		const result = DraftCommandSchema.safeParse({
			type: "createRows",
			stage: "orders",
			rows: [{ customerName: "No ID here" }],
		});
		expect(result.success).toBe(false);
	});
});

describe("DraftRecoverySnapshotSchema", () => {
	it("accepts a well-formed snapshot", () => {
		const result = DraftRecoverySnapshotSchema.safeParse({
			workspaceId: "workspace-1",
			updatedAt: Date.now(),
			pendingCommands: [{ type: "deleteRows", ids: ["row-1"] }],
		});
		expect(result.success).toBe(true);
	});

	it("rejects malformed / garbage JSON content", () => {
		expect(
			DraftRecoverySnapshotSchema.safeParse({ garbage: true }).success,
		).toBe(false);
		expect(DraftRecoverySnapshotSchema.safeParse(null).success).toBe(false);
		expect(DraftRecoverySnapshotSchema.safeParse("just a string").success).toBe(
			false,
		);
		expect(DraftRecoverySnapshotSchema.safeParse([]).success).toBe(false);
	});

	it("rejects a snapshot whose pendingCommands contain one bad command", () => {
		const result = DraftRecoverySnapshotSchema.safeParse({
			workspaceId: "workspace-1",
			updatedAt: Date.now(),
			pendingCommands: [
				{ type: "deleteRows", ids: ["row-1"] },
				{ type: "notARealCommand" },
			],
		});
		expect(result.success).toBe(false);
	});

	it("rejects a snapshot missing workspaceId", () => {
		const result = DraftRecoverySnapshotSchema.safeParse({
			updatedAt: Date.now(),
			pendingCommands: [],
		});
		expect(result.success).toBe(false);
	});
});
