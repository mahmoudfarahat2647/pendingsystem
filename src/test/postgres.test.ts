import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	DATABASE_CONNECTION_TIMEOUT_MS,
	DATABASE_IDLE_TIMEOUT_MS,
	DATABASE_POOL_MAX,
	DATABASE_QUERY_TIMEOUT_MS,
} from "../lib/constants";

const poolConstructor = vi.hoisted(() => vi.fn());

vi.mock("pg", () => ({
	Pool: vi.fn().mockImplementation(function MockPool(
		this: { options?: Record<string, unknown> },
		config: Record<string, unknown>,
	) {
		poolConstructor(config);
		this.options = config;
	}),
}));

describe("postgres pool configuration", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = {
			...originalEnv,
			DATABASE_URL:
				"postgresql://postgres.project:secret@aws-1-eu-central-1.pooler.supabase.com:5432/postgres",
		};
		poolConstructor.mockReset();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("uses bounded pool sizing and timeouts for auth database access", async () => {
		await import("../lib/postgres");

		expect(poolConstructor).toHaveBeenCalledWith(
			expect.objectContaining({
				host: "aws-1-eu-central-1.pooler.supabase.com",
				port: 5432,
				database: "postgres",
				user: "postgres.project",
				password: "secret",
				ssl: { rejectUnauthorized: false },
				max: DATABASE_POOL_MAX,
				connectionTimeoutMillis: DATABASE_CONNECTION_TIMEOUT_MS,
				idleTimeoutMillis: DATABASE_IDLE_TIMEOUT_MS,
				query_timeout: DATABASE_QUERY_TIMEOUT_MS,
				statement_timeout: DATABASE_QUERY_TIMEOUT_MS,
				keepAlive: true,
				allowExitOnIdle: true,
			}),
		);
	});
});
