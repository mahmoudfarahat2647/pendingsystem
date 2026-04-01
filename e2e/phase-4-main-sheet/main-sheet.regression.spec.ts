import { test, expect } from "../fixtures";
import { cleanupTestRows } from "../seeds";

test.describe("Main Sheet — Regression (P1)", () => {
	test.afterEach(async () => {
		await cleanupTestRows();
	});

	test("action toolbar is disabled while Main Sheet is locked", async ({
		authedPage,
	}) => {
		await authedPage.goto("/main-sheet");
		// Without unlocking, action buttons should be disabled
		const bookingBtn = authedPage
			.getByTestId("send-to-booking")
			.or(authedPage.getByRole("button", { name: /booking/i }));
		if (await bookingBtn.first().isVisible({ timeout: 3000 })) {
			expect(await bookingBtn.first().isDisabled()).toBe(true);
		}
	});
});
