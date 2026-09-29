#!/usr/bin/env node
/**
 * Dark screenshot baseline capture (issue #341).
 *
 * One documented command captures every in-scope view at both viewports:
 *
 *   pnpm run screenshots:capture
 *
 * The script logs in with a local test admin, serves a fixed seeded data set
 * through Playwright network interception (never live data), freezes the
 * clock, disables animations, and screenshots each view. Re-run with
 * `--update-baseline` to refresh the committed baseline after review.
 *
 * Environment:
 *   BASE_URL              App origin (default http://localhost:3000).
 *   SCREENSHOT_USERNAME   Test admin username (default "admin").
 *   SCREENSHOT_PASSWORD   Test admin password (required).
 *
 * No production code is touched: all determinism comes from request
 * interception and CSS/JS injected into the test browser context only.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
	FIXED_DATE_ISO,
	MANIFEST_FILE,
	SEARCH_TERM,
	screenshotFileName,
	VIEWPORTS,
	VIEWS,
} from "./config.mjs";
import {
	APP_SETTINGS_MOCK,
	filterSeedRowsByUrl,
	REPORT_SETTINGS_MOCK,
	STORAGE_STATS_MOCK,
} from "./seed-data.mjs";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const USERNAME = process.env.SCREENSHOT_USERNAME ?? "admin";
const PASSWORD = process.env.SCREENSHOT_PASSWORD ?? "";
const UPDATE_BASELINE = process.argv.includes("--update-baseline");
const OUTPUT_DIR = path.join(toolDir, UPDATE_BASELINE ? "baseline" : "current");
const SETTLE_MS = 1200;

function fail(message) {
	console.error(`[screenshots] ERROR: ${message}`);
	process.exit(1);
}

/** Viewport screenshot with motion and caret frozen for determinism. */
async function takeShot(page, outPath) {
	await page.screenshot({
		path: outPath,
		animations: "disabled",
		caret: "hide",
	});
}

/** Record a captured shot in the run manifest. */
function recordShot(manifest, view, viewport, file) {
	manifest.shots.push({ view: view.key, viewport: viewport.name, file });
	console.log(`[screenshots] captured ${file}`);
}

/** JS injected before any page script: frozen clock + no animations. */
function determinismInitScript() {
	const fixedTime = Date.parse(FIXED_DATE_ISO);
	const RealDate = Date;
	class FrozenDate extends RealDate {
		constructor(...args) {
			if (args.length === 0) super(fixedTime);
			else super(...args);
		}
		static now() {
			return fixedTime;
		}
	}
	Object.setPrototypeOf(FrozenDate, RealDate);
	Object.setPrototypeOf(FrozenDate.prototype, RealDate.prototype);
	window.Date = FrozenDate;

	const css = document.createElement("style");
	css.id = "screenshot-determinism";
	css.textContent = [
		"*, *::before, *::after {",
		"  animation-duration: 0s !important;",
		"  animation-delay: 0s !important;",
		"  transition-duration: 0s !important;",
		"  transition-delay: 0s !important;",
		"  scroll-behavior: auto !important;",
		"}",
	].join("\n");
	document.documentElement.appendChild(css);

	const originalMatchMedia = window.matchMedia.bind(window);
	window.matchMedia = (query) => {
		const result = originalMatchMedia(query);
		if (query.includes("prefers-reduced-motion")) {
			Object.defineProperty(result, "matches", { value: true });
		}
		return result;
	};
}

/** Register fixed-data network mocks on a Playwright browser context. */
async function installMocks(context) {
	await context.route("**/rest/v1/orders*", async (route) => {
		const rows = filterSeedRowsByUrl(route.request().url());
		const headers = {
			"content-type": "application/json",
			"content-range": `0-${Math.max(rows.length - 1, 0)}/${rows.length}`,
		};
		await route.fulfill({ status: 200, headers, body: JSON.stringify(rows) });
	});
	await context.route("**/rest/v1/order_reminders*", async (route) => {
		await route.fulfill({
			status: 200,
			headers: { "content-type": "application/json" },
			body: "[]",
		});
	});
	await context.route("**/rest/v1/app_settings*", async (route) => {
		const accept = route.request().headers().accept ?? "";
		const body = accept.includes("vnd.pgrst.object+json")
			? { ...APP_SETTINGS_MOCK }
			: [{ id: 1, ...APP_SETTINGS_MOCK }];
		await route.fulfill({
			status: 200,
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		});
	});
	// Any other Supabase read returns a fixed empty set so notification,
	// follow-up, template, and settings queries cannot leak live data.
	await context.route("**/rest/v1/*", async (route) => {
		if (route.request().method() !== "GET") {
			await route.fulfill({
				status: 200,
				headers: { "content-type": "application/json" },
				body: "{}",
			});
			return;
		}
		await route.fulfill({
			status: 200,
			headers: { "content-type": "application/json" },
			body: "[]",
		});
	});
	await context.route("**/api/storage-stats*", async (route) => {
		await route.fulfill({
			status: 200,
			headers: { "content-type": "application/json" },
			body: JSON.stringify(STORAGE_STATS_MOCK),
		});
	});
	await context.route("**/api/report-settings*", async (route) => {
		await route.fulfill({
			status: 200,
			headers: { "content-type": "application/json" },
			body: JSON.stringify(REPORT_SETTINGS_MOCK),
		});
	});
}

/** Wait for the app shell to settle after navigation. */
async function settle(page, waitFor) {
	await page
		.waitForLoadState("networkidle", { timeout: 30000 })
		.catch(() => {});
	if (waitFor) {
		await page
			.waitForSelector(waitFor, { state: "visible", timeout: 20000 })
			.catch(() => {});
	}
	await page.waitForTimeout(SETTLE_MS);
}

/** Log in with the local test admin; no-op when already authenticated. */
async function ensureLoggedIn(page) {
	await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
	await page
		.waitForLoadState("networkidle", { timeout: 30000 })
		.catch(() => {});
	if (page.url().includes("/dashboard")) return;
	await page.getByLabel("Username").fill(USERNAME);
	await page.getByLabel("Password").fill(PASSWORD);
	await page.getByRole("button", { name: "Sign In" }).click();
	await page.waitForURL("**/dashboard**", { timeout: 30000 });
	await settle(page);
}

/** Clear any persisted theme choice so the app renders its Dark default. */
async function ensureDarkDefault(context) {
	await context.addInitScript(() => {
		try {
			window.localStorage.removeItem("pending-sys-theme");
		} catch {}
	});
}

async function captureRouteView(page, view, outPath) {
	await page.goto(`${BASE_URL}${view.path}`, { waitUntil: "domcontentloaded" });
	await settle(page, "main");
	await takeShot(page, outPath);
}

async function captureSearchView(page, view, outPath) {
	await page.goto(`${BASE_URL}${view.path}`, { waitUntil: "domcontentloaded" });
	await settle(page, "main");
	const search = page.getByPlaceholder("Search system (Cmd+K)...");
	await search.click();
	await search.fill(SEARCH_TERM);
	await page.waitForTimeout(1500);
	await settle(page);
	await takeShot(page, outPath);
	const clear = page.getByLabel("Clear search");
	if (await clear.count()) {
		await clear.first().click();
		await page.waitForTimeout(500);
	}
}

async function captureSettingsView(page, view, outPath) {
	await page.goto(`${BASE_URL}${view.path}`, { waitUntil: "domcontentloaded" });
	await settle(page, "main");
	const profileButton = page.locator("aside div.border-t button").first();
	await profileButton.click();
	await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
	await page.waitForTimeout(800);
	await takeShot(page, outPath);
	await page.keyboard.press("Escape");
	await page.waitForTimeout(500);
}

async function captureDialogView(page, view, outPath) {
	await page.goto(`${BASE_URL}${view.path}`, { waitUntil: "domcontentloaded" });
	await settle(page, ".ag-root");
	const createButton = page.getByLabel("Create order");
	await createButton.first().click();
	await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
	await page.waitForTimeout(800);
	await takeShot(page, outPath);
	await page.keyboard.press("Escape");
	await page.waitForTimeout(500);
}

async function captureWithPage(page, view, outPath) {
	if (view.kind === "search") return captureSearchView(page, view, outPath);
	if (view.kind === "settings") return captureSettingsView(page, view, outPath);
	if (view.kind === "dialog") return captureDialogView(page, view, outPath);
	return captureRouteView(page, view, outPath);
}

async function main() {
	if (!PASSWORD) {
		fail("SCREENSHOT_PASSWORD is required (local test admin password).");
	}
	try {
		await fetch(`${BASE_URL}/login`, { method: "HEAD" });
	} catch {
		fail(
			`App is not reachable at ${BASE_URL}. Start it with "pnpm run dev" first.`,
		);
	}
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });

	const browser = await chromium.launch();
	const manifest = {
		tool: "screenshot-baseline",
		baseUrl: BASE_URL,
		fixedDate: FIXED_DATE_ISO,
		capturedAt: new Date().toISOString(),
		shots: [],
	};
	const failures = [];

	try {
		for (const viewport of VIEWPORTS) {
			const context = await browser.newContext({
				viewport: { width: viewport.width, height: viewport.height },
				deviceScaleFactor: 1,
				reducedMotion: "reduce",
			});
			await ensureDarkDefault(context);
			await context.addInitScript(determinismInitScript);
			await installMocks(context);

			// Authenticated views share one signed-in page.
			const authViews = VIEWS.filter((v) => v.auth);
			const page = await context.newPage();
			try {
				await ensureLoggedIn(page);
			} catch (error) {
				fail(`Login failed for user "${USERNAME}": ${error.message}`);
			}
			for (const view of authViews) {
				const file = screenshotFileName(view.key, viewport.name);
				const outPath = path.join(OUTPUT_DIR, file);
				try {
					await captureWithPage(page, view, outPath);
					recordShot(manifest, view, viewport, file);
				} catch (error) {
					failures.push(`${file}: ${error.message}`);
					console.error(`[screenshots] FAILED ${file}: ${error.message}`);
				}
			}
			await page.close();

			// Public views run signed-out so auth pages render their own layout.
			const publicViews = VIEWS.filter((v) => !v.auth);
			const guest = await context.newPage();
			for (const view of publicViews) {
				const file = screenshotFileName(view.key, viewport.name);
				const outPath = path.join(OUTPUT_DIR, file);
				try {
					await captureRouteView(guest, view, outPath);
					recordShot(manifest, view, viewport, file);
				} catch (error) {
					failures.push(`${file}: ${error.message}`);
					console.error(`[screenshots] FAILED ${file}: ${error.message}`);
				}
			}
			await guest.close();
			await context.close();
		}
	} finally {
		await browser.close();
	}

	fs.writeFileSync(
		path.join(OUTPUT_DIR, MANIFEST_FILE),
		`${JSON.stringify(manifest, null, 2)}\n`,
	);

	if (failures.length > 0) {
		fail(`${failures.length} view(s) failed:\n- ${failures.join("\n- ")}`);
	}
	console.log(
		`[screenshots] done: ${manifest.shots.length} shots in ${OUTPUT_DIR}`,
	);
}

await main();
