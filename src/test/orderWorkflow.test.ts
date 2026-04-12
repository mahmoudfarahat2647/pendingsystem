import { describe, expect, it } from "vitest";
import {
	appendTaggedUserNote,
	BLANK_VIN_BUCKET,
	checkVinPartDuplicate,
	filterReservedRows,
	findSameOrderDuplicateIndices,
	findSameOrderDuplicates,
	formatVinForDisplay,
	getEffectiveNoteHistory,
	getNormalizedVinBuckets,
	getVinAutoMoveIds,
	getVinBucket,
	hasMixedVinSelection,
	isUuid,
	isVinComplete,
	isVinLongEnoughForDuplicateCheck,
	normalizeVin,
} from "@/lib/orderWorkflow";
import type { PartEntry, PendingRow } from "@/types";

const createMockRow = (overrides: Partial<PendingRow> = {}): PendingRow => ({
	id: "1",
	baseId: "B1",
	trackingId: "T1",
	customerName: "Test Customer",
	mobile: "123456789",
	parts: [],
	status: "Orders",
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
	vin: "VIN12345678901234",
	stage: "Orders",
	...overrides,
});

describe("normalizeVin", () => {
	it("should trim and uppercase VIN", () => {
		expect(normalizeVin("  vin123  ")).toBe("VIN123");
	});

	it("should return empty string for empty input", () => {
		expect(normalizeVin("")).toBe("");
	});

	it("should handle whitespace-only input", () => {
		expect(normalizeVin("   ")).toBe("");
	});

	it("should preserve already uppercase VIN", () => {
		expect(normalizeVin("VIN123")).toBe("VIN123");
	});

	it("should convert lowercase to uppercase", () => {
		expect(normalizeVin("abc123xyz")).toBe("ABC123XYZ");
	});
});

describe("isVinComplete", () => {
	it("should return true for 17-character VIN", () => {
		expect(isVinComplete("VIN12345678901234")).toBe(true);
	});

	it("should return true for VIN longer than 17 characters", () => {
		expect(isVinComplete("VIN123456789012345")).toBe(true);
	});

	it("should return false for VIN shorter than 17 characters", () => {
		expect(isVinComplete("VIN123")).toBe(false);
	});

	it("should return false for empty string", () => {
		expect(isVinComplete("")).toBe(false);
	});

	it("should handle null-like empty strings", () => {
		expect(isVinComplete("   ")).toBe(false);
	});
});

describe("isVinLongEnoughForDuplicateCheck", () => {
	it("should return true for VIN with 6+ characters", () => {
		expect(isVinLongEnoughForDuplicateCheck("VIN123")).toBe(true);
	});

	it("should return true for 17-character VIN", () => {
		expect(isVinLongEnoughForDuplicateCheck("VIN12345678901234")).toBe(true);
	});

	it("should return false for VIN with fewer than 6 characters", () => {
		expect(isVinLongEnoughForDuplicateCheck("VIN12")).toBe(false);
	});

	it("should return false for empty string", () => {
		expect(isVinLongEnoughForDuplicateCheck("")).toBe(false);
	});
});

describe("checkVinPartDuplicate", () => {
	const mockRows: PendingRow[] = [
		createMockRow({
			id: "1",
			vin: "VIN111",
			partNumber: "PART-A",
			stage: "Orders",
		}),
		createMockRow({
			id: "2",
			vin: "VIN222",
			partNumber: "PART-B",
			stage: "Main Sheet",
		}),
	];

	it("should return no duplicate for unique VIN + part combination", () => {
		const result = checkVinPartDuplicate("VIN333", "PART-C", mockRows);
		expect(result.isDuplicate).toBe(false);
	});

	it("should detect duplicate VIN + part combination", () => {
		const result = checkVinPartDuplicate("VIN111", "PART-A", mockRows);
		expect(result.isDuplicate).toBe(true);
		expect(result.existingRow).toBeDefined();
		expect(result.location).toBe("Orders");
	});

	it("should not flag current row as duplicate", () => {
		const result = checkVinPartDuplicate("VIN111", "PART-A", mockRows, "1");
		expect(result.isDuplicate).toBe(false);
	});

	it("should return no duplicate for short VIN", () => {
		const result = checkVinPartDuplicate("VIN1", "PART-A", mockRows);
		expect(result.isDuplicate).toBe(false);
	});

	it("should return no duplicate for empty part number", () => {
		const result = checkVinPartDuplicate("VIN111", "", mockRows);
		expect(result.isDuplicate).toBe(false);
	});

	it("should be case insensitive for VIN and part number", () => {
		const result = checkVinPartDuplicate("vin111", "part-a", mockRows);
		expect(result.isDuplicate).toBe(true);
	});
});

describe("findSameOrderDuplicates", () => {
	it("should return empty array for no duplicates", () => {
		const parts: PartEntry[] = [
			{ id: "1", partNumber: "PART-A", description: "Desc A" },
			{ id: "2", partNumber: "PART-B", description: "Desc B" },
		];
		expect(findSameOrderDuplicates(parts)).toEqual([]);
	});

	it("should return duplicate parts", () => {
		const partA = { id: "1", partNumber: "PART-A", description: "Desc A" };
		const partB = { id: "2", partNumber: "PART-A", description: "Desc A" };
		const parts: PartEntry[] = [partA, partB];
		const result = findSameOrderDuplicates(parts);
		expect(result).toHaveLength(2);
		expect(result[1].id).toBe("2");
		expect(result[0].id).toBe("1");
	});

	it("should handle multiple duplicates of same part", () => {
		const partA = { id: "1", partNumber: "PART-A", description: "Desc A" };
		const partB = { id: "2", partNumber: "PART-A", description: "Desc A" };
		const partC = { id: "3", partNumber: "PART-A", description: "Desc A" };
		const parts: PartEntry[] = [partA, partB, partC];
		const result = findSameOrderDuplicates(parts);
		expect(result).toHaveLength(3);
	});

	it("should be case insensitive", () => {
		const parts: PartEntry[] = [
			{ id: "1", partNumber: "PART-A", description: "Desc A" },
			{ id: "2", partNumber: "part-a", description: "Desc A" },
		];
		expect(findSameOrderDuplicates(parts)).toHaveLength(2);
	});

	it("should skip empty part numbers", () => {
		const parts: PartEntry[] = [
			{ id: "1", partNumber: "", description: "Desc A" },
			{ id: "2", partNumber: "", description: "Desc B" },
		];
		expect(findSameOrderDuplicates(parts)).toEqual([]);
	});

	it("should handle whitespace in part numbers", () => {
		const parts: PartEntry[] = [
			{ id: "1", partNumber: "  PART-A  ", description: "Desc A" },
			{ id: "2", partNumber: "PART-A", description: "Desc A" },
		];
		expect(findSameOrderDuplicates(parts)).toHaveLength(2);
	});
});

describe("findSameOrderDuplicateIndices", () => {
	it("should return empty array for no duplicates", () => {
		const parts: PartEntry[] = [
			{ id: "1", partNumber: "PART-A", description: "Desc A" },
			{ id: "2", partNumber: "PART-B", description: "Desc B" },
		];
		expect(findSameOrderDuplicateIndices(parts)).toEqual([]);
	});

	it("should return indices of duplicate parts", () => {
		const parts: PartEntry[] = [
			{ id: "1", partNumber: "PART-A", description: "Desc A" },
			{ id: "2", partNumber: "PART-B", description: "Desc B" },
			{ id: "3", partNumber: "PART-A", description: "Desc A" },
		];
		const result = findSameOrderDuplicateIndices(parts);
		expect(result).toEqual([0, 2]);
	});

	it("should return all duplicate indices for repeated parts", () => {
		const parts: PartEntry[] = [
			{ id: "1", partNumber: "PART-A", description: "Desc A" },
			{ id: "2", partNumber: "PART-A", description: "Desc A" },
			{ id: "3", partNumber: "PART-A", description: "Desc A" },
		];
		const result = findSameOrderDuplicateIndices(parts);
		expect(result).toEqual([0, 1, 2]);
	});

	it("should be case insensitive", () => {
		const parts: PartEntry[] = [
			{ id: "1", partNumber: "PART-A", description: "Desc A" },
			{ id: "2", partNumber: "part-a", description: "Desc A" },
		];
		expect(findSameOrderDuplicateIndices(parts)).toEqual([0, 1]);
	});

	it("should skip empty part numbers", () => {
		const parts: PartEntry[] = [
			{ id: "1", partNumber: "", description: "Desc A" },
			{ id: "2", partNumber: "", description: "Desc B" },
		];
		expect(findSameOrderDuplicateIndices(parts)).toEqual([]);
	});
});

describe("getVinBucket", () => {
	it("should return BLANK_VIN_BUCKET for empty string", () => {
		expect(getVinBucket("")).toBe(BLANK_VIN_BUCKET);
	});

	it("should return BLANK_VIN_BUCKET for null", () => {
		expect(getVinBucket(null)).toBe(BLANK_VIN_BUCKET);
	});

	it("should return BLANK_VIN_BUCKET for undefined", () => {
		expect(getVinBucket(undefined)).toBe(BLANK_VIN_BUCKET);
	});

	it("should return normalized uppercase VIN for valid VINs", () => {
		expect(getVinBucket("vin123")).toBe("VIN123");
		expect(getVinBucket("VIN12345678901234")).toBe("VIN12345678901234");
	});

	it("should trim whitespace", () => {
		expect(getVinBucket("  vin123  ")).toBe("VIN123");
		expect(getVinBucket("  ")).toBe(BLANK_VIN_BUCKET);
	});
});

describe("getNormalizedVinBuckets", () => {
	const rows = [
		createMockRow({ id: "1", vin: "VIN111" }),
		createMockRow({ id: "2", vin: "VIN111" }),
		createMockRow({ id: "3", vin: "VIN222" }),
		createMockRow({ id: "4", vin: "" }),
		createMockRow({ id: "5", vin: null as unknown as string }),
		createMockRow({ id: "6", vin: undefined as unknown as string }),
	];

	it("should return single bucket for all same VINs", () => {
		const sameVinRows = [
			createMockRow({ id: "1", vin: "VIN111" }),
			createMockRow({ id: "2", vin: "VIN111" }),
		];
		const buckets = getNormalizedVinBuckets(sameVinRows);
		expect(buckets.size).toBe(1);
		expect(buckets.get("VIN111")).toHaveLength(2);
	});

	it("should return multiple buckets for different VINs", () => {
		const differentVinRows = [
			createMockRow({ id: "1", vin: "VIN111" }),
			createMockRow({ id: "2", vin: "VIN222" }),
		];
		const buckets = getNormalizedVinBuckets(differentVinRows);
		expect(buckets.size).toBe(2);
	});

	it("should treat blank VIN as its own bucket", () => {
		const buckets = getNormalizedVinBuckets(rows);
		expect(buckets.has(BLANK_VIN_BUCKET)).toBe(true);
		const blankBucket = buckets.get(BLANK_VIN_BUCKET);
		expect(blankBucket).toHaveLength(3);
	});

	it("should handle mixed blank and non-blank VINs", () => {
		const mixedRows = [
			createMockRow({ id: "1", vin: "VIN111" }),
			createMockRow({ id: "2", vin: "" }),
			createMockRow({ id: "3", vin: "VIN222" }),
		];
		const buckets = getNormalizedVinBuckets(mixedRows);
		expect(buckets.size).toBe(3);
	});
});

describe("hasMixedVinSelection", () => {
	it("should return false for empty selection", () => {
		expect(hasMixedVinSelection([])).toBe(false);
	});

	it("should return false for single row", () => {
		const rows = [createMockRow({ id: "1", vin: "VIN111" })];
		expect(hasMixedVinSelection(rows)).toBe(false);
	});

	it("should return false for multiple rows with same VIN", () => {
		const rows = [
			createMockRow({ id: "1", vin: "VIN111" }),
			createMockRow({ id: "2", vin: "VIN111" }),
		];
		expect(hasMixedVinSelection(rows)).toBe(false);
	});

	it("should return true for multiple rows with different VINs", () => {
		const rows = [
			createMockRow({ id: "1", vin: "VIN111" }),
			createMockRow({ id: "2", vin: "VIN222" }),
		];
		expect(hasMixedVinSelection(rows)).toBe(true);
	});

	it("should return true when mixing blank and non-blank VINs", () => {
		const rows = [
			createMockRow({ id: "1", vin: "VIN111" }),
			createMockRow({ id: "2", vin: "" }),
		];
		expect(hasMixedVinSelection(rows)).toBe(true);
	});

	it("should be case insensitive when comparing VINs", () => {
		const rows = [
			createMockRow({ id: "1", vin: "vin111" }),
			createMockRow({ id: "2", vin: "VIN111" }),
		];
		expect(hasMixedVinSelection(rows)).toBe(false);
	});
});

describe("getVinAutoMoveIds", () => {
	it("returns all VIN ids when the last outstanding part becomes Arrived", () => {
		const rows = [
			createMockRow({
				id: "1",
				stage: "main",
				vin: "VIN111",
				partStatus: "Not Arrived",
			}),
			createMockRow({
				id: "2",
				stage: "main",
				vin: "VIN111",
				partStatus: "Arrived",
			}),
		];

		expect(
			getVinAutoMoveIds({
				stage: "main",
				stageRows: rows,
				editedRowId: "1",
				editedVin: "VIN111",
				nextPartStatus: "Arrived",
			}),
		).toEqual(["1", "2"]);
	});

	it("returns an empty array when another part for the VIN is still not arrived", () => {
		const rows = [
			createMockRow({
				id: "1",
				stage: "orders",
				vin: "VIN111",
				partStatus: "Not Arrived",
			}),
			createMockRow({
				id: "2",
				stage: "orders",
				vin: "VIN111",
				partStatus: "Backordered",
			}),
		];

		expect(
			getVinAutoMoveIds({
				stage: "orders",
				stageRows: rows,
				editedRowId: "1",
				editedVin: "VIN111",
				nextPartStatus: "Arrived",
			}),
		).toEqual([]);
	});

	it("normalizes stage, VIN, and status before evaluating auto-move eligibility", () => {
		const rows = [
			createMockRow({
				id: "1",
				stage: " main ",
				vin: " vin111 ",
				partStatus: "not arrived",
			}),
			createMockRow({
				id: "2",
				stage: "MAIN",
				vin: "VIN111",
				partStatus: " arrived ",
			}),
		];

		expect(
			getVinAutoMoveIds({
				stage: " Main Sheet ",
				stageRows: rows,
				editedRowId: "1",
				editedVin: " vin111 ",
				nextPartStatus: " arrived ",
			}),
		).toEqual(["1", "2"]);
	});

	it("returns an empty array for blank VINs", () => {
		const rows = [
			createMockRow({
				id: "1",
				stage: "main",
				vin: "",
				partStatus: "Arrived",
			}),
		];

		expect(
			getVinAutoMoveIds({
				stage: "main",
				stageRows: rows,
				editedRowId: "1",
				editedVin: "   ",
				nextPartStatus: "Arrived",
			}),
		).toEqual([]);
	});

	it("returns an empty array when the new status is not Arrived", () => {
		const rows = [
			createMockRow({
				id: "1",
				stage: "main",
				vin: "VIN111",
				partStatus: "Not Arrived",
			}),
		];

		expect(
			getVinAutoMoveIds({
				stage: "main",
				stageRows: rows,
				editedRowId: "1",
				editedVin: "VIN111",
				nextPartStatus: "Backordered",
			}),
		).toEqual([]);
	});

	it("returns an empty array for non-eligible stages", () => {
		const rows = [
			createMockRow({
				id: "1",
				stage: "booking",
				vin: "VIN111",
				partStatus: "Arrived",
			}),
		];

		expect(
			getVinAutoMoveIds({
				stage: "booking",
				stageRows: rows,
				editedRowId: "1",
				editedVin: "VIN111",
				nextPartStatus: "Arrived",
			}),
		).toEqual([]);
	});

	it("ignores rows from other stages even if they share the VIN", () => {
		const rows = [
			createMockRow({
				id: "1",
				stage: "orders",
				vin: "VIN111",
				partStatus: "Not Arrived",
			}),
			createMockRow({
				id: "2",
				stage: "orders",
				vin: "VIN111",
				partStatus: "Arrived",
			}),
			createMockRow({
				id: "3",
				stage: "call",
				vin: "VIN111",
				partStatus: "Not Arrived",
			}),
		];

		expect(
			getVinAutoMoveIds({
				stage: "orders",
				stageRows: rows,
				editedRowId: "1",
				editedVin: "VIN111",
				nextPartStatus: "Arrived",
			}),
		).toEqual(["1", "2"]);
	});

	it("returns the single row id when a VIN has exactly one part and it is Arrived", () => {
		const rows = [
			createMockRow({
				id: "1",
				stage: "main",
				vin: "VIN111",
				partStatus: "Not Arrived",
			}),
		];

		expect(
			getVinAutoMoveIds({
				stage: "main",
				stageRows: rows,
				editedRowId: "1",
				editedVin: "VIN111",
				nextPartStatus: "Arrived",
			}),
		).toEqual(["1"]);
	});
});

describe("formatVinForDisplay", () => {
	it('should return "(blank VIN)" for empty string', () => {
		expect(formatVinForDisplay("")).toBe("(blank VIN)");
	});

	it('should return "(blank VIN)" for null', () => {
		expect(formatVinForDisplay(null)).toBe("(blank VIN)");
	});

	it('should return "(blank VIN)" for undefined', () => {
		expect(formatVinForDisplay(undefined)).toBe("(blank VIN)");
	});

	it("should return normalized VIN for valid input", () => {
		expect(formatVinForDisplay("  vin123  ")).toBe("VIN123");
		expect(formatVinForDisplay("VIN12345678901234")).toBe("VIN12345678901234");
	});

	it("should handle whitespace-only input", () => {
		expect(formatVinForDisplay("   ")).toBe("(blank VIN)");
	});
});

describe("isUuid", () => {
	it("should return true for a valid UUID v4", () => {
		expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
		expect(isUuid("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(true);
	});

	it("should return true for valid UUID v4 in uppercase", () => {
		expect(isUuid("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
	});

	it("should return false for an empty string", () => {
		expect(isUuid("")).toBe(false);
	});

	it("should return false for invalid format (missing hyphens)", () => {
		expect(isUuid("550e8400e29b41d4a716446655440000")).toBe(false);
	});

	it("should return false for incorrect length", () => {
		expect(isUuid("550e8400-e29b-41d4-a716-44665544000")).toBe(false);
		expect(isUuid("550e8400-e29b-41d4-a716-4466554400000")).toBe(false);
	});

	it("should return false for non-v4 UUID (v1)", () => {
		expect(isUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(false);
	});

	it("should return false for invalid characters outside [0-9a-f]", () => {
		expect(isUuid("550e8400-g29b-41d4-a716-446655440000")).toBe(false);
	});
});

describe("appendTaggedUserNote", () => {
	it("should return the tagged note if existing string is undefined", () => {
		expect(appendTaggedUserNote(undefined, "new note", "archive")).toBe(
			"new note #archive",
		);
	});

	it("should return the tagged note if existing string is empty", () => {
		expect(appendTaggedUserNote("", "new note", "archive")).toBe(
			"new note #archive",
		);
	});

	it("should append the tagged note to existing string with a newline", () => {
		expect(appendTaggedUserNote("old note", "new note", "archive")).toBe(
			"old note\nnew note #archive",
		);
	});

	it("should trim the new note before appending", () => {
		expect(appendTaggedUserNote("old note", "  new note  ", "archive")).toBe(
			"old note\nnew note #archive",
		);
	});

	it("should return existing string if new note is empty", () => {
		expect(appendTaggedUserNote("old note", "", "archive")).toBe("old note");
	});

	it("should return existing string if new note is only whitespace", () => {
		expect(appendTaggedUserNote("old note", "   ", "archive")).toBe("old note");
	});

	it("should return empty string if existing is undefined and new note is empty", () => {
		expect(appendTaggedUserNote(undefined, "", "archive")).toBe("");
	});
});

describe("getEffectiveNoteHistory", () => {
	it("should return noteHistory if it exists and is non-empty", () => {
		const row = createMockRow({
			noteHistory: "existing history",
			actionNote: "ignored",
		});
		expect(getEffectiveNoteHistory(row)).toBe("existing history");
	});

	it("should fall back to actionNote if noteHistory is absent", () => {
		const row = createMockRow({ actionNote: "legacy action note" });
		expect(getEffectiveNoteHistory(row)).toBe("legacy action note");
	});

	it("should fall back to noteContent if noteHistory and actionNote are absent", () => {
		const row = createMockRow({ noteContent: "legacy note content" });
		expect(getEffectiveNoteHistory(row)).toBe("legacy note content");
	});

	it("should combine multiple legacy fields", () => {
		const row = createMockRow({
			noteContent: "content",
			actionNote: "action",
			bookingNote: "booking",
			archiveReason: "reason",
		});
		expect(getEffectiveNoteHistory(row)).toBe(
			"content\naction\nbooking\nreason #archive",
		);
	});

	it("should return empty string when all legacy fields are absent", () => {
		const row = createMockRow();
		expect(getEffectiveNoteHistory(row)).toBe("");
	});

	it("should deduplicate archiveReason if it matches actionNote exactly with tag", () => {
		const row = createMockRow({
			actionNote: "Damaged screen #archive",
			archiveReason: "Damaged screen",
		});
		// Should NOT append "Damaged screen #archive" again
		expect(getEffectiveNoteHistory(row)).toBe("Damaged screen #archive");
	});

	it("should deduplicate bookingNote if it matches actionNote exactly with tag", () => {
		const row = createMockRow({
			actionNote: "Customer requested Monday #booking",
			bookingNote: "Customer requested Monday",
		});
		// Should NOT append "Customer requested Monday" again
		expect(getEffectiveNoteHistory(row)).toBe(
			"Customer requested Monday #booking",
		);
	});

	it("should be case-insensitive and trim-tolerant for deduplication", () => {
		const row = createMockRow({
			actionNote: " DAMAGED SCREEN #archive ",
			archiveReason: "damaged screen",
		});
		expect(getEffectiveNoteHistory(row)).toBe("DAMAGED SCREEN #archive");
	});

	it("should NOT deduplicate if meanings differ", () => {
		const row = createMockRow({
			actionNote: "Old reason #archive",
			archiveReason: "New reason",
		});
		expect(getEffectiveNoteHistory(row)).toBe(
			"Old reason #archive\nNew reason #archive",
		);
	});

	it("should treat noteHistory: '' as authoritative and not fall back to actionNote", () => {
		// Regression: noteHistory:"" must mean "intentionally cleared", not "absent"
		const row = createMockRow({ noteHistory: "", actionNote: "stale note" });
		expect(getEffectiveNoteHistory(row)).toBe("");
	});

	it("should fall back to legacy fields when noteHistory is absent (undefined)", () => {
		// Regression: the migration path must still work for pre-migration rows
		const row = createMockRow({ actionNote: "legacy note" });
		// noteHistory is not set by createMockRow, so it is undefined → should fall back
		expect(getEffectiveNoteHistory(row)).toBe("legacy note");
	});
});

describe("filterReservedRows", () => {
	const defaultPartStatuses = [
		{ id: "reserve", label: "Reserve" },
		{ id: "arrived", label: "Arrived" },
		{ id: "not_arrived", label: "Not Arrived" },
	];

	it("returns only rows whose partStatus matches the reserve label", () => {
		const reservedRow = createMockRow({ id: "1", partStatus: "Reserve" });
		const otherRow = createMockRow({ id: "2", partStatus: "Arrived" });
		const result = filterReservedRows(
			[reservedRow, otherRow],
			defaultPartStatuses,
		);
		expect(result).toEqual([reservedRow]);
	});

	it("matches when the reserve label was renamed (id stays 'reserve')", () => {
		const renamedStatuses = [
			{ id: "reserve", label: "Reserved" },
			{ id: "arrived", label: "Arrived" },
		];
		const reservedRow = createMockRow({ id: "1", partStatus: "Reserved" });
		const otherRow = createMockRow({ id: "2", partStatus: "Reserve" });
		const result = filterReservedRows([reservedRow, otherRow], renamedStatuses);
		expect(result).toEqual([reservedRow]);
	});

	it("is case-insensitive and trim-tolerant", () => {
		const row = createMockRow({ id: "1", partStatus: "  reserve  " });
		const result = filterReservedRows([row], defaultPartStatuses);
		expect(result).toEqual([row]);
	});

	it("ignores rows with non-reserve statuses in a mixed selection", () => {
		const rows = [
			createMockRow({ id: "1", partStatus: "Reserve" }),
			createMockRow({ id: "2", partStatus: "Arrived" }),
			createMockRow({ id: "3", partStatus: "Not Arrived" }),
			createMockRow({ id: "4", partStatus: "Reserve" }),
		];
		const result = filterReservedRows(rows, defaultPartStatuses);
		expect(result.map((r) => r.id)).toEqual(["1", "4"]);
	});

	it("returns an empty array when no selected rows qualify", () => {
		const rows = [
			createMockRow({ id: "1", partStatus: "Arrived" }),
			createMockRow({ id: "2", partStatus: "Not Arrived" }),
		];
		expect(filterReservedRows(rows, defaultPartStatuses)).toEqual([]);
	});

	it("returns an empty array when the reserve status definition is absent", () => {
		const noReserveStatuses = [{ id: "arrived", label: "Arrived" }];
		const row = createMockRow({ id: "1", partStatus: "Arrived" });
		expect(filterReservedRows([row], noReserveStatuses)).toEqual([]);
	});

	it("returns an empty array for an empty row list", () => {
		expect(filterReservedRows([], defaultPartStatuses)).toEqual([]);
	});
});
