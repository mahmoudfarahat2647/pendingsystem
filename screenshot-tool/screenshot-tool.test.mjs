/**
 * Focused coverage for the screenshot baseline tool's pure seams (issue #341).
 * Capture/compare scripts are I/O-bound Playwright runners; the deterministic
 * contracts (view coverage, seed filtering, diff reporting) live in tested
 * pure modules so two consecutive runs on unchanged code produce no diff.
 */
import { describe, expect, it } from "vitest";
import {
	SEARCH_TERM,
	screenshotFileName,
	VIEWPORTS,
	VIEWS,
} from "./config.mjs";
import {
	DIFF_THRESHOLD,
	expectedFiles,
	formatEntry,
	summarizeResults,
} from "./diff-utils.mjs";
import { resolveRestMock, seedStageCountRows } from "./mock-router.mjs";
import {
	APP_SETTINGS_MOCK,
	countSeedRowsByStage,
	filterSeedRowsByUrl,
	REPORT_SETTINGS_MOCK,
	SEED_ORDERS,
	STORAGE_STATS_MOCK,
} from "./seed-data.mjs";

describe("baseline view coverage", () => {
	const REQUIRED_VIEWS = [
		"dashboard",
		"orders",
		"main-sheet",
		"call-list",
		"booking",
		"archive",
		"freeze",
		"reports",
		"search",
		"settings",
		"dialog",
		"login",
		"forgot-password",
		"reset-password",
		"mobile-order",
	];

	it("covers every in-scope view exactly once", () => {
		const keys = VIEWS.map((view) => view.key);
		expect(keys).toEqual(REQUIRED_VIEWS);
	});

	it("captures both required desktop viewports", () => {
		expect(VIEWPORTS).toHaveLength(2);
		expect(VIEWPORTS).toContainEqual({
			name: "1672x941",
			width: 1672,
			height: 941,
		});
		expect(VIEWPORTS).toContainEqual({
			name: "1440x900",
			width: 1440,
			height: 900,
		});
	});

	it("builds deterministic file names", () => {
		expect(screenshotFileName("dashboard", "1672x941")).toBe(
			"dashboard@1672x941.png",
		);
	});

	it("defines a non-empty search term for the search view", () => {
		expect(SEARCH_TERM.trim().length).toBeGreaterThan(0);
	});
});

describe("seed data determinism", () => {
	it("seeds every operational stage", () => {
		const counts = countSeedRowsByStage();
		for (const stage of [
			"orders",
			"main",
			"call",
			"booking",
			"archive",
			"freeze",
		]) {
			expect(counts[stage] ?? 0).toBeGreaterThan(0);
		}
		expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(
			SEED_ORDERS.length,
		);
	});

	it("filters seed rows by PostgREST stage query", () => {
		const main = filterSeedRowsByUrl(
			"https://x.supabase.co/rest/v1/orders?stage=eq.main&select=*",
		);
		expect(main.length).toBeGreaterThan(0);
		expect(main.every((row) => row.stage === "main")).toBe(true);
	});

	it("returns the full set when no stage filter is present", () => {
		const all = filterSeedRowsByUrl(
			"https://x.supabase.co/rest/v1/orders?select=*",
		);
		expect(all).toHaveLength(SEED_ORDERS.length);
	});

	it("keeps raw rows shaped like the orders select", () => {
		for (const row of SEED_ORDERS) {
			expect(row.id).toBeTruthy();
			expect(row.order_number).toBeTruthy();
			expect(row.stage).toBeTruthy();
			expect(row.created_at).toBeTruthy();
			expect(Array.isArray(row.order_reminders)).toBe(true);
			expect(row.metadata?.parts?.[0]?.partNumber).toBeTruthy();
		}
	});

	it("pins storage, app, and report mocks", () => {
		expect(STORAGE_STATS_MOCK.dataComplete).toBe(true);
		expect(APP_SETTINGS_MOCK.models.length).toBeGreaterThan(0);
		expect(REPORT_SETTINGS_MOCK.frequency).toBeTruthy();
	});
});

describe("diff reporting", () => {
	it("expects every view/viewport pair", () => {
		expect(expectedFiles(VIEWS, VIEWPORTS)).toHaveLength(
			VIEWS.length * VIEWPORTS.length,
		);
	});

	it("passes only when everything is identical", () => {
		const identical = expectedFiles(VIEWS, VIEWPORTS).map((pair) => ({
			...pair,
			status: "identical",
			diffRatio: 0,
		}));
		expect(summarizeResults(identical).exitCode).toBe(0);

		const withDiff = [
			...identical.slice(0, -1),
			{
				...identical[identical.length - 1],
				status: "different",
				diffRatio: 0.5,
			},
		];
		const summary = summarizeResults(withDiff);
		expect(summary.exitCode).toBe(1);
		expect(summary.changed).toBe(1);
	});

	it("fails on missing files", () => {
		const summary = summarizeResults([
			{ view: "dashboard", viewport: "1672x941", status: "missing-current" },
		]);
		expect(summary.exitCode).toBe(1);
		expect(summary.missing).toBe(1);
	});

	it("formats per-view report rows", () => {
		expect(
			formatEntry({
				view: "dashboard",
				viewport: "1672x941",
				status: "identical",
			}),
		).toBe("PASS dashboard@1672x941");
		expect(
			formatEntry({
				view: "orders",
				viewport: "1440x900",
				status: "different",
				diffRatio: 0.02,
			}),
		).toContain("DIFF orders@1440x900");
		expect(DIFF_THRESHOLD).toBeGreaterThan(0);
	});
});

describe("REST/RPC mock dispatch", () => {
	const BASE = "https://x.supabase.co/rest/v1";
	const get = (url, accept) => resolveRestMock({ url, method: "GET", accept });

	it("serves seeded rows for stage fetches (no catch-all shadowing)", () => {
		const response = get(`${BASE}/orders?select=*&stage=eq.main`);
		const rows = JSON.parse(response.body);
		expect(rows.length).toBeGreaterThan(0);
		expect(rows.every((row) => row.stage === "main")).toBe(true);
		expect(rows[0].order_number).toMatch(/^SEED-/);
	});

	it("answers the dashboard stage-count RPC from the seed set", () => {
		const response = resolveRestMock({
			url: `${BASE}/rpc/get_order_stage_counts`,
			method: "POST",
		});
		const rows = JSON.parse(response.body);
		expect(Array.isArray(rows)).toBe(true);
		expect(rows).toEqual(seedStageCountRows());
		const counts = countSeedRowsByStage();
		for (const row of rows) {
			expect(row.row_count).toBe(counts[row.stage]);
		}
		const call = rows.find((row) => row.stage === "call");
		expect(call.call_unique_vehicles).toBeGreaterThan(0);
	});

	it("serves app settings in object and array forms", () => {
		const single = JSON.parse(
			get(`${BASE}/app_settings?select=*`, "application/vnd.pgrst.object+json")
				.body,
		);
		expect(single.models).toEqual(APP_SETTINGS_MOCK.models);
		const list = JSON.parse(get(`${BASE}/app_settings?select=*`).body);
		expect(list[0].id).toBe(1);
	});

	it("returns fixed empty results for any other table or RPC", () => {
		expect(JSON.parse(get(`${BASE}/order_reminders?select=*`).body)).toEqual(
			[],
		);
		expect(
			JSON.parse(
				resolveRestMock({ url: `${BASE}/rpc/anything_else`, method: "POST" })
					.body,
			),
		).toBeNull();
	});
});
