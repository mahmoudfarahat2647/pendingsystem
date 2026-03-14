import { describe, expect, it } from "vitest";
import { getErrorMessage } from "@/lib/queryCacheHelpers";

describe("getErrorMessage", () => {
	it("extracts message from an Error object", () => {
		const error = new Error("This is a standard error");
		expect(getErrorMessage(error)).toBe("This is a standard error");
	});

	it("extracts message from an object with a message property", () => {
		const error = { message: "Error message property" };
		expect(getErrorMessage(error)).toBe("Error message property");
	});

	it("extracts message from an object with a hint property", () => {
		const error = { hint: "Error hint property" };
		expect(getErrorMessage(error)).toBe("Error hint property");
	});

	it("extracts message from an object with a details property", () => {
		const error = { details: "Error details property" };
		expect(getErrorMessage(error)).toBe("Error details property");
	});

	it("prioritizes message over hint and details", () => {
		const error = { message: "Message", hint: "Hint", details: "Details" };
		expect(getErrorMessage(error)).toBe("Message");
	});

	it("prioritizes hint over details", () => {
		const error = { hint: "Hint", details: "Details" };
		expect(getErrorMessage(error)).toBe("Hint");
	});

	it("falls back to String(error) for non-objects", () => {
		expect(getErrorMessage("Just a string")).toBe("Just a string");
		expect(getErrorMessage(123)).toBe("123");
		expect(getErrorMessage(null)).toBe("null");
		expect(getErrorMessage(undefined)).toBe("undefined");
	});

	it("falls back to String(error) for objects without expected properties", () => {
		expect(getErrorMessage({ foo: "bar" })).toBe("[object Object]");
	});

	it("truncates messages longer than 200 characters", () => {
		const longString = "a".repeat(250);
		const result = getErrorMessage(longString);

		expect(result.length).toBe(200);
		expect(result.endsWith("...")).toBe(true);
		expect(result).toBe(`${"a".repeat(197)}...`);
	});

	it("does not truncate messages exactly 200 characters", () => {
		const exactly200 = "a".repeat(200);
		const result = getErrorMessage(exactly200);

		expect(result.length).toBe(200);
		expect(result.endsWith("...")).toBe(false);
		expect(result).toBe(exactly200);
	});
});
