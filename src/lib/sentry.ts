import * as Sentry from "@sentry/nextjs";

/**
 * Capture an error to Sentry from server-side code (API routes, server actions, etc.)
 * Usage: captureException(error) in API route catch blocks.
 *
 * Reporting is gated by the `enabled` flag in the Sentry init configs
 * (`src/lib/sentry.*.config.ts`), so these helpers are a safe no-op when
 * Sentry is disabled — no extra environment guard is needed here.
 */
export function captureException(
	error: unknown,
	context?: Record<string, unknown>,
) {
	Sentry.captureException(error, {
		contexts: {
			custom: context,
		},
	});
}

/**
 * Capture a message to Sentry with a given level.
 * Usage: captureMessage("Something interesting happened", "info")
 */
export function captureMessage(
	message: string,
	level: "fatal" | "error" | "warning" | "info" | "debug" = "info",
) {
	Sentry.captureMessage(message, level);
}
