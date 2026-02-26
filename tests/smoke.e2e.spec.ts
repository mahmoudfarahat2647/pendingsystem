import { expect, test } from "@playwright/test";

test.describe("App smoke", () => {
	test("boots and navigates to Orders", async ({ page }) => {
		await page.goto("/");

		await expect(page).toHaveURL(/\/dashboard$/);
		await expect(page.getByRole("link", { name: "Orders" })).toBeVisible();

		await page.getByRole("link", { name: "Orders" }).click();

		await expect(page).toHaveURL(/\/orders$/);
		await expect(
			page.getByRole("button", { name: "Create order" }),
		).toBeVisible();
	});
});
