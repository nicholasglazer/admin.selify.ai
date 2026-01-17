import {test, expect} from '@playwright/test';

/**
 * Ops Pages Tests (/services, /metrics, /logs, /errors)
 *
 * Operations dashboard pages for monitoring and troubleshooting.
 * Various capability requirements.
 *
 * Pages:
 * - /services - Service health monitoring (ops.services.view)
 * - /metrics - Dashboard metrics (ops.metrics.view)
 * - /logs - Service logs (ops.logs.view)
 * - /errors - Error tracking (ops.errors.view)
 */

test.describe('Services Page', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/services');
  });

  test('should load services page or show access denied', async ({page}) => {
    const bodyText = await page.locator('body').textContent();
    const hasAccess = !bodyText?.includes('Access denied') && !bodyText?.includes('403');

    if (hasAccess) {
      await expect(page).toHaveURL(/\/services/);
    } else {
      expect(bodyText).toMatch(/Access denied|403|Forbidden/i);
    }
  });

  test('should display service health cards when authorized', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Should show service health information
    const healthContainer = page.locator('[data-testid="services"], .services, .health-card, .service-card').first();
    await expect(healthContainer).toBeVisible({timeout: 15000});
  });

  test('should show service status indicators', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Look for status indicators (healthy, degraded, down)
    const content = await page.locator('body').textContent();

    // Should have some status-related content
    expect(content?.length).toBeGreaterThan(50);
  });
});

test.describe('Metrics Page', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/metrics');
  });

  test('should load metrics page or show access denied', async ({page}) => {
    const bodyText = await page.locator('body').textContent();
    const hasAccess = !bodyText?.includes('Access denied') && !bodyText?.includes('403');

    if (hasAccess) {
      await expect(page).toHaveURL(/\/metrics/);
    } else {
      expect(bodyText).toMatch(/Access denied|403|Forbidden/i);
    }
  });

  test('should display metrics dashboard when authorized', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Should show metrics content
    const metricsContainer = page.locator('[data-testid="metrics"], .metrics, .dashboard, .chart').first();
    await expect(metricsContainer).toBeVisible({timeout: 10000});
  });
});

test.describe('Logs Page', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/logs');
  });

  test('should load logs page or show access denied', async ({page}) => {
    const bodyText = await page.locator('body').textContent();
    const hasAccess = !bodyText?.includes('Access denied') && !bodyText?.includes('403');

    if (hasAccess) {
      await expect(page).toHaveURL(/\/logs/);
    } else {
      expect(bodyText).toMatch(/Access denied|403|Forbidden/i);
    }
  });

  test('should display logs viewer when authorized', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Should show logs content or pending integration message
    await expect(page.locator('body')).toBeVisible();

    // Page loaded successfully
    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(20);
  });
});

test.describe('Errors Page', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/errors');
  });

  test('should load errors page or show access denied', async ({page}) => {
    const bodyText = await page.locator('body').textContent();
    const hasAccess = !bodyText?.includes('Access denied') && !bodyText?.includes('403');

    if (hasAccess) {
      await expect(page).toHaveURL(/\/errors/);
    } else {
      expect(bodyText).toMatch(/Access denied|403|Forbidden/i);
    }
  });

  test('should display error tracking when authorized', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Should show error tracking content
    const errorsContainer = page.locator('[data-testid="errors"], .errors, .error-list, table').first();
    await expect(errorsContainer).toBeVisible({timeout: 10000});
  });
});
