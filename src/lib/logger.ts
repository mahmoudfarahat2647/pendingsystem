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

interface LogRecord {
	timestamp: string;
	level: LogLevel;
	message: string;
	[key: string]: unknown;
}

function isProduction(): boolean {
	// Read at call time (not module load) so tests can toggle NODE_ENV per case.
	return process.env.NODE_ENV === "production";
}

function serializeError(
	err: Error,
	visit: (value: unknown) => unknown,
): Record<string, unknown> {
	const out: Record<string, unknown> = {
		name: err.name,
		message: err.message,
		stack: err.stack,
	};
	// Preserve extra own-enumerable props (e.g. `code`, `status`).
	for (const [key, val] of Object.entries(err)) {
		if (!(key in out)) out[key] = visit(val);
	}
	const cause = (err as { cause?: unknown }).cause;
	if (cause !== undefined) out.cause = visit(cause);
	if (err instanceof AggregateError && Array.isArray(err.errors)) {
		out.errors = visit(err.errors);
	}
	return out;
}

/**
 * Deep-convert a value into a JSON-safe shape: Errors become
 * { name, message, stack } and circular refs become "[Circular]".
 * Never throws, so logging can never crash the caller.
 */
function toJsonSafe(value: unknown): unknown {
	const seen = new WeakSet<object>();
	const visit = (current: unknown): unknown => {
		if (current instanceof Error) {
			if (seen.has(current)) return "[Circular]";
			seen.add(current);
			try {
				return serializeError(current, visit);
			} finally {
				seen.delete(current);
			}
		}
		if (typeof current === "bigint") return current.toString();
		if (current === null || typeof current !== "object") return current;
		if (seen.has(current)) return "[Circular]";
		seen.add(current);
		try {
			if (current instanceof Date) {
				try {
					return current.toISOString();
				} catch {
					return "[Unserializable]";
				}
			}
			if (current instanceof Map) {
				try {
					return visit(
						Object.fromEntries(
							(current as Map<unknown, unknown>).entries() as Iterable<
								[string, unknown]
							>,
						),
					);
				} catch {
					return "[Unserializable]";
				}
			}
			if (current instanceof Set) {
				try {
					return visit([...current]);
				} catch {
					return "[Unserializable]";
				}
			}
			const maybeJson = current as { toJSON?: unknown };
			if (typeof maybeJson.toJSON === "function") {
				try {
					return visit((maybeJson.toJSON as () => unknown).call(current));
				} catch {
					return "[Unserializable]";
				}
			}
			if (Array.isArray(current)) return current.map(visit);
			const out: Record<string, unknown> = {};
			for (const [key, val] of Object.entries(current)) out[key] = visit(val);
			return out;
		} finally {
			seen.delete(current);
		}
	};
	try {
		return visit(value);
	} catch {
		return "[Unserializable]";
	}
}

function safeStringify(record: LogRecord): string {
	try {
		return JSON.stringify(record);
	} catch {
		try {
			return JSON.stringify({
				timestamp: record.timestamp,
				level: record.level,
				message: record.message,
			});
		} catch {
			return '{"level":"error","message":"log serialization failed"}';
		}
	}
}

function hasContext(context: LogContext): boolean {
	return Object.keys(context).length > 0;
}

/**
 * Production record shape: { timestamp, level, message, ...context, data? | error? }.
 *
 * Record key asymmetry is intentional: `warn` carries its payload under
 * `data` while `error` carries its payload under `error`, so consumers can
 * distinguish routine payloads from failure details without inspecting types.
 */
function createLogger(context: LogContext = {}): Logger {
	const sanitized = toJsonSafe(context);
	const safeContext: LogContext =
		sanitized !== null &&
		typeof sanitized === "object" &&
		!Array.isArray(sanitized)
			? (sanitized as LogContext)
			: {};
	const bind = (next: LogContext): Logger =>
		createLogger({ ...safeContext, ...next });

	const debug = (msg: string, data?: unknown): void => {
		// Unchanged behavior: debug stays silent in production.
		if (isProduction()) return;
		if (!hasContext(safeContext)) {
			console.debug(msg, data);
			return;
		}
		console.debug(
			msg,
			data === undefined
				? { ...safeContext }
				: { ...safeContext, data: toJsonSafe(data) },
		);
	};

	const warn = (msg: string, data?: unknown): void => {
		if (!isProduction()) {
			if (!hasContext(safeContext)) {
				console.warn(msg, data);
				return;
			}
			console.warn(
				msg,
				data === undefined
					? { ...safeContext }
					: { ...safeContext, data: toJsonSafe(data) },
			);
			return;
		}
		const record: LogRecord = {
			...safeContext,
			timestamp: new Date().toISOString(),
			level: "warn",
			message: msg,
		};
		if (data !== undefined) record.data = toJsonSafe(data);
		console.warn(safeStringify(record));
	};

	const error = (msg: string, err?: unknown): void => {
		if (!isProduction()) {
			if (!hasContext(safeContext)) {
				console.error(msg, err);
				return;
			}
			console.error(
				msg,
				err === undefined
					? { ...safeContext }
					: { ...safeContext, error: toJsonSafe(err) },
			);
			return;
		}
		const record: LogRecord = {
			...safeContext,
			timestamp: new Date().toISOString(),
			level: "error",
			message: msg,
		};
		if (err !== undefined) record.error = toJsonSafe(err);
		console.error(safeStringify(record));
	};

	return { debug, warn, error, child: bind, withContext: bind };
}

export const logger: Logger = createLogger();
