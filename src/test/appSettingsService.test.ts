import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type AppSettings,
	appSettingsService,
} from "@/services/appSettingsService";
import { ServiceError } from "@/services/orderServiceErrors";

// ── Supabase module mock ──────────────────────────────────────────────────────
// appSettingsService uses the module-level `supabase` singleton, so we mock the
// entire module. The `single` function is the leaf of the query chain and is
// the only one that needs to return a resolved value.

const mockSingle = vi.fn();

vi.mock("@/lib/supabase", () => ({
	supabase: {
		from: vi.fn(() => ({
			select: vi.fn(() => ({
				eq: vi.fn(() => ({
					single: mockSingle,
				})),
			})),
		})),
	},
}));

// ─────────────────────────────────────────────────────────────────────────────

describe("appSettingsService.fetchAppSettings", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ── MAH-18 fix (1): typed error path ─────────────────────────────────────
	describe("error handling — routes PostgrestError through handleSupabaseError", () => {
		it("throws a ServiceError (not the raw PostgrestError) when Supabase returns an error", async () => {
			const postgrestError = {
				code: "PGRST301",
				message: "Row not found",
				details: "The row with id=1 does not exist",
				hint: null,
			};

			mockSingle.mockResolvedValueOnce({ data: null, error: postgrestError });

			await expect(
				appSettingsService.fetchAppSettings(),
			).rejects.toBeInstanceOf(ServiceError);
		});

		it("surfaces the original error message inside the ServiceError", async () => {
			const postgrestError = {
				code: "57014",
				message: "statement timeout",
				details: null,
				hint: null,
			};

			mockSingle.mockResolvedValueOnce({ data: null, error: postgrestError });

			await expect(appSettingsService.fetchAppSettings()).rejects.toThrow(
				"statement timeout",
			);
		});

		it("carries the Supabase error code on the ServiceError", async () => {
			const postgrestError = {
				code: "23505",
				message: "duplicate key value violates unique constraint",
				details: null,
				hint: null,
			};

			mockSingle.mockResolvedValueOnce({ data: null, error: postgrestError });

			let caught: unknown;
			try {
				await appSettingsService.fetchAppSettings();
			} catch (err) {
				caught = err;
			}

			expect(caught).toBeInstanceOf(ServiceError);
			expect((caught as ServiceError).code).toBe("23505");
		});

		it("does NOT throw the raw PostgrestError object directly", async () => {
			const postgrestError = {
				code: "42P01",
				message: "relation does not exist",
				details: null,
				hint: null,
			};

			mockSingle.mockResolvedValueOnce({ data: null, error: postgrestError });

			let caught: unknown;
			try {
				await appSettingsService.fetchAppSettings();
			} catch (err) {
				caught = err;
			}

			// The raw PostgrestError is a plain object, not an Error instance.
			// Before the fix, `throw error` would propagate that plain object.
			// After the fix, only a ServiceError (which extends Error) is thrown.
			expect(caught).toBeInstanceOf(Error);
			expect(caught).not.toEqual(postgrestError);
		});
	});

	// ── MAH-18 fix (2): ?? [] guards on nullable array columns ───────────────
	describe("null-column guards — defaults NULL DB columns to empty arrays", () => {
		it("returns [] for models when the DB column is NULL", async () => {
			mockSingle.mockResolvedValueOnce({
				data: {
					models: null,
					repair_systems: ["Mechanical"],
					requesters: ["Sales"],
				},
				error: null,
			});

			const result: AppSettings = await appSettingsService.fetchAppSettings();

			expect(result.models).toEqual([]);
		});

		it("returns [] for repairSystems when the DB column is NULL", async () => {
			mockSingle.mockResolvedValueOnce({
				data: {
					models: ["Megane"],
					repair_systems: null,
					requesters: ["Sales"],
				},
				error: null,
			});

			const result: AppSettings = await appSettingsService.fetchAppSettings();

			expect(result.repairSystems).toEqual([]);
		});

		it("returns [] for requesters when the DB column is NULL", async () => {
			mockSingle.mockResolvedValueOnce({
				data: {
					models: ["Megane"],
					repair_systems: ["Mechanical"],
					requesters: null,
				},
				error: null,
			});

			const result: AppSettings = await appSettingsService.fetchAppSettings();

			expect(result.requesters).toEqual([]);
		});

		it("returns [] for all three columns when all are NULL", async () => {
			mockSingle.mockResolvedValueOnce({
				data: { models: null, repair_systems: null, requesters: null },
				error: null,
			});

			const result: AppSettings = await appSettingsService.fetchAppSettings();

			expect(result.models).toEqual([]);
			expect(result.repairSystems).toEqual([]);
			expect(result.requesters).toEqual([]);
		});
	});

	// ── Happy path ────────────────────────────────────────────────────────────
	describe("successful fetch — returns correctly shaped AppSettings", () => {
		it("maps snake_case DB columns to camelCase AppSettings fields", async () => {
			const dbRow = {
				models: ["Renault Megane", "Dacia Duster"],
				repair_systems: ["Mechanical", "Electrical"],
				requesters: ["Sales", "Warranty"],
			};

			mockSingle.mockResolvedValueOnce({ data: dbRow, error: null });

			const result: AppSettings = await appSettingsService.fetchAppSettings();

			expect(result).toEqual<AppSettings>({
				models: ["Renault Megane", "Dacia Duster"],
				repairSystems: ["Mechanical", "Electrical"],
				requesters: ["Sales", "Warranty"],
			});
		});

		it("returns empty arrays when all columns are present but empty", async () => {
			mockSingle.mockResolvedValueOnce({
				data: { models: [], repair_systems: [], requesters: [] },
				error: null,
			});

			const result: AppSettings = await appSettingsService.fetchAppSettings();

			expect(result.models).toEqual([]);
			expect(result.repairSystems).toEqual([]);
			expect(result.requesters).toEqual([]);
		});
	});
});
