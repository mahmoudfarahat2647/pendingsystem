import type { Todo } from "@/domain/todo/todo";

export function makeTodo(overrides: Partial<Todo> & { id: string }): Todo {
	return {
		title: `Task ${overrides.id}`,
		note: null,
		dueDate: "2026-10-01",
		dueTime: null,
		isDone: false,
		doneAt: null,
		createdAt: "2026-09-30T08:00:00.000Z",
		updatedAt: "2026-09-30T08:00:00.000Z",
		...overrides,
	};
}

/** Real-looking uuids, since temporary ids are guarded. */
export const ID_A = "00000000-0000-4000-8000-00000000000a";
export const ID_B = "00000000-0000-4000-8000-00000000000b";
