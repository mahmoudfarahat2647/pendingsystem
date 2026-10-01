import type { Todo } from "@/domain/todo/todo";
import { createServiceClient } from "@/lib/supabase-admin";
import { mapKeysToCamel } from "@/lib/utils";
import {
	type CreateTodoData,
	TodoSchema,
	type UpdateTodoData,
} from "@/schemas/todo.schema";

/** Server-only access to `public.todos` through the service role (issue #360). */

const TODO_SELECT =
	"id, title, note, due_date, due_time, is_done, done_at, created_at, updated_at";

type ServiceClient = ReturnType<typeof createServiceClient>;

export class TodoNotFoundError extends Error {
	constructor(id: string) {
		super(`Todo ${id} not found`);
		this.name = "TodoNotFoundError";
	}
}

function mapTodoRow(row: unknown): Todo {
	return TodoSchema.parse(mapKeysToCamel(row as Record<string, unknown>));
}

/**
 * Builds the DB patch for an update. Every update refreshes `updated_at`;
 * `done_at` only changes when the patch carries `isDone` (set on true, cleared
 * on false), so editing a done task's text or date keeps its completion time.
 */
export function buildTodoUpdatePatch(
	patch: UpdateTodoData,
	now: Date = new Date(),
): Record<string, unknown> {
	const nowIso = now.toISOString();
	const row: Record<string, unknown> = { updated_at: nowIso };
	if (patch.title !== undefined) row.title = patch.title;
	if (patch.note !== undefined) row.note = patch.note;
	if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
	if (patch.dueTime !== undefined) row.due_time = patch.dueTime;
	if (patch.isDone !== undefined) {
		row.is_done = patch.isDone;
		row.done_at = patch.isDone ? nowIso : null;
	}
	return row;
}

export function createTodoRepository(
	getClient: () => ServiceClient = createServiceClient,
) {
	return {
		async list(): Promise<Todo[]> {
			const { data, error } = await getClient()
				.from("todos")
				.select(TODO_SELECT)
				.order("due_date", { ascending: true })
				.order("created_at", { ascending: true });
			if (error) throw new Error(error.message);
			return (data ?? []).map(mapTodoRow);
		},

		async create(input: CreateTodoData): Promise<Todo> {
			const { data, error } = await getClient()
				.from("todos")
				.insert({
					title: input.title,
					note: input.note,
					due_date: input.dueDate,
					due_time: input.dueTime,
				})
				.select(TODO_SELECT)
				.single();
			if (error) throw new Error(error.message);
			return mapTodoRow(data);
		},

		async update(id: string, patch: UpdateTodoData): Promise<Todo> {
			const { data, error } = await getClient()
				.from("todos")
				.update(buildTodoUpdatePatch(patch))
				.eq("id", id)
				.select(TODO_SELECT)
				.maybeSingle();
			if (error) throw new Error(error.message);
			if (!data) throw new TodoNotFoundError(id);
			return mapTodoRow(data);
		},

		async remove(id: string): Promise<void> {
			const { error, count } = await getClient()
				.from("todos")
				.delete({ count: "exact" })
				.eq("id", id);
			if (error) throw new Error(error.message);
			if ((count ?? 0) === 0) throw new TodoNotFoundError(id);
		},
	};
}

export type TodoRepository = ReturnType<typeof createTodoRepository>;
