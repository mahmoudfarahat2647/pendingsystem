/**
 * Pure dispatcher for intercepted Supabase REST/RPC requests (issue #341).
 *
 * The capture script routes every `/rest/v1/**` request through this single
 * function, so route registration order can never let a catch-all shadow a
 * seeded response, and no REST or RPC call reaches the live project.
 */
import {
	APP_SETTINGS_MOCK,
	filterSeedRowsByUrl,
	SEED_ORDERS,
} from "./seed-data.mjs";

const JSON_HEADERS = { "content-type": "application/json" };

function json(body, extraHeaders = {}) {
	return {
		status: 200,
		headers: { ...JSON_HEADERS, ...extraHeaders },
		body: JSON.stringify(body),
	};
}

/**
 * Rows in the `get_order_stage_counts` RPC shape
 * (`{ stage, row_count, call_unique_vehicles }`), computed from the seed set.
 */
export function seedStageCountRows() {
	const byStage = new Map();
	for (const row of SEED_ORDERS) {
		const entry = byStage.get(row.stage) ?? { count: 0, vins: new Set() };
		entry.count += 1;
		if (row.vin) entry.vins.add(row.vin);
		byStage.set(row.stage, entry);
	}
	return [...byStage.entries()].map(([stage, { count, vins }]) => ({
		stage,
		row_count: count,
		call_unique_vehicles: stage === "call" ? vins.size : 0,
	}));
}

/**
 * Resolve the mocked response for one intercepted `/rest/v1/...` request.
 * @param {{ url: string, method: string, accept?: string }} request
 * @returns {{ status: number, headers: Record<string,string>, body: string }}
 */
export function resolveRestMock({ url, method, accept = "" }) {
	let pathname = "";
	try {
		pathname = new URL(url, "http://localhost").pathname;
	} catch {
		pathname = "";
	}
	const resource = pathname.split("/rest/v1/")[1] ?? "";

	if (resource === "rpc/get_order_stage_counts") {
		return json(seedStageCountRows());
	}
	if (resource.startsWith("rpc/")) {
		// Any other RPC gets a fixed empty result, never the live project.
		return json(null);
	}
	if (method !== "GET" && method !== "HEAD") {
		return json([]);
	}
	if (resource === "orders") {
		const rows = filterSeedRowsByUrl(url);
		return json(rows, {
			"content-range": `0-${Math.max(rows.length - 1, 0)}/${rows.length}`,
		});
	}
	if (resource === "app_settings") {
		return json(
			accept.includes("vnd.pgrst.object+json")
				? { ...APP_SETTINGS_MOCK }
				: [{ id: 1, ...APP_SETTINGS_MOCK }],
		);
	}
	// order_reminders, notifications, follow-ups, templates, and any other
	// read return a fixed empty set so live data cannot leak into a shot.
	return json([]);
}
