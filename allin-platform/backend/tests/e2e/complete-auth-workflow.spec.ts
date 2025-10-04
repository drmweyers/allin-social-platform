import { test, expect, Page, BrowserContext } from '@playwright/test';
import { MASTER_TEST_CREDENTIALS } from '../../test-data/fixtures/users';

// Authentication setup
test.describe.configure({ mode: 'serial' });

test.describe('Complete Authentication Workflow', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('User Registration Journey', () => {
    test('should complete full registration workflow', async () => {
      // Step 1: Navigate to registration page
      await page.goto('/auth/register');
      await expect(page).toHaveTitle(/Register - AllIN/);
      await expect(page.locator('[data-testid="register-form"]')).toBeVisible();

      // Step 2: Fill registration form
      const testEmail = `test.${Date.now()}@example.com`;
      await page.fill('[data-testid="email-input"]', testEmail);
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');

      // Step 3: Submit registration
      await page.click('[data-testid="register-button"]');

      // Step 4: Verify success message and redirect
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Registration successful');
      await expect(page).toHaveURL(/\/auth\/verify-email/);

      // Step 5: Verify email verification page
      await expect(page.locator('[data-testid="verification-message"]')).toContainText('check your email');
    });

    test('should validate registration form inputs', async () => {
      await page.goto('/auth/register');

      // Test invalid email
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="register-button"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');

      // Test weak password
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'weak');
      await page.click('[data-testid="register-button"]');
      await expect(page.locator('[data-testid="password-error"]')).toContainText('at least 8 characters');

      // Test password mismatch
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword123!');
      await page.click('[data-testid="register-button"]');
      await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText('match');
    });

    test('should handle duplicate email registration', async () => {
      await page.goto('/auth/register');

      // Try to register with existing email
      await page.fill('[data-testid="email-input"]', MASTER_TEST_CREDENTIALS.admin.email);
      await page.fill('[data-testid="name-input"]', 'Duplicate User');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');
      await page.click('[data-testid="register-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText('already exists');
    });
  });

  test.describe('User Login Journey', () => {
    test('should complete successful login workflow', async () => {
      // Step 1: Navigate to login page
      await page.goto('/auth/login');
      await expect(page).toHaveTitle(/Login - AllIN/);
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

      // Step 2: Fill login form with master credentials
      await page.fill('[data-testid="email-input"]', MASTER_TEST_CREDENTIALS.admin.email);
      await page.fill('[data-testid="password-input"]', MASTER_TEST_CREDENTIALS.admin.password);

      // Step 3: Submit login
      await page.click('[data-testid="login-button"]');

      // Step 4: Verify successful login and redirect
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('[data-testid="dashboard-nav"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-menu"]')).toContainText('Admin');

      // Step 5: Verify dashboard elements
      await expect(page.locator('[data-testid="dashboard-header"]')).toContainText('Dashboard');
      await expect(page.locator('[data-testid="navigation-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    });

    test('should handle login with remember me option', async () => {
      await page.goto('/auth/login');

      await page.fill('[data-testid="email-input"]', MASTER_TEST_CREDENTIALS.manager.email);
      await page.fill('[data-testid="password-input"]', MASTER_TEST_CREDENTIALS.manager.password);
      await page.check('[data-testid="remember-me-checkbox"]');
      await page.click('[data-testid="login-button"]');

      await expect(page).toHaveURL(/\/dashboard/);

      // Verify session persistence (check for long-lived cookie)
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(cookie => cookie.name === 'sessionToken');
      expect(sessionCookie?.expires).toBeGreaterThan(Date.now() / 1000 + 7 * 24 * 60 * 60); // 7+ days
    });

    test('should validate login form inputs', async () => {
      await page.goto('/auth/login');

      // Test empty fields
      await page.click('[data-testid="login-button"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('required');
      await expect(page.locator('[data-testid="password-error"]')).toContainText('required');

      // Test invalid email format
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="password-input"]', 'password');
      await page.click('[data-testid="login-button"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');
    });

    test('should handle invalid login credentials', async () => {
      await page.goto('/auth/login');

      // Test wrong password
      await page.fill('[data-testid="email-input"]', MASTER_TEST_CREDENTIALS.admin.email);
      await page.fill('[data-testid="password-input"]', 'WrongPassword123!');
      await page.click('[data-testid="login-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
      await expect(page).toHaveURL(/\/auth\/login/); // Should stay on login page

      // Test non-existent email
      await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
      await page.fill('[data-testid="password-input"]', 'Password123!');
      await page.click('[data-testid="login-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    });

    test('should handle suspended user account', async () => {
      // This test assumes there's a suspended test account or mock endpoint
      await page.goto('/auth/login');

      await page.fill('[data-testid="email-input"]', 'suspended@allin.demo');
      await page.fill('[data-testid="password-input"]', 'Suspended123!');
      await page.click('[data-testid="login-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText('account has been suspended');
    });
  });

  test.describe('Password Recovery Journey', () => {
    test('should complete password reset workflow', async () => {
      // Step 1: Navigate to forgot password page
      await page.goto('/auth/login');
      await page.click('[data-testid="forgot-password-link"]');
      await expect(page).toHaveURL(/\/auth\/forgot-password/);

      // Step 2: Submit email for password reset
      await page.fill('[data-testid="email-input"]', MASTER_TEST_CREDENTIALS.client.email);
      await page.click('[data-testid="reset-password-button"]');

      // Step 3: Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('password reset link');

      // Step 4: Simulate email link click (navigate directly to reset page with token)
      // In real implementation, this would come from email
      const resetToken = 'mock_reset_token_123';
      await page.goto(`/auth/reset-password?token=${resetToken}`);

      // Step 5: Fill new password form
      await page.fill('[data-testid="new-password-input"]', 'NewPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'NewPassword123!');
      await page.click('[data-testid="update-password-button"]');

      // Step 6: Verify success and redirect to login
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Password updated successfully');
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('should validate password reset form', async () => {
      await page.goto('/auth/forgot-password');

      // Test invalid email
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="reset-password-button"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');

      // Test empty email
      await page.fill('[data-testid="email-input"]', '');
      await page.click('[data-testid="reset-password-button"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('required');
    });

    test('should handle non-existent email gracefully', async () => {
      await page.goto('/auth/forgot-password');

      await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
      await page.click('[data-testid="reset-password-button"]');

      // Should show success message for security (don't reveal if email exists)
      await expect(page.locator('[data-testid="success-message"]')).toContainText('password reset link');
    });

    test('should validate new password requirements', async () => {
      const resetToken = 'mock_reset_token_123';
      await page.goto(`/auth/reset-password?token=${resetToken}`);

      // Test weak password
      await page.fill('[data-testid="new-password-input"]', 'weak');
      await page.fill('[data-testid="confirm-password-input"]', 'weak');
      await page.click('[data-testid="update-password-button"]');
      await expect(page.locator('[data-testid="password-error"]')).toContainText('at least 8 characters');

      // Test password mismatch
      await page.fill('[data-testid="new-password-input"]', 'StrongPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword123!');
      await page.click('[data-testid="update-password-button"]');
      await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText('match');
    });

    test('should handle invalid or expired reset tokens', async () => {
      // Test invalid token
      await page.goto('/auth/reset-password?token=invalid_token');
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid or expired token');
      await expect(page.locator('[data-testid="password-form"]')).not.toBeVisible();

      // Test expired token
      await page.goto('/auth/reset-password?token=expired_token');
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid or expired token');
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page refreshes', async () => {
      // Login first
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', MASTER_TEST_CREDENTIALS.admin.email);
      await page.fill('[data-testid="password-input"]', MASTER_TEST_CREDENTIALS.admin.password);
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL(/\/dashboard/);

      // Refresh page
      await page.reload();
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('[data-testid="dashboard-nav"]')).toBeVisible();
    });

    test('should handle session expiration', async () => {
      // Login first
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', MASTER_TEST_CREDENTIALS.admin.email);
      await page.fill('[data-testid="password-input"]', MASTER_TEST_CREDENTIALS.admin.password);
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL(/\/dashboard/);

      // Mock session expiration by clearing cookies
      await context.clearCookies();

      // Try to access protected page
      await page.goto('/dashboard/settings');
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page.locator('[data-testid="error-message"]')).toContainText('session has expired');
    });

    test('should complete logout workflow', async () => {
      // Login first
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', MASTER_TEST_CREDENTIALS.admin.email);
      await page.fill('[data-testid="password-input"]', MASTER_TEST_CREDENTIALS.admin.password);
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL(/\/dashboard/);

      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Verify logout
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page.locator('[data-testid="success-message"]')).toContainText('logged out successfully');

      // Verify session is cleared
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(cookie => cookie.name === 'sessionToken');
      expect(sessionCookie).toBeUndefined();

      // Verify can't access protected pages
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('should handle concurrent sessions properly', async () => {
      // Create second browser context to simulate different device
      const context2 = await page.context().browser()!.newContext();
      const page2 = await context2.newPage();

      // Login on first device
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', MASTER_TEST_CREDENTIALS.admin.email);
      await page.fill('[data-testid="password-input"]', MASTER_TEST_CREDENTIALS.admin.password);
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL(/\/dashboard/);

      // Login on second device with same credentials
      await page2.goto('/auth/login');
      await page2.fill('[data-testid="email-input"]', MASTER_TEST_CREDENTIALS.admin.email);
      await page2.fill('[data-testid="password-input"]', MASTER_TEST_CREDENTIALS.admin.password);
      await page2.click('[data-testid="login-button"]');
      await expect(page2).toHaveURL(/\/dashboard/);

      // Both sessions should work
      await page.goto('/dashboard/settings');
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();

      await page2.goto('/dashboard/analytics');
      await expect(page2.locator('[data-testid="analytics-page"]')).toBeVisible();

      await context2.close();
    });
  });

  test.describe('Role-Based Access Control', () => {
    test('should enforce admin access controls', async () => {
      // Login as admin
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', MASTER_TEST_CREDENTIALS.admin.email);
      await page.fill('[data-testid="password-input"]', MASTER_TEST_CREDENTIALS.admin.password);
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL(/\/dashboard/);

      // Verify admin can access admin pages
      await page.goto('/dashboard/admin');
      await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible();

      // Verify admin navigation includes admin options
      await expect(page.locator('[data-testid="admin-menu-item"]')).toBeVisible();
    });

    test('should enforce client access restrictions', async () => {
      // Login as client
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', MASTER_TEST_CREDENTIALS.client.email);
      await page.fill('[data-testid="password-input"]', MASTER_TEST_CREDENTIALS.client.password);
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL(/\/dashboard/);

      // Verify client cannot access admin pages
      await page.goto('/dashboard/admin');
      await expect(page).toHaveURL(/\/dashboard/); // Should redirect
      await expect(page.locator('[data-testid="error-message"]')).toContainText('access denied');

      // Verify client navigation excludes admin options
      await expect(page.locator('[data-testid="admin-menu-item"]')).not.toBeVisible();
    });

    test('should show role-appropriate dashboard content', async () => {
      // Test manager role
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', MASTER_TEST_CREDENTIALS.manager.email);
      await page.fill('[data-testid="password-input"]', MASTER_TEST_CREDENTIALS.manager.password);
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL(/\/dashboard/);

      // Verify manager-specific features are visible
      await expect(page.locator('[data-testid="create-content-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="schedule-posts-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="analytics-overview"]')).toBeVisible();
    });
  });

  test.describe('Security Features', () => {
    test('should implement CSRF protection', async () => {
      await page.goto('/auth/login');

      // Check for CSRF token in form
      const csrfToken = await page.locator('input[name="_token"]').getAttribute('value');
      expect(csrfToken).toBeTruthy();
      expect(csrfToken!.length).toBeGreaterThan(20);
    });

    test('should implement rate limiting on login attempts', async () => {
      await page.goto('/auth/login');

      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'wrongpassword');
        await page.click('[data-testid="login-button"]');
        await page.waitForSelector('[data-testid="error-message"]');
      }

      // Should be rate limited
      await expect(page.locator('[data-testid="error-message"]')).toContainText('too many attempts');

      // Login button should be disabled temporarily
      await expect(page.locator('[data-testid="login-button"]')).toBeDisabled();
    });

    test('should handle XSS protection', async () => {
      await page.goto('/auth/login');

      // Try to inject script in email field
      const maliciousScript = '<script>alert("xss")</script>';
      await page.fill('[data-testid="email-input"]', maliciousScript);
      await page.fill('[data-testid="password-input"]', 'password');
      await page.click('[data-testid="login-button"]');

      // Check that script wasn't executed (no alert dialog)
      const dialogs: string[] = [];
      page.on('dialog', dialog => {
        dialogs.push(dialog.message());
        dialog.accept();
      });

      await page.waitForTimeout(1000);
      expect(dialogs).toHaveLength(0);
    });

    test('should use secure headers', async () => {
      const response = await page.goto('/auth/login');

      // Check security headers
      expect(response?.headers()['x-content-type-options']).toBe('nosniff');
      expect(response?.headers()['x-frame-options']).toBe('DENY');
      expect(response?.headers()['x-xss-protection']).toBe('1; mode=block');
    });
  });

  test.describe('Accessibility and UX', () => {
    test('should be keyboard navigable', async () => {
      await page.goto('/auth/login');

      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="password-input"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="remember-me-checkbox"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="login-button"]')).toBeFocused();
    });

    test('should have proper ARIA labels', async () => {
      await page.goto('/auth/login');

      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label', /email/i);
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label', /password/i);
      await expect(page.locator('[data-testid="login-button"]')).toHaveAttribute('aria-label', /login|sign in/i);
    });

    test('should show loading states', async () => {
      await page.goto('/auth/login');

      await page.fill('[data-testid="email-input"]', MASTER_TEST_CREDENTIALS.admin.email);
      await page.fill('[data-testid="password-input"]', MASTER_TEST_CREDENTIALS.admin.password);

      // Mock slow network to see loading state
      await page.route('/api/auth/login', route => {
        setTimeout(() => route.continue(), 2000);
      });

      await page.click('[data-testid="login-button"]');

      // Check loading state
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-button"]')).toBeDisabled();
      await expect(page.locator('[data-testid="login-button"]')).toContainText(/signing in|loading/i);
    });

    test('should be responsive on mobile devices', async () => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('/auth/login');

      // Check mobile layout
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();

      // Check touch-friendly button sizes
      const loginButton = page.locator('[data-testid="login-button"]');
      const buttonBox = await loginButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44); // iOS minimum touch target
    });
  });

  test.describe('Performance Tests', () => {
    test('should load login page quickly', async () => {
      const startTime = Date.now();
      await page.goto('/auth/login');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(2000); // Should load within 2 seconds
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });

    test('should handle login request within reasonable time', async () => {
      await page.goto('/auth/login');

      await page.fill('[data-testid="email-input"]', MASTER_TEST_CREDENTIALS.admin.email);
      await page.fill('[data-testid="password-input"]', MASTER_TEST_CREDENTIALS.admin.password);

      const startTime = Date.now();
      await page.click('[data-testid="login-button"]');
      await page.waitForURL(/\/dashboard/);
      const loginTime = Date.now() - startTime;

      expect(loginTime).toBeLessThan(5000); // Login should complete within 5 seconds
    });
  });
});