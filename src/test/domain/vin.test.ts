import { describe, expect, it } from "vitest";
import { detectModelFromVin } from "@/domain/order/vin";

describe("detectModelFromVin", () => {
	it("returns null for empty string", () => {
		expect(detectModelFromVin("")).toBeNull();
	});

	it("returns null for string shorter than 6 chars", () => {
		expect(detectModelFromVin("VF1RJ")).toBeNull();
	});

	it("returns the model for a known prefix", () => {
		expect(detectModelFromVin("VF1RJA1234567")).toBe("Clio V");
	});

	it("returns null for an unknown prefix", () => {
		expect(detectModelFromVin("ZZZZZZABC1234")).toBeNull();
	});

	it("handles lowercase input by uppercasing before lookup", () => {
		expect(detectModelFromVin("vf1rja1234567")).toBe("Clio V");
	});

	it("returns the model when the input is exactly 6 chars (known prefix)", () => {
		expect(detectModelFromVin("VF1RJA")).toBe("Clio V");
	});

	it("returns correct model for each known prefix", () => {
		expect(detectModelFromVin("VF1RJB000000")).toBe("Captur II");
		expect(detectModelFromVin("VF1RFB000000")).toBe("Megane IV");
		expect(detectModelFromVin("VF1RFE000000")).toBe("Kadjar");
		expect(detectModelFromVin("VF1RFA000000")).toBe("Talisman");
		expect(detectModelFromVin("VF1HJB000000")).toBe("Duster II");
		expect(detectModelFromVin("VF1XJA000000")).toBe("Arkana");
		expect(detectModelFromVin("VF1LJA000000")).toBe("Logan III");
		expect(detectModelFromVin("VF1SJA000000")).toBe("Sandero III");
	});
});
