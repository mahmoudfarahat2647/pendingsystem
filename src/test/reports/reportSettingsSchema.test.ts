import { describe, expect, it } from "vitest";
import { ReportSettingsPatchSchema } from "@/schemas/reportSettings.schema";

describe("ReportSettingsPatchSchema", () => {
	it("accepts a valid patch with only allowed fields", () => {
		const result = ReportSettingsPatchSchema.safeParse({
			emails: ["a@test.com", "b@test.com"],
			frequency: "Monthly",
			is_enabled: true,
		});
		expect(result.success).toBe(true);
	});

	it("accepts a partial patch with a single allowed field", () => {
		const result = ReportSettingsPatchSchema.safeParse({
			frequency: "Weekly-3",
		});
		expect(result.success).toBe(true);
	});

	it("rejects an empty object-shaped payload with no known keys gracefully", () => {
		const result = ReportSettingsPatchSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it("rejects payloads containing system-managed fields like singleton", () => {
		const result = ReportSettingsPatchSchema.safeParse({
			frequency: "Weekly",
			singleton: true,
		});
		expect(result.success).toBe(false);
	});

	it("rejects payloads containing system-managed fields like last_sent_at", () => {
		const result = ReportSettingsPatchSchema.safeParse({
			last_sent_at: new Date().toISOString(),
		});
		expect(result.success).toBe(false);
	});

	it("rejects payloads attempting to overwrite id", () => {
		const result = ReportSettingsPatchSchema.safeParse({
			id: "some-other-id",
			frequency: "Weekly",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid email addresses in the emails array", () => {
		const result = ReportSettingsPatchSchema.safeParse({
			emails: ["not-an-email"],
		});
		expect(result.success).toBe(false);
	});
});
