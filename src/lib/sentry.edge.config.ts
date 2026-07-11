import * as Sentry from "@sentry/nextjs";

/**
 * Edge runtime Sentry initialization (middleware and edge route handlers).
 * Loaded by `register()` in `src/instrumentation.ts`; importing this module
 * runs init.
 */
Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	environment:
		process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
	enabled: process.env.NODE_ENV === "production",
	tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
