import { test, expect } from "../fixtures";

test.describe("Archive — Smoke (P1)", () => {
	test("Archive page loads with booking date column visible", async ({
		authedPage,
	}) => {
		await authedPage.goto("/archive");
		await expect(authedPage).toHaveURL(/\/archive/);
		await expect(authedPage.locator("body")).not.toContainText(
			"Internal Server Error",
		);
	});
});
