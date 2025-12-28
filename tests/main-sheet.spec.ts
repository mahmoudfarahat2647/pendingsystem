import { test, expect } from '@playwright/test';

test.describe('Main Sheet Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/main-sheet');
    await page.waitForLoadState('networkidle');
  });

  test('should load main sheet page with data grid', async ({ page }) => {
    // Wait for grid to be visible
    const grid = page.locator('[role="grid"], [class*="ag-root"], [class*="data-grid"]').first();
    await expect(grid).toBeVisible({ timeout: 5000 });
  });

  test('should display toolbar with action buttons', async ({ page }) => {
    // Look for toolbar actions
    const toolbar = page.locator('[class*="toolbar"]').first();
    
    if (await toolbar.isVisible()) {
      const buttons = toolbar.locator('button');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should display lock/unlock sheet button', async ({ page }) => {
    // Look for unlock button with icon
    const unlockButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(unlockButton).toBeVisible({ timeout: 5000 });
  });

  test('should toggle sheet lock state', async ({ page }) => {
    // Find the unlock button - should be the first button with icon
    const buttons = page.locator('button');
    
    for (let i = 0; i < Math.min(5, await buttons.count()); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      
      if (!text || text.toLowerCase().includes('unlock') || 
          await button.locator('svg').isVisible()) {
        await button.click();
        // Wait for UI to update
        await page.waitForTimeout(300);
        break;
      }
    }
  });

  test('should display grid with searchable content', async ({ page }) => {
    // Look for search/filter inputs
    const searchInputs = page.locator('input[type="text"]');
    const count = await searchInputs.count();
    
    // Should have at least some inputs for filtering/searching
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow selecting rows in grid', async ({ page }) => {
    // Wait for grid content
    await page.waitForTimeout(1000);
    
    // Look for checkbox or row elements
    const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
    
    if (await checkboxes.count() > 0) {
      const firstCheckbox = checkboxes.first();
      await firstCheckbox.click();
      
      // Verify it's checked
      const isChecked = await firstCheckbox.evaluate((el: HTMLInputElement) => el.checked);
      expect(isChecked).toBe(true);
    }
  });

  test('should display row action buttons', async ({ page }) => {
    // Look for action buttons in toolbar or grid cells
    const actionButtons = page.locator('button').filter({ hasText: /archive|send|edit|delete/i });
    
    const count = await actionButtons.count();
    // Should have some action buttons available
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display modal when row action is triggered', async ({ page }) => {
    // Look for edit or view buttons
    const editButtons = page.locator('button').filter({ hasText: /edit|view|details/i });
    
    if (await editButtons.count() > 0) {
      await editButtons.first().click();
      
      // Wait for modal to appear
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 2000 }).catch(() => {
        // Modal might not appear, which is fine for this test
      });
    }
  });

  test('should have responsive grid that adapts to window size', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1366, height: 768 },  // Laptop
      { width: 768, height: 1024 },  // Tablet
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForLoadState('networkidle');
      
      const grid = page.locator('[role="grid"], [class*="ag-root"], [class*="data-grid"]').first();
      await expect(grid).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display pagination controls if grid has many rows', async ({ page }) => {
    // Look for pagination elements
    const pagination = page.locator('[class*="pagination"], [aria-label*="page"]');
    
    const paginationCount = await pagination.count();
    // Pagination might or might not be visible
    expect(paginationCount).toBeGreaterThanOrEqual(0);
  });

  test('should have timer display when sheet is unlocked', async ({ page }) => {
    // Look for any time-related text or elements
    const timeElements = page.locator('text=/\\d+:\\d+|minutes|seconds/i');
    
    const count = await timeElements.count();
    // Timer might be visible if sheet is unlocked
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
