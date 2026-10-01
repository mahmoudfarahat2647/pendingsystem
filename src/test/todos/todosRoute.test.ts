import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => {
	class NextResponse {
		body: unknown;
		status: number;
		constructor(body: unknown, init?: { status?: number }) {
			this.body = body;
			this.status = init?.status ?? 200;
		}
		static json(body: unknown, init?: { status?: number }) {
			return new NextResponse(body, init);
		}
	}
	return { NextResponse };
});

vi.mock("@/lib/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/lib/logger", () => ({
	logger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const repo = vi.hoisted(() => ({
	list: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	remove: vi.fn(),
}));

vi.mock("@/services/todos/todoRepository", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@/services/todos/todoRepository")>();
	return { ...actual, createTodoRepository: () => repo };
});

import { DELETE, PATCH } from "@/app/api/todos/[id]/route";
import { GET, POST } from "@/app/api/todos/route";
import { auth } from "@/lib/auth";
import { TodoNotFoundError } from "@/services/todos/todoRepository";

const ID = "00000000-0000-4000-8000-00000000000a";

function req(body?: unknown) {
	return {
		headers: new Headers(),
		json: () =>
			body === undefined
				? Promise.reject(new Error("no body"))
				: Promise.resolve(body),
	} as unknown as import("next/server").NextRequest;
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function signIn(signedIn: boolean) {
	vi.mocked(auth.api.getSession).mockResolvedValue(
		(signedIn ? { user: { id: "u1" } } : null) as never,
	);
}

describe("/api/todos", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		signIn(true);
	});

	it("returns 401 without a session on every handler", async () => {
		signIn(false);
		expect((await GET(req())).status).toBe(401);
		expect((await POST(req({}))).status).toBe(401);
		expect((await PATCH(req({}), ctx(ID))).status).toBe(401);
		expect((await DELETE(req(), ctx(ID))).status).toBe(401);
		expect(repo.list).not.toHaveBeenCalled();
	});

	it("lists tasks", async () => {
		repo.list.mockResolvedValue([{ id: ID }]);
		const res = (await GET(req())) as unknown as {
			status: number;
			body: unknown;
		};
		expect(res.status).toBe(200);
		expect(res.body).toEqual([{ id: ID }]);
	});

	it("creates a task with parsed data", async () => {
		repo.create.mockResolvedValue({ id: ID });
		const res = await POST(req({ title: " Call ", dueDate: "2026-10-04" }));
		expect(res.status).toBe(201);
		expect(repo.create).toHaveBeenCalledWith({
			title: "Call",
			note: null,
			dueDate: "2026-10-04",
			dueTime: null,
		});
	});

	it("rejects bad bodies with 400, including impossible dates", async () => {
		expect(
			(await POST(req({ title: "x", dueDate: "2026-02-30" }))).status,
		).toBe(400);
		expect((await POST(req())).status).toBe(400);
		expect((await PATCH(req({ dueDate: "2026-02-30" }), ctx(ID))).status).toBe(
			400,
		);
		expect((await PATCH(req({}), ctx(ID))).status).toBe(400);
		expect(repo.create).not.toHaveBeenCalled();
		expect(repo.update).not.toHaveBeenCalled();
	});

	it("rejects invalid ids", async () => {
		expect((await PATCH(req({ isDone: true }), ctx("temp-1"))).status).toBe(
			400,
		);
		expect((await DELETE(req(), ctx("nope"))).status).toBe(400);
	});

	it("updates and deletes", async () => {
		repo.update.mockResolvedValue({ id: ID, isDone: true });
		expect((await PATCH(req({ isDone: true }), ctx(ID))).status).toBe(200);
		expect(repo.update).toHaveBeenCalledWith(ID, { isDone: true });

		repo.remove.mockResolvedValue(undefined);
		expect((await DELETE(req(), ctx(ID))).status).toBe(204);
	});

	it("maps a missing task to 404 and other failures to 500", async () => {
		repo.update.mockRejectedValue(new TodoNotFoundError(ID));
		expect((await PATCH(req({ isDone: true }), ctx(ID))).status).toBe(404);
		repo.remove.mockRejectedValue(new Error("db down"));
		expect((await DELETE(req(), ctx(ID))).status).toBe(500);
	});
});
