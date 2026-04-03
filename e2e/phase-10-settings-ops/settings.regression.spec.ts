import { expect, test } from "../fixtures";

test.describe("Settings — Regression (P1)", () => {
	test("settings modal has report/notifications tab visible", async ({
		authedPage,
	}) => {
		await authedPage.goto("/dashboard");
		const settingsBtn = authedPage
			.getByTestId("settings-button")
			.or(authedPage.getByRole("button", { name: /settings/i }));
		await settingsBtn.first().click();

		const modal = authedPage.getByRole("dialog");
		await expect(modal).toBeVisible();

		// Look for a report or notifications tab
		const reportTab = modal
			.getByRole("tab", { name: /report|notification/i })
			.or(modal.getByTestId("report-tab"))
			.or(modal.getByText(/report|notification/i).first());
		await expect(reportTab.first()).toBeVisible();
	});
});
