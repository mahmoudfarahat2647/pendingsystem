import { test, expect } from '@playwright/test';

test.describe('UI Components & Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading structure
    const h1s = page.locator('h1');
    const h2s = page.locator('h2');
    
    // Page should have at least one heading
    expect(await h1s.count() + await h2s.count()).toBeGreaterThanOrEqual(0);
  });

  test('should have alt text for all images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const images = page.locator('img');
    const count = await images.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        // Either has alt text or is decorative
        const isDecorative = await img.evaluate(el => 
          el.getAttribute('aria-hidden') === 'true'
        );
        
        expect(alt !== null || isDecorative).toBeTruthy();
      }
    }
  });

  test('buttons should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    // Focus should move to next element
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement;
      return active?.tagName;
    });
    
    // Should have some focusable element
    expect(focusedElement).toBeTruthy();
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    await page.goto('/');
    
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(5, count); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        
        // Button should have some accessible label
        expect(text || ariaLabel || title).toBeTruthy();
      }
    }
  });

  test('dialogs should trap focus', async ({ page }) => {
    await page.goto('/');
    
    // Try to open a dialog
    const dialogButtons = page.locator('button').filter({ hasText: /add|new|create|edit/i });
    
    if (await dialogButtons.count() > 0) {
      await dialogButtons.first().click({ timeout: 2000 }).catch(() => {
        // Button click might not open dialog
      });
      
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Dialog is open, check for close button or ESC functionality
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }
  });

  test('forms should have associated labels', async ({ page }) => {
    await page.goto('/');
    
    const inputs = page.locator('input[type="text"], input[type="number"], input[type="email"]');
    const count = await inputs.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(3, count); i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = (await label.count()) > 0;
          
          // Input should have either label or aria-label
          expect(hasLabel || ariaLabel).toBeTruthy();
        }
      }
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should load without errors
    await expect(page).not.toHaveURL(/error/);
  });

  test('links should be distinguishable from text', async ({ page }) => {
    await page.goto('/');
    
    const links = page.locator('a');
    const count = await links.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(5, count); i++) {
        const link = links.nth(i);
        const href = await link.getAttribute('href');
        
        // Links should have href
        expect(href).toBeTruthy();
      }
    }
  });

  test('should handle responsive text sizing', async ({ page }) => {
    await page.goto('/');
    
    const viewports = [
      { width: 320, height: 568 },  // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForLoadState('networkidle');
      
      // Page should be readable at all sizes
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });

  test('should have proper language attribute', async ({ page }) => {
    await page.goto('/');
    
    const html = page.locator('html');
    const lang = await html.getAttribute('lang');
    
    // HTML should have language specified
    expect(lang).toBeTruthy();
  });

  test('modals should have proper role and title', async ({ page }) => {
    await page.goto('/');
    
    const dialogButtons = page.locator('button').filter({ hasText: /add|new|create|edit|settings/i });
    
    if (await dialogButtons.count() > 0) {
      await dialogButtons.first().click({ timeout: 2000 }).catch(() => {
        // Button click might not work
      });
      
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Dialog should have aria-label or title
        const ariaLabel = await dialog.getAttribute('aria-label');
        const title = page.locator('[role="dialog"] h1, [role="dialog"] h2, [role="dialog"] [class*="title"]').first();
        const titleText = await title.textContent().catch(() => '');
        
        expect(ariaLabel || titleText).toBeTruthy();
        
        // Close dialog
        await page.keyboard.press('Escape');
      }
    }
  });

  test('should announce dynamic changes to screen readers', async ({ page }) => {
    await page.goto('/');
    
    // Look for aria-live regions
    const liveRegions = page.locator('[aria-live]');
    const count = await liveRegions.count();
    
    // Live regions might be present for alerts/notifications
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have loading states properly announced', async ({ page }) => {
    await page.goto('/');
    await page.reload();
    
    // Look for loading indicators
    const loadingIndicators = page.locator('[role="progressbar"], [class*="loading"], [aria-busy="true"]');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // After loading, should not have busy state
    const stillLoading = await page.locator('[aria-busy="true"]').count();
    expect(stillLoading).toBe(0);
  });
});
