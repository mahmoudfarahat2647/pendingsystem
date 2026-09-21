#!/usr/bin/env node
/**
 * Verify database connectivity and required env config.
 * Run: npm run db:verify
 *
 * Troubleshooting contract (see AGENTS.md "Supabase & Database"):
 *  1. Parse .env.local (simple KEY=VALUE, ignore comments/blank lines, strip quotes).
 *  2. Validate DATABASE_URL shape (postgresql:// scheme, host, port 5432, pooler hint).
 *  3. Check required vars (DATABASE_URL + NEXT_PUBLIC_SUPABASE_URL +
 *     NEXT_PUBLIC_SUPABASE_ANON_KEY at minimum).
 *  4. Attempt a bounded `SELECT 1` live check.
 *  5. Print per-table row counts (each guarded so a missing table prints a
 *     clear line instead of crashing).
 *
 * Never prints secrets — passwords in DATABASE_URL are masked.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Bounded timeouts mirror src/lib/postgres.ts constants.
const CONNECTION_TIMEOUT_MS = 10_000;
const QUERY_TIMEOUT_MS = 15_000;

const CORE_TABLES = [
	"orders",
	"order_reminders",
	"report_settings",
	"app_settings",
	"rate_limits",
	"recent_activity",
	"auth_users",
	"auth_sessions",
	"auth_accounts",
	"auth_verifications",
];

const REQUIRED_VARS = [
	"DATABASE_URL",
	"NEXT_PUBLIC_SUPABASE_URL",
	"NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

const POOLER_HOST_HINT = /pooler\.supabase\.com$/i;

function loadEnvFile(filePath) {
	const loaded = {};
	let content;
	try {
		content = readFileSync(filePath, "utf8");
	} catch {
		return null; // file missing — caller reports it
	}
	for (const rawLine of content.split("\n")) {
		// Handle CRLF files as well.
		const line = rawLine.replace(/\r$/, "").trim();
		if (!line || line.startsWith("#")) continue;
		// Support `export KEY=VALUE` too.
		const stripped = line.startsWith("export ")
			? line.slice("export ".length).trim()
			: line;
		const eqIdx = stripped.indexOf("=");
		if (eqIdx === -1) continue;
		const key = stripped.slice(0, eqIdx).trim();
		let value = stripped.slice(eqIdx + 1).trim();
		// Strip one layer of matching surrounding quotes.
		if (
			value.length >= 2 &&
			((value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'")))
		) {
			value = value.slice(1, -1);
		}
		if (key && !(key in loaded)) {
			loaded[key] = value;
		}
	}
	return loaded;
}

/** Mask the password portion of a postgres URL for safe display. */
function maskDatabaseUrl(url) {
	try {
		const parsed = new URL(url);
		if (parsed.password) parsed.password = "***";
		return parsed.toString();
	} catch {
		return "(unparseable DATABASE_URL — see error below)";
	}
}

/**
 * Validate DATABASE_URL shape. Returns { warnings } or exits non-zero
 * with an actionable message when the URL is malformed.
 */
function validateDatabaseUrl(url) {
	const fixHint =
		"Fix: copy the exact connection string from the Supabase Dashboard " +
		"(Project Settings > Database > Connection string, pooler mode). " +
		"If your password contains special characters (@ : / ? # etc.), " +
		"copy the Dashboard string verbatim — it is already URL-encoded.";

	if (!url) {
		console.log("✗ DATABASE_URL is missing.");
		console.log("  Fix: add DATABASE_URL to .env.local (see .env.example).");
		process.exit(1);
	}

	if (!/^postgres(ql)?:\/\//i.test(url)) {
		console.log("✗ DATABASE_URL is malformed: must start with postgresql://");
		console.log(`  Got scheme: "${url.split(":")[0] || "(empty)"}"`);
		console.log(`  ${fixHint}`);
		process.exit(1);
	}

	let parsed;
	try {
		parsed = new URL(url);
	} catch (err) {
		console.log(`✗ DATABASE_URL is malformed: cannot be parsed as a URL.`);
		console.log(`  Detail: ${err.message}`);
		console.log(`  ${fixHint}`);
		process.exit(1);
	}

	if (!parsed.hostname) {
		console.log("✗ DATABASE_URL is malformed: missing host.");
		console.log(`  ${fixHint}`);
		process.exit(1);
	}

	const warnings = [];
	const port = parsed.port || "(default)";
	if (parsed.port && parsed.port !== "5432") {
		warnings.push(
			`DATABASE_URL uses port ${parsed.port}; expected 5432 for the Supabase ` +
				`pooler (host pattern aws-<n>-<region>.pooler.supabase.com). ` +
				`If you intentionally use transaction mode (6543), ignore this.`,
		);
	}
	if (!POOLER_HOST_HINT.test(parsed.hostname)) {
		warnings.push(
			`DATABASE_URL host "${parsed.hostname}" does not match the Supabase ` +
				`pooler pattern aws-<n>-<region>.pooler.supabase.com ` +
				`(port 5432). A wrong pooler host causes ENOTFOUND/getaddrinfo errors.`,
		);
	}
	if (!parsed.username) {
		warnings.push(
			"DATABASE_URL has no username; Supabase pooler URLs need one.",
		);
	}
	if (!parsed.password) {
		warnings.push(
			"DATABASE_URL has no password; expect 28P01 password authentication failures.",
		);
	}

	console.log("✓ DATABASE_URL shape OK");
	console.log(`  host: ${parsed.hostname}`);
	console.log(`  port: ${port}`);
	console.log(
		`  database: ${parsed.pathname.replace(/^\//, "") || "(default)"}`,
	);
	console.log(`  user: ${parsed.username || "(missing)"}`);
	for (const w of warnings) console.log(`  ⚠ ${w}`);
	return { warnings };
}

async function main() {
	console.log("== db:verify ==\n");

	// 1. Parse .env.local
	const envPath = resolve(process.cwd(), ".env.local");
	const fileEnv = loadEnvFile(envPath);
	if (fileEnv === null) {
		console.log(`.env.local not found at ${envPath} — using process env only.`);
	} else {
		for (const [k, v] of Object.entries(fileEnv)) {
			if (!process.env[k]) process.env[k] = v;
		}
		console.log(
			`Loaded ${Object.keys(fileEnv).length} var(s) from .env.local.`,
		);
	}

	// 2. Validate DATABASE_URL shape (fatal on malformed)
	console.log("");
	validateDatabaseUrl(process.env.DATABASE_URL);

	// 3. Check required vars
	console.log("\n-- required vars --");
	const missing = REQUIRED_VARS.filter((k) => !process.env[k]);
	for (const k of REQUIRED_VARS) {
		console.log(
			`${process.env[k] ? "✓" : "✗"} ${k}${process.env[k] ? "" : " (missing)"}`,
		);
	}
	if (process.env.DATABASE_URL) {
		console.log(
			`  (DATABASE_URL value: ${maskDatabaseUrl(process.env.DATABASE_URL)})`,
		);
	}
	if (missing.length > 0) {
		console.log(
			`\n✗ Missing required env var(s): ${missing.join(", ")}. ` +
				`Add them to .env.local (see .env.example).`,
		);
		process.exit(1);
	}

	// 4. Live SELECT 1 with bounded timeout, via pg if available
	console.log("\n-- live connection (SELECT 1) --");
	let Pool;
	try {
		({ Pool } = await import("pg"));
	} catch {
		console.log(
			"⚠ 'pg' package not available, skipping live check. " +
				"Run 'pnpm install' (pg is a repo dependency via src/lib/postgres.ts) " +
				"then re-run npm run db:verify.",
		);
		process.exit(0);
	}

	const pool = new Pool({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED === "true",
		},
		max: 1,
		connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
		idleTimeoutMillis: CONNECTION_TIMEOUT_MS,
		query_timeout: QUERY_TIMEOUT_MS,
		statement_timeout: QUERY_TIMEOUT_MS,
		keepAlive: false,
		allowExitOnIdle: true,
	});

	// Belt-and-braces timeout so a hung socket can't stall the script forever.
	const withTimeout = (promise, ms, label) =>
		Promise.race([
			promise,
			new Promise((_, reject) =>
				setTimeout(
					() => reject(new Error(`${label} timed out after ${ms}ms`)),
					ms,
				),
			),
		]);

	try {
		const res = await withTimeout(
			pool.query("SELECT 1 AS ok"),
			QUERY_TIMEOUT_MS,
			"SELECT 1",
		);
		if (res.rows?.[0]?.ok === 1) {
			console.log("✓ Live check passed: SELECT 1 returned 1.");
		} else {
			console.log(
				"⚠ Live check returned an unexpected result, but the DB is reachable.",
			);
		}
	} catch (err) {
		const msg = err.message || String(err);
		console.log(`✗ Live check failed: ${msg}`);
		if (/ENOTFOUND|getaddrinfo/i.test(msg)) {
			console.log(
				"  Likely cause: wrong pooler host. Use " +
					"aws-<n>-<region>.pooler.supabase.com (this project uses eu-central-1).",
			);
		} else if (/28P01|password authentication failed/i.test(msg)) {
			console.log(
				"  Likely cause: wrong password or malformed DATABASE_URL. " +
					"Copy the exact Supabase Dashboard connection string.",
			);
		} else if (/SASL|invalid password|password.*must.*url-?encode/i.test(msg)) {
			console.log(
				"  Likely cause: special characters in the password that are not " +
					"URL-encoded. Copy the Dashboard-provided string verbatim.",
			);
		} else if (/does not exist/i.test(msg)) {
			console.log("  Detail: a referenced database/user may not exist.");
		}
		await pool.end().catch(() => {});
		process.exit(1);
	}

	// 5. Per-table row counts, each guarded
	console.log("\n-- table row counts --");
	let failures = 0;
	for (const table of CORE_TABLES) {
		try {
			const res = await withTimeout(
				pool.query(`SELECT COUNT(*)::int AS count FROM "${table}"`),
				QUERY_TIMEOUT_MS,
				`COUNT(*) on ${table}`,
			);
			console.log(`✓ ${table}: ${res.rows[0].count} row(s)`);
		} catch (err) {
			failures += 1;
			const msg = err.message || String(err);
			if (/relation .* does not exist|does not exist/i.test(msg)) {
				console.log(`✗ ${table}: table does not exist (${msg.split("\n")[0]})`);
			} else {
				console.log(`✗ ${table}: ${msg.split("\n")[0]}`);
			}
		}
	}

	await pool.end().catch(() => {});

	console.log("");
	if (failures > 0) {
		console.log(
			`Done with ${failures} table check(s) failing — see lines above. ` +
				"Connection itself is OK.",
		);
	} else {
		console.log("All checks passed.");
	}
}

await main();
