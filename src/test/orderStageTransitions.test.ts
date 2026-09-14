import { describe, expect, it } from "vitest";
import {
	appendTaggedUserNote,
	getEffectiveNoteHistory,
} from "@/domain/order/orderWorkflow";
import { buildArchivePayload } from "@/lib/archivePayloadBuilder";
import {
	buildBookingCommands,
	buildRebookingCommands,
	buildReorderCommands,
	buildSendToArchiveCommands,
	buildUnfreezeCommands,
} from "@/lib/orderStageTransitions";
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

	it("does not touch attachment fields when the row has no External Link", () => {
		const [cmd] = buildReorderCommands([createMockRow()], "main", "no stock");
		expect("attachmentLink" in cmd.updates).toBe(false);
		expect("hasAttachment" in cmd.updates).toBe(false);
	});

	it("preserves the External Link into the note history and clears it", () => {
		const row = createMockRow({
			attachmentLink: "https://example.com/old-link",
			hasAttachment: true,
		});
		const [cmd] = buildReorderCommands([row], "main", "no stock");
		expect(cmd.updates.attachmentLink).toBe("");
		expect(cmd.updates.hasAttachment).toBe(false);
		expect(cmd.updates.noteHistory).toContain("Reorder Reason: no stock");
		expect(cmd.updates.noteHistory).toContain(
			"Previous link: https://example.com/old-link",
		);
	});

	it("keeps hasAttachment true when uploaded files remain after clearing the link", () => {
		const row = createMockRow({
			attachmentLink: "https://example.com/old-link",
			attachmentFilePaths: ["orders/row-uuid-1/invoice.pdf"],
			hasAttachment: true,
		});
		const [cmd] = buildReorderCommands([row], "call", "wrong part");
		expect(cmd.updates.attachmentLink).toBe("");
		expect(cmd.updates.hasAttachment).toBe(true);
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

	it("records the previous booking date as history when re-booking an archived row", () => {
		const row = createMockRow({ stage: "archive", bookingDate: "2025-06-01" });
		const [cmd] = buildBookingCommands([row], "archive", "2025-07-15", "note");
		// Hardcoded expected date: guards against timezone regressions where
		// "2025-06-01" would render as the previous day west of UTC.
		expect(cmd.updates.noteHistory).toContain(
			"Previous booking: Sun, Jun 1, 2025. #rebooking",
		);
		expect(cmd.updates.noteHistory).toContain("note #booking");
		expect(cmd.updates.bookingDate).toBe("2025-07-15");
	});

	it("does not add a 'Previous booking' line when the row has no previous bookingDate", () => {
		const row = createMockRow();
		const [cmd] = buildBookingCommands([row], "call", "2025-06-01", "note");
		const expected = appendTaggedUserNote(
			getEffectiveNoteHistory(row),
			"note",
			"booking",
		);
		expect(cmd.updates.noteHistory).toBe(expected);
		expect(cmd.updates.noteHistory).not.toContain("Previous booking");
	});

	it("skips the 'Previous booking' line when bookingDate is whitespace or unparseable", () => {
		for (const bad of [" ", "not-a-date"]) {
			const row = createMockRow({ stage: "archive", bookingDate: bad });
			const [cmd] = buildBookingCommands(
				[row],
				"archive",
				"2025-07-15",
				"note",
			);
			expect(cmd.updates.noteHistory).not.toContain("Previous booking");
		}
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
			"original\n[System]: Rescheduled from Sun, Jun 1, 2025 to Tue, Jul 1, 2025. new note",
		);
	});

	it("creates booking note from scratch when row has no previous bookingNote", () => {
		const row = createMockRow({
			bookingDate: "2025-06-01",
			bookingNote: undefined,
		});
		const [cmd] = buildRebookingCommands([row], "2025-07-01", "first note");
		expect(cmd.updates.bookingNote).toBe(
			"[System]: Rescheduled from Sun, Jun 1, 2025 to Tue, Jul 1, 2025. first note",
		);
	});

	it("appends a #rebooking tag to noteHistory", () => {
		const row = createMockRow({ bookingDate: "2025-06-01" });
		const [cmd] = buildRebookingCommands([row], "2025-07-01", "new note");
		const fullNote =
			"Rescheduled from Sun, Jun 1, 2025 to Tue, Jul 1, 2025. new note";
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

// ---------------------------------------------------------------------------
describe("buildUnfreezeCommands", () => {
	const createFrozenRow = (overrides: Partial<PendingRow> = {}): PendingRow =>
		createMockRow({
			stage: "freeze",
			status: "Arrived",
			bookingDate: "2025-06-01",
			bookingNote: "original booking note",
			bookingStatus: "Confirmed",
			attachmentLink: "https://example.com/link",
			attachmentFilePath: "freeze/row-uuid-1/invoice.pdf",
			attachmentFilePaths: ["freeze/row-uuid-1/invoice.pdf"],
			hasAttachment: true,
			noteHistory: "existing history",
			reminder: { date: "2025-08-01", time: "10:00", subject: "follow up" },
			previousStage: "main",
			freezeReason: "Awaiting customer approval",
			frozenAt: "2026-09-10T10:00:00.000Z",
			...overrides,
		});

	it("returns one patchRow per row from 'freeze' to the chosen destination", () => {
		const rows = [
			createFrozenRow({ id: "id-1" }),
			createFrozenRow({ id: "id-2" }),
		];
		for (const destination of [
			"orders",
			"main",
			"call",
			"booking",
			"archive",
		] as const) {
			const cmds = buildUnfreezeCommands(rows, destination);
			expect(cmds).toHaveLength(2);
			expect(cmds[0].type).toBe("patchRow");
			expect(cmds[0].sourceStage).toBe("freeze");
			expect(cmds[0].destinationStage).toBe(destination);
			expect(cmds[0].updates.stage).toBe(destination);
			expect(cmds[1].id).toBe("id-2");
		}
	});

	it("clears freeze metadata with null (merge-safe cleared representation)", () => {
		const [cmd] = buildUnfreezeCommands([createFrozenRow()], "main");
		expect(cmd.updates.previousStage).toBeNull();
		expect(cmd.updates.freezeReason).toBeNull();
		expect(cmd.updates.frozenAt).toBeNull();
	});

	it("preserves the freeze reason into the unfreeze history note with an #unfreeze tag", () => {
		const [cmd] = buildUnfreezeCommands([createFrozenRow()], "call");
		expect(cmd.updates.noteHistory).toContain("existing history");
		expect(cmd.updates.noteHistory).toContain(
			"Unfrozen to call. Freeze reason: Awaiting customer approval #unfreeze",
		);
	});

	it("still appends an #unfreeze note when the row has no freeze reason", () => {
		const [cmd] = buildUnfreezeCommands(
			[createFrozenRow({ freezeReason: undefined })],
			"main",
		);
		expect(cmd.updates.noteHistory).toContain("Unfrozen to main #unfreeze");
		expect(cmd.updates.noteHistory).not.toContain("Freeze reason:");
	});

	it("leaves status untouched", () => {
		const [cmd] = buildUnfreezeCommands([createFrozenRow()], "main");
		expect("status" in cmd.updates).toBe(false);
	});

	it("leaves booking date/note/status untouched", () => {
		const [cmd] = buildUnfreezeCommands([createFrozenRow()], "booking");
		expect("bookingDate" in cmd.updates).toBe(false);
		expect("bookingNote" in cmd.updates).toBe(false);
		expect("bookingStatus" in cmd.updates).toBe(false);
	});

	it("leaves attachment links/file paths untouched", () => {
		const [cmd] = buildUnfreezeCommands([createFrozenRow()], "main");
		expect("attachmentLink" in cmd.updates).toBe(false);
		expect("attachmentFilePath" in cmd.updates).toBe(false);
		expect("attachmentFilePaths" in cmd.updates).toBe(false);
		expect("hasAttachment" in cmd.updates).toBe(false);
	});

	it("leaves notes/reminders and archive fields untouched", () => {
		const [cmd] = buildUnfreezeCommands([createFrozenRow()], "archive");
		expect("reminder" in cmd.updates).toBe(false);
		expect("noteContent" in cmd.updates).toBe(false);
		expect("actionNote" in cmd.updates).toBe(false);
		expect("archiveReason" in cmd.updates).toBe(false);
		expect("archivedAt" in cmd.updates).toBe(false);
		// The only note field written is the appended history.
		expect(cmd.updates.noteHistory).toContain("existing history");
	});

	it("does not trigger destination-specific side effects", () => {
		const [toBooking] = buildUnfreezeCommands([createFrozenRow()], "booking");
		expect(toBooking.updates.status).toBeUndefined();
		expect(toBooking.updates.bookingDate).toBeUndefined();
		expect(toBooking.updates.bookingStatus).toBeUndefined();

		const [toOrders] = buildUnfreezeCommands([createFrozenRow()], "orders");
		expect(toOrders.updates.status).toBeUndefined();
		expect(toOrders.updates.attachmentLink).toBeUndefined();

		const [toArchive] = buildUnfreezeCommands([createFrozenRow()], "archive");
		expect(toArchive.updates.status).toBeUndefined();
		expect(toArchive.updates.archiveReason).toBeUndefined();
		expect(toArchive.updates.archivedAt).toBeUndefined();
	});

	it("uses empty previousValues", () => {
		const [cmd] = buildUnfreezeCommands([createFrozenRow()], "main");
		expect(cmd.previousValues).toEqual({});
	});

	it("returns empty array for empty input", () => {
		expect(buildUnfreezeCommands([], "main")).toEqual([]);
	});
});
