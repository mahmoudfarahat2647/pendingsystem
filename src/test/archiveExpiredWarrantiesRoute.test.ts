import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks ---

vi.mock("@/lib/logger", () => ({
	logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const mockArchiveExpiredWarranties = vi.fn();
vi.mock("@/services/warrantyMaintenanceService", () => ({
	warrantyMaintenanceService: {
		archiveExpiredWarranties: (...args: unknown[]) =>
			mockArchiveExpiredWarranties(...args),
	},
}));

import { GET } from "@/app/api/maintenance/archive-expired-warranties/route";

function makeRequest(authHeader?: string) {
	const headers: Record<string, string> = {};
	if (authHeader !== undefined) {
		headers.authorization = authHeader;
	}
	return new NextRequest(
		"http://localhost/api/maintenance/archive-expired-warranties",
		{
			headers,
		},
	);
}

describe("GET /api/maintenance/archive-expired-warranties", () => {
	const originalEnv = process.env;
	const TEST_CRON_SECRET = "super-secret-cron-token-12345";

	beforeEach(() => {
		vi.clearAllMocks();
		process.env = {
			...originalEnv,
			CRON_SECRET: TEST_CRON_SECRET,
		};
		mockArchiveExpiredWarranties.mockResolvedValue({
			archived: 2,
			errors: 0,
		});
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("returns 401 when Authorization header is missing", async () => {
		const req = makeRequest();
		const res = await GET(req);
		const data = await res.json();

		expect(res.status).toBe(401);
		expect(data).toEqual({ error: "Unauthorized" });
		expect(mockArchiveExpiredWarranties).not.toHaveBeenCalled();
	});

	it("returns 401 when bearer token does not match CRON_SECRET", async () => {
		const req = makeRequest("Bearer wrong-token");
		const res = await GET(req);
		const data = await res.json();

		expect(res.status).toBe(401);
		expect(data).toEqual({ error: "Unauthorized" });
		expect(mockArchiveExpiredWarranties).not.toHaveBeenCalled();
	});

	it("proceeds and calls warrantyMaintenanceService.archiveExpiredWarranties() when valid bearer token is provided", async () => {
		const req = makeRequest(`Bearer ${TEST_CRON_SECRET}`);
		const res = await GET(req);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data).toEqual({ ok: true, archived: 2, errors: 0 });
		expect(mockArchiveExpiredWarranties).toHaveBeenCalledTimes(1);
	});

	it("handles service errors gracefully and returns 500", async () => {
		mockArchiveExpiredWarranties.mockRejectedValue(
			new Error("Database connection lost"),
		);

		const req = makeRequest(`Bearer ${TEST_CRON_SECRET}`);
		const res = await GET(req);
		const data = await res.json();

		expect(res.status).toBe(500);
		expect(data).toEqual({
			ok: false,
			error: "Error: Database connection lost",
		});
	});
});
