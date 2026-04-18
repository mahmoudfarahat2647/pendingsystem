import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SUPABASE_REQUEST_TIMEOUT_MS } from "../lib/constants";

// Mock Next.js server module
vi.mock("next/server", () => ({
	NextResponse: {
		json: (body: unknown, init?: { status?: number }) => ({
			body,
			status: init?.status ?? 200,
			headers: new Map(),
		}),
	},
}));

// Mock Better Auth session — always return a valid session for storage-stats tests
vi.mock("@/lib/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn().mockResolvedValue({ user: { id: "test-user" } }),
		},
	},
}));

// Mock @supabase/supabase-js
const mockRpc = vi.fn();
const mockListBuckets = vi.fn();
const mockStorageFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
	createClient: () => ({
		rpc: mockRpc,
		storage: {
			listBuckets: mockListBuckets,
			from: mockStorageFrom,
		},
	}),
}));

describe("GET /api/storage-stats", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = {
			...originalEnv,
			NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
			SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
		};
		mockRpc.mockReset();
		mockListBuckets.mockReset();
		mockStorageFrom.mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	async function callGET() {
		const { GET } = await import("../app/api/storage-stats/route");
		const req = new Request("http://localhost/api/storage-stats");
		return GET(req as unknown as import("next/server").NextRequest);
	}

	it("should return 500 when env vars are missing", async () => {
		delete process.env.NEXT_PUBLIC_SUPABASE_URL;
		delete process.env.SUPABASE_SERVICE_ROLE_KEY;

		const response = await callGET();
		expect(response.status).toBe(500);
	});

	it("should return complete data when both sources succeed", async () => {
		mockRpc.mockResolvedValue({ data: 10_000_000, error: null });
		mockListBuckets.mockResolvedValue({
			data: [{ id: "uploads" }],
			error: null,
		});
		mockStorageFrom.mockReturnValue({
			list: vi.fn().mockResolvedValue({
				data: [
					{ id: "file1", name: "file1.pdf", metadata: { size: 5_000_000 } },
				],
				error: null,
			}),
		});

		const response = await callGET();
		expect(response.status).toBe(200);

		const body = response.body as unknown as Record<string, unknown>;
		expect(body.dbUsedBytes).toBe(10_000_000);
		expect(body.dbAvailable).toBe(true);
		expect(body.storageAvailable).toBe(true);
		expect(body.dataComplete).toBe(true);
		expect(body.combinedUsedBytes).toBe(15_000_000);
	});

	it("should return dbAvailable false when RPC fails", async () => {
		mockRpc.mockResolvedValue({
			data: null,
			error: { message: "function not found" },
		});
		mockListBuckets.mockResolvedValue({ data: [], error: null });

		const response = await callGET();
		expect(response.status).toBe(200);

		const body = response.body as unknown as Record<string, unknown>;
		expect(body.dbUsedBytes).toBeNull();
		expect(body.dbAvailable).toBe(false);
		expect(body.storageAvailable).toBe(true);
		expect(body.dataComplete).toBe(false);
		expect(body.combinedUsedBytes).toBeNull();
	});

	it("should return storageAvailable false when bucket listing fails", async () => {
		mockRpc.mockResolvedValue({ data: 10_000_000, error: null });
		mockListBuckets.mockResolvedValue({
			data: null,
			error: { message: "permission denied" },
		});

		const response = await callGET();
		expect(response.status).toBe(200);

		const body = response.body as unknown as Record<string, unknown>;
		expect(body.dbAvailable).toBe(true);
		expect(body.storageAvailable).toBe(false);
		expect(body.dataComplete).toBe(false);
		expect(body.combinedUsedBytes).toBeNull();
	});

	it("should return degraded data when Supabase calls exceed the timeout", async () => {
		vi.useFakeTimers();
		mockRpc.mockImplementation(
			() => new Promise(() => undefined) as Promise<unknown>,
		);
		mockListBuckets.mockImplementation(
			() => new Promise(() => undefined) as Promise<unknown>,
		);

		const routePromise = callGET();

		await vi.advanceTimersByTimeAsync(SUPABASE_REQUEST_TIMEOUT_MS + 1_000);

		const response = await routePromise;
		expect(response.status).toBe(200);

		const body = response.body as unknown as Record<string, unknown>;
		expect(body.dbUsedBytes).toBeNull();
		expect(body.dbAvailable).toBe(false);
		expect(body.storageUsedBytes).toBe(0);
		expect(body.storageAvailable).toBe(false);
		expect(body.dataComplete).toBe(false);
		expect(body.combinedUsedBytes).toBeNull();
	});

	it("should mark storage unavailable when recursive bucket listing fails", async () => {
		mockRpc.mockResolvedValue({ data: 10_000_000, error: null });
		mockListBuckets.mockResolvedValue({
			data: [{ id: "uploads" }],
			error: null,
		});
		mockStorageFrom.mockReturnValue({
			list: vi.fn().mockResolvedValue({
				data: null,
				error: { message: "timeout" },
			}),
		});

		const response = await callGET();
		expect(response.status).toBe(200);

		const body = response.body as unknown as Record<string, unknown>;
		expect(body.dbAvailable).toBe(true);
		expect(body.storageUsedBytes).toBe(0);
		expect(body.storageAvailable).toBe(false);
		expect(body.dataComplete).toBe(false);
		expect(body.combinedUsedBytes).toBeNull();
	});

	it("should include correct limit constants", async () => {
		mockRpc.mockResolvedValue({ data: 0, error: null });
		mockListBuckets.mockResolvedValue({ data: [], error: null });

		const response = await callGET();
		const body = response.body as unknown as Record<string, unknown>;

		expect(body.dbLimitBytes).toBe(500 * 1024 * 1024);
		expect(body.storageLimitBytes).toBe(1024 * 1024 * 1024);
		expect(body.combinedLimitBytes).toBe(
			500 * 1024 * 1024 + 1024 * 1024 * 1024,
		);
	});
});
