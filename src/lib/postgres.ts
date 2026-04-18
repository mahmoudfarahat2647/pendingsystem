import { Pool } from "pg";
import { parse } from "pg-connection-string";
import {
	DATABASE_CONNECTION_TIMEOUT_MS,
	DATABASE_IDLE_TIMEOUT_MS,
	DATABASE_POOL_MAX,
	DATABASE_QUERY_TIMEOUT_MS,
} from "./constants";

function buildPoolConfig() {
	const sharedConfig = {
		ssl: { rejectUnauthorized: false },
		max: DATABASE_POOL_MAX,
		connectionTimeoutMillis: DATABASE_CONNECTION_TIMEOUT_MS,
		idleTimeoutMillis: DATABASE_IDLE_TIMEOUT_MS,
		query_timeout: DATABASE_QUERY_TIMEOUT_MS,
		statement_timeout: DATABASE_QUERY_TIMEOUT_MS,
		keepAlive: true,
	};

	const url = process.env.DATABASE_URL;
	if (url) {
		const parsed = parse(url);
		return {
			host: parsed.host ?? undefined,
			port: parsed.port ? Number(parsed.port) : 5432,
			database: parsed.database ?? "postgres",
			user: parsed.user ?? undefined,
			password: parsed.password ?? undefined,
			...sharedConfig,
		};
	}
	// Fallback: individual env vars
	return {
		host: process.env.PGHOST,
		port: Number(process.env.PGPORT ?? 5432),
		database: process.env.PGDATABASE ?? "postgres",
		user: process.env.PGUSER,
		password: process.env.PGPASSWORD,
		...sharedConfig,
	};
}

const pool = new Pool(buildPoolConfig());

export { pool };
