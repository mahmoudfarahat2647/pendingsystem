#!/usr/bin/env node
/**
 * Seed script to create the initial admin user.
 * Run: npm run auth:seed-admin
 * Requires .env.local with DATABASE_URL, BETTER_AUTH_URL, BETTER_AUTH_SECRET,
 * AUTH_ADMIN_USERNAME, AUTH_ADMIN_EMAIL, AUTH_ADMIN_PASSWORD, AUTH_ADMIN_NAME
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local manually (dotenv may not be available as a dep)
function loadEnvFile(filePath) {
	try {
		const content = readFileSync(filePath, "utf8");
		for (const line of content.split("\n")) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) continue;
			const eqIdx = trimmed.indexOf("=");
			if (eqIdx === -1) continue;
			const key = trimmed.slice(0, eqIdx).trim();
			const value = trimmed
				.slice(eqIdx + 1)
				.trim()
				.replace(/^["']|["']$/g, "");
			if (key && !process.env[key]) {
				process.env[key] = value;
			}
		}
	} catch {
		// .env.local not found — rely on already-set env vars
	}
}

loadEnvFile(resolve(process.cwd(), ".env.local"));

const required = ["DATABASE_URL", "BETTER_AUTH_URL", "BETTER_AUTH_SECRET"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
	console.error(`Missing required env vars: ${missing.join(", ")}`);
	console.error("Please set them in .env.local");
	process.exit(1);
}

const adminUsername = process.env.AUTH_ADMIN_USERNAME || "admin";
const adminEmail = process.env.AUTH_ADMIN_EMAIL;
const adminPassword = process.env.AUTH_ADMIN_PASSWORD;
const adminName = process.env.AUTH_ADMIN_NAME || "Admin";

if (!adminEmail || !adminPassword) {
	console.error(
		"AUTH_ADMIN_EMAIL and AUTH_ADMIN_PASSWORD must be set in .env.local",
	);
	process.exit(1);
}

// Dynamic import to allow env vars to be set first
const { betterAuth } = await import("better-auth");
const { username } = await import("better-auth/plugins/username");
const { Pool } = await import("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create a local auth instance with sign-up enabled for seeding
const auth = betterAuth({
	database: pool,
	emailAndPassword: {
		enabled: true,
		disableSignUp: false, // Allow sign-up for seeding only
	},
	plugins: [username()],
	user: { modelName: "auth_users" },
	session: { modelName: "auth_sessions" },
	account: { modelName: "auth_accounts" },
	verification: { modelName: "auth_verifications" },
	baseURL: process.env.BETTER_AUTH_URL,
	secret: process.env.BETTER_AUTH_SECRET,
});

// Check if user already exists
const existing = await pool.query(
	"SELECT id, email, username FROM auth_users WHERE email = $1 OR username = $2 LIMIT 1",
	[adminEmail, adminUsername],
);

if (existing.rows.length > 0) {
	const user = existing.rows[0];
	console.log(
		`✓ Admin user already exists: ${user.email} (username: ${user.username})`,
	);
	await pool.end();
	process.exit(0);
}

// Create the admin user
console.log(
	`Creating admin user: ${adminEmail} (username: ${adminUsername})...`,
);

const response = await auth.api.signUpEmail({
	body: {
		email: adminEmail,
		password: adminPassword,
		name: adminName,
		username: adminUsername,
	},
});

if (response?.user) {
	console.log(`✓ Admin user created successfully!`);
	console.log(`  Email: ${adminEmail}`);
	console.log(`  Username: ${adminUsername}`);
	console.log(`  Name: ${adminName}`);
} else {
	console.error("✗ Failed to create admin user");
	console.error(response);
	await pool.end();
	process.exit(1);
}

await pool.end();
