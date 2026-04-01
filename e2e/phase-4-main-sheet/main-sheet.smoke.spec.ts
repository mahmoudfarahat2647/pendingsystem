import { test, expect } from "../fixtures";

test.describe("Main Sheet — Smoke (P0)", () => {
	test("Main Sheet page loads and shows locked state by default", async ({
		authedPage,
	}) => {
		await authedPage.goto("/main-sheet");
		await expect(authedPage).toHaveURL(/\/main-sheet/);
		// Page should render without error
		await expect(authedPage.locator("body")).not.toContainText(
			"Internal Server Error",
		);
		// Unlock button should be visible (indicating locked state)
		const unlockBtn = authedPage
			.getByTestId("unlock-button")
			.or(authedPage.getByRole("button", { name: /unlock/i }));
		await expect(unlockBtn.first()).toBeVisible();
	});

	test("unlock succeeds and grid becomes interactive", async ({
		authedPage,
	}) => {
		await authedPage.goto("/main-sheet");
		const unlockBtn = authedPage
			.getByTestId("unlock-button")
			.or(authedPage.getByRole("button", { name: /unlock/i }));
		await unlockBtn.first().click();
		// Lock button should appear, meaning sheet is now unlocked
		const lockBtn = authedPage
			.getByTestId("lock-button")
			.or(authedPage.getByRole("button", { name: /^lock/i }));
		await expect(lockBtn.first()).toBeVisible({ timeout: 5000 });
	});
});
