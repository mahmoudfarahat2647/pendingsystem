import * as Sentry from "@sentry/nextjs";

export function initSentryClient() {
	if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
		return;
	}

	Sentry.init({
		dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
		environment: process.env.NODE_ENV,
		enabled: process.env.NODE_ENV === "production",
		tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
		replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
		replaysOnErrorSampleRate: 1.0,
		integrations: [
			Sentry.replayIntegration(),
			Sentry.browserTracingIntegration(),
		],
	});
}
