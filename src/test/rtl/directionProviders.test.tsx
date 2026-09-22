import { useDirection as useBaseDirection } from "@base-ui/react/direction-provider";
import { useDirection as useRadixDirection } from "@radix-ui/react-direction";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { useAppStore } from "@/store/useStore";

/**
 * Proves direction reaches the installed Radix and Base UI primitives through
 * their own supported direction context — never inferred from
 * `document.documentElement.dir` alone (issue #265 acceptance criterion).
 */
function DirectionProbe() {
	const radixDir = useRadixDirection();
	const baseDir = useBaseDirection();
	return (
		<div>
			<span data-testid="radix-dir">{radixDir}</span>
			<span data-testid="base-dir">{baseDir}</span>
		</div>
	);
}

function renderProbe() {
	return render(
		<LocaleProvider>
			<DirectionProbe />
		</LocaleProvider>,
	);
}

describe("Radix/Base UI direction wiring", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("supplies ltr direction context to both primitive libraries for English", () => {
		useAppStore.setState({ locale: "en" });
		renderProbe();

		expect(screen.getByTestId("radix-dir").textContent).toBe("ltr");
		expect(screen.getByTestId("base-dir").textContent).toBe("ltr");
	});

	it("supplies rtl direction context to both primitive libraries for Arabic — via their own APIs, not just document.dir", () => {
		useAppStore.setState({ locale: "ar" });
		renderProbe();

		expect(screen.getByTestId("radix-dir").textContent).toBe("rtl");
		expect(screen.getByTestId("base-dir").textContent).toBe("rtl");
	});
});
