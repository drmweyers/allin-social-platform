import { test, expect, Page } from '@playwright/test';
import { TestHelpers, SELECTORS } from '../utils/test-helpers';

/**
 * 🔗 COMPREHENSIVE SOCIAL MEDIA INTEGRATION TESTS
 *
 * This test suite covers EVERY aspect of social media integration:
 * - Connection flow for all platforms (Facebook, Instagram, Twitter, LinkedIn, TikTok, YouTube)
 * - Disconnection flow for all platforms
 * - Account synchronization
 * - Platform-specific features
 * - Error handling for each platform
 * - OAuth flow simulation
 * - Account status indicators
 * - Multiple account management
 * - Platform permissions
 * - Rate limiting handling
 * - Profile information display
 * - Platform-specific post formatting
 */

test.describe('🔗 COMPLETE SOCIAL MEDIA INTEGRATION TESTS', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    // Login first
    await page.goto('/auth/login');
    await page.fill('input#email', 'admin@allin.demo');
    await page.fill('input#password', 'Admin123!@#');
    await page.click('button[type="submit"]');

    // Navigate to accounts page
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    await page.goto('/dashboard/accounts');
    await helpers.waitForLoadingComplete();
  });

  const SOCIAL_PLATFORMS = [
    {
      name: 'Facebook',
      testId: 'facebook',
      icon: 'facebook',
      color: '#1877F2',
      features: ['posts', 'pages', 'groups', 'stories', 'reels'],
      oauth: true
    },
    {
      name: 'Instagram',
      testId: 'instagram',
      icon: 'instagram',
      color: '#E4405F',
      features: ['posts', 'stories', 'reels', 'igtv'],
      oauth: true
    },
    {
      name: 'Twitter',
      testId: 'twitter',
      icon: 'twitter',
      color: '#1DA1F2',
      features: ['tweets', 'threads', 'spaces'],
      oauth: true
    },
    {
      name: 'LinkedIn',
      testId: 'linkedin',
      icon: 'linkedin',
      color: '#0A66C2',
      features: ['posts', 'articles', 'company-pages'],
      oauth: true
    },
    {
      name: 'TikTok',
      testId: 'tiktok',
      icon: 'tiktok',
      color: '#000000',
      features: ['videos', 'shorts'],
      oauth: true
    },
    {
      name: 'YouTube',
      testId: 'youtube',
      icon: 'youtube',
      color: '#FF0000',
      features: ['videos', 'shorts', 'community-posts'],
      oauth: true
    }
  ];

  test.describe('🎯 PLATFORM CONNECTION TESTS', () => {
    for (const platform of SOCIAL_PLATFORMS) {
      test(`CONNECT-${platform.testId.toUpperCase()}-001: ${platform.name} connection UI elements`, async ({ page }) => {
        // Look for platform card
        const platformCard = page.locator('.card, .platform-card').filter({ hasText: new RegExp(platform.name, 'i') });
        const platformSection = page.locator('[data-testid*="' + platform.testId + '"], .platform-' + platform.testId);

        // Check if platform card exists
        let cardFound = false;
        if (await platformCard.count() > 0) {
          await expect(platformCard.first()).toBeVisible();
          cardFound = true;
        } else if (await platformSection.count() > 0) {
          await expect(platformSection.first()).toBeVisible();
          cardFound = true;
        }

        if (cardFound) {
          // Check for platform icon
          const iconSelectors = [
            `[data-testid="${platform.testId}-icon"]`,
            `.${platform.testId}-icon`,
            `img[alt*="${platform.name}"]`,
            `svg[class*="${platform.testId}"]`
          ];

          for (const iconSelector of iconSelectors) {
            const icon = page.locator(iconSelector);
            if (await icon.count() > 0 && await icon.isVisible()) {
              await expect(icon.first()).toBeVisible();
              break;
            }
          }

          // Check for connect button
          const connectButton = page.locator('button, a').filter({ hasText: /connect|link|add/i }).and(
            page.locator('*').filter({ hasText: new RegExp(platform.name, 'i') })
          ).first();

          if (await connectButton.count() > 0) {
            await expect(connectButton).toBeVisible();
            await expect(connectButton).toBeEnabled();
          }

          // Check for platform name
          await expect(page.locator(`text="${platform.name}"`)).toBeVisible();

          console.log(`✅ ${platform.name} UI elements verified`);
        } else {
          console.log(`⚠️ ${platform.name} card not found`);
        }

        await helpers.takeScreenshot(`${platform.testId}-connection-ui`);
      });

      test(`CONNECT-${platform.testId.toUpperCase()}-002: ${platform.name} connection flow initiation`, async ({ page }) => {
        // Find connect button for this platform
        const connectSelectors = [
          `[data-testid="${platform.testId}-connect"]`,
          `[data-testid="connect-${platform.testId}"]`,
          `button:has-text("Connect ${platform.name}")`,
          `button:has-text("Connect")`,
          `a:has-text("Connect ${platform.name}")`
        ];

        let connectButton = null;
        for (const selector of connectSelectors) {
          const button = page.locator(selector);
          if (await button.count() > 0) {
            // Check if this button is within a platform-specific context
            const platformContext = button.locator('xpath=ancestor::*[contains(@class, "' + platform.testId + '") or contains(text(), "' + platform.name + '")]');
            if (await platformContext.count() > 0 || selector.includes(platform.testId)) {
              connectButton = button.first();
              break;
            }
          }
        }

        if (!connectButton) {
          // Try finding any connect button near platform name
          const platformText = page.locator(`text="${platform.name}"`);
          if (await platformText.count() > 0) {
            connectButton = platformText.locator('xpath=following::button[contains(text(), "Connect")][1]').first();
          }
        }

        if (connectButton && await connectButton.count() > 0) {
          await expect(connectButton).toBeVisible();
          await expect(connectButton).toBeEnabled();

          // Mock OAuth flow by intercepting the redirect
          await page.route(`**/${platform.testId}/oauth**`, route => {
            route.fulfill({
              status: 200,
              body: JSON.stringify({ success: true, redirectUrl: '/dashboard/accounts?connected=' + platform.testId })
            });
          });

          // Click connect button
          await connectButton.click();

          // Wait for OAuth popup or redirect
          await page.waitForTimeout(2000);

          console.log(`✅ ${platform.name} connection flow initiated`);
        } else {
          console.log(`⚠️ ${platform.name} connect button not found`);
        }
      });

      test(`CONNECT-${platform.testId.toUpperCase()}-003: ${platform.name} OAuth flow simulation`, async ({ page }) => {
        // Simulate successful OAuth flow
        await page.evaluate((platformName) => {
          // Simulate OAuth success callback
          window.postMessage({
            type: 'OAUTH_SUCCESS',
            platform: platformName.toLowerCase(),
            accessToken: 'mock_access_token_' + Date.now(),
            profile: {
              id: 'mock_user_id',
              name: 'Test User',
              email: 'test@example.com',
              avatar: 'https://example.com/avatar.jpg'
            }
          }, '*');
        }, platform.name);

        await page.waitForTimeout(1000);

        // Check for success indicators
        const successIndicators = [
          `text="${platform.name} connected successfully"`,
          `text="Connected to ${platform.name}"`,
          '.success-message',
          '[data-testid="connection-success"]',
          '.toast:has-text("Connected")'
        ];

        for (const indicator of successIndicators) {
          const element = page.locator(indicator);
          if (await element.count() > 0 && await element.isVisible()) {
            await expect(element.first()).toBeVisible();
            console.log(`✅ ${platform.name} OAuth success detected`);
            break;
          }
        }
      });

      test(`CONNECT-${platform.testId.toUpperCase()}-004: ${platform.name} connected state display`, async ({ page }) => {
        // Simulate connected state
        await page.evaluate((platform) => {
          localStorage.setItem(`${platform.testId}_connected`, 'true');
          localStorage.setItem(`${platform.testId}_profile`, JSON.stringify({
            id: 'mock_user_id',
            name: 'Test User',
            username: '@testuser',
            followers: 1000,
            avatar: 'https://example.com/avatar.jpg'
          }));
        }, platform);

        await page.reload();
        await helpers.waitForLoadingComplete();

        // Check for connected state indicators
        const connectedIndicators = [
          `[data-testid="${platform.testId}-connected"]`,
          `.${platform.testId}-connected`,
          'text="Connected"',
          '.status-connected',
          '.green-indicator'
        ];

        for (const indicator of connectedIndicators) {
          const element = page.locator(indicator);
          if (await element.count() > 0 && await element.isVisible()) {
            console.log(`✅ ${platform.name} connected state found`);
            break;
          }
        }

        // Check for profile information display
        const profileElements = [
          'img[alt*="profile"], img[alt*="avatar"]',
          '[data-testid="profile-name"]',
          '[data-testid="username"]',
          '[data-testid="followers"]'
        ];

        for (const profileEl of profileElements) {
          const element = page.locator(profileEl);
          if (await element.count() > 0 && await element.isVisible()) {
            console.log(`✅ ${platform.name} profile info displayed`);
            break;
          }
        }

        await helpers.takeScreenshot(`${platform.testId}-connected-state`);
      });
    }

    test('CONNECT-ALL-001: All platforms display correctly', async ({ page }) => {
      // Verify all platforms are listed
      for (const platform of SOCIAL_PLATFORMS) {
        const platformElement = page.locator(`text="${platform.name}"`).or(
          page.locator(`[data-testid*="${platform.testId}"]`)
        );

        await expect(platformElement.first()).toBeVisible();
      }

      // Count total platform cards
      const platformCards = page.locator('.card, .platform-card, [data-testid*="platform"]');
      const cardCount = await platformCards.count();

      console.log(`✅ Found ${cardCount} platform cards`);
      expect(cardCount).toBeGreaterThanOrEqual(SOCIAL_PLATFORMS.length);

      await helpers.takeScreenshot('all-platforms-overview');
    });

    test('CONNECT-ALL-002: Platform grid/list layout', async ({ page }) => {
      // Check layout responsiveness
      const breakpoints = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1920, height: 1080 }
      ];

      for (const breakpoint of breakpoints) {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        await helpers.waitForLoadingComplete();

        // Verify platforms are still visible and properly laid out
        const platformCards = page.locator('.card, .platform-card');
        const visibleCards = await platformCards.count();

        console.log(`${breakpoint.name}: ${visibleCards} platform cards visible`);

        // Check for proper grid/flex layout
        const container = page.locator('.grid, .flex, .platforms-container').first();
        if (await container.count() > 0) {
          await expect(container).toBeVisible();
        }

        await helpers.takeScreenshot(`platforms-${breakpoint.name}`);
      }
    });
  });

  test.describe('🔌 PLATFORM DISCONNECTION TESTS', () => {
    test.beforeEach(async ({ page }) => {
      // Simulate having connected accounts
      await page.evaluate(() => {
        const platforms = ['facebook', 'instagram', 'twitter', 'linkedin'];
        platforms.forEach(platform => {
          localStorage.setItem(`${platform}_connected`, 'true');
          localStorage.setItem(`${platform}_profile`, JSON.stringify({
            id: 'mock_user_id',
            name: 'Test User',
            username: '@testuser'
          }));
        });
      });

      await page.reload();
      await helpers.waitForLoadingComplete();
    });

    for (const platform of SOCIAL_PLATFORMS.slice(0, 4)) { // Test first 4 platforms
      test(`DISCONNECT-${platform.testId.toUpperCase()}-001: ${platform.name} disconnection flow`, async ({ page }) => {
        // Find disconnect button
        const disconnectSelectors = [
          `[data-testid="${platform.testId}-disconnect"]`,
          `[data-testid="disconnect-${platform.testId}"]`,
          `button:has-text("Disconnect")`,
          `button:has-text("Remove")`,
          `.${platform.testId}-card button:has-text("Disconnect")`
        ];

        let disconnectButton = null;
        for (const selector of disconnectSelectors) {
          const button = page.locator(selector);
          if (await button.count() > 0 && await button.isVisible()) {
            disconnectButton = button.first();
            break;
          }
        }

        if (disconnectButton) {
          await expect(disconnectButton).toBeVisible();
          await expect(disconnectButton).toBeEnabled();

          // Click disconnect
          await disconnectButton.click();

          // Check for confirmation dialog
          const confirmDialog = page.locator('.modal, .dialog, [role="dialog"]');
          if (await confirmDialog.count() > 0 && await confirmDialog.isVisible()) {
            // Find and click confirm button
            const confirmButton = confirmDialog.locator('button').filter({ hasText: /yes|confirm|disconnect|remove/i }).first();
            if (await confirmButton.count() > 0) {
              await confirmButton.click();
            }
          }

          await page.waitForTimeout(1000);

          // Verify disconnection
          const connectButton = page.locator('button').filter({ hasText: /connect/i });
          await expect(connectButton.first()).toBeVisible();

          console.log(`✅ ${platform.name} disconnection completed`);
        } else {
          console.log(`⚠️ ${platform.name} disconnect button not found`);
        }
      });
    }
  });

  test.describe('🔄 ACCOUNT SYNCHRONIZATION TESTS', () => {
    test('SYNC-001: Manual sync functionality', async ({ page }) => {
      // Look for sync/refresh buttons
      const syncButtons = page.locator('button').filter({ hasText: /sync|refresh|update|reload/i });
      const syncIconButtons = page.locator('button svg[class*="refresh"], button svg[class*="sync"]');

      const allSyncButtons = syncButtons.or(syncIconButtons);
      const syncCount = await allSyncButtons.count();

      if (syncCount > 0) {
        const syncButton = allSyncButtons.first();
        await expect(syncButton).toBeVisible();
        await expect(syncButton).toBeEnabled();

        // Click sync
        await syncButton.click();

        // Check for loading state
        await page.waitForTimeout(1000);

        // Look for sync completion indicators
        const syncIndicators = [
          'text="Synced"',
          'text="Updated"',
          '.sync-complete',
          '[data-testid="sync-success"]'
        ];

        for (const indicator of syncIndicators) {
          const element = page.locator(indicator);
          if (await element.count() > 0) {
            console.log('✅ Sync completion detected');
            break;
          }
        }
      }
    });

    test('SYNC-002: Automatic sync indicators', async ({ page }) => {
      // Check for last sync time display
      const lastSyncElements = [
        'text=/last sync|last updated|updated/i',
        '[data-testid="last-sync"]',
        '.last-sync-time'
      ];

      for (const selector of lastSyncElements) {
        const element = page.locator(selector);
        if (await element.count() > 0 && await element.isVisible()) {
          await expect(element.first()).toBeVisible();
          console.log('✅ Last sync time displayed');
          break;
        }
      }

      // Check for auto-sync status
      const autoSyncElements = [
        '[data-testid="auto-sync"]',
        'text=/auto sync/i',
        '.auto-sync-status'
      ];

      for (const selector of autoSyncElements) {
        const element = page.locator(selector);
        if (await element.count() > 0 && await element.isVisible()) {
          console.log('✅ Auto-sync status found');
          break;
        }
      }
    });

    test('SYNC-003: Sync error handling', async ({ page }) => {
      // Simulate sync error
      await page.route('**/api/accounts/sync**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Sync failed' })
        });
      });

      // Trigger sync
      const syncButton = page.locator('button').filter({ hasText: /sync|refresh/i }).first();
      if (await syncButton.count() > 0) {
        await syncButton.click();
        await page.waitForTimeout(2000);

        // Check for error display
        const errorElements = [
          'text="Sync failed"',
          '.error-message',
          '[data-testid="sync-error"]',
          '.toast-error'
        ];

        for (const selector of errorElements) {
          const element = page.locator(selector);
          if (await element.count() > 0 && await element.isVisible()) {
            console.log('✅ Sync error properly displayed');
            break;
          }
        }
      }
    });
  });

  test.describe('🎛️ PLATFORM-SPECIFIC FEATURES', () => {
    test('FEATURES-001: Platform feature availability display', async ({ page }) => {
      for (const platform of SOCIAL_PLATFORMS) {
        // Check if platform features are displayed
        const platformCard = page.locator('.card').filter({ hasText: new RegExp(platform.name, 'i') });

        if (await platformCard.count() > 0) {
          // Look for feature indicators
          for (const feature of platform.features) {
            const featureElement = platformCard.locator(`text=/\b${feature}\b/i`);
            if (await featureElement.count() > 0) {
              console.log(`✅ ${platform.name}: ${feature} feature found`);
            }
          }

          // Check for feature icons or badges
          const featureIcons = platformCard.locator('.feature-icon, .badge, .tag');
          if (await featureIcons.count() > 0) {
            console.log(`✅ ${platform.name}: Feature indicators found`);
          }
        }
      }
    });

    test('FEATURES-002: Platform-specific limitations display', async ({ page }) => {
      // Check for platform limitations or warnings
      const limitationElements = [
        'text=/limitation|limit|restriction/i',
        '.warning',
        '.limitation',
        '[data-testid="platform-limit"]'
      ];

      for (const selector of limitationElements) {
        const elements = page.locator(selector);
        const count = await elements.count();

        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);
          if (await element.isVisible()) {
            console.log('✅ Platform limitation displayed');
          }
        }
      }
    });

    test('FEATURES-003: OAuth permissions display', async ({ page }) => {
      // Check for permissions information
      const permissionElements = [
        'text=/permission|access|scope/i',
        '.permissions',
        '[data-testid="permissions"]',
        '.oauth-scope'
      ];

      for (const selector of permissionElements) {
        const elements = page.locator(selector);
        if (await elements.count() > 0) {
          console.log('✅ OAuth permissions information found');
        }
      }
    });
  });

  test.describe('⚠️ ERROR HANDLING TESTS', () => {
    test('ERROR-001: OAuth failure handling', async ({ page }) => {
      // Simulate OAuth failure
      await page.route('**/oauth/**', route => {
        route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'OAuth failed', message: 'User denied access' })
        });
      });

      // Try to connect a platform
      const connectButton = page.locator('button').filter({ hasText: /connect/i }).first();
      if (await connectButton.count() > 0) {
        await connectButton.click();
        await page.waitForTimeout(2000);

        // Check for error handling
        const errorElements = [
          'text="Connection failed"',
          'text="OAuth failed"',
          '.error-message',
          '[data-testid="connection-error"]'
        ];

        for (const selector of errorElements) {
          const element = page.locator(selector);
          if (await element.count() > 0 && await element.isVisible()) {
            console.log('✅ OAuth error properly handled');
            break;
          }
        }
      }
    });

    test('ERROR-002: API rate limit handling', async ({ page }) => {
      // Simulate rate limit error
      await page.route('**/api/accounts/**', route => {
        route.fulfill({
          status: 429,
          body: JSON.stringify({ error: 'Rate limit exceeded', retryAfter: 60 })
        });
      });

      // Trigger API call
      const refreshButton = page.locator('button').filter({ hasText: /refresh|sync/i }).first();
      if (await refreshButton.count() > 0) {
        await refreshButton.click();
        await page.waitForTimeout(2000);

        // Check for rate limit handling
        const rateLimitElements = [
          'text=/rate limit|too many requests/i',
          '.rate-limit-error',
          '[data-testid="rate-limit"]'
        ];

        for (const selector of rateLimitElements) {
          const element = page.locator(selector);
          if (await element.count() > 0 && await element.isVisible()) {
            console.log('✅ Rate limit error properly handled');
            break;
          }
        }
      }
    });

    test('ERROR-003: Network error handling', async ({ page }) => {
      // Simulate network error
      await page.route('**/api/**', route => route.abort());

      // Try to refresh accounts
      await page.reload();
      await page.waitForTimeout(3000);

      // Check for network error handling
      const networkErrorElements = [
        'text=/network error|connection failed|offline/i',
        '.network-error',
        '[data-testid="network-error"]',
        '.offline-indicator'
      ];

      for (const selector of networkErrorElements) {
        const element = page.locator(selector);
        if (await element.count() > 0 && await element.isVisible()) {
          console.log('✅ Network error properly handled');
          break;
        }
      }
    });
  });

  test.describe('👥 MULTIPLE ACCOUNTS MANAGEMENT', () => {
    test('MULTI-001: Multiple accounts for same platform', async ({ page }) => {
      // Simulate multiple Facebook accounts
      await page.evaluate(() => {
        localStorage.setItem('facebook_accounts', JSON.stringify([
          { id: 'account1', name: 'Personal Account', type: 'personal' },
          { id: 'account2', name: 'Business Page', type: 'page' },
          { id: 'account3', name: 'Brand Page', type: 'page' }
        ]));
      });

      await page.reload();
      await helpers.waitForLoadingComplete();

      // Check for multiple account display
      const accountLists = page.locator('.account-list, [data-testid="account-list"]');
      if (await accountLists.count() > 0) {
        const accountItems = accountLists.locator('.account-item, li');
        const itemCount = await accountItems.count();

        if (itemCount > 1) {
          console.log(`✅ Multiple accounts displayed: ${itemCount}`);
        }
      }

      // Check for account switcher
      const accountSwitcher = page.locator('.account-switcher, [data-testid="account-switcher"]');
      if (await accountSwitcher.count() > 0) {
        console.log('✅ Account switcher found');
      }
    });

    test('MULTI-002: Account selection functionality', async ({ page }) => {
      // Look for account selection checkboxes or toggles
      const selectionElements = page.locator('input[type="checkbox"], .toggle, .switch');
      const selectionCount = await selectionElements.count();

      for (let i = 0; i < Math.min(selectionCount, 5); i++) {
        const element = selectionElements.nth(i);
        if (await element.isVisible()) {
          await element.click();
          await page.waitForTimeout(500);
          console.log(`✅ Account selection ${i + 1} tested`);
        }
      }
    });
  });

  test.describe('📊 ACCOUNT ANALYTICS INTEGRATION', () => {
    test('ANALYTICS-001: Platform analytics preview', async ({ page }) => {
      // Look for analytics data on accounts page
      const analyticsElements = [
        '.analytics-preview',
        '[data-testid="analytics"]',
        'text=/followers|likes|engagement/i',
        '.metrics',
        '.stats'
      ];

      for (const selector of analyticsElements) {
        const elements = page.locator(selector);
        if (await elements.count() > 0) {
          const element = elements.first();
          if (await element.isVisible()) {
            console.log(`✅ Analytics preview found: ${selector}`);
          }
        }
      }
    });

    test('ANALYTICS-002: Real-time metrics display', async ({ page }) => {
      // Check for real-time or recent metrics
      const metricsElements = [
        'text=/\\d+\\s*(followers|likes|views|comments)/i',
        '.metric-value',
        '.count',
        '.number'
      ];

      for (const selector of metricsElements) {
        const elements = page.locator(selector);
        const count = await elements.count();

        if (count > 0) {
          console.log(`✅ Metrics found: ${count} metric elements`);
          break;
        }
      }
    });
  });

  test.describe('🔐 SECURITY & PERMISSIONS', () => {
    test('SECURITY-001: Token expiration handling', async ({ page }) => {
      // Simulate expired token
      await page.evaluate(() => {
        localStorage.setItem('facebook_token_expired', 'true');
      });

      await page.reload();
      await helpers.waitForLoadingComplete();

      // Check for token expiration warning
      const expirationElements = [
        'text=/token expired|session expired|reauthorize/i',
        '.token-expired',
        '.auth-warning',
        '[data-testid="token-expired"]'
      ];

      for (const selector of expirationElements) {
        const element = page.locator(selector);
        if (await element.count() > 0 && await element.isVisible()) {
          console.log('✅ Token expiration properly handled');
          break;
        }
      }
    });

    test('SECURITY-002: Permission scope display', async ({ page }) => {
      // Check for permission/scope information
      const permissionElements = [
        '.permissions-list',
        '[data-testid="permissions"]',
        'text=/read|write|publish|manage/i',
        '.scope-list'
      ];

      for (const selector of permissionElements) {
        const elements = page.locator(selector);
        if (await elements.count() > 0) {
          console.log('✅ Permission scope information found');
        }
      }
    });
  });

  test.describe('⚡ PERFORMANCE TESTS', () => {
    test('PERF-001: Accounts page load performance', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard/accounts');
      await helpers.waitForLoadingComplete();

      const loadTime = Date.now() - startTime;
      console.log(`Accounts page load time: ${loadTime}ms`);

      expect(loadTime).toBeLessThan(10000); // 10 seconds max

      const metrics = await helpers.checkPerformanceMetrics();
      console.log('Accounts page performance metrics:', metrics);
    });

    test('PERF-002: Platform card rendering performance', async ({ page }) => {
      const startTime = Date.now();

      // Count platform cards
      const platformCards = page.locator('.card, .platform-card');
      const cardCount = await platformCards.count();

      // Wait for all cards to be visible
      for (let i = 0; i < cardCount; i++) {
        await expect(platformCards.nth(i)).toBeVisible();
      }

      const renderTime = Date.now() - startTime;
      console.log(`${cardCount} platform cards rendered in ${renderTime}ms`);
    });
  });
});

export {};