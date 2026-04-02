import path from "node:path";
import { test as base, type Page } from "@playwright/test";

const AUTH_FILE = path.resolve(process.cwd(), "e2e/.auth/admin.json");

type Fixtures = {
	/** A Page that starts with the admin session already loaded. */
	authedPage: Page;
	/**
	 * Opt-in fixture: deletes all E2E_TEST_* rows from `orders` before the
	 * test body runs, and again after. Use this in any test that seeds its own data.
	 *
	 * Usage in a test file:
	 *   test('my test', async ({ authedPage, dbSeed }) => { ... });
	 */
	dbSeed: undefined;
};

export const test = base.extend<Fixtures>({
	authedPage: async ({ browser, baseURL }, use) => {
		const context = await browser.newContext({
			storageState: AUTH_FILE,
			baseURL: baseURL ?? "http://localhost:3000",
		});
		const page = await context.newPage();
		await use(page);
		await context.close();
	},

	// auto: false — tests must explicitly request this fixture
	dbSeed: [
		async ({}, use) => {
			const { cleanupTestRows } = await import("../seeds/cleanup");
			await cleanupTestRows();
			await use(undefined);
			await cleanupTestRows();
		},
		{ auto: false },
	],
});

export { expect } from "@playwright/test";
