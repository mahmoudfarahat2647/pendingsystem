import type { PostgrestError } from "@supabase/supabase-js";

export class ServiceError extends Error {
	code: string;
	details?: unknown;

	constructor(code: string, message: string, details?: unknown) {
		super(message);
		this.code = code;
		this.details = details;
	}
}

export function isMissingAttachmentColumnError(
	error: PostgrestError | null | undefined,
): boolean {
	if (!error) return false;

	return (
		error.message.includes("schema cache") &&
		(error.message.includes("attachment_link") ||
			error.message.includes("attachment_file_path"))
	);
}

export function handleSupabaseError(error: PostgrestError): never {
	throw new ServiceError(error.code || "DATABASE_ERROR", error.message, {
		hint: error.hint,
		details: error.details,
	});
}
