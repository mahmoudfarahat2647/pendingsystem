import { test, expect } from "../fixtures";

test.describe("Settings — Smoke (P1)", () => {
	test("settings modal opens from the profile/sidebar area", async ({
		authedPage,
	}) => {
		await authedPage.goto("/dashboard");
		const settingsBtn = authedPage
			.getByTestId("settings-button")
			.or(authedPage.getByRole("button", { name: /settings/i }));
		await settingsBtn.first().click();

		const modal = authedPage.getByRole("dialog");
		await expect(modal).toBeVisible();

		// Locked state should be visible initially
		const lockIndicator = modal
			.getByTestId("settings-locked")
			.or(modal.getByText(/locked/i));
		await expect(lockIndicator.first()).toBeVisible();
	});

	test("wrong password keeps settings locked", async ({ authedPage }) => {
		await authedPage.goto("/dashboard");
		const settingsBtn = authedPage
			.getByTestId("settings-button")
			.or(authedPage.getByRole("button", { name: /settings/i }));
		await settingsBtn.first().click();

		const modal = authedPage.getByRole("dialog");
		await expect(modal).toBeVisible();

		const passwordInput = modal.locator('input[type="password"]');
		if (await passwordInput.isVisible({ timeout: 2000 })) {
			await passwordInput.fill("wrongpassword");
			await modal.getByRole("button", { name: /unlock/i }).click();
			// Should still show locked state or error
			const errorOrLocked = modal
				.getByText(/wrong|incorrect|invalid/i)
				.or(modal.getByRole("alert"));
			await expect(errorOrLocked.first()).toBeVisible();
		}
	});
});
