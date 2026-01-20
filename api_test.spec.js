const { test, expect } = require('@playwright/test');

test.describe('Admin API Endpoints Test', () => {

  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for navigation
    page.setDefaultTimeout(30000);
  });

  test('Services page analysis', async ({ page }) => {
    console.log('Testing services page...');

    // Navigate to services page
    await page.goto('https://admin.selify.ai/services');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Get page content info
    const title = await page.title();
    const url = await page.url();

    console.log(`Services Page - Title: ${title}, URL: ${url}`);

    // Get page text content
    const pageText = await page.locator('body').textContent();

    // Check for health-related content
    const hasHealthData = pageText.includes('healthy') || pageText.includes('Kong') || pageText.includes('API Gateway');
    const hasNoDataText = pageText.includes('No data') || pageText.includes('Loading') || pageText.includes('Error loading');

    console.log(`Services page analysis:`);
    console.log(`- Has health data indicators: ${hasHealthData}`);
    console.log(`- Has no-data indicators: ${hasNoDataText}`);
    console.log(`- Page contains text: ${pageText.substring(0, 500)}...`);

    // Take screenshot for visual verification
    await page.screenshot({ path: '/tmp/services_page.png', fullPage: true });
  });

});