import { test, expect, Page, BrowserContext } from '@playwright/test';
import { createTestUser, deleteTestUser, loginAsUser } from '../utils/test-helpers';

test.describe('TikTok Complete Workflow', () => {
  let context: BrowserContext;
  let page: Page;
  let testUser: any;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Create test user
    testUser = await createTestUser({
      email: 'tiktok-e2e@test.com',
      name: 'TikTok E2E User',
      password: 'TikTokTest123!@#'
    });
  });

  test.afterAll(async () => {
    await deleteTestUser(testUser.id);
    await context.close();
  });

  test.beforeEach(async () => {
    // Login as test user before each test
    await loginAsUser(page, testUser.email, 'TikTokTest123!@#');
    
    // Navigate to accounts page
    await page.goto('/dashboard/accounts');
    await page.waitForLoadState('networkidle');
  });

  test('should display TikTok as an available platform', async () => {
    // Verify TikTok is listed in available platforms
    await expect(page.locator('[data-testid="tiktok-platform-card"]')).toBeVisible();
    
    // Check TikTok branding elements
    await expect(page.locator('text=TikTok')).toBeVisible();
    await expect(page.locator('[data-testid="tiktok-platform-card"] .text-gray-900')).toBeVisible(); // TikTok brand color
    
    // Verify initial state shows as not connected
    await expect(page.locator('[data-testid="tiktok-platform-card"] text=Not Connected')).toBeVisible();
    await expect(page.locator('[data-testid="tiktok-platform-card"] button:has-text("Connect TikTok")')).toBeVisible();
  });

  test('should initiate TikTok OAuth flow when connect button is clicked', async () => {
    // Mock TikTok OAuth response
    await page.route('/api/social/connect/TIKTOK', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          authUrl: 'https://www.tiktok.com/v2/auth/authorize/?client_key=test&state=test_state&scope=user.info.basic'
        })
      });
    });

    // Track navigation attempts to TikTok OAuth
    const navigationPromise = page.waitForEvent('framenavigated');
    
    // Click connect TikTok button
    const connectButton = page.locator('[data-testid="tiktok-platform-card"] button:has-text("Connect TikTok")');
    await expect(connectButton).toBeVisible();
    await connectButton.click();

    // Verify loading state appears
    await expect(page.locator('text=Connecting...')).toBeVisible({ timeout: 1000 });
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();

    // Wait for navigation or mock completion
    try {
      await navigationPromise;
    } catch (error) {
      // Navigation might not complete in test environment, which is expected
    }

    // Verify the API request was made
    // In real test, this would redirect to TikTok OAuth
  });

  test('should handle TikTok OAuth callback success', async () => {
    // Navigate to callback URL simulating successful OAuth
    await page.goto('/dashboard/accounts?success=connected&platform=TIKTOK');
    await page.waitForLoadState('networkidle');

    // Verify success message is displayed
    await expect(page.locator('[data-testid="success-alert"]')).toBeVisible();
    await expect(page.locator('text=Successfully connected to TikTok')).toBeVisible();
  });

  test('should handle TikTok OAuth callback error', async () => {
    // Navigate to callback URL simulating OAuth error
    await page.goto('/dashboard/accounts?error=access_denied&error_description=User%20denied%20access');
    await page.waitForLoadState('networkidle');

    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-alert"]')).toBeVisible();
    await expect(page.locator('text=Connection failed')).toBeVisible();
  });

  test('should display connected TikTok account information', async () => {
    // Mock connected TikTok account
    await page.route('/api/social/accounts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{
            id: 'tiktok_account_123',
            platform: 'TIKTOK',
            username: 'testcreator',
            displayName: 'Test Creator',
            followersCount: 50000,
            status: 'ACTIVE',
            lastSync: '2024-01-15T10:30:00Z',
            platformData: {
              videoCount: 125,
              likesCount: 500000,
              isVerified: true,
              averageViews: 25000,
              engagementRate: 8.5
            }
          }]
        })
      });
    });

    // Refresh page to load connected account
    await page.reload();
    await page.waitForLoadState('networkidle');

    const tiktokCard = page.locator('[data-testid="tiktok-platform-card"]');
    
    // Verify connected status
    await expect(tiktokCard.locator('text=Connected')).toBeVisible();
    
    // Verify account information
    await expect(tiktokCard.locator('text=@testcreator')).toBeVisible();
    await expect(tiktokCard.locator('text=Test Creator')).toBeVisible();
    
    // Verify metrics
    await expect(tiktokCard.locator('text=50000')).toBeVisible(); // Followers
    await expect(tiktokCard.locator('text=125')).toBeVisible(); // Videos
    
    // Verify verification badge
    await expect(tiktokCard.locator('[data-testid="verification-badge"]')).toBeVisible();
    
    // Verify action buttons for connected account
    await expect(tiktokCard.locator('[data-testid="refresh-tiktok-button"]')).toBeVisible();
    await expect(tiktokCard.locator('[data-testid="disconnect-tiktok-button"]')).toBeVisible();
    await expect(tiktokCard.locator('button:has-text("Settings")')).toBeVisible();
  });

  test('should refresh TikTok account data', async () => {
    // Mock connected TikTok account
    await page.route('/api/social/accounts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{
            id: 'tiktok_account_123',
            platform: 'TIKTOK',
            username: 'testcreator',
            displayName: 'Test Creator',
            followersCount: 50000,
            status: 'ACTIVE'
          }]
        })
      });
    });

    // Mock refresh API response
    await page.route('/api/social/refresh/tiktok_account_123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Tokens refreshed successfully'
        })
      });
    });

    // Refresh page to load connected account
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click refresh button
    const refreshButton = page.locator('[data-testid="refresh-tiktok-button"]');
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    // Verify refresh indication (loading state or success message)
    await expect(page.locator('text=Refreshing...')).toBeVisible({ timeout: 1000 });
    
    // Wait for refresh completion
    await page.waitForTimeout(500);
  });

  test('should disconnect TikTok account', async () => {
    // Mock connected TikTok account
    await page.route('/api/social/accounts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{
            id: 'tiktok_account_123',
            platform: 'TIKTOK',
            username: 'testcreator',
            displayName: 'Test Creator',
            status: 'ACTIVE'
          }]
        })
      });
    });

    // Mock disconnect API response
    await page.route('/api/social/disconnect/tiktok_account_123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Successfully disconnected from TikTok'
        })
      });
    });

    // Mock updated accounts list after disconnect
    await page.route('/api/social/accounts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [] // Empty - account disconnected
        })
      });
    }, { times: 1 });

    // Refresh page to load connected account
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click disconnect button
    const disconnectButton = page.locator('[data-testid="disconnect-tiktok-button"]');
    await expect(disconnectButton).toBeVisible();
    await disconnectButton.click();

    // Handle confirmation dialog if it appears
    await page.getByRole('button', { name: 'Confirm' }).click().catch(() => {
      // Dialog might not appear in all implementations
    });

    // Verify success message
    await expect(page.locator('text=Successfully disconnected from TikTok')).toBeVisible({ timeout: 5000 });
    
    // Verify account shows as not connected again
    await expect(page.locator('[data-testid="tiktok-platform-card"] text=Not Connected')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="tiktok-platform-card"] button:has-text("Connect TikTok")')).toBeVisible();
  });

  test('should view TikTok analytics and insights', async () => {
    // Mock connected TikTok account with analytics
    await page.route('/api/social/accounts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{
            id: 'tiktok_account_123',
            platform: 'TIKTOK',
            username: 'analyticscreator',
            displayName: 'Analytics Creator',
            followersCount: 100000,
            status: 'ACTIVE',
            platformData: {
              videoCount: 200,
              likesCount: 2500000,
              averageViews: 75000,
              engagementRate: 12.5,
              topPerformingVideo: {
                title: 'Viral Dance Challenge',
                viewCount: 2000000,
                likeCount: 250000
              }
            }
          }]
        })
      });
    });

    // Mock insights API response
    await page.route('/api/social/accounts/tiktok_account_123/insights', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalVideos: 200,
            totalViews: 15000000,
            totalLikes: 2500000,
            totalComments: 350000,
            totalShares: 180000,
            averageViews: 75000,
            averageLikes: 12500,
            engagementRate: '20.20',
            videos: [
              {
                id: 'video_1',
                title: 'Viral Dance Challenge',
                viewCount: 2000000,
                likeCount: 250000,
                commentCount: 35000,
                shareCount: 18000
              },
              {
                id: 'video_2',
                title: 'Cooking Tutorial',
                viewCount: 850000,
                likeCount: 68000,
                commentCount: 12000,
                shareCount: 6500
              }
            ]
          }
        })
      });
    });

    // Refresh page to load connected account
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click to view analytics
    const viewAnalyticsButton = page.locator('[data-testid="view-tiktok-analytics"]');
    await expect(viewAnalyticsButton).toBeVisible();
    await viewAnalyticsButton.click();

    // Verify analytics modal or section opens
    await expect(page.locator('[data-testid="analytics-modal"]')).toBeVisible({ timeout: 3000 });
    
    // Verify key metrics are displayed
    await expect(page.locator('text=200')).toBeVisible(); // Total videos
    await expect(page.locator('text=15M')).toBeVisible(); // Total views (formatted)
    await expect(page.locator('text=2.5M')).toBeVisible(); // Total likes (formatted)
    await expect(page.locator('text=20.20%')).toBeVisible(); // Engagement rate
    
    // Verify top videos are shown
    await expect(page.locator('text=Viral Dance Challenge')).toBeVisible();
    await expect(page.locator('text=2M views')).toBeVisible();
    await expect(page.locator('text=Cooking Tutorial')).toBeVisible();
    await expect(page.locator('text=850K views')).toBeVisible();
  });

  test('should handle TikTok account errors gracefully', async () => {
    // Mock TikTok account with error status
    await page.route('/api/social/accounts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{
            id: 'tiktok_error_account',
            platform: 'TIKTOK',
            username: 'erroraccount',
            displayName: 'Error Account',
            status: 'ERROR',
            error: 'Token expired - requires re-authentication'
          }]
        })
      });
    });

    // Refresh page to load error account
    await page.reload();
    await page.waitForLoadState('networkidle');

    const tiktokCard = page.locator('[data-testid="tiktok-platform-card"]');
    
    // Verify error status is displayed
    await expect(tiktokCard.locator('text=Error')).toBeVisible();
    await expect(tiktokCard.locator('[data-testid="error-icon"]')).toBeVisible();
    
    // Verify error message
    await expect(tiktokCard.locator('text=Token expired - requires re-authentication')).toBeVisible();
    
    // Verify reconnect option is available
    await expect(tiktokCard.locator('button:has-text("Reconnect")')).toBeVisible();
  });

  test('should handle TikTok API rate limiting', async () => {
    // Mock rate limit error
    await page.route('/api/social/connect/TIKTOK', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        })
      });
    });

    // Click connect TikTok button
    const connectButton = page.locator('[data-testid="tiktok-platform-card"] button:has-text("Connect TikTok")');
    await connectButton.click();

    // Verify rate limit error message
    await expect(page.locator('text=Rate limit exceeded')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Please try again later')).toBeVisible();
  });

  test('should be accessible via keyboard navigation', async () => {
    // Test keyboard navigation through TikTok elements
    await page.keyboard.press('Tab');
    
    // Navigate to TikTok connect button
    const connectButton = page.locator('[data-testid="tiktok-platform-card"] button:has-text("Connect TikTok")');
    await connectButton.focus();
    
    // Verify focus is on connect button
    await expect(connectButton).toBeFocused();
    
    // Test Enter key activation
    await page.keyboard.press('Enter');
    
    // Verify action was triggered (loading state should appear)
    await expect(page.locator('text=Connecting...')).toBeVisible({ timeout: 1000 });
  });

  test('should show proper ARIA labels and roles', async () => {
    const tiktokCard = page.locator('[data-testid="tiktok-platform-card"]');
    
    // Verify accessibility attributes
    await expect(tiktokCard).toHaveAttribute('role', 'region');
    await expect(tiktokCard).toHaveAttribute('aria-label', /TikTok/);
    
    // Check connect button accessibility
    const connectButton = tiktokCard.locator('button:has-text("Connect TikTok")');
    await expect(connectButton).toHaveAttribute('aria-label', /Connect TikTok account/);
  });

  test('should handle TikTok-specific content publishing flow', async () => {
    // Mock connected TikTok account
    await page.route('/api/social/accounts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{
            id: 'tiktok_account_123',
            platform: 'TIKTOK',
            username: 'contentcreator',
            displayName: 'Content Creator',
            status: 'ACTIVE'
          }]
        })
      });
    });

    // Navigate to content creation page
    await page.goto('/dashboard/create');
    await page.waitForLoadState('networkidle');

    // Select TikTok as target platform
    await page.locator('[data-testid="platform-selector"]').click();
    await page.locator('[data-testid="select-tiktok"]').click();

    // Verify TikTok-specific content requirements are shown
    await expect(page.locator('text=Video content required for TikTok')).toBeVisible();
    await expect(page.locator('[data-testid="video-upload-area"]')).toBeVisible();
    
    // Verify character limit for TikTok
    await expect(page.locator('text=150 character limit')).toBeVisible();
  });

  test('should display TikTok metrics in dashboard overview', async () => {
    // Mock TikTok account with metrics
    await page.route('/api/social/accounts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{
            id: 'tiktok_account_123',
            platform: 'TIKTOK',
            username: 'dashboardcreator',
            displayName: 'Dashboard Creator',
            followersCount: 250000,
            status: 'ACTIVE',
            platformData: {
              videoCount: 150,
              likesCount: 5000000,
              averageViews: 100000,
              engagementRate: 15.8
            }
          }]
        })
      });
    });

    // Navigate to dashboard overview
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify TikTok metrics are included in overview
    await expect(page.locator('[data-testid="tiktok-metrics-card"]')).toBeVisible();
    await expect(page.locator('text=250K followers')).toBeVisible();
    await expect(page.locator('text=5M total likes')).toBeVisible();
    await expect(page.locator('text=15.8% engagement')).toBeVisible();
  });
});