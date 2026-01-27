import { expect, test } from "@playwright/test";

test.describe("Unified Notes System", () => {
	test.describe.configure({
		timeout: 180_000,
		mode: "serial",
	});

	test.beforeEach(async ({ page }) => {
		page.setDefaultNavigationTimeout(60_000);
		page.setDefaultTimeout(60_000);
		await page.goto("/orders", { waitUntil: "domcontentloaded" });
		await createOrderIfEmpty(page);
	});

	test("Booking note history: booking note appears with #booking", async ({ page }) => {
		const unique = `Customer ready for pickup ${Date.now()}`;

		await page.goto("/orders", { waitUntil: "domcontentloaded" });
		await createOrderIfEmpty(page);
		await selectFirstRow(page);
		const vin = await selectedVinFromInfoPanel(page);
		await confirmBookingWithNote(page, unique);

		await page.goto("/booking", { waitUntil: "domcontentloaded" });
		await openNotesModalForVin(page, vin);
		await expect.poll(async () => await existingNotesValue(page)).toContain(
			`${unique} #booking`,
		);
		await closeDialog(page);
	});

	test("Archive reason history: archive reason appears with #archive", async ({ page }) => {
		const unique = `Job completed successfully ${Date.now()}`;

		await page.goto("/orders", { waitUntil: "domcontentloaded" });
		await createOrderIfEmpty(page);
		await selectFirstRow(page);
		const vin = await selectedVinFromInfoPanel(page);
		await confirmArchiveWithReason(page, unique);

		await page.goto("/archive", { waitUntil: "domcontentloaded" });
		await openNotesModalForVin(page, vin);
		await expect.poll(async () => await existingNotesValue(page)).toContain(
			`${unique} #archive`,
		);
		await closeDialog(page);
	});

	test("Cumulative history: orders + booking + archive notes all preserved", async ({ page }) => {
		const unique = Date.now();
		const ordersNote = `Waiting for customer confirmation ${unique}`;
		const bookingNote = `Confirmed booking ${unique}`;
		const archiveReason = `Service completed ${unique}`;

		await page.goto("/orders", { waitUntil: "domcontentloaded" });
		await createOrderIfEmpty(page);
		await selectFirstRow(page);
		const vin = await selectedVinFromInfoPanel(page);
		await addOrdersManualNote(page, ordersNote);
		await confirmBookingWithNote(page, bookingNote);

		await page.goto("/booking", { waitUntil: "domcontentloaded" });
		await openNotesModalForVin(page, vin);
		await expect.poll(async () => await existingNotesValue(page)).toContain(
			`${ordersNote} #orders`,
		);
		await expect.poll(async () => await existingNotesValue(page)).toContain(
			`${bookingNote} #booking`,
		);
		await closeDialog(page);

		await page.goto("/orders", { waitUntil: "domcontentloaded" });
		await selectFirstRow(page);
		await confirmArchiveWithReason(page, archiveReason);

		await page.goto("/archive", { waitUntil: "domcontentloaded" });
		await openNotesModalForVin(page, vin);
		await expect.poll(async () => await existingNotesValue(page)).toContain(
			`${ordersNote} #orders`,
		);
		await expect.poll(async () => await existingNotesValue(page)).toContain(
			`${bookingNote} #booking`,
		);
		await expect.poll(async () => await existingNotesValue(page)).toContain(
			`${archiveReason} #archive`,
		);
		await closeDialog(page);
	});
});
