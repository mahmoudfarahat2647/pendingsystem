import { Pool } from "pg";
import { parse } from "pg-connection-string";

function buildPoolConfig() {
	const url = process.env.DATABASE_URL;
	if (url) {
		const parsed = parse(url);
		return {
			host: parsed.host ?? undefined,
			port: parsed.port ? Number(parsed.port) : 5432,
			database: parsed.database ?? "postgres",
			user: parsed.user ?? undefined,
			password: parsed.password ?? undefined,
			ssl: { rejectUnauthorized: false },
		};
	}
	// Fallback: individual env vars
	return {
		host: process.env.PGHOST,
		port: Number(process.env.PGPORT ?? 5432),
		database: process.env.PGDATABASE ?? "postgres",
		user: process.env.PGUSER,
		password: process.env.PGPASSWORD,
		ssl: { rejectUnauthorized: false },
	};
}

const pool = new Pool(buildPoolConfig());

export { pool };
