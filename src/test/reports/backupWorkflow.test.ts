import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const workflow = readFileSync(
	resolve(root, ".github/workflows/backup-reports.yml"),
	"utf8",
);
const packageJson = JSON.parse(
	readFileSync(resolve(root, "package.json"), "utf8"),
) as {
	packageManager?: string;
	dependencies?: Record<string, string>;
};

describe("Backup & Reports workflow contract", () => {
	it("uses the repository's pinned pnpm toolchain and lockfile", () => {
		expect(packageJson.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/);
		expect(existsSync(resolve(root, "pnpm-lock.yaml"))).toBe(true);
		expect(existsSync(resolve(root, "package-lock.json"))).toBe(false);

		expect(workflow).toMatch(/uses:\s+pnpm\/action-setup@v\d+/);
		expect(workflow).toMatch(/cache:\s*['"]pnpm['"]/);
		expect(workflow).toContain("cache-dependency-path: pnpm-lock.yaml");
		expect(workflow).toContain("pnpm install --frozen-lockfile");
	});

	it("does not fall back to npm or install protected dependencies ad hoc", () => {
		expect(workflow).not.toMatch(/cache:\s*['"]npm['"]/);
		expect(workflow).not.toMatch(/\bnpm\s+(?:i|install|ci|ls)\b/);
		expect(packageJson.dependencies?.nodemailer).toBeDefined();
		expect(workflow).toContain("node scripts/generate-backup.mjs");
	});
});
