import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/lib/supabase";
import { reportSettingsService } from "@/services/reports/reportSettingsService";

vi.mock("@/lib/supabase", () => ({
	supabase: {
		from: vi.fn(),
	},
}));

describe("reportSettingsService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("fetch", vi.fn());
	});

	it("returns existing settings", async () => {
		const maybeSingleMock = vi.fn().mockResolvedValue({
			data: {
				id: "1",
				emails: ["a@test.com"],
				frequency: "Weekly",
				is_enabled: true,
				last_sent_at: null,
			},
			error: null,
		});
		const limitMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
		const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
		const selectMock = vi.fn().mockReturnValue({ order: orderMock });

		vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

		const result = await reportSettingsService.getReportSettings();
		expect(result.id).toBe("1");
	});

	it("creates defaults when none exist", async () => {
		const maybeSingleMock = vi
			.fn()
			.mockResolvedValue({ data: null, error: null });
		const limitMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
		const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
		const selectMock = vi.fn().mockReturnValue({ order: orderMock });

		const singleMock = vi.fn().mockResolvedValue({
			data: {
				id: "new-1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			error: null,
		});
		const selectInsertMock = vi.fn().mockReturnValue({ single: singleMock });
		const insertMock = vi.fn().mockReturnValue({ select: selectInsertMock });

		vi.mocked(supabase.from).mockReturnValue({
			select: selectMock,
			insert: insertMock,
		} as any);

		const result = await reportSettingsService.getReportSettings();
		expect(result.id).toBe("new-1");
	});

	it("updates settings by id", async () => {
		const singleMock = vi.fn().mockResolvedValue({
			data: {
				id: "1",
				emails: [],
				frequency: "Monthly",
				is_enabled: true,
				last_sent_at: null,
			},
			error: null,
		});
		const selectMock = vi.fn().mockReturnValue({ single: singleMock });
		const eqMock = vi.fn().mockReturnValue({ select: selectMock });
		const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

		vi.mocked(supabase.from).mockReturnValue({ update: updateMock } as any);

		const result = await reportSettingsService.updateReportSettings("1", {
			frequency: "Monthly",
		});

		expect(result.frequency).toBe("Monthly");
		expect(eqMock).toHaveBeenCalledWith("id", "1");
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
