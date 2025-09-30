import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: path.join(__dirname, '../e2e-tests'),

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: path.join(__dirname, '../reports/playwright-report') }],
    ['json', { outputFile: path.join(__dirname, '../reports/test-results.json') }],
    ['junit', { outputFile: path.join(__dirname, '../reports/junit.xml') }],
    process.env.CI ? ['github'] : ['list']
  ],

  // Global timeout
  globalTimeout: process.env.CI ? 60000 * 10 : 60000 * 5, // 10 min on CI, 5 min locally

  // Test timeout
  timeout: 30 * 1000,

  // Expect timeout
  expect: {
    timeout: 5 * 1000
  },

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3001',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'retain-on-failure',

    // Browser context options
    ignoreHTTPSErrors: true,

    // Viewport
    viewport: { width: 1280, height: 720 },

    // Action timeout
    actionTimeout: 10 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,

    // Test ID attribute
    testIdAttribute: 'data-testid',

    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9'
    }
  },

  // Configure projects for major browsers
  projects: [
    // Setup project to authenticate users
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Desktop browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, '../test-data/auth/user.json')
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: path.join(__dirname, '../test-data/auth/user.json')
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: path.join(__dirname, '../test-data/auth/user.json')
      },
      dependencies: ['setup'],
    },

    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: path.join(__dirname, '../test-data/auth/user.json')
      },
      dependencies: ['setup'],
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        storageState: path.join(__dirname, '../test-data/auth/user.json')
      },
      dependencies: ['setup'],
    },

    // Test different user roles
    {
      name: 'admin-tests',
      testMatch: /.*admin.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, '../test-data/auth/admin.json')
      },
      dependencies: ['setup'],
    },

    {
      name: 'agency-tests',
      testMatch: /.*agency.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, '../test-data/auth/agency.json')
      },
      dependencies: ['setup'],
    },

    {
      name: 'client-tests',
      testMatch: /.*client.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, '../test-data/auth/client.json')
      },
      dependencies: ['setup'],
    },
  ],

  // Folder for test output
  outputDir: path.join(__dirname, '../reports/test-results'),

  // Run your local dev server before starting the tests
  webServer: [
    {
      command: 'npm run dev --workspace=frontend',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      cwd: path.join(__dirname, '../../allin-platform')
    },
    {
      command: 'npm run dev --workspace=backend',
      url: 'http://localhost:5000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      cwd: path.join(__dirname, '../../allin-platform')
    }
  ],

  // Global setup and teardown
  globalSetup: path.join(__dirname, 'global-setup.ts'),
  globalTeardown: path.join(__dirname, 'global-teardown.ts'),
});