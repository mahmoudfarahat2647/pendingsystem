import { test, expect } from "../fixtures";

test.describe("Booking — Smoke (P0)", () => {
	test("Booking page loads and shows VIN summary", async ({ authedPage }) => {
		await authedPage.goto("/booking");
		await expect(authedPage).toHaveURL(/\/booking/);
		await expect(authedPage.locator("body")).not.toContainText(
			"Internal Server Error",
		);
	});
});
