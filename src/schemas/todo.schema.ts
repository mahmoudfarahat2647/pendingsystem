import { z } from "zod";
import { isRealCalendarDate } from "@/domain/todo/todo";

export const TODO_TITLE_MAX = 200;
export const TODO_NOTE_MAX = 1000;

const DueDateSchema = z
	.string()
	.refine(isRealCalendarDate, "Due date must be a real calendar date");

const DueTimeSchema = z
	.string()
	.regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:mm");

const TitleSchema = z
	.string()
	.trim()
	.min(1, "Title is required")
	.max(TODO_TITLE_MAX, `Title must be ${TODO_TITLE_MAX} characters or fewer`);

/** Blank notes are stored as `null`. */
const NoteSchema = z
	.string()
	.trim()
	.max(TODO_NOTE_MAX, `Note must be ${TODO_NOTE_MAX} characters or fewer`)
	.transform((value) => (value.length > 0 ? value : null))
	.nullable();

export const TodoSchema = z.object({
	id: z.string(),
	title: z.string(),
	note: z.string().nullable(),
	dueDate: z.string(),
	dueTime: z.string().nullable(),
	isDone: z.boolean(),
	doneAt: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const CreateTodoSchema = z.object({
	title: TitleSchema,
	note: NoteSchema.optional().default(null),
	dueDate: DueDateSchema,
	dueTime: DueTimeSchema.nullable().optional().default(null),
});

/**
 * Partial patch. `isDone` is only ever sent by the checkbox; the edit form
 * never includes it, so editing a done task keeps its `doneAt`.
 */
export const UpdateTodoSchema = z
	.object({
		title: TitleSchema.optional(),
		note: NoteSchema.optional(),
		dueDate: DueDateSchema.optional(),
		dueTime: DueTimeSchema.nullable().optional(),
		isDone: z.boolean().optional(),
	})
	.strict()
	.refine((patch) => Object.keys(patch).length > 0, "Nothing to update");

export const TodoIdSchema = z.string().uuid();

export type CreateTodoInput = z.input<typeof CreateTodoSchema>;
export type CreateTodoData = z.output<typeof CreateTodoSchema>;
export type UpdateTodoInput = z.input<typeof UpdateTodoSchema>;
export type UpdateTodoData = z.output<typeof UpdateTodoSchema>;
