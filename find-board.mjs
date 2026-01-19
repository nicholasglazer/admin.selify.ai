import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const contexts = browser.contexts();
let page = contexts[0]?.pages()[0];

// Try the criteria page (might be the pipeline view)
await page.goto('https://dash.selify.ai/workspace/upgo-corp/organization/criteria', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/dash-screenshot.png' });
console.log('Current URL:', page.url());
