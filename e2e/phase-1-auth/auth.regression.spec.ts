import { expect, test } from "../fixtures";

test.describe("Auth — Regression (P1)", () => {
	// Invalid credentials
	test("login with wrong password shows error and stays on /login", async ({
		page,
	}) => {
		await page.goto("/login");
		await page.locator("#username").fill("mahmoud");
		await page.locator("#password").fill("wrongpassword");
		await page.locator('button[type="submit"]').click();
		// Should remain on login page
		await expect(page).toHaveURL(/\/login/);
		// Error message should appear — fallback chain covers different UI patterns
		const errorLocator = page
			.getByRole("alert")
			.or(page.getByTestId("login-error"))
			.or(page.locator("[data-error]"))
			.or(page.locator(".error-message"));
		await expect(errorLocator.first()).toBeVisible();
	});

	// Short / empty field validation
	test("login with empty fields does not navigate away", async ({ page }) => {
		await page.goto("/login");
		await page.locator('button[type="submit"]').click();
		await expect(page).toHaveURL(/\/login/);
	});

	// Forgot password — same success for valid/unknown/invalid username (no enumeration)
	test("forgot-password shows success message regardless of username existence", async ({
		page,
	}) => {
		await page.goto("/forgot-password");
		const emailInput = page
			.getByTestId("forgot-password-email")
			.or(page.getByRole("textbox", { name: /email|username/i }))
			.or(
				page.locator(
					'input[type="email"], input[name="email"], input[name="username"]',
				),
			);
		await emailInput.first().fill("nonexistent@example.com");
		const submitBtn = page.getByRole("button", { name: /send|submit|reset/i });
		await submitBtn.click();
		// Success message must appear (same for all inputs per spec)
		const successMsg = page
			.getByTestId("forgot-password-success")
			.or(page.getByRole("alert"))
			.or(page.locator("[data-success]"));
		await expect(successMsg.first()).toBeVisible();
	});

	// Reset password — missing token
	test("reset-password without token shows an error", async ({ page }) => {
		await page.goto("/reset-password");
		await expect(page).not.toHaveURL(/\/login/); // should stay on reset-password page
		// Error or invalid-token state should be visible
		const errorState = page
			.getByTestId("reset-password-error")
			.or(page.getByText(/invalid|expired|missing/i).first());
		await expect(errorState).toBeVisible();
	});
});
