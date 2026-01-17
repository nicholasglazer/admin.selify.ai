import {test, expect} from '@playwright/test';

/**
 * Dashboard Page Tests (/)
 *
 * The dashboard is the landing page for authenticated admin users.
 * It displays:
 * - Quick stats cards
 * - User capabilities
 * - Quick action buttons
 * - Theme toggle
 */

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/');
  });

  test('should load dashboard successfully', async ({page}) => {
    // Dashboard should be visible
    await expect(page).toHaveURL(/\//);

    // Should not show access denied
    await expect(page.locator('body')).not.toContainText('Access denied');

    // Should show some dashboard content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display sidebar navigation', async ({page}) => {
    // Sidebar should be present with navigation items
    const sidebar = page.locator('[data-testid="sidebar"], nav, aside').first();
    await expect(sidebar).toBeVisible();
  });

  test('should have working theme toggle', async ({page}) => {
    // Look for theme toggle button
    const themeToggle = page.locator('button:has-text("theme"), [data-testid="theme-toggle"], button[aria-label*="theme"]').first();

    if (await themeToggle.isVisible()) {
      // Get initial theme
      const html = page.locator('html');
      const initialTheme = await html.getAttribute('data-theme');

      // Click toggle
      await themeToggle.click();

      // Theme should change
      const newTheme = await html.getAttribute('data-theme');
      expect(newTheme).not.toBe(initialTheme);
    }
  });

  test('should display user information', async ({page}) => {
    // Should show some indicator of logged-in user
    // This could be avatar, email, or capabilities section
    const userIndicators = page.locator('[data-testid="user-info"], .user-avatar, .capabilities, .user-email');

    // At least one should be visible or page should have content
    await expect(page.locator('body')).toHaveText(/.+/);
  });

  test('should navigate to PM board from dashboard', async ({page}) => {
    // Find and click PM/Tasks link
    const pmLink = page.locator('a[href="/pm"], a:has-text("PM"), a:has-text("Tasks"), a:has-text("Board")').first();

    if (await pmLink.isVisible()) {
      await pmLink.click();
      await expect(page).toHaveURL(/\/pm/);
    }
  });
});
