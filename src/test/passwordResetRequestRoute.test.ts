import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock pg Pool
vi.mock("@/lib/postgres", () => ({
	pool: {
		query: vi.fn(),
	},
}));

// Mock Better Auth
vi.mock("@/lib/auth", () => ({
	auth: {
		api: {
			requestPasswordReset: vi.fn(),
		},
	},
}));

import { POST } from "@/app/api/password-reset/request/route";
import { pool } from "@/lib/postgres";
import { auth } from "@/lib/auth";

function makeRequest(body: Record<string, unknown>, ip = "1.2.3.4") {
	return new NextRequest("http://localhost/api/password-reset/request", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-forwarded-for": ip,
		},
		body: JSON.stringify(body),
	});
}

describe("POST /api/password-reset/request", () => {
	beforeEach(() => {
		vi.mocked(pool.query).mockResolvedValue({ rows: [] } as never);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns generic success for non-existing username", async () => {
		vi.mocked(pool.query).mockResolvedValue({ rows: [] } as never);
		const req = makeRequest({ username: "unknownuser" }, "10.0.0.1");
		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.message).toContain("If that username exists");
	});

	it("returns generic success for existing username", async () => {
		vi.mocked(pool.query).mockResolvedValue({
			rows: [{ email: "admin@example.com" }],
		} as never);

		const req = makeRequest({ username: "admin" }, "10.0.0.2");
		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.message).toContain("If that username exists");
	});

	it("returns same generic response when rate limited", async () => {
		// Send 3 requests to fill the rate limit bucket
		for (let i = 0; i < 3; i++) {
			await POST(makeRequest({ username: "admin" }, "10.0.0.3"));
		}
		// 4th request should be rate limited but still return generic success
		const res = await POST(makeRequest({ username: "admin" }, "10.0.0.3"));
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
	});

	it("handles requestPasswordReset rejection gracefully", async () => {
		// Mock a rejection from the password reset API
		vi.mocked(auth.api.requestPasswordReset).mockRejectedValue(
			new Error("Mail service down"),
		);

		vi.mocked(pool.query).mockResolvedValue({
			rows: [{ email: "user@example.com" }],
		} as never);

		const req = makeRequest({ username: "user" }, "10.0.0.4");
		const res = await POST(req);
		const data = await res.json();

		// Even though requestPasswordReset failed, the route should:
		// 1. Still return 200 with generic success (no timing leak)
		// 2. Not throw an unhandled rejection
		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.message).toContain("If that username exists");
	});
});
