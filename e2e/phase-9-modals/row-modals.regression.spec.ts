import { test, expect } from "../fixtures";
import { seedOrder, cleanupTestRows } from "../seeds";

test.describe("Row Modals — Regression (P1)", () => {
	test.afterEach(async () => await cleanupTestRows());

	test("notes modal saves a note to a seeded order row", async ({
		authedPage,
	}) => {
		await seedOrder({ customer_name: "E2E_TEST_NoteCustomer" });
		await authedPage.goto("/orders");
		const row = authedPage.getByRole("row", {
			name: /E2E_TEST_NoteCustomer/i,
		});
		await expect(row).toBeVisible({ timeout: 10_000 });

		// Open notes modal — discover note icon ref via playwright-cli snapshot
		const notesBtn = row
			.getByTestId("open-notes")
			.or(row.getByRole("button", { name: /note/i }));
		await notesBtn.first().click();

		const modal = authedPage.getByRole("dialog");
		await expect(modal).toBeVisible();

		const noteInput = modal.getByRole("textbox");
		await noteInput.fill("E2E Test Note Content");

		const saveBtn = modal.getByRole("button", { name: /save/i });
		await saveBtn.click();
		await expect(modal).not.toBeVisible();
	});

	test("attachment upload rejects files over 5MB", async ({ authedPage }) => {
		await seedOrder({ customer_name: "E2E_TEST_AttachCustomer" });
		await authedPage.goto("/orders");
		const row = authedPage.getByRole("row", {
			name: /E2E_TEST_AttachCustomer/i,
		});
		await expect(row).toBeVisible({ timeout: 10_000 });

		const attachBtn = row
			.getByTestId("open-attachments")
			.or(row.getByRole("button", { name: /attach/i }));
		await attachBtn.first().click();

		const modal = authedPage.getByRole("dialog");
		await expect(modal).toBeVisible();

		// Try to upload a >5MB file — use a generated buffer
		const bigFile = Buffer.alloc(6 * 1024 * 1024); // 6MB
		const fileInput = modal.locator('input[type="file"]');
		await fileInput.setInputFiles({
			name: "big.jpg",
			mimeType: "image/jpeg",
			buffer: bigFile,
		});

		// Error message about file size limit should appear
		const errorMsg = modal
			.getByText(/5.?mb|too large|size limit/i)
			.or(modal.getByRole("alert"));
		await expect(errorMsg.first()).toBeVisible();
	});
});
