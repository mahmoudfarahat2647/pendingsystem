import { describe, expect, it } from "vitest";
import {
	addDaysToDateKey,
	countDueTodos,
	formatTwelveHour,
	fromTwelveHour,
	getNextSundayKey,
	getTodoTab,
	isRealCalendarDate,
	isTemporaryTodoId,
	isTodoDueOrOverdue,
	sortTodos,
	toTwelveHour,
} from "@/domain/todo/todo";
import { makeTodo } from "./fixtures";

const TODAY = "2026-10-01";

describe("todo domain", () => {
	it("counts open tasks due today or earlier, never done or future ones", () => {
		const todos = [
			makeTodo({ id: "today", dueDate: TODAY }),
			makeTodo({ id: "overdue", dueDate: "2026-09-30" }),
			makeTodo({ id: "future", dueDate: "2026-10-04" }),
			makeTodo({ id: "done", dueDate: TODAY, isDone: true }),
		];
		expect(countDueTodos(todos, TODAY)).toBe(2);
	});

	it("rolls over at midnight: tomorrow's task becomes due the next day", () => {
		const todo = makeTodo({ id: "t", dueDate: "2026-10-02" });
		expect(isTodoDueOrOverdue(todo, TODAY)).toBe(false);
		expect(isTodoDueOrOverdue(todo, "2026-10-02")).toBe(true);
	});

	it("assigns tabs", () => {
		expect(getTodoTab(makeTodo({ id: "a", dueDate: TODAY }), TODAY)).toBe(
			"due",
		);
		expect(
			getTodoTab(makeTodo({ id: "b", dueDate: "2026-10-05" }), TODAY),
		).toBe("upcoming");
		expect(getTodoTab(makeTodo({ id: "c", isDone: true }), TODAY)).toBe("done");
	});

	it("sorts open by date then time (all-day first), done last", () => {
		const sorted = sortTodos([
			makeTodo({ id: "done", isDone: true, dueDate: "2026-09-01" }),
			makeTodo({ id: "late", dueDate: "2026-10-03" }),
			makeTodo({ id: "timed", dueDate: TODAY, dueTime: "08:00" }),
			makeTodo({ id: "allday", dueDate: TODAY }),
		]);
		expect(sorted.map((t) => t.id)).toEqual([
			"allday",
			"timed",
			"late",
			"done",
		]);
	});

	it("validates real calendar dates", () => {
		expect(isRealCalendarDate("2026-02-30")).toBe(false);
		expect(isRealCalendarDate("2026-13-01")).toBe(false);
		expect(isRealCalendarDate("2026-2-3")).toBe(false);
		expect(isRealCalendarDate("2027-02-29")).toBe(false);
		expect(isRealCalendarDate("2028-02-29")).toBe(true);
		expect(isRealCalendarDate("2026-10-01")).toBe(true);
	});

	it("detects temporary ids", () => {
		expect(isTemporaryTodoId("temp-123")).toBe(true);
		expect(isTemporaryTodoId("2f1e…")).toBe(false);
	});

	it("computes quick dates", () => {
		expect(addDaysToDateKey("2026-12-31", 1)).toBe("2027-01-01");
		// 2026-10-01 is a Thursday.
		expect(getNextSundayKey("2026-10-01")).toBe("2026-10-04");
		// A Sunday maps to the following Sunday.
		expect(getNextSundayKey("2026-10-04")).toBe("2026-10-11");
	});
});

describe("12-hour time helpers", () => {
	it("converts stored 24h times to AM/PM parts", () => {
		expect(toTwelveHour("00:00")).toEqual({ h: "12", m: "00", ampm: "AM" });
		expect(toTwelveHour("09:05")).toEqual({ h: "09", m: "05", ampm: "AM" });
		expect(toTwelveHour("12:30")).toEqual({ h: "12", m: "30", ampm: "PM" });
		expect(toTwelveHour("23:45")).toEqual({ h: "11", m: "45", ampm: "PM" });
	});

	it("converts AM/PM parts back to 24h, round-tripping every time", () => {
		expect(fromTwelveHour({ h: "12", m: "00", ampm: "AM" })).toBe("00:00");
		expect(fromTwelveHour({ h: "12", m: "15", ampm: "PM" })).toBe("12:15");
		expect(fromTwelveHour({ h: "02", m: "30", ampm: "PM" })).toBe("14:30");
		for (let hour = 0; hour < 24; hour++) {
			const time = `${String(hour).padStart(2, "0")}:40`;
			expect(fromTwelveHour(toTwelveHour(time))).toBe(time);
		}
	});

	it("formats a display label", () => {
		expect(formatTwelveHour("14:30")).toBe("2:30 PM");
		expect(formatTwelveHour("00:05")).toBe("12:05 AM");
	});
});
