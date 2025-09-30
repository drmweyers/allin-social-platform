import { test, expect, Page } from '@playwright/test';

const APP_URL = 'http://localhost:3001';

test.describe('Dashboard Features', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Login before each test
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[name="email"]', 'demo@allin.com');
    await page.fill('input[name="password"]', 'DemoPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
  });

  test('should display dashboard overview', async () => {
    await page.goto(`${APP_URL}/dashboard`);

    // Check dashboard elements
    await expect(page.locator('h1')).toContainText(/Dashboard/i);
    await expect(page.locator('[data-testid="metrics-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-posts"]')).toBeVisible();
    await expect(page.locator('[data-testid="platform-performance"]')).toBeVisible();
  });

  test('should navigate to accounts page', async () => {
    await page.goto(`${APP_URL}/dashboard`);

    // Click accounts link
    await page.click('a[href="/dashboard/accounts"]');

    // Check accounts page
    await expect(page).toHaveURL(/dashboard\/accounts/);
    await expect(page.locator('h1')).toContainText(/Connected Accounts/i);
  });

  test('should navigate to create post page', async () => {
    await page.goto(`${APP_URL}/dashboard`);

    // Click create post button
    await page.click('a[href="/dashboard/create"]');

    // Check create post page
    await expect(page).toHaveURL(/dashboard\/create/);
    await expect(page.locator('h1')).toContainText(/Create.*Post/i);
  });

  test('should navigate to calendar page', async () => {
    await page.goto(`${APP_URL}/dashboard`);

    // Click calendar link
    await page.click('a[href="/dashboard/calendar"]');

    // Check calendar page
    await expect(page).toHaveURL(/dashboard\/calendar/);
    await expect(page.locator('h1')).toContainText(/Calendar/i);
  });

  test('should navigate to analytics page', async () => {
    await page.goto(`${APP_URL}/dashboard`);

    // Click analytics link
    await page.click('a[href="/dashboard/analytics"]');

    // Check analytics page
    await expect(page).toHaveURL(/dashboard\/analytics/);
    await expect(page.locator('h1')).toContainText(/Analytics/i);
  });

  test('should navigate to team page', async () => {
    await page.goto(`${APP_URL}/dashboard`);

    // Click team link
    await page.click('a[href="/dashboard/team"]');

    // Check team page
    await expect(page).toHaveURL(/dashboard\/team/);
    await expect(page.locator('h1')).toContainText(/Team/i);
  });

  test('should navigate to workflow page', async () => {
    await page.goto(`${APP_URL}/dashboard`);

    // Click workflow link
    await page.click('a[href="/dashboard/workflow"]');

    // Check workflow page
    await expect(page).toHaveURL(/dashboard\/workflow/);
    await expect(page.locator('h1')).toContainText(/Workflow/i);
  });

  test('should display user profile menu', async () => {
    await page.goto(`${APP_URL}/dashboard`);

    // Click user profile button
    await page.click('[data-testid="user-menu-button"]');

    // Check menu items
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('text=Profile')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Logout')).toBeVisible();
  });

  test('should handle responsive navigation', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${APP_URL}/dashboard`);

    // Check mobile menu button
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

    // Click mobile menu button
    await page.click('[data-testid="mobile-menu-button"]');

    // Check mobile menu
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });

  test('should display notifications', async () => {
    await page.goto(`${APP_URL}/dashboard`);

    // Click notifications button
    await page.click('[data-testid="notifications-button"]');

    // Check notifications panel
    await expect(page.locator('[data-testid="notifications-panel"]')).toBeVisible();
  });
});