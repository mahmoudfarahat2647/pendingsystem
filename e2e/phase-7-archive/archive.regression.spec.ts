import { expect, test } from "../fixtures";
import { cleanupTestRows, seedArchiveRow } from "../seeds";

test.describe("Archive — Regression (P1)", () => {
	test.afterEach(async () => await cleanupTestRows());

	test("reorder to Orders requires a reason", async ({ authedPage }) => {
		await seedArchiveRow();
		await authedPage.goto("/archive");
		const row = authedPage.getByRole("row", {
			name: /E2E_TEST_ArchiveCustomer/i,
		});
		await expect(row).toBeVisible({ timeout: 10_000 });
		await row.getByRole("checkbox").click();

		const reorderBtn = authedPage
			.getByTestId("reorder-button")
			.or(authedPage.getByRole("button", { name: /reorder/i }));
		await reorderBtn.first().click();

		const modal = authedPage.getByRole("dialog");
		await expect(modal).toBeVisible();

		// Submit without reason — row should still be in Archive
		const submitBtn = modal.getByRole("button", {
			name: /confirm|submit|reorder/i,
		});
		await submitBtn.click();
		// Row should still be present
		await expect(row).toBeVisible();
	});

	test("permanent delete requires confirmation dialog", async ({
		authedPage,
	}) => {
		await seedArchiveRow();
		await authedPage.goto("/archive");
		const row = authedPage.getByRole("row", {
			name: /E2E_TEST_ArchiveCustomer/i,
		});
		await expect(row).toBeVisible({ timeout: 10_000 });
		await row.getByRole("checkbox").click();

		const deleteBtn = authedPage
			.getByTestId("delete-button")
			.or(authedPage.getByRole("button", { name: /delete|remove/i }));
		await deleteBtn.first().click();

		// A confirmation dialog must appear before deletion
		const confirmDialog = authedPage.getByRole("dialog");
		await expect(confirmDialog).toBeVisible();

		// Cancel to avoid actually deleting
		const cancelBtn = confirmDialog.getByRole("button", {
			name: /cancel|no/i,
		});
		await cancelBtn.first().click();
		await expect(row).toBeVisible();
	});
});
