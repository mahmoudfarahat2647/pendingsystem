import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Todo } from "@/domain/todo/todo";
import { useTodoActions, useTodosQuery } from "@/hooks/queries/useTodosQuery";
import { TODOS_QUERY_KEY } from "@/lib/queryClient";
import { ID_A, ID_B, makeTodo } from "./fixtures";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const service = vi.hoisted(() => ({
	list: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	remove: vi.fn(),
}));

vi.mock("@/services/todos/todoService", () => ({ todoService: service }));

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

const A = makeTodo({ id: ID_A, title: "A" });
const B = makeTodo({ id: ID_B, title: "B" });

function setup(initial: Todo[] = [A, B]) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	// The server keeps returning the initial list until a test changes it.
	let serverList = initial;
	service.list.mockImplementation(() => Promise.resolve(serverList));
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	const hook = renderHook(
		() => ({ query: useTodosQuery(), actions: useTodoActions() }),
		{ wrapper },
	);
	const cached = () => queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? [];
	const setServerList = (next: Todo[]) => {
		serverList = next;
	};
	return { queryClient, hook, cached, setServerList };
}

const flush = () => act(async () => {});

describe("useTodoActions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("applies an optimistic create, then swaps the temporary task for the server one", async () => {
		const { hook, cached, setServerList } = setup([]);
		await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true));

		const create = deferred<Todo>();
		service.create.mockReturnValue(create.promise);
		act(() => {
			hook.result.current.actions.createTodo({
				title: "New",
				note: null,
				dueDate: "2026-10-01",
				dueTime: null,
			});
		});
		await flush();
		expect(cached()).toHaveLength(1);
		expect(cached()[0].id.startsWith("temp-")).toBe(true);

		const saved = makeTodo({ id: ID_A, title: "New" });
		setServerList([saved]);
		await act(async () => create.resolve(saved));
		await waitFor(() => expect(cached()).toEqual([saved]));
	});

	it("applies an optimistic toggle", async () => {
		const { hook, cached } = setup();
		await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true));
		service.update.mockReturnValue(new Promise(() => {}));

		act(() => {
			hook.result.current.actions.toggleTodo(ID_A, true);
		});
		await flush();
		expect(cached().find((t) => t.id === ID_A)?.isDone).toBe(true);
	});

	it("rolls back only the failed task when another task's mutation succeeds", async () => {
		const { hook, cached, setServerList } = setup();
		await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true));

		const toggleA = deferred<Todo>();
		const editB = deferred<Todo>();
		service.update.mockImplementation((id: string) =>
			id === ID_A ? toggleA.promise : editB.promise,
		);

		act(() => {
			hook.result.current.actions.toggleTodo(ID_A, true);
			hook.result.current.actions.editTodo(ID_B, {
				title: "B edited",
				note: null,
				dueDate: B.dueDate,
				dueTime: null,
			});
		});
		await flush();

		// A fails while B is still pending: B's optimistic edit must survive.
		await act(async () => toggleA.reject(new Error("boom")));
		await waitFor(() =>
			expect(cached().find((t) => t.id === ID_A)?.isDone).toBe(false),
		);
		expect(cached().find((t) => t.id === ID_B)?.title).toBe("B edited");

		const savedB = { ...B, title: "B edited" };
		setServerList([A, savedB]);
		await act(async () => editB.resolve(savedB));
		await waitFor(() =>
			expect(cached().find((t) => t.id === ID_B)?.title).toBe("B edited"),
		);
		expect(cached().find((t) => t.id === ID_A)?.isDone).toBe(false);
	});

	it("blocks every other mutation on a task with a pending update", async () => {
		const { hook } = setup();
		await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true));
		service.update.mockReturnValue(new Promise(() => {}));
		service.remove.mockReturnValue(new Promise(() => {}));

		let results: boolean[] = [];
		act(() => {
			const { actions } = hook.result.current;
			// Same tick as the first call, like a double-click.
			results = [
				actions.toggleTodo(ID_A, true),
				actions.toggleTodo(ID_A, false),
				actions.editTodo(ID_A, {
					title: "x",
					note: null,
					dueDate: A.dueDate,
					dueTime: null,
				}),
				actions.deleteTodo(ID_A),
			];
		});
		await flush();

		expect(results).toEqual([true, false, false, false]);
		await waitFor(() => expect(service.update).toHaveBeenCalledTimes(1));
		expect(service.remove).not.toHaveBeenCalled();
		await waitFor(() =>
			expect(hook.result.current.actions.isTodoBusy(ID_A)).toBe(true),
		);
	});

	it("blocks every other mutation on a task with a pending delete", async () => {
		const { hook } = setup();
		await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true));
		service.remove.mockReturnValue(new Promise(() => {}));

		let results: boolean[] = [];
		act(() => {
			results.push(hook.result.current.actions.deleteTodo(ID_A));
		});
		await flush();
		act(() => {
			const { actions } = hook.result.current;
			results = [
				...results,
				actions.deleteTodo(ID_A),
				actions.toggleTodo(ID_A, true),
				actions.editTodo(ID_A, {
					title: "x",
					note: null,
					dueDate: A.dueDate,
					dueTime: null,
				}),
			];
		});

		expect(results).toEqual([true, false, false, false]);
		await waitFor(() => expect(service.remove).toHaveBeenCalledTimes(1));
		expect(service.update).not.toHaveBeenCalled();
	});

	it("lets a different task change while another task is pending", async () => {
		const { hook } = setup();
		await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true));
		service.update.mockReturnValue(new Promise(() => {}));
		service.remove.mockReturnValue(new Promise(() => {}));

		act(() => {
			hook.result.current.actions.toggleTodo(ID_A, true);
		});
		await flush();

		let editB = false;
		let deleteB = false;
		act(() => {
			editB = hook.result.current.actions.editTodo(ID_B, {
				title: "B2",
				note: null,
				dueDate: B.dueDate,
				dueTime: null,
			});
		});
		await flush();
		act(() => {
			// B now has its own pending edit, so try delete on a fresh hook state.
			deleteB = hook.result.current.actions.deleteTodo(ID_B);
		});

		expect(editB).toBe(true);
		// The second action on B is blocked by B's own pending edit, not by A.
		expect(deleteB).toBe(false);
		await waitFor(() => expect(service.update).toHaveBeenCalledTimes(2));
		await waitFor(() => {
			expect(hook.result.current.actions.isTodoBusy(ID_A)).toBe(true);
			expect(hook.result.current.actions.isTodoBusy(ID_B)).toBe(true);
		});
	});

	it("deletes a different task while another task is pending", async () => {
		const { hook } = setup();
		await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true));
		service.update.mockReturnValue(new Promise(() => {}));
		service.remove.mockReturnValue(new Promise(() => {}));

		let deleteB = false;
		act(() => {
			hook.result.current.actions.toggleTodo(ID_A, true);
			deleteB = hook.result.current.actions.deleteTodo(ID_B);
		});
		expect(deleteB).toBe(true);
		await waitFor(() => expect(service.remove).toHaveBeenCalledWith(ID_B));
	});

	it("refuses to touch a temporary task until its creation succeeds", async () => {
		const { hook, cached, setServerList } = setup([]);
		await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true));

		const create = deferred<Todo>();
		service.create.mockReturnValue(create.promise);
		service.update.mockReturnValue(new Promise(() => {}));
		act(() => {
			hook.result.current.actions.createTodo({
				title: "New",
				note: null,
				dueDate: "2026-10-01",
				dueTime: null,
			});
		});
		await flush();

		const tempId = cached()[0].id;
		const { actions } = hook.result.current;
		expect(actions.isTodoBusy(tempId)).toBe(true);
		expect(actions.toggleTodo(tempId, true)).toBe(false);
		expect(
			actions.editTodo(tempId, {
				title: "x",
				note: null,
				dueDate: "2026-10-01",
				dueTime: null,
			}),
		).toBe(false);
		expect(actions.deleteTodo(tempId)).toBe(false);
		expect(service.update).not.toHaveBeenCalled();
		expect(service.remove).not.toHaveBeenCalled();

		const saved = makeTodo({ id: ID_A, title: "New" });
		setServerList([saved]);
		await act(async () => create.resolve(saved));
		await waitFor(() => expect(cached()[0].id).toBe(ID_A));

		let toggled = false;
		act(() => {
			toggled = hook.result.current.actions.toggleTodo(ID_A, true);
		});
		expect(toggled).toBe(true);
		await waitFor(() =>
			expect(service.update).toHaveBeenCalledWith(ID_A, { isDone: true }),
		);
	});

	it("restores a task whose delete failed", async () => {
		const { hook, cached } = setup();
		await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true));
		const remove = deferred<void>();
		service.remove.mockReturnValue(remove.promise);

		act(() => {
			hook.result.current.actions.deleteTodo(ID_A);
		});
		await waitFor(() =>
			expect(cached().some((t) => t.id === ID_A)).toBe(false),
		);

		await act(async () => remove.reject(new Error("boom")));
		await waitFor(() => expect(cached().some((t) => t.id === ID_A)).toBe(true));
	});
});
