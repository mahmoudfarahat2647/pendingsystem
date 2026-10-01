import type { Todo } from "@/domain/todo/todo";
import type { CreateTodoInput, UpdateTodoInput } from "@/schemas/todo.schema";

/** Browser-side client for the authenticated `/api/todos` routes (issue #360). */

async function readError(response: Response): Promise<Error> {
	const err = (await response.json().catch(() => ({}))) as { error?: string };
	return new Error(err.error ?? `Server error: ${response.status}`);
}

export const todoService = {
	async list(): Promise<Todo[]> {
		const response = await fetch("/api/todos");
		if (!response.ok) throw await readError(response);
		return (await response.json()) as Todo[];
	},

	async create(input: CreateTodoInput): Promise<Todo> {
		const response = await fetch("/api/todos", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		});
		if (!response.ok) throw await readError(response);
		return (await response.json()) as Todo;
	},

	async update(id: string, patch: UpdateTodoInput): Promise<Todo> {
		const response = await fetch(`/api/todos/${encodeURIComponent(id)}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(patch),
		});
		if (!response.ok) throw await readError(response);
		return (await response.json()) as Todo;
	},

	async remove(id: string): Promise<void> {
		const response = await fetch(`/api/todos/${encodeURIComponent(id)}`, {
			method: "DELETE",
		});
		if (!response.ok) throw await readError(response);
	},
};
