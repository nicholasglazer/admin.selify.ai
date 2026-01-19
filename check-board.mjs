import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const contexts = browser.contexts();
let page = contexts[0]?.pages()[0];

// Navigate to PM Board
await page.click('text=PM Board').catch(() => {});
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/pm-board.png' });
console.log('Current URL:', page.url());
