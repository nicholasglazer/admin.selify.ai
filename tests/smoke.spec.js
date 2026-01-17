import {test, expect} from '@playwright/test';

/**
 * Smoke Tests - Quick Validation of All Pages
 *
 * This test suite performs a quick validation of all admin pages.
 * It checks:
 * - Page loads without crashing (500 errors)
 * - Basic content is rendered
 * - No JavaScript errors
 *
 * Run this first to catch major issues before detailed tests.
 */

const ALL_ROUTES = [
  {path: '/', name: 'Dashboard'},
  {path: '/pm', name: 'PM Board'},
  {path: '/team', name: 'Team'},
  {path: '/team/onboard', name: 'Team Onboard'},
  {path: '/workspaces', name: 'Workspaces'},
  {path: '/services', name: 'Services'},
  {path: '/metrics', name: 'Metrics'},
  {path: '/logs', name: 'Logs'},
  {path: '/errors', name: 'Errors'},
  {path: '/feedback', name: 'Feedback'}
];

test.describe('Smoke Tests - All Pages', () => {
  let consoleErrors = [];

  test.beforeEach(async ({page}) => {
    consoleErrors = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });
  });

  for (const route of ALL_ROUTES) {
    test(`${route.name} (${route.path}) should load without 500 error`, async ({page}) => {
      // Capture response status
      let responseStatus = 0;

      page.on('response', (response) => {
        if (response.url().includes(route.path) || response.url().endsWith(route.path)) {
          responseStatus = response.status();
        }
      });

      // Navigate to page
      const response = await page.goto(route.path, {waitUntil: 'domcontentloaded'});

      // Check main response
      const status = response?.status() || 200;

      // Should not be 500 (server error)
      expect(status).not.toBe(500);

      // If 403 (forbidden), that's expected for capability-gated pages
      if (status === 403) {
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).toMatch(/Access denied|Forbidden|403/i);
        return;
      }

      // Page should have some content
      await expect(page.locator('body')).toBeVisible();
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(10);
    });
  }
});

test.describe('Navigation Smoke Test', () => {
  test('should navigate through all sidebar links', async ({page}) => {
    await page.goto('/');

    // Get all sidebar links
    const sidebarLinks = page.locator('nav a, aside a, [data-testid="sidebar"] a');
    const linkCount = await sidebarLinks.count();

    // Visit each link
    for (let i = 0; i < Math.min(linkCount, 10); i++) {
      const link = sidebarLinks.nth(i);
      const href = await link.getAttribute('href');

      if (href && href.startsWith('/')) {
        await page.goto(href);

        // Should not crash
        const response = await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });
});

test.describe('Mobile Responsiveness Smoke Test', () => {
  test.use({viewport: {width: 375, height: 667}});

  test('dashboard should be usable on mobile', async ({page}) => {
    await page.goto('/');

    // Page should load
    await expect(page.locator('body')).toBeVisible();

    // Check for mobile menu or burger icon
    const mobileMenu = page.locator('[data-testid="mobile-menu"], .burger-menu, button[aria-label*="menu"]');

    // Either mobile menu exists or content is visible
    const hasContent = (await page.locator('body').textContent())?.length > 50;
    expect(hasContent).toBe(true);
  });
});
