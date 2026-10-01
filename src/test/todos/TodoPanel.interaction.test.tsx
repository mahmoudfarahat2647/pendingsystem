import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TodoButton } from "@/components/shared/todos/TodoButton";
import { toLocalDateKey } from "@/domain/booking/bookingInquiry";
import type { Todo } from "@/domain/todo/todo";
import { TODOS_QUERY_KEY } from "@/lib/queryClient";
import { ID_A, ID_B, makeTodo } from "./fixtures";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const service = vi.hoisted(() => ({
	list: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	remove: vi.fn(),
}));
vi.mock("@/services/todos/todoService", () => ({ todoService: service }));

// Radix Switch/Checkbox measure themselves; jsdom has no ResizeObserver.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
globalThis.ResizeObserver ??=
	ResizeObserverStub as unknown as typeof ResizeObserver;

const today = toLocalDateKey(new Date());
let queryClient: QueryClient;

function renderButton(todos: Todo[]) {
	queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false, staleTime: Infinity },
			mutations: { retry: false },
		},
	});
	queryClient.setQueryData(TODOS_QUERY_KEY, todos);
	service.list.mockResolvedValue(todos);
	render(
		<QueryClientProvider client={queryClient}>
			<TodoButton />
		</QueryClientProvider>,
	);
	return userEvent.setup();
}

const trigger = () => screen.getByRole("button", { name: /^To-do list/ });

describe("TodoPanel interactions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		queryClient.clear();
	});

	it("closes on Escape and returns focus to the header button", async () => {
		const user = renderButton([
			makeTodo({ id: ID_A, title: "Call", dueDate: today }),
		]);

		await user.click(trigger());
		expect(await screen.findByText("Call")).toBeInTheDocument();

		await user.keyboard("{Escape}");
		await waitFor(() =>
			expect(screen.queryByText("Call")).not.toBeInTheDocument(),
		);
		expect(trigger()).toHaveFocus();
	});

	it("exposes labelled row controls that are reachable by keyboard", async () => {
		const user = renderButton([
			makeTodo({ id: ID_A, title: "Call", dueDate: today }),
		]);
		await user.click(trigger());

		const checkbox = await screen.findByRole("checkbox", {
			name: 'Mark "Call" as done',
		});
		const edit = screen.getByRole("button", { name: 'Edit "Call"' });
		const del = screen.getByRole("button", { name: 'Delete "Call"' });

		checkbox.focus();
		await user.tab();
		expect(edit).toHaveFocus();
		await user.tab();
		expect(del).toHaveFocus();
		// Revealed on keyboard focus, not only on hover.
		expect(edit.className).toContain("group-focus-within:opacity-100");
		expect(edit.className).toContain("focus-visible:opacity-100");
	});

	it("keeps the add dialog open after the panel closes", async () => {
		const user = renderButton([]);
		await user.click(trigger());
		await user.click(await screen.findByRole("button", { name: "Add task" }));

		const dialog = await screen.findByRole("dialog", { name: /Add task/ });
		expect(dialog).toBeInTheDocument();
		expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
	});

	it("keeps the edit dialog open with the task's values", async () => {
		const user = renderButton([
			makeTodo({ id: ID_A, title: "Call", dueDate: today }),
		]);
		await user.click(trigger());
		await user.click(
			await screen.findByRole("button", { name: 'Edit "Call"' }),
		);

		const dialog = await screen.findByRole("dialog", { name: /Edit task/ });
		expect(within(dialog).getByLabelText("Title")).toHaveValue("Call");
		expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
	});

	it("blocks submit when the title is empty", async () => {
		const user = renderButton([]);
		await user.click(trigger());
		await user.click(await screen.findByRole("button", { name: "Add task" }));
		const dialog = await screen.findByRole("dialog");

		await user.click(within(dialog).getByRole("button", { name: "Add task" }));

		expect(await within(dialog).findByRole("alert")).toHaveTextContent(
			"Title is required",
		);
		expect(service.create).not.toHaveBeenCalled();
	});

	it("has no free-text date field and rejects an impossible date on submit", async () => {
		const user = renderButton([
			makeTodo({ id: ID_A, title: "Legacy", dueDate: "2026-02-30" }),
		]);
		await user.click(trigger());
		await user.click(screen.getByRole("tab", { name: /Today/ }));
		await user.click(
			await screen.findByRole("button", { name: 'Edit "Legacy"' }),
		);
		const dialog = await screen.findByRole("dialog", { name: /Edit task/ });

		// Only Title and Note accept typing; the date comes from the calendar.
		expect(within(dialog).getAllByRole("textbox")).toHaveLength(2);

		await user.click(within(dialog).getByRole("button", { name: "Save" }));
		expect(await within(dialog).findByRole("alert")).toHaveTextContent(
			"real calendar date",
		);
		expect(service.update).not.toHaveBeenCalled();
	});

	it("creates a task from the dialog and returns focus to the button", async () => {
		service.create.mockReturnValue(new Promise(() => {}));
		const user = renderButton([]);
		await user.click(trigger());
		await user.click(await screen.findByRole("button", { name: "Add task" }));
		const dialog = await screen.findByRole("dialog");

		await user.type(
			within(dialog).getByLabelText("Title"),
			"Review freeze tab",
		);
		await user.click(within(dialog).getByRole("button", { name: "Add task" }));

		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		await waitFor(() =>
			expect(service.create).toHaveBeenCalledWith({
				title: "Review freeze tab",
				note: null,
				dueDate: today,
				dueTime: null,
			}),
		);
		await waitFor(() => expect(trigger()).toHaveFocus());
	});

	it("disables a busy row's controls while another row stays usable", async () => {
		service.update.mockReturnValue(new Promise(() => {}));
		const user = renderButton([
			makeTodo({ id: ID_A, title: "First", dueDate: today }),
			makeTodo({ id: ID_B, title: "Second", dueDate: today }),
		]);
		await user.click(trigger());

		await user.click(
			await screen.findByRole("checkbox", { name: 'Mark "First" as done' }),
		);
		// The optimistic tick moves "First" to the Done tab.
		await user.click(screen.getByRole("tab", { name: /Done/ }));

		const busyRow = await waitFor(() => {
			const row = screen
				.getAllByTestId("todo-row")
				.find((r) => r.textContent?.includes("First"));
			expect(row).toHaveAttribute("aria-busy", "true");
			return row as HTMLElement;
		});
		expect(
			within(busyRow).getByRole("button", { name: 'Edit "First"' }),
		).toBeDisabled();
		expect(
			within(busyRow).getByRole("button", { name: 'Delete "First"' }),
		).toBeDisabled();
		expect(within(busyRow).getByRole("checkbox")).toBeDisabled();

		await user.click(screen.getByRole("tab", { name: /Today/ }));
		expect(screen.getByRole("button", { name: 'Edit "Second"' })).toBeEnabled();
		expect(
			screen.getByRole("checkbox", { name: 'Mark "Second" as done' }),
		).toBeEnabled();
	});

	it("disables every control on a temporary (not-yet-created) task", async () => {
		const user = renderButton([
			makeTodo({ id: "temp-123", title: "Saving", dueDate: today }),
		]);
		await user.click(trigger());

		const row = (await screen.findAllByTestId("todo-row"))[0];
		expect(row).toHaveAttribute("aria-busy", "true");
		expect(within(row).getByRole("checkbox")).toBeDisabled();
		expect(
			within(row).getByRole("button", { name: 'Edit "Saving"' }),
		).toBeDisabled();
		expect(
			within(row).getByRole("button", { name: 'Delete "Saving"' }),
		).toBeDisabled();
	});
});
