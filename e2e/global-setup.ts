import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type FullConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Load .env.local so AUTH_ADMIN_* vars are available at setup time
loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

const AUTH_FILE = path.resolve(process.cwd(), "e2e/.auth/admin.json");

async function globalSetup(config: FullConfig) {
	// 1. Seed the admin user (idempotent — exits 0 if already exists)
	console.log("\n[global-setup] Seeding admin user...");
	execSync("npm run auth:seed-admin", { stdio: "inherit" });

	// 2. Ensure the storage-state directory exists
	mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

	const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000";
	const username = process.env.AUTH_ADMIN_USERNAME ?? "admin";
	const password = process.env.AUTH_ADMIN_PASSWORD ?? "";

	if (!password) {
		throw new Error(
			"[global-setup] AUTH_ADMIN_PASSWORD is not set. " +
				"Add it to .env.local before running E2E tests.",
		);
	}

	const browser = await chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();

	// Login via Better Auth API (bypasses UI timing entirely)
	// POST /api/auth/sign-in/username is the Better Auth username-plugin endpoint.
	// page.request shares the cookie jar with the browser context,
	// so the session cookie it receives is immediately available to the page.
	console.log("\n[global-setup] Logging in via Better Auth API...");
	const resp = await page.request.post(`${baseURL}/api/auth/sign-in/username`, {
		data: { username, password },
	});

	if (!resp.ok()) {
		const body = await resp.text();
		throw new Error(
			`[global-setup] API login failed (${resp.status()}): ${body}`,
		);
	}

	// Navigate to /dashboard to confirm the session cookie is active and
	// ensure any SSR-set cookies are flushed into the context before we
	// snapshot storage state.
	console.log(`[global-setup] Navigating to ${baseURL}/dashboard...`);
	try {
		await page.goto(`${baseURL}/dashboard`, {
			waitUntil: "domcontentloaded",
			timeout: 60_000,
		});
	} catch (err) {
		console.error(`[global-setup] Navigation to dashboard timed out after 60s. 
            This is likely due to dev server compilation. 
            Check if the server is responsive at ${baseURL}/dashboard.`);
		throw err;
	}
	await context.storageState({ path: AUTH_FILE });
	console.log(`[global-setup] Storage state saved → ${AUTH_FILE}`);

	await browser.close();
}

export default globalSetup;
