import { Page, expect, Locator } from '@playwright/test';

export interface TestCredentials {
  email: string;
  password: string;
}

export interface TestConfig {
  skipOnboarding: boolean;
  enableDebugMode: boolean;
  testEnvironment: boolean;
}

/**
 * Test utilities for AllIN Platform comprehensive testing
 */
export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Get test credentials from localStorage
   */
  async getTestCredentials(): Promise<Record<string, TestCredentials>> {
    return await this.page.evaluate(() => {
      const stored = localStorage.getItem('test-credentials');
      return stored ? JSON.parse(stored) : {
        admin: { email: 'admin@allin.demo', password: 'Admin123!@#' },
        user: { email: 'user@allin.demo', password: 'User123!@#' },
        editor: { email: 'editor@allin.demo', password: 'Editor123!@#' },
        viewer: { email: 'viewer@allin.demo', password: 'Viewer123!@#' }
      };
    });
  }

  /**
   * Login with specific user role
   */
  async loginAs(role: 'admin' | 'user' | 'editor' | 'viewer'): Promise<void> {
    const credentials = await this.getTestCredentials();
    const userCreds = credentials[role];

    await this.page.goto('/auth/login');
    await this.page.fill('[data-testid="email-input"]', userCreds.email);
    await this.page.fill('[data-testid="password-input"]', userCreds.password);
    await this.page.click('[data-testid="login-submit"]');

    // Wait for successful login
    await this.page.waitForURL('/dashboard', { timeout: 30000 });
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    // Click profile dropdown
    await this.page.click('[data-testid="profile-dropdown"]');
    // Click logout
    await this.page.click('[data-testid="logout-button"]');
    // Wait for redirect to login
    await this.page.waitForURL('/auth/login');
  }

  /**
   * Wait for loading states to complete
   */
  async waitForLoadingComplete(): Promise<void> {
    // Wait for any loading spinners to disappear
    await this.page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Wait for skeleton loaders to disappear
    await this.page.waitForSelector('.animate-pulse', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    });
  }

  /**
   * Check if element is visible and accessible
   */
  async checkElementAccessibility(selector: string, options?: {
    shouldHaveText?: string;
    shouldBeEnabled?: boolean;
    shouldHaveAttribute?: { name: string; value: string };
  }): Promise<void> {
    const element = this.page.locator(selector);

    // Check visibility
    await expect(element).toBeVisible();

    // Check text content if specified
    if (options?.shouldHaveText) {
      await expect(element).toContainText(options.shouldHaveText);
    }

    // Check enabled state if specified
    if (options?.shouldBeEnabled !== undefined) {
      if (options.shouldBeEnabled) {
        await expect(element).toBeEnabled();
      } else {
        await expect(element).toBeDisabled();
      }
    }

    // Check specific attribute if specified
    if (options?.shouldHaveAttribute) {
      await expect(element).toHaveAttribute(
        options.shouldHaveAttribute.name,
        options.shouldHaveAttribute.value
      );
    }
  }

  /**
   * Fill form with data and validate
   */
  async fillForm(formData: Record<string, string>, formSelector = 'form'): Promise<void> {
    const form = this.page.locator(formSelector);
    await expect(form).toBeVisible();

    for (const [fieldName, value] of Object.entries(formData)) {
      const field = form.locator(`[name="${fieldName}"], [data-testid="${fieldName}"], #${fieldName}`);
      await expect(field).toBeVisible();
      await field.fill(value);
      await expect(field).toHaveValue(value);
    }
  }

  /**
   * Click all buttons in a container and verify they're clickable
   */
  async testAllButtons(containerSelector: string): Promise<void> {
    const container = this.page.locator(containerSelector);
    const buttons = container.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        await expect(button).toBeEnabled();
        // Don't actually click to avoid side effects, just verify it's clickable
      }
    }
  }

  /**
   * Test all navigation links
   */
  async testNavigationLinks(navigationSelector: string): Promise<void> {
    const nav = this.page.locator(navigationSelector);
    const links = nav.locator('a[href]');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      if (await link.isVisible()) {
        const href = await link.getAttribute('href');
        expect(href).toBeTruthy();
        expect(href).not.toBe('#');
      }
    }
  }

  /**
   * Test responsive behavior
   */
  async testResponsiveDesign(breakpoints: Array<{ name: string; width: number; height: number }>): Promise<void> {
    for (const breakpoint of breakpoints) {
      await this.page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await this.waitForLoadingComplete();

      // Basic visibility check
      await expect(this.page.locator('body')).toBeVisible();

      // Take screenshot for visual validation
      await this.takeScreenshot(`responsive-${breakpoint.name}`);
    }
  }

  /**
   * Check for JavaScript errors
   */
  async checkForJavaScriptErrors(): Promise<string[]> {
    const errors: string[] = [];

    this.page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    return errors;
  }

  /**
   * Check performance metrics
   */
  async checkPerformanceMetrics(): Promise<any> {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });
  }

  /**
   * Upload test file
   */
  async uploadTestFile(fileInputSelector: string, fileName: string, fileContent: string): Promise<void> {
    const fileInput = this.page.locator(fileInputSelector);

    // Create a temporary file
    const buffer = Buffer.from(fileContent);
    await fileInput.setInputFiles({
      name: fileName,
      mimeType: fileName.endsWith('.jpg') ? 'image/jpeg' :
                fileName.endsWith('.png') ? 'image/png' :
                fileName.endsWith('.mp4') ? 'video/mp4' : 'text/plain',
      buffer
    });
  }

  /**
   * Wait for toast notification and verify message
   */
  async waitForToast(expectedMessage?: string): Promise<void> {
    const toast = this.page.locator('[data-testid="toast"], .toast, [role="alert"]');
    await expect(toast).toBeVisible({ timeout: 10000 });

    if (expectedMessage) {
      await expect(toast).toContainText(expectedMessage);
    }

    // Wait for toast to disappear
    await expect(toast).toBeHidden({ timeout: 10000 });
  }

  /**
   * Drag and drop functionality
   */
  async dragAndDrop(sourceSelector: string, targetSelector: string): Promise<void> {
    const source = this.page.locator(sourceSelector);
    const target = this.page.locator(targetSelector);

    await expect(source).toBeVisible();
    await expect(target).toBeVisible();

    await source.dragTo(target);
  }

  /**
   * Check all form validations
   */
  async testFormValidation(formSelector: string, validationTests: Array<{
    field: string;
    value: string;
    expectedError: string;
  }>): Promise<void> {
    const form = this.page.locator(formSelector);

    for (const test of validationTests) {
      // Clear form
      await this.page.reload();

      // Fill invalid data
      await form.locator(`[name="${test.field}"]`).fill(test.value);

      // Try to submit
      await form.locator('button[type="submit"]').click();

      // Check for error message
      const errorMessage = this.page.locator(`text="${test.expectedError}"`);
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    }
  }
}

/**
 * Common selectors used throughout tests
 */
export const SELECTORS = {
  // Navigation
  NAV_DASHBOARD: '[data-testid="nav-dashboard"]',
  NAV_ACCOUNTS: '[data-testid="nav-accounts"]',
  NAV_CREATE: '[data-testid="nav-create"]',
  NAV_SCHEDULE: '[data-testid="nav-schedule"]',
  NAV_ANALYTICS: '[data-testid="nav-analytics"]',
  NAV_AI: '[data-testid="nav-ai"]',
  NAV_TEAM: '[data-testid="nav-team"]',
  NAV_SETTINGS: '[data-testid="nav-settings"]',

  // Common UI elements
  LOADING_SPINNER: '[data-testid="loading-spinner"]',
  PROFILE_DROPDOWN: '[data-testid="profile-dropdown"]',
  LOGOUT_BUTTON: '[data-testid="logout-button"]',

  // Forms
  EMAIL_INPUT: '[data-testid="email-input"]',
  PASSWORD_INPUT: '[data-testid="password-input"]',
  SUBMIT_BUTTON: '[data-testid="submit-button"]',

  // Buttons
  CREATE_POST_BUTTON: '[data-testid="create-post-button"]',
  SCHEDULE_POST_BUTTON: '[data-testid="schedule-post-button"]',
  PUBLISH_POST_BUTTON: '[data-testid="publish-post-button"]',

  // Social platforms
  FACEBOOK_CONNECT: '[data-testid="facebook-connect"]',
  INSTAGRAM_CONNECT: '[data-testid="instagram-connect"]',
  TWITTER_CONNECT: '[data-testid="twitter-connect"]',
  LINKEDIN_CONNECT: '[data-testid="linkedin-connect"]',
  TIKTOK_CONNECT: '[data-testid="tiktok-connect"]',
  YOUTUBE_CONNECT: '[data-testid="youtube-connect"]',
};