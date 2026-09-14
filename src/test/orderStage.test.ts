import { describe, expect, expectTypeOf, it } from "vitest";
import {
	type OrderStage as DomainOrderStage,
	InvalidOrderStageError,
	isOrderStage,
	ORDER_STAGE_VALUES,
} from "@/domain/order/orderStage";
import { ORDER_STAGES } from "@/lib/constants";
import {
	normalizeOrderStage,
	ORDER_STAGE_TAB_INFO,
	resolveOrderStage,
	STAGE_ALIASES,
} from "@/lib/orderStage";
import type { OrderStage as TypesOrderStage } from "@/types";

type Assert<T extends true> = T;
type Eq<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type _TypeParityCheck = Assert<Eq<DomainOrderStage, TypesOrderStage>>;

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
		expect(normalizeOrderStage("freeze")).toBe("freeze");
	});

	it("returns undefined for empty or unknown inputs", () => {
		expect(normalizeOrderStage("")).toBeUndefined();
		expect(normalizeOrderStage("Unknown Stage")).toBeUndefined();
		expect(normalizeOrderStage(null)).toBeUndefined();
		expect(normalizeOrderStage(undefined)).toBeUndefined();
	});
});

describe("resolveOrderStage", () => {
	it("resolves canonical stages including freeze", () => {
		for (const stage of ORDER_STAGE_VALUES) {
			expect(resolveOrderStage(stage)).toBe(stage);
		}
		expect(resolveOrderStage("freeze")).toBe("freeze");
	});

	it("resolves display aliases to canonical stages", () => {
		expect(resolveOrderStage("Main Sheet")).toBe("main");
		expect(resolveOrderStage(" main sheet ")).toBe("main");
		expect(resolveOrderStage("CALL LIST")).toBe("call");
	});

	it("throws InvalidOrderStageError on unknown, empty, or missing stage inputs instead of defaulting to main", () => {
		expect(() => resolveOrderStage("unknown")).toThrow(InvalidOrderStageError);
		expect(() => resolveOrderStage("")).toThrow(InvalidOrderStageError);
		expect(() => resolveOrderStage(null)).toThrow(InvalidOrderStageError);
		expect(() => resolveOrderStage(undefined)).toThrow(InvalidOrderStageError);
	});
});

describe("isOrderStage", () => {
	it("returns true for all ORDER_STAGE_VALUES", () => {
		for (const stage of ORDER_STAGE_VALUES) {
			expect(isOrderStage(stage)).toBe(true);
		}
	});

	it("returns false for non-stage values", () => {
		expect(isOrderStage("unknown")).toBe(false);
		expect(isOrderStage("")).toBe(false);
		expect(isOrderStage(null)).toBe(false);
		expect(isOrderStage(undefined)).toBe(false);
		expect(isOrderStage(123)).toBe(false);
		expect(isOrderStage({})).toBe(false);
	});
});

describe("ORDER_STAGE_TAB_INFO", () => {
	it("covers all six stages including archive and freeze", () => {
		expect(ORDER_STAGE_TAB_INFO.orders.path).toBe("/orders");
		expect(ORDER_STAGE_TAB_INFO.main.path).toBe("/main-sheet");
		expect(ORDER_STAGE_TAB_INFO.call.path).toBe("/call-list");
		expect(ORDER_STAGE_TAB_INFO.booking.path).toBe("/booking");
		expect(ORDER_STAGE_TAB_INFO.archive).toEqual({
			name: "Archive",
			path: "/archive",
		});
		expect(ORDER_STAGE_TAB_INFO.freeze).toEqual({
			name: "Freeze",
			path: "/freeze",
		});
	});
});

describe("stage declaration drift tests", () => {
	it("maintains type parity between domain OrderStage and types OrderStage", () => {
		expectTypeOf<DomainOrderStage>().toEqualTypeOf<TypesOrderStage>();
	});

	it("has exactly the canonical ORDER_STAGE_VALUES as keys of ORDER_STAGE_TAB_INFO", () => {
		expect(Object.keys(ORDER_STAGE_TAB_INFO).sort()).toEqual(
			[...ORDER_STAGE_VALUES].sort(),
		);
	});

	it("ensures all STAGE_ALIASES values are valid canonical stages and every stage is reachable", () => {
		for (const target of Object.values(STAGE_ALIASES)) {
			expect(ORDER_STAGE_VALUES).toContain(target);
		}
		for (const stage of ORDER_STAGE_VALUES) {
			expect(normalizeOrderStage(stage)).toBe(stage);
		}
	});

	it("ensures ORDER_STAGES contains the exact same members as ORDER_STAGE_VALUES", () => {
		expect([...ORDER_STAGES].sort()).toEqual([...ORDER_STAGE_VALUES].sort());
	});
});
