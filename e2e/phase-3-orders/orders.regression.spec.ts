import { test, expect } from "../fixtures";
import {
	seedOrder,
	seedOrderMissingPartNumber,
	cleanupTestRows,
} from "../seeds";

test.describe("Orders — Regression (P1)", () => {
	test.afterEach(async () => {
		await cleanupTestRows();
	});

	test("create order form opens and closes correctly", async ({
		authedPage,
	}) => {
		await authedPage.goto("/orders");
		const addBtn = authedPage
			.getByTestId("add-order-button")
			.or(authedPage.getByRole("button", { name: /add|new order/i }));
		await addBtn.first().click();
		// Modal should appear
		const modal = authedPage.getByRole("dialog");
		await expect(modal).toBeVisible();
		// Close/Cancel
		const cancelBtn = modal
			.getByRole("button", { name: /cancel|close/i })
			.or(authedPage.getByRole("button", { name: /cancel/i }));
		await cancelBtn.first().click();
		await expect(modal).not.toBeVisible();
	});

	test("commit is blocked when required part fields are missing", async ({
		authedPage,
	}) => {
		await seedOrderMissingPartNumber();

		await authedPage.goto("/orders");
		const rowLocator = authedPage.getByRole("row", {
			name: /E2E_TEST_MissingPart/i,
		});
		await expect(rowLocator).toBeVisible({ timeout: 10_000 });

		// Select row
		await rowLocator.getByRole("checkbox").click();

		// Commit button should be disabled or clicking it shows an error
		const commitBtn = authedPage
			.getByTestId("commit-to-main")
			.or(authedPage.getByRole("button", { name: /commit|main.?sheet/i }));

		const isDisabled = await commitBtn.first().isDisabled();
		if (!isDisabled) {
			await commitBtn.first().click();
			// Should show validation error
			const errorMsg = authedPage
				.getByRole("alert")
				.or(authedPage.getByTestId("validation-error"))
				.or(authedPage.locator("[data-error]"));
			await expect(errorMsg.first()).toBeVisible();
		} else {
			expect(isDisabled).toBe(true);
		}
	});
});
