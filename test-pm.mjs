import { chromium } from 'playwright';

// Connect directly to the page websocket
const wsUrl = 'ws://localhost:9222/devtools/page/88EBE4A1877209BAD85A7F3740892691';

try {
  const browser = await chromium.connectOverCDP('http://localhost:9222', { timeout: 15000 });
  console.log('Connected to browser');
  
  const contexts = browser.contexts();
  console.log('Contexts:', contexts.length);
  
  if (contexts.length > 0) {
    const pages = contexts[0].pages();
    console.log('Pages:', pages.length);
  }
  
  await browser.close();
} catch (e) {
  console.error('CDP Error:', e.message);
  
  // Try using puppeteer-core as fallback
  console.log('\nTrying alternative connection method...');
}
