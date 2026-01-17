import {defineConfig, devices} from '@playwright/test';

/**
 * Playwright configuration for admin.selify.ai e2e testing
 *
 * Features:
 * - Token-based authentication setup
 * - Capability-gated page testing
 * - HTML + Monocart reporting
 * - Trace/video/screenshot on failure
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI, once locally for flaky test detection
  retries: process.env.CI ? 2 : 1,

  // Workers: use all CPUs locally, limit on CI for stability
  workers: process.env.CI ? 2 : undefined,

  // Timeout per test
  timeout: 60000,

  // Expect timeout for assertions
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled'
    }
  },

  // Reporter configuration
  reporter:
    process.env.CI ?
      [
        ['blob'], // For sharded report merging
        ['github'], // GitHub Actions annotations
        ['html', {outputFolder: 'playwright-report', open: 'never'}]
      ]
    : [
        [
          'monocart-reporter',
          {
            name: 'Admin E2E Test Report',
            outputFile: './test-results/report.html'
          }
        ],
        ['html', {outputFolder: 'playwright-report', open: 'on-failure'}]
      ],

  use: {
    // Base URL - Admin runs on port 5174
    baseURL: process.env.BASE_URL || 'http://localhost:5174',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Viewport
    viewport: {width: 1280, height: 720},

    // Ignore HTTPS errors (for local dev with self-signed certs)
    ignoreHTTPSErrors: true
  },

  // Run your local dev server before starting the tests
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe'
  },

  // Configure projects
  projects: [
    // Auth setup - runs first
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/
    },

    // Desktop Chrome - primary testing (authenticated)
    {
      name: 'chromium',
      testIgnore: /.*\.unauth\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup']
    },

    // Mobile Chrome (authenticated) - for responsive testing
    {
      name: 'mobile-chrome',
      testIgnore: /.*\.unauth\.spec\.js/,
      use: {
        ...devices['Pixel 5'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup']
    },

    // Unauthenticated tests (redirect behavior)
    {
      name: 'unauthenticated',
      testMatch: /.*\.unauth\.spec\.js/,
      use: {...devices['Desktop Chrome']}
    }
  ]
});
