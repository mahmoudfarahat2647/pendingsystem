import { beforeEach, describe, expect, it, vi } from "vitest";
import { reportSettingsService } from "@/services/reports/reportSettingsService";

describe("reportSettingsService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("fetch", vi.fn());
	});

	it("returns existing settings", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: Global fetch mock
		(global.fetch as any).mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve({
					id: "1",
					emails: ["a@test.com"],
					frequency: "Weekly",
					is_enabled: true,
					last_sent_at: null,
				}),
		});

		const result = await reportSettingsService.getReportSettings();
		expect(result.id).toBe("1");
	});

	it("creates defaults when none exist", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: Global fetch mock
		(global.fetch as any).mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve({
					id: "new-1",
					emails: [],
					frequency: "Weekly",
					is_enabled: false,
					last_sent_at: null,
				}),
		});

		const result = await reportSettingsService.getReportSettings();
		expect(result.id).toBe("new-1");
	});

	it("updates settings by id", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: Global fetch mock
		(global.fetch as any).mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve({
					id: "1",
					emails: [],
					frequency: "Monthly",
					is_enabled: true,
					last_sent_at: null,
				}),
		});

		const result = await reportSettingsService.updateReportSettings("1", {
			frequency: "Monthly",
		});

		expect(result.frequency).toBe("Monthly");
		expect(global.fetch).toHaveBeenCalledWith(
			"/api/report-settings",
			expect.objectContaining({ method: "PATCH" }),
		);
	});

	it("triggers manual backup through API route", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: Global fetch mock
		(global.fetch as any).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ success: true, message: "ok" }),
		});

		await reportSettingsService.triggerManualBackup();

		expect(global.fetch).toHaveBeenCalledWith("/api/trigger-backup", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		});
	});
});
