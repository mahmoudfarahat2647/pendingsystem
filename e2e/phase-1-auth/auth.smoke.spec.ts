import { test, expect } from "../fixtures";

test.describe("Auth — Smoke (P0)", () => {
	// Scenario 1: Login → dashboard → session persist → sign out
	test("admin logs in, dashboard loads, session survives refresh, sign-out returns to login", async ({
		authedPage,
	}) => {
		await authedPage.goto("/dashboard");
		await expect(authedPage).toHaveURL(/\/dashboard/);

		// Session survives a full page reload
		await authedPage.reload();
		await expect(authedPage).toHaveURL(/\/dashboard/);

		// Sign out — fallback chain covers different UI patterns
		const signOut = authedPage
			.getByRole("button", { name: /sign out/i })
			.or(authedPage.getByTestId("sign-out-button"))
			.or(authedPage.getByText(/sign out/i).first());
		await signOut.click();
		await expect(authedPage).toHaveURL(/\/login/);
	});

	// Scenario 2: Guest redirects for all protected routes
	const protectedRoutes = [
		"/dashboard",
		"/orders",
		"/main-sheet",
		"/call-list",
		"/booking",
		"/archive",
		"/draft-session-test",
	];

	for (const route of protectedRoutes) {
		test(`unauthenticated access to ${route} redirects to /login`, async ({
			page,
		}) => {
			await page.goto(route);
			await expect(page).toHaveURL(/\/login/);
		});
	}
});
