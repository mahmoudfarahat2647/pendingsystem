import { NextResponse } from "next/server";

// Standard API Response Types
export interface ApiSuccessResponse<T = unknown> {
	success: true;
	data?: T;
	message?: string;
}

export interface ApiErrorResponse {
	success: false;
	error: {
		code: string; // Machine-readable error code (e.g., "NOT_FOUND", "VALIDATION_ERROR")
		message: string; // Human-readable error message
		details?: unknown; // Optional additional context
	};
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Success response helper
 */
export function successResponse<T>(
	data?: T,
	message?: string,
	status = 200,
): NextResponse<ApiSuccessResponse<T>> {
	return NextResponse.json(
		{
			success: true,
			data,
			message,
		},
		{ status },
	);
}

/**
 * Error response helper
 */
export function errorResponse(
	code: string,
	message: string,
	status = 500,
	details?: unknown,
): NextResponse<ApiErrorResponse> {
	return NextResponse.json(
		{
			success: false,
			error: {
				code,
				message,
				details,
			},
		},
		{ status },
	);
}
