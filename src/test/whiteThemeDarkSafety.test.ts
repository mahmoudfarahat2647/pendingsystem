import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Dark-safety guard for the White theme rollout: in converted files, hardcoded
 * dark-only colours must only appear under the `dark:` variant (Dark values are
 * kept verbatim there). A bare occurrence would leak the Dark colour into White.
 */
const BARE_DARK_LITERALS = [
	"bg-[#0c0c0e]",
	"bg-[#1A1A1A]",
	"bg-white/5",
	"bg-white/10",
	"border-white/5",
	"border-white/10",
	"text-gray-400",
	"text-slate-200",
	"text-slate-400",
];

const CONVERTED_FILES = [
	"src/components/shared/Header.tsx",
	"src/components/shared/HeaderIconButton.tsx",
	"src/components/shared/NotificationsDropdown.tsx",
	"src/components/shared/SidebarUserMenu.tsx",
	"src/components/shared/ClientErrorBoundary.tsx",
	"src/components/ui/skeleton.tsx",
	"src/components/ui/dialog.tsx",
	"src/components/ui/alert-dialog.tsx",
];

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

	it("keeps the Dark scrollbar rules and adds White ones behind :root:not(.dark)", () => {
		const css = readFileSync(
			join(process.cwd(), "src/app/globals.css"),
			"utf8",
		);
		expect(css).toContain("background: rgba(255, 255, 255, 0.1);");
		expect(css).toContain(":root:not(.dark) ::-webkit-scrollbar-thumb");
	});
});
