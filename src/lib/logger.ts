/**
 * Production-ready logging utility.
 *
 * Provides structured logging with different levels:
 * - debug: Detailed debug information
 * - info: General information
 * - warn: Warning messages
 * - error: Error messages
 *
 * In production, logs are formatted as JSON for easier parsing by log aggregation tools.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
	level: LogLevel;
	message: string;
	timestamp: string;
	context?: Record<string, unknown>;
	stack?: string;
}

/**
 * Format log entry as JSON in production, human-readable in development
 */
function formatLogEntry(entry: LogEntry): string {
	const isProduction = process.env.NODE_ENV === "production";

	if (isProduction) {
		return JSON.stringify({
			...entry,
			service: "pendingsystem",
			version: process.env.npm_package_version || "unknown",
		});
	}

	// Development-friendly format with colors
	const colors: Record<LogLevel, string> = {
		debug: "\x1b[36m", // Cyan
		info: "\x1b[32m", // Green
		warn: "\x1b[33m", // Yellow
		error: "\x1b[31m", // Red
	};

	const reset = "\x1b[0m";
	const color = colors[entry.level];

	const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";

	return `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} - ${entry.message}${contextStr}`;
}

/**
 * Create a logger function for a specific level
 */
function createLogger(level: LogLevel) {
	return (message: string, context?: Record<string, unknown>) => {
		const entry: LogEntry = {
			level,
			message,
			timestamp: new Date().toISOString(),
			context,
		};

		// Add stack trace for errors
		if (level === "error" && context?.error instanceof Error) {
			entry.stack = context.error.stack;
		}

		const formatted = formatLogEntry(entry);

		// Use console methods for proper log level handling
		switch (level) {
			case "debug":
				console.debug(formatted);
				break;
			case "info":
				console.info(formatted);
				break;
			case "warn":
				console.warn(formatted);
				break;
			case "error":
				console.error(formatted);
				break;
		}
	};
}

/**
 * Structured logger for the application
 */
export const logger = {
	debug: createLogger("debug"),
	info: createLogger("info"),
	warn: createLogger("warn"),
	error: createLogger("error"),

	/**
	 * Log API requests with timing information
	 */
	logRequest: (req: Request, duration: number, status: number) => {
		const isProduction = process.env.NODE_ENV === "production";

		const logData = {
			method: req.method,
			url: req.url,
			duration: `${duration}ms`,
			status,
			ip: req.headers.get("x-forwarded-for") || "unknown",
			userAgent: req.headers.get("user-agent") || "unknown",
		};

		if (isProduction) {
			logger.info("API Request", logData);
		} else {
			console.log(`→ ${req.method} ${req.url} ${status} (${duration}ms)`);
		}
	},
};

/**
 * Performance timing utility
 */
export function measure<T>(fn: () => T, label: string): T {
	const start = performance.now();
	try {
		return fn();
	} finally {
		const duration = performance.now() - start;
		logger.debug(`${label} took ${duration.toFixed(2)}ms`);
	}
}

/**
 * Async performance timing utility
 */
export async function measureAsync<T>(
	fn: () => Promise<T>,
	label: string,
): Promise<T> {
	const start = performance.now();
	try {
		return await fn();
	} finally {
		const duration = performance.now() - start;
		logger.debug(`${label} took ${duration.toFixed(2)}ms`);
	}
}
