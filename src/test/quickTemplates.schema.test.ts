import { describe, expect, it } from "vitest";
import {
	AddTemplateSchema,
	QuickTemplateScopeSchema,
} from "@/schemas/quickTemplates.schema";

describe("QuickTemplateScopeSchema", () => {
	it("accepts a note category with a stage", () => {
		const result = QuickTemplateScopeSchema.safeParse({
			category: "note",
			stage: "booking",
		});
		expect(result.success).toBe(true);
	});

	it("rejects a note category without a stage", () => {
		const result = QuickTemplateScopeSchema.safeParse({ category: "note" });
		expect(result.success).toBe(false);
	});

	it("accepts a reminder category without a stage", () => {
		const result = QuickTemplateScopeSchema.safeParse({
			category: "reminder",
		});
		expect(result.success).toBe(true);
	});

	it("accepts a reason category without a stage", () => {
		const result = QuickTemplateScopeSchema.safeParse({ category: "reason" });
		expect(result.success).toBe(true);
	});

	it("rejects a reminder category with a stage", () => {
		const result = QuickTemplateScopeSchema.safeParse({
			category: "reminder",
			stage: "archive",
		});
		expect(result.success).toBe(false);
	});

	it("rejects a reason category with a stage", () => {
		const result = QuickTemplateScopeSchema.safeParse({
			category: "reason",
			stage: "freeze",
		});
		expect(result.success).toBe(false);
	});

	it("rejects an invalid category", () => {
		const result = QuickTemplateScopeSchema.safeParse({
			category: "invalid",
		});
		expect(result.success).toBe(false);
	});
});

describe("AddTemplateSchema", () => {
	it("accepts a note template with text and stage", () => {
		const result = AddTemplateSchema.safeParse({
			category: "note",
			text: "Confirmed",
			stage: "booking",
		});
		expect(result.success).toBe(true);
	});

	it("rejects a note template with text but no stage", () => {
		const result = AddTemplateSchema.safeParse({
			category: "note",
			text: "Confirmed",
		});
		expect(result.success).toBe(false);
	});

	it("accepts a reason template with text and no stage", () => {
		const result = AddTemplateSchema.safeParse({
			category: "reason",
			text: "Not arrived",
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty text", () => {
		const result = AddTemplateSchema.safeParse({
			category: "reason",
			text: "",
		});
		expect(result.success).toBe(false);
	});
});
