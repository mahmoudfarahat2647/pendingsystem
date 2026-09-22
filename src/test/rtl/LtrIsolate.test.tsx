import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LtrIsolate } from "@/components/shared/bidi/LtrIsolate";

describe("LtrIsolate", () => {
	it("forces dir=ltr and bidirectional isolation via CSS only (no injected bidi control characters)", () => {
		const vin = "VF1JZKYK5MY123456";
		const { container } = render(<LtrIsolate>{vin}</LtrIsolate>);

		const el = container.firstElementChild as HTMLElement;
		expect(el.getAttribute("dir")).toBe("ltr");
		expect(el.style.unicodeBidi).toBe("isolate");

		// Copy-to-clipboard fidelity: the rendered text content must be
		// byte-for-byte identical to the source string in both locales — no
		// LRM/RLM or other bidi control characters may be injected.
		expect(el.textContent).toBe(vin);
		expect(el.textContent?.length).toBe(vin.length);
		for (const ch of el.textContent ?? "") {
			const code = ch.codePointAt(0) ?? 0;
			// U+200E (LRM), U+200F (RLM), U+2066-U+2069 (isolate controls)
			expect(
				code === 0x200e ||
					code === 0x200f ||
					(code >= 0x2066 && code <= 0x2069),
			).toBe(false);
		}
	});

	it("renders as a span by default and honors an explicit element type", () => {
		const { container: spanContainer } = render(
			<LtrIsolate>0501234567</LtrIsolate>,
		);
		expect(spanContainer.firstElementChild?.tagName).toBe("SPAN");

		const { container: divContainer } = render(
			<LtrIsolate as="div">TRK-998877</LtrIsolate>,
		);
		expect(divContainer.firstElementChild?.tagName).toBe("DIV");
	});
});
