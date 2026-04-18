import { beforeEach, describe, expect, it, vi } from "vitest";

// We test the handler logic by mocking Supabase inserts.
// The handler is imported after mocks are set up.

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
// biome-ignore lint/suspicious/noExplicitAny: test mock needs flexible return type for multi-table mocking
const mockFrom = vi.fn((_table: string): any => ({
	insert: mockInsert.mockReturnThis(),
	select: mockSelect.mockReturnThis(),
	single: mockSingle,
}));

vi.mock("@supabase/supabase-js", () => ({
	createClient: vi.fn(() => ({
		from: mockFrom,
	})),
}));

// Import after mocks
const { POST } = await import("@/app/api/mobile-order/route");

function makeRequest(body: unknown) {
	return new Request("http://localhost/api/mobile-order", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("POST /api/mobile-order", () => {
	beforeEach(() => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
		process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
		vi.clearAllMocks();
		mockSingle.mockResolvedValue({
			data: { id: "uuid-1", stage: "orders" },
			error: null,
		});
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
		expect(mockFrom).toHaveBeenCalledWith("orders");
		expect(mockInsert).toHaveBeenCalledTimes(1);
		const insertArg = mockInsert.mock.calls[0][0][0];
		expect(insertArg.stage).toBe("orders");
		expect(insertArg.metadata.requester).toBe("mobile");
		expect(insertArg.metadata.status).toBe("Pending");
	});

	it("inserts N rows for N valid parts", async () => {
		const req = makeRequest({
			company: "Renault",
			parts: [
				{ partNumber: "A1", description: "Part A" },
				{ partNumber: "B2", description: "Part B" },
			],
		});
		const res = await POST(req as never);
		expect(res.status).toBe(200);
		// One insert call per part
		expect(mockInsert).toHaveBeenCalledTimes(2);
	});

	it("forces requester to 'mobile' regardless of payload", async () => {
		const req = makeRequest({
			company: "Zeekr",
			parts: [{ partNumber: "X", description: "Y" }],
		});
		const res = await POST(req as never);
		const insertArg = mockInsert.mock.calls[0][0][0];
		expect(insertArg.metadata.requester).toBe("mobile");
	});

	it("sets rDate to today if not provided", async () => {
		const req = makeRequest({ company: "Zeekr", parts: [] });
		const res = await POST(req as never);
		const insertArg = mockInsert.mock.calls[0][0][0];
		// rDate stored in metadata
		expect(typeof insertArg.metadata.rDate).toBe("string");
		expect(insertArg.metadata.rDate.length).toBeGreaterThan(0);
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
		const res = await POST(req as never);
		for (const call of mockInsert.mock.calls) {
			const row = call[0][0];
			expect(row.customer_name).toBe("Alice");
			expect(row.vin).toBe("VIN123");
			expect(row.customer_phone).toBe("0500000001");
		}
	});
});

// Task 4: app_settings merge tests
const mockAppSettingsSelect = vi.fn().mockResolvedValue({
	data: { models: ["Megane IV"], repair_systems: ["Mechanical"] },
	error: null,
});

mockFrom.mockImplementation((table: string) => {
	if (table === "app_settings") {
		return {
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: mockAppSettingsSelect,
				}),
			}),
			update: vi.fn().mockReturnValue({
				eq: vi.fn().mockResolvedValue({ data: {}, error: null }),
			}),
		};
	}
	return {
		insert: mockInsert.mockReturnThis(),
		select: mockSelect.mockReturnThis(),
		single: mockSingle,
	};
});

describe("POST /api/mobile-order — app_settings merge", () => {
	beforeEach(() => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
		process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
		vi.clearAllMocks();
		mockSingle.mockResolvedValue({
			data: { id: "uuid-1", stage: "orders" },
			error: null,
		});
		mockAppSettingsSelect.mockResolvedValue({
			data: { models: ["Megane IV"], repair_systems: ["Mechanical"] },
			error: null,
		});
		mockFrom.mockImplementation((table: string) => {
			if (table === "app_settings") {
				return {
					select: vi.fn().mockReturnValue({
						eq: vi.fn().mockReturnValue({
							single: mockAppSettingsSelect,
						}),
					}),
					update: vi.fn().mockReturnValue({
						eq: vi.fn().mockResolvedValue({ data: {}, error: null }),
					}),
				};
			}
			return {
				insert: mockInsert.mockReturnThis(),
				select: mockSelect.mockReturnThis(),
				single: mockSingle,
			};
		});
	});

	it("merges new model into app_settings when not already present", async () => {
		const req = makeRequest({
			company: "Zeekr",
			model: "BrandNewModel",
			parts: [],
		});
		await POST(req as never);
		expect(mockFrom).toHaveBeenCalledWith("app_settings");
	});
});
