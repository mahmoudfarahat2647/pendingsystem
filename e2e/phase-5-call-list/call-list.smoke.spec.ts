import { expect, test } from "../fixtures";

test.describe("Call List — Smoke (P0)", () => {
	test("Call List page loads without error", async ({ authedPage }) => {
		await authedPage.goto("/call-list");
		await expect(authedPage).toHaveURL(/\/call-list/);
		await expect(authedPage.locator("body")).not.toContainText(
			"Internal Server Error",
		);
		const grid = authedPage
			.getByTestId("call-list-grid")
			.or(authedPage.getByRole("grid"))
			.or(authedPage.locator(".ag-root-wrapper"));
		await expect(grid.first()).toBeVisible();
	});
});
