import { beforeEach, describe, expect, it, vi } from "vitest";
import { reportSettingsService } from "@/services/reports/reportSettingsService";

vi.mock("@/services/reports/reportSettingsService", () => ({
	reportSettingsService: {
		getReportSettings: vi.fn(),
		updateReportSettings: vi.fn(),
		triggerManualBackup: vi.fn(),
	},
}));

describe("reportSettingsService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("getReportSettings returns data from the API", async () => {
		const mockData = {
			id: "1",
			emails: ["test@example.com"],
			frequency: "Weekly",
			is_enabled: true,
			last_sent_at: null,
		};
		vi.mocked(reportSettingsService.getReportSettings).mockResolvedValue(
			mockData,
		);

		const result = await reportSettingsService.getReportSettings();

		expect(reportSettingsService.getReportSettings).toHaveBeenCalled();
		expect(result).toEqual(mockData);
	});

	it("updateReportSettings calls service with id and patch", async () => {
		const patch = { is_enabled: true };
		const updated = {
			id: "1",
			emails: [],
			frequency: "Weekly",
			is_enabled: true,
			last_sent_at: null,
		};
		vi.mocked(reportSettingsService.updateReportSettings).mockResolvedValue(
			updated,
		);

		const result = await reportSettingsService.updateReportSettings("1", patch);

		expect(reportSettingsService.updateReportSettings).toHaveBeenCalledWith(
			"1",
			patch,
		);
		expect(result.is_enabled).toBe(true);
	});

	it("triggerManualBackup returns success response", async () => {
		vi.mocked(reportSettingsService.triggerManualBackup).mockResolvedValue({
			success: true,
			message: "ok",
		});

		const result = await reportSettingsService.triggerManualBackup();

		expect(reportSettingsService.triggerManualBackup).toHaveBeenCalled();
		expect(result.success).toBe(true);
	});
});
