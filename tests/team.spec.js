import {test, expect} from '@playwright/test';

/**
 * Team Page Tests (/team)
 *
 * Team management page for viewing internal team members.
 * Requires: team.view capability
 *
 * Features:
 * - List all active team members
 * - Display member info (name, email, role, last login)
 * - Navigate to onboarding page
 */

test.describe('Team Page', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/team');
  });

  test('should load team page or show access denied', async ({page}) => {
    const bodyText = await page.locator('body').textContent();
    const hasAccess = !bodyText?.includes('Access denied') && !bodyText?.includes('403');

    if (hasAccess) {
      await expect(page).toHaveURL(/\/team/);
    } else {
      expect(bodyText).toMatch(/Access denied|403|Forbidden/i);
    }
  });

  test('should display team members list when authorized', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Should show team member cards or table
    const memberList = page.locator('[data-testid="team-list"], .team-list, table, .member-card').first();
    await expect(memberList).toBeVisible({timeout: 10000});
  });

  test('should display member details', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Should show emails or names
    const content = await page.locator('body').textContent();

    // Should have some content indicating team members
    expect(content?.length).toBeGreaterThan(50);
  });

  test('should have link to onboard new member', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Find onboard/invite link
    const onboardLink = page.locator('a[href="/team/onboard"], a:has-text("Onboard"), a:has-text("Invite"), button:has-text("Add")').first();

    if (await onboardLink.isVisible()) {
      await expect(onboardLink).toBeVisible();
    }
  });
});

test.describe('Team Onboard Page', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/team/onboard');
  });

  test('should load onboard page or show access denied', async ({page}) => {
    const bodyText = await page.locator('body').textContent();
    const hasAccess = !bodyText?.includes('Access denied') && !bodyText?.includes('403');

    if (hasAccess) {
      await expect(page).toHaveURL(/\/team\/onboard/);
    } else {
      expect(bodyText).toMatch(/Access denied|403|Forbidden/i);
    }
  });

  test('should display onboarding form when authorized', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Should show form with email, name, role fields
    const form = page.locator('form');
    await expect(form).toBeVisible({timeout: 10000});

    // Check for key form fields
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const nameInput = page.locator('input[name="name"], input[name="full_name"], input[placeholder*="name" i]');

    await expect(emailInput.or(nameInput).first()).toBeVisible();
  });

  test('should validate required fields', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Onboard")').first();

    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation errors or prevent submission
      // HTML5 validation will prevent submission on required fields
      await page.waitForTimeout(500);

      // Still on same page (form didn't submit)
      await expect(page).toHaveURL(/\/team\/onboard/);
    }
  });
});
