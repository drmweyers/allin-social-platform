import { test, expect, Page } from '@playwright/test';

const API_URL = 'http://localhost:5000';
const APP_URL = 'http://localhost:3001';

test.describe('Authentication Flow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto(APP_URL);
  });

  test('should display login page', async () => {
    await page.goto(`${APP_URL}/login`);

    // Check page elements
    await expect(page).toHaveTitle(/AllIN.*Login/i);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display registration page', async () => {
    await page.goto(`${APP_URL}/register`);

    // Check page elements
    await expect(page).toHaveTitle(/AllIN.*Register/i);
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should register a new user', async () => {
    await page.goto(`${APP_URL}/register`);

    // Fill registration form
    const uniqueEmail = `test.${Date.now()}@allin.com`;
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or show success
    await expect(page).toHaveURL(/dashboard|verify-email|login/);
  });

  test('should login with valid credentials', async () => {
    await page.goto(`${APP_URL}/login`);

    // Use existing test credentials or create them first
    await page.fill('input[name="email"]', 'demo@allin.com');
    await page.fill('input[name="password"]', 'DemoPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should show error for invalid credentials', async () => {
    await page.goto(`${APP_URL}/login`);

    // Use invalid credentials
    await page.fill('input[name="email"]', 'invalid@allin.com');
    await page.fill('input[name="password"]', 'WrongPassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page).not.toHaveURL(/dashboard/);
  });

  test('should logout successfully', async () => {
    // First login
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[name="email"]', 'demo@allin.com');
    await page.fill('input[name="password"]', 'DemoPassword123!');
    await page.click('button[type="submit"]');

    // Navigate to dashboard
    await page.waitForURL(/dashboard/);

    // Click logout
    await page.click('button[aria-label="Logout"]');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('API Authentication', () => {
  test('should authenticate via API', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'demo@allin.com',
        password: 'DemoPassword123!'
      }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(body).toHaveProperty('user');
  });

  test('should reject invalid API credentials', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'invalid@allin.com',
        password: 'WrongPassword'
      }
    });

    expect(response.status()).toBe(401);
  });

  test('should register via API', async ({ request }) => {
    const uniqueEmail = `api.test.${Date.now()}@allin.com`;
    const response = await request.post(`${API_URL}/api/auth/register`, {
      data: {
        name: 'API Test User',
        email: uniqueEmail,
        password: 'TestPassword123!'
      }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('user');
    expect(body.user.email).toBe(uniqueEmail);
  });
});