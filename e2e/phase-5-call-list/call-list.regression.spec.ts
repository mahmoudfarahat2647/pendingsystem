import { expect, test } from "../fixtures";
import { cleanupTestRows, seedCallListRow } from "../seeds";

test.describe("Call List — Regression (P1)", () => {
	test.afterEach(async () => await cleanupTestRows());

	test("reorder button opens modal that requires a reason", async ({
		authedPage,
	}) => {
		await seedCallListRow();
		await authedPage.goto("/call-list");
		const row = authedPage.getByRole("row", {
			name: /E2E_TEST_CallCustomer/i,
		});
		await expect(row).toBeVisible({ timeout: 10_000 });
		await row.getByRole("checkbox").click();

		const reorderBtn = authedPage
			.getByTestId("reorder-button")
			.or(authedPage.getByRole("button", { name: /reorder/i }));
		await reorderBtn.first().click();

		// Reorder modal must appear
		const modal = authedPage.getByRole("dialog");
		await expect(modal).toBeVisible();

		// Submit without reason — row should still be in Call List
		const submitBtn = modal.getByRole("button", {
			name: /confirm|submit|reorder/i,
		});
		await submitBtn.click();
		// Row should still be present (not removed without reason)
		await expect(row).toBeVisible();
	});
});
