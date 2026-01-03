import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Supabase Client Initialization", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	it("should throw an error when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
		delete process.env.NEXT_PUBLIC_SUPABASE_URL;
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "dummy-key";

		await expect(import("../lib/supabase")).rejects.toThrow(
			"Missing Supabase environment variables",
		);
	});

	it("should throw an error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", async () => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = "https://dummy.supabase.co";
		delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		await expect(import("../lib/supabase")).rejects.toThrow(
			"Missing Supabase environment variables",
		);
	});

	it("should initialize successfully when all variables are present", async () => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = "https://dummy.supabase.co";
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "dummy-key";

		const { supabase } = await import("../lib/supabase");
		expect(supabase).toBeDefined();
	});
});
