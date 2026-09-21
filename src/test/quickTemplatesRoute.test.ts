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

vi.mock("@/lib/logger", () => ({
	logger: {
		debug: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

const mockFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
	createClient: () => ({ from: mockFrom }),
}));

function makeRequest(_method: string, url: string, body?: unknown) {
	return {
		headers: new Headers(),
		url,
		json: () => Promise.resolve(body ?? {}),
	} as unknown as import("next/server").NextRequest;
}

/**
 * Chainable + awaitable stand-in for the Supabase query builder: every
 * relevant method returns the same chain object so tests don't need to know
 * the exact eq/is/order call depth used by the repository, and the chain
 * itself resolves to `result` when awaited directly (delete/get) or via
 * `.single()` (insert).
 */
function makeSupabaseChain(result: {
	data?: unknown;
	error: unknown;
	count?: number;
}) {
	// A real Promise instance so `await chain` uses its native, inherited
	// `.then` (Biome's noThenProperty rule forbids adding an own `then`
	// property to a plain object) while still supporting the chainable
	// eq/is/order calls the repository makes before awaiting.
	const chain = Promise.resolve(result) as Promise<typeof result> &
		Record<string, unknown>;
	const self = () => chain;
	chain.select = vi.fn(self);
	chain.insert = vi.fn(self);
	chain.delete = vi.fn(self);
	chain.eq = vi.fn(self);
	chain.is = vi.fn(self);
	chain.order = vi.fn(self);
	chain.single = vi.fn(() => Promise.resolve(result));
	return chain;
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
			makeRequest(
				"GET",
				"http://localhost/api/quick-templates?category=reason",
			),
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

	it("returns 400 when note category is requested without a stage", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		const { GET } = await import("../app/api/quick-templates/route");
		const res = await GET(
			makeRequest("GET", "http://localhost/api/quick-templates?category=note"),
		);
		expect(res.status).toBe(400);
	});

	it("returns 400 when a stage is given for a non-note category", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		const { GET } = await import("../app/api/quick-templates/route");
		const res = await GET(
			makeRequest(
				"GET",
				"http://localhost/api/quick-templates?category=reason&stage=archive",
			),
		);
		expect(res.status).toBe(400);
	});

	it("returns note templates scoped to the requested stage", async () => {
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
				stage: "booking",
				created_at: "",
				updated_at: "",
			},
		];
		const chain = makeSupabaseChain({ data: rows, error: null });
		mockFrom.mockReturnValue(chain);

		const { GET } = await import("../app/api/quick-templates/route");
		const res = await GET(
			makeRequest(
				"GET",
				"http://localhost/api/quick-templates?category=note&stage=booking",
			),
		);
		expect(res.status).toBe(200);
		expect(res.body).toEqual([
			{
				id: "1",
				category: "note",
				text: "Hi",
				sortOrder: 0,
				stage: "booking",
				createdAt: "",
				updatedAt: "",
			},
		]);
		expect(chain.eq).toHaveBeenCalledWith("stage", "booking");
	});

	it("returns global templates for reason/reminder categories", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		const rows = [
			{
				id: "2",
				category: "reason",
				text: "Not arrived",
				sort_order: 0,
				stage: null,
				created_at: "",
				updated_at: "",
			},
		];
		const chain = makeSupabaseChain({ data: rows, error: null });
		mockFrom.mockReturnValue(chain);

		const { GET } = await import("../app/api/quick-templates/route");
		const res = await GET(
			makeRequest(
				"GET",
				"http://localhost/api/quick-templates?category=reason",
			),
		);
		expect(res.status).toBe(200);
		expect(chain.is).toHaveBeenCalledWith("stage", null);
	});

	it("returns a generic 500 body without leaking DB internals", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		const rawMessage = 'relation "public.quick_templates" does not exist';
		mockFrom.mockReturnValue(
			makeSupabaseChain({ data: null, error: { message: rawMessage } }),
		);

		const { GET } = await import("../app/api/quick-templates/route");
		const res = await GET(
			makeRequest(
				"GET",
				"http://localhost/api/quick-templates?category=reason",
			),
		);
		expect(res.status).toBe(500);
		expect(res.body).toEqual({ error: "Internal server error" });
		expect(JSON.stringify(res.body)).not.toContain("quick_templates");

		const { logger } = await import("@/lib/logger");
		expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
			"[quick-templates GET]",
			rawMessage,
		);
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
				stage: "booking",
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
				stage: "booking",
			}),
		);
		expect(res.status).toBe(400);
	});

	it("returns 400 when a note template is posted without a stage", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		const { POST } = await import("../app/api/quick-templates/route");
		const res = await POST(
			makeRequest("POST", "http://localhost/api/quick-templates", {
				category: "note",
				text: "Hi",
			}),
		);
		expect(res.status).toBe(400);
	});

	it("returns 400 when a reason template is posted with a stage", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		const { POST } = await import("../app/api/quick-templates/route");
		const res = await POST(
			makeRequest("POST", "http://localhost/api/quick-templates", {
				category: "reason",
				text: "Hi",
				stage: "archive",
			}),
		);
		expect(res.status).toBe(400);
	});

	it("returns 409 on duplicate", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		mockFrom.mockReturnValue(
			makeSupabaseChain({
				data: null,
				error: { code: "23505", message: "dup" },
			}),
		);

		const { POST } = await import("../app/api/quick-templates/route");
		const res = await POST(
			makeRequest("POST", "http://localhost/api/quick-templates", {
				category: "note",
				text: "Hi",
				stage: "booking",
			}),
		);
		expect(res.status).toBe(409);
		expect((res.body as unknown as { error: string }).error).toBe(
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
			stage: "booking",
			created_at: "",
			updated_at: "",
		};
		const chain = makeSupabaseChain({ data: row, error: null });
		mockFrom.mockReturnValue(chain);

		const { POST } = await import("../app/api/quick-templates/route");
		const res = await POST(
			makeRequest("POST", "http://localhost/api/quick-templates", {
				category: "note",
				text: "Hi",
				stage: "booking",
			}),
		);
		expect(res.status).toBe(201);
		expect((res.body as unknown as { id: string }).id).toBe("new");
		expect(chain.insert).toHaveBeenCalledWith({
			category: "note",
			text: "Hi",
			stage: "booking",
		});
	});

	it("allows a reason template with no stage", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		const row = {
			id: "new",
			category: "reason",
			text: "Not arrived",
			sort_order: 0,
			stage: null,
			created_at: "",
			updated_at: "",
		};
		mockFrom.mockReturnValue(makeSupabaseChain({ data: row, error: null }));

		const { POST } = await import("../app/api/quick-templates/route");
		const res = await POST(
			makeRequest("POST", "http://localhost/api/quick-templates", {
				category: "reason",
				text: "Not arrived",
			}),
		);
		expect(res.status).toBe(201);
	});

	it("returns a generic 500 body without leaking DB internals", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		const rawMessage =
			'duplicate key value violates unique constraint "quick_templates_text_idx"';
		mockFrom.mockReturnValue(
			makeSupabaseChain({ data: null, error: { message: rawMessage } }),
		);

		const { POST } = await import("../app/api/quick-templates/route");
		const res = await POST(
			makeRequest("POST", "http://localhost/api/quick-templates", {
				category: "note",
				text: "Hi",
				stage: "booking",
			}),
		);
		expect(res.status).toBe(500);
		expect(res.body).toEqual({ error: "Internal server error" });
		expect(JSON.stringify(res.body)).not.toContain("quick_templates_text_idx");

		const { logger } = await import("@/lib/logger");
		expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
			"[quick-templates POST]",
			rawMessage,
		);
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
				"http://localhost/api/quick-templates?id=some-uuid-1234-5678&category=note&stage=booking",
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

	it("returns 400 when category is missing", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		const { DELETE } = await import("../app/api/quick-templates/route");
		const res = await DELETE(
			makeRequest(
				"DELETE",
				"http://localhost/api/quick-templates?id=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
			),
		);
		expect(res.status).toBe(400);
	});

	it("returns 204 on success, scoped by category and stage", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		const chain = makeSupabaseChain({ error: null, count: 1 });
		mockFrom.mockReturnValue(chain);

		const { DELETE } = await import("../app/api/quick-templates/route");
		const res = await DELETE(
			makeRequest(
				"DELETE",
				"http://localhost/api/quick-templates?id=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&category=note&stage=freeze",
			),
		);
		expect(res.status).toBe(204);
		expect(chain.eq).toHaveBeenCalledWith(
			"id",
			"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
		);
		expect(chain.eq).toHaveBeenCalledWith("category", "note");
		expect(chain.eq).toHaveBeenCalledWith("stage", "freeze");
	});

	it("cannot remove a template scoped to a different stage than requested", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		// count 0 simulates the DB filter finding no row because the id
		// belongs to a different stage than the one requested
		mockFrom.mockReturnValue(makeSupabaseChain({ error: null, count: 0 }));

		const { DELETE } = await import("../app/api/quick-templates/route");
		const res = await DELETE(
			makeRequest(
				"DELETE",
				"http://localhost/api/quick-templates?id=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&category=note&stage=archive",
			),
		);
		expect(res.status).toBe(404);
	});

	it("returns a generic 500 body without leaking DB internals", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);

		const rawMessage = 'permission denied for table "quick_templates"';
		mockFrom.mockReturnValue(
			makeSupabaseChain({ error: { message: rawMessage }, count: 0 }),
		);

		const { DELETE } = await import("../app/api/quick-templates/route");
		const res = await DELETE(
			makeRequest(
				"DELETE",
				"http://localhost/api/quick-templates?id=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&category=note&stage=archive",
			),
		);
		expect(res.status).toBe(500);
		expect(res.body).toEqual({ error: "Internal server error" });
		expect(JSON.stringify(res.body)).not.toContain("quick_templates");

		const { logger } = await import("@/lib/logger");
		expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
			"[quick-templates DELETE]",
			rawMessage,
		);
	});
});
