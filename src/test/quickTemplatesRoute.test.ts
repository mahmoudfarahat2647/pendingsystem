import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
	NextResponse: {
		json: (body: unknown, init?: { status?: number }) => ({
			body,
			status: init?.status ?? 200,
		}),
	},
	NextRequest: class {},
}));

vi.mock("@/lib/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
	createClient: () => ({ from: mockFrom }),
}));

function makeRequest(method: string, url: string, body?: unknown) {
	return {
		headers: new Headers(),
		url,
		json: () => Promise.resolve(body ?? {}),
	} as unknown as import("next/server").NextRequest;
}

describe("GET /api/quick-templates", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = {
			...originalEnv,
			NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
			SUPABASE_SERVICE_ROLE_KEY: "test-key",
		};
		mockFrom.mockReset();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("returns 401 when not authenticated", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue(null);

		const { GET } = await import("../app/api/quick-templates/route");
		const res = await GET(
			makeRequest("GET", "http://localhost/api/quick-templates?category=note"),
		);
		expect(res.status).toBe(401);
	});

	it("returns 400 for invalid category", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		const { GET } = await import("../app/api/quick-templates/route");
		const res = await GET(
			makeRequest(
				"GET",
				"http://localhost/api/quick-templates?category=invalid",
			),
		);
		expect(res.status).toBe(400);
	});

	it("returns list of templates for valid category", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		const rows = [
			{
				id: "1",
				category: "note",
				text: "Hi",
				sort_order: 0,
				created_at: "",
				updated_at: "",
			},
		];
		mockFrom.mockReturnValue({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					order: vi.fn().mockReturnValue({
						order: vi.fn().mockResolvedValue({ data: rows, error: null }),
					}),
				}),
			}),
		});

		const { GET } = await import("../app/api/quick-templates/route");
		const res = await GET(
			makeRequest("GET", "http://localhost/api/quick-templates?category=note"),
		);
		expect(res.status).toBe(200);
		expect(res.body).toEqual([
			{
				id: "1",
				category: "note",
				text: "Hi",
				sortOrder: 0,
				createdAt: "",
				updatedAt: "",
			},
		]);
	});
});

describe("POST /api/quick-templates", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = {
			...originalEnv,
			NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
			SUPABASE_SERVICE_ROLE_KEY: "test-key",
		};
		mockFrom.mockReset();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("returns 401 when not authenticated", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue(null);

		const { POST } = await import("../app/api/quick-templates/route");
		const res = await POST(
			makeRequest("POST", "http://localhost/api/quick-templates", {
				category: "note",
				text: "Hi",
			}),
		);
		expect(res.status).toBe(401);
	});

	it("returns 400 for missing text", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		const { POST } = await import("../app/api/quick-templates/route");
		const res = await POST(
			makeRequest("POST", "http://localhost/api/quick-templates", {
				category: "note",
				text: "",
			}),
		);
		expect(res.status).toBe(400);
	});

	it("returns 409 on duplicate", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		mockFrom.mockReturnValue({
			insert: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					single: vi
						.fn()
						.mockResolvedValue({
							data: null,
							error: { code: "23505", message: "dup" },
						}),
				}),
			}),
		});

		const { POST } = await import("../app/api/quick-templates/route");
		const res = await POST(
			makeRequest("POST", "http://localhost/api/quick-templates", {
				category: "note",
				text: "Hi",
			}),
		);
		expect(res.status).toBe(409);
		expect((res.body as { error: string }).error).toBe(
			"Template already exists",
		);
	});

	it("returns 201 with created template on success", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		const row = {
			id: "new",
			category: "note",
			text: "Hi",
			sort_order: 0,
			created_at: "",
			updated_at: "",
		};
		mockFrom.mockReturnValue({
			insert: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({ data: row, error: null }),
				}),
			}),
		});

		const { POST } = await import("../app/api/quick-templates/route");
		const res = await POST(
			makeRequest("POST", "http://localhost/api/quick-templates", {
				category: "note",
				text: "Hi",
			}),
		);
		expect(res.status).toBe(201);
		expect((res.body as { id: string }).id).toBe("new");
	});
});

describe("DELETE /api/quick-templates", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = {
			...originalEnv,
			NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
			SUPABASE_SERVICE_ROLE_KEY: "test-key",
		};
		mockFrom.mockReset();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("returns 401 when not authenticated", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue(null);

		const { DELETE } = await import("../app/api/quick-templates/route");
		const res = await DELETE(
			makeRequest(
				"DELETE",
				"http://localhost/api/quick-templates?id=some-uuid-1234-5678",
			),
		);
		expect(res.status).toBe(401);
	});

	it("returns 400 for invalid id", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		const { DELETE } = await import("../app/api/quick-templates/route");
		const res = await DELETE(
			makeRequest("DELETE", "http://localhost/api/quick-templates?id=bad"),
		);
		expect(res.status).toBe(400);
	});

	it("returns 204 on success", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		mockFrom.mockReturnValue({
			delete: vi.fn().mockReturnValue({
				eq: vi.fn().mockResolvedValue({ error: null, count: 1 }),
			}),
		});

		const { DELETE } = await import("../app/api/quick-templates/route");
		const res = await DELETE(
			makeRequest(
				"DELETE",
				"http://localhost/api/quick-templates?id=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
			),
		);
		expect(res.status).toBe(204);
	});
});
