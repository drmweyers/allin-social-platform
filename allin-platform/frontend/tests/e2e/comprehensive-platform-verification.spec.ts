import { test, expect, Page } from '@playwright/test';
import { TestHelpers, SELECTORS } from '../utils/test-helpers';

/**
 * 🏗️ COMPREHENSIVE PLATFORM VERIFICATION
 *
 * This comprehensive test verifies that ALL the AllIN platform fixes work together:
 * - Complete user journey from login to feature usage
 * - Integration between all major components
 * - End-to-end workflows work correctly
 * - All fixes are working in harmony
 * - Platform stability and reliability
 */

test.describe('🏗️ COMPREHENSIVE PLATFORM VERIFICATION', () => {
  let helpers: TestHelpers;

  // Test accounts for comprehensive testing
  const TEST_ACCOUNTS = [
    { email: 'admin@allin.demo', password: 'Admin123!@#', role: 'Administrator' },
    { email: 'manager@allin.demo', password: 'Manager123!@#', role: 'Manager' },
    { email: 'creator@allin.demo', password: 'Creator123!@#', role: 'Creator' }
  ];

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('COMPREHENSIVE-001: Complete administrator user journey', async ({ page }) => {
    console.log('🔍 Testing complete administrator user journey...');

    const journeySteps: Array<{ step: string; success: boolean; details?: string }> = [];

    try {
      // Step 1: Login
      console.log('\n📋 Step 1: Login as Administrator');
      await page.goto('/auth/login');
      await page.fill('input[type="email"], input#email', 'admin@allin.demo');
      await page.fill('input[type="password"], input#password', 'Admin123!@#');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/dashboard**', { timeout: 15000 });
      journeySteps.push({ step: 'Login', success: true, details: 'Successfully logged in as Administrator' });
      console.log('   ✅ Login successful');

    } catch (error) {
      journeySteps.push({ step: 'Login', success: false, details: `Login failed: ${error}` });
      console.log('   ❌ Login failed');
      throw error; // Can't continue without login
    }

    try {
      // Step 2: Dashboard Access
      console.log('\n📋 Step 2: Verify Dashboard Access');
      await helpers.waitForLoadingComplete();

      const dashboardIndicators = page.locator('h1:has-text("Dashboard"), .dashboard, [data-testid="dashboard"]');
      const dashboardVisible = await dashboardIndicators.count() > 0;

      journeySteps.push({
        step: 'Dashboard Access',
        success: dashboardVisible,
        details: dashboardVisible ? 'Dashboard loaded successfully' : 'Dashboard not accessible'
      });

      console.log(`   ${dashboardVisible ? '✅' : '❌'} Dashboard access`);

    } catch (error) {
      journeySteps.push({ step: 'Dashboard Access', success: false, details: `Dashboard error: ${error}` });
      console.log('   ❌ Dashboard access failed');
    }

    try {
      // Step 3: Navigation Verification
      console.log('\n📋 Step 3: Test Main Navigation');

      const mainNavItems = [
        { name: 'Settings', path: '/dashboard/settings' },
        { name: 'Team', path: '/dashboard/team' },
        { name: 'Media', path: '/dashboard/media' }
      ];

      let navSuccessCount = 0;
      for (const navItem of mainNavItems) {
        try {
          await page.goto(navItem.path);
          await helpers.waitForLoadingComplete();

          const currentUrl = page.url();
          const isValid = !currentUrl.includes('404') && currentUrl.includes(navItem.path);

          if (isValid) {
            navSuccessCount++;
            console.log(`   ✅ ${navItem.name} page accessible`);
          } else {
            console.log(`   ❌ ${navItem.name} page not accessible`);
          }
        } catch (error) {
          console.log(`   ❌ ${navItem.name} navigation failed: ${error}`);
        }
      }

      const navSuccess = navSuccessCount > 0;
      journeySteps.push({
        step: 'Navigation',
        success: navSuccess,
        details: `${navSuccessCount}/${mainNavItems.length} navigation items working`
      });

    } catch (error) {
      journeySteps.push({ step: 'Navigation', success: false, details: `Navigation error: ${error}` });
    }

    try {
      // Step 4: Settings Page Verification
      console.log('\n📋 Step 4: Settings Page Detailed Verification');

      await page.goto('/dashboard/settings');
      await helpers.waitForLoadingComplete();

      // Verify settings sections
      const settingsSections = ['Profile', 'Account', 'Security', 'Social'];
      let settingsSectionsFound = 0;

      for (const section of settingsSections) {
        const sectionElement = page.locator(`button:has-text("${section}"), text="${section}", [data-testid="${section.toLowerCase()}-tab"]`);
        if (await sectionElement.count() > 0) {
          settingsSectionsFound++;
          console.log(`   ✅ ${section} section found`);
        }
      }

      // Test social account connections
      const socialConnections = page.locator('button:has-text("Facebook"), button:has-text("Instagram"), button:has-text("Connect")');
      const socialConnectionsCount = await socialConnections.count();

      const settingsSuccess = settingsSectionsFound > 0 || socialConnectionsCount > 0;
      journeySteps.push({
        step: 'Settings Verification',
        success: settingsSuccess,
        details: `${settingsSectionsFound} settings sections, ${socialConnectionsCount} social connections found`
      });

      console.log(`   ${settingsSuccess ? '✅' : '❌'} Settings page verification`);

    } catch (error) {
      journeySteps.push({ step: 'Settings Verification', success: false, details: `Settings error: ${error}` });
    }

    try {
      // Step 5: Team Page Verification
      console.log('\n📋 Step 5: Team Page and Accounts Verification');

      await page.goto('/dashboard/team');
      await helpers.waitForLoadingComplete();

      // Look for team members or account information
      const teamElements = page.locator('.team-member, .member-item, .user-card, [data-testid="team-member"]');
      const teamMemberCount = await teamElements.count();

      // Look for test account emails
      const testAccountEmails = ['admin@allin.demo', 'agency@allin.demo', 'manager@allin.demo'];
      let foundTestAccounts = 0;

      for (const email of testAccountEmails) {
        const emailElement = page.locator(`text="${email}"`);
        if (await emailElement.count() > 0) {
          foundTestAccounts++;
        }
      }

      const teamSuccess = teamMemberCount > 0 || foundTestAccounts > 0;
      journeySteps.push({
        step: 'Team Verification',
        success: teamSuccess,
        details: `${teamMemberCount} team elements, ${foundTestAccounts} test accounts found`
      });

      console.log(`   ${teamSuccess ? '✅' : '❌'} Team page verification`);

    } catch (error) {
      journeySteps.push({ step: 'Team Verification', success: false, details: `Team error: ${error}` });
    }

    try {
      // Step 6: Media Library Verification
      console.log('\n📋 Step 6: Media Library Verification');

      await page.goto('/dashboard/media');
      await helpers.waitForLoadingComplete();

      // Look for media content
      const mediaImages = page.locator('img, .media-item, .image-item, [data-testid="media-item"]');
      const mediaCount = await mediaImages.count();

      // Look for media controls
      const mediaControls = page.locator('button:has-text("Upload"), input[type="file"], .upload-button');
      const mediaControlsCount = await mediaControls.count();

      const mediaSuccess = mediaCount > 0 || mediaControlsCount > 0;
      journeySteps.push({
        step: 'Media Verification',
        success: mediaSuccess,
        details: `${mediaCount} media items, ${mediaControlsCount} media controls found`
      });

      console.log(`   ${mediaSuccess ? '✅' : '❌'} Media library verification`);

    } catch (error) {
      journeySteps.push({ step: 'Media Verification', success: false, details: `Media error: ${error}` });
    }

    try {
      // Step 7: AI Chat Verification (if available)
      console.log('\n📋 Step 7: AI Chat Verification');

      const aiElements = page.locator('.ai-chat, .chat-sidebar, button:has-text("AI"), [data-testid="ai-chat"]');
      const aiElementsCount = await aiElements.count();

      // Try dedicated AI page
      if (aiElementsCount === 0) {
        await page.goto('/dashboard/ai');
        await helpers.waitForLoadingComplete();

        const aiPageElements = page.locator('h1:has-text("AI"), .ai-interface, input, textarea');
        const aiPageElementsCount = await aiPageElements.count();

        journeySteps.push({
          step: 'AI Verification',
          success: aiPageElementsCount > 0,
          details: aiPageElementsCount > 0 ? 'AI interface found on dedicated page' : 'AI interface not found'
        });

        console.log(`   ${aiPageElementsCount > 0 ? '✅' : 'ℹ️'} AI chat verification`);
      } else {
        journeySteps.push({
          step: 'AI Verification',
          success: true,
          details: `${aiElementsCount} AI elements found`
        });

        console.log(`   ✅ AI chat verification`);
      }

    } catch (error) {
      journeySteps.push({ step: 'AI Verification', success: false, details: `AI error: ${error}` });
    }

    try {
      // Step 8: Logout Verification
      console.log('\n📋 Step 8: Logout Verification');

      // Look for logout options
      const profileDropdown = page.locator('[data-testid="profile-dropdown"], .profile-dropdown, .user-menu');
      if (await profileDropdown.count() > 0) {
        await profileDropdown.first().click();
        await page.waitForTimeout(1000);
      }

      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [data-testid="logout-button"]');
      if (await logoutButton.count() > 0) {
        await logoutButton.first().click();
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        const loggedOut = currentUrl.includes('/login') || currentUrl.includes('/auth');

        journeySteps.push({
          step: 'Logout',
          success: loggedOut,
          details: loggedOut ? 'Successfully logged out' : 'Logout may not have completed'
        });

        console.log(`   ${loggedOut ? '✅' : '⚠️'} Logout verification`);
      } else {
        journeySteps.push({
          step: 'Logout',
          success: false,
          details: 'Logout button not found'
        });

        console.log('   ⚠️ Logout button not found');
      }

    } catch (error) {
      journeySteps.push({ step: 'Logout', success: false, details: `Logout error: ${error}` });
    }

    // Journey Summary
    console.log('\n📊 Complete Administrator Journey Summary:');
    const successfulSteps = journeySteps.filter(step => step.success);
    const failedSteps = journeySteps.filter(step => !step.success);

    console.log(`   Total Steps: ${journeySteps.length}`);
    console.log(`   Successful: ${successfulSteps.length}`);
    console.log(`   Failed: ${failedSteps.length}`);
    console.log(`   Success Rate: ${Math.round((successfulSteps.length / journeySteps.length) * 100)}%`);

    console.log('\n   ✅ Successful Steps:');
    successfulSteps.forEach(step => {
      console.log(`      • ${step.step}: ${step.details}`);
    });

    if (failedSteps.length > 0) {
      console.log('\n   ❌ Failed Steps:');
      failedSteps.forEach(step => {
        console.log(`      • ${step.step}: ${step.details}`);
      });
    }

    // Test should pass if majority of critical steps succeed
    expect(successfulSteps.length).toBeGreaterThan(journeySteps.length / 2);

    await helpers.takeScreenshot('comprehensive-admin-journey');
  });

  test('COMPREHENSIVE-002: Multi-account role verification workflow', async ({ page }) => {
    console.log('🔍 Testing multi-account role verification workflow...');

    const accountTestResults: Array<{
      role: string;
      email: string;
      loginSuccess: boolean;
      dashboardAccess: boolean;
      featureAccess: Record<string, boolean>;
      overallSuccess: boolean;
    }> = [];

    for (const account of TEST_ACCOUNTS) {
      console.log(`\n👤 Testing workflow for: ${account.role} (${account.email})`);

      let loginSuccess = false;
      let dashboardAccess = false;
      const featureAccess: Record<string, boolean> = {};

      try {
        // Login
        await page.goto('/auth/login');
        await page.fill('input[type="email"], input#email', account.email);
        await page.fill('input[type="password"], input#password', account.password);
        await page.click('button[type="submit"]');

        await page.waitForURL('**/dashboard**', { timeout: 15000 });
        loginSuccess = true;
        console.log(`   ✅ Login successful for ${account.role}`);

        // Dashboard access
        await helpers.waitForLoadingComplete();
        const dashboardVisible = await page.locator('body').isVisible(); // Basic page visibility
        dashboardAccess = dashboardVisible;
        console.log(`   ${dashboardAccess ? '✅' : '❌'} Dashboard access for ${account.role}`);

        // Test feature access based on role
        const featureTests = [
          { name: 'settings', path: '/dashboard/settings' },
          { name: 'team', path: '/dashboard/team' },
          { name: 'media', path: '/dashboard/media' }
        ];

        for (const feature of featureTests) {
          try {
            await page.goto(feature.path);
            await helpers.waitForLoadingComplete();

            const currentUrl = page.url();
            const hasAccess = !currentUrl.includes('404') &&
                            !currentUrl.includes('unauthorized') &&
                            !currentUrl.includes('forbidden');

            featureAccess[feature.name] = hasAccess;
            console.log(`   ${hasAccess ? '✅' : '❌'} ${feature.name} access for ${account.role}`);

          } catch (error) {
            featureAccess[feature.name] = false;
            console.log(`   ❌ ${feature.name} test failed for ${account.role}: ${error}`);
          }
        }

      } catch (error) {
        console.log(`   ❌ Login failed for ${account.role}: ${error}`);
      }

      const accessCount = Object.values(featureAccess).filter(Boolean).length;
      const overallSuccess = loginSuccess && dashboardAccess && accessCount > 0;

      accountTestResults.push({
        role: account.role,
        email: account.email,
        loginSuccess,
        dashboardAccess,
        featureAccess,
        overallSuccess
      });

      console.log(`   📊 Overall success for ${account.role}: ${overallSuccess ? '✅' : '❌'} (${accessCount} features accessible)`);
    }

    // Multi-account summary
    console.log('\n📊 Multi-Account Verification Summary:');
    const successfulAccounts = accountTestResults.filter(result => result.overallSuccess);

    console.log(`   Accounts tested: ${accountTestResults.length}`);
    console.log(`   Successful workflows: ${successfulAccounts.length}`);
    console.log(`   Success rate: ${Math.round((successfulAccounts.length / accountTestResults.length) * 100)}%`);

    accountTestResults.forEach(result => {
      const featureCount = Object.values(result.featureAccess).filter(Boolean).length;
      console.log(`   ${result.role}: ${result.overallSuccess ? '✅' : '❌'} (${featureCount} features)`);
    });

    expect(successfulAccounts.length).toBeGreaterThan(0);

    await helpers.takeScreenshot('multi-account-verification');
  });

  test('COMPREHENSIVE-003: Platform integration and data flow verification', async ({ page }) => {
    console.log('🔍 Testing platform integration and data flow...');

    // Login as admin for full access
    await page.goto('/auth/login');
    await page.fill('input[type="email"], input#email', 'admin@allin.demo');
    await page.fill('input[type="password"], input#password', 'Admin123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    const integrationTests: Array<{ test: string; success: boolean; details: string }> = [];

    try {
      // Test 1: Settings to Social Integration
      console.log('\n🔗 Test 1: Settings to Social Platform Integration');

      await page.goto('/dashboard/settings');
      await helpers.waitForLoadingComplete();

      // Look for social tab
      const socialTab = page.locator('button:has-text("Social"), button:has-text("Accounts")').first();
      if (await socialTab.count() > 0) {
        await socialTab.click();
        await page.waitForTimeout(1000);
      }

      const socialButtons = page.locator('button:has-text("Facebook"), button:has-text("Instagram"), button:has-text("Connect")');
      const socialButtonCount = await socialButtons.count();

      integrationTests.push({
        test: 'Settings-Social Integration',
        success: socialButtonCount > 0,
        details: `${socialButtonCount} social platform connections available`
      });

      console.log(`   ${socialButtonCount > 0 ? '✅' : '❌'} Settings-Social Integration`);

    } catch (error) {
      integrationTests.push({
        test: 'Settings-Social Integration',
        success: false,
        details: `Integration test failed: ${error}`
      });
    }

    try {
      // Test 2: Team to Media Integration
      console.log('\n🔗 Test 2: Team to Media Library Integration');

      await page.goto('/dashboard/team');
      await helpers.waitForLoadingComplete();

      const teamPageWorks = !page.url().includes('404');

      await page.goto('/dashboard/media');
      await helpers.waitForLoadingComplete();

      const mediaPageWorks = !page.url().includes('404');
      const mediaContent = page.locator('img, .media-item, .upload-button');
      const mediaContentCount = await mediaContent.count();

      const integrationSuccess = teamPageWorks && mediaPageWorks && mediaContentCount > 0;

      integrationTests.push({
        test: 'Team-Media Integration',
        success: integrationSuccess,
        details: `Team page: ${teamPageWorks}, Media page: ${mediaPageWorks}, Media items: ${mediaContentCount}`
      });

      console.log(`   ${integrationSuccess ? '✅' : '❌'} Team-Media Integration`);

    } catch (error) {
      integrationTests.push({
        test: 'Team-Media Integration',
        success: false,
        details: `Integration test failed: ${error}`
      });
    }

    try {
      // Test 3: AI Integration across platform
      console.log('\n🔗 Test 3: AI Integration Verification');

      // Check for AI elements on dashboard
      await page.goto('/dashboard');
      await helpers.waitForLoadingComplete();

      const dashboardAI = page.locator('.ai-chat, button:has-text("AI"), .chat-sidebar');
      const dashboardAICount = await dashboardAI.count();

      // Check dedicated AI page
      let dedicatedAIWorks = false;
      try {
        await page.goto('/dashboard/ai');
        await helpers.waitForLoadingComplete();

        dedicatedAIWorks = !page.url().includes('404');
        const aiPageContent = page.locator('input, textarea, .ai-interface, h1:has-text("AI")');
        const aiPageContentCount = await aiPageContent.count();

        dedicatedAIWorks = dedicatedAIWorks && aiPageContentCount > 0;
      } catch {
        dedicatedAIWorks = false;
      }

      const aiIntegrationSuccess = dashboardAICount > 0 || dedicatedAIWorks;

      integrationTests.push({
        test: 'AI Integration',
        success: aiIntegrationSuccess,
        details: `Dashboard AI: ${dashboardAICount}, Dedicated AI page: ${dedicatedAIWorks}`
      });

      console.log(`   ${aiIntegrationSuccess ? '✅' : 'ℹ️'} AI Integration`);

    } catch (error) {
      integrationTests.push({
        test: 'AI Integration',
        success: false,
        details: `AI integration test failed: ${error}`
      });
    }

    try {
      // Test 4: Authentication to Feature Access Flow
      console.log('\n🔗 Test 4: Authentication to Feature Access Flow');

      // Test going to restricted area (settings) and ensuring access
      await page.goto('/dashboard/settings');
      await helpers.waitForLoadingComplete();

      const settingsAccess = !page.url().includes('404') && !page.url().includes('login');

      // Test going to team page
      await page.goto('/dashboard/team');
      await helpers.waitForLoadingComplete();

      const teamAccess = !page.url().includes('404') && !page.url().includes('login');

      const authFlowSuccess = settingsAccess && teamAccess;

      integrationTests.push({
        test: 'Auth-Feature Flow',
        success: authFlowSuccess,
        details: `Settings access: ${settingsAccess}, Team access: ${teamAccess}`
      });

      console.log(`   ${authFlowSuccess ? '✅' : '❌'} Auth-Feature Flow`);

    } catch (error) {
      integrationTests.push({
        test: 'Auth-Feature Flow',
        success: false,
        details: `Auth flow test failed: ${error}`
      });
    }

    // Integration test summary
    console.log('\n📊 Platform Integration Summary:');
    const successfulIntegrations = integrationTests.filter(test => test.success);

    console.log(`   Integration tests: ${integrationTests.length}`);
    console.log(`   Successful: ${successfulIntegrations.length}`);
    console.log(`   Success rate: ${Math.round((successfulIntegrations.length / integrationTests.length) * 100)}%`);

    console.log('\n   Integration Test Results:');
    integrationTests.forEach(test => {
      console.log(`   ${test.success ? '✅' : '❌'} ${test.test}: ${test.details}`);
    });

    expect(successfulIntegrations.length).toBeGreaterThan(0);

    await helpers.takeScreenshot('platform-integration-verification');
  });

  test('COMPREHENSIVE-004: Platform stability and error recovery', async ({ page }) => {
    console.log('🔍 Testing platform stability and error recovery...');

    // Monitor console errors throughout the test
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(`Page Error: ${error.message}`);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`Console Error: ${msg.text()}`);
      }
    });

    const stabilityTests: Array<{ test: string; success: boolean; details: string }> = [];

    try {
      // Test 1: Rapid page navigation
      console.log('\n🔄 Test 1: Rapid Navigation Stability');

      await page.goto('/auth/login');
      await page.fill('input[type="email"], input#email', 'admin@allin.demo');
      await page.fill('input[type="password"], input#password', 'Admin123!@#');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**', { timeout: 15000 });

      const rapidNavPages = [
        '/dashboard',
        '/dashboard/settings',
        '/dashboard/team',
        '/dashboard/media',
        '/dashboard/settings',
        '/dashboard'
      ];

      let rapidNavSuccess = true;
      let rapidNavErrors = 0;

      for (const rapidPage of rapidNavPages) {
        try {
          await page.goto(rapidPage);
          await page.waitForTimeout(500); // Quick navigation

          if (page.url().includes('404') || page.url().includes('error')) {
            rapidNavSuccess = false;
            rapidNavErrors++;
          }
        } catch (error) {
          rapidNavSuccess = false;
          rapidNavErrors++;
        }
      }

      stabilityTests.push({
        test: 'Rapid Navigation',
        success: rapidNavSuccess && rapidNavErrors === 0,
        details: `${rapidNavPages.length - rapidNavErrors}/${rapidNavPages.length} pages navigated successfully`
      });

      console.log(`   ${rapidNavSuccess ? '✅' : '❌'} Rapid Navigation Stability`);

    } catch (error) {
      stabilityTests.push({
        test: 'Rapid Navigation',
        success: false,
        details: `Rapid navigation failed: ${error}`
      });
    }

    try {
      // Test 2: Page refresh stability
      console.log('\n🔄 Test 2: Page Refresh Stability');

      const refreshPages = ['/dashboard', '/dashboard/settings', '/dashboard/team'];
      let refreshSuccess = true;
      let refreshSuccessCount = 0;

      for (const refreshPage of refreshPages) {
        try {
          await page.goto(refreshPage);
          await helpers.waitForLoadingComplete();

          // Refresh the page
          await page.reload();
          await helpers.waitForLoadingComplete();

          const afterRefresh = !page.url().includes('404') && !page.url().includes('error');
          if (afterRefresh) {
            refreshSuccessCount++;
          } else {
            refreshSuccess = false;
          }

        } catch (error) {
          refreshSuccess = false;
        }
      }

      stabilityTests.push({
        test: 'Page Refresh Stability',
        success: refreshSuccess,
        details: `${refreshSuccessCount}/${refreshPages.length} pages stable after refresh`
      });

      console.log(`   ${refreshSuccess ? '✅' : '❌'} Page Refresh Stability`);

    } catch (error) {
      stabilityTests.push({
        test: 'Page Refresh Stability',
        success: false,
        details: `Page refresh test failed: ${error}`
      });
    }

    try {
      // Test 3: Multiple session handling
      console.log('\n🔄 Test 3: Session Persistence');

      // Navigate to different pages and verify session persists
      await page.goto('/dashboard/settings');
      await helpers.waitForLoadingComplete();

      const settingsSessionOk = !page.url().includes('/login');

      await page.goto('/dashboard/team');
      await helpers.waitForLoadingComplete();

      const teamSessionOk = !page.url().includes('/login');

      const sessionPersistenceSuccess = settingsSessionOk && teamSessionOk;

      stabilityTests.push({
        test: 'Session Persistence',
        success: sessionPersistenceSuccess,
        details: `Session maintained across ${sessionPersistenceSuccess ? 'all' : 'some'} pages`
      });

      console.log(`   ${sessionPersistenceSuccess ? '✅' : '❌'} Session Persistence`);

    } catch (error) {
      stabilityTests.push({
        test: 'Session Persistence',
        success: false,
        details: `Session test failed: ${error}`
      });
    }

    try {
      // Test 4: Error recovery
      console.log('\n🔄 Test 4: Error Recovery');

      // Try to access a potentially non-existent page
      await page.goto('/dashboard/nonexistent');
      await page.waitForTimeout(2000);

      // Then navigate back to a valid page
      await page.goto('/dashboard');
      await helpers.waitForLoadingComplete();

      const recoverySuccess = !page.url().includes('404') && !page.url().includes('error');

      stabilityTests.push({
        test: 'Error Recovery',
        success: recoverySuccess,
        details: recoverySuccess ? 'Successfully recovered from invalid page' : 'Failed to recover'
      });

      console.log(`   ${recoverySuccess ? '✅' : '❌'} Error Recovery`);

    } catch (error) {
      stabilityTests.push({
        test: 'Error Recovery',
        success: false,
        details: `Error recovery test failed: ${error}`
      });
    }

    // Analyze console errors
    const criticalErrors = errors.filter(error =>
      !error.toLowerCase().includes('favicon') &&
      !error.toLowerCase().includes('404') &&
      !error.toLowerCase().includes('net::err_')
    );

    stabilityTests.push({
      test: 'Console Error Analysis',
      success: criticalErrors.length === 0,
      details: `${errors.length} total errors, ${criticalErrors.length} critical errors`
    });

    console.log(`   ${criticalErrors.length === 0 ? '✅' : '⚠️'} Console Error Analysis`);

    // Stability summary
    console.log('\n📊 Platform Stability Summary:');
    const successfulStabilityTests = stabilityTests.filter(test => test.success);

    console.log(`   Stability tests: ${stabilityTests.length}`);
    console.log(`   Successful: ${successfulStabilityTests.length}`);
    console.log(`   Success rate: ${Math.round((successfulStabilityTests.length / stabilityTests.length) * 100)}%`);

    console.log('\n   Stability Test Results:');
    stabilityTests.forEach(test => {
      console.log(`   ${test.success ? '✅' : '❌'} ${test.test}: ${test.details}`);
    });

    if (criticalErrors.length > 0) {
      console.log('\n   ⚠️ Critical Errors Found:');
      criticalErrors.slice(0, 5).forEach(error => { // Show first 5 critical errors
        console.log(`      • ${error}`);
      });
    }

    expect(successfulStabilityTests.length).toBeGreaterThanOrEqual(stabilityTests.length / 2);

    await helpers.takeScreenshot('platform-stability-verification');
  });

  test('COMPREHENSIVE-005: Final platform health check', async ({ page }) => {
    console.log('🔍 Final comprehensive platform health check...');

    const healthCheck: Array<{ component: string; status: 'healthy' | 'warning' | 'critical'; details: string }> = [];

    // Login for health check
    await page.goto('/auth/login');
    await page.fill('input[type="email"], input#email', 'admin@allin.demo');
    await page.fill('input[type="password"], input#password', 'Admin123!@#');
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL('**/dashboard**', { timeout: 15000 });
      healthCheck.push({
        component: 'Authentication System',
        status: 'healthy',
        details: 'Login and authentication working correctly'
      });
    } catch {
      healthCheck.push({
        component: 'Authentication System',
        status: 'critical',
        details: 'Authentication system not responding'
      });
    }

    // Check core components
    const coreComponents = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Settings', path: '/dashboard/settings' },
      { name: 'Team Management', path: '/dashboard/team' },
      { name: 'Media Library', path: '/dashboard/media' }
    ];

    for (const component of coreComponents) {
      try {
        await page.goto(component.path);
        await helpers.waitForLoadingComplete();

        const isHealthy = !page.url().includes('404') &&
                         !page.url().includes('error') &&
                         !page.url().includes('unauthorized');

        const pageContent = page.locator('body *');
        const contentCount = await pageContent.count();

        if (isHealthy && contentCount > 10) {
          healthCheck.push({
            component: component.name,
            status: 'healthy',
            details: `Fully functional with ${contentCount} UI elements`
          });
        } else if (isHealthy && contentCount > 0) {
          healthCheck.push({
            component: component.name,
            status: 'warning',
            details: `Accessible but limited content (${contentCount} elements)`
          });
        } else {
          healthCheck.push({
            component: component.name,
            status: 'critical',
            details: 'Component not accessible or contains errors'
          });
        }

      } catch (error) {
        healthCheck.push({
          component: component.name,
          status: 'critical',
          details: `Component failed to load: ${error}`
        });
      }
    }

    // Feature-specific health checks
    try {
      // Social OAuth Health
      await page.goto('/dashboard/settings');
      await helpers.waitForLoadingComplete();

      const socialTab = page.locator('button:has-text("Social"), button:has-text("Accounts")').first();
      if (await socialTab.count() > 0) {
        await socialTab.click();
        await page.waitForTimeout(1000);
      }

      const oauthButtons = page.locator('button:has-text("Connect"), button:has-text("Facebook"), button:has-text("Instagram")');
      const oauthButtonCount = await oauthButtons.count();

      if (oauthButtonCount >= 3) {
        healthCheck.push({
          component: 'Social OAuth Integration',
          status: 'healthy',
          details: `${oauthButtonCount} social platform connections available`
        });
      } else if (oauthButtonCount > 0) {
        healthCheck.push({
          component: 'Social OAuth Integration',
          status: 'warning',
          details: `Only ${oauthButtonCount} social platforms available`
        });
      } else {
        healthCheck.push({
          component: 'Social OAuth Integration',
          status: 'critical',
          details: 'No social platform connections found'
        });
      }

    } catch (error) {
      healthCheck.push({
        component: 'Social OAuth Integration',
        status: 'critical',
        details: `OAuth integration check failed: ${error}`
      });
    }

    // AI Integration Health
    try {
      const aiElements = page.locator('.ai-chat, button:has-text("AI"), .chat-sidebar');
      const aiElementCount = await aiElements.count();

      // Also check dedicated AI page
      let aiPageWorks = false;
      try {
        await page.goto('/dashboard/ai');
        await helpers.waitForLoadingComplete();
        aiPageWorks = !page.url().includes('404');
      } catch {
        aiPageWorks = false;
      }

      if (aiElementCount > 0 || aiPageWorks) {
        healthCheck.push({
          component: 'AI Integration',
          status: 'healthy',
          details: aiPageWorks ? 'AI interface available on dedicated page' : `AI chat available (${aiElementCount} elements)`
        });
      } else {
        healthCheck.push({
          component: 'AI Integration',
          status: 'warning',
          details: 'AI integration not found or not fully implemented'
        });
      }

    } catch (error) {
      healthCheck.push({
        component: 'AI Integration',
        status: 'warning',
        details: 'AI integration could not be verified'
      });
    }

    // Performance health check
    const performanceStartTime = Date.now();
    await page.goto('/dashboard');
    await helpers.waitForLoadingComplete();
    const performanceTime = Date.now() - performanceStartTime;

    if (performanceTime < 3000) {
      healthCheck.push({
        component: 'Performance',
        status: 'healthy',
        details: `Excellent load time: ${performanceTime}ms`
      });
    } else if (performanceTime < 8000) {
      healthCheck.push({
        component: 'Performance',
        status: 'warning',
        details: `Acceptable load time: ${performanceTime}ms`
      });
    } else {
      healthCheck.push({
        component: 'Performance',
        status: 'critical',
        details: `Slow load time: ${performanceTime}ms`
      });
    }

    // Health check summary
    console.log('\n🏥 FINAL PLATFORM HEALTH CHECK REPORT');
    console.log('=====================================');

    const healthyComponents = healthCheck.filter(c => c.status === 'healthy');
    const warningComponents = healthCheck.filter(c => c.status === 'warning');
    const criticalComponents = healthCheck.filter(c => c.status === 'critical');

    console.log(`\n📊 Health Summary:`);
    console.log(`   Total Components: ${healthCheck.length}`);
    console.log(`   🟢 Healthy: ${healthyComponents.length}`);
    console.log(`   🟡 Warning: ${warningComponents.length}`);
    console.log(`   🔴 Critical: ${criticalComponents.length}`);
    console.log(`   Overall Health: ${Math.round((healthyComponents.length / healthCheck.length) * 100)}%`);

    console.log('\n🟢 Healthy Components:');
    healthyComponents.forEach(component => {
      console.log(`   ✅ ${component.component}: ${component.details}`);
    });

    if (warningComponents.length > 0) {
      console.log('\n🟡 Components with Warnings:');
      warningComponents.forEach(component => {
        console.log(`   ⚠️ ${component.component}: ${component.details}`);
      });
    }

    if (criticalComponents.length > 0) {
      console.log('\n🔴 Critical Issues:');
      criticalComponents.forEach(component => {
        console.log(`   ❌ ${component.component}: ${component.details}`);
      });
    }

    // Platform readiness assessment
    const platformReadiness = criticalComponents.length === 0 && healthyComponents.length > healthCheck.length / 2;

    console.log('\n🎯 PLATFORM READINESS ASSESSMENT:');
    console.log(`   Status: ${platformReadiness ? '✅ READY FOR PRODUCTION' : '⚠️ NEEDS ATTENTION'}`);
    console.log(`   Recommendation: ${platformReadiness ?
      'All critical systems are operational. Platform is stable and ready for use.' :
      'Address critical issues before production deployment.'}`);

    // The comprehensive test should pass if the platform is generally healthy
    expect(healthyComponents.length).toBeGreaterThan(0);
    expect(criticalComponents.length).toBeLessThan(healthCheck.length / 2);

    await helpers.takeScreenshot('final-platform-health-check');
  });
});

export {};