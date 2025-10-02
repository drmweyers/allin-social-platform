import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * LinkedIn Integration - Complete End-to-End Test Suite
 * 
 * This test suite validates the complete LinkedIn integration flow including:
 * - OAuth authentication and authorization
 * - Account management and settings
 * - Content creation and publishing
 * - Analytics and reporting
 * - Cross-browser compatibility
 * - Mobile responsiveness
 */

test.describe('LinkedIn Integration - End-to-End Tests', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      // Set viewport for consistent testing
      viewport: { width: 1280, height: 720 },
      // Enable JavaScript
      javaScriptEnabled: true,
      // Set user agent
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
  });

  test.beforeEach(async () => {
    page = await context.newPage();
    
    // Setup test environment
    await setupTestEnvironment(page);
    
    // Login with master test credentials
    await loginAsAdmin(page);
  });

  test.afterEach(async () => {
    // Cleanup after each test
    await cleanupTestData(page);
    await page.close();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('LinkedIn OAuth Authentication Flow', () => {
    test('should successfully complete LinkedIn OAuth connection', async () => {
      // Navigate to accounts management page
      await page.goto('/dashboard/accounts');
      await expect(page).toHaveTitle(/Accounts.*AllIN/);

      // Verify page loads correctly
      await expect(page.locator('[data-testid="accounts-page"]')).toBeVisible();
      
      // Check if LinkedIn connection option is available
      const connectLinkedInButton = page.locator('[data-testid="connect-linkedin-button"]');
      await expect(connectLinkedInButton).toBeVisible();
      await expect(connectLinkedInButton).toContainText('Connect LinkedIn');

      // Click connect LinkedIn button
      await connectLinkedInButton.click();

      // Wait for OAuth popup or redirect
      const popupPromise = page.waitForEvent('popup', { timeout: 10000 });
      
      let popup: Page;
      try {
        popup = await popupPromise;
        
        // Verify LinkedIn OAuth URL structure
        await popup.waitForLoadState('networkidle');
        const popupUrl = popup.url();
        
        // Validate OAuth URL parameters
        expect(popupUrl).toContain('linkedin.com/oauth/v2/authorization');
        expect(popupUrl).toContain('response_type=code');
        expect(popupUrl).toContain('client_id=');
        expect(popupUrl).toContain('scope=');
        expect(popupUrl).toContain('state=');
        expect(popupUrl).toContain('redirect_uri=');

        // Extract and validate state parameter for CSRF protection
        const stateMatch = popupUrl.match(/state=([^&]+)/);
        expect(stateMatch).toBeTruthy();
        expect(stateMatch![1].length).toBeGreaterThan(8);

        // Simulate successful OAuth completion
        await mockLinkedInOAuthSuccess(popup, page);

      } catch (error) {
        // Handle redirect-based OAuth flow
        await page.waitForURL(/linkedin\.com\/oauth\/v2\/authorization/, { timeout: 10000 });
        
        // Verify we're on LinkedIn OAuth page
        expect(page.url()).toContain('linkedin.com/oauth/v2/authorization');
        
        // Simulate OAuth completion by navigating back with auth code
        await simulateOAuthCallback(page);
      }

      // Verify successful connection
      await page.waitForSelector('[data-testid="linkedin-account-connected"]', { 
        timeout: 15000 
      });

      const connectedAccount = page.locator('[data-testid="linkedin-account-connected"]');
      await expect(connectedAccount).toBeVisible();
      await expect(connectedAccount).toContainText('LinkedIn');
      
      // Verify account details are displayed
      await expect(page.locator('[data-testid="linkedin-account-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="linkedin-account-status"]')).toContainText('Connected');
    });

    test('should handle OAuth state mismatch error', async () => {
      await page.goto('/dashboard/accounts');
      
      // Simulate OAuth callback with invalid state
      await page.goto('/api/social/callback/linkedin?code=test_code&state=invalid_state');
      
      // Should redirect to error page or show error message
      await expect(page.locator('[data-testid="oauth-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="oauth-error"]')).toContainText('Invalid state parameter');
    });

    test('should handle OAuth cancellation gracefully', async () => {
      await page.goto('/dashboard/accounts');
      
      const connectButton = page.locator('[data-testid="connect-linkedin-button"]');
      await connectButton.click();

      // Simulate user canceling OAuth
      await page.goto('/api/social/callback/linkedin?error=access_denied&error_description=User+denied+authorization');
      
      // Should show appropriate error message
      await expect(page.locator('[data-testid="oauth-cancelled"]')).toBeVisible();
      await expect(page.locator('[data-testid="oauth-cancelled"]')).toContainText('LinkedIn connection was cancelled');
    });
  });

  test.describe('LinkedIn Account Management', () => {
    test.beforeEach(async () => {
      // Setup LinkedIn account for management tests
      await setupLinkedInAccount(page);
    });

    test('should display connected LinkedIn accounts', async () => {
      await page.goto('/dashboard/accounts');
      
      // Verify LinkedIn account is listed
      const linkedinAccount = page.locator('[data-testid="linkedin-account-item"]');
      await expect(linkedinAccount).toBeVisible();
      
      // Check account information display
      await expect(page.locator('[data-testid="linkedin-account-name"]')).toContainText('Test LinkedIn Account');
      await expect(page.locator('[data-testid="linkedin-account-username"]')).toContainText('@test.linkedin');
      await expect(page.locator('[data-testid="linkedin-follower-count"]')).toContainText('1,234');
      
      // Verify platform icon
      await expect(page.locator('[data-testid="linkedin-platform-icon"]')).toBeVisible();
    });

    test('should open account settings panel', async () => {
      await page.goto('/dashboard/accounts');
      
      const accountItem = page.locator('[data-testid="linkedin-account-item"]');
      await accountItem.click();
      
      // Verify settings panel opens
      await expect(page.locator('[data-testid="linkedin-account-settings"]')).toBeVisible();
      
      // Check settings options
      await expect(page.locator('[data-testid="posting-preferences"]')).toBeVisible();
      await expect(page.locator('[data-testid="auto-hashtags-toggle"]')).toBeVisible();
      await expect(page.locator('[data-testid="default-hashtags-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="post-timing-settings"]')).toBeVisible();
    });

    test('should save account preferences', async () => {
      await page.goto('/dashboard/accounts');
      
      const accountItem = page.locator('[data-testid="linkedin-account-item"]');
      await accountItem.click();
      
      // Configure preferences
      await page.check('[data-testid="auto-hashtags-toggle"]');
      await page.fill('[data-testid="default-hashtags-input"]', '#business #linkedin #socialmedia');
      
      // Set posting preferences
      await page.selectOption('[data-testid="best-time-posting"]', 'auto');
      await page.check('[data-testid="content-optimization"]');
      
      // Save settings
      await page.click('[data-testid="save-settings-button"]');
      
      // Verify save confirmation
      await expect(page.locator('[data-testid="settings-saved-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="settings-saved-message"]')).toContainText('Settings saved successfully');
      
      // Verify settings persist
      await page.reload();
      await accountItem.click();
      
      expect(await page.isChecked('[data-testid="auto-hashtags-toggle"]')).toBeTruthy();
      expect(await page.inputValue('[data-testid="default-hashtags-input"]')).toBe('#business #linkedin #socialmedia');
    });

    test('should disconnect LinkedIn account', async () => {
      await page.goto('/dashboard/accounts');
      
      const accountItem = page.locator('[data-testid="linkedin-account-item"]');
      await accountItem.click();
      
      // Click disconnect button
      await page.click('[data-testid="disconnect-linkedin-button"]');
      
      // Confirm disconnection in modal
      await expect(page.locator('[data-testid="disconnect-confirmation-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="disconnect-warning"]')).toContainText('This will remove access to your LinkedIn account');
      
      await page.click('[data-testid="confirm-disconnect-button"]');
      
      // Verify account is removed
      await expect(page.locator('[data-testid="linkedin-account-item"]')).not.toBeVisible();
      
      // Verify success message
      await expect(page.locator('[data-testid="disconnect-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="disconnect-success"]')).toContainText('LinkedIn account disconnected successfully');
    });
  });

  test.describe('LinkedIn Content Creation and Publishing', () => {
    test.beforeEach(async () => {
      await setupLinkedInAccount(page);
    });

    test('should create and publish LinkedIn post', async () => {
      await page.goto('/dashboard/create');
      
      // Verify content composer loads
      await expect(page.locator('[data-testid="content-composer"]')).toBeVisible();
      
      // Create post content
      const postContent = 'Test LinkedIn post from AllIN platform! 🚀 #testing #linkedin #socialmedia';
      await page.fill('[data-testid="post-content-textarea"]', postContent);
      
      // Select LinkedIn account
      await page.click('[data-testid="platform-selector"]');
      await page.click('[data-testid="linkedin-account-option"]');
      
      // Verify LinkedIn-specific options appear
      await expect(page.locator('[data-testid="linkedin-post-options"]')).toBeVisible();
      await expect(page.locator('[data-testid="linkedin-audience-selector"]')).toBeVisible();
      
      // Configure LinkedIn post settings
      await page.selectOption('[data-testid="linkedin-audience-selector"]', 'public');
      await page.check('[data-testid="notify-network"]');
      
      // Add media attachment
      await page.setInputFiles('[data-testid="media-upload-input"]', 'test-assets/sample-linkedin-image.jpg');
      
      // Wait for media processing
      await expect(page.locator('[data-testid="media-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="media-upload-success"]')).toBeVisible();
      
      // Preview post
      await page.click('[data-testid="preview-post-button"]');
      await expect(page.locator('[data-testid="post-preview-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="preview-content"]')).toContainText(postContent);
      await expect(page.locator('[data-testid="preview-media"]')).toBeVisible();
      
      await page.click('[data-testid="close-preview"]');
      
      // Publish post
      await page.click('[data-testid="publish-now-button"]');
      
      // Verify publishing process
      await expect(page.locator('[data-testid="publishing-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="publish-success"]')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('[data-testid="publish-success"]')).toContainText('LinkedIn post published successfully');
      
      // Verify post appears in published posts
      await page.goto('/dashboard/posts');
      await expect(page.locator('[data-testid="published-posts-list"]')).toBeVisible();
      
      const publishedPost = page.locator('[data-testid="post-item"]').first();
      await expect(publishedPost).toContainText(postContent.substring(0, 50));
      await expect(publishedPost.locator('[data-testid="linkedin-platform-badge"]')).toBeVisible();
    });

    test('should schedule LinkedIn post for future', async () => {
      await page.goto('/dashboard/create');
      
      const postContent = 'Scheduled LinkedIn post for testing automation';
      await page.fill('[data-testid="post-content-textarea"]', postContent);
      
      await page.click('[data-testid="platform-selector"]');
      await page.click('[data-testid="linkedin-account-option"]');
      
      // Schedule for future
      await page.click('[data-testid="schedule-post-button"]');
      
      // Set future date and time
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(10, 0, 0, 0);
      
      await page.fill('[data-testid="schedule-date-input"]', futureDate.toISOString().split('T')[0]);
      await page.fill('[data-testid="schedule-time-input"]', '10:00');
      
      // Set timezone
      await page.selectOption('[data-testid="timezone-selector"]', 'America/New_York');
      
      // Confirm scheduling
      await page.click('[data-testid="confirm-schedule-button"]');
      
      // Verify scheduling success
      await expect(page.locator('[data-testid="schedule-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="schedule-success"]')).toContainText('LinkedIn post scheduled successfully');
      
      // Verify in calendar
      await page.goto('/dashboard/calendar');
      
      const scheduledPost = page.locator(`[data-testid="scheduled-post-${futureDate.toISOString().split('T')[0]}"]`);
      await expect(scheduledPost).toBeVisible();
      await expect(scheduledPost).toContainText(postContent.substring(0, 30));
    });

    test('should handle LinkedIn post publishing errors', async () => {
      await page.goto('/dashboard/create');
      
      // Create post with content that would trigger an error
      await page.fill('[data-testid="post-content-textarea"]', 'Test post');
      await page.click('[data-testid="platform-selector"]');
      await page.click('[data-testid="linkedin-account-option"]');
      
      // Mock network error
      await page.route('**/api/content/publish', route => {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Rate limit exceeded. Please try again later.'
          })
        });
      });
      
      await page.click('[data-testid="publish-now-button"]');
      
      // Verify error handling
      await expect(page.locator('[data-testid="publish-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="publish-error"]')).toContainText('Rate limit exceeded');
      
      // Verify retry option
      await expect(page.locator('[data-testid="retry-publish-button"]')).toBeVisible();
    });
  });

  test.describe('LinkedIn Analytics and Insights', () => {
    test.beforeEach(async () => {
      await setupLinkedInAccount(page);
      await setupLinkedInAnalyticsData(page);
    });

    test('should display LinkedIn analytics dashboard', async () => {
      await page.goto('/dashboard/analytics');
      
      // Select LinkedIn account
      await page.click('[data-testid="analytics-account-selector"]');
      await page.click('[data-testid="select-linkedin-account"]');
      
      // Verify analytics dashboard loads
      await expect(page.locator('[data-testid="linkedin-analytics-dashboard"]')).toBeVisible();
      
      // Check key metrics cards
      await expect(page.locator('[data-testid="linkedin-impressions-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="linkedin-engagement-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="linkedin-followers-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="linkedin-clicks-card"]')).toBeVisible();
      
      // Verify metrics have values
      await expect(page.locator('[data-testid="impressions-value"]')).toContainText(/\d+/);
      await expect(page.locator('[data-testid="engagement-rate"]')).toContainText(/%/);
      await expect(page.locator('[data-testid="follower-count"]')).toContainText(/\d+/);
    });

    test('should filter analytics by date range', async () => {
      await page.goto('/dashboard/analytics');
      await page.click('[data-testid="analytics-account-selector"]');
      await page.click('[data-testid="select-linkedin-account"]');
      
      // Change date range
      await page.click('[data-testid="date-range-selector"]');
      await page.click('[data-testid="last-30-days-option"]');
      
      // Verify loading state
      await expect(page.locator('[data-testid="analytics-loading"]')).toBeVisible();
      
      // Wait for data to update
      await expect(page.locator('[data-testid="analytics-loading"]')).not.toBeVisible();
      
      // Verify charts update
      await expect(page.locator('[data-testid="linkedin-analytics-chart"]')).toHaveAttribute('data-updated', 'true');
      
      // Test custom date range
      await page.click('[data-testid="date-range-selector"]');
      await page.click('[data-testid="custom-range-option"]');
      
      await page.fill('[data-testid="start-date-input"]', '2024-01-01');
      await page.fill('[data-testid="end-date-input"]', '2024-01-31');
      await page.click('[data-testid="apply-date-range"]');
      
      // Verify custom range is applied
      await expect(page.locator('[data-testid="analytics-loading"]')).toBeVisible();
      await expect(page.locator('[data-testid="analytics-loading"]')).not.toBeVisible();
    });

    test('should display post performance details', async () => {
      await page.goto('/dashboard/analytics');
      await page.click('[data-testid="analytics-account-selector"]');
      await page.click('[data-testid="select-linkedin-account"]');
      
      // Navigate to post performance tab
      await page.click('[data-testid="post-performance-tab"]');
      
      // Verify post performance table
      await expect(page.locator('[data-testid="post-performance-table"]')).toBeVisible();
      
      // Check table headers
      await expect(page.locator('[data-testid="post-content-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="impressions-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="engagement-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="clicks-header"]')).toBeVisible();
      
      // Click on a post for detailed view
      const firstPost = page.locator('[data-testid="post-row"]').first();
      await firstPost.click();
      
      // Verify post detail modal
      await expect(page.locator('[data-testid="post-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="post-content-detail"]')).toBeVisible();
      await expect(page.locator('[data-testid="engagement-breakdown"]')).toBeVisible();
      await expect(page.locator('[data-testid="audience-insights"]')).toBeVisible();
    });

    test('should export analytics data', async () => {
      await page.goto('/dashboard/analytics');
      await page.click('[data-testid="analytics-account-selector"]');
      await page.click('[data-testid="select-linkedin-account"]');
      
      // Setup download handler
      const downloadPromise = page.waitForEvent('download');
      
      // Click export button
      await page.click('[data-testid="export-analytics-button"]');
      
      // Select export format
      await page.click('[data-testid="export-csv-option"]');
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain('linkedin-analytics');
      expect(download.suggestedFilename()).toContain('.csv');
      
      // Save download to verify content
      await download.saveAs('test-results/linkedin-analytics-export.csv');
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    const browsers = ['chromium', 'firefox', 'webkit'];
    
    browsers.forEach(browserName => {
      test(`should work correctly in ${browserName}`, async ({ browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName, `Skipping ${browserName} test in ${currentBrowser}`);
        
        await page.goto('/dashboard/accounts');
        
        // Test basic functionality
        await expect(page.locator('[data-testid="connect-linkedin-button"]')).toBeVisible();
        
        // Test OAuth flow initiation
        await page.click('[data-testid="connect-linkedin-button"]');
        
        // Verify browser-specific OAuth handling
        if (browserName === 'webkit') {
          // Safari-specific OAuth handling
          await expect(page).toHaveURL(/linkedin\.com/, { timeout: 10000 });
        } else {
          // Chrome/Firefox popup handling
          const popupPromise = page.waitForEvent('popup');
          const popup = await popupPromise;
          await expect(popup.url()).toContain('linkedin.com');
          await popup.close();
        }
      });
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.beforeEach(async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should display mobile-friendly LinkedIn connection', async () => {
      await page.goto('/dashboard/accounts');
      
      // Verify mobile layout
      await expect(page.locator('[data-testid="mobile-accounts-view"]')).toBeVisible();
      
      // Test mobile LinkedIn connection
      await page.click('[data-testid="mobile-connect-linkedin"]');
      
      // Verify mobile OAuth flow
      await expect(page).toHaveURL(/linkedin\.com/, { timeout: 10000 });
    });

    test('should create posts on mobile', async () => {
      await setupLinkedInAccount(page);
      await page.goto('/dashboard/create');
      
      // Verify mobile content composer
      await expect(page.locator('[data-testid="mobile-composer"]')).toBeVisible();
      
      // Create post on mobile
      await page.fill('[data-testid="mobile-post-textarea"]', 'Mobile LinkedIn post test');
      await page.click('[data-testid="mobile-platform-selector"]');
      await page.click('[data-testid="mobile-linkedin-option"]');
      
      // Publish on mobile
      await page.click('[data-testid="mobile-publish-button"]');
      await expect(page.locator('[data-testid="mobile-publish-success"]')).toBeVisible();
    });
  });

  test.describe('Accessibility Testing', () => {
    test('should be accessible with keyboard navigation', async () => {
      await page.goto('/dashboard/accounts');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="connect-linkedin-button"]:focus')).toBeVisible();
      
      await page.keyboard.press('Enter');
      
      // Should trigger OAuth flow
      const popupPromise = page.waitForEvent('popup');
      const popup = await popupPromise;
      await expect(popup.url()).toContain('linkedin.com');
      await popup.close();
    });

    test('should have proper ARIA labels', async () => {
      await setupLinkedInAccount(page);
      await page.goto('/dashboard/accounts');
      
      // Check ARIA labels
      await expect(page.locator('[data-testid="linkedin-account-item"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[data-testid="disconnect-linkedin-button"]')).toHaveAttribute('aria-label');
      
      // Check screen reader content
      await expect(page.locator('[data-testid="linkedin-account-status"]')).toHaveAttribute('aria-live');
    });

    test('should support high contrast mode', async () => {
      // Enable high contrast mode
      await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
      
      await page.goto('/dashboard/accounts');
      
      // Verify elements are still visible in high contrast
      await expect(page.locator('[data-testid="connect-linkedin-button"]')).toBeVisible();
      
      // Check color contrast compliance
      const buttonColor = await page.locator('[data-testid="connect-linkedin-button"]').evaluate(el => 
        getComputedStyle(el).color
      );
      const backgroundColor = await page.locator('[data-testid="connect-linkedin-button"]').evaluate(el => 
        getComputedStyle(el).backgroundColor
      );
      
      expect(buttonColor).toBeTruthy();
      expect(backgroundColor).toBeTruthy();
    });
  });
});

// Helper Functions

async function setupTestEnvironment(page: Page) {
  // Setup mock API responses
  await page.route('**/api/social/connect/linkedin', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          authUrl: 'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=test&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fsocial%2Fcallback%2Flinkedin&state=test_state_123&scope=openid+profile+email',
          state: 'test_state_123'
        }
      })
    });
  });

  await page.route('**/api/social/callback/linkedin**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          platform: 'LINKEDIN',
          displayName: 'Test LinkedIn Account',
          username: 'test.linkedin',
          email: 'test@linkedin.demo'
        }
      })
    });
  });
}

async function loginAsAdmin(page: Page) {
  await page.goto('/auth/login');
  
  await page.fill('[data-testid="email-input"]', 'admin@allin.demo');
  await page.fill('[data-testid="password-input"]', 'AdminPass123');
  await page.click('[data-testid="login-button"]');
  
  await page.waitForURL('/dashboard');
  await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
}

async function setupLinkedInAccount(page: Page) {
  // Mock LinkedIn account in local storage
  await page.evaluate(() => {
    const mockAccount = {
      id: 'linkedin-test-123',
      platform: 'LINKEDIN',
      displayName: 'Test LinkedIn Account',
      username: 'test.linkedin',
      email: 'test@linkedin.demo',
      profileImage: 'https://media.licdn.com/test-profile.jpg',
      followerCount: 1234,
      isConnected: true,
      status: 'ACTIVE'
    };
    
    localStorage.setItem('mock-linkedin-account', JSON.stringify(mockAccount));
  });

  // Mock API response for accounts
  await page.route('**/api/social/accounts', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [{
          id: 'linkedin-test-123',
          platform: 'LINKEDIN',
          displayName: 'Test LinkedIn Account',
          username: 'test.linkedin',
          profileImage: 'https://media.licdn.com/test-profile.jpg',
          followerCount: 1234,
          status: 'ACTIVE'
        }]
      })
    });
  });
}

async function setupLinkedInAnalyticsData(page: Page) {
  await page.route('**/api/analytics/linkedin/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          metrics: {
            impressions: 12500,
            engagementRate: 4.2,
            followers: 1234,
            clicks: 345
          },
          chartData: [
            { date: '2024-01-01', impressions: 1200, engagement: 48 },
            { date: '2024-01-02', impressions: 1350, engagement: 52 },
            { date: '2024-01-03', impressions: 1100, engagement: 45 }
          ],
          posts: [
            {
              id: 'post-1',
              content: 'LinkedIn post 1...',
              impressions: 2500,
              engagement: 120,
              clicks: 45
            },
            {
              id: 'post-2', 
              content: 'LinkedIn post 2...',
              impressions: 1800,
              engagement: 89,
              clicks: 32
            }
          ]
        }
      })
    });
  });
}

async function mockLinkedInOAuthSuccess(popup: Page, mainPage: Page) {
  // Simulate LinkedIn OAuth success
  await popup.evaluate(() => {
    // Simulate successful LinkedIn OAuth completion
    if (window.opener) {
      window.opener.postMessage({
        type: 'LINKEDIN_OAUTH_SUCCESS',
        data: {
          code: 'mock_linkedin_auth_code_12345',
          state: 'test_state_123'
        }
      }, '*');
    }
    window.close();
  });

  await popup.close();
}

async function simulateOAuthCallback(page: Page) {
  // Navigate to callback URL with mock authorization code
  await page.goto('/api/social/callback/linkedin?code=mock_auth_code&state=test_state_123');
}

async function cleanupTestData(page: Page) {
  // Clear test data from local storage
  await page.evaluate(() => {
    localStorage.removeItem('mock-linkedin-account');
    localStorage.removeItem('test-oauth-state');
  });

  // Clear any test routes
  await page.unrouteAll();
}