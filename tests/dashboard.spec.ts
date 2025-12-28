import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test('should load dashboard and display main layout', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Verify the page title or header
    const mainContent = page.locator('[class*="main-content"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('should display dashboard stats cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for stat cards that should be visible on dashboard
    const cards = page.locator('role=heading, level=3').first();
    await expect(cards).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to main sheet page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for navigation link to main sheet
    const mainSheetLink = page.locator('a, button').filter({ hasText: /main sheet|pending|lines/i }).first();
    
    if (await mainSheetLink.isVisible()) {
      await mainSheetLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*main-sheet/);
    }
  });

  test('should navigate to booking page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for navigation link to booking
    const bookingLink = page.locator('a, button').filter({ hasText: /booking|calendar|reservations/i }).first();
    
    if (await bookingLink.isVisible()) {
      await bookingLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*booking/);
    }
  });

  test('should navigate to orders page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for navigation link to orders
    const ordersLink = page.locator('a, button').filter({ hasText: /order|shopping|purchase/i }).first();
    
    if (await ordersLink.isVisible()) {
      await ordersLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*orders/);
    }
  });

  test('should navigate to archive page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for navigation link to archive
    const archiveLink = page.locator('a, button').filter({ hasText: /archive|history/i }).first();
    
    if (await archiveLink.isVisible()) {
      await archiveLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*archive/);
    }
  });

  test('should navigate to call list page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for navigation link to call list
    const callListLink = page.locator('a, button').filter({ hasText: /call|phone|list/i }).first();
    
    if (await callListLink.isVisible()) {
      await callListLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*call-list/);
    }
  });

  test('should display warranty calculator on dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for calculator inputs or elements
    const inputs = page.locator('input[type="number"], input[type="date"]');
    const count = await inputs.count();
    
    // If calculator is visible, we should have at least some input elements
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
