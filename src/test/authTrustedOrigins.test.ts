import { describe, expect, it } from "vitest";
import { buildTrustedOrigins } from "@/lib/authTrustedOrigins";

describe("buildTrustedOrigins", () => {
	it("returns an empty array when no Vercel env vars are set", () => {
		expect(buildTrustedOrigins({})).toEqual([]);
	});

	it("includes VERCEL_URL when set", () => {
		expect(buildTrustedOrigins({ VERCEL_URL: "my-app.vercel.app" })).toEqual([
			"https://my-app.vercel.app",
		]);
	});

	it("includes VERCEL_BRANCH_URL when set", () => {
		expect(
			buildTrustedOrigins({ VERCEL_BRANCH_URL: "my-app-feat-x.vercel.app" }),
		).toEqual(["https://my-app-feat-x.vercel.app"]);
	});

	it("includes VERCEL_PROJECT_PRODUCTION_URL when set", () => {
		expect(
			buildTrustedOrigins({
				VERCEL_PROJECT_PRODUCTION_URL: "my-app.example.com",
			}),
		).toEqual(["https://my-app.example.com"]);
	});

	it("combines all three Vercel env vars when present", () => {
		expect(
			buildTrustedOrigins({
				VERCEL_URL: "my-app.vercel.app",
				VERCEL_BRANCH_URL: "my-app-feat-x.vercel.app",
				VERCEL_PROJECT_PRODUCTION_URL: "my-app.example.com",
			}),
		).toEqual([
			"https://my-app.vercel.app",
			"https://my-app-feat-x.vercel.app",
			"https://my-app.example.com",
		]);
	});

	it("deduplicates if multiple env vars have the same value", () => {
		expect(
			buildTrustedOrigins({
				VERCEL_URL: "my-app.vercel.app",
				VERCEL_BRANCH_URL: "my-app.vercel.app",
			}),
		).toEqual(["https://my-app.vercel.app"]);
	});

	it("filters out empty string values", () => {
		expect(
			buildTrustedOrigins({
				VERCEL_URL: "my-app.vercel.app",
				VERCEL_BRANCH_URL: "",
			}),
		).toEqual(["https://my-app.vercel.app"]);
	});

	it("filters out undefined values", () => {
		expect(
			buildTrustedOrigins({
				VERCEL_URL: "my-app.vercel.app",
				VERCEL_BRANCH_URL: undefined,
			}),
		).toEqual(["https://my-app.vercel.app"]);
	});
});
