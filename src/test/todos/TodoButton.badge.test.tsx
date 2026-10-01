import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TodoButton } from "@/components/shared/todos/TodoButton";
import type { Todo } from "@/domain/todo/todo";
import { TODOS_QUERY_KEY } from "@/lib/queryClient";
import { makeTodo } from "./fixtures";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const service = vi.hoisted(() => ({
	list: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	remove: vi.fn(),
}));
vi.mock("@/services/todos/todoService", () => ({ todoService: service }));

let queryClient: QueryClient;

function renderButton(todos: Todo[]) {
	queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false, staleTime: Infinity } },
	});
	queryClient.setQueryData(TODOS_QUERY_KEY, todos);
	service.list.mockResolvedValue(todos);
	return render(
		<QueryClientProvider client={queryClient}>
			<TodoButton />
		</QueryClientProvider>,
	);
}

describe("TodoButton badge", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Local time (not UTC) so the day boundary holds in any timezone.
		vi.setSystemTime(new Date(2026, 9, 1, 12, 0, 0));
	});

	afterEach(() => {
		queryClient.clear();
		vi.useRealTimers();
	});

	it("shows a blue badge counting open tasks due today plus overdue", async () => {
		renderButton([
			makeTodo({ id: "today", dueDate: "2026-10-01" }),
			makeTodo({ id: "overdue", dueDate: "2026-09-28" }),
			makeTodo({ id: "future", dueDate: "2026-10-04" }),
			makeTodo({ id: "done", dueDate: "2026-10-01", isDone: true }),
		]);
		await act(async () => {});

		const button = screen.getByRole("button", {
			name: "To-do list, 2 due today",
		});
		const badge = button.querySelector(".bg-blue-500");
		expect(badge).toHaveTextContent("2");
	});

	it("shows no badge when nothing is due", async () => {
		renderButton([makeTodo({ id: "future", dueDate: "2026-10-04" })]);
		await act(async () => {});

		const button = screen.getByRole("button", { name: "To-do list" });
		expect(button.querySelector(".bg-blue-500")).toBeNull();
	});

	it("rolls over to the next day", async () => {
		renderButton([makeTodo({ id: "tomorrow", dueDate: "2026-10-02" })]);
		await act(async () => {});
		expect(
			screen.getByRole("button", { name: "To-do list" }),
		).toBeInTheDocument();

		await act(async () => {
			vi.setSystemTime(new Date(2026, 9, 2, 0, 0, 30));
			vi.advanceTimersByTime(60_000);
		});

		expect(
			screen.getByRole("button", { name: "To-do list, 1 due today" }),
		).toBeInTheDocument();
	});
});
