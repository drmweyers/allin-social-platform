import { test, expect, Page } from '@playwright/test';

// Master test credentials from CLAUDE.md
const MASTER_CREDENTIALS = {
  admin: { email: 'admin@allin.demo', password: 'Admin123!@#' },
  agency: { email: 'agency@allin.demo', password: 'Agency123!@#' },
  manager: { email: 'manager@allin.demo', password: 'Manager123!@#' },
  creator: { email: 'creator@allin.demo', password: 'Creator123!@#' },
  client: { email: 'client@allin.demo', password: 'Client123!@#' },
  team: { email: 'team@allin.demo', password: 'Team123!@#' },
};

// Helper function for authentication
async function loginAs(page: Page, role: keyof typeof MASTER_CREDENTIALS) {
  const credentials = MASTER_CREDENTIALS[role];
  
  await page.goto('/auth/login');
  await page.fill('[data-testid="email-input"]', credentials.email);
  await page.fill('[data-testid="password-input"]', credentials.password);
  await page.click('[data-testid="login-button"]');
  
  // Wait for successful login
  await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 10000 });
}

// Helper function to wait for chart loading
async function waitForChartLoad(page: Page, chartSelector: string) {
  await page.waitForSelector(chartSelector, { timeout: 15000 });
  await page.waitForFunction(
    (selector) => {
      const chart = document.querySelector(selector);
      return chart && !chart.classList.contains('loading');
    },
    chartSelector,
    { timeout: 10000 }
  );
}

// Helper function to mock API responses
async function mockAnalyticsAPI(page: Page) {
  await page.route('**/api/analytics/**', (route) => {
    const url = route.request().url();
    
    if (url.includes('/dashboard')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalEngagement: 12450,
            engagementGrowth: 15.7,
            viralContent: [
              {
                id: 'viral-post-1',
                platform: 'instagram',
                content: 'Viral content example',
                viralityScore: 0.89,
                engagement: { likes: 5000, comments: 800, shares: 1200 },
              },
            ],
            realTimeMetrics: {
              activeUsers: 342,
              currentEngagementRate: 4.7,
              postsLastHour: 8,
            },
          },
        }),
      });
    } else {
      route.continue();
    }
  });
}

test.describe('Enhanced Analytics - E2E Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API mocks
    await mockAnalyticsAPI(page);
  });

  test.describe('OAuth Integration Validation', () => {
    test('Twitter OAuth Flow Validation - Admin User', async ({ page }) => {
      // Login as admin for full access
      await loginAs(page, 'admin');
      
      // Navigate to social accounts
      await page.click('[data-testid="nav-social"]');
      await page.waitForSelector('[data-testid="social-accounts-dashboard"]');
      
      // Test Twitter OAuth initiation
      await page.click('[data-testid="connect-twitter"]');
      
      // Verify OAuth URL generation
      await expect(page.locator('[data-testid="oauth-url-generated"]')).toBeVisible();
      
      // Mock OAuth callback
      await page.route('**/api/social/connect/TWITTER', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            authUrl: 'https://twitter.com/i/oauth2/authorize?response_type=code&client_id=test',
          }),
        });
      });
      
      // Verify Twitter connection successful
      await expect(page.locator('[data-testid="twitter-connected"]')).toBeVisible();
    });

    test('Multi-Platform OAuth Status - Manager User', async ({ page }) => {
      await loginAs(page, 'manager');
      
      // Navigate to social accounts
      await page.goto('/dashboard/social/accounts');
      
      // Verify platform connection status
      await expect(page.locator('[data-testid="platform-status"]')).toBeVisible();
      
      // Test platform disconnection
      await page.click('[data-testid="disconnect-twitter"]');
      await expect(page.locator('[data-testid="disconnect-confirmation"]')).toBeVisible();
      
      // Confirm disconnection
      await page.click('[data-testid="confirm-disconnect"]');
      await expect(page.locator('[data-testid="twitter-disconnected"]')).toBeVisible();
    });
  });

  test.describe('Analytics Dashboard Journey', () => {
    test('Complete Analytics Workflow - Admin User', async ({ page }) => {
      // Login as admin for full access
      await loginAs(page, 'admin');
      
      // Navigate to analytics dashboard
      await page.click('[data-testid="nav-analytics"]');
      await page.waitForSelector('[data-testid="analytics-dashboard"]');
      
      // Verify dashboard metrics display
      await expect(page.locator('[data-testid="dashboard-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-engagement"]')).toContainText('12,450');
      await expect(page.locator('[data-testid="engagement-growth"]')).toContainText('15.7%');
      
      // Test real-time metrics
      await expect(page.locator('[data-testid="real-time-metrics"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-users"]')).toContainText('342');
    });

    test('Performance Prediction Workflow - Manager User', async ({ page }) => {
      await loginAs(page, 'manager');
      
      // Navigate to content performance prediction
      await page.goto('/analytics/performance-prediction');
      
      // Input content for analysis
      await page.fill('[data-testid="content-input"]', 'Test content for prediction');
      await page.selectOption('[data-testid="platform-select"]', 'twitter');
      
      // Trigger performance prediction
      await page.click('[data-testid="predict-performance"]');
      
      // Wait for prediction results
      await page.waitForSelector('[data-testid="prediction-results"]');
      
      // Verify prediction metrics
      await expect(page.locator('[data-testid="confidence-score"]')).toBeVisible();
    });
  });

  test.describe('Error Handling and Resilience', () => {
    test('OAuth Error Handling', async ({ page }) => {
      await loginAs(page, 'admin');
      
      // Simulate OAuth failure
      await page.route('**/api/social/connect/TWITTER', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'OAuth connection failed' }),
        });
      });
      
      // Navigate to social accounts
      await page.goto('/dashboard/social/accounts');
      
      // Attempt Twitter connection
      await page.click('[data-testid="connect-twitter"]');
      
      // Verify error handling
      await expect(page.locator('[data-testid="oauth-error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('Network Connectivity Issues', async ({ page }) => {
      await loginAs(page, 'manager');
      
      // Navigate to real-time analytics
      await page.goto('/analytics/real-time');
      
      // Simulate network disconnection
      await page.setOffline(true);
      
      // Verify offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      
      // Restore connection
      await page.setOffline(false);
      
      // Verify reconnection
      await expect(page.locator('[data-testid="online-indicator"]')).toBeVisible();
    });
  });
});