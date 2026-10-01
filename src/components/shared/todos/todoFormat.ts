import { format } from "date-fns";
import { formatTwelveHour } from "@/domain/todo/todo";

/** `YYYY-MM-DD` → local `Date` at midnight (no UTC shift). */
export function dateKeyToLocalDate(key: string): Date {
	const [year, month, day] = key.split("-").map(Number);
	return new Date(year, month - 1, day);
}

/** e.g. "Sun 4 Oct" or "Sun 4 Oct · 2:30 PM". */
export function formatTodoDue(dueDate: string, dueTime: string | null) {
	const label = format(dateKeyToLocalDate(dueDate), "EEE d MMM");
	return dueTime ? `${label} · ${formatTwelveHour(dueTime)}` : label;
}
