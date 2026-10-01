import { describe, expect, it } from "vitest";
import { CreateTodoSchema, UpdateTodoSchema } from "@/schemas/todo.schema";

describe("todo schemas", () => {
	it("accepts a valid task and normalises blanks", () => {
		const parsed = CreateTodoSchema.parse({
			title: "  Call customer  ",
			note: "   ",
			dueDate: "2026-10-04",
		});
		expect(parsed).toEqual({
			title: "Call customer",
			note: null,
			dueDate: "2026-10-04",
			dueTime: null,
		});
	});

	it("rejects empty or too-long titles", () => {
		expect(
			CreateTodoSchema.safeParse({ title: "   ", dueDate: "2026-10-04" })
				.success,
		).toBe(false);
		expect(
			CreateTodoSchema.safeParse({
				title: "x".repeat(201),
				dueDate: "2026-10-04",
			}).success,
		).toBe(false);
	});

	it("rejects impossible or malformed dates", () => {
		for (const dueDate of ["2026-02-30", "2026-13-01", "04/10/2026", ""]) {
			expect(CreateTodoSchema.safeParse({ title: "x", dueDate }).success).toBe(
				false,
			);
		}
	});

	it("validates HH:mm times", () => {
		const base = { title: "x", dueDate: "2026-10-04" };
		expect(
			CreateTodoSchema.safeParse({ ...base, dueTime: "23:59" }).success,
		).toBe(true);
		expect(
			CreateTodoSchema.safeParse({ ...base, dueTime: "24:00" }).success,
		).toBe(false);
		expect(
			CreateTodoSchema.safeParse({ ...base, dueTime: "9:00" }).success,
		).toBe(false);
	});

	it("rejects empty or unknown update patches", () => {
		expect(UpdateTodoSchema.safeParse({}).success).toBe(false);
		expect(UpdateTodoSchema.safeParse({ doneAt: "x" }).success).toBe(false);
		expect(UpdateTodoSchema.safeParse({ isDone: true }).success).toBe(true);
		expect(UpdateTodoSchema.safeParse({ dueDate: "2026-02-30" }).success).toBe(
			false,
		);
	});
});
