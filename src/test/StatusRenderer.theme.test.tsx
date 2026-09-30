import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { StatusRenderer } from "@/components/grid/renderers/StatusRenderer";
import { THEME_KEY } from "@/lib/theme";

const renderStatus = () => {
	const props = {
		value: "Ready",
		partStatuses: [{ id: "1", label: "Ready", color: "#FFCC00" }],
	} as unknown as ComponentProps<typeof StatusRenderer>;
	return render(<StatusRenderer {...props} />);
};

describe("StatusRenderer theme presentation", () => {
	beforeEach(() => window.localStorage.clear());

	it("Dark renders the plain configured colour", () => {
		renderStatus();
		const el = screen.getByText("Ready");
		expect(el.style.color).toBe("rgb(255, 204, 0)");
		expect(el.style.backgroundColor).toBe("");
	});

	it("White renders a tinted chip without changing the stored colour", () => {
		window.localStorage.setItem(THEME_KEY, "white");
		renderStatus();
		const el = screen.getByText("Ready");
		expect(el.getAttribute("style")).toContain("color-mix");
		expect(el.style.borderRadius).toBe("4px");
	});
});
