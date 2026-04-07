import { beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "zustand";
import { reportSettingsService } from "@/services/reports/reportSettingsService";
import { createReportSettingsSlice } from "../../store/slices/reportSettingsSlice";
import type { CombinedStore, ReportSettings } from "../../store/types";

vi.mock("@/services/reports/reportSettingsService", () => ({
	reportSettingsService: {
		getReportSettings: vi.fn(),
		updateReportSettings: vi.fn(),
		triggerManualBackup: vi.fn(),
	},
}));

describe("reportSettingsSlice", () => {
	const createTestStore = () => {
		return create<CombinedStore>(
			(set, get, store) =>
				({
					// biome-ignore lint/suspicious/noExplicitAny: Test-only store setup
					...createReportSettingsSlice(set, get, store as any),
				}) as unknown as any,
		);
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("fetches report settings through service", async () => {
		const store = createTestStore();
		const mockData: ReportSettings = {
			id: "1",
			emails: ["test@example.com"],
			frequency: "Weekly",
			is_enabled: true,
			last_sent_at: null,
		};

		vi.mocked(reportSettingsService.getReportSettings).mockResolvedValue(
			mockData,
		);

		await store.getState().fetchReportSettings();

		expect(reportSettingsService.getReportSettings).toHaveBeenCalled();
		expect(store.getState().reportSettings).toEqual(mockData);
		expect(store.getState().isReportSettingsLoading).toBe(false);
	});

	it("falls back to temp settings when fetch fails", async () => {
		const store = createTestStore();
		vi.mocked(reportSettingsService.getReportSettings).mockRejectedValue(
			new Error("Database error"),
		);

		await store.getState().fetchReportSettings();

		expect(store.getState().reportSettings?.id).toBe("temp-id");
		expect(store.getState().reportSettingsError).toBe("Database error");
	});

	it("updates settings through service", async () => {
		const store = createTestStore();
		store.setState({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
		});

		vi.mocked(reportSettingsService.updateReportSettings).mockResolvedValue({
			id: "1",
			emails: [],
			frequency: "Weekly",
			is_enabled: true,
			last_sent_at: null,
		});

		await store.getState().updateReportSettings({ is_enabled: true });

		expect(reportSettingsService.updateReportSettings).toHaveBeenCalledWith(
			"1",
			{
				is_enabled: true,
			},
		);
		expect(store.getState().reportSettings?.is_enabled).toBe(true);
	});

	it("adds and removes recipient using update action", async () => {
		const store = createTestStore();
		store.setState({
			reportSettings: {
				id: "1",
				emails: ["a@test.com"],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
		});

		const updateSpy = vi
			.spyOn(store.getState(), "updateReportSettings")
			.mockResolvedValue(undefined);

		await store.getState().addEmailRecipient("b@test.com");
		await store.getState().removeEmailRecipient("a@test.com");

		expect(updateSpy).toHaveBeenNthCalledWith(1, {
			emails: ["a@test.com", "b@test.com"],
		});
		expect(updateSpy).toHaveBeenNthCalledWith(2, {
			emails: [],
		});
	});

	it("triggers backup through service and refreshes settings", async () => {
		const store = createTestStore();
		vi.mocked(reportSettingsService.triggerManualBackup).mockResolvedValue({
			success: true,
			message: "ok",
		});
		const fetchSpy = vi
			.spyOn(store.getState(), "fetchReportSettings")
			.mockResolvedValue(undefined);

		await store.getState().triggerManualBackup();

		expect(reportSettingsService.triggerManualBackup).toHaveBeenCalled();
		expect(fetchSpy).toHaveBeenCalled();
		expect(store.getState().isReportSettingsLoading).toBe(false);
	});
});
