import { beforeEach, describe, expect, it, vi } from "vitest";

// We test the handler logic by mocking the Supabase RPC calls (rate limiting
// and the bulk insert) rather than the old per-row insert() chain — the
// service now issues a single `insert_orders_bulk` RPC call instead of N
// separate `.insert().select().single()` calls (MAH-43).

// biome-ignore lint/suspicious/noExplicitAny: test mock needs a flexible shape for multiple RPC responses
let rateLimitResponse: any = { data: false, error: null };
// biome-ignore lint/suspicious/noExplicitAny: null means "auto-generate an all-success response from p_rows"
let bulkInsertResponse: any = null;

const mockRpc = vi.fn((fn: string, args?: Record<string, unknown>) => {
	if (fn === "check_rate_limit") {
		return Promise.resolve(rateLimitResponse);
	}
	if (fn === "insert_orders_bulk") {
		if (bulkInsertResponse) return Promise.resolve(bulkInsertResponse);
		const rows = (args?.p_rows ?? []) as unknown[];
		return Promise.resolve({
			data: rows.map((_, i) => ({
				idx: i,
				success: true,
				error_message: null,
			})),
			error: null,
		});
	}
	// prune_rate_limits and any other fire-and-forget RPCs
	return Promise.resolve({ data: null, error: null });
});

// biome-ignore lint/suspicious/noExplicitAny: test mock needs flexible return type for multi-table mocking
const mockFrom = vi.fn((_table: string): any => ({
	select: vi.fn().mockReturnThis(),
	eq: vi.fn().mockReturnThis(),
	single: vi.fn().mockResolvedValue({ data: null, error: { message: "mock" } }),
}));

vi.mock("@supabase/supabase-js", () => ({
	createClient: vi.fn(() => ({
		from: mockFrom,
		rpc: mockRpc,
	})),
}));

// Import after mocks
const { POST } = await import("@/app/api/mobile-order/route");
const { RATE_LIMIT_MAX } = await import("@/app/api/mobile-order/rateLimiter");

function makeRequest(body: unknown) {
	return new Request("http://localhost/api/mobile-order", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

function getBulkInsertRows() {
	const call = mockRpc.mock.calls.find((c) => c[0] === "insert_orders_bulk");
	// biome-ignore lint/suspicious/noExplicitAny: reading test mock call args
	return (call?.[1] as any)?.p_rows as Array<Record<string, unknown>>;
}

describe("POST /api/mobile-order", () => {
	beforeEach(() => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
		process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
		vi.clearAllMocks();
		rateLimitResponse = { data: false, error: null };
		bulkInsertResponse = null;
	});

	it("returns 400 when company is missing", async () => {
		const req = makeRequest({ parts: [] });
		const res = await POST(req as never);
		expect(res.status).toBe(400);
	});

	it("inserts one row when parts is empty (blank order)", async () => {
		const req = makeRequest({ company: "Zeekr", parts: [] });
		const res = await POST(req as never);
		expect(res.status).toBe(200);
		expect(mockRpc).toHaveBeenCalledWith(
			"insert_orders_bulk",
			expect.anything(),
		);
		const rows = getBulkInsertRows();
		expect(rows).toHaveLength(1);
		expect(rows[0].stage).toBe("orders");
		// biome-ignore lint/suspicious/noExplicitAny: reading test row shape
		expect((rows[0].metadata as any).requester).toBe("mobile");
		// biome-ignore lint/suspicious/noExplicitAny: reading test row shape
		expect((rows[0].metadata as any).status).toBe("Pending");
	});

	it("sends N rows in a single bulk insert call for N valid parts", async () => {
		const req = makeRequest({
			company: "Renault",
			parts: [
				{ partNumber: "A1", description: "Part A" },
				{ partNumber: "B2", description: "Part B" },
			],
		});
		const res = await POST(req as never);
		expect(res.status).toBe(200);
		// Exactly one RPC call for the bulk insert, carrying both rows.
		const bulkCalls = mockRpc.mock.calls.filter(
			(c) => c[0] === "insert_orders_bulk",
		);
		expect(bulkCalls).toHaveLength(1);
		expect(getBulkInsertRows()).toHaveLength(2);
	});

	it("forces requester to 'mobile' regardless of payload", async () => {
		const req = makeRequest({
			company: "Zeekr",
			parts: [{ partNumber: "X", description: "Y" }],
		});
		await POST(req as never);
		const rows = getBulkInsertRows();
		// biome-ignore lint/suspicious/noExplicitAny: reading test row shape
		expect((rows[0].metadata as any).requester).toBe("mobile");
	});

	it("sets rDate to today if not provided", async () => {
		const req = makeRequest({ company: "Zeekr", parts: [] });
		await POST(req as never);
		const rows = getBulkInsertRows();
		// biome-ignore lint/suspicious/noExplicitAny: reading test row shape
		const rDate = (rows[0].metadata as any).rDate;
		expect(typeof rDate).toBe("string");
		expect(rDate.length).toBeGreaterThan(0);
	});

	it("copies shared identity data onto every row", async () => {
		const req = makeRequest({
			company: "Renault",
			customerName: "Alice",
			vin: "VIN123",
			mobile: "0500000001",
			parts: [
				{ partNumber: "A", description: "desc A" },
				{ partNumber: "B", description: "desc B" },
			],
		});
		await POST(req as never);
		const rows = getBulkInsertRows();
		for (const row of rows) {
			expect(row.customer_name).toBe("Alice");
			expect(row.vin).toBe("VIN123");
			expect(row.customer_phone).toBe("0500000001");
		}
	});

	it("reports partial success when some rows fail server-side", async () => {
		bulkInsertResponse = {
			data: [
				{ idx: 0, success: true, error_message: null },
				{ idx: 1, success: false, error_message: "duplicate key" },
			],
			error: null,
		};
		const req = makeRequest({
			company: "Renault",
			parts: [
				{ partNumber: "A1", description: "Part A" },
				{ partNumber: "B2", description: "Part B" },
			],
		});
		const res = await POST(req as never);
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.inserted).toBe(1);
	});

	it("returns 500 when every row in the bulk insert fails", async () => {
		bulkInsertResponse = {
			data: [{ idx: 0, success: false, error_message: "insert failed" }],
			error: null,
		};
		const req = makeRequest({
			company: "Zeekr",
			parts: [{ partNumber: "A1", description: "Part A" }],
		});
		const res = await POST(req as never);
		expect(res.status).toBe(500);
	});
});

describe("POST /api/mobile-order — app_settings", () => {
	beforeEach(() => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
		process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
		vi.clearAllMocks();
		rateLimitResponse = { data: false, error: null };
		bulkInsertResponse = null;
	});

	it("never reads or writes app_settings for a valid request with a new model", async () => {
		const req = makeRequest({
			company: "Zeekr",
			model: "BrandNewModel",
			repairSystem: "BrandNewSystem",
			parts: [],
		});
		const res = await POST(req as never);
		expect(res.status).toBe(200);
		expect(mockFrom).not.toHaveBeenCalledWith("app_settings");
	});
});

describe("POST /api/mobile-order — payload bounds", () => {
	beforeEach(() => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
		process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
		vi.clearAllMocks();
		rateLimitResponse = { data: false, error: null };
		bulkInsertResponse = null;
	});

	it("returns 400 when model exceeds 80 characters", async () => {
		const req = makeRequest({
			company: "Zeekr",
			model: "M".repeat(81),
			parts: [],
		});
		const res = await POST(req as never);
		expect(res.status).toBe(400);
	});

	it("returns 400 when a part description exceeds 500 characters", async () => {
		const req = makeRequest({
			company: "Zeekr",
			parts: [{ partNumber: "A1", description: "D".repeat(501) }],
		});
		const res = await POST(req as never);
		expect(res.status).toBe(400);
	});

	it("returns 400 when the parts array exceeds 50 items", async () => {
		const req = makeRequest({
			company: "Zeekr",
			parts: Array.from({ length: 51 }, (_, i) => ({
				partNumber: `P${i}`,
				description: "d",
			})),
		});
		const res = await POST(req as never);
		expect(res.status).toBe(400);
	});
});

describe("POST /api/mobile-order — rate limiting", () => {
	function makeRequestWithIp(ip: string) {
		return new Request("http://localhost/api/mobile-order", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-forwarded-for": ip,
			},
			body: JSON.stringify({ company: "Zeekr", parts: [] }),
		});
	}

	beforeEach(() => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
		process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
		vi.clearAllMocks();
		rateLimitResponse = { data: false, error: null };
		bulkInsertResponse = null;
	});

	it("passes the caller IP to the rate-limit RPC", async () => {
		await POST(makeRequestWithIp("10.0.0.1") as never);
		expect(mockRpc).toHaveBeenCalledWith(
			"check_rate_limit",
			expect.objectContaining({
				p_ip: "10.0.0.1",
				p_max_requests: RATE_LIMIT_MAX,
			}),
		);
	});

	it("allows request when RPC returns false (under limit)", async () => {
		const res = await POST(makeRequestWithIp("10.0.0.1") as never);
		expect(res.status).not.toBe(429);
	});

	it("returns 429 when RPC returns true (limit reached)", async () => {
		rateLimitResponse = { data: true, error: null };
		const res = await POST(makeRequestWithIp("10.0.0.1") as never);
		expect(res.status).toBe(429);
		const json = await res.json();
		expect(json.error).toMatch(/too many requests/i);
	});

	it("fails open (allows request) when RPC errors", async () => {
		rateLimitResponse = { data: null, error: { message: "DB error" } };
		const res = await POST(makeRequestWithIp("10.0.0.1") as never);
		expect(res.status).not.toBe(429);
	});

	it(`passes RATE_LIMIT_MAX (${RATE_LIMIT_MAX}) to the RPC`, async () => {
		await POST(makeRequestWithIp("10.0.0.1") as never);
		expect(mockRpc).toHaveBeenCalledWith(
			"check_rate_limit",
			expect.objectContaining({
				p_ip: "10.0.0.1",
				p_max_requests: RATE_LIMIT_MAX,
			}),
		);
	});
});
