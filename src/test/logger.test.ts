import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/logger";

function parseJsonRecord(raw: unknown): Record<string, unknown> {
	expect(typeof raw).toBe("string");
	return JSON.parse(raw as string) as Record<string, unknown>;
}

describe("logger structured logging (#254)", () => {
	let debugSpy: MockInstance;
	let warnSpy: MockInstance;
	let errorSpy: MockInstance;

	beforeEach(() => {
		debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
		warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	it("emits structured JSON with timestamp and level in production", () => {
		vi.stubEnv("NODE_ENV", "production");

		logger.warn("hello", { a: 1 });

		expect(warnSpy).toHaveBeenCalledTimes(1);
		const record = parseJsonRecord(warnSpy.mock.calls[0]?.[0]);
		expect(record.level).toBe("warn");
		expect(record.message).toBe("hello");
		expect(record.data).toEqual({ a: 1 });
		expect(Number.isNaN(Date.parse(record.timestamp as string))).toBe(false);
	});

	it("keeps human-readable output in development", () => {
		vi.stubEnv("NODE_ENV", "development");

		logger.warn("hello");

		expect(warnSpy).toHaveBeenCalledTimes(1);
		const firstArg = warnSpy.mock.calls[0]?.[0];
		expect(firstArg).toBe("hello");
		expect(() => JSON.parse(firstArg as string)).toThrow();
	});

	it("keeps the legacy two-arg call shape working", () => {
		// Development: debug forwards (msg, data) untouched.
		vi.stubEnv("NODE_ENV", "development");
		logger.debug("d", { k: 1 });
		expect(debugSpy).toHaveBeenCalledWith("d", { k: 1 });

		// Production: error serializes Error objects safely.
		vi.stubEnv("NODE_ENV", "production");
		logger.error("boom", new Error("x"));
		expect(errorSpy).toHaveBeenCalledTimes(1);
		const record = parseJsonRecord(errorSpy.mock.calls[0]?.[0]);
		expect(record.level).toBe("error");
		expect(record.message).toBe("boom");
		const errRecord = record.error as Record<string, unknown>;
		expect(errRecord.message).toBe("x");
		expect(typeof errRecord.stack).toBe("string");
	});

	it("never throws on circular data", () => {
		vi.stubEnv("NODE_ENV", "production");
		const circular: Record<string, unknown> = { a: 1 };
		circular.self = circular;

		expect(() => logger.error("circular", circular)).not.toThrow();

		expect(errorSpy).toHaveBeenCalledTimes(1);
		const record = parseJsonRecord(errorSpy.mock.calls[0]?.[0]);
		expect(JSON.stringify(record)).toContain("[Circular]");
	});

	it("child/withContext bind extra fields without affecting the parent", () => {
		vi.stubEnv("NODE_ENV", "production");

		const reqLogger = logger.child({ requestId: "req-1" });
		reqLogger.warn("bound");
		const bound = parseJsonRecord(warnSpy.mock.calls[0]?.[0]);
		expect(bound.requestId).toBe("req-1");
		expect(bound.message).toBe("bound");

		const traced = logger.withContext({ requestId: "req-2", traceId: "t-1" });
		traced.error("traced");
		const tracedRecord = parseJsonRecord(errorSpy.mock.calls[0]?.[0]);
		expect(tracedRecord.requestId).toBe("req-2");
		expect(tracedRecord.traceId).toBe("t-1");

		// The root logger stays unbound.
		logger.warn("plain");
		const plain = parseJsonRecord(warnSpy.mock.calls[1]?.[0]);
		expect(plain.message).toBe("plain");
		expect(plain.requestId).toBeUndefined();
	});

	it("keeps debug silent in production", () => {
		vi.stubEnv("NODE_ENV", "production");

		logger.debug("nope", { a: 1 });

		expect(debugSpy).not.toHaveBeenCalled();
	});
});
