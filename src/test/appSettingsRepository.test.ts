import { describe, expect, it } from "vitest";
import { applyAppSettingsPatch } from "@/services/appSettingsRepository";

describe("applyAppSettingsPatch", () => {
	it("always retains protected repair systems even when omitted from the patch", () => {
		const result = applyAppSettingsPatch({
			repairSystems: ["Mechanical", "Electrical"],
		});

		expect(result.repair_systems).toEqual(["Mechanical", "Electrical", "ضمان"]);
	});

	it("does not duplicate a protected repair system already present in the patch", () => {
		const result = applyAppSettingsPatch({
			repairSystems: ["Mechanical", "ضمان"],
		});

		expect(result.repair_systems).toEqual(["Mechanical", "ضمان"]);
	});

	it("does not touch repair_systems when repairSystems is absent from the patch", () => {
		const result = applyAppSettingsPatch({ models: ["Megane"] });

		expect(result.repair_systems).toBeUndefined();
		expect(result.models).toEqual(["Megane"]);
	});

	it("maps models and requesters onto their snake_case columns", () => {
		const result = applyAppSettingsPatch({
			models: ["Megane", "Duster"],
			requesters: ["Sales", "Warranty"],
		});

		expect(result.models).toEqual(["Megane", "Duster"]);
		expect(result.requesters).toEqual(["Sales", "Warranty"]);
	});

	it("always sets updated_at", () => {
		const result = applyAppSettingsPatch({});

		expect(typeof result.updated_at).toBe("string");
	});

	it("leaves fields entirely absent from updatePayload when omitted from the patch", () => {
		const result = applyAppSettingsPatch({});

		expect(result.models).toBeUndefined();
		expect(result.repair_systems).toBeUndefined();
		expect(result.requesters).toBeUndefined();
	});
});
