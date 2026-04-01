import { test, expect } from "../fixtures";

test.describe("Global Search — Smoke (P1)", () => {
	test("Ctrl+K opens search workspace", async ({ authedPage }) => {
		await authedPage.goto("/dashboard");
		await authedPage.keyboard.press("Control+k");
		const searchWorkspace = authedPage
			.getByTestId("search-workspace")
			.or(authedPage.getByRole("dialog", { name: /search/i }))
			.or(authedPage.locator("[data-search-open]"));
		await expect(searchWorkspace.first()).toBeVisible();
	});
});
