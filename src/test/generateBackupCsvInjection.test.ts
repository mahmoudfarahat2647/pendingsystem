import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Node-level regression guard for the backup-script CSV path (issue #252).
// scripts/generate-backup.mjs has top-level side effects (Supabase/SMTP), so it
// cannot be imported here. Instead this asserts the duplicated sanitizer stays
// in sync with `sanitizeCsvField` in src/lib/exportUtils.ts. Functional output
// is verified manually with:
//   node -e "import('node:fs').then(...)" (see PR #259 notes)
const script = readFileSync(
	resolve(process.cwd(), "scripts/generate-backup.mjs"),
	"utf8",
);

describe("generate-backup.mjs CSV formula injection (#252)", () => {
	it("duplicates the TS sanitizer with a pointer comment", () => {
		expect(script).toContain("function sanitizeCsvValue(");
		expect(script).toContain("src/lib/exportUtils.ts");
	});

	it("neutralizes =, +, -, @ leading chars with a single-quote prefix", () => {
		expect(script).toContain('stringVal.startsWith("=")');
		expect(script).toContain('stringVal.startsWith("+")');
		expect(script).toContain('stringVal.startsWith("-")');
		expect(script).toContain('stringVal.startsWith("@")');
		expect(script).toMatch(/return `'\$\{stringVal\}`;/);
	});

	it("routes generateCSV values through the sanitizer and keeps BOM output", () => {
		expect(script).toContain("const stringVal = sanitizeCsvValue(val);");
		expect(script).toContain("\\uFEFF${rows.join(");
	});
});
