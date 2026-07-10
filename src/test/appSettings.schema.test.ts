import { describe, expect, it } from "vitest";
import { AppSettingsPatchSchema } from "@/schemas/appSettings.schema";

describe("AppSettingsPatchSchema", () => {
	it("accepts a valid patch with bounded string arrays", () => {
		const result = AppSettingsPatchSchema.safeParse({
			models: ["Megane", "Duster"],
			repairSystems: ["Mechanical"],
			requesters: ["Sales"],
		});
		expect(result.success).toBe(true);
	});

	it("accepts an empty patch (all fields optional)", () => {
		const result = AppSettingsPatchSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it("rejects a non-array value for models", () => {
		const result = AppSettingsPatchSchema.safeParse({
			models: "Megane",
		});
		expect(result.success).toBe(false);
	});

	it("rejects a non-array value for repairSystems", () => {
		const result = AppSettingsPatchSchema.safeParse({
			repairSystems: { name: "Mechanical" },
		});
		expect(result.success).toBe(false);
	});

	it("rejects an oversized array (over 200 entries)", () => {
		const result = AppSettingsPatchSchema.safeParse({
			models: Array.from({ length: 201 }, (_, i) => `Model ${i}`),
		});
		expect(result.success).toBe(false);
	});

	it("accepts an array at the max bound (200 entries)", () => {
		const result = AppSettingsPatchSchema.safeParse({
			models: Array.from({ length: 200 }, (_, i) => `Model ${i}`),
		});
		expect(result.success).toBe(true);
	});

	it("rejects an oversized string (over 100 chars)", () => {
		const result = AppSettingsPatchSchema.safeParse({
			requesters: ["a".repeat(101)],
		});
		expect(result.success).toBe(false);
	});

	it("accepts a string at the max bound (100 chars)", () => {
		const result = AppSettingsPatchSchema.safeParse({
			requesters: ["a".repeat(100)],
		});
		expect(result.success).toBe(true);
	});
});
