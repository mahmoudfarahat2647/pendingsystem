// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { generateCSV, sanitizeCsvValue } from "../../scripts/csvUtils.mjs";

// Behavioral regression guard for the backup-script CSV path (issue #252).
// Imports the real side-effect-free helpers from scripts/csvUtils.mjs.
// scripts/generate-backup.mjs itself cannot be imported here (top-level
// Supabase/SMTP side effects), so only its wiring is asserted via source read.
describe("csvUtils.mjs backup CSV path (#252)", () => {
	describe("sanitizeCsvValue", () => {
		it("prefixes =, +, -, @ leading chars with a single quote", () => {
			expect(sanitizeCsvValue('=HYPERLINK("http://evil","click")')).toBe(
				'\'=HYPERLINK("http://evil","click")',
			);
			expect(sanitizeCsvValue("+2+3")).toBe("'+2+3");
			expect(sanitizeCsvValue("-2+3")).toBe("'-2+3");
			expect(sanitizeCsvValue("@malicious")).toBe("'@malicious");
		});

		it("leaves normal text, numbers, and empty values untouched", () => {
			expect(sanitizeCsvValue("Brake pad")).toBe("Brake pad");
			expect(sanitizeCsvValue(" =not-leading")).toBe(" =not-leading");
			expect(sanitizeCsvValue(42)).toBe("42");
			expect(sanitizeCsvValue(0)).toBe("0");
			expect(sanitizeCsvValue(false)).toBe("false");
			expect(sanitizeCsvValue(null)).toBe("");
			expect(sanitizeCsvValue(undefined)).toBe("");
		});

		it("serializes objects via JSON.stringify", () => {
			expect(sanitizeCsvValue({ partNumber: "P1" })).toBe(
				'{"partNumber":"P1"}',
			);
		});
	});

	describe("generateCSV", () => {
		it("neutralizes formula payloads and preserves BOM output", () => {
			const csv = generateCSV(
				[
					{
						customerName: '=HYPERLINK("http://evil","click")',
						partNumber: "-2+3",
						requester: "@malicious",
						description: "+2+3",
						note: "Brake pad",
					},
				],
				["customerName", "partNumber", "requester", "description", "note"],
			);

			expect(csv.startsWith("\uFEFF")).toBe(true);
			expect(csv).toContain("\"'=HYPERLINK");
			expect(csv).toContain("'-2+3");
			expect(csv).toContain("'@malicious");
			expect(csv).toContain("'+2+3");
			expect(csv).toContain("Brake pad");
			expect(csv).not.toContain('"=HYPERLINK');
		});

		it("quotes fields containing commas, quotes, newlines, or carriage returns", () => {
			const csv = generateCSV(
				[{ a: "x,y", b: 'say "hi"', c: "l1\nl2", d: "a\rb", e: "plain" }],
				["a", "b", "c", "d", "e"],
			);

			expect(csv.replace(/^\uFEFF/, "").split("\n")[0]).toBe("a,b,c,d,e");
			expect(csv).toContain('"x,y"');
			expect(csv).toContain('"say ""hi"""');
			expect(csv).toContain('"l1\nl2"');
			expect(csv).toContain('"a\rb"');
			expect(csv).toContain(",plain");
		});

		it("renders empty for null/undefined while keeping 0 and false", () => {
			const csv = generateCSV(
				[{ a: null, b: undefined, c: 0, d: false }],
				["a", "b", "c", "d"],
			);

			expect(csv.replace(/^\uFEFF/, "").split("\n")[1]).toBe(",,0,false");
		});
	});

	it("is the implementation wired into generate-backup.mjs (no local duplicate)", () => {
		const script = readFileSync(
			resolve(process.cwd(), "scripts/generate-backup.mjs"),
			"utf8",
		);
		expect(script).toContain('from "./csvUtils.mjs"');
		expect(script).not.toContain("function sanitizeCsvValue(");
		expect(script).not.toContain("function generateCSV(");
	});
});
