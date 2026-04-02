import { expect, test } from "../fixtures";
import { cleanupTestRows, seedOrder } from "../seeds";

test.describe("Global Search — Regression (P1)", () => {
	test.afterEach(async () => await cleanupTestRows());

	test("search returns results when typing a known customer name", async ({
		authedPage,
	}) => {
		await seedOrder({ customer_name: "E2E_TEST_SearchTarget" });
		await authedPage.goto("/dashboard");

		// Open search
		await authedPage.keyboard.press("Control+k");
		const searchWorkspace = authedPage
			.getByTestId("search-workspace")
			.or(authedPage.getByRole("dialog", { name: /search/i }));
		await expect(searchWorkspace.first()).toBeVisible();

		// Type in the search box
		const searchInput = authedPage
			.getByTestId("search-input")
			.or(authedPage.getByRole("searchbox"))
			.or(authedPage.locator('input[placeholder*="search" i]'));
		await searchInput.first().fill("E2E_TEST_SearchTarget");

		// Results should appear
		const resultItem = authedPage.getByText(/E2E_TEST_SearchTarget/i);
		await expect(resultItem.first()).toBeVisible({ timeout: 5000 });
	});
});
