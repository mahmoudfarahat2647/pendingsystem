import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { StatusRenderer } from "@/components/grid/renderers/StatusRenderer";

const renderStatus = () => {
	const props = {
		value: "Ready",
		partStatuses: [{ id: "1", label: "Ready", color: "#FFCC00" }],
	} as unknown as ComponentProps<typeof StatusRenderer>;
	return render(<StatusRenderer {...props} />);
};

describe("StatusRenderer theme presentation", () => {
	beforeEach(() => window.localStorage.clear());

	it("passes the stored colour unchanged as --status-color on a .status-chip", () => {
		renderStatus();
		const el = screen.getByText("Ready");
		expect(el.classList.contains("status-chip")).toBe(true);
		expect(el.style.getPropertyValue("--status-color")).toBe("#FFCC00");
	});

	it("scopes the White chip to :root:not(.dark) and keeps plain colour for Dark", () => {
		const css = readFileSync(
			join(process.cwd(), "src/app/globals.css"),
			"utf8",
		);
		expect(css).toMatch(
			/\.status-chip \{\s*color: var\(--status-color\);\s*\}/,
		);
		expect(css).toContain(":root:not(.dark) .status-chip");
	});
});
