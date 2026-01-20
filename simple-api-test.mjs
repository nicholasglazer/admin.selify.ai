#!/usr/bin/env node

/**
 * Simple API Testing Script for Ops Hub
 *
 * This script tests the admin.selify.ai ops pages using the existing browser session
 * and direct API calls to identify issues with data loading and authentication.
 */

import { chromium } from 'playwright';

async function testOpsPages() {
  console.log('🔍 Starting comprehensive ops pages testing...\n');

  let browser;
  let context;
  let page;

  try {
    // Connect to existing browser session
    console.log('Connecting to existing browser...');
    browser = await chromium.connectOverCDP('http://localhost:9222');

    context = await browser.newContext();
    page = await context.newPage();

    // Network monitoring
    const networkLogs = [];

    page.on('request', request => {
      if (request.url().includes('/api/ops/')) {
        networkLogs.push({
          type: 'REQUEST',
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/ops/')) {
        networkLogs.push({
          type: 'RESPONSE',
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // Console monitoring
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Test each ops page
    const pages = [
      { path: '/services', name: 'Services' },
      { path: '/errors', name: 'Errors' },
      { path: '/logs', name: 'Logs' },
      { path: '/metrics', name: 'Metrics' },
      { path: '/database', name: 'Database' }
    ];

    for (const testPage of pages) {
      console.log(`\n📊 Testing ${testPage.name} page (${testPage.path})`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Clear previous logs
      networkLogs.length = 0;
      consoleLogs.length = 0;

      // Navigate to page
      try {
        await page.goto(`http://admin.selify.ai${testPage.path}`, { waitUntil: 'networkidle', timeout: 15000 });
        console.log('✅ Page loaded successfully');

        // Wait a bit for any async API calls
        await page.waitForTimeout(3000);

        // Check page content
        const pageContent = await page.content();
        const bodyText = await page.locator('body').textContent();

        console.log(`📄 Page content length: ${pageContent.length} chars`);
        console.log(`📝 Body text length: ${bodyText.length} chars`);

        // Check for authentication issues
        if (bodyText.includes('Access denied') || bodyText.includes('403')) {
          console.log('❌ Access denied - authentication/authorization issue');
        } else if (bodyText.includes('Sign in') || bodyText.includes('Login')) {
          console.log('❌ Not authenticated - redirected to login');
        } else {
          console.log('✅ Authentication appears successful');
        }

        // Check for data loading
        const hasData = !bodyText.includes('No data') && !bodyText.includes('0\nTotal') && !bodyText.includes('—ms');
        console.log(`📊 Has data: ${hasData ? '✅ Yes' : '❌ No - showing empty states'}`);

        // Log API calls
        console.log(`🌐 API calls made: ${networkLogs.filter(log => log.type === 'REQUEST').length}`);

        networkLogs.forEach(log => {
          if (log.type === 'REQUEST') {
            console.log(`  📤 ${log.method} ${log.url}`);
            if (log.headers?.authorization) {
              console.log(`     🔐 Auth: ${log.headers.authorization.substring(0, 20)}...`);
            }
          } else {
            const statusEmoji = log.status < 300 ? '✅' : log.status < 400 ? '⚠️' : '❌';
            console.log(`  📥 ${statusEmoji} ${log.status} ${log.statusText} ${log.url}`);
          }
        });

        // Log console errors
        const errors = consoleLogs.filter(log => log.type === 'error');
        if (errors.length > 0) {
          console.log(`❌ Console errors (${errors.length}):`);
          errors.forEach(error => console.log(`  🚨 ${error.text}`));
        } else {
          console.log('✅ No console errors');
        }

        // Take screenshot
        await page.screenshot({
          path: `test-results/${testPage.name.toLowerCase()}-test.png`,
          fullPage: true
        });
        console.log(`📸 Screenshot saved: ${testPage.name.toLowerCase()}-test.png`);

      } catch (error) {
        console.log(`❌ Failed to test ${testPage.name} page:`, error.message);
      }
    }

    // Test API endpoints directly with proper auth
    console.log('\n🔧 Testing API endpoints directly');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // First, try to get auth token from a legitimate page visit
    await page.goto('http://admin.selify.ai/', { waitUntil: 'networkidle' });

    let authToken = null;
    const requests = networkLogs.filter(log => log.type === 'REQUEST' && log.headers?.authorization);
    if (requests.length > 0) {
      authToken = requests[0].headers.authorization;
      console.log(`🔐 Found auth token: ${authToken.substring(0, 30)}...`);
    }

    const endpoints = [
      '/api/ops/health',
      '/api/ops/dashboard',
      '/api/ops/errors',
      '/api/ops/logs',
      '/api/ops/errors/stats',
      '/api/ops/logs/services'
    ];

    if (authToken) {
      for (const endpoint of endpoints) {
        try {
          console.log(`\n🧪 Testing ${endpoint}`);

          const response = await page.request.get(`https://api.selify.ai${endpoint}`, {
            headers: {
              'Authorization': authToken,
              'Content-Type': 'application/json'
            }
          });

          const statusEmoji = response.ok() ? '✅' : '❌';
          console.log(`  ${statusEmoji} ${response.status()} ${response.statusText()}`);

          if (response.ok()) {
            try {
              const data = await response.json();
              if (Array.isArray(data)) {
                console.log(`  📊 Response: Array with ${data.length} items`);
                if (data.length > 0) {
                  console.log(`  🔍 First item keys: ${Object.keys(data[0]).join(', ')}`);
                }
              } else if (typeof data === 'object') {
                console.log(`  📊 Response: Object with keys: ${Object.keys(data).join(', ')}`);
              }
            } catch (parseError) {
              console.log(`  ⚠️ Response not JSON: ${await response.text().then(t => t.substring(0, 100))}...`);
            }
          } else {
            console.log(`  ❌ Error: ${await response.text()}`);
          }

        } catch (apiError) {
          console.log(`  💥 API call failed: ${apiError.message}`);
        }
      }
    } else {
      console.log('❌ No auth token found, skipping direct API tests');
    }

  } catch (error) {
    console.error('💥 Test script failed:', error);
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
  }

  console.log('\n🎯 Testing complete!');
  console.log('Check test-results/ folder for screenshots and detailed logs.');
}

// Run the test
testOpsPages().catch(console.error);