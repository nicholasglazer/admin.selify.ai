import {test as setup, expect} from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

/**
 * Authentication Setup for Admin Dashboard
 *
 * This setup handles Supabase authentication for admin.selify.ai tests.
 *
 * Authentication Flow:
 * 1. Navigate to dash.selify.ai/auth (SSO entry point)
 * 2. Sign in with test credentials
 * 3. Redirect back to admin.selify.ai
 * 4. Save auth state for subsequent tests
 *
 * Required Environment Variables:
 * - TEST_USER_EMAIL: Test user email (must be in internal.team_members)
 * - TEST_USER_PASSWORD: Test user password
 *
 * Alternative: Use existing browser session
 * If TEST_USE_EXISTING_SESSION=true, will try to reuse existing auth cookies
 */

setup('authenticate', async ({page}) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  // Option 1: Use API-based auth bypass (if available)
  if (process.env.TEST_AUTH_TOKEN) {
    console.log('Using direct auth token...');

    // Set Supabase auth cookies directly
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: process.env.TEST_AUTH_TOKEN,
        domain: '.selify.ai',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax'
      }
    ]);

    // Verify auth by visiting admin dashboard
    await page.goto('/');
    await expect(page.locator('body')).not.toContainText('Sign in');

    await page.context().storageState({path: authFile});
    return;
  }

  // Option 2: Interactive login via dash.selify.ai SSO
  if (!email || !password) {
    throw new Error(
      'TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables are required.\n' +
        'Set them in .env.test or export them before running tests.\n\n' +
        'Example:\n' +
        '  export TEST_USER_EMAIL="admin@selify.ai"\n' +
        '  export TEST_USER_PASSWORD="your-password"\n\n' +
        'Or use TEST_AUTH_TOKEN for direct token-based auth.'
    );
  }

  console.log(`Authenticating as ${email}...`);

  // Navigate to admin - should redirect to auth
  await page.goto('/');

  // Check if we're redirected to dash.selify.ai/auth
  const url = page.url();

  if (url.includes('dash.selify.ai/auth') || url.includes('/auth')) {
    // We're on the auth page - fill in credentials
    console.log('On auth page, filling credentials...');

    // Wait for the email input
    await page.waitForSelector('input[type="email"], input[name="email"]', {timeout: 10000});

    // Fill email
    await page.fill('input[type="email"], input[name="email"]', email);

    // Fill password
    await page.fill('input[type="password"], input[name="password"]', password);

    // Click sign in button
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")');

    // Wait for redirect back to admin
    await page.waitForURL(/admin\.selify\.ai|localhost:5174/, {timeout: 30000});

    console.log('Login successful, redirected to:', page.url());
  } else if (url.includes('admin.selify.ai') || url.includes('localhost:5174')) {
    // Already authenticated
    console.log('Already authenticated');
  } else {
    throw new Error(`Unexpected redirect to: ${url}`);
  }

  // Verify we're logged in by checking for admin dashboard content
  await expect(page.locator('body')).not.toContainText('Access denied', {timeout: 10000});

  // Save authentication state
  await page.context().storageState({path: authFile});
  console.log(`Auth state saved to ${authFile}`);
});
