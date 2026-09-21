export type LogLevel = "debug" | "warn" | "error";

export interface LogContext {
	requestId?: string;
	traceId?: string;
	[key: string]: unknown;
}

export interface Logger {
	debug: (msg: string, data?: unknown) => void;
	warn: (msg: string, data?: unknown) => void;
	error: (msg: string, err?: unknown) => void;
	/** Return a bound logger that merges `context` into every record. Additive; existing callers are unaffected. */
	child: (context: LogContext) => Logger;
	/** Alias of `child` kept for call-site ergonomics. */
	withContext: (context: LogContext) => Logger;
}

function isProduction(): boolean {
	// Read at call time (not module load) so tests can toggle NODE_ENV per case.
	return process.env.NODE_ENV === "production";
}

function serializeError(err: Error): Record<string, unknown> {
	return { name: err.name, message: err.message, stack: err.stack };
}

/**
 * Deep-convert a value into a JSON-safe shape: Errors become
 * { name, message, stack } and circular refs become "[Circular]".
 * Never throws, so logging can never crash the caller.
 */
function toJsonSafe(value: unknown): unknown {
	const seen = new WeakSet<object>();
	const visit = (current: unknown): unknown => {
		if (current instanceof Error) return serializeError(current);
		if (current === null || typeof current !== "object") return current;
		if (seen.has(current)) return "[Circular]";
		seen.add(current);
		if (Array.isArray(current)) return current.map(visit);
		const out: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(current)) out[key] = visit(val);
		return out;
	};
	try {
		return visit(value);
	} catch {
		return "[Unserializable]";
	}
}

function hasContext(context: LogContext): boolean {
	return Object.keys(context).length > 0;
}

function createLogger(context: LogContext = {}): Logger {
	const bind = (next: LogContext): Logger =>
		createLogger({ ...context, ...next });

	const debug = (msg: string, data?: unknown): void => {
		// Unchanged behavior: debug stays silent in production.
		if (isProduction()) return;
		if (!hasContext(context)) {
			console.debug(msg, data);
			return;
		}
		console.debug(
			msg,
			data === undefined
				? { ...context }
				: { ...context, data: toJsonSafe(data) },
		);
	};

	const warn = (msg: string, data?: unknown): void => {
		if (!isProduction()) {
			if (!hasContext(context)) {
				console.warn(msg, data);
				return;
			}
			console.warn(
				msg,
				data === undefined
					? { ...context }
					: { ...context, data: toJsonSafe(data) },
			);
			return;
		}
		const record: Record<string, unknown> = {
			timestamp: new Date().toISOString(),
			level: "warn",
			message: msg,
			...context,
		};
		if (data !== undefined) record.data = toJsonSafe(data);
		console.warn(JSON.stringify(record));
	};

	const error = (msg: string, err?: unknown): void => {
		if (!isProduction()) {
			if (!hasContext(context)) {
				console.error(msg, err);
				return;
			}
			console.error(
				msg,
				err === undefined
					? { ...context }
					: { ...context, error: toJsonSafe(err) },
			);
			return;
		}
		const record: Record<string, unknown> = {
			timestamp: new Date().toISOString(),
			level: "error",
			message: msg,
			...context,
		};
		if (err !== undefined) record.error = toJsonSafe(err);
		console.error(JSON.stringify(record));
	};

	return { debug, warn, error, child: bind, withContext: bind };
}

export const logger: Logger = createLogger();
