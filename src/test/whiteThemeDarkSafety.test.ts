import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Dark-safety guard for the White theme rollout: in converted files, hardcoded
 * dark-only colours must only appear under the `dark:` variant (Dark values are
 * kept verbatim there). A bare occurrence would leak the Dark colour into White.
 */
const BARE_DARK_LITERALS = [
	"bg-[#0c0c0e]",
	"bg-[#0a0a0b]",
	"bg-[#141416]",
	"bg-[#1A1A1A]",
	"bg-[#1c1c1e]",
	"bg-[#2c2c2e]",
	"bg-[#3c3c3e]",
	"bg-white/5",
	"bg-white/10",
	"border-white/5",
	"border-white/10",
	"border-white/20",
	"text-gray-400",
	"text-slate-200",
	"text-slate-300",
	"text-slate-400",
];

/** Intentionally dark in both themes, or converted in a later PR. */
const EXEMPT = [
	"src/components/shared/Sidebar.tsx", // black in both themes (reference design)
	"src/app/global-error.tsx", // catastrophic-error fallback, outside providers
	"src/hooks/useDraftSession.tsx", // self-contained dark recovery toast
	"src/app/mobile-order/", // always Dark
	"src/components/mobile-order/",
];

const listSourceFiles = (dir: string): string[] =>
	readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			return entry.name === "test" ? [] : listSourceFiles(full);
		}
		return full.endsWith(".tsx") ? [full] : [];
	});

const CONVERTED_FILES = listSourceFiles(join(process.cwd(), "src"))
	.map((f) => relative(process.cwd(), f).split(sep).join("/"))
	.filter((f) => !EXEMPT.some((prefix) => f.startsWith(prefix)));

const bareTokens = (source: string, literal: string) => {
	const escaped = literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const re = new RegExp(
		`(?<![\\w:\\[\\]#./%()-])${escaped}(?![\\w\\[\\]/.-])`,
		"g",
	);
	return source.match(re) ?? [];
};

describe("White theme dark-safety (converted shell files)", () => {
	for (const file of CONVERTED_FILES) {
		it(`${file} has no bare dark-only colour literals`, () => {
			const source = readFileSync(join(process.cwd(), file), "utf8");
			for (const literal of BARE_DARK_LITERALS) {
				expect(bareTokens(source, literal), `${file}: ${literal}`).toEqual([]);
			}
		});
	}

	it("dashboard uses hero.png in White and keeps the Dark hero asset and 460px height", () => {
		const page = readFileSync(
			join(process.cwd(), "src/app/(app)/dashboard/page.tsx"),
			"utf8",
		);
		expect(page).toContain("bg-[url('/hero.png')]");
		expect(page).toContain("dark:bg-[url('/dashboard-car.webp')]");
		// Same fixed 460px hero in both themes, so the dashboard fits one screen.
		expect(page).toContain(" h-[460px] ");
		expect(page).not.toContain("aspect-[2027/776]");
		expect(page).toContain("dark:bg-cover dark:bg-center");
		// Decorative tiles/calendar must not look actionable in White.
		expect(page).toContain("hidden dark:block");
		expect(page).toContain("dark:cursor-pointer");
	});

	it("keeps the Dark scrollbar rules and adds White ones behind :root:not(.dark)", () => {
		const css = readFileSync(
			join(process.cwd(), "src/app/globals.css"),
			"utf8",
		);
		expect(css).toContain("background: rgba(255, 255, 255, 0.1);");
		expect(css).toContain(":root:not(.dark) ::-webkit-scrollbar-thumb");
	});
});

describe("White theme grid cell contrast", () => {
	it("green cell colours read a White-only CSS variable and fall back to the Dark value", () => {
		const css = readFileSync(
			join(process.cwd(), "src/app/globals.css"),
			"utf8",
		);
		expect(css).toMatch(/:root:not\(\.dark\)\s*\{\s*--grid-positive: #15803d;/);
		for (const file of [
			"src/components/shared/GridConfig.tsx",
			"src/components/grid/renderers/MobileCellRenderer.tsx",
			"src/app/(app)/archive/page.tsx",
		]) {
			const source = readFileSync(join(process.cwd(), file), "utf8");
			expect(source, file).toContain("var(--grid-positive, #22c55e)");
			expect(source, file).not.toMatch(/color: "#22c55e"/);
		}
	});
});

describe("Sidebar White redesign keeps Dark verbatim", () => {
	const sidebar = readFileSync(
		join(process.cwd(), "src/components/shared/Sidebar.tsx"),
		"utf8",
	);

	it("keeps the original Dark container and active-tab classes under dark:", () => {
		expect(sidebar).toContain("dark:bg-black/80");
		expect(sidebar).toContain("dark:bg-renault-yellow");
		expect(sidebar).toContain("dark:text-black");
		expect(sidebar).toContain("dark:font-bold");
		expect(sidebar).toContain("dark:shadow-[0_0_20px_rgba(255,204,0,0.2)]");
		expect(sidebar).toContain("dark:rounded-none");
		expect(sidebar).toContain("dark:border-r");
	});

	it("uses the charcoal rounded shell and yellow accent pill only in White", () => {
		expect(sidebar).toContain("bg-[#1f2328]");
		expect(sidebar).toContain("rounded-r-[28px]");
		expect(sidebar).toContain("bg-renault-yellow/10");
		expect(sidebar).toMatch(/bg-renault-yellow dark:hidden/);
	});
});
