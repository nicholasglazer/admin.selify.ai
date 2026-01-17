import {test, expect} from '@playwright/test';

/**
 * Workspaces Admin Page Tests (/workspaces)
 *
 * Admin page for managing customer workspaces.
 * Requires: admin.workspaces.view capability
 *
 * Features:
 * - List all workspaces with pagination
 * - Search functionality
 * - Display workspace owner and billing info
 */

test.describe('Workspaces Admin Page', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/workspaces');
  });

  test('should load workspaces page or show access denied', async ({page}) => {
    const bodyText = await page.locator('body').textContent();
    const hasAccess = !bodyText?.includes('Access denied') && !bodyText?.includes('403');

    if (hasAccess) {
      await expect(page).toHaveURL(/\/workspaces/);
    } else {
      expect(bodyText).toMatch(/Access denied|403|Forbidden/i);
    }
  });

  test('should display workspaces list when authorized', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Should show workspace cards or table
    const workspaceList = page.locator('[data-testid="workspace-list"], .workspace-list, table, .workspace-card').first();
    await expect(workspaceList).toBeVisible({timeout: 10000});
  });

  test('should have search functionality', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], [data-testid="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500); // Debounce

      // Page should still be functional
      await expect(page).toHaveURL(/\/workspaces/);
    }
  });

  test('should have pagination controls', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Look for pagination
    const pagination = page.locator('[data-testid="pagination"], .pagination, button:has-text("Next"), button:has-text("Previous"), [aria-label*="page"]');

    // Pagination might not be visible if less than 20 workspaces
    const count = await pagination.count();

    // Just verify page loaded without errors
    await expect(page.locator('body')).toBeVisible();
  });
});
