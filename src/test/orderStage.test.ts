import { describe, expect, it } from "vitest";
import { normalizeOrderStage } from "@/lib/orderStage";

describe("normalizeOrderStage", () => {
	it("maps display labels to canonical stages", () => {
		expect(normalizeOrderStage("Main Sheet")).toBe("main");
		expect(normalizeOrderStage(" main sheet ")).toBe("main");
		expect(normalizeOrderStage("CALL LIST")).toBe("call");
	});

	it("passes canonical stages through unchanged", () => {
		expect(normalizeOrderStage("main")).toBe("main");
		expect(normalizeOrderStage("orders")).toBe("orders");
		expect(normalizeOrderStage("booking")).toBe("booking");
		expect(normalizeOrderStage("call")).toBe("call");
		expect(normalizeOrderStage("archive")).toBe("archive");
	});

	it("returns undefined for empty or unknown inputs", () => {
		expect(normalizeOrderStage("")).toBeUndefined();
		expect(normalizeOrderStage("Unknown Stage")).toBeUndefined();
		expect(normalizeOrderStage(null)).toBeUndefined();
		expect(normalizeOrderStage(undefined)).toBeUndefined();
	});
});
