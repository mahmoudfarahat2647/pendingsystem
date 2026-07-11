import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation hook. Runs once when the server process boots and
 * loads the correct Sentry SDK for the active runtime.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		await import("@/lib/sentry.server.config");
	}

	if (process.env.NEXT_RUNTIME === "edge") {
		await import("@/lib/sentry.edge.config");
	}
}

/**
 * Captures errors thrown during server-side rendering of React Server
 * Components and inside route handlers, which are not surfaced to Sentry
 * automatically in the App Router.
 */
export const onRequestError = Sentry.captureRequestError;
