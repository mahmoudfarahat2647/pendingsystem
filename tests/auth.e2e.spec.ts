import { expect, test } from "@playwright/test";

const ALLOWED_EMAIL = process.env.E2E_EMAIL || "barakat2647@gmail.com";
const VALID_PASSWORD = process.env.E2E_PASSWORD || "Tot2647tot";
const INVALID_PASSWORD = "wrongpass";

/**
 * Helper to perform login in tests
 */
async function loginAsTestUser(page: any) {
	await page.goto("/login", { waitUntil: "domcontentloaded" });
	await page.waitForLoadState("networkidle");
	await expect(page.getByLabel(/email/i)).toBeEnabled();
	await expect(page.locator("#password")).toBeEnabled();
	await page.getByLabel(/email/i).fill(ALLOWED_EMAIL);
	await page.locator("#password").fill(VALID_PASSWORD);
	const authResponsePromise = page
		.waitForResponse(
			(response: any) =>
				response.request().method() === "POST" &&
				response.url().includes("/auth/v1/token"),
			{ timeout: 15000 },
		)
		.catch(() => null);
	await page.getByRole("button", { name: /sign in/i }).click();
	const authResponse = await authResponsePromise;
	if (authResponse) {
		expect(authResponse.ok()).toBeTruthy();
	}
	await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
}

test.describe("Authentication System", () => {
	test.describe.configure({ mode: "serial" });
	test.beforeEach(async ({ page }) => {
		// Clear cookies before each test

		await page.context().clearCookies();
		await page.goto("/login", { waitUntil: "domcontentloaded" });
		await page.evaluate(() => {
			localStorage.clear();
			sessionStorage.clear();
		});
	});

	test("should redirect unauthenticated users to /login", async ({ page }) => {
		await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

		await expect(page).toHaveURL(/.*\/login/);
	});

	test("should show login form with email and password fields", async ({
		page,
	}) => {
		await page.goto("/login", { waitUntil: "domcontentloaded" });

		// Check for form elements

		await expect(page.getByLabel(/email/i)).toBeVisible();
		await expect(page.getByLabel(/email/i)).toBeEnabled();

		await expect(page.locator("#password")).toBeVisible();
		await expect(page.locator("#password")).toBeEnabled();

		await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
	});

	test("should show/hide password with eye icon toggle", async ({ page }) => {
		await page.goto("/login", { waitUntil: "domcontentloaded" });
		await page.waitForLoadState("networkidle");

		const passwordInput = page.locator("#password");
		await expect(passwordInput).toBeEnabled();

		const toggleButton = page.getByRole("button", {
			name: /toggle password visibility/i,
		});

		// Initially password should be hidden

		await expect(passwordInput).toHaveAttribute("type", "password");

		// Click toggle to show password

		await toggleButton.click({ force: true });

		await expect(passwordInput).toHaveAttribute("type", "text");

		// Click toggle to hide password again

		await toggleButton.click({ force: true });

		await expect(passwordInput).toHaveAttribute("type", "password");
	});

	test("should reject invalid email addresses", async ({ page }) => {
		await page.goto("/login", { waitUntil: "domcontentloaded" });

		const emailInput = page.getByLabel(/email/i);
		await expect(emailInput).toBeEnabled();
		await expect(page.locator("#password")).toBeEnabled();
		await emailInput.fill("invalid-email");

		await page.locator("#password").fill(VALID_PASSWORD);

		await page.getByRole("button", { name: /sign in/i }).click();

		const isValid = await emailInput.evaluate((el: HTMLInputElement) =>
			el.checkValidity(),
		);
		expect(isValid).toBeFalsy();

		const validationMessage = await emailInput.evaluate(
			(el: HTMLInputElement) => el.validationMessage,
		);
		expect(validationMessage.length).toBeGreaterThan(0);
	});

	test("should reject wrong password", async ({ page }) => {
		await page.goto("/login", { waitUntil: "domcontentloaded" });

		await expect(page.getByLabel(/email/i)).toBeEnabled();
		await expect(page.locator("#password")).toBeEnabled();
		await page.getByLabel(/email/i).fill(ALLOWED_EMAIL);

		await page.locator("#password").fill(INVALID_PASSWORD);

		await page.getByRole("button", { name: /sign in/i }).click();

		// Should remain on login after invalid credentials
		await expect(page).toHaveURL(/.*\/login/);
		await expect(page.getByRole("button", { name: /sign in/i })).toBeEnabled({
			timeout: 10000,
		});
	});

	test("should accept valid credentials and redirect to dashboard", async ({
		page,
	}) => {
		test.skip(
			!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD,
			"E2E credentials not provided",
		);
		await loginAsTestUser(page);
	});

	test("should set session after login", async ({ page }) => {
		test.skip(
			!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD,
			"E2E credentials not provided",
		);
		await loginAsTestUser(page);

		// Verify session is active by checking for dashboard-only elements
		// (Assuming Sidebar is visible on dashboard)
		await expect(page.getByRole("navigation")).toBeVisible();

		// Verify session exists via client-side check
		const sessionExists = await page.evaluate(() => {
			// This depends on how Supabase client is exposed or if sessions are in localStorage
			// For @supabase/ssr, we check if the cookie exists (without specific name requirements)
			return document.cookie.includes("sb-") || document.cookie.includes("supabase");
		});

		expect(sessionExists).toBeTruthy();
	});

	test("should maintain session on page refresh", async ({ page }) => {
		test.setTimeout(40000);
		test.skip(
			!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD,
			"E2E credentials not provided",
		);
		// First login
		await loginAsTestUser(page);

		// Open a new page in the same context to verify session persists
		const refreshedPage = await page.context().newPage();
		await refreshedPage.goto("/dashboard", { waitUntil: "domcontentloaded" });

		// Should still be on dashboard
		await expect(refreshedPage).toHaveURL(/.*\/dashboard/);
		await expect(refreshedPage.getByRole("navigation")).toBeVisible();
		await refreshedPage.close();
	});

	test("should clear session on logout", async ({ page }) => {
		test.setTimeout(40000);
		test.skip(
			!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD,
			"E2E credentials not provided",
		);
		// First login
		await loginAsTestUser(page);

		// Find and click user menu to reveal logout
		await page.getByRole("button", { name: /user menu/i }).click();

		// Click logout menu item
		await page.getByRole("menuitem", { name: /logout/i }).click();

		// Should redirect to login
		await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
		await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible({
			timeout: 10000,
		});

		// Try to access dashboard - should redirect to login
		await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/.*\/login/);

		// Verify cookies are cleared (session-related ones)
		const cookies = await page.context().cookies();
		const hasSessionCookie = cookies.some(
			(c) => c.name.includes("sb-") || c.name.includes("supabase"),
		);
		expect(hasSessionCookie).toBeFalsy();
	});

	test("should navigate to forgot password page", async ({ page }) => {
		await page.goto("/login", { waitUntil: "domcontentloaded" });

		await page.getByRole("link", { name: /forgot.*password/i }).click();

		await expect(page).toHaveURL(/.*\/forgot-password/);
	});

	test("should reject unauthorized email on forgot password", async ({
		page,
	}) => {
		await page.goto("/forgot-password", { waitUntil: "domcontentloaded" });

		await page.getByLabel(/email/i).fill("unauthorized@example.com");

		await page.getByRole("button", { name: /send.*reset/i }).click();

		// Should remain on the forgot password form
		await expect(
			page.getByRole("heading", { name: /forgot password/i }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /check your email/i }),
		).toBeHidden();
	});

	test("should accept authorized email on forgot password", async ({
		page,
	}) => {
		test.skip(
			!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD,
			"E2E credentials not provided",
		);
		await page.goto("/forgot-password", { waitUntil: "domcontentloaded" });

		await page.getByLabel(/email/i).fill(ALLOWED_EMAIL);

		await page.getByRole("button", { name: /send.*reset/i }).click();

		// Should show success message
		// Note: timeout increased as email sending can be slow
		await expect(
			page.getByRole("heading", { name: /check your email/i }),
		).toBeVisible({ timeout: 15000 });
	});

	test("should have dark mode class on html element", async ({ page }) => {
		await page.goto("/login", { waitUntil: "domcontentloaded" });

		const htmlElement = page.locator("html");

		await expect(htmlElement).toHaveClass(/dark/);
	});
});
