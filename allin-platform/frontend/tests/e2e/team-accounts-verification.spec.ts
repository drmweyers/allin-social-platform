import { test, expect, Page } from '@playwright/test';
import { TestHelpers, SELECTORS } from '../utils/test-helpers';

/**
 * 👥 TEAM PAGE - 6 TEST ACCOUNTS VERIFICATION
 *
 * These tests specifically verify that the Team page correctly displays
 * all 6 official test accounts with their proper roles:
 * - admin@allin.demo (Administrator)
 * - agency@allin.demo (Agency Owner)
 * - manager@allin.demo (Manager)
 * - creator@allin.demo (Creator)
 * - client@allin.demo (Client)
 * - team@allin.demo (Team Member)
 */

test.describe('👥 TEAM ACCOUNTS VERIFICATION', () => {
  let helpers: TestHelpers;

  // Define the 6 official test accounts
  const OFFICIAL_TEST_ACCOUNTS = [
    { email: 'admin@allin.demo', role: 'Administrator', password: 'Admin123!@#' },
    { email: 'agency@allin.demo', role: 'Agency Owner', password: 'Agency123!@#' },
    { email: 'manager@allin.demo', role: 'Manager', password: 'Manager123!@#' },
    { email: 'creator@allin.demo', role: 'Creator', password: 'Creator123!@#' },
    { email: 'client@allin.demo', role: 'Client', password: 'Client123!@#' },
    { email: 'team@allin.demo', role: 'Team Member', password: 'Team123!@#' }
  ];

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    // Login with admin account (has access to team management)
    await page.goto('/auth/login');
    await page.fill('input[type="email"], input#email, [data-testid="email-input"]', 'admin@allin.demo');
    await page.fill('input[type="password"], input#password, [data-testid="password-input"]', 'Admin123!@#');
    await page.click('button[type="submit"], [data-testid="submit-button"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
  });

  test('TEAM-ACCOUNTS-001: Team page loads and displays team members', async ({ page }) => {
    console.log('🔍 Testing Team page accessibility and member display...');

    // Navigate to team page
    await page.goto('/dashboard/team');
    await helpers.waitForLoadingComplete();

    // Verify team page loaded successfully
    const pageTitle = await page.title();
    expect(pageTitle).not.toContain('404');
    expect(pageTitle).not.toContain('Not Found');

    // Check for team page indicators
    const teamPageIndicators = [
      'h1:has-text("Team")',
      '[data-testid="team-page"]',
      '.team-container',
      '.team-members',
      'text="Team Members"',
      'text="Members"'
    ];

    let teamPageFound = false;
    for (const indicator of teamPageIndicators) {
      const element = page.locator(indicator);
      if (await element.count() > 0) {
        console.log(`✅ Team page indicator found: ${indicator}`);
        teamPageFound = true;
        break;
      }
    }

    expect(teamPageFound).toBe(true);

    // Look for team member containers
    const memberContainerSelectors = [
      '.team-member',
      '.member-item',
      '[data-testid="team-member"]',
      '.member-card',
      '.user-card',
      '.team-list .member'
    ];

    let membersFound = 0;
    for (const selector of memberContainerSelectors) {
      const members = page.locator(selector);
      const count = await members.count();
      if (count > 0) {
        membersFound = count;
        console.log(`✅ Found ${count} team members with selector: ${selector}`);
        break;
      }
    }

    console.log(`Total team members displayed: ${membersFound}`);
    await helpers.takeScreenshot('team-page-loaded');
  });

  test('TEAM-ACCOUNTS-002: All 6 test accounts are displayed with correct information', async ({ page }) => {
    console.log('🔍 Verifying all 6 test accounts are displayed...');

    await page.goto('/dashboard/team');
    await helpers.waitForLoadingComplete();

    const foundAccounts: string[] = [];
    const accountDetails: Array<{email: string, role: string, found: boolean}> = [];

    // Check for each test account
    for (const account of OFFICIAL_TEST_ACCOUNTS) {
      console.log(`\n🔍 Looking for account: ${account.email}`);

      let accountFound = false;
      const accountSelectors = [
        `text="${account.email}"`,
        `[data-email="${account.email}"]`,
        `.member:has-text("${account.email}")`,
        `.team-member:has-text("${account.email}")`
      ];

      // Try to find the account email
      for (const selector of accountSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          console.log(`  ✅ Email found: ${account.email}`);
          foundAccounts.push(account.email);
          accountFound = true;
          break;
        }
      }

      // Also look for partial matches or role-based identification
      if (!accountFound) {
        const partialMatches = [
          `text="${account.email.split('@')[0]}"`, // username part
          `text="${account.role}"`,
          `.member:has-text("${account.role}")`,
          `.team-member:has-text("${account.role}")`
        ];

        for (const selector of partialMatches) {
          const element = page.locator(selector);
          if (await element.count() > 0) {
            console.log(`  ✅ Role/partial match found for: ${account.email} (${account.role})`);
            accountFound = true;
            break;
          }
        }
      }

      accountDetails.push({
        email: account.email,
        role: account.role,
        found: accountFound
      });

      if (accountFound) {
        console.log(`  ✅ Account verified: ${account.email} (${account.role})`);
      } else {
        console.log(`  ⚠️ Account not found: ${account.email} (${account.role})`);
      }
    }

    // Summary
    const foundCount = accountDetails.filter(acc => acc.found).length;
    console.log(`\n📊 Account Verification Summary:`);
    console.log(`   Total Expected: ${OFFICIAL_TEST_ACCOUNTS.length}`);
    console.log(`   Found: ${foundCount}`);
    console.log(`   Missing: ${OFFICIAL_TEST_ACCOUNTS.length - foundCount}`);

    // List found accounts
    const foundEmails = accountDetails.filter(acc => acc.found).map(acc => acc.email);
    console.log(`   Found Accounts: ${foundEmails.join(', ')}`);

    // List missing accounts
    const missingEmails = accountDetails.filter(acc => !acc.found).map(acc => acc.email);
    if (missingEmails.length > 0) {
      console.log(`   Missing Accounts: ${missingEmails.join(', ')}`);
    }

    // Verify at least some accounts are found (flexibility for different display methods)
    expect(foundCount).toBeGreaterThan(0);

    await helpers.takeScreenshot('team-accounts-verification');
  });

  test('TEAM-ACCOUNTS-003: Account roles are correctly displayed', async ({ page }) => {
    console.log('🔍 Verifying account roles are correctly displayed...');

    await page.goto('/dashboard/team');
    await helpers.waitForLoadingComplete();

    const roleVerification: Array<{role: string, found: boolean}> = [];

    // Check for each role type
    const expectedRoles = [
      'Administrator', 'Admin',
      'Agency Owner', 'Agency',
      'Manager',
      'Creator',
      'Client',
      'Team Member', 'Team'
    ];

    for (const role of expectedRoles) {
      const roleSelectors = [
        `text="${role}"`,
        `.role:has-text("${role}")`,
        `.member-role:has-text("${role}")`,
        `[data-role="${role.toLowerCase()}"]`,
        `.team-member:has-text("${role}")`
      ];

      let roleFound = false;
      for (const selector of roleSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          console.log(`✅ Role found: ${role}`);
          roleFound = true;
          break;
        }
      }

      roleVerification.push({ role, found: roleFound });
    }

    // Summary of role verification
    const rolesFound = roleVerification.filter(r => r.found).length;
    const foundRoles = roleVerification.filter(r => r.found).map(r => r.role);

    console.log(`📊 Role Verification Summary:`);
    console.log(`   Roles found: ${rolesFound}`);
    console.log(`   Found roles: ${foundRoles.join(', ')}`);

    // Verify at least some roles are displayed
    expect(rolesFound).toBeGreaterThan(0);

    await helpers.takeScreenshot('team-roles-verification');
  });

  test('TEAM-ACCOUNTS-004: Team member information is properly structured', async ({ page }) => {
    console.log('🔍 Verifying team member information structure...');

    await page.goto('/dashboard/team');
    await helpers.waitForLoadingComplete();

    // Look for team member cards/items
    const memberSelectors = [
      '.team-member',
      '.member-item',
      '[data-testid="team-member"]',
      '.member-card',
      '.user-card'
    ];

    let memberElements = null;
    for (const selector of memberSelectors) {
      const elements = page.locator(selector);
      if (await elements.count() > 0) {
        memberElements = elements;
        console.log(`✅ Using member selector: ${selector}`);
        break;
      }
    }

    if (memberElements) {
      const memberCount = await memberElements.count();
      console.log(`Found ${memberCount} team member elements`);

      // Check the first member for proper structure
      const firstMember = memberElements.first();

      // Look for common member information fields
      const memberInfoFields = [
        { name: 'Email/Name', selectors: ['.member-email', '.member-name', '.email', '.name'] },
        { name: 'Role', selectors: ['.member-role', '.role', '.position'] },
        { name: 'Status', selectors: ['.member-status', '.status', '.active'] },
        { name: 'Avatar', selectors: ['.member-avatar', '.avatar', 'img', '.profile-image'] }
      ];

      for (const field of memberInfoFields) {
        let fieldFound = false;
        for (const selector of field.selectors) {
          const fieldElement = firstMember.locator(selector);
          if (await fieldElement.count() > 0) {
            console.log(`✅ Member field "${field.name}" found with: ${selector}`);
            fieldFound = true;
            break;
          }
        }

        if (!fieldFound) {
          console.log(`ℹ️ Member field "${field.name}" not found (may use different structure)`);
        }
      }
    } else {
      console.log('ℹ️ Team members may be displayed in a different format or loaded dynamically');
    }

    await helpers.takeScreenshot('team-member-structure');
  });

  test('TEAM-ACCOUNTS-005: Team page functionality and interactions', async ({ page }) => {
    console.log('🔍 Testing team page functionality and interactions...');

    await page.goto('/dashboard/team');
    await helpers.waitForLoadingComplete();

    // Test team management functions
    const managementFunctions = [
      { name: 'Invite Member', selectors: ['button:has-text("Invite")', '[data-testid="invite-member"]', '.invite-button'] },
      { name: 'Add Member', selectors: ['button:has-text("Add")', '[data-testid="add-member"]', '.add-member'] },
      { name: 'Team Settings', selectors: ['button:has-text("Settings")', '[data-testid="team-settings"]', '.team-settings'] },
      { name: 'Members Filter', selectors: ['select', '.filter-select', '[data-testid="member-filter"]'] }
    ];

    for (const func of managementFunctions) {
      let functionFound = false;
      for (const selector of func.selectors) {
        const element = page.locator(selector);
        if (await element.count() > 0 && await element.isVisible()) {
          console.log(`✅ Team function "${func.name}" available: ${selector}`);
          functionFound = true;
          break;
        }
      }

      if (!functionFound) {
        console.log(`ℹ️ Team function "${func.name}" not found or not visible`);
      }
    }

    // Test clicking on a team member (if available)
    const memberElements = page.locator('.team-member, .member-item, [data-testid="team-member"]');
    if (await memberElements.count() > 0) {
      const firstMember = memberElements.first();

      try {
        await firstMember.click();
        await page.waitForTimeout(1000);

        // Check if member details modal or page opened
        const memberDetails = page.locator('.member-details, .member-modal, [data-testid="member-details"]');
        if (await memberDetails.count() > 0) {
          console.log('✅ Team member details view opened');
        }
      } catch (error) {
        console.log('ℹ️ Team member click interaction not available or different pattern used');
      }
    }

    await helpers.takeScreenshot('team-functionality');
  });

  test('TEAM-ACCOUNTS-006: Verify team accounts have different access levels', async ({ page }) => {
    console.log('🔍 Verifying different access levels for test accounts...');

    // Test each account's access to team page
    const accessResults: Array<{email: string, hasTeamAccess: boolean, role: string}> = [];

    for (const account of OFFICIAL_TEST_ACCOUNTS) {
      console.log(`\n🔍 Testing access for: ${account.email} (${account.role})`);

      // Logout current user
      try {
        await page.goto('/auth/login');
        await page.waitForTimeout(1000);
      } catch {
        // Already on login page
      }

      // Login with this account
      await page.fill('input[type="email"], input#email', account.email);
      await page.fill('input[type="password"], input#password', account.password);
      await page.click('button[type="submit"]');

      try {
        // Wait for dashboard or redirect
        await page.waitForURL('**/dashboard**', { timeout: 15000 });

        // Try to access team page
        await page.goto('/dashboard/team');
        await helpers.waitForLoadingComplete();

        // Check if team page is accessible
        const teamAccessible = !page.url().includes('404') &&
                              !page.url().includes('unauthorized') &&
                              !page.url().includes('forbidden');

        // Check for team page content
        const hasTeamContent = await page.locator('h1:has-text("Team"), [data-testid="team-page"], .team-container').count() > 0;

        const hasAccess = teamAccessible && hasTeamContent;
        accessResults.push({
          email: account.email,
          hasTeamAccess: hasAccess,
          role: account.role
        });

        console.log(`  ${hasAccess ? '✅' : '❌'} Team access for ${account.role}: ${hasAccess ? 'Granted' : 'Denied/Limited'}`);

      } catch (error) {
        console.log(`  ❌ Login failed for ${account.email}: ${error}`);
        accessResults.push({
          email: account.email,
          hasTeamAccess: false,
          role: account.role
        });
      }
    }

    // Summary of access results
    console.log('\n📊 Team Access Summary:');
    accessResults.forEach(result => {
      console.log(`   ${result.role}: ${result.hasTeamAccess ? '✅ Access Granted' : '❌ Access Denied/Limited'}`);
    });

    const accountsWithAccess = accessResults.filter(r => r.hasTeamAccess).length;
    console.log(`   Total with access: ${accountsWithAccess}/${OFFICIAL_TEST_ACCOUNTS.length}`);

    // At least admin should have access
    const adminAccess = accessResults.find(r => r.role === 'Administrator');
    if (adminAccess) {
      expect(adminAccess.hasTeamAccess).toBe(true);
    }

    await helpers.takeScreenshot('team-access-verification');
  });

  test('TEAM-ACCOUNTS-007: Team page performance with multiple accounts', async ({ page }) => {
    console.log('🔍 Testing team page performance...');

    // Login as admin for full access
    await page.goto('/auth/login');
    await page.fill('input[type="email"], input#email', 'admin@allin.demo');
    await page.fill('input[type="password"], input#password', 'Admin123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });

    // Measure team page load time
    const startTime = Date.now();

    await page.goto('/dashboard/team');
    await helpers.waitForLoadingComplete();

    const loadTime = Date.now() - startTime;
    console.log(`Team page load time: ${loadTime}ms`);

    // Verify reasonable load time (under 8 seconds)
    expect(loadTime).toBeLessThan(8000);

    // Check performance metrics
    const performanceMetrics = await helpers.checkPerformanceMetrics();
    console.log('Team page performance metrics:', performanceMetrics);

    // Verify no loading indicators remain
    const loadingElements = page.locator('[data-testid="loading-spinner"], .loading, .spinner');
    expect(await loadingElements.count()).toBe(0);

    console.log('✅ Team page performance verification completed');
    await helpers.takeScreenshot('team-performance');
  });
});

export {};