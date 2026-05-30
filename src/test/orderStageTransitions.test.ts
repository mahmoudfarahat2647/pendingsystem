import { describe, expect, it } from "vitest";
import { buildArchivePayload } from "@/lib/archivePayloadBuilder";
import {
	buildBookingCommands,
	buildRebookingCommands,
	buildReorderCommands,
	buildSendToArchiveCommands,
} from "@/lib/orderStageTransitions";
import {
	appendTaggedUserNote,
	getEffectiveNoteHistory,
} from "@/lib/orderWorkflow";
import type { PendingRow } from "@/types";

const createMockRow = (overrides: Partial<PendingRow> = {}): PendingRow => ({
	id: "row-uuid-1",
	baseId: "B1",
	trackingId: "T1",
	customerName: "Test Customer",
	mobile: "123456789",
	parts: [],
	status: "Pending",
	rDate: "2024-01-01",
	requester: "Admin",
	acceptedBy: "Admin",
	sabNumber: "S1",
	model: "Clio",
	cntrRdg: 1000,
	repairSystem: "None",
	startWarranty: "",
	endWarranty: "",
	remainTime: "",
	partNumber: "P1",
	description: "Test Part",
	quantity: 1,
	vin: "VIN12345678901234",
	stage: "orders",
	...overrides,
});

// ---------------------------------------------------------------------------
describe("buildSendToArchiveCommands", () => {
	it("returns one patchRow per row with destinationStage 'archive'", () => {
		const rows = [createMockRow({ id: "id-1" }), createMockRow({ id: "id-2" })];
		const cmds = buildSendToArchiveCommands(rows, "Damaged", "call");
		expect(cmds).toHaveLength(2);
		expect(cmds[0].type).toBe("patchRow");
		expect(cmds[0].sourceStage).toBe("call");
		expect(cmds[0].destinationStage).toBe("archive");
		expect(cmds[1].id).toBe("id-2");
	});

	it("uses buildArchivePayload so updates include status, archivedAt, archiveReason, noteHistory", () => {
		const row = createMockRow({ id: "id-1" });
		const [cmd] = buildSendToArchiveCommands([row], "broken part", "main");
		const expected = buildArchivePayload(row, "broken part");
		expect(cmd.updates).toMatchObject({
			status: "Archived",
			archiveReason: "broken part",
			noteHistory: expected.noteHistory,
		});
		expect(typeof cmd.updates.archivedAt).toBe("string");
	});

	it("respects the sourceStage parameter", () => {
		const row = createMockRow();
		const [cmd] = buildSendToArchiveCommands([row], "reason", "booking");
		expect(cmd.sourceStage).toBe("booking");
	});

	it("returns empty array for empty input", () => {
		expect(buildSendToArchiveCommands([], "reason", "orders")).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
describe("buildReorderCommands", () => {
	it("returns one patchRow per row with destinationStage 'orders'", () => {
		const rows = [createMockRow({ id: "id-1" }), createMockRow({ id: "id-2" })];
		const cmds = buildReorderCommands(rows, "call", "wrong part");
		expect(cmds).toHaveLength(2);
		expect(cmds[0].destinationStage).toBe("orders");
		expect(cmds[0].sourceStage).toBe("call");
	});

	it("sets status to 'Reorder'", () => {
		const [cmd] = buildReorderCommands([createMockRow()], "main", "no stock");
		expect(cmd.updates.status).toBe("Reorder");
	});

	it("prepends 'Reorder Reason: ' to the reason in noteHistory", () => {
		const row = createMockRow();
		const [cmd] = buildReorderCommands([row], "archive", "no stock");
		const expected = appendTaggedUserNote(
			getEffectiveNoteHistory(row),
			"Reorder Reason: no stock",
			"reorder",
		);
		expect(cmd.updates.noteHistory).toBe(expected);
	});

	it("uses empty previousValues", () => {
		const [cmd] = buildReorderCommands([createMockRow()], "booking", "test");
		expect(cmd.previousValues).toEqual({});
	});
});

// ---------------------------------------------------------------------------
describe("buildBookingCommands", () => {
	it("returns one patchRow per row with destinationStage 'booking'", () => {
		const rows = [createMockRow({ id: "id-1" }), createMockRow({ id: "id-2" })];
		const cmds = buildBookingCommands(
			rows,
			"call",
			"2025-06-01",
			"ready",
			undefined,
		);
		expect(cmds).toHaveLength(2);
		expect(cmds[0].destinationStage).toBe("booking");
		expect(cmds[0].sourceStage).toBe("call");
	});

	it("sets bookingDate and bookingNote in updates", () => {
		const [cmd] = buildBookingCommands(
			[createMockRow()],
			"main",
			"2025-06-01",
			"ready for pickup",
		);
		expect(cmd.updates.bookingDate).toBe("2025-06-01");
		expect(cmd.updates.bookingNote).toBe("ready for pickup");
	});

	it("appends a #booking tag to noteHistory", () => {
		const row = createMockRow();
		const [cmd] = buildBookingCommands([row], "archive", "2025-06-01", "note");
		const expected = appendTaggedUserNote(
			getEffectiveNoteHistory(row),
			"note",
			"booking",
		);
		expect(cmd.updates.noteHistory).toBe(expected);
	});

	it("includes bookingStatus when status arg is provided", () => {
		const [cmd] = buildBookingCommands(
			[createMockRow()],
			"call",
			"2025-06-01",
			"note",
			"Confirmed",
		);
		expect(cmd.updates.bookingStatus).toBe("Confirmed");
	});

	it("omits bookingStatus when status arg is undefined", () => {
		const [cmd] = buildBookingCommands(
			[createMockRow()],
			"call",
			"2025-06-01",
			"note",
			undefined,
		);
		expect("bookingStatus" in cmd.updates).toBe(false);
	});
});

// ---------------------------------------------------------------------------
describe("buildRebookingCommands", () => {
	it("stays in 'booking' stage (sourceStage and destinationStage both 'booking')", () => {
		const [cmd] = buildRebookingCommands(
			[createMockRow()],
			"2025-07-01",
			"reschedule note",
		);
		expect(cmd.sourceStage).toBe("booking");
		expect(cmd.destinationStage).toBe("booking");
	});

	it("prepends old date to new booking note", () => {
		const row = createMockRow({
			bookingDate: "2025-06-01",
			bookingNote: "original",
		});
		const [cmd] = buildRebookingCommands([row], "2025-07-01", "new note");
		expect(cmd.updates.bookingNote).toBe(
			"original\n[System]: Rescheduled from 2025-06-01 to 2025-07-01. new note",
		);
	});

	it("creates booking note from scratch when row has no previous bookingNote", () => {
		const row = createMockRow({
			bookingDate: "2025-06-01",
			bookingNote: undefined,
		});
		const [cmd] = buildRebookingCommands([row], "2025-07-01", "first note");
		expect(cmd.updates.bookingNote).toBe(
			"[System]: Rescheduled from 2025-06-01 to 2025-07-01. first note",
		);
	});

	it("appends a #rebooking tag to noteHistory", () => {
		const row = createMockRow({ bookingDate: "2025-06-01" });
		const [cmd] = buildRebookingCommands([row], "2025-07-01", "new note");
		const fullNote = "Rescheduled from 2025-06-01 to 2025-07-01. new note";
		const expected = appendTaggedUserNote(
			getEffectiveNoteHistory(row),
			fullNote,
			"rebooking",
		);
		expect(cmd.updates.noteHistory).toBe(expected);
	});

	it("falls back to 'Unknown Date' when bookingDate is absent", () => {
		const row = createMockRow({ bookingDate: undefined });
		const [cmd] = buildRebookingCommands([row], "2025-07-01", "note");
		expect(cmd.updates.bookingNote).toContain("Rescheduled from Unknown Date");
	});

	it("includes bookingStatus when provided", () => {
		const [cmd] = buildRebookingCommands(
			[createMockRow({ bookingDate: "2025-06-01" })],
			"2025-07-01",
			"note",
			"Confirmed",
		);
		expect(cmd.updates.bookingStatus).toBe("Confirmed");
	});
});
