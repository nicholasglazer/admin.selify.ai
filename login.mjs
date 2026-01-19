import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const contexts = browser.contexts();
let page = contexts[0]?.pages()[0];

// Navigate fresh to admin
await page.goto('https://admin.selify.ai', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1000);

console.log('URL after goto:', page.url());

// Check if we need to login
if (page.url().includes('auth')) {
  await page.fill('input[name="email"]', 'nicholas.glazer@selify.ai');
  await page.fill('input[name="password"]', 'N2ToIT86S&Hi&RDd');
  await page.click('button:has-text("Sign In")');
  console.log('Submitted login');
  await page.waitForTimeout(4000);
}

await page.screenshot({ path: '/tmp/admin-screenshot.png' });
console.log('Final URL:', page.url());
