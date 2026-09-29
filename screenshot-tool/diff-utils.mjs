/**
 * Pure helpers for the compare script (issue #341). No filesystem or
 * image-decoding side effects here so the logic stays unit-testable.
 */

import { screenshotFileName } from "./config.mjs";

/** Per-pixel difference ratio above which a view counts as changed. */
export const DIFF_THRESHOLD = 0.001;

/** Expected screenshot files for every view/viewport combination. */
export function expectedFiles(views, viewports) {
	const files = [];
	for (const view of views) {
		for (const viewport of viewports) {
			files.push({
				view: view.key,
				viewport: viewport.name,
				file: screenshotFileName(view.key, viewport.name),
			});
		}
	}
	return files;
}

/**
 * Summarize per-view compare outcomes into a process exit code and counts.
 * Each entry: { view, viewport, status, diffRatio } where status is one of
 * "identical" | "different" | "missing-baseline" | "missing-current".
 */
export function summarizeResults(entries) {
	let changed = 0;
	let missing = 0;
	for (const entry of entries) {
		if (entry.status === "different") changed += 1;
		if (
			entry.status === "missing-baseline" ||
			entry.status === "missing-current"
		) {
			missing += 1;
		}
	}
	return {
		total: entries.length,
		changed,
		missing,
		exitCode: changed === 0 && missing === 0 ? 0 : 1,
	};
}

/** One-line human-readable report row for a compare entry. */
export function formatEntry(entry) {
	const label = `${entry.view}@${entry.viewport}`;
	if (entry.status === "identical") return `PASS ${label}`;
	if (entry.status === "different") {
		const pct = ((entry.diffRatio ?? 0) * 100).toFixed(2);
		return `DIFF ${label} (${pct}% pixels differ)`;
	}
	return `${entry.status === "missing-baseline" ? "NO-BASELINE" : "NO-CURRENT"} ${label}`;
}
