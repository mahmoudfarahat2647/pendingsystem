import { describe, expect, it } from "vitest";
import {
	type MobileQuickOrderPayload,
	MobileQuickOrderSchema,
} from "@/schemas/mobileOrder.schema";

describe("MobileQuickOrderSchema", () => {
	it("accepts a minimal payload with only company", () => {
		const result = MobileQuickOrderSchema.safeParse({
			company: "Renault",
			parts: [],
		});
		expect(result.success).toBe(true);
	});

	it("normalizes company aliases", () => {
		const result = MobileQuickOrderSchema.safeParse({
			company: "renault",
			parts: [],
		});
		expect(result.success).toBe(true);
		expect(result.data?.company).toBe("Renault");
	});

	it("rejects unknown company values", () => {
		const result = MobileQuickOrderSchema.safeParse({
			company: "Toyota",
			parts: [],
		});
		expect(result.success).toBe(false);
	});

	it("drops fully empty part rows", () => {
		const result = MobileQuickOrderSchema.safeParse({
			company: "Zeekr",
			parts: [
				{ partNumber: "", description: "" },
				{ partNumber: "P001", description: "Brake pad" },
			],
		});
		expect(result.success).toBe(true);
		expect(result.data?.parts).toHaveLength(1);
		expect(result.data?.parts[0].partNumber).toBe("P001");
	});

	it("keeps partially filled part rows (partNumber only)", () => {
		const result = MobileQuickOrderSchema.safeParse({
			company: "Renault",
			parts: [{ partNumber: "P002", description: "" }],
		});
		expect(result.success).toBe(true);
		expect(result.data?.parts).toHaveLength(1);
	});

	it("keeps partially filled part rows (description only)", () => {
		const result = MobileQuickOrderSchema.safeParse({
			company: "Renault",
			parts: [{ partNumber: "", description: "Filter" }],
		});
		expect(result.success).toBe(true);
		expect(result.data?.parts).toHaveLength(1);
	});

	it("preserves an empty parts array (all rows were empty)", () => {
		const result = MobileQuickOrderSchema.safeParse({
			company: "Zeekr",
			parts: [{ partNumber: "", description: "" }],
		});
		expect(result.success).toBe(true);
		expect(result.data?.parts).toHaveLength(0);
	});

	it("all optional identity fields default to empty string", () => {
		const result = MobileQuickOrderSchema.safeParse({
			company: "Zeekr",
			parts: [],
		});
		expect(result.success).toBe(true);
		const d = result.data!;
		expect(d.customerName).toBe("");
		expect(d.vin).toBe("");
		expect(d.mobile).toBe("");
		expect(d.sabNumber).toBe("");
		expect(d.model).toBe("");
		expect(d.repairSystem).toBe("");
	});
});
