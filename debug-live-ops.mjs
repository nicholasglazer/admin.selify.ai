#!/usr/bin/env node

/**
 * Debug Live Ops Pages - Headless Browser Analysis
 *
 * This script debugs the live admin.selify.ai ops pages to see exactly
 * what API calls are being made and why logs/errors show no data.
 */

import { chromium } from '@playwright/test';

async function debugLiveOpsPages() {
  console.log('🔍 Debugging live admin.selify.ai ops pages...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  // Network and console monitoring
  const networkLogs = [];
  const consoleLogs = [];

  page.on('request', request => {
    if (request.url().includes('/api/ops/') || request.url().includes('selify.ai')) {
      networkLogs.push({
        type: 'REQUEST',
        method: request.method(),
        url: request.url(),
        headers: Object.fromEntries(
          Object.entries(request.headers()).filter(([key]) =>
            ['authorization', 'content-type', 'accept'].includes(key.toLowerCase())
          )
        ),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/ops/') || response.url().includes('selify.ai')) {
      networkLogs.push({
        type: 'RESPONSE',
        status: response.status(),
        statusText: response.statusText(),
        url: response.url(),
        headers: Object.fromEntries(
          Object.entries(response.headers()).filter(([key]) =>
            ['content-type', 'content-length'].includes(key.toLowerCase())
          )
        ),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().toLowerCase().includes('error') || msg.text().toLowerCase().includes('fail')) {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
    }
  });

  const pagesToTest = [
    { path: '/services', name: 'Services' },
    { path: '/logs', name: 'Logs' },
    { path: '/errors', name: 'Errors' },
    { path: '/metrics', name: 'Metrics' }
  ];

  for (const testPage of pagesToTest) {
    console.log(`\n📊 Testing ${testPage.name} page (${testPage.path})`);
    console.log('═'.repeat(50));

    // Clear logs
    networkLogs.length = 0;
    consoleLogs.length = 0;

    try {
      // Navigate to page
      await page.goto(`https://admin.selify.ai${testPage.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for any async loading
      await page.waitForTimeout(5000);

      // Take screenshot
      await page.screenshot({
        path: `debug-results/${testPage.name.toLowerCase()}-live.png`,
        fullPage: true
      });

      // Get page content
      const pageContent = await page.content();
      const bodyText = await page.locator('body').textContent();

      console.log(`📄 Page loaded: ${pageContent.length} chars`);
      console.log(`📝 Body text: ${bodyText.length} chars`);

      // Check authentication state
      const hasAuth = bodyText.includes('Sign in') || bodyText.includes('Login');
      const hasAccess = bodyText.includes('Access denied') || bodyText.includes('403');

      if (hasAuth) {
        console.log('❌ Not authenticated - need to login');
      } else if (hasAccess) {
        console.log('❌ Access denied - authorization issue');
      } else {
        console.log('✅ Page accessible');
      }

      // Check for data vs empty states
      const hasData = !bodyText.includes('No logs') && !bodyText.includes('No errors') && !bodyText.includes('0\nTotal');
      console.log(`📊 Has data: ${hasData ? '✅ Yes' : '❌ Empty state'}`);

      // Check for SigNoz references
      const hasSigNoz = bodyText.includes('SigNoz') || pageContent.includes('SigNoz');
      console.log(`🔍 SigNoz references: ${hasSigNoz ? '❌ Still present' : '✅ Removed'}`);

      // Analyze API calls
      const apiRequests = networkLogs.filter(log => log.type === 'REQUEST' && log.url.includes('/api/ops/'));
      const apiResponses = networkLogs.filter(log => log.type === 'RESPONSE' && log.url.includes('/api/ops/'));

      console.log(`🌐 API requests: ${apiRequests.length}`);

      apiRequests.forEach(req => {
        console.log(`  📤 ${req.method} ${req.url}`);
        if (req.headers.authorization) {
          console.log(`     🔐 Auth: ${req.headers.authorization.substring(0, 20)}...`);
        }
      });

      console.log(`🌐 API responses: ${apiResponses.length}`);

      apiResponses.forEach(res => {
        const statusEmoji = res.status < 300 ? '✅' : res.status < 400 ? '⚠️' : '❌';
        console.log(`  📥 ${statusEmoji} ${res.status} ${res.statusText} ${res.url}`);
      });

      // Check for specific data patterns
      if (testPage.name === 'Services') {
        const hasServiceData = bodyText.includes('Kong') || bodyText.includes('healthy') || bodyText.includes('ms');
        console.log(`🔧 Service data: ${hasServiceData ? '✅ Present' : '❌ Missing'}`);
      }

      if (testPage.name === 'Logs') {
        const hasLogData = bodyText.includes('log') && !bodyText.includes('No logs');
        console.log(`📋 Log data: ${hasLogData ? '✅ Present' : '❌ Missing'}`);
      }

      if (testPage.name === 'Errors') {
        const hasErrorData = bodyText.includes('error') && !bodyText.includes('No errors');
        console.log(`🚨 Error data: ${hasErrorData ? '✅ Present' : '❌ Missing'}`);
      }

      // Console errors
      if (consoleLogs.length > 0) {
        console.log(`❌ Console errors (${consoleLogs.length}):`);
        consoleLogs.forEach(error => {
          console.log(`  🚨 ${error.type}: ${error.text}`);
        });
      } else {
        console.log('✅ No console errors');
      }

    } catch (error) {
      console.log(`💥 Failed to test ${testPage.name}: ${error.message}`);
    }
  }

  // Test API endpoints directly
  console.log('\n🔧 Direct API Endpoint Testing');
  console.log('═'.repeat(50));

  const endpoints = [
    '/api/ops/services',
    '/api/ops/health',
    '/api/ops/dashboard',
    '/api/ops/errors',
    '/api/ops/logs',
    '/api/ops/errors/stats',
    '/api/ops/logs/services'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🧪 Testing ${endpoint}`);

      const response = await page.request.get(`https://api.selify.ai${endpoint}`, {
        headers: {
          'Authorization': 'Bearer dummy-token-for-testing',
          'Content-Type': 'application/json'
        }
      });

      const statusEmoji = response.status() === 200 ? '✅' :
                         response.status() === 401 ? '🔐' :
                         response.status() === 404 ? '❌' : '⚠️';

      console.log(`  ${statusEmoji} ${response.status()} ${response.statusText()}`);

      if (response.status() === 200) {
        try {
          const data = await response.json();
          if (Array.isArray(data)) {
            console.log(`  📊 Response: Array with ${data.length} items`);
            if (data.length > 0 && typeof data[0] === 'object') {
              console.log(`  🔍 Sample keys: ${Object.keys(data[0]).slice(0, 5).join(', ')}`);
            }
          } else if (typeof data === 'object') {
            console.log(`  📊 Response: Object with keys: ${Object.keys(data).slice(0, 5).join(', ')}`);
          }
        } catch (e) {
          console.log(`  ⚠️ Response not JSON`);
        }
      } else if (response.status() === 401) {
        console.log(`  🔐 Endpoint exists but requires authentication`);
      } else if (response.status() === 404) {
        console.log(`  ❌ Endpoint not found`);
      }

    } catch (error) {
      console.log(`  💥 Request failed: ${error.message}`);
    }
  }

  await browser.close();

  console.log('\n🎯 Analysis Complete!');
  console.log('Check debug-results/ for screenshots');
}

// Create debug results directory
import { mkdirSync } from 'fs';
try {
  mkdirSync('debug-results', { recursive: true });
} catch (e) {
  // Directory already exists
}

debugLiveOpsPages().catch(console.error);