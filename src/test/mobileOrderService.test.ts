import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateOrdersResult } from "@/services/mobileOrderService";
import { mobileOrderService } from "@/services/mobileOrderService";

// ── Supabase RPC stub ─────────────────────────────────────────────────────────
// createOrders now issues a single `supabase.rpc("insert_orders_bulk", { p_rows })`
// call (MAH-43) instead of N per-row `.insert().select().single()` calls. The
// RPC returns one row per input row: { idx, success, error_message }.

const mockRpc = vi.fn();

// biome-ignore lint/suspicious/noExplicitAny: test stub must satisfy SupabaseClient shape
function makeSupabaseStub(): any {
	return { rpc: mockRpc };
}

function rpcRow(
	idx: number,
	success: boolean,
	error_message: string | null = null,
) {
	return { idx, success, error_message };
}

// ── Shared base input ─────────────────────────────────────────────────────────
const baseInput = {
	customerName: "Test Customer",
	company: "Renault",
	vin: "VIN001",
	mobile: "0500000001",
	sabNumber: "SAB001",
	model: "Megane IV",
	repairSystem: "Mechanical",
};

describe("mobileOrderService.createOrders", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ── Test 1: empty-parts fallback ──────────────────────────────────────────
	it("inserts one blank row when parts is empty", async () => {
		mockRpc.mockResolvedValueOnce({
			data: [rpcRow(0, true)],
			error: null,
		});

		const supabase = makeSupabaseStub();

		const result: CreateOrdersResult = await mobileOrderService.createOrders(
			supabase,
			{ ...baseInput, parts: [] },
		);

		expect(mockRpc).toHaveBeenCalledTimes(1);
		expect(mockRpc).toHaveBeenCalledWith(
			"insert_orders_bulk",
			expect.objectContaining({
				p_rows: expect.arrayContaining([
					expect.objectContaining({
						metadata: expect.objectContaining({
							partNumber: "",
							description: "",
						}),
					}),
				]),
			}),
		);

		const insertedRow = mockRpc.mock.calls[0][1].p_rows[0];
		expect(insertedRow.metadata.partNumber).toBe("");
		expect(insertedRow.metadata.description).toBe("");
		expect(insertedRow.metadata.stage).toBeUndefined(); // MAH-26

		// Result shape.
		expect(result.inserted).toBe(1);
		expect(result.errors).toHaveLength(0);
	});

	// ── Test 2: partial failure counting ─────────────────────────────────────
	it("counts only successful inserts and collects errors on partial failure", async () => {
		// 3 parts: first two succeed, third fails.
		mockRpc.mockResolvedValueOnce({
			data: [
				rpcRow(0, true),
				rpcRow(1, true),
				rpcRow(2, false, "insert failed for part 3"),
			],
			error: null,
		});

		const supabase = makeSupabaseStub();

		const result: CreateOrdersResult = await mobileOrderService.createOrders(
			supabase,
			{
				...baseInput,
				parts: [
					{ partNumber: "P1", description: "Part 1" },
					{ partNumber: "P2", description: "Part 2" },
					{ partNumber: "P3", description: "Part 3" },
				],
			},
		);

		expect(result.inserted).toBe(2);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toBe("insert failed for part 3");
	});

	// ── Test 3: full success with parts ───────────────────────────────────────
	it("sends all parts in a single bulk RPC call and reports full success", async () => {
		const parts = [
			{ partNumber: "A1", description: "Brake pad" },
			{ partNumber: "B2", description: "Air filter" },
			{ partNumber: "C3", description: "Oil filter" },
		];

		mockRpc.mockResolvedValueOnce({
			data: parts.map((_, i) => rpcRow(i, true)),
			error: null,
		});

		const supabase = makeSupabaseStub();

		const result: CreateOrdersResult = await mobileOrderService.createOrders(
			supabase,
			{ ...baseInput, parts },
		);

		// Exactly one RPC round trip carrying all rows.
		expect(mockRpc).toHaveBeenCalledTimes(1);
		expect(mockRpc.mock.calls[0][1].p_rows).toHaveLength(parts.length);

		expect(result.inserted).toBe(parts.length);
		expect(result.errors).toHaveLength(0);
	});

	// ── Test 4: RPC-level error (e.g. connection failure) ─────────────────────
	it("collects a shared error per row when the RPC call itself errors", async () => {
		mockRpc.mockResolvedValueOnce({
			data: null,
			error: { message: "connection reset" },
		});

		const supabase = makeSupabaseStub();
		const result: CreateOrdersResult = await mobileOrderService.createOrders(
			supabase,
			{ ...baseInput, parts: [{ partNumber: "P1", description: "Part 1" }] },
		);

		expect(result.inserted).toBe(0);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toBe("connection reset");
	});

	// ── Test 5: network rejection handling ────────────────────────────────────
	it("collects errors when the RPC call promise rejects (e.g. network failure)", async () => {
		mockRpc.mockRejectedValueOnce(new Error("network failure"));

		const supabase = makeSupabaseStub();
		const result: CreateOrdersResult = await mobileOrderService.createOrders(
			supabase,
			{ ...baseInput, parts: [{ partNumber: "P1", description: "Part 1" }] },
		);

		expect(result.inserted).toBe(0);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toBe("network failure");
	});
});
