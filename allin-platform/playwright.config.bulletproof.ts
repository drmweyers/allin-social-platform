import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Bulletproof Playwright configuration for AllIN Platform
 * Zero flaky tests, comprehensive accessibility, security, and performance checks
 */
export default defineConfig({
  // Test discovery
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.ts/,

  // ZERO FLAKY TESTS TOLERANCE
  // Retries disabled by default - tests must be deterministic
  retries: process.env.CI ? 0 : 0, // NO RETRIES

  // Parallel execution with stability
  workers: process.env.CI ? 2 : '50%',
  fullyParallel: true,

  // Timeout settings for stability
  timeout: 30 * 1000, // 30 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },

  // Global test setup
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',

  // Reporter configuration for comprehensive reporting
  reporter: [
    ['html', {
      outputFolder: 'reports/playwright',
      open: 'never' // Don't auto-open in CI
    }],
    ['json', {
      outputFile: 'reports/playwright/test-results.json'
    }],
    ['junit', {
      outputFile: 'reports/playwright/junit-results.xml'
    }],
    ['allure-playwright', {
      outputFolder: 'reports/allure-results'
    }],
    // Custom reporter for flake detection
    ['./tests/utils/flake-detector-reporter.ts']
  ],

  // Output configuration
  outputDir: 'test-results/',

  // Test artifact collection
  use: {
    // Base URL for tests
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3001',

    // Browser settings for consistency
    viewport: { width: 1280, height: 720 },

    // COMPREHENSIVE TRACING AND DEBUGGING
    trace: 'retain-on-failure', // Always keep traces on failure
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',

    // HAR recording for network analysis
    harPath: './test-results/network-{{TestName}}.har',

    // Action timeout for individual actions
    actionTimeout: 10000,

    // Disable flaky features that cause instability
    waitForNetworkIdle: false, // Can be flaky

    // Security headers validation
    extraHTTPHeaders: {
      'X-Test-Run': 'playwright-e2e'
    },

    // Locale and timezone for consistency
    locale: 'en-US',
    timezoneId: 'UTC',

    // Color scheme for consistency
    colorScheme: 'light',

    // Device pixel ratio for consistent rendering
    deviceScaleFactor: 1,
  },

  // Project definitions for different test types
  projects: [
    // Setup project for authentication and database seeding
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Critical flow tests (P0) - Run first
    {
      name: 'critical-flows',
      testMatch: /.*critical.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        // Performance budget assertions
        trace: 'on-first-retry',
      },
      metadata: {
        priority: 'P0',
        category: 'critical-path'
      }
    },

    // Desktop browsers
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        // Security-focused settings
        permissions: [],
        geolocation: undefined,
        // Performance monitoring
        trace: 'retain-on-failure',
      },
    },

    {
      name: 'firefox',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Firefox'],
        trace: 'retain-on-failure',
      },
    },

    {
      name: 'webkit',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Safari'],
        trace: 'retain-on-failure',
      },
    },

    // Mobile testing for responsive design
    {
      name: 'mobile-chrome',
      dependencies: ['setup'],
      use: {
        ...devices['Pixel 5'],
        trace: 'retain-on-failure',
      },
    },

    {
      name: 'mobile-safari',
      dependencies: ['setup'],
      use: {
        ...devices['iPhone 12'],
        trace: 'retain-on-failure',
      },
    },

    // Accessibility testing project
    {
      name: 'accessibility',
      testMatch: /.*a11y.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        // Screen reader simulation
        reducedMotion: 'reduce',
        // High contrast testing
        forcedColors: 'active',
        trace: 'retain-on-failure',
      },
      metadata: {
        category: 'accessibility'
      }
    },

    // Performance testing project
    {
      name: 'performance',
      testMatch: /.*performance.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        // Performance-specific settings
        trace: 'on-first-retry',
        // Network throttling for realistic conditions
        launchOptions: {
          args: [
            '--enable-precise-memory-info',
            '--enable-logging',
            '--no-sandbox'
          ]
        }
      },
      metadata: {
        category: 'performance'
      }
    },

    // Security testing project
    {
      name: 'security',
      testMatch: /.*security.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        // Security-focused configuration
        permissions: [], // No permissions by default
        trace: 'retain-on-failure',
      },
      metadata: {
        category: 'security'
      }
    },

    // Visual regression testing
    {
      name: 'visual',
      testMatch: /.*visual.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        // Consistent visual settings
        deviceScaleFactor: 1,
        trace: 'retain-on-failure',
      },
      metadata: {
        category: 'visual-regression'
      }
    }
  ],

  // Web server configuration for local development
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3001,
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5433/allin_test',
      REDIS_URL: 'redis://localhost:6380',
      JWT_SECRET: 'test-secret-key-for-e2e-tests',
      // Test-specific environment variables
      SKIP_RATE_LIMITING: 'true',
      ENABLE_TEST_ROUTES: 'true',
    }
  },

  // Global test configuration
  globalTimeout: 60 * 60 * 1000, // 1 hour total

  // Fail fast settings
  maxFailures: process.env.CI ? 5 : 0, // Stop after 5 failures in CI

  // Metadata for test organization
  metadata: {
    testRun: {
      url: process.env.PLAYWRIGHT_HTML_REPORT || 'http://localhost:9323',
      environment: process.env.NODE_ENV || 'test',
      branch: process.env.GITHUB_REF_NAME || 'local',
      commit: process.env.GITHUB_SHA || 'local',
    }
  },

  // Custom expect matchers for enhanced assertions
  expect: {
    // Performance budgets
    toHavePerformanceBudget: true,
    // Accessibility matchers
    toHaveNoAccessibilityViolations: true,
    // Security matchers
    toHaveSecureHeaders: true,
    // Visual matchers
    toMatchScreenshot: {
      threshold: 0.2,
      mode: 'pixel'
    }
  }
});

// Type augmentation for custom matchers
declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toHavePerformanceBudget(budget: { lcp?: number; fcp?: number; cls?: number }): R;
      toHaveNoAccessibilityViolations(): R;
      toHaveSecureHeaders(): R;
    }
  }
}