import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { QuickTemplate } from "@/services/quickTemplatesService";

const makeMockFetch = (status: number, body: unknown) =>
	vi.fn().mockResolvedValue({
		ok: status >= 200 && status < 300,
		status,
		json: () => Promise.resolve(body),
	});

describe("quickTemplatesService", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("list", () => {
		it("fetches templates for a category", async () => {
			const templates: QuickTemplate[] = [
				{
					id: "1",
					category: "note",
					text: "Hello",
					sortOrder: 0,
					createdAt: "",
					updatedAt: "",
				},
			];
			global.fetch = makeMockFetch(200, templates);

			const { quickTemplatesService } = await import(
				"@/services/quickTemplatesService"
			);
			const result = await quickTemplatesService.list("note");

			expect(fetch).toHaveBeenCalledWith("/api/quick-templates?category=note");
			expect(result).toEqual(templates);
		});

		it("throws on non-ok response", async () => {
			global.fetch = makeMockFetch(500, { error: "Database error" });

			const { quickTemplatesService } = await import(
				"@/services/quickTemplatesService"
			);
			await expect(quickTemplatesService.list("note")).rejects.toThrow(
				"Database error",
			);
		});
	});

	describe("add", () => {
		it("posts category and text, returns created template", async () => {
			const created: QuickTemplate = {
				id: "abc",
				category: "reason",
				text: "لم يأتي في الموعد",
				sortOrder: 0,
				createdAt: "",
				updatedAt: "",
			};
			global.fetch = makeMockFetch(201, created);

			const { quickTemplatesService } = await import(
				"@/services/quickTemplatesService"
			);
			const result = await quickTemplatesService.add(
				"reason",
				"لم يأتي في الموعد",
			);

			expect(fetch).toHaveBeenCalledWith("/api/quick-templates", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ category: "reason", text: "لم يأتي في الموعد" }),
			});
			expect(result).toEqual(created);
		});

		it("throws with server error message on 409", async () => {
			global.fetch = makeMockFetch(409, { error: "Template already exists" });

			const { quickTemplatesService } = await import(
				"@/services/quickTemplatesService"
			);
			await expect(quickTemplatesService.add("note", "dup")).rejects.toThrow(
				"Template already exists",
			);
		});
	});

	describe("remove", () => {
		it("sends DELETE with id query param", async () => {
			global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });

			const { quickTemplatesService } = await import(
				"@/services/quickTemplatesService"
			);
			await quickTemplatesService.remove("uuid-123");

			expect(fetch).toHaveBeenCalledWith("/api/quick-templates?id=uuid-123", {
				method: "DELETE",
			});
		});

		it("throws on non-204 error", async () => {
			global.fetch = makeMockFetch(404, { error: "Not found" });

			const { quickTemplatesService } = await import(
				"@/services/quickTemplatesService"
			);
			await expect(quickTemplatesService.remove("bad-id")).rejects.toThrow(
				"Not found",
			);
		});
	});
});
