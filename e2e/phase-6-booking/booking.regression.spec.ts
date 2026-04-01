import { test, expect } from "../fixtures";
import { seedBookingRow, cleanupTestRows } from "../seeds";

test.describe("Booking — Regression (P1)", () => {
	test.afterEach(async () => await cleanupTestRows());

	test("booking modal blocks confirmation with past date", async ({
		authedPage,
	}) => {
		await seedBookingRow();
		await authedPage.goto("/booking");
		const row = authedPage.getByRole("row", {
			name: /E2E_TEST_BookingCustomer/i,
		});
		await expect(row).toBeVisible({ timeout: 10_000 });
		await row.getByRole("checkbox").click();

		const rebookBtn = authedPage
			.getByTestId("rebook-button")
			.or(authedPage.getByRole("button", { name: /rebook|reschedule/i }));
		await rebookBtn.first().click();

		const modal = authedPage.getByRole("dialog");
		await expect(modal).toBeVisible();

		// Select a past date using the date picker
		const dateInput = modal.locator('input[type="date"]');
		await dateInput.fill("2020-01-01");

		const confirmBtn = modal.getByRole("button", { name: /confirm|book/i });
		// Confirm should be disabled for past date
		expect(await confirmBtn.isDisabled()).toBe(true);
	});
});
