import {test, expect} from '@playwright/test';

/**
 * Unauthenticated Tests
 *
 * Tests that verify proper redirect behavior for unauthenticated users.
 * These tests run WITHOUT authentication state.
 */

test.describe('Unauthenticated Access', () => {
  const protectedRoutes = [
    '/',
    '/pm',
    '/team',
    '/team/onboard',
    '/workspaces',
    '/services',
    '/metrics',
    '/logs',
    '/errors',
    '/feedback'
  ];

  for (const route of protectedRoutes) {
    test(`should redirect ${route} to auth when not logged in`, async ({page}) => {
      // Navigate to protected route
      await page.goto(route);

      // Wait for navigation
      await page.waitForLoadState('networkidle');

      // Should redirect to auth page
      const url = page.url();

      // Either redirects to dash.selify.ai/auth or shows login prompt
      const isAuthRedirect =
        url.includes('/auth') || url.includes('dash.selify.ai') || url.includes('login') || url.includes('signin');

      const bodyText = await page.locator('body').textContent();
      const hasLoginPrompt =
        bodyText?.includes('Sign in') || bodyText?.includes('Log in') || bodyText?.includes('authenticate');

      // Must either redirect or show login prompt
      expect(isAuthRedirect || hasLoginPrompt).toBe(true);
    });
  }
});

test.describe('Auth Page Elements', () => {
  test('should show login form on auth redirect', async ({page}) => {
    // Try to access admin dashboard
    await page.goto('/');

    // Wait for redirect
    await page.waitForLoadState('networkidle');

    const url = page.url();

    // If we're on an auth page
    if (url.includes('/auth') || url.includes('login') || url.includes('dash.selify.ai')) {
      // Dismiss cookie consent if present - try multiple selectors
      try {
        const cookieModal = page.locator('text=This website uses cookies');
        if (await cookieModal.isVisible({timeout: 3000})) {
          // Find and click Accept All button
          await page.locator('button', {hasText: 'Accept All'}).click({timeout: 5000});
          await page.waitForTimeout(500);
        }
      } catch {
        // Cookie modal not present or already dismissed
      }

      // Should have Login heading visible
      const loginHeading = page.locator('text=Login');
      await expect(loginHeading.first()).toBeVisible({timeout: 10000});

      // Auth page is functional - redirected correctly
      expect(url).toMatch(/dash\.selify\.ai|auth|login/);
    }
  });
});
