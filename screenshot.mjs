import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const contexts = browser.contexts();
let page = contexts[0]?.pages()[0];

if (!page) {
  const context = contexts[0] || await browser.newContext();
  page = await context.newPage();
}

await page.goto('https://admin.selify.ai', { waitUntil: 'networkidle', timeout: 30000 });
await page.screenshot({ path: '/tmp/admin-screenshot.png', fullPage: false });

console.log('Screenshot saved to /tmp/admin-screenshot.png');
console.log('Page title:', await page.title());
