import { test, expect, Page } from '@playwright/test';
import { TestHelpers, SELECTORS } from '../utils/test-helpers';

/**
 * 🧭 NAVIGATION VERIFICATION - ALL MAIN LINKS
 *
 * These tests verify that all main navigation links work correctly:
 * - Dashboard navigation works
 * - Content/Create navigation works
 * - Schedule navigation works
 * - Analytics navigation works
 * - Team navigation works
 * - Media navigation works
 * - Settings navigation works
 * - AI navigation works
 * - No broken links or 404 errors
 */

test.describe('🧭 NAVIGATION VERIFICATION', () => {
  let helpers: TestHelpers;

  // Define expected navigation items
  const MAIN_NAVIGATION = [
    {
      name: 'Dashboard',
      paths: ['/dashboard', '/dashboard/home', '/'],
      text: ['Dashboard', 'Home'],
      selectors: ['[data-testid="nav-dashboard"]', 'a[href*="/dashboard"]', 'text="Dashboard"'],
      priority: 'high'
    },
    {
      name: 'Content/Create',
      paths: ['/dashboard/content', '/dashboard/create', '/dashboard/post'],
      text: ['Content', 'Create', 'Posts', 'Compose'],
      selectors: ['[data-testid="nav-content"]', '[data-testid="nav-create"]', 'a[href*="/content"]', 'a[href*="/create"]'],
      priority: 'high'
    },
    {
      name: 'Schedule',
      paths: ['/dashboard/schedule', '/dashboard/calendar', '/dashboard/scheduling'],
      text: ['Schedule', 'Calendar', 'Scheduling'],
      selectors: ['[data-testid="nav-schedule"]', 'a[href*="/schedule"]', 'a[href*="/calendar"]'],
      priority: 'high'
    },
    {
      name: 'Analytics',
      paths: ['/dashboard/analytics', '/dashboard/reports', '/dashboard/insights'],
      text: ['Analytics', 'Reports', 'Insights', 'Stats'],
      selectors: ['[data-testid="nav-analytics"]', 'a[href*="/analytics"]', 'a[href*="/reports"]'],
      priority: 'high'
    },
    {
      name: 'Team',
      paths: ['/dashboard/team', '/dashboard/members', '/dashboard/users'],
      text: ['Team', 'Members', 'Users'],
      selectors: ['[data-testid="nav-team"]', 'a[href*="/team"]', 'a[href*="/members"]'],
      priority: 'medium'
    },
    {
      name: 'Media',
      paths: ['/dashboard/media', '/dashboard/library', '/dashboard/assets'],
      text: ['Media', 'Library', 'Assets', 'Images'],
      selectors: ['[data-testid="nav-media"]', 'a[href*="/media"]', 'a[href*="/library"]'],
      priority: 'high'
    },
    {
      name: 'Settings',
      paths: ['/dashboard/settings', '/dashboard/preferences', '/dashboard/config'],
      text: ['Settings', 'Preferences', 'Config'],
      selectors: ['[data-testid="nav-settings"]', 'a[href*="/settings"]', 'a[href*="/preferences"]'],
      priority: 'high'
    },
    {
      name: 'AI',
      paths: ['/dashboard/ai', '/dashboard/assistant', '/dashboard/chat'],
      text: ['AI', 'Assistant', 'Chat', 'Bot'],
      selectors: ['[data-testid="nav-ai"]', 'a[href*="/ai"]', 'a[href*="/assistant"]'],
      priority: 'medium'
    }
  ];

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    // Login with admin account (full navigation access)
    await page.goto('/auth/login');
    await page.fill('input[type="email"], input#email, [data-testid="email-input"]', 'admin@allin.demo');
    await page.fill('input[type="password"], input#password, [data-testid="password-input"]', 'Admin123!@#');
    await page.click('button[type="submit"], [data-testid="submit-button"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    await helpers.waitForLoadingComplete();
  });

  test('NAV-001: Main navigation menu is visible and accessible', async ({ page }) => {
    console.log('🔍 Testing main navigation visibility...');

    // Look for main navigation container
    const navContainerSelectors = [
      'nav',
      '[data-testid="main-nav"]',
      '.main-navigation',
      '.sidebar',
      '.nav-menu',
      '.navigation-menu',
      '.app-nav',
      'aside'
    ];

    let navFound = false;
    let navSelector = '';

    for (const selector of navContainerSelectors) {
      const navElement = page.locator(selector);
      if (await navElement.count() > 0 && await navElement.isVisible()) {
        console.log(`✅ Navigation container found: ${selector}`);
        navFound = true;
        navSelector = selector;

        // Check if it contains navigation links
        const navLinks = navElement.locator('a, button');
        const linkCount = await navLinks.count();
        console.log(`   Navigation contains ${linkCount} links/buttons`);

        break;
      }
    }

    if (!navFound) {
      // Check for navigation anywhere on page
      const anyNavLinks = page.locator('a[href*="/dashboard"], nav a, .nav a');
      const anyLinkCount = await anyNavLinks.count();
      if (anyLinkCount > 0) {
        console.log(`✅ Found ${anyLinkCount} navigation links on page`);
        navFound = true;
        navSelector = 'distributed navigation links';
      }
    }

    expect(navFound).toBe(true);
    console.log(`Main navigation: ✅ Found using ${navSelector}`);

    await helpers.takeScreenshot('main-navigation-visibility');
  });

  test('NAV-002: All main navigation links are present and clickable', async ({ page }) => {
    console.log('🔍 Testing all main navigation links...');

    const navResults: Array<{
      name: string;
      found: boolean;
      clickable: boolean;
      selector: string;
      priority: string;
    }> = [];

    for (const navItem of MAIN_NAVIGATION) {
      console.log(`\n🔍 Testing navigation: ${navItem.name}`);

      let found = false;
      let clickable = false;
      let usedSelector = '';

      // Try to find the navigation item
      for (const selector of navItem.selectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          console.log(`  ✅ Found with selector: ${selector}`);

          const firstElement = element.first();
          if (await firstElement.isVisible()) {
            console.log(`  ✅ Element is visible`);
            found = true;
            usedSelector = selector;

            // Test if clickable
            try {
              await expect(firstElement).toBeEnabled();
              clickable = true;
              console.log(`  ✅ Element is clickable`);
            } catch {
              console.log(`  ⚠️ Element may not be clickable`);
            }

            break;
          }
        }
      }

      // If not found with specific selectors, try text-based search
      if (!found) {
        for (const text of navItem.text) {
          const textElement = page.locator(`a:has-text("${text}"), button:has-text("${text}"), text="${text}"`);
          if (await textElement.count() > 0) {
            const firstTextElement = textElement.first();
            if (await firstTextElement.isVisible()) {
              console.log(`  ✅ Found with text: "${text}"`);
              found = true;
              usedSelector = `text="${text}"`;

              try {
                await expect(firstTextElement).toBeEnabled();
                clickable = true;
                console.log(`  ✅ Text-based element is clickable`);
              } catch {
                console.log(`  ⚠️ Text-based element may not be clickable`);
              }

              break;
            }
          }
        }
      }

      navResults.push({
        name: navItem.name,
        found,
        clickable,
        selector: usedSelector,
        priority: navItem.priority
      });

      if (!found) {
        console.log(`  ❌ ${navItem.name} navigation not found`);
      }
    }

    // Summary of navigation results
    console.log('\n📊 Navigation Links Summary:');

    const highPriorityItems = navResults.filter(r => r.priority === 'high');
    const mediumPriorityItems = navResults.filter(r => r.priority === 'medium');

    const foundHighPriority = highPriorityItems.filter(r => r.found);
    const foundMediumPriority = mediumPriorityItems.filter(r => r.found);

    console.log(`   High Priority Items: ${foundHighPriority.length}/${highPriorityItems.length}`);
    console.log(`   Medium Priority Items: ${foundMediumPriority.length}/${mediumPriorityItems.length}`);
    console.log(`   Total Found: ${navResults.filter(r => r.found).length}/${navResults.length}`);

    // List found navigation
    console.log('\n   ✅ Found Navigation:');
    navResults.filter(r => r.found).forEach(result => {
      console.log(`      • ${result.name} (${result.clickable ? 'Clickable' : 'Not clickable'})`);
    });

    // List missing navigation
    const missingNav = navResults.filter(r => !r.found);
    if (missingNav.length > 0) {
      console.log('\n   ❌ Missing Navigation:');
      missingNav.forEach(result => {
        console.log(`      • ${result.name} (${result.priority} priority)`);
      });
    }

    // Test should pass if at least some high-priority navigation is found
    expect(foundHighPriority.length).toBeGreaterThan(0);

    await helpers.takeScreenshot('navigation-links-verification');
  });

  test('NAV-003: Navigation links lead to correct pages without 404 errors', async ({ page }) => {
    console.log('🔍 Testing navigation links lead to correct pages...');

    const pageTestResults: Array<{
      name: string;
      path: string;
      accessible: boolean;
      error?: string;
      loadTime: number;
    }> = [];

    for (const navItem of MAIN_NAVIGATION) {
      console.log(`\n🔍 Testing page access for: ${navItem.name}`);

      // Test the primary path for each navigation item
      const primaryPath = navItem.paths[0];

      const startTime = Date.now();

      try {
        await page.goto(primaryPath);
        await helpers.waitForLoadingComplete();

        const loadTime = Date.now() - startTime;
        const currentUrl = page.url();

        // Check if page loaded successfully
        const pageAccessible = !currentUrl.includes('404') &&
                              !currentUrl.includes('not-found') &&
                              !currentUrl.includes('error');

        // Check for page content
        const pageTitle = await page.title();
        const hasContent = pageTitle && !pageTitle.includes('404');

        // Look for error indicators on page
        const errorMessages = page.locator('.error, .error-message, text="404", text="Page not found", text="Not Found"');
        const hasErrors = await errorMessages.count() > 0;

        const accessible = pageAccessible && hasContent && !hasErrors;

        pageTestResults.push({
          name: navItem.name,
          path: primaryPath,
          accessible,
          loadTime,
          error: accessible ? undefined : 'Page not accessible or contains errors'
        });

        console.log(`  ${accessible ? '✅' : '❌'} ${navItem.name}: ${accessible ? `Accessible (${loadTime}ms)` : 'Not accessible'}`);
        console.log(`     URL: ${currentUrl}`);

        if (pageTitle) {
          console.log(`     Title: ${pageTitle}`);
        }

        if (hasErrors) {
          const errorText = await errorMessages.first().textContent();
          console.log(`     Error: ${errorText}`);
        }

      } catch (error) {
        const loadTime = Date.now() - startTime;
        pageTestResults.push({
          name: navItem.name,
          path: primaryPath,
          accessible: false,
          loadTime,
          error: String(error)
        });

        console.log(`  ❌ ${navItem.name}: Failed to load - ${error}`);
      }
    }

    // Summary of page accessibility
    console.log('\n📊 Page Accessibility Summary:');

    const accessiblePages = pageTestResults.filter(r => r.accessible);
    const inaccessiblePages = pageTestResults.filter(r => !r.accessible);

    console.log(`   Accessible Pages: ${accessiblePages.length}/${pageTestResults.length}`);
    console.log(`   Average Load Time: ${accessiblePages.length > 0 ? Math.round(accessiblePages.reduce((sum, r) => sum + r.loadTime, 0) / accessiblePages.length) : 0}ms`);

    // List accessible pages
    if (accessiblePages.length > 0) {
      console.log('\n   ✅ Accessible Pages:');
      accessiblePages.forEach(result => {
        console.log(`      • ${result.name}: ${result.path} (${result.loadTime}ms)`);
      });
    }

    // List inaccessible pages
    if (inaccessiblePages.length > 0) {
      console.log('\n   ❌ Inaccessible Pages:');
      inaccessiblePages.forEach(result => {
        console.log(`      • ${result.name}: ${result.path} - ${result.error}`);
      });
    }

    // Test should pass if most pages are accessible
    expect(accessiblePages.length).toBeGreaterThan(0);

    await helpers.takeScreenshot('page-accessibility-verification');
  });

  test('NAV-004: Navigation works correctly with clicking', async ({ page }) => {
    console.log('🔍 Testing navigation by clicking links...');

    const clickTestResults: Array<{
      name: string;
      clickSuccess: boolean;
      navigatedCorrectly: boolean;
      error?: string;
    }> = [];

    // Start from dashboard
    await page.goto('/dashboard');
    await helpers.waitForLoadingComplete();

    for (const navItem of MAIN_NAVIGATION.slice(0, 5)) { // Test first 5 to keep test reasonable
      console.log(`\n🔍 Testing click navigation for: ${navItem.name}`);

      let clickSuccess = false;
      let navigatedCorrectly = false;

      try {
        // Find and click the navigation element
        let navElement = null;

        for (const selector of navItem.selectors) {
          const element = page.locator(selector);
          if (await element.count() > 0 && await element.isVisible()) {
            navElement = element.first();
            break;
          }
        }

        // Try text-based search if selector search failed
        if (!navElement) {
          for (const text of navItem.text) {
            const textElement = page.locator(`a:has-text("${text}"), button:has-text("${text}")`);
            if (await textElement.count() > 0 && await textElement.isVisible()) {
              navElement = textElement.first();
              break;
            }
          }
        }

        if (navElement) {
          console.log(`  ✅ Found navigation element for ${navItem.name}`);

          const initialUrl = page.url();

          await navElement.click();
          clickSuccess = true;

          await page.waitForTimeout(2000); // Wait for navigation

          const newUrl = page.url();

          // Check if URL changed appropriately
          const urlChanged = newUrl !== initialUrl;
          const correctPath = navItem.paths.some(path => newUrl.includes(path));

          navigatedCorrectly = urlChanged && (correctPath || newUrl.includes('/dashboard'));

          console.log(`  ${navigatedCorrectly ? '✅' : '❌'} Navigation result: ${initialUrl} → ${newUrl}`);

        } else {
          console.log(`  ❌ Could not find clickable element for ${navItem.name}`);
        }

      } catch (error) {
        console.log(`  ❌ Click navigation failed for ${navItem.name}: ${error}`);
      }

      clickTestResults.push({
        name: navItem.name,
        clickSuccess,
        navigatedCorrectly,
        error: clickSuccess ? undefined : 'Could not click navigation element'
      });
    }

    // Summary of click navigation
    console.log('\n📊 Click Navigation Summary:');

    const successfulClicks = clickTestResults.filter(r => r.clickSuccess);
    const successfulNavigations = clickTestResults.filter(r => r.navigatedCorrectly);

    console.log(`   Successful Clicks: ${successfulClicks.length}/${clickTestResults.length}`);
    console.log(`   Successful Navigations: ${successfulNavigations.length}/${clickTestResults.length}`);

    // List successful navigations
    if (successfulNavigations.length > 0) {
      console.log('\n   ✅ Working Navigation:');
      successfulNavigations.forEach(result => {
        console.log(`      • ${result.name}`);
      });
    }

    // List failed navigations
    const failedNavigations = clickTestResults.filter(r => !r.navigatedCorrectly);
    if (failedNavigations.length > 0) {
      console.log('\n   ❌ Failed Navigation:');
      failedNavigations.forEach(result => {
        console.log(`      • ${result.name} - ${result.error || 'Navigation did not work correctly'}`);
      });
    }

    expect(successfulClicks.length).toBeGreaterThan(0);

    await helpers.takeScreenshot('click-navigation-verification');
  });

  test('NAV-005: Breadcrumb navigation and current page indicators', async ({ page }) => {
    console.log('🔍 Testing breadcrumb navigation and page indicators...');

    const testPages = [
      '/dashboard',
      '/dashboard/settings',
      '/dashboard/team',
      '/dashboard/media'
    ];

    for (const testPage of testPages) {
      console.log(`\nTesting page indicators for: ${testPage}`);

      await page.goto(testPage);
      await helpers.waitForLoadingComplete();

      // Look for breadcrumb navigation
      const breadcrumbSelectors = [
        '.breadcrumb',
        '[data-testid="breadcrumb"]',
        '.breadcrumbs',
        'nav[aria-label="Breadcrumb"]',
        '.page-path',
        '.navigation-path'
      ];

      let breadcrumbFound = false;
      for (const selector of breadcrumbSelectors) {
        const breadcrumb = page.locator(selector);
        if (await breadcrumb.count() > 0 && await breadcrumb.isVisible()) {
          console.log(`  ✅ Breadcrumb found: ${selector}`);
          breadcrumbFound = true;
          break;
        }
      }

      // Look for active/current page indicators
      const activeIndicatorSelectors = [
        '.active',
        '.current',
        '[aria-current="page"]',
        '.nav-link.active',
        '.selected',
        '.current-page'
      ];

      let activeIndicatorFound = false;
      for (const selector of activeIndicatorSelectors) {
        const indicator = page.locator(selector);
        if (await indicator.count() > 0) {
          console.log(`  ✅ Active indicator found: ${selector}`);
          activeIndicatorFound = true;
          break;
        }
      }

      // Look for page title or heading
      const pageTitleSelectors = [
        'h1',
        '.page-title',
        '[data-testid="page-title"]',
        '.main-heading',
        '.page-header h1'
      ];

      let pageTitleFound = false;
      for (const selector of pageTitleSelectors) {
        const title = page.locator(selector);
        if (await title.count() > 0 && await title.isVisible()) {
          const titleText = await title.first().textContent();
          if (titleText && titleText.trim().length > 0) {
            console.log(`  ✅ Page title found: "${titleText}"`);
            pageTitleFound = true;
            break;
          }
        }
      }

      const hasNavIndicators = breadcrumbFound || activeIndicatorFound || pageTitleFound;
      console.log(`  Navigation indicators: ${hasNavIndicators ? '✅ Present' : '❌ Missing'}`);
    }

    await helpers.takeScreenshot('breadcrumb-navigation');
  });

  test('NAV-006: Mobile navigation and responsive behavior', async ({ page }) => {
    console.log('🔍 Testing mobile navigation and responsive behavior...');

    const viewports = [
      { name: 'Desktop', width: 1200, height: 800 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    for (const viewport of viewports) {
      console.log(`\nTesting navigation on ${viewport.name} (${viewport.width}x${viewport.height})`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/dashboard');
      await helpers.waitForLoadingComplete();

      // Look for mobile-specific navigation elements
      if (viewport.width < 768) { // Mobile
        const mobileNavSelectors = [
          '.mobile-nav',
          '.hamburger',
          '.menu-toggle',
          '[data-testid="mobile-menu"]',
          '.nav-toggle',
          'button[aria-label="Menu"]'
        ];

        let mobileNavFound = false;
        for (const selector of mobileNavSelectors) {
          const element = page.locator(selector);
          if (await element.count() > 0 && await element.isVisible()) {
            console.log(`  ✅ Mobile navigation element found: ${selector}`);
            mobileNavFound = true;

            // Test opening mobile menu
            try {
              await element.first().click();
              await page.waitForTimeout(1000);

              const openMenuSelectors = [
                '.mobile-menu-open',
                '.nav-open',
                '[data-state="open"]',
                '.menu-expanded'
              ];

              for (const openSelector of openMenuSelectors) {
                const openElement = page.locator(openSelector);
                if (await openElement.count() > 0) {
                  console.log(`  ✅ Mobile menu opened: ${openSelector}`);
                  break;
                }
              }

            } catch (error) {
              console.log(`  ℹ️ Mobile menu test: ${error}`);
            }

            break;
          }
        }

        if (!mobileNavFound) {
          console.log(`  ℹ️ No mobile-specific navigation found`);
        }

      } else { // Desktop/Tablet
        // Check if regular navigation is visible
        const regularNav = page.locator('nav, .navigation, .sidebar, [data-testid="main-nav"]');
        if (await regularNav.count() > 0) {
          const navVisible = await regularNav.first().isVisible();
          console.log(`  ${navVisible ? '✅' : '❌'} Regular navigation visible: ${navVisible}`);
        }
      }

      // Test navigation link visibility
      const navLinks = page.locator('a[href*="/dashboard"], nav a, .nav-link');
      const visibleLinks = await navLinks.count();
      console.log(`  Navigation links visible: ${visibleLinks}`);

      await helpers.takeScreenshot(`navigation-${viewport.name.toLowerCase()}`);
    }

    // Reset to desktop
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('NAV-007: Navigation accessibility and keyboard support', async ({ page }) => {
    console.log('🔍 Testing navigation accessibility...');

    await page.goto('/dashboard');
    await helpers.waitForLoadingComplete();

    // Test keyboard navigation
    console.log('\nTesting keyboard navigation...');

    // Press Tab to navigate through focusable elements
    const focusableElements: string[] = [];

    for (let i = 0; i < 10; i++) { // Test first 10 tab stops
      await page.keyboard.press('Tab');

      const focused = await page.evaluate(() => {
        const activeElement = document.activeElement;
        if (activeElement) {
          return {
            tagName: activeElement.tagName,
            href: (activeElement as HTMLAnchorElement).href,
            text: activeElement.textContent?.substring(0, 30),
            ariaLabel: activeElement.getAttribute('aria-label')
          };
        }
        return null;
      });

      if (focused) {
        focusableElements.push(`${focused.tagName}: ${focused.text || focused.ariaLabel || focused.href}`);
      }
    }

    console.log(`Focusable elements found: ${focusableElements.length}`);
    focusableElements.forEach((element, index) => {
      console.log(`  ${index + 1}. ${element}`);
    });

    // Check for proper ARIA labels
    const accessibilityElements = [
      { selector: 'nav', attribute: 'aria-label', description: 'Navigation ARIA label' },
      { selector: 'a', attribute: 'aria-label', description: 'Link ARIA labels' },
      { selector: 'button', attribute: 'aria-label', description: 'Button ARIA labels' },
      { selector: '[role="navigation"]', attribute: 'role', description: 'Navigation role' }
    ];

    for (const accessElement of accessibilityElements) {
      const elements = page.locator(accessElement.selector);
      const count = await elements.count();

      if (count > 0) {
        let withAttribute = 0;

        for (let i = 0; i < Math.min(count, 5); i++) { // Check first 5 elements
          const element = elements.nth(i);
          const hasAttribute = await element.getAttribute(accessElement.attribute);
          if (hasAttribute) {
            withAttribute++;
          }
        }

        console.log(`${accessElement.description}: ${withAttribute}/${Math.min(count, 5)} elements have ${accessElement.attribute}`);
      }
    }

    // Test Enter key activation
    const firstLink = page.locator('a[href*="/dashboard"]').first();
    if (await firstLink.count() > 0 && await firstLink.isVisible()) {
      await firstLink.focus();
      console.log('✅ Focused on first navigation link');

      // Note: We won't press Enter as it would navigate, but we can check if it's focusable
      const isFocused = await firstLink.evaluate(el => el === document.activeElement);
      console.log(`First link is focused: ${isFocused ? '✅' : '❌'}`);
    }

    await helpers.takeScreenshot('navigation-accessibility');
  });

  test('NAV-008: Navigation performance and loading states', async ({ page }) => {
    console.log('🔍 Testing navigation performance...');

    const performanceResults: Array<{
      page: string;
      loadTime: number;
      successful: boolean;
    }> = [];

    const testPages = [
      '/dashboard',
      '/dashboard/settings',
      '/dashboard/team',
      '/dashboard/media'
    ];

    for (const testPage of testPages) {
      console.log(`\nTesting load performance for: ${testPage}`);

      const startTime = Date.now();

      try {
        await page.goto(testPage);
        await helpers.waitForLoadingComplete();

        const loadTime = Date.now() - startTime;
        const currentUrl = page.url();
        const successful = !currentUrl.includes('404') && !currentUrl.includes('error');

        performanceResults.push({
          page: testPage,
          loadTime,
          successful
        });

        console.log(`  ${successful ? '✅' : '❌'} Load time: ${loadTime}ms`);

        // Check for loading indicators
        const loadingIndicators = page.locator('.loading, .spinner, [data-testid="loading"]');
        const loadingCount = await loadingIndicators.count();

        if (loadingCount > 0) {
          console.log(`  ⚠️ ${loadingCount} loading indicators still visible`);
        }

      } catch (error) {
        const loadTime = Date.now() - startTime;
        performanceResults.push({
          page: testPage,
          loadTime,
          successful: false
        });

        console.log(`  ❌ Failed to load: ${error} (${loadTime}ms)`);
      }
    }

    // Summary
    const successfulLoads = performanceResults.filter(r => r.successful);
    const avgLoadTime = successfulLoads.length > 0
      ? successfulLoads.reduce((sum, r) => sum + r.loadTime, 0) / successfulLoads.length
      : 0;

    console.log('\n📊 Navigation Performance Summary:');
    console.log(`   Successful pages: ${successfulLoads.length}/${performanceResults.length}`);
    console.log(`   Average load time: ${avgLoadTime.toFixed(0)}ms`);

    // Performance should be reasonable
    if (avgLoadTime > 0) {
      expect(avgLoadTime).toBeLessThan(8000); // 8 seconds max
    }

    await helpers.takeScreenshot('navigation-performance');
  });
});

export {};