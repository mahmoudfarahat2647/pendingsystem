import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the icon-package build optimizations wired up in next.config.ts
 * (MAH-46). We assert against the raw source rather than importing the module,
 * because the default export is wrapped in withSentryConfig which runs side
 * effects at import time in the Vitest/node env.
 */
const configSource = readFileSync(
	join(process.cwd(), "next.config.ts"),
	"utf8",
);

describe("next.config.ts icon package optimization", () => {
	it("registers @hugeicons packages in optimizePackageImports", () => {
		expect(configSource).toContain('"@hugeicons/react"');
		expect(configSource).toContain('"@hugeicons/core-free-icons"');
	});

	it("keeps lucide-react in optimizePackageImports", () => {
		expect(configSource).toContain('"lucide-react"');
	});

	it("consolidates lucide-react onto a single mechanism (no modularizeImports)", () => {
		expect(configSource).not.toContain("modularizeImports:");
	});
});
