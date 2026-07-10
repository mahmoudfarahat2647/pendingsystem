import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateOrdersResult } from "@/services/mobileOrderService";
import { mobileOrderService } from "@/services/mobileOrderService";

// ── Supabase chain stubs ──────────────────────────────────────────────────────
// The service accepts a SupabaseClient directly, so we pass a minimal stub
// rather than mocking the module. Each table branch returns the correct chain:
//
//   "app_settings"  →  .select().eq().single()
//   "orders"        →  .insert([row]).select().single()
//
// mergeAppSettings is made a no-op by returning { data: null, error: { message: "mock" } }
// from the app_settings single().

const mockOrderSingle = vi.fn();

const mockAppSettingsSingle = vi.fn().mockResolvedValue({
	data: null,
	error: { message: "mock" },
});

// biome-ignore lint/suspicious/noExplicitAny: test stub must satisfy SupabaseClient shape
function makeSupabaseStub(): any {
	const insertChain = {
		select: vi.fn(() => ({
			single: mockOrderSingle,
		})),
	};

	return {
		from: vi.fn((table: string) => {
			if (table === "app_settings") {
				return {
					select: vi.fn(() => ({
						eq: vi.fn(() => ({
							single: mockAppSettingsSingle,
						})),
					})),
				};
			}
			// "orders" table
			return {
				insert: vi.fn(() => insertChain),
			};
		}),
	};
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
		// Default: app_settings returns error → mergeAppSettings is always a no-op.
		mockAppSettingsSingle.mockResolvedValue({
			data: null,
			error: { message: "mock" },
		});
	});

	// ── Test 1: empty-parts fallback ──────────────────────────────────────────
	it("inserts one blank row when parts is empty", async () => {
		mockOrderSingle.mockResolvedValueOnce({
			data: { id: "uuid-blank", stage: "orders" },
			error: null,
		});

		const supabase = makeSupabaseStub();

		const result: CreateOrdersResult = await mobileOrderService.createOrders(
			supabase,
			{ ...baseInput, parts: [] },
		);

		// Exactly one insert must have been made to the "orders" table.
		const ordersFrom = supabase.from.mock.calls.filter(
			(c: string[]) => c[0] === "orders",
		);
		expect(ordersFrom).toHaveLength(1);

		// Retrieve the row that was inserted.
		// biome-ignore lint/suspicious/noExplicitAny: accessing mock internals requires any cast
		const ordersBuilder = (supabase.from as any).mock.results.find(
			(_: unknown, i: number) =>
				// biome-ignore lint/suspicious/noExplicitAny: accessing mock internals requires any cast
				(supabase.from as any).mock.calls[i][0] === "orders",
		)?.value;
		// biome-ignore lint/suspicious/noExplicitAny: accessing mock internals requires any cast
		const insertedRow = (ordersBuilder.insert as any).mock.calls[0][0][0];

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
		mockOrderSingle
			.mockResolvedValueOnce({
				data: { id: "uuid-1", stage: "orders" },
				error: null,
			})
			.mockResolvedValueOnce({
				data: { id: "uuid-2", stage: "orders" },
				error: null,
			})
			.mockResolvedValueOnce({
				data: null,
				error: { message: "insert failed for part 3" },
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
	it("returns inserted equal to part count and empty errors on full success", async () => {
		const parts = [
			{ partNumber: "A1", description: "Brake pad" },
			{ partNumber: "B2", description: "Air filter" },
			{ partNumber: "C3", description: "Oil filter" },
		];

		for (let i = 0; i < parts.length; i++) {
			mockOrderSingle.mockResolvedValueOnce({
				data: { id: `uuid-${i}`, stage: "orders" },
				error: null,
			});
		}

		const supabase = makeSupabaseStub();

		const result: CreateOrdersResult = await mobileOrderService.createOrders(
			supabase,
			{ ...baseInput, parts },
		);

		// One "orders" from-call per part.
		const ordersFromCount = (
			supabase.from as ReturnType<typeof vi.fn>
		).mock.calls.filter((c: string[]) => c[0] === "orders").length;
		expect(ordersFromCount).toBe(parts.length);

		expect(result.inserted).toBe(parts.length);
	});

	// ── Test 4: network rejection handling ────────────────────────────────────
	it("collects errors when insert promise rejects (e.g. network failure)", async () => {
		mockOrderSingle.mockRejectedValueOnce(new Error("network failure"));

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
