import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
	NextResponse: {
		json: (body: unknown, init?: { status?: number }) => ({
			body,
			status: init?.status ?? 200,
			json: async () => body,
		}),
	},
}));

vi.mock("@/lib/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

const mockGetDueNotificationCandidates = vi.fn();
vi.mock("@/services/notifications/notificationCandidatesRepository", () => ({
	createNotificationCandidatesRepository: () => ({
		getDueNotificationCandidates: mockGetDueNotificationCandidates,
	}),
}));

function makeRequest() {
	return {
		headers: new Headers(),
	} as unknown as import("next/server").NextRequest;
}

function makeSession() {
	return { user: { id: "user-1" } } as unknown as Awaited<
		ReturnType<typeof import("@/lib/auth").auth.api.getSession>
	>;
}

describe("GET /api/notifications", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("returns 401 when there is no session", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue(null);

		const { GET } = await import("@/app/api/notifications/route");
		const res = await GET(makeRequest());

		expect(res.status).toBe(401);
	});

	it("returns 200 with candidates when authenticated", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue(makeSession());
		mockGetDueNotificationCandidates.mockResolvedValue([{ id: "row-1" }]);

		const { GET } = await import("@/app/api/notifications/route");
		const res = await GET(makeRequest());

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.candidates).toEqual([{ id: "row-1" }]);
	});

	it("returns 500 when the repository throws", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue(makeSession());
		mockGetDueNotificationCandidates.mockRejectedValue(new Error("db down"));

		const { GET } = await import("@/app/api/notifications/route");
		const res = await GET(makeRequest());

		expect(res.status).toBe(500);
	});
});
