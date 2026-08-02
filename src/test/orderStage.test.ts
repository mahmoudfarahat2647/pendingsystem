import { describe, expect, it } from "vitest";
import { normalizeOrderStage, ORDER_STAGE_TAB_INFO } from "@/lib/orderStage";

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

describe("ORDER_STAGE_TAB_INFO", () => {
	it("covers all five stages including archive", () => {
		expect(ORDER_STAGE_TAB_INFO.orders.path).toBe("/orders");
		expect(ORDER_STAGE_TAB_INFO.main.path).toBe("/main-sheet");
		expect(ORDER_STAGE_TAB_INFO.call.path).toBe("/call-list");
		expect(ORDER_STAGE_TAB_INFO.booking.path).toBe("/booking");
		expect(ORDER_STAGE_TAB_INFO.archive).toEqual({
			name: "Archive",
			path: "/archive",
		});
	});
});
