import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Todo } from "@/domain/todo/todo";
import { useTodoActions, useTodosQuery } from "@/hooks/queries/useTodosQuery";
import { TODOS_QUERY_KEY } from "@/lib/queryClient";
import { ID_A, makeTodo } from "./fixtures";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const service = vi.hoisted(() => ({
	list: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	remove: vi.fn(),
}));
vi.mock("@/services/todos/todoService", () => ({ todoService: service }));

/** Lets real setTimeout-based work (React Query notifications) run. */
const settle = () => act(() => new Promise((r) => setTimeout(r, 20)));

describe("useTodosQuery 60-second polling", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("does not revert a pending toggle at the polling tick, and polls again after it settles", async () => {
		// Only the polling interval is faked; timeouts stay real.
		vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });

		const A = makeTodo({ id: ID_A });
		let serverList: Todo[] = [A];
		service.list.mockImplementation(() => Promise.resolve(serverList));
		let resolveToggle!: (todo: Todo) => void;
		service.update.mockReturnValue(
			new Promise<Todo>((r) => {
				resolveToggle = r;
			}),
		);

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		const wrapper = ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
		const hook = renderHook(
			() => ({ query: useTodosQuery(), actions: useTodoActions() }),
			{ wrapper },
		);
		const cached = () =>
			queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? [];

		await settle();
		expect(hook.result.current.query.isSuccess).toBe(true);

		act(() => {
			hook.result.current.actions.toggleTodo(ID_A, true);
		});
		await settle();
		expect(cached()[0].isDone).toBe(true);

		// The real polling tick fires while the server still says "not done".
		await act(async () => {
			vi.advanceTimersByTime(60_000);
		});
		await settle();
		expect(cached()[0].isDone).toBe(true);

		// The toggle lands; the read resumes and later polls see new data.
		serverList = [{ ...A, isDone: true }];
		await act(async () => resolveToggle({ ...A, isDone: true }));
		await settle();
		expect(cached()[0].isDone).toBe(true);

		const callsAfterSettle = service.list.mock.calls.length;
		serverList = [{ ...A, isDone: true, title: "Changed elsewhere" }];
		await act(async () => {
			vi.advanceTimersByTime(60_000);
		});
		await settle();
		expect(service.list.mock.calls.length).toBeGreaterThan(callsAfterSettle);
		expect(cached()[0].title).toBe("Changed elsewhere");
	});
});
