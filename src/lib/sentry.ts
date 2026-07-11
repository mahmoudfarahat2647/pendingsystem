import * as Sentry from "@sentry/nextjs";

/**
 * Capture an error to Sentry from server-side code (API routes, server actions, etc.)
 * Usage: captureException(error) in API route catch blocks
 */
export function captureException(
	error: unknown,
	context?: Record<string, unknown>,
) {
	if (
		process.env.NODE_ENV === "production" &&
		process.env.NEXT_PUBLIC_SENTRY_DSN
	) {
		Sentry.captureException(error, {
			contexts: {
				custom: context,
			},
		});
	}
}

/**
 * Capture a message to Sentry with a given level
 * Usage: captureMessage("Something interesting happened", "info")
 */
export function captureMessage(
	message: string,
	level: "fatal" | "error" | "warning" | "info" | "debug" = "info",
) {
	if (
		process.env.NODE_ENV === "production" &&
		process.env.NEXT_PUBLIC_SENTRY_DSN
	) {
		Sentry.captureMessage(message, level);
	}
}
