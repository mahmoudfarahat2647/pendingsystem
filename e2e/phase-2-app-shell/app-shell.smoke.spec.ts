import { expect, test } from "../fixtures";

test.describe("App Shell + Dashboard — Smoke (P0)", () => {
	test("sidebar links navigate to all five stage routes", async ({
		authedPage,
	}) => {
		await authedPage.goto("/dashboard");
		const routes = [
			{ name: /orders/i, url: /\/orders/ },
			{ name: /main.?sheet/i, url: /\/main-sheet/ },
			{ name: /call.?list/i, url: /\/call-list/ },
			{ name: /booking/i, url: /\/booking/ },
			{ name: /archive/i, url: /\/archive/ },
		];
		for (const route of routes) {
			const link = authedPage.getByRole("link", { name: route.name });
			await link.click();
			await expect(authedPage).toHaveURL(route.url);
			// Navigate back to dashboard before next iteration
			await authedPage.goto("/dashboard");
		}
	});

	test("header search input is visible and focusable", async ({
		authedPage,
	}) => {
		await authedPage.goto("/dashboard");
		const searchInput = authedPage
			.getByTestId("global-search")
			.or(authedPage.getByRole("searchbox"))
			.or(authedPage.getByPlaceholder(/search/i));
		await expect(searchInput.first()).toBeVisible();
		await searchInput.first().click();
		// After focus, search workspace should be visible
		const searchWorkspace = authedPage
			.getByRole("dialog")
			.or(authedPage.getByTestId("search-workspace"));
		await expect(searchWorkspace.first()).toBeVisible();
	});

	test("export menu is accessible from header", async ({ authedPage }) => {
		await authedPage.goto("/orders");
		const exportBtn = authedPage
			.getByTestId("export-menu")
			.or(authedPage.getByRole("button", { name: /export/i }));
		await expect(exportBtn.first()).toBeVisible();
	});

	test("dashboard renders without crashing", async ({ authedPage }) => {
		await authedPage.goto("/dashboard");
		await expect(authedPage).toHaveURL(/\/dashboard/);
		// Page should not show a 500 error
		await expect(authedPage.locator("body")).not.toContainText(
			"Internal Server Error",
		);
	});
});
