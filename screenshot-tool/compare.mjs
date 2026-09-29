#!/usr/bin/env node
/**
 * Compare the latest capture against the committed Dark baseline (issue #341).
 *
 *   pnpm run screenshots:compare
 *
 * Reads `screenshot-tool/baseline/` (committed reference) and
 * `screenshot-tool/current/` (fresh `screenshots:capture` output), diffs every
 * expected view/viewport pair with pixelmatch, writes visibly-different pairs
 * to `screenshot-tool/diff/`, and prints a per-view report. Exits non-zero
 * when any view differs above threshold or a file is missing on either side,
 * so an unexplained Dark change blocks the merge.
 *
 * Optional flags:
 *   --baseline <dir> --current <dir> --diff <dir>
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { VIEWPORTS, VIEWS } from "./config.mjs";
import {
	DIFF_THRESHOLD,
	expectedFiles,
	formatEntry,
	summarizeResults,
} from "./diff-utils.mjs";

const toolDir = path.dirname(fileURLToPath(import.meta.url));

function flagValue(name) {
	const index = process.argv.indexOf(name);
	return index === -1 ? null : (process.argv[index + 1] ?? null);
}

const BASELINE_DIR = flagValue("--baseline") ?? path.join(toolDir, "baseline");
const CURRENT_DIR = flagValue("--current") ?? path.join(toolDir, "current");
const DIFF_DIR = flagValue("--diff") ?? path.join(toolDir, "diff");

function readPng(filePath) {
	const buffer = fs.readFileSync(filePath);
	return PNG.sync.read(buffer);
}

function comparePair(baselinePath, currentPath, diffPath) {
	const baseline = readPng(baselinePath);
	const current = readPng(currentPath);
	if (baseline.width !== current.width || baseline.height !== current.height) {
		return { status: "different", diffRatio: 1 };
	}
	const diff = new PNG({ width: baseline.width, height: baseline.height });
	const mismatched = pixelmatch(
		baseline.data,
		current.data,
		diff.data,
		baseline.width,
		baseline.height,
		{ threshold: 0.1 },
	);
	const diffRatio = mismatched / (baseline.width * baseline.height);
	if (diffRatio <= DIFF_THRESHOLD) {
		return { status: "identical", diffRatio };
	}
	fs.mkdirSync(path.dirname(diffPath), { recursive: true });
	fs.writeFileSync(diffPath, PNG.sync.write(diff));
	return { status: "different", diffRatio };
}

function main() {
	const pairs = expectedFiles(VIEWS, VIEWPORTS);
	const entries = [];
	for (const pair of pairs) {
		const baselinePath = path.join(BASELINE_DIR, pair.file);
		const currentPath = path.join(CURRENT_DIR, pair.file);
		if (!fs.existsSync(baselinePath)) {
			entries.push({ ...pair, status: "missing-baseline", diffRatio: 1 });
			continue;
		}
		if (!fs.existsSync(currentPath)) {
			entries.push({ ...pair, status: "missing-current", diffRatio: 1 });
			continue;
		}
		const outcome = comparePair(
			baselinePath,
			currentPath,
			path.join(DIFF_DIR, pair.file),
		);
		entries.push({ ...pair, ...outcome });
	}

	for (const entry of entries) {
		console.log(`[screenshots:compare] ${formatEntry(entry)}`);
	}
	const summary = summarizeResults(entries);
	console.log(
		`[screenshots:compare] ${summary.total - summary.changed - summary.missing}/${summary.total} identical, ` +
			`${summary.changed} different, ${summary.missing} missing.`,
	);
	process.exit(summary.exitCode);
}

main();
