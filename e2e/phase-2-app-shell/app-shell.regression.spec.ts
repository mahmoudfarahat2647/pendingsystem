import { expect, test } from "../fixtures";

test.describe("App Shell + Dashboard — Regression (P1)", () => {
	test("dashboard storage widgets do not crash when storage stats are unavailable", async ({
		authedPage,
	}) => {
		// Mock storage-stats endpoint to return 500
		await authedPage.route("**/api/storage-stats**", (route) =>
			route.fulfill({
				status: 500,
				body: JSON.stringify({ error: "degraded" }),
			}),
		);
		await authedPage.goto("/dashboard");
		await expect(authedPage).toHaveURL(/\/dashboard/);
		// Page still renders (no full-page crash)
		await expect(authedPage.locator("body")).not.toContainText(
			"Internal Server Error",
		);
	});
});
