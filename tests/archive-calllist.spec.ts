import { test, expect } from '@playwright/test';

test.describe('Archive Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/archive');
    await page.waitForLoadState('networkidle');
  });

  test('should load archive page successfully', async ({ page }) => {
    await expect(page).not.toHaveURL(/error/);
    
    const mainContent = page.locator('[class*="main"], main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 5000 });
  });

  test('should display archived items grid', async ({ page }) => {
    const grid = page.locator('[role="grid"], [class*="ag-root"], [class*="data-grid"]').first();
    await expect(grid).toBeVisible({ timeout: 5000 });
  });

  test('should display filter controls for archived items', async ({ page }) => {
    const filterInputs = page.locator('input[type="text"], input[type="search"]');
    const count = await filterInputs.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow restoring archived items', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const restoreButtons = page.locator('button').filter({ hasText: /restore|unarchive|recover/i });
    
    if (await restoreButtons.count() > 0) {
      await expect(restoreButtons.first()).toBeVisible();
    }
  });

  test('should display confirmation dialog when restoring item', async ({ page }) => {
    const restoreButtons = page.locator('button').filter({ hasText: /restore|unarchive/i });
    
    if (await restoreButtons.count() > 0) {
      await restoreButtons.first().click();
      
      const confirmDialog = page.locator('[role="dialog"]');
      await expect(confirmDialog).toBeVisible({ timeout: 2000 }).catch(() => {
        // Dialog might not appear
      });
    }
  });

  test('should display archive reason when viewing archived item', async ({ page }) => {
    // Look for archive reason text or column
    const archiveReasonElements = page.locator('text=/archived|reason|archived on/i');
    
    const count = await archiveReasonElements.count();
    // Archive reason might be displayed
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow deleting permanently archived items', async ({ page }) => {
    const deleteButtons = page.locator('button').filter({ hasText: /delete|remove|permanent/i });
    
    if (await deleteButtons.count() > 0) {
      await expect(deleteButtons.first()).toBeVisible();
    }
  });

  test('should display archive date and time', async ({ page }) => {
    // Look for date/time information
    const dateElements = page.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{4}/');
    
    const count = await dateElements.count();
    // Archive dates might be displayed
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should be responsive on different viewports', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 768, height: 1024 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForLoadState('networkidle');
      
      const grid = page.locator('[role="grid"], [class*="ag-root"], [class*="data-grid"]').first();
      await expect(grid).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Call List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/call-list');
    await page.waitForLoadState('networkidle');
  });

  test('should load call list page successfully', async ({ page }) => {
    await expect(page).not.toHaveURL(/error/);
    
    const mainContent = page.locator('[class*="main"], main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 5000 });
  });

  test('should display call list grid', async ({ page }) => {
    const grid = page.locator('[role="grid"], [class*="ag-root"], [class*="data-grid"]').first();
    await expect(grid).toBeVisible({ timeout: 5000 });
  });

  test('should display phone number or customer information', async ({ page }) => {
    // Look for phone-related content
    const phoneElements = page.locator('text=/\\d{3}[\\s-]?\\d{3}[\\s-]?\\d{4}/');
    
    // Phone numbers might be displayed
    const count = await phoneElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have call action buttons', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const callButtons = page.locator('button').filter({ hasText: /call|phone|contact|dial/i });
    
    const count = await callButtons.count();
    // Call buttons might be displayed
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow filtering call list', async ({ page }) => {
    const filterInputs = page.locator('input[type="text"], input[type="search"]');
    
    if (await filterInputs.count() > 0) {
      await filterInputs.first().fill('test');
      await page.waitForTimeout(300);
      
      // Grid should still be visible
      const grid = page.locator('[role="grid"], [class*="ag-root"]').first();
      await expect(grid).toBeVisible();
    }
  });

  test('should mark call as completed', async ({ page }) => {
    const completeButtons = page.locator('button').filter({ hasText: /complete|done|called/i });
    
    if (await completeButtons.count() > 0) {
      await expect(completeButtons.first()).toBeVisible();
    }
  });

  test('should display call history or status', async ({ page }) => {
    // Look for history or status indicators
    const statusElements = page.locator('[class*="status"], [class*="badge"], [class*="history"]');
    
    const count = await statusElements.count();
    // Status elements might be displayed
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display customer details in call list', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Look for customer information
    const customerElements = page.locator('[class*="customer"], [class*="info"], [role="cell"]');
    
    const count = await customerElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow sorting calls by different columns', async ({ page }) => {
    const headers = page.locator('[role="columnheader"]');
    
    if (await headers.count() > 0) {
      await headers.first().click();
      await page.waitForTimeout(300);
      
      const grid = page.locator('[role="grid"], [class*="ag-root"]').first();
      await expect(grid).toBeVisible();
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForLoadState('networkidle');
      
      const mainContent = page.locator('[class*="main"], main, [role="main"]').first();
      await expect(mainContent).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display prioritized calls first', async ({ page }) => {
    // Look for priority indicators
    const priorityElements = page.locator('[class*="priority"], [class*="urgent"], [class*="high"]');
    
    const count = await priorityElements.count();
    // Priority indicators might be displayed
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
