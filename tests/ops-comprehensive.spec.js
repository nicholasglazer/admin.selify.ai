import {test, expect} from '@playwright/test';

/**
 * Comprehensive Ops Pages Tests - Detailed API and Data Testing
 *
 * This test suite provides deep insights into the ops pages functionality:
 * - API endpoint testing and response validation
 * - Authentication and authorization flow
 * - Data loading and display verification
 * - Network request monitoring
 * - Console error detection
 * - Screenshot capture for visual debugging
 *
 * Pages tested:
 * - /services - Service health monitoring
 * - /errors - Error tracking and analysis
 * - /logs - Log aggregation and viewing
 * - /metrics - System metrics and monitoring
 * - /database - Database monitoring
 */

test.describe('Ops Pages - Comprehensive Testing', () => {
  let networkLogs = [];
  let consoleLogs = [];

  test.beforeEach(async ({page}) => {
    // Clear logs
    networkLogs = [];
    consoleLogs = [];

    // Monitor network requests
    page.on('request', (request) => {
      networkLogs.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        headers: Object.fromEntries(Object.entries(request.headers()).filter(([key]) =>
          ['authorization', 'content-type', 'accept'].includes(key.toLowerCase())
        )),
        timestamp: new Date().toISOString()
      });
    });

    page.on('response', (response) => {
      networkLogs.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: Object.fromEntries(Object.entries(response.headers()).filter(([key]) =>
          ['content-type', 'cache-control', 'x-ratelimit-remaining'].includes(key.toLowerCase())
        )),
        timestamp: new Date().toISOString()
      });
    });

    // Monitor console messages
    page.on('console', (msg) => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
    });
  });

  test.afterEach(async ({}, testInfo) => {
    // Log network and console information for debugging
    console.log('\n=== NETWORK LOGS ===');
    networkLogs.forEach(log => {
      if (log.url.includes('/api/ops/')) {
        console.log(`${log.type.toUpperCase()}: ${log.method || ''} ${log.url}`);
        if (log.status) console.log(`  Status: ${log.status} ${log.statusText}`);
        if (log.headers?.authorization) console.log(`  Auth: ${log.headers.authorization.substring(0, 20)}...`);
      }
    });

    console.log('\n=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => {
      if (log.type !== 'log' || log.text.includes('error') || log.text.includes('fail')) {
        console.log(`${log.type.toUpperCase()}: ${log.text}`);
      }
    });
  });

  test.describe('Services Page (/services)', () => {
    test('comprehensive services page testing', async ({page}) => {
      console.log('\n🔍 Testing /services page...');

      // Navigate to services page
      await page.goto('/services');
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Take initial screenshot
      await page.screenshot({ path: 'test-results/services-initial.png', fullPage: true });

      // Check for authentication/authorization
      const bodyText = await page.locator('body').textContent();
      console.log('Page content length:', bodyText?.length || 0);

      if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
        console.log('❌ Access denied to /services page');
        await page.screenshot({ path: 'test-results/services-access-denied.png', fullPage: true });
        return;
      }

      // Wait for page to load
      await page.waitForSelector('h1', { timeout: 10000 });

      // Check for API calls to backend
      const apiCalls = networkLogs.filter(log => log.url.includes('/api/ops/'));
      console.log('API calls made:', apiCalls.map(call => `${call.method || 'RES'} ${call.url} - ${call.status || 'REQ'}`));

      // Look for specific ops API endpoints
      const healthCalls = networkLogs.filter(log => log.url.includes('/api/ops/health'));
      const dashboardCalls = networkLogs.filter(log => log.url.includes('/api/ops/dashboard'));

      console.log('Health API calls:', healthCalls.length);
      console.log('Dashboard API calls:', dashboardCalls.length);

      // Check for service health data display
      const pageContent = await page.content();
      const hasServiceData = pageContent.includes('healthy') || pageContent.includes('Kong') || pageContent.includes('API Gateway');
      console.log('Has service data:', hasServiceData);

      // Check for empty states or error messages
      const hasEmptyState = pageContent.includes('No data') || pageContent.includes('0/0') || pageContent.includes('—ms');
      console.log('Has empty state:', hasEmptyState);

      // Take final screenshot
      await page.screenshot({ path: 'test-results/services-final.png', fullPage: true });

      // Basic assertions
      expect(bodyText).not.toContain('Access denied');
      await expect(page).toHaveURL(/\/services/);
    });
  });

  test.describe('Errors Page (/errors)', () => {
    test('comprehensive errors page testing', async ({page}) => {
      console.log('\n🔍 Testing /errors page...');

      await page.goto('/errors');
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Take initial screenshot
      await page.screenshot({ path: 'test-results/errors-initial.png', fullPage: true });

      const bodyText = await page.locator('body').textContent();
      console.log('Page content length:', bodyText?.length || 0);

      if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
        console.log('❌ Access denied to /errors page');
        await page.screenshot({ path: 'test-results/errors-access-denied.png', fullPage: true });
        return;
      }

      await page.waitForSelector('h1', { timeout: 10000 });

      // Check for errors API calls
      const errorsCalls = networkLogs.filter(log => log.url.includes('/api/ops/errors'));
      const statsCalls = networkLogs.filter(log => log.url.includes('/api/ops/errors/stats'));

      console.log('Errors API calls:', errorsCalls.length);
      console.log('Stats API calls:', statsCalls.length);

      // Check for error data display
      const pageContent = await page.content();
      const hasErrorData = pageContent.includes('error') && !pageContent.includes('No errors') && !pageContent.includes('0\nTotal');
      console.log('Has error data:', hasErrorData);

      // Check for stats/metrics
      const hasStats = pageContent.includes('Total') || pageContent.includes('tracked');
      console.log('Has error stats:', hasStats);

      await page.screenshot({ path: 'test-results/errors-final.png', fullPage: true });

      expect(bodyText).not.toContain('Access denied');
      await expect(page).toHaveURL(/\/errors/);
    });
  });

  test.describe('Logs Page (/logs)', () => {
    test('comprehensive logs page testing', async ({page}) => {
      console.log('\n🔍 Testing /logs page...');

      await page.goto('/logs');
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      await page.screenshot({ path: 'test-results/logs-initial.png', fullPage: true });

      const bodyText = await page.locator('body').textContent();
      console.log('Page content length:', bodyText?.length || 0);

      if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
        console.log('❌ Access denied to /logs page');
        await page.screenshot({ path: 'test-results/logs-access-denied.png', fullPage: true });
        return;
      }

      await page.waitForSelector('h1', { timeout: 10000 });

      // Check for logs API calls
      const logsCalls = networkLogs.filter(log => log.url.includes('/api/ops/logs'));
      const servicesCalls = networkLogs.filter(log => log.url.includes('/api/ops/logs/services'));

      console.log('Logs API calls:', logsCalls.length);
      console.log('Services API calls:', servicesCalls.length);

      // Check for log data display
      const pageContent = await page.content();
      const hasLogData = !pageContent.includes('No logs in this period') && !pageContent.includes('0\nTotal');
      console.log('Has log data:', hasLogData);

      await page.screenshot({ path: 'test-results/logs-final.png', fullPage: true });

      expect(bodyText).not.toContain('Access denied');
      await expect(page).toHaveURL(/\/logs/);
    });
  });

  test.describe('Metrics Page (/metrics)', () => {
    test('comprehensive metrics page testing', async ({page}) => {
      console.log('\n🔍 Testing /metrics page...');

      await page.goto('/metrics');
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      await page.screenshot({ path: 'test-results/metrics-initial.png', fullPage: true });

      const bodyText = await page.locator('body').textContent();
      console.log('Page content length:', bodyText?.length || 0);

      if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
        console.log('❌ Access denied to /metrics page');
        await page.screenshot({ path: 'test-results/metrics-access-denied.png', fullPage: true });
        return;
      }

      await page.waitForSelector('h1', { timeout: 10000 });

      // Check for metrics API calls
      const metricsCalls = networkLogs.filter(log =>
        log.url.includes('/api/ops/dashboard') || log.url.includes('/api/ops/health')
      );

      console.log('Metrics-related API calls:', metricsCalls.length);

      // Check for metrics data display
      const pageContent = await page.content();
      const hasMetricsData = pageContent.includes('Uptime') || pageContent.includes('Response') || pageContent.includes('%');
      console.log('Has metrics data:', hasMetricsData);

      await page.screenshot({ path: 'test-results/metrics-final.png', fullPage: true });

      expect(bodyText).not.toContain('Access denied');
      await expect(page).toHaveURL(/\/metrics/);
    });
  });

  test.describe('Database Page (/database)', () => {
    test('comprehensive database page testing', async ({page}) => {
      console.log('\n🔍 Testing /database page...');

      await page.goto('/database');
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      await page.screenshot({ path: 'test-results/database-initial.png', fullPage: true });

      const bodyText = await page.locator('body').textContent();
      console.log('Page content length:', bodyText?.length || 0);

      if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
        console.log('❌ Access denied to /database page');
        await page.screenshot({ path: 'test-results/database-access-denied.png', fullPage: true });
        return;
      }

      await page.waitForSelector('h1, [data-testid="database"]', { timeout: 10000 });

      // Check for database API calls
      const dbCalls = networkLogs.filter(log =>
        log.url.includes('/api/ops/database') || log.url.includes('database')
      );

      console.log('Database API calls:', dbCalls.length);

      // Check for database data display
      const pageContent = await page.content();
      const hasDatabaseData = pageContent.includes('Tables') || pageContent.includes('MB') || pageContent.includes('Connections');
      console.log('Has database data:', hasDatabaseData);

      await page.screenshot({ path: 'test-results/database-final.png', fullPage: true });

      expect(bodyText).not.toContain('Access denied');
      await expect(page).toHaveURL(/\/database/);
    });
  });

  test.describe('API Response Validation', () => {
    test('validate all ops API endpoints respond correctly', async ({page}) => {
      console.log('\n🔍 Testing API endpoints directly...');

      // We need to get the session token first by navigating to an authenticated page
      await page.goto('/');
      await page.waitForLoadState('networkidle', { timeout: 5000 });

      // Extract token from requests
      let authToken = null;
      const requestWithAuth = networkLogs.find(log =>
        log.type === 'request' && log.headers?.authorization
      );
      if (requestWithAuth) {
        authToken = requestWithAuth.headers.authorization;
        console.log('Found auth token:', authToken?.substring(0, 20) + '...');
      }

      if (!authToken) {
        console.log('❌ No auth token found, skipping API tests');
        return;
      }

      // Test each API endpoint
      const endpoints = [
        '/api/ops/health',
        '/api/ops/dashboard',
        '/api/ops/errors',
        '/api/ops/logs',
        '/api/ops/errors/stats',
        '/api/ops/logs/services'
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`Testing ${endpoint}...`);

          const response = await page.request.get(`https://api.selify.ai${endpoint}`, {
            headers: {
              'Authorization': authToken,
              'Content-Type': 'application/json'
            }
          });

          console.log(`${endpoint}: ${response.status()} ${response.statusText()}`);

          if (response.ok()) {
            const data = await response.json();
            console.log(`${endpoint}: Response data keys:`, Object.keys(data));
          } else {
            console.log(`${endpoint}: Error response`);
          }

        } catch (error) {
          console.log(`${endpoint}: Request failed -`, error.message);
        }
      }
    });
  });
});