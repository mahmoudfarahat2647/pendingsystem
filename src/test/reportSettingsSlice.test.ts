import { beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { createReportSettingsSlice } from "../store/slices/reportSettingsSlice";
import type { CombinedStore, ReportSettings } from "../store/types";

// Mock supabase
vi.mock("@/lib/supabase", () => ({
	supabase: {
		from: vi.fn(),
	},
}));

describe("reportSettingsSlice", () => {
	const createTestStore = () => {
		return create<CombinedStore>(
			(set, get, store) =>
				({
					// biome-ignore lint/suspicious/noExplicitAny: Mock store structure
					...createReportSettingsSlice(set, get, store as any),
				}) as unknown as any,
		);
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("fetch", vi.fn());
	});

	describe("triggerManualBackup", () => {
		it("should trigger manual backup successfully", async () => {
			const store = createTestStore();

			// biome-ignore lint/suspicious/noExplicitAny: Global fetch mock
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ success: true, message: "Success" }),
			});

			const fetchSpy = vi
				.spyOn(store.getState(), "fetchReportSettings")
				.mockResolvedValue(undefined);

			await store.getState().triggerManualBackup();

			expect(global.fetch).toHaveBeenCalledWith("/api/trigger-backup", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});
			expect(fetchSpy).toHaveBeenCalled();
			expect(store.getState().isReportSettingsLoading).toBe(false);
			expect(store.getState().reportSettingsError).toBeNull();
		});

		it("should handle backup failure correctly", async () => {
			const store = createTestStore();

			// biome-ignore lint/suspicious/noExplicitAny: Global fetch mock
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () =>
					Promise.resolve({
						success: false,
						error: { message: "Backup failed", code: "SERVER_ERROR" },
					}),
			});

			await store.getState().triggerManualBackup();

			expect(store.getState().reportSettingsError).toBe("Backup failed");
			expect(store.getState().isReportSettingsLoading).toBe(false);
		});
	});

	describe("fetchReportSettings", () => {
		it("should fetch existing settings successfully", async () => {
			const store = createTestStore();
			const mockData: ReportSettings = {
				id: "1",
				emails: ["test@example.com"],
				frequency: "Weekly",
				is_enabled: true,
				last_sent_at: null,
			};

			const maybeSingleMock = vi
				.fn()
				.mockResolvedValue({ data: mockData, error: null });
			const limitMock = vi
				.fn()
				.mockReturnValue({ maybeSingle: maybeSingleMock });
			const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
			const selectMock = vi.fn().mockReturnValue({ order: orderMock });

			vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

			await store.getState().fetchReportSettings();

			expect(store.getState().reportSettings).toEqual(mockData);
			expect(store.getState().isReportSettingsLoading).toBe(false);
		});

		it("should create default settings if none exist", async () => {
			const store = createTestStore();
			const mockNewData: ReportSettings = {
				id: "new-1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			};

			// Mock select chain for fetch
			const maybeSingleMock = vi
				.fn()
				.mockResolvedValue({ data: null, error: null });
			const limitMock = vi
				.fn()
				.mockReturnValue({ maybeSingle: maybeSingleMock });
			const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
			const selectMock = vi.fn().mockReturnValue({ order: orderMock });

			// Mock insert chain
			const singleMock = vi
				.fn()
				.mockResolvedValue({ data: mockNewData, error: null });
			const selectInsertMock = vi.fn().mockReturnValue({ single: singleMock });
			const insertMock = vi.fn().mockReturnValue({ select: selectInsertMock });

			vi.mocked(supabase.from).mockImplementation((table: string) => {
				if (table === "report_settings") {
					return {
						select: selectMock,
						insert: insertMock,
					} as any;
				}
				return {} as any;
			});

			await store.getState().fetchReportSettings();

			expect(store.getState().reportSettings).toEqual(mockNewData);
		});

		it("should fallback to in-memory settings on error", async () => {
			const store = createTestStore();

			const maybeSingleMock = vi.fn().mockResolvedValue({
				data: null,
				error: { message: "Database error" },
			});
			const limitMock = vi
				.fn()
				.mockReturnValue({ maybeSingle: maybeSingleMock });
			const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
			const selectMock = vi.fn().mockReturnValue({ order: orderMock });

			vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

			await store.getState().fetchReportSettings();

			expect(store.getState().reportSettings?.id).toBe("temp-id");
			expect(store.getState().reportSettingsError).toBe("Database error");
		});
	});

	describe("updateReportSettings", () => {
		it("should update settings successfully", async () => {
			const store = createTestStore();
			const initialSettings: ReportSettings = {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			};
			store.setState({ reportSettings: initialSettings });

			const updatedSettings: ReportSettings = {
				...initialSettings,
				is_enabled: true,
			};

			const singleMock = vi
				.fn()
				.mockResolvedValue({ data: updatedSettings, error: null });
			const selectMock = vi.fn().mockReturnValue({ single: singleMock });
			const eqMock = vi.fn().mockReturnValue({ select: selectMock });
			const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

			vi.mocked(supabase.from).mockReturnValue({ update: updateMock } as any);

			await store.getState().updateReportSettings({ is_enabled: true });

			expect(store.getState().reportSettings?.is_enabled).toBe(true);
			expect(store.getState().isReportSettingsLoading).toBe(false);
		});
	});

	describe("Email Recipient Management", () => {
		it("should add email recipient correctly", async () => {
			const store = createTestStore();
			const initialSettings: ReportSettings = {
				id: "1",
				emails: ["old@test.com"],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			};
			store.setState({
				reportSettings: initialSettings,
				isReportSettingsLoading: false,
			});

			const updateSpy = vi
				.spyOn(store.getState(), "updateReportSettings")
				.mockResolvedValue(undefined);

			await store.getState().addEmailRecipient("new@test.com");

			expect(updateSpy).toHaveBeenCalledWith({
				emails: ["old@test.com", "new@test.com"],
			});
		});

		it("should remove email recipient correctly", async () => {
			const store = createTestStore();
			const initialSettings: ReportSettings = {
				id: "1",
				emails: ["a@test.com", "b@test.com"],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			};
			store.setState({
				reportSettings: initialSettings,
				isReportSettingsLoading: false,
			});

			const updateSpy = vi
				.spyOn(store.getState(), "updateReportSettings")
				.mockResolvedValue(undefined);

			await store.getState().removeEmailRecipient("a@test.com");

			expect(updateSpy).toHaveBeenCalledWith({ emails: ["b@test.com"] });
		});
	});
});
