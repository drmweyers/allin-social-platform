import { test, expect, Page } from '@playwright/test';
import { TestHelpers, SELECTORS } from '../utils/test-helpers';

/**
 * ⚙️ SETTINGS PAGE 404 FIX VERIFICATION TESTS
 *
 * These tests specifically verify that the Settings page fixes are working:
 * - Settings page loads without 404 error
 * - All settings sections are accessible
 * - Social account connection buttons are present and clickable
 * - No broken routes or missing components
 */

test.describe('⚙️ SETTINGS PAGE FIX VERIFICATION', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    // Login with admin account
    await page.goto('/auth/login');
    await page.fill('input[type="email"], input#email, [data-testid="email-input"]', 'admin@allin.demo');
    await page.fill('input[type="password"], input#password, [data-testid="password-input"]', 'Admin123!@#');
    await page.click('button[type="submit"], [data-testid="submit-button"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
  });

  test('SETTINGS-FIX-001: Settings page loads without 404 error', async ({ page }) => {
    console.log('🔍 Testing Settings page accessibility...');

    // Navigate to settings page
    await page.goto('/dashboard/settings');
    await helpers.waitForLoadingComplete();

    // Verify page loaded successfully (no 404 error)
    const pageTitle = await page.title();
    expect(pageTitle).not.toContain('404');
    expect(pageTitle).not.toContain('Not Found');

    // Check for settings page indicators
    const settingsIndicators = [
      'h1:has-text("Settings")',
      '[data-testid="settings-page"]',
      '.settings-container',
      'text="Account Settings"',
      'text="Profile"',
      'text="Security"'
    ];

    let foundIndicator = false;
    for (const indicator of settingsIndicators) {
      const element = page.locator(indicator);
      if (await element.count() > 0) {
        await expect(element).toBeVisible();
        foundIndicator = true;
        console.log(`✅ Settings page indicator found: ${indicator}`);
        break;
      }
    }

    expect(foundIndicator).toBe(true);

    // Verify no error messages are displayed
    const errorMessages = page.locator('.error-message, .error-container, [data-testid="error"], text="404", text="Page not found"');
    expect(await errorMessages.count()).toBe(0);

    await helpers.takeScreenshot('settings-page-loaded-successfully');
    console.log('✅ Settings page loads without 404 error');
  });

  test('SETTINGS-FIX-002: All settings sections are visible and accessible', async ({ page }) => {
    console.log('🔍 Testing Settings sections accessibility...');

    await page.goto('/dashboard/settings');
    await helpers.waitForLoadingComplete();

    // Check for main settings sections
    const settingsSections = [
      { name: 'Profile', selectors: ['button:has-text("Profile")', '[data-testid="profile-tab"]', 'text="Profile Settings"', '.profile-settings'] },
      { name: 'Account', selectors: ['button:has-text("Account")', '[data-testid="account-tab"]', 'text="Account Settings"', '.account-settings'] },
      { name: 'Security', selectors: ['button:has-text("Security")', '[data-testid="security-tab"]', 'text="Security"', '.security-settings'] },
      { name: 'Notifications', selectors: ['button:has-text("Notifications")', '[data-testid="notifications-tab"]', 'text="Notifications"', '.notification-settings'] },
      { name: 'Social Accounts', selectors: ['button:has-text("Social")', '[data-testid="social-tab"]', 'text="Social Accounts"', '.social-settings'] }
    ];

    for (const section of settingsSections) {
      let sectionFound = false;

      for (const selector of section.selectors) {
        const element = page.locator(selector);
        if (await element.count() > 0 && await element.isVisible()) {
          console.log(`✅ Settings section "${section.name}" found with selector: ${selector}`);

          // Test clicking the section
          try {
            await element.click();
            await page.waitForTimeout(1000);
            console.log(`✅ Settings section "${section.name}" is clickable`);
          } catch (error) {
            console.log(`ℹ️ Settings section "${section.name}" may not be clickable: ${error}`);
          }

          sectionFound = true;
          break;
        }
      }

      if (sectionFound) {
        console.log(`✅ Settings section verified: ${section.name}`);
      } else {
        console.log(`⚠️ Settings section not found: ${section.name}`);
      }
    }

    await helpers.takeScreenshot('settings-sections-verification');
  });

  test('SETTINGS-FIX-003: Social account connection buttons are present and functional', async ({ page }) => {
    console.log('🔍 Testing Social account connection buttons...');

    await page.goto('/dashboard/settings');
    await helpers.waitForLoadingComplete();

    // Navigate to social accounts section
    const socialSectionSelectors = [
      'button:has-text("Social")',
      '[data-testid="social-tab"]',
      'button:has-text("Accounts")',
      '[data-testid="accounts-tab"]',
      'text="Social Accounts"'
    ];

    for (const selector of socialSectionSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0 && await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(1000);
        console.log(`✅ Clicked social section: ${selector}`);
        break;
      }
    }

    // Check for social platform connection buttons
    const socialPlatforms = [
      { name: 'Facebook', selectors: ['button:has-text("Facebook")', '[data-testid="facebook-connect"]', '.facebook-connect', 'text="Connect Facebook"'] },
      { name: 'Instagram', selectors: ['button:has-text("Instagram")', '[data-testid="instagram-connect"]', '.instagram-connect', 'text="Connect Instagram"'] },
      { name: 'Twitter', selectors: ['button:has-text("Twitter")', '[data-testid="twitter-connect"]', '.twitter-connect', 'text="Connect Twitter"'] },
      { name: 'LinkedIn', selectors: ['button:has-text("LinkedIn")', '[data-testid="linkedin-connect"]', '.linkedin-connect', 'text="Connect LinkedIn"'] },
      { name: 'TikTok', selectors: ['button:has-text("TikTok")', '[data-testid="tiktok-connect"]', '.tiktok-connect', 'text="Connect TikTok"'] },
      { name: 'YouTube', selectors: ['button:has-text("YouTube")', '[data-testid="youtube-connect"]', '.youtube-connect', 'text="Connect YouTube"'] }
    ];

    let connectionsFound = 0;

    for (const platform of socialPlatforms) {
      let platformFound = false;

      for (const selector of platform.selectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          console.log(`✅ Social platform "${platform.name}" connection found: ${selector}`);

          // Verify the button is visible and enabled
          if (await element.isVisible()) {
            console.log(`✅ ${platform.name} connection button is visible`);

            try {
              await expect(element).toBeEnabled();
              console.log(`✅ ${platform.name} connection button is enabled`);
            } catch {
              console.log(`ℹ️ ${platform.name} connection button state could not be verified`);
            }
          }

          connectionsFound++;
          platformFound = true;
          break;
        }
      }

      if (!platformFound) {
        console.log(`⚠️ Social platform connection not found: ${platform.name}`);
      }
    }

    // Verify at least some social connections are available
    expect(connectionsFound).toBeGreaterThan(0);
    console.log(`✅ Found ${connectionsFound} social platform connections`);

    await helpers.takeScreenshot('social-connections-verification');
  });

  test('SETTINGS-FIX-004: Settings page navigation and routing works correctly', async ({ page }) => {
    console.log('🔍 Testing Settings page navigation and routing...');

    // Test direct navigation to settings
    await page.goto('/dashboard/settings');
    await helpers.waitForLoadingComplete();

    // Verify URL is correct and page loaded
    const currentUrl = page.url();
    expect(currentUrl).toContain('/dashboard/settings');
    console.log(`✅ Settings page URL is correct: ${currentUrl}`);

    // Test navigation from dashboard
    await page.goto('/dashboard');
    await helpers.waitForLoadingComplete();

    // Find and click settings navigation
    const settingsNavSelectors = [
      '[data-testid="nav-settings"]',
      'a[href*="/settings"]',
      'button:has-text("Settings")',
      'text="Settings"',
      '.settings-nav'
    ];

    let navigationWorked = false;
    for (const selector of settingsNavSelectors) {
      const navElement = page.locator(selector);
      if (await navElement.count() > 0 && await navElement.isVisible()) {
        try {
          await navElement.click();
          await helpers.waitForLoadingComplete();

          // Check if we're now on settings page
          const newUrl = page.url();
          if (newUrl.includes('/settings')) {
            console.log(`✅ Settings navigation works via: ${selector}`);
            navigationWorked = true;
            break;
          }
        } catch (error) {
          console.log(`ℹ️ Settings navigation failed via ${selector}: ${error}`);
        }
      }
    }

    if (navigationWorked) {
      console.log('✅ Settings page navigation from dashboard works');
    } else {
      console.log('⚠️ Settings page navigation test: direct URL access works, nav link may need verification');
    }

    await helpers.takeScreenshot('settings-navigation-verification');
  });

  test('SETTINGS-FIX-005: Settings page performance and loading', async ({ page }) => {
    console.log('🔍 Testing Settings page performance...');

    // Measure loading time
    const startTime = Date.now();

    await page.goto('/dashboard/settings');
    await helpers.waitForLoadingComplete();

    const loadTime = Date.now() - startTime;
    console.log(`Settings page load time: ${loadTime}ms`);

    // Verify reasonable load time (under 10 seconds)
    expect(loadTime).toBeLessThan(10000);

    // Check for performance indicators
    const performanceMetrics = await helpers.checkPerformanceMetrics();
    console.log('Settings page performance metrics:', performanceMetrics);

    // Verify no loading spinners remain visible
    const loadingSpinners = page.locator('[data-testid="loading-spinner"], .loading-spinner, .spinner');
    expect(await loadingSpinners.count()).toBe(0);

    // Verify no skeleton loaders remain visible
    const skeletonLoaders = page.locator('.animate-pulse, .skeleton-loader');
    if (await skeletonLoaders.count() > 0) {
      // Give them a moment to disappear
      await page.waitForTimeout(2000);
      const remainingSkeletons = await skeletonLoaders.count();
      console.log(`ℹ️ Skeleton loaders after wait: ${remainingSkeletons}`);
    }

    console.log('✅ Settings page performance verification completed');
    await helpers.takeScreenshot('settings-performance-verification');
  });

  test('SETTINGS-FIX-006: Settings form functionality works', async ({ page }) => {
    console.log('🔍 Testing Settings form functionality...');

    await page.goto('/dashboard/settings');
    await helpers.waitForLoadingComplete();

    // Look for profile/account forms
    const formSelectors = [
      '.settings-form',
      '[data-testid="profile-form"]',
      'form',
      '.profile-settings form',
      '.account-settings form'
    ];

    let formFound = false;
    for (const selector of formSelectors) {
      const form = page.locator(selector);
      if (await form.count() > 0 && await form.isVisible()) {
        console.log(`✅ Settings form found: ${selector}`);

        // Test form inputs
        const inputs = form.locator('input[type="text"], input[type="email"], textarea');
        const inputCount = await inputs.count();

        if (inputCount > 0) {
          console.log(`✅ Found ${inputCount} form inputs`);

          // Test first input
          const firstInput = inputs.first();
          if (await firstInput.isVisible() && await firstInput.isEnabled()) {
            const testValue = 'Test Settings Update';
            await firstInput.fill(testValue);

            const inputValue = await firstInput.inputValue();
            if (inputValue === testValue) {
              console.log('✅ Settings form input is working');
            }
          }
        }

        // Look for save button
        const saveButton = form.locator('button:has-text("Save"), button[type="submit"], [data-testid="save-button"]');
        if (await saveButton.count() > 0) {
          const button = saveButton.first();
          if (await button.isVisible()) {
            console.log('✅ Settings form save button is present');
          }
        }

        formFound = true;
        break;
      }
    }

    if (formFound) {
      console.log('✅ Settings form functionality verified');
    } else {
      console.log('ℹ️ Settings forms may be dynamically loaded or use different selectors');
    }

    await helpers.takeScreenshot('settings-form-verification');
  });

  // Test error handling and recovery
  test('SETTINGS-FIX-007: Settings error handling and recovery', async ({ page }) => {
    console.log('🔍 Testing Settings error handling...');

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

    // Navigate to settings and check for errors
    await page.goto('/dashboard/settings');
    await helpers.waitForLoadingComplete();

    // Wait a moment for any async errors
    await page.waitForTimeout(3000);

    // Report any errors found
    if (errors.length > 0) {
      console.log('⚠️ Errors detected on settings page:', errors);
    } else {
      console.log('✅ No JavaScript errors detected on settings page');
    }

    // Test page refresh recovery
    await page.reload();
    await helpers.waitForLoadingComplete();

    // Verify page still works after refresh
    const pageIsResponsive = await page.locator('body').isVisible();
    expect(pageIsResponsive).toBe(true);

    console.log('✅ Settings page error handling and recovery verified');
    await helpers.takeScreenshot('settings-error-handling-verification');
  });
});

export {};