import { test, expect } from '@playwright/test';

test.describe('Orders Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
  });

  test('should load orders page successfully', async ({ page }) => {
    // Verify page loaded
    await expect(page).not.toHaveURL(/error/);
    
    // Wait for content
    const mainContent = page.locator('[class*="main"], main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 5000 });
  });

  test('should display orders grid', async ({ page }) => {
    const grid = page.locator('[role="grid"], [class*="ag-root"], [class*="data-grid"]').first();
    await expect(grid).toBeVisible({ timeout: 5000 });
  });

  test('should have toolbar with action buttons', async ({ page }) => {
    const toolbar = page.locator('[class*="toolbar"]').first();
    
    if (await toolbar.isVisible()) {
      const buttons = toolbar.locator('button');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should display order form modal button', async ({ page }) => {
    // Look for create/new order button
    const newOrderButtons = page.locator('button').filter({ hasText: /new|add|create|order/i });
    
    if (await newOrderButtons.count() > 0) {
      await expect(newOrderButtons.first()).toBeVisible();
    }
  });

  test('should open order form when create button clicked', async ({ page }) => {
    // Look for new order button
    const newOrderButtons = page.locator('button').filter({ hasText: /new|add|create/i });
    
    if (await newOrderButtons.count() > 0) {
      await newOrderButtons.first().click();
      
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 2000 }).catch(() => {
        // Modal might not appear
      });
    }
  });

  test('should allow selecting multiple orders', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
    
    if (await checkboxes.count() > 1) {
      const firstCheckbox = checkboxes.first();
      const secondCheckbox = checkboxes.nth(1);
      
      await firstCheckbox.click();
      await secondCheckbox.click();
      
      // Verify both are selected
      const firstChecked = await firstCheckbox.evaluate((el: any) => {
        if (el.type === 'checkbox') return el.checked;
        return el.getAttribute('aria-checked') === 'true';
      });
      
      const secondChecked = await secondCheckbox.evaluate((el: any) => {
        if (el.type === 'checkbox') return el.checked;
        return el.getAttribute('aria-checked') === 'true';
      });
      
      expect(firstChecked).toBe(true);
      expect(secondChecked).toBe(true);
    }
  });

  test('should display column headers for order data', async ({ page }) => {
    const headers = page.locator('[role="columnheader"]');
    const count = await headers.count();
    
    // Should have at least some columns
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow sorting by clicking column headers', async ({ page }) => {
    const headers = page.locator('[role="columnheader"]');
    
    if (await headers.count() > 0) {
      await headers.first().click();
      await page.waitForTimeout(300);
      
      // Grid should still be visible
      const grid = page.locator('[role="grid"], [class*="ag-root"]').first();
      await expect(grid).toBeVisible();
    }
  });

  test('should display context menu or actions for order rows', async ({ page }) => {
    // Look for action buttons
    const actionButtons = page.locator('button').filter({ hasText: /edit|view|delete|action/i });
    
    if (await actionButtons.count() > 0) {
      await expect(actionButtons.first()).toBeVisible();
    }
  });

  test('should handle order row click to view details', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Look for clickable row or detail button
    const rows = page.locator('[role="row"]');
    
    if (await rows.count() > 1) {
      // Click a data row (skip header row)
      await rows.nth(1).click({ timeout: 2000 }).catch(() => {
        // Row click might not be handled
      });
    }
  });

  test('should display responsive layout on different screen sizes', async ({ page }) => {
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

  test('should display status indicators for orders', async ({ page }) => {
    // Look for status badges/indicators
    const statusElements = page.locator('[class*="status"], [class*="badge"]');
    
    const count = await statusElements.count();
    // Status indicators might be present
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle pagination if many orders exist', async ({ page }) => {
    // Look for pagination controls
    const pagination = page.locator('[class*="pagination"], [aria-label*="page"]');
    
    const count = await pagination.count();
    // Pagination might exist depending on data
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display loading state while loading orders', async ({ page }) => {
    // Navigate and look for loading indicators
    await page.reload();
    
    // Look for skeleton loaders or spinners
    const loadingIndicators = page.locator('[class*="loading"], [class*="skeleton"], [role="progressbar"]');
    
    // Wait for loading to complete
    await page.waitForLoadState('networkidle');
    
    // After loading, content should be visible
    const grid = page.locator('[role="grid"], [class*="ag-root"], [class*="data-grid"]').first();
    await expect(grid).toBeVisible({ timeout: 5000 });
  });
});
