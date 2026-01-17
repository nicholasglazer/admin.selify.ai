import {test, expect} from '@playwright/test';

/**
 * Feedback Page Tests (/feedback)
 *
 * Feedback collection and viewing page.
 * Requires: Basic authentication (no special capabilities)
 */

test.describe('Feedback Page', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/feedback');
  });

  test('should load feedback page', async ({page}) => {
    await expect(page).toHaveURL(/\/feedback/);

    // Should not show access denied (no special capability required)
    const bodyText = await page.locator('body').textContent();

    // Page should load with content
    expect(bodyText?.length).toBeGreaterThan(20);
  });

  test('should display feedback content', async ({page}) => {
    // Should show feedback list or form
    const feedbackContainer = page.locator('[data-testid="feedback"], .feedback, form, table').first();
    await expect(feedbackContainer).toBeVisible({timeout: 10000});
  });
});
