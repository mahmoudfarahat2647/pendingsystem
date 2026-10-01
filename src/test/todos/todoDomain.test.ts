import { describe, expect, it } from "vitest";
import {
	addDaysToDateKey,
	countDueTodos,
	getNextSundayKey,
	getTodoTab,
	isRealCalendarDate,
	isTemporaryTodoId,
	isTodoDueOrOverdue,
	sortTodos,
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
