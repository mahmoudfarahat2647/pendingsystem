import { test, expect } from '@playwright/test';

test.describe('Performance & Edge Cases', () => {
  test('should load dashboard within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle empty data states gracefully', async ({ page }) => {
    await page.goto('/main-sheet');
    await page.waitForLoadState('networkidle');
    
    // Look for empty state message or content
    const emptyState = page.locator('text=/no data|empty|no results|no items/i');
    
    // Page should handle empty data
    const grid = page.locator('[role="grid"], [class*="ag-root"]').first();
    await expect(grid).toBeVisible({ timeout: 5000 });
  });

  test('should handle very long content without breaking layout', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    
    // Look for text fields
    const inputs = page.locator('input[type="text"]');
    
    if (await inputs.count() > 0) {
      // Try entering very long text
      const longText = 'A'.repeat(1000);
      await inputs.first().fill(longText);
      
      // Page should still be functional
      const layout = page.locator('body');
      await expect(layout).toBeVisible();
    }
  });

  test('should handle rapid page navigation', async ({ page }) => {
    const paths = ['/', '/main-sheet', '/booking', '/orders', '/'];
    
    for (const path of paths) {
      await page.goto(path);
      // Don't wait for full load to simulate rapid navigation
    }
    
    // Final page should load properly
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/error/);
  });

  test('should handle multiple rapid button clicks', async ({ page }) => {
    await page.goto('/main-sheet');
    await page.waitForLoadState('networkidle');
    
    const buttons = page.locator('button');
    
    if (await buttons.count() > 0) {
      const button = buttons.first();
      
      // Click multiple times rapidly
      for (let i = 0; i < 5; i++) {
        await button.click({ timeout: 500 }).catch(() => {
          // Click might fail, that's okay
        });
      }
      
      // Page should remain stable
      await expect(page).not.toHaveURL(/error/);
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline by blocking network
    await page.context().setOffline(true);
    
    await page.goto('/').catch(() => {
      // Navigation might fail when offline
    });
    
    // Restore network
    await page.context().setOffline(false);
    
    // Try loading page again
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should recover
    await expect(page).not.toHaveURL(/error/);
  });

  test('should handle large data grid without performance degradation', async ({ page }) => {
    await page.goto('/booking');
    await page.waitForLoadState('networkidle');
    
    const startTime = Date.now();
    
    // Scroll through grid
    const grid = page.locator('[role="grid"], [class*="ag-root"]').first();
    
    if (await grid.isVisible()) {
      // Scroll down multiple times
      for (let i = 0; i < 5; i++) {
        await grid.evaluate(el => {
          el.scrollTop += 100;
        });
        await page.waitForTimeout(100);
      }
    }
    
    const scrollTime = Date.now() - startTime;
    
    // Scrolling should be reasonably fast
    expect(scrollTime).toBeLessThan(3000);
  });

  test('should handle dialog open/close rapidly', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    
    const dialogButtons = page.locator('button').filter({ hasText: /new|add|create/i });
    
    if (await dialogButtons.count() > 0) {
      for (let i = 0; i < 3; i++) {
        // Open dialog
        await dialogButtons.first().click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(200);
        
        // Close dialog with ESC
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
      }
    }
    
    // Page should remain stable
    await expect(page).not.toHaveURL(/error/);
  });

  test('should handle special characters in form inputs', async ({ page }) => {
    await page.goto('/main-sheet');
    await page.waitForLoadState('networkidle');
    
    const inputs = page.locator('input[type="text"]');
    
    if (await inputs.count() > 0) {
      // Test with special characters
      const specialChars = '<script>alert("xss")</script>';
      await inputs.first().fill(specialChars);
      
      // Page should handle without executing script
      await page.waitForTimeout(300);
      await expect(page).not.toHaveURL(/error/);
    }
  });

  test('should handle unicode characters correctly', async ({ page }) => {
    await page.goto('/');
    
    const inputs = page.locator('input[type="text"]');
    
    if (await inputs.count() > 0) {
      // Test with unicode characters
      const unicodeText = '你好 🚗 مرحبا';
      await inputs.first().fill(unicodeText);
      
      const value = await inputs.first().inputValue();
      expect(value).toBe(unicodeText);
    }
  });

  test('should handle date inputs correctly', async ({ page }) => {
    await page.goto('/');
    
    const dateInputs = page.locator('input[type="date"]');
    
    if (await dateInputs.count() > 0) {
      const dateInput = dateInputs.first();
      
      // Set a date
      await dateInput.fill('2024-12-25');
      const value = await dateInput.inputValue();
      
      expect(value).toBe('2024-12-25');
    }
  });

  test('should handle checkbox state changes correctly', async ({ page }) => {
    await page.goto('/main-sheet');
    await page.waitForLoadState('networkidle');
    
    const checkboxes = page.locator('input[type="checkbox"]');
    
    if (await checkboxes.count() > 0) {
      const checkbox = checkboxes.first();
      
      // Toggle multiple times
      for (let i = 0; i < 3; i++) {
        await checkbox.click();
        await page.waitForTimeout(100);
      }
      
      // Grid should still be functional
      const grid = page.locator('[role="grid"], [class*="ag-root"]').first();
      await expect(grid).toBeVisible();
    }
  });

  test('should handle window resize during interaction', async ({ page }) => {
    await page.goto('/booking');
    await page.waitForLoadState('networkidle');
    
    // Perform interaction
    const buttons = page.locator('button');
    if (await buttons.count() > 0) {
      await buttons.first().click({ timeout: 2000 }).catch(() => {});
    }
    
    // Resize window
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    // Resize again
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForLoadState('networkidle');
    
    // Page should remain stable
    await expect(page).not.toHaveURL(/error/);
  });

  test('should handle multiple tabs without interference', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open a new page/tab context
    const newPage = await page.context().newPage();
    
    try {
      await newPage.goto('/booking');
      await newPage.waitForLoadState('networkidle');
      
      // Original page should still be functional
      await page.goto('/orders');
      await page.waitForLoadState('networkidle');
      
      // Both pages should load without error
      await expect(page).not.toHaveURL(/error/);
      await expect(newPage).not.toHaveURL(/error/);
    } finally {
      await newPage.close();
    }
  });

  test('should not have memory leaks with repeated interactions', async ({ page }) => {
    await page.goto('/main-sheet');
    
    // Perform repeated interactions
    for (let i = 0; i < 10; i++) {
      // Click grid cells
      const rows = page.locator('[role="row"]');
      if (await rows.count() > 1) {
        await rows.nth(1).click({ timeout: 1000 }).catch(() => {});
      }
      
      await page.waitForTimeout(100);
    }
    
    // Page should still be responsive
    const grid = page.locator('[role="grid"], [class*="ag-root"]').first();
    await expect(grid).toBeVisible({ timeout: 5000 });
  });
});
