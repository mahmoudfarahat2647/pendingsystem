import * as Sentry from "@sentry/nextjs";

/**
 * Client-side Sentry initialization. Next.js loads this file automatically on
 * the client before hydration, so errors thrown during the initial render and
 * the pageload performance transaction are captured.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	environment:
		process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
	enabled: process.env.NODE_ENV === "production",
	tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
	replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
	replaysOnErrorSampleRate: 1.0,
	integrations: [
		Sentry.replayIntegration(),
		Sentry.browserTracingIntegration(),
	],
});

/**
 * Instruments App Router client-side navigations so route changes are recorded
 * as Sentry performance transactions.
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
