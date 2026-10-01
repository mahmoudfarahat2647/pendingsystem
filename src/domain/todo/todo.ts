/**
 * Header To-Do list domain rules (issue #360). Pure: no React, Supabase or
 * browser APIs.
 *
 * `dueDate` is a local calendar day (`YYYY-MM-DD`) and `dueTime` an optional
 * 24h `HH:mm`, so a task set for "next Sunday" never shifts across timezones.
 */
export interface Todo {
	id: string;
	title: string;
	note: string | null;
	dueDate: string;
	dueTime: string | null;
	isDone: boolean;
	doneAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export type TodoEditableFields = Pick<
	Todo,
	"title" | "note" | "dueDate" | "dueTime"
>;

/**
 * Only the fields the user actually changed, so saving an edit never sends
 * (and overwrites) a field another admin may have changed meanwhile.
 */
export function diffTodoEdit(
	original: TodoEditableFields,
	next: TodoEditableFields,
): Partial<TodoEditableFields> {
	const patch: Partial<TodoEditableFields> = {};
	if (next.title !== original.title) patch.title = next.title;
	if (next.note !== original.note) patch.note = next.note;
	if (next.dueDate !== original.dueDate) patch.dueDate = next.dueDate;
	if (next.dueTime !== original.dueTime) patch.dueTime = next.dueTime;
	return patch;
}

export const TEMPORARY_TODO_ID_PREFIX = "temp-";

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for optimistic ids that have not been confirmed by the server yet. */
export function isTemporaryTodoId(id: string): boolean {
	return id.startsWith(TEMPORARY_TODO_ID_PREFIX);
}

/**
 * Strict `YYYY-MM-DD` check that the day actually exists. Round-trips the
 * parts through a UTC date so `2026-02-30` or `2026-13-01` are rejected.
 */
export function isRealCalendarDate(key: string): boolean {
	const match = DATE_KEY_PATTERN.exec(key);
	if (!match) return false;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));
	return (
		date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day
	);
}

/** An open task due today or earlier. Done tasks never count. */
export function isTodoDueOrOverdue(todo: Todo, todayKey: string): boolean {
	return !todo.isDone && todo.dueDate <= todayKey;
}

export function isTodoOverdue(todo: Todo, todayKey: string): boolean {
	return !todo.isDone && todo.dueDate < todayKey;
}

/** Number of open tasks due today plus overdue ones (the blue header badge). */
export function countDueTodos(todos: readonly Todo[], todayKey: string) {
	return todos.filter((todo) => isTodoDueOrOverdue(todo, todayKey)).length;
}

/**
 * Open tasks first, ordered by due date then time (all-day tasks before timed
 * ones on the same day); done tasks last, most recently completed first.
 */
export function sortTodos(todos: readonly Todo[]): Todo[] {
	return [...todos].sort((a, b) => {
		if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
		if (a.isDone && b.isDone) {
			return (b.doneAt ?? "").localeCompare(a.doneAt ?? "");
		}
		if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
		if (a.dueTime !== b.dueTime) {
			if (a.dueTime === null) return -1;
			if (b.dueTime === null) return 1;
			return a.dueTime.localeCompare(b.dueTime);
		}
		return a.createdAt.localeCompare(b.createdAt);
	});
}

export type TodoTab = "due" | "upcoming" | "done";

/** Which panel tab a task belongs to. */
export function getTodoTab(todo: Todo, todayKey: string): TodoTab {
	if (todo.isDone) return "done";
	return todo.dueDate <= todayKey ? "due" : "upcoming";
}

/** Adds whole calendar days to a `YYYY-MM-DD` key. */
export function addDaysToDateKey(key: string, days: number): string {
	const [year, month, day] = key.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day + days));
	return date.toISOString().slice(0, 10);
}

/** The next Sunday strictly after `key` (a Sunday maps to the following one). */
export function getNextSundayKey(key: string): string {
	const [year, month, day] = key.split("-").map(Number);
	const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
	return addDaysToDateKey(key, weekday === 0 ? 7 : 7 - weekday);
}

export type Meridiem = "AM" | "PM";

export interface TwelveHourTime {
	/** "01"–"12" */
	h: string;
	/** "00"–"59" */
	m: string;
	ampm: Meridiem;
}

/** Stored 24h `HH:mm` → 12h parts for the AM/PM picker. */
export function toTwelveHour(time24: string): TwelveHourTime {
	const [hours, minutes] = time24.split(":").map(Number);
	const ampm: Meridiem = hours >= 12 ? "PM" : "AM";
	const h12 = hours % 12 === 0 ? 12 : hours % 12;
	return {
		h: String(h12).padStart(2, "0"),
		m: String(minutes).padStart(2, "0"),
		ampm,
	};
}

/** 12h picker parts → stored 24h `HH:mm` (12 AM is 00, 12 PM is 12). */
export function fromTwelveHour({ h, m, ampm }: TwelveHourTime): string {
	const h12 = Number(h) % 12;
	const hours = ampm === "PM" ? h12 + 12 : h12;
	return `${String(hours).padStart(2, "0")}:${m}`;
}

/** Stored 24h `HH:mm` → display text such as "2:30 PM". */
export function formatTwelveHour(time24: string): string {
	const { h, m, ampm } = toTwelveHour(time24);
	return `${Number(h)}:${m} ${ampm}`;
}
