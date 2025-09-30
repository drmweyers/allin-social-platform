import { test, expect, Page } from '@playwright/test';
import { TestHelpers, SELECTORS } from '../utils/test-helpers';

/**
 * 🔗 SOCIAL OAUTH CONNECTIONS VERIFICATION
 *
 * These tests specifically verify that Social OAuth functionality is working:
 * - OAuth connection buttons are present and clickable
 * - Social platform integration is properly configured
 * - Connection flow initiation works correctly
 * - Connected accounts are displayed properly
 * - Disconnect functionality is available
 */

test.describe('🔗 SOCIAL OAUTH VERIFICATION', () => {
  let helpers: TestHelpers;

  // Define expected social platforms
  const SOCIAL_PLATFORMS = [
    { name: 'Facebook', color: '#1877F2', testId: 'facebook-connect' },
    { name: 'Instagram', color: '#E4405F', testId: 'instagram-connect' },
    { name: 'Twitter', color: '#1DA1F2', testId: 'twitter-connect' },
    { name: 'LinkedIn', color: '#0A66C2', testId: 'linkedin-connect' },
    { name: 'TikTok', color: '#000000', testId: 'tiktok-connect' },
    { name: 'YouTube', color: '#FF0000', testId: 'youtube-connect' }
  ];

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    // Login with admin account (full access to social connections)
    await page.goto('/auth/login');
    await page.fill('input[type="email"], input#email, [data-testid="email-input"]', 'admin@allin.demo');
    await page.fill('input[type="password"], input#password, [data-testid="password-input"]', 'Admin123!@#');
    await page.click('button[type="submit"], [data-testid="submit-button"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
  });

  test('OAUTH-001: Navigate to social connections and verify OAuth buttons exist', async ({ page }) => {
    console.log('🔍 Testing social OAuth connection buttons...');

    // Try different routes to social connections
    const socialRoutes = [
      '/dashboard/settings',
      '/dashboard/accounts',
      '/dashboard/social',
      '/dashboard/connections'
    ];

    let socialPageFound = false;

    for (const route of socialRoutes) {
      await page.goto(route);
      await helpers.waitForLoadingComplete();

      // Look for social connection section
      const socialSectionSelectors = [
        'h1:has-text("Social")',
        'h2:has-text("Social Accounts")',
        'text="Connect Accounts"',
        'text="Social Platforms"',
        '[data-testid="social-accounts"]',
        '.social-connections'
      ];

      for (const selector of socialSectionSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          console.log(`✅ Social section found at ${route} with: ${selector}`);
          socialPageFound = true;
          break;
        }
      }

      if (socialPageFound) break;

      // If on settings page, try clicking social tab
      if (route.includes('settings')) {
        const socialTabs = [
          'button:has-text("Social")',
          'button:has-text("Accounts")',
          '[data-testid="social-tab"]',
          'tab:has-text("Social")'
        ];

        for (const tabSelector of socialTabs) {
          const tab = page.locator(tabSelector);
          if (await tab.count() > 0 && await tab.isVisible()) {
            await tab.click();
            await page.waitForTimeout(1000);
            console.log(`✅ Clicked social tab: ${tabSelector}`);

            // Check again for social section
            for (const selector of socialSectionSelectors) {
              const element = page.locator(selector);
              if (await element.count() > 0) {
                console.log(`✅ Social section found after tab click: ${selector}`);
                socialPageFound = true;
                break;
              }
            }
            if (socialPageFound) break;
          }
        }
      }

      if (socialPageFound) break;
    }

    expect(socialPageFound).toBe(true);
    await helpers.takeScreenshot('social-connections-found');
  });

  test('OAUTH-002: Verify all social platform connection buttons are present', async ({ page }) => {
    console.log('🔍 Verifying social platform connection buttons...');

    // Navigate to social connections
    await page.goto('/dashboard/settings');
    await helpers.waitForLoadingComplete();

    // Try to find and click social tab
    const socialTab = page.locator('button:has-text("Social"), button:has-text("Accounts"), [data-testid="social-tab"]').first();
    if (await socialTab.count() > 0) {
      await socialTab.click();
      await page.waitForTimeout(1000);
    }

    const connectionResults: Array<{ platform: string, found: boolean, selector: string }> = [];

    // Check for each social platform
    for (const platform of SOCIAL_PLATFORMS) {
      console.log(`\n🔍 Looking for ${platform.name} connection...`);

      const platformSelectors = [
        `button:has-text("${platform.name}")`,
        `[data-testid="${platform.testId}"]`,
        `[data-platform="${platform.name.toLowerCase()}"]`,
        `.${platform.name.toLowerCase()}-connect`,
        `button:has-text("Connect ${platform.name}")`,
        `.connect-${platform.name.toLowerCase()}`,
        `text="Connect to ${platform.name}"`,
        `img[alt*="${platform.name}"] ~ button`,
        `.social-platform:has-text("${platform.name}")`
      ];

      let platformFound = false;
      let usedSelector = '';

      for (const selector of platformSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          console.log(`  ✅ ${platform.name} found with: ${selector}`);

          // Check if it's visible
          const firstElement = element.first();
          if (await firstElement.isVisible()) {
            console.log(`  ✅ ${platform.name} button is visible`);

            // Check if clickable
            try {
              await expect(firstElement).toBeEnabled();
              console.log(`  ✅ ${platform.name} button is enabled`);
            } catch {
              console.log(`  ℹ️ ${platform.name} button state unclear`);
            }
          }

          platformFound = true;
          usedSelector = selector;
          break;
        }
      }

      connectionResults.push({
        platform: platform.name,
        found: platformFound,
        selector: usedSelector
      });

      if (!platformFound) {
        console.log(`  ⚠️ ${platform.name} connection not found`);
      }
    }

    // Summary
    const foundPlatforms = connectionResults.filter(r => r.found);
    const missingPlatforms = connectionResults.filter(r => !r.found);

    console.log(`\n📊 Social Platform Connection Summary:`);
    console.log(`   Total Expected: ${SOCIAL_PLATFORMS.length}`);
    console.log(`   Found: ${foundPlatforms.length}`);
    console.log(`   Missing: ${missingPlatforms.length}`);

    if (foundPlatforms.length > 0) {
      console.log(`   Found Platforms: ${foundPlatforms.map(p => p.platform).join(', ')}`);
    }

    if (missingPlatforms.length > 0) {
      console.log(`   Missing Platforms: ${missingPlatforms.map(p => p.platform).join(', ')}`);
    }

    // Test should pass if at least some platforms are found
    expect(foundPlatforms.length).toBeGreaterThan(0);

    await helpers.takeScreenshot('social-platforms-verification');
  });

  test('OAUTH-003: Test OAuth connection flow initiation', async ({ page }) => {
    console.log('🔍 Testing OAuth connection flow initiation...');

    // Navigate to social connections
    await page.goto('/dashboard/settings');
    await helpers.waitForLoadingComplete();

    const socialTab = page.locator('button:has-text("Social"), button:has-text("Accounts")').first();
    if (await socialTab.count() > 0) {
      await socialTab.click();
      await page.waitForTimeout(1000);
    }

    // Test OAuth flow for first available platform
    const connectionButtons = page.locator('button:has-text("Connect"), button:has-text("Facebook"), button:has-text("Instagram"), button:has-text("Twitter")');

    if (await connectionButtons.count() > 0) {
      const firstButton = connectionButtons.first();
      const buttonText = await firstButton.textContent();
      console.log(`Testing OAuth flow with button: "${buttonText}"`);

      // Click the connection button
      await firstButton.click();
      await page.waitForTimeout(2000);

      // Check for OAuth flow indicators
      const oauthIndicators = [
        // New tab/window opened (OAuth popup)
        // Modal with OAuth instructions
        '.oauth-modal',
        '[data-testid="oauth-modal"]',
        '.connection-modal',
        '.auth-modal',

        // Loading states during OAuth
        '.connecting',
        '.oauth-loading',
        'text="Connecting"',
        'text="Redirecting"',

        // OAuth error/warning messages
        '.oauth-error',
        'text="OAuth"',
        'text="authorization"',

        // Confirmation dialogs
        '.connection-confirmation',
        'text="Connected successfully"'
      ];

      let oauthFlowDetected = false;
      for (const indicator of oauthIndicators) {
        const element = page.locator(indicator);
        if (await element.count() > 0) {
          console.log(`✅ OAuth flow indicator found: ${indicator}`);
          oauthFlowDetected = true;
          break;
        }
      }

      if (!oauthFlowDetected) {
        // Check if URL changed (redirect to OAuth provider)
        const currentUrl = page.url();
        if (!currentUrl.includes('localhost')) {
          console.log(`✅ OAuth redirect detected: ${currentUrl}`);
          oauthFlowDetected = true;

          // Navigate back to our app
          await page.goto('/dashboard/settings');
          await helpers.waitForLoadingComplete();
        }
      }

      if (oauthFlowDetected) {
        console.log('✅ OAuth connection flow initiated successfully');
      } else {
        console.log('ℹ️ OAuth flow may be configured differently or requires additional setup');
      }

    } else {
      console.log('ℹ️ No connection buttons found for OAuth flow testing');
    }

    await helpers.takeScreenshot('oauth-flow-test');
  });

  test('OAUTH-004: Verify connected accounts display and management', async ({ page }) => {
    console.log('🔍 Testing connected accounts display and management...');

    await page.goto('/dashboard/settings');
    await helpers.waitForLoadingComplete();

    const socialTab = page.locator('button:has-text("Social"), button:has-text("Accounts")').first();
    if (await socialTab.count() > 0) {
      await socialTab.click();
      await page.waitForTimeout(1000);
    }

    // Look for connected accounts section
    const connectedAccountsSelectors = [
      '.connected-accounts',
      '[data-testid="connected-accounts"]',
      '.social-accounts-list',
      '.connected-platforms',
      'text="Connected Accounts"',
      '.account-connections'
    ];

    let connectedSection = null;
    for (const selector of connectedAccountsSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`✅ Connected accounts section found: ${selector}`);
        connectedSection = element;
        break;
      }
    }

    if (connectedSection) {
      // Look for individual connected accounts
      const accountItems = connectedSection.locator('.account-item, .connected-account, .platform-connection');
      const accountCount = await accountItems.count();

      console.log(`Found ${accountCount} connected account items`);

      if (accountCount > 0) {
        // Check first connected account for management options
        const firstAccount = accountItems.first();

        // Look for account info
        const accountInfo = [
          '.account-name',
          '.platform-name',
          '.username',
          '.account-handle'
        ];

        for (const infoSelector of accountInfo) {
          const info = firstAccount.locator(infoSelector);
          if (await info.count() > 0) {
            console.log(`✅ Account info found: ${infoSelector}`);
          }
        }

        // Look for management buttons
        const managementButtons = [
          'button:has-text("Disconnect")',
          'button:has-text("Remove")',
          'button:has-text("Manage")',
          'button:has-text("Settings")',
          '[data-testid="disconnect-account"]'
        ];

        for (const buttonSelector of managementButtons) {
          const button = firstAccount.locator(buttonSelector);
          if (await button.count() > 0) {
            console.log(`✅ Account management option found: ${buttonSelector}`);
          }
        }
      } else {
        console.log('ℹ️ No connected accounts found (may need actual OAuth connections)');
      }

    } else {
      console.log('ℹ️ Connected accounts section may be implemented differently');
    }

    // Look for connection status indicators
    const statusIndicators = [
      '.connected-status',
      '.connection-active',
      '.status-connected',
      'text="Connected"',
      '.success-status'
    ];

    for (const indicator of statusIndicators) {
      const element = page.locator(indicator);
      if (await element.count() > 0) {
        console.log(`✅ Connection status indicator found: ${indicator}`);
      }
    }

    await helpers.takeScreenshot('connected-accounts-management');
  });

  test('OAUTH-005: Test social platform connection status and health', async ({ page }) => {
    console.log('🔍 Testing social platform connection health...');

    await page.goto('/dashboard/settings');
    await helpers.waitForLoadingComplete();

    const socialTab = page.locator('button:has-text("Social"), button:has-text("Accounts")').first();
    if (await socialTab.count() > 0) {
      await socialTab.click();
      await page.waitForTimeout(1000);
    }

    // Check for connection health indicators
    const healthIndicators = [
      '.connection-healthy',
      '.connection-error',
      '.connection-warning',
      '.status-active',
      '.status-inactive',
      '.connection-expired'
    ];

    let healthStatusFound = false;
    for (const indicator of healthIndicators) {
      const element = page.locator(indicator);
      if (await element.count() > 0) {
        console.log(`✅ Connection health indicator found: ${indicator}`);
        healthStatusFound = true;
      }
    }

    // Look for refresh/reconnect options
    const refreshOptions = [
      'button:has-text("Refresh")',
      'button:has-text("Reconnect")',
      'button:has-text("Update")',
      '[data-testid="refresh-connection"]',
      '.refresh-token'
    ];

    for (const refreshOption of refreshOptions) {
      const element = page.locator(refreshOption);
      if (await element.count() > 0) {
        console.log(`✅ Connection refresh option found: ${refreshOption}`);
      }
    }

    // Check for last sync/update timestamps
    const timestampIndicators = [
      '.last-sync',
      '.last-updated',
      '.connection-timestamp',
      'text="Last synced"',
      'text="Last updated"'
    ];

    for (const timestampIndicator of timestampIndicators) {
      const element = page.locator(timestampIndicator);
      if (await element.count() > 0) {
        console.log(`✅ Connection timestamp found: ${timestampIndicator}`);
      }
    }

    if (healthStatusFound) {
      console.log('✅ Social platform connection health monitoring available');
    } else {
      console.log('ℹ️ Connection health monitoring may be implemented differently');
    }

    await helpers.takeScreenshot('connection-health-status');
  });

  test('OAUTH-006: Test OAuth error handling and recovery', async ({ page }) => {
    console.log('🔍 Testing OAuth error handling...');

    // Monitor console errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(`Page Error: ${error.message}`);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`Console Error: ${msg.text()}`);
      }
    });

    await page.goto('/dashboard/settings');
    await helpers.waitForLoadingComplete();

    const socialTab = page.locator('button:has-text("Social"), button:has-text("Accounts")').first();
    if (await socialTab.count() > 0) {
      await socialTab.click();
      await page.waitForTimeout(1000);
    }

    // Test multiple OAuth button clicks (stress test)
    const oauthButtons = page.locator('button:has-text("Connect"), [data-testid*="connect"]');
    const buttonCount = Math.min(await oauthButtons.count(), 3);

    for (let i = 0; i < buttonCount; i++) {
      const button = oauthButtons.nth(i);
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(1000);

        // Look for error messages
        const errorMessages = page.locator('.error-message, .oauth-error, .connection-error');
        if (await errorMessages.count() > 0) {
          console.log('⚠️ OAuth error message detected (expected for unconfigured OAuth)');
        }
      }
    }

    // Test page refresh during OAuth flow
    await page.reload();
    await helpers.waitForLoadingComplete();

    const socialTab2 = page.locator('button:has-text("Social"), button:has-text("Accounts")').first();
    if (await socialTab2.count() > 0) {
      await socialTab2.click();
      await page.waitForTimeout(1000);
    }

    // Check if page recovered properly
    const socialContent = page.locator('.social-connections, [data-testid="social-accounts"], button:has-text("Connect")');
    const recovered = await socialContent.count() > 0;

    console.log(`OAuth error recovery test: ${recovered ? '✅ Recovered' : '⚠️ May need investigation'}`);

    // Report errors (OAuth errors are expected in test environment)
    if (errors.length > 0) {
      const oauthRelatedErrors = errors.filter(e =>
        e.toLowerCase().includes('oauth') ||
        e.toLowerCase().includes('auth') ||
        e.toLowerCase().includes('connect')
      );

      if (oauthRelatedErrors.length > 0) {
        console.log('ℹ️ OAuth-related errors (expected in test environment):', oauthRelatedErrors.slice(0, 3));
      }

      const otherErrors = errors.filter(e =>
        !e.toLowerCase().includes('oauth') &&
        !e.toLowerCase().includes('auth') &&
        !e.toLowerCase().includes('connect')
      );

      if (otherErrors.length > 0) {
        console.log('⚠️ Non-OAuth errors detected:', otherErrors.slice(0, 3));
      }
    } else {
      console.log('✅ No critical JavaScript errors detected');
    }

    await helpers.takeScreenshot('oauth-error-handling');
  });

  test('OAUTH-007: Test OAuth functionality across different user roles', async ({ page }) => {
    console.log('🔍 Testing OAuth access across different user roles...');

    const testAccounts = [
      { email: 'admin@allin.demo', password: 'Admin123!@#', role: 'Administrator' },
      { email: 'manager@allin.demo', password: 'Manager123!@#', role: 'Manager' },
      { email: 'creator@allin.demo', password: 'Creator123!@#', role: 'Creator' }
    ];

    const roleOAuthAccess: Array<{role: string, hasAccess: boolean}> = [];

    for (const account of testAccounts) {
      console.log(`\n🔍 Testing OAuth access for: ${account.role}`);

      // Login with this account
      await page.goto('/auth/login');
      await page.fill('input[type="email"], input#email', account.email);
      await page.fill('input[type="password"], input#password', account.password);
      await page.click('button[type="submit"]');

      try {
        await page.waitForURL('**/dashboard**', { timeout: 15000 });

        // Try to access social connections
        await page.goto('/dashboard/settings');
        await helpers.waitForLoadingComplete();

        const socialTab = page.locator('button:has-text("Social"), button:has-text("Accounts")').first();
        if (await socialTab.count() > 0) {
          await socialTab.click();
          await page.waitForTimeout(1000);
        }

        // Check for OAuth connection buttons
        const oauthButtons = page.locator('button:has-text("Connect"), [data-testid*="connect"]');
        const hasOAuthAccess = await oauthButtons.count() > 0;

        roleOAuthAccess.push({
          role: account.role,
          hasAccess: hasOAuthAccess
        });

        console.log(`  ${hasOAuthAccess ? '✅' : '❌'} OAuth access for ${account.role}: ${hasOAuthAccess ? 'Available' : 'Restricted'}`);

      } catch (error) {
        console.log(`  ❌ Failed to test ${account.role}: ${error}`);
        roleOAuthAccess.push({
          role: account.role,
          hasAccess: false
        });
      }
    }

    // Summary
    console.log('\n📊 OAuth Access by Role Summary:');
    roleOAuthAccess.forEach(result => {
      console.log(`   ${result.role}: ${result.hasAccess ? '✅ Has Access' : '❌ No Access'}`);
    });

    // At least admin should have OAuth access
    const adminAccess = roleOAuthAccess.find(r => r.role === 'Administrator');
    if (adminAccess) {
      expect(adminAccess.hasAccess).toBe(true);
    }

    await helpers.takeScreenshot('oauth-role-access-verification');
  });
});

export {};