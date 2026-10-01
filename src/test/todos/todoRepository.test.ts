import { describe, expect, it, vi } from "vitest";
import {
	buildTodoUpdatePatch,
	createTodoRepository,
	TodoNotFoundError,
} from "@/services/todos/todoRepository";

const NOW = new Date("2026-10-01T10:00:00.000Z");

const dbRow = {
	id: "00000000-0000-4000-8000-00000000000a",
	title: "Call",
	note: null,
	due_date: "2026-10-01",
	due_time: null,
	is_done: true,
	done_at: "2026-09-30T10:00:00.000Z",
	created_at: "2026-09-29T10:00:00.000Z",
	updated_at: "2026-10-01T10:00:00.000Z",
};

describe("buildTodoUpdatePatch", () => {
	it("always refreshes updated_at", () => {
		expect(buildTodoUpdatePatch({ title: "New" }, NOW)).toEqual({
			updated_at: NOW.toISOString(),
			title: "New",
		});
	});

	it("leaves done_at untouched when only text/date/time change", () => {
		const patch = buildTodoUpdatePatch(
			{ title: "New", note: null, dueDate: "2026-10-02", dueTime: "09:00" },
			NOW,
		);
		expect(patch).not.toHaveProperty("done_at");
		expect(patch).not.toHaveProperty("is_done");
	});

	it("sets done_at when marked done and clears it when undone", () => {
		expect(buildTodoUpdatePatch({ isDone: true }, NOW)).toMatchObject({
			is_done: true,
			done_at: NOW.toISOString(),
		});
		expect(buildTodoUpdatePatch({ isDone: false }, NOW)).toMatchObject({
			is_done: false,
			done_at: null,
		});
	});
});

function fakeClient(result: {
	data?: unknown;
	error?: unknown;
	count?: number;
}) {
	const chain: Record<string, ReturnType<typeof vi.fn>> = {};
	const terminal = vi.fn().mockResolvedValue(result);
	for (const name of ["select", "insert", "update", "eq", "order"]) {
		chain[name] = vi.fn(() => chain);
	}
	chain.single = terminal;
	chain.maybeSingle = terminal;
	chain.delete = vi.fn(() => ({ eq: vi.fn().mockResolvedValue(result) }));
	const from = vi.fn(() => chain);
	return { client: { from } as never, chain, from };
}

describe("createTodoRepository", () => {
	it("maps an updated row to camelCase and sends updated_at", async () => {
		const { client, chain } = fakeClient({ data: dbRow, error: null });
		const repo = createTodoRepository(() => client);

		const todo = await repo.update(dbRow.id, { title: "Call" });

		expect(todo).toMatchObject({
			id: dbRow.id,
			isDone: true,
			dueDate: "2026-10-01",
		});
		const sent = chain.update.mock.calls[0][0] as Record<string, unknown>;
		expect(sent.updated_at).toEqual(expect.any(String));
		expect(sent).not.toHaveProperty("done_at");
	});

	it("throws TodoNotFoundError when no row was updated or deleted", async () => {
		const missing = fakeClient({ data: null, error: null, count: 0 });
		const repo = createTodoRepository(() => missing.client);
		await expect(repo.update(dbRow.id, { title: "x" })).rejects.toBeInstanceOf(
			TodoNotFoundError,
		);
		await expect(repo.remove(dbRow.id)).rejects.toBeInstanceOf(
			TodoNotFoundError,
		);
	});
});
