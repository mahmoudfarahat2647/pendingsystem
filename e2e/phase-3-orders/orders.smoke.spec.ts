import { test, expect } from "../fixtures";
import { seedBeastModeOrder, cleanupTestRows } from "../seeds";

test.describe("Orders — Smoke (P0)", () => {
	test("Orders page loads without error", async ({ authedPage }) => {
		await authedPage.goto("/orders");
		await expect(authedPage).toHaveURL(/\/orders/);
		await expect(authedPage.locator("body")).not.toContainText(
			"Internal Server Error",
		);
		// Grid should be visible
		const grid = authedPage
			.getByTestId("orders-grid")
			.or(authedPage.getByRole("grid"))
			.or(authedPage.locator(".ag-root-wrapper"));
		await expect(grid.first()).toBeVisible();
	});

	// This test seeds a row, commits it, and verifies it leaves Orders
	// NOTE: requires SUPABASE_SERVICE_ROLE_KEY to be set in .env.local
	test("commit Beast-Mode-complete order to Main Sheet", async (
		{ authedPage },
		testInfo,
	) => {
		// Seed a row that satisfies all Beast Mode requirements
		const row = await seedBeastModeOrder();
		testInfo.attach("seeded-row-id", { body: row.id });

		try {
			await authedPage.goto("/orders");

			// Wait for grid to load
			const grid = authedPage
				.getByTestId("orders-grid")
				.or(authedPage.locator(".ag-root-wrapper"));
			await expect(grid.first()).toBeVisible();

			// Find the seeded row by customer name
			const rowLocator = authedPage.getByRole("row", {
				name: /E2E_TEST_BeastCustomer/i,
			});
			await expect(rowLocator).toBeVisible({ timeout: 10_000 });

			// Select the row (checkbox click)
			const checkbox = rowLocator.getByRole("checkbox");
			await checkbox.click();

			// Click Commit / "Send to Main Sheet" toolbar action
			const commitBtn = authedPage
				.getByTestId("commit-to-main")
				.or(authedPage.getByRole("button", { name: /commit|main.?sheet/i }));
			await commitBtn.first().click();

			// Confirm any confirmation dialog
			const confirmBtn = authedPage
				.getByRole("button", { name: /confirm|yes|proceed/i })
				.or(authedPage.getByTestId("confirm-commit"));
			if (await confirmBtn.first().isVisible({ timeout: 2000 })) {
				await confirmBtn.first().click();
			}

			// Row should no longer appear in Orders
			await expect(rowLocator).not.toBeVisible({ timeout: 10_000 });
		} finally {
			await cleanupTestRows();
		}
	});
});
