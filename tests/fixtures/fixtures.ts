import { test as base } from '@playwright/test';

type TestFixtures = {
  authenticatedPage: void;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to home before each test
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await use();
  },
});

export { expect } from '@playwright/test';
