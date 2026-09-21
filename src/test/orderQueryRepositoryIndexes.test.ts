import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOrderQueryRepository } from "@/services/order/orderQueryRepository";

// Issue #248 regression coverage: the part-number lookups keep their ILIKE
// exact-match query shape (served by orders_partnumber_trgm_idx; an upper()
// functional index is deferred since PostgREST can't address upper() from
// the client), so these
// tests lock the observable duplicate-detection / description-conflict
// behavior — case-insensitive exact match, exclude-id handling, guards —
// rather than performance.

type Row = {
	id: string;
	vin: string | null;
	stage: string | null;
	metadata: unknown;
};

function makeDb(rows: Row[] | null, error: unknown = null) {
	const ilike = vi.fn().mockReturnThis();
	const filter = vi.fn().mockReturnThis();
	const eq = vi.fn().mockReturnThis();
	const order = vi.fn().mockReturnThis();
	const range = vi.fn().mockResolvedValue({ data: rows, error });
	const chainable = {
		select: vi.fn().mockReturnThis(),
		eq,
		ilike,
		filter,
		order,
		range,
	};
	const from = vi.fn().mockReturnValue(chainable);
	return {
		db: { from } as unknown as Parameters<typeof createOrderQueryRepository>[0],
		eq,
		order,
		ilike,
		filter,
		range,
	};
}

describe("orderQueryRepository part-number indexes (#248) — behavior unchanged", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("checkHistoricalVinPartDuplicate", () => {
		it("matches case-insensitively on exact part number", async () => {
			const { db } = makeDb([
				{
					id: "row-1",
					vin: "VIN123456789",
					stage: "orders",
					metadata: { partNumber: "part-a" },
				},
			]);
			const repo = createOrderQueryRepository(db);

			const result = await repo.checkHistoricalVinPartDuplicate(
				"vin123456789",
				"  PART-A ",
			);

			expect(result.isDuplicate).toBe(true);
			expect(result.existingRow?.id).toBe("row-1");
			expect(result.location).toBe("orders");
		});

		it("does not flag near-miss part numbers (exact match, not prefix)", async () => {
			const { db } = makeDb([
				{
					id: "row-1",
					vin: "VIN123456789",
					stage: "orders",
					metadata: { partNumber: "PART-AB" },
				},
			]);
			const repo = createOrderQueryRepository(db);

			const result = await repo.checkHistoricalVinPartDuplicate(
				"VIN123456789",
				"PART-A",
			);

			expect(result.isDuplicate).toBe(false);
		});

		it("honors excludeIds as a single id and as an array", async () => {
			const rows: Row[] = [
				{
					id: "row-1",
					vin: "VIN123456789",
					stage: "orders",
					metadata: { partNumber: "PART-A" },
				},
				{
					id: "row-2",
					vin: "VIN123456789",
					stage: "main",
					metadata: { partNumber: "PART-A" },
				},
			];
			const repoSingle = createOrderQueryRepository(makeDb(rows).db);
			const single = await repoSingle.checkHistoricalVinPartDuplicate(
				"VIN123456789",
				"PART-A",
				"row-1",
			);
			expect(single.isDuplicate).toBe(true);
			expect(single.existingRow?.id).toBe("row-2");

			const repoBoth = createOrderQueryRepository(makeDb(rows).db);
			const both = await repoBoth.checkHistoricalVinPartDuplicate(
				"VIN123456789",
				"PART-A",
				["row-1", "row-2"],
			);
			expect(both.isDuplicate).toBe(false);
		});

		it("short-circuits short VINs and empty inputs without querying", async () => {
			const { db, range } = makeDb([
				{
					id: "row-1",
					vin: "VIN1",
					stage: "orders",
					metadata: { partNumber: "PART-A" },
				},
			]);
			const repo = createOrderQueryRepository(db);

			await expect(
				repo.checkHistoricalVinPartDuplicate("VIN1", "PART-A"),
			).resolves.toEqual({ isDuplicate: false });
			await expect(
				repo.checkHistoricalVinPartDuplicate("VIN123456789", ""),
			).resolves.toEqual({ isDuplicate: false });
			expect(range).not.toHaveBeenCalled();
		});

		it("keeps the ILIKE exact-match prefilter shape (trgm-served) with escaped literals", async () => {
			const { db, ilike, filter } = makeDb([]);
			const repo = createOrderQueryRepository(db);

			await repo.checkHistoricalVinPartDuplicate("VIN%12345_6", "PART_A%");

			expect(ilike).toHaveBeenCalledWith("vin", "VIN\\%12345\\_6");
			expect(filter).toHaveBeenCalledWith(
				"metadata->>partNumber",
				"ilike",
				"PART\\_A\\%",
			);
		});
	});

	describe("checkHistoricalDescriptionConflict", () => {
		it("flags same part with a different description", async () => {
			const { db } = makeDb([
				{
					id: "row-9",
					vin: "VIN123456789",
					stage: "main",
					metadata: { partNumber: "part-a", description: "Old pump" },
				},
			]);
			const repo = createOrderQueryRepository(db);

			const result = await repo.checkHistoricalDescriptionConflict(
				"PART-A",
				"New pump",
			);

			expect(result.hasConflict).toBe(true);
			expect(result.existingDescription).toBe("Old pump");
			expect(result.existingRow?.id).toBe("row-9");
		});

		it("does not flag the same description modulo case/whitespace", async () => {
			const { db } = makeDb([
				{
					id: "row-9",
					vin: "VIN123456789",
					stage: "main",
					metadata: { partNumber: "PART-A", description: "  Water Pump " },
				},
			]);
			const repo = createOrderQueryRepository(db);

			const result = await repo.checkHistoricalDescriptionConflict(
				"part-a",
				"WATER pump",
			);

			expect(result.hasConflict).toBe(false);
		});

		it("ignores other parts and the current row", async () => {
			const rows: Row[] = [
				{
					id: "row-current",
					vin: "VIN123456789",
					stage: "main",
					metadata: { partNumber: "PART-A", description: "Changed" },
				},
				{
					id: "row-other",
					vin: "VIN123456789",
					stage: "main",
					metadata: { partNumber: "PART-B", description: "Changed" },
				},
			];
			const repo = createOrderQueryRepository(makeDb(rows).db);

			const result = await repo.checkHistoricalDescriptionConflict(
				"PART-A",
				"Original",
				"row-current",
			);

			expect(result.hasConflict).toBe(false);
		});

		it("returns no conflict for empty inputs without querying", async () => {
			const { db, range } = makeDb([
				{
					id: "row-9",
					vin: "VIN123456789",
					stage: "main",
					metadata: { partNumber: "PART-A", description: "Other" },
				},
			]);
			const repo = createOrderQueryRepository(db);

			await expect(
				repo.checkHistoricalDescriptionConflict("", "desc"),
			).resolves.toEqual({ hasConflict: false });
			await expect(
				repo.checkHistoricalDescriptionConflict("PART-A", ""),
			).resolves.toEqual({ hasConflict: false });
			expect(range).not.toHaveBeenCalled();
		});

		it("keeps the ILIKE exact-match prefilter shape (trgm-served)", async () => {
			const { db, filter } = makeDb([]);
			const repo = createOrderQueryRepository(db);

			await repo.checkHistoricalDescriptionConflict("PART_A%", "desc");

			expect(filter).toHaveBeenCalledWith(
				"metadata->>partNumber",
				"ilike",
				"PART\\_A\\%",
			);
		});
	});

	describe("getOrders", () => {
		it("issues the stage + ordering shape served by the composite index", async () => {
			const { db, eq, order } = makeDb([]);
			const repo = createOrderQueryRepository(db);

			await repo.getOrders("orders");

			expect(eq).toHaveBeenCalledWith("stage", "orders");
			expect(order).toHaveBeenCalledWith("created_at", {
				ascending: false,
			});
			expect(order).toHaveBeenCalledWith("id", { ascending: true });
		});
	});
});
