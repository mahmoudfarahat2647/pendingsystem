import { describe, expect, it } from "vitest";
import { normalizeMileage, normalizeMileageAsNumber } from "@/lib/utils";

describe("normalizeMileage", () => {
	describe("returns empty string for null/undefined/empty", () => {
		it("returns empty string for null", () => {
			expect(normalizeMileage(null)).toBe("");
		});

		it("returns empty string for undefined", () => {
			expect(normalizeMileage(undefined)).toBe("");
		});

		it("returns empty string for empty string", () => {
			expect(normalizeMileage("")).toBe("");
		});

		it("returns empty string for whitespace-only string", () => {
			expect(normalizeMileage("   ")).toBe("");
			expect(normalizeMileage("\t")).toBe("");
			expect(normalizeMileage("\n")).toBe("");
		});
	});

	describe("strips comma separators", () => {
		it("handles comma-separated: 52,568 -> 52568", () => {
			expect(normalizeMileage("52,568")).toBe("52568");
		});

		it("handles multiple commas: 1,234,567 -> 1234567", () => {
			expect(normalizeMileage("1,234,567")).toBe("1234567");
		});
	});

	describe("strips whitespace separators", () => {
		it("handles space-separated: 52 568 -> 52568", () => {
			expect(normalizeMileage("52 568")).toBe("52568");
		});

		it("handles multiple spaces: 52  568 -> 52568", () => {
			expect(normalizeMileage("52  568")).toBe("52568");
		});
	});

	describe("strips mixed separators", () => {
		it("handles comma and space: 52, 568 -> 52568", () => {
			expect(normalizeMileage("52, 568")).toBe("52568");
		});

		it("handles leading/trailing whitespace: ' 52 568 ' -> 52568", () => {
			expect(normalizeMileage(" 52 568 ")).toBe("52568");
		});

		it("handles tabs and spaces: '52\t568' -> 52568", () => {
			expect(normalizeMileage("52\t568")).toBe("52568");
		});
	});

	describe("handles plain numeric input", () => {
		it("passes through plain number as string", () => {
			expect(normalizeMileage(52568)).toBe("52568");
		});

		it("passes through plain number string", () => {
			expect(normalizeMileage("52568")).toBe("52568");
		});
	});

	describe("edge cases", () => {
		it("handles zero", () => {
			expect(normalizeMileage(0)).toBe("0");
			expect(normalizeMileage("0")).toBe("0");
		});

		it("handles leading zeros", () => {
			expect(normalizeMileage("00123")).toBe("00123");
		});

		it("handles non-numeric characters are preserved", () => {
			expect(normalizeMileage("12ab34")).toBe("12ab34");
		});
	});
});

describe("normalizeMileageAsNumber", () => {
	describe("returns 0 for null/undefined/empty", () => {
		it("returns 0 for null", () => {
			expect(normalizeMileageAsNumber(null)).toBe(0);
		});

		it("returns 0 for undefined", () => {
			expect(normalizeMileageAsNumber(undefined)).toBe(0);
		});

		it("returns 0 for empty string", () => {
			expect(normalizeMileageAsNumber("")).toBe(0);
		});

		it("returns 0 for whitespace-only string", () => {
			expect(normalizeMileageAsNumber("   ")).toBe(0);
		});
	});

	describe("handles separator-formatted mileage", () => {
		it("handles comma-separated: 52,568 -> 52568", () => {
			expect(normalizeMileageAsNumber("52,568")).toBe(52568);
		});

		it("handles space-separated: 52 568 -> 52568", () => {
			expect(normalizeMileageAsNumber("52 568")).toBe(52568);
		});

		it("handles mixed: 52, 568 -> 52568", () => {
			expect(normalizeMileageAsNumber("52, 568")).toBe(52568);
		});
	});

	describe("warranty eligibility thresholds", () => {
		it("99,999 is eligible (below 100k)", () => {
			expect(normalizeMileageAsNumber("99,999")).toBe(99999);
			expect(normalizeMileageAsNumber("99 999")).toBe(99999);
			expect(99999 < 100000).toBe(true);
		});

		it("100,000 is blocked (exactly at threshold)", () => {
			expect(normalizeMileageAsNumber("100,000")).toBe(100000);
			expect(normalizeMileageAsNumber("100 000")).toBe(100000);
		});
	});

	describe("handles plain numeric input", () => {
		it("returns number for numeric string", () => {
			expect(normalizeMileageAsNumber("52568")).toBe(52568);
		});

		it("returns number for number input", () => {
			expect(normalizeMileageAsNumber(52568)).toBe(52568);
		});
	});
});
