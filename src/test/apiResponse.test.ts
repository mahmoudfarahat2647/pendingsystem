import { describe, expect, it, vi } from "vitest";
import { errorResponse, successResponse } from "../lib/apiResponse";

// Mock Next.js server module
vi.mock("next/server", () => ({
	NextResponse: {
		json: (body: unknown, init?: { status?: number }) => ({
			body,
			status: init?.status ?? 200,
		}),
	},
}));

describe("API Response Helpers", () => {
	describe("successResponse", () => {
		it("should return a basic success response with default status 200", () => {
			const response = successResponse() as unknown as {
				status: number;
				body: unknown;
			};
			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				success: true,
				data: undefined,
				message: undefined,
			});
		});

		it("should return a success response with data and message", () => {
			const data = { id: 1, name: "Test" };
			const message = "Successfully fetched data";
			const response = successResponse(data, message) as unknown as {
				status: number;
				body: unknown;
			};
			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				success: true,
				data,
				message,
			});
		});

		it("should return a success response with a custom status code", () => {
			const response = successResponse(
				undefined,
				undefined,
				201,
			) as unknown as { status: number; body: unknown };
			expect(response.status).toBe(201);
			expect(response.body).toEqual({
				success: true,
				data: undefined,
				message: undefined,
			});
		});
	});

	describe("errorResponse", () => {
		it("should return a basic error response with default status 500", () => {
			const response = errorResponse(
				"INTERNAL_ERROR",
				"An unexpected error occurred",
			) as unknown as { status: number; body: unknown };
			expect(response.status).toBe(500);
			expect(response.body).toEqual({
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "An unexpected error occurred",
					details: undefined,
				},
			});
		});

		it("should return an error response with custom status and details", () => {
			const details = { field: "email", issue: "invalid format" };
			const response = errorResponse(
				"VALIDATION_ERROR",
				"Invalid input",
				400,
				details,
			) as unknown as { status: number; body: unknown };
			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				success: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "Invalid input",
					details,
				},
			});
		});
	});
});
