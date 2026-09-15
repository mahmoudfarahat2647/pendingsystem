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
					stage: null,
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

		it("fetches templates for a category scoped to a stage", async () => {
			const templates: QuickTemplate[] = [
				{
					id: "1",
					category: "note",
					text: "Hello",
					sortOrder: 0,
					stage: "booking",
					createdAt: "",
					updatedAt: "",
				},
			];
			global.fetch = makeMockFetch(200, templates);

			const { quickTemplatesService } = await import(
				"@/services/quickTemplatesService"
			);
			const result = await quickTemplatesService.list("note", "booking");

			expect(fetch).toHaveBeenCalledWith(
				"/api/quick-templates?category=note&stage=booking",
			);
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
				stage: null,
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

		it("posts category, text, and stage for note templates", async () => {
			const created: QuickTemplate = {
				id: "abc",
				category: "note",
				text: "Confirmed",
				sortOrder: 0,
				stage: "booking",
				createdAt: "",
				updatedAt: "",
			};
			global.fetch = makeMockFetch(201, created);

			const { quickTemplatesService } = await import(
				"@/services/quickTemplatesService"
			);
			const result = await quickTemplatesService.add(
				"note",
				"Confirmed",
				"booking",
			);

			expect(fetch).toHaveBeenCalledWith("/api/quick-templates", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					category: "note",
					text: "Confirmed",
					stage: "booking",
				}),
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
		it("sends DELETE with id and category query params", async () => {
			global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });

			const { quickTemplatesService } = await import(
				"@/services/quickTemplatesService"
			);
			await quickTemplatesService.remove("uuid-123", "reason");

			expect(fetch).toHaveBeenCalledWith(
				"/api/quick-templates?id=uuid-123&category=reason",
				{ method: "DELETE" },
			);
		});

		it("sends DELETE with id, category, and stage query params", async () => {
			global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });

			const { quickTemplatesService } = await import(
				"@/services/quickTemplatesService"
			);
			await quickTemplatesService.remove("uuid-123", "note", "freeze");

			expect(fetch).toHaveBeenCalledWith(
				"/api/quick-templates?id=uuid-123&category=note&stage=freeze",
				{ method: "DELETE" },
			);
		});

		it("throws on non-204 error", async () => {
			global.fetch = makeMockFetch(404, { error: "Not found" });

			const { quickTemplatesService } = await import(
				"@/services/quickTemplatesService"
			);
			await expect(
				quickTemplatesService.remove("bad-id", "reason"),
			).rejects.toThrow("Not found");
		});
	});
});
