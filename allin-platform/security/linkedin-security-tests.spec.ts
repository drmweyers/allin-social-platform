/**
 * LinkedIn Security Testing Suite
 * Comprehensive security validation for LinkedIn OAuth integration
 * Part of BMAD Testing Framework
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import crypto from 'crypto';

// Security test configuration
const SECURITY_CONFIG = {
  baseUrl: process.env.E2E_BASE_URL || 'http://localhost:3001',
  linkedinApiUrl: 'http://localhost:8080', // Mock server
  testTimeout: 30000,
  securityHeaders: [
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security'
  ]
};

// Test data for security scenarios
const SECURITY_TEST_DATA = {
  validUser: {
    email: 'admin@allin.demo',
    password: 'AdminPass123'
  },
  maliciousInputs: [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    'data:text/html,<script>alert("xss")</script>',
    '../../etc/passwd',
    '../../../windows/system32/drivers/etc/hosts',
    'DROP TABLE users;--',
    "'; DELETE FROM users; --",
    'UNION SELECT * FROM users--'
  ],
  invalidTokens: [
    'invalid_token_123',
    '',
    'null',
    'undefined',
    'Bearer invalid',
    crypto.randomBytes(64).toString('hex')
  ]
};

test.describe('LinkedIn Security Testing Suite', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      ignoreHTTPSErrors: false,
      recordVideo: { dir: 'security-tests-videos/' }
    });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('OAuth Security Validation', () => {
    test('should implement CSRF protection with state parameter', async () => {
      // Login to get authenticated session
      await page.goto(`${SECURITY_CONFIG.baseUrl}/auth/login`);
      await page.fill('input[name="email"]', SECURITY_TEST_DATA.validUser.email);
      await page.fill('input[name="password"]', SECURITY_TEST_DATA.validUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');

      // Initiate LinkedIn OAuth
      await page.goto(`${SECURITY_CONFIG.baseUrl}/dashboard/social-accounts`);
      
      // Intercept OAuth initiation request
      const [request] = await Promise.all([
        page.waitForRequest(request => 
          request.url().includes('/api/social/connect/linkedin')
        ),
        page.click('button[data-platform="linkedin"]')
      ]);

      // Verify CSRF state parameter is present and valid
      const response = await request.response();
      expect(response?.status()).toBe(302);
      
      const location = response?.headers()['location'];
      expect(location).toContain('state=');
      
      // Extract state parameter
      const stateMatch = location?.match(/state=([^&]+)/);
      expect(stateMatch).toBeTruthy();
      expect(stateMatch![1]).toHaveLength(32); // Should be 32-char random string
    });

    test('should reject OAuth callback without valid state parameter', async () => {
      // Attempt callback without state
      const response = await page.request.get(
        `${SECURITY_CONFIG.baseUrl}/api/social/callback/linkedin?code=test_code`
      );
      expect(response.status()).toBe(400);

      // Attempt callback with invalid state
      const invalidStateResponse = await page.request.get(
        `${SECURITY_CONFIG.baseUrl}/api/social/callback/linkedin?code=test_code&state=invalid_state`
      );
      expect(invalidStateResponse.status()).toBe(400);
    });

    test('should validate OAuth authorization code', async () => {
      // Test with various invalid authorization codes
      const invalidCodes = ['', 'invalid', '<script>', '../../etc/passwd'];
      
      for (const code of invalidCodes) {
        const response = await page.request.get(
          `${SECURITY_CONFIG.baseUrl}/api/social/callback/linkedin?code=${encodeURIComponent(code)}&state=valid_state_123`
        );
        expect(response.status()).toBeGreaterThanOrEqual(400);
      }
    });

    test('should enforce HTTPS for OAuth redirects in production', async () => {
      // Mock production environment
      await page.addInitScript(() => {
        (window as any).NODE_ENV = 'production';
      });

      const response = await page.request.post(
        `${SECURITY_CONFIG.baseUrl}/api/social/connect/linkedin`,
        {
          data: { redirect_uri: 'http://insecure.example.com/callback' }
        }
      );
      
      expect(response.status()).toBe(400);
    });
  });

  test.describe('API Security Validation', () => {
    test('should validate authentication tokens', async () => {
      for (const invalidToken of SECURITY_TEST_DATA.invalidTokens) {
        const response = await page.request.get(
          `${SECURITY_CONFIG.baseUrl}/api/social/accounts`,
          {
            headers: {
              'Authorization': `Bearer ${invalidToken}`
            }
          }
        );
        expect(response.status()).toBe(401);
      }
    });

    test('should sanitize malicious input in LinkedIn profile data', async () => {
      // Login first
      await page.goto(`${SECURITY_CONFIG.baseUrl}/auth/login`);
      await page.fill('input[name="email"]', SECURITY_TEST_DATA.validUser.email);
      await page.fill('input[name="password"]', SECURITY_TEST_DATA.validUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');

      // Test malicious inputs in profile update
      for (const maliciousInput of SECURITY_TEST_DATA.maliciousInputs) {
        const response = await page.request.post(
          `${SECURITY_CONFIG.baseUrl}/api/social/accounts/linkedin/profile`,
          {
            data: {
              displayName: maliciousInput,
              bio: maliciousInput
            }
          }
        );
        
        // Should either reject (400/422) or sanitize input
        if (response.status() === 200) {
          const responseData = await response.json();
          expect(responseData.displayName).not.toContain('<script>');
          expect(responseData.bio).not.toContain('<script>');
        } else {
          expect(response.status()).toBeGreaterThanOrEqual(400);
        }
      }
    });

    test('should enforce rate limiting on LinkedIn API endpoints', async () => {
      // Login first
      await page.goto(`${SECURITY_CONFIG.baseUrl}/auth/login`);
      await page.fill('input[name="email"]', SECURITY_TEST_DATA.validUser.email);
      await page.fill('input[name="password"]', SECURITY_TEST_DATA.validUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');

      // Make rapid requests to test rate limiting
      const requests = Array.from({ length: 100 }, (_, i) =>
        page.request.get(`${SECURITY_CONFIG.baseUrl}/api/social/accounts/linkedin/profile`)
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status() === 429);
      
      // Should have some rate-limited responses
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should protect against SQL injection in LinkedIn data', async () => {
      // Login first
      await page.goto(`${SECURITY_CONFIG.baseUrl}/auth/login`);
      await page.fill('input[name="email"]', SECURITY_TEST_DATA.validUser.email);
      await page.fill('input[name="password"]', SECURITY_TEST_DATA.validUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');

      const sqlInjectionPayloads = [
        "'; DROP TABLE social_accounts; --",
        "' UNION SELECT * FROM users --",
        "'; DELETE FROM users WHERE id=1; --",
        "' OR '1'='1"
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await page.request.get(
          `${SECURITY_CONFIG.baseUrl}/api/social/accounts?search=${encodeURIComponent(payload)}`
        );
        
        // Should not execute SQL injection
        expect(response.status()).not.toBe(500);
        
        if (response.status() === 200) {
          const data = await response.json();
          expect(data).not.toContain('ORA-'); // Oracle error
          expect(data).not.toContain('MySQL'); // MySQL error
          expect(data).not.toContain('PostgreSQL'); // PostgreSQL error
        }
      }
    });
  });

  test.describe('Security Headers Validation', () => {
    test('should include required security headers', async () => {
      const response = await page.request.get(`${SECURITY_CONFIG.baseUrl}/api/social/accounts`);
      
      for (const header of SECURITY_CONFIG.securityHeaders) {
        expect(response.headers()).toHaveProperty(header.toLowerCase());
      }
    });

    test('should set Content Security Policy correctly', async () => {
      const response = await page.request.get(`${SECURITY_CONFIG.baseUrl}`);
      const csp = response.headers()['content-security-policy'];
      
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("style-src 'self'");
    });

    test('should prevent clickjacking with X-Frame-Options', async () => {
      const response = await page.request.get(`${SECURITY_CONFIG.baseUrl}`);
      const frameOptions = response.headers()['x-frame-options'];
      
      expect(frameOptions).toMatch(/^(DENY|SAMEORIGIN)$/);
    });
  });

  test.describe('Session Security', () => {
    test('should invalidate session on logout', async () => {
      // Login
      await page.goto(`${SECURITY_CONFIG.baseUrl}/auth/login`);
      await page.fill('input[name="email"]', SECURITY_TEST_DATA.validUser.email);
      await page.fill('input[name="password"]', SECURITY_TEST_DATA.validUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');

      // Get session cookie
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('token'));
      expect(sessionCookie).toBeTruthy();

      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      await page.waitForURL('**/auth/login');

      // Verify session is invalidated
      const response = await page.request.get(
        `${SECURITY_CONFIG.baseUrl}/api/social/accounts`,
        {
          headers: {
            'Cookie': `${sessionCookie!.name}=${sessionCookie!.value}`
          }
        }
      );
      expect(response.status()).toBe(401);
    });

    test('should enforce session timeout', async () => {
      // Login
      await page.goto(`${SECURITY_CONFIG.baseUrl}/auth/login`);
      await page.fill('input[name="email"]', SECURITY_TEST_DATA.validUser.email);
      await page.fill('input[name="password"]', SECURITY_TEST_DATA.validUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');

      // Wait for session timeout (simulate by advancing time)
      await page.addInitScript(() => {
        // Mock Date to simulate passage of time
        const originalDate = Date;
        (global as any).Date = class extends originalDate {
          constructor(...args: any[]) {
            if (args.length === 0) {
              super();
              // Add 25 hours to current time
              return new originalDate(originalDate.now() + 25 * 60 * 60 * 1000);
            }
            return new originalDate(...args);
          }
        };
      });

      // Try to access protected resource
      const response = await page.request.get(`${SECURITY_CONFIG.baseUrl}/api/social/accounts`);
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Data Protection', () => {
    test('should not expose sensitive data in API responses', async () => {
      // Login
      await page.goto(`${SECURITY_CONFIG.baseUrl}/auth/login`);
      await page.fill('input[name="email"]', SECURITY_TEST_DATA.validUser.email);
      await page.fill('input[name="password"]', SECURITY_TEST_DATA.validUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');

      // Get user profile
      const response = await page.request.get(`${SECURITY_CONFIG.baseUrl}/api/user/profile`);
      const data = await response.json();

      // Should not expose sensitive fields
      expect(data).not.toHaveProperty('password');
      expect(data).not.toHaveProperty('passwordHash');
      expect(data).not.toHaveProperty('salt');
      expect(data).not.toHaveProperty('accessToken');
      expect(data).not.toHaveProperty('refreshToken');
    });

    test('should encrypt sensitive data in localStorage', async () => {
      await page.goto(`${SECURITY_CONFIG.baseUrl}/auth/login`);
      await page.fill('input[name="email"]', SECURITY_TEST_DATA.validUser.email);
      await page.fill('input[name="password"]', SECURITY_TEST_DATA.validUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');

      // Check localStorage for sensitive data
      const localStorage = await page.evaluate(() => {
        const data: Record<string, string> = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) {
            data[key] = window.localStorage.getItem(key) || '';
          }
        }
        return data;
      });

      // Verify no plain text tokens in localStorage
      for (const [key, value] of Object.entries(localStorage)) {
        expect(value).not.toMatch(/^[A-Za-z0-9-_]{20,}$/); // JWT-like pattern
        expect(value).not.toContain('Bearer');
        expect(value).not.toContain('access_token');
      }
    });
  });

  test.describe('LinkedIn-Specific Security', () => {
    test('should validate LinkedIn webhook signatures', async () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'webhook_secret';
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      // Valid signature
      const validResponse = await page.request.post(
        `${SECURITY_CONFIG.baseUrl}/api/webhooks/linkedin`,
        {
          data: payload,
          headers: {
            'X-LinkedIn-Signature': `sha256=${signature}`,
            'Content-Type': 'application/json'
          }
        }
      );
      expect(validResponse.status()).toBe(200);

      // Invalid signature
      const invalidResponse = await page.request.post(
        `${SECURITY_CONFIG.baseUrl}/api/webhooks/linkedin`,
        {
          data: payload,
          headers: {
            'X-LinkedIn-Signature': 'sha256=invalid_signature',
            'Content-Type': 'application/json'
          }
        }
      );
      expect(invalidResponse.status()).toBe(401);
    });

    test('should protect against LinkedIn API key exposure', async () => {
      // Check that API keys are not exposed in client-side code
      await page.goto(`${SECURITY_CONFIG.baseUrl}/dashboard`);
      
      const clientCode = await page.evaluate(() => {
        // Get all script content
        const scripts = Array.from(document.scripts);
        return scripts.map(script => script.innerHTML).join('\n');
      });

      expect(clientCode).not.toContain('LINKEDIN_CLIENT_ID');
      expect(clientCode).not.toContain('LINKEDIN_CLIENT_SECRET');
      expect(clientCode).not.toContain('linkedin_app_');
    });

    test('should implement proper scope validation for LinkedIn permissions', async () => {
      // Login first
      await page.goto(`${SECURITY_CONFIG.baseUrl}/auth/login`);
      await page.fill('input[name="email"]', SECURITY_TEST_DATA.validUser.email);
      await page.fill('input[name="password"]', SECURITY_TEST_DATA.validUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');

      // Test requesting excessive permissions
      const response = await page.request.post(
        `${SECURITY_CONFIG.baseUrl}/api/social/connect/linkedin`,
        {
          data: {
            scope: ['r_emailaddress', 'r_liteprofile', 'w_member_social', 'r_organization_social', 'excessive_scope']
          }
        }
      );

      // Should reject or filter invalid scopes
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.scope).not.toContain('excessive_scope');
      } else {
        expect(response.status()).toBeGreaterThanOrEqual(400);
      }
    });
  });

  test.describe('Error Handling Security', () => {
    test('should not expose stack traces in production errors', async () => {
      // Mock production environment
      await page.addInitScript(() => {
        (window as any).NODE_ENV = 'production';
      });

      // Trigger an error
      const response = await page.request.get(
        `${SECURITY_CONFIG.baseUrl}/api/social/accounts/nonexistent`
      );

      if (response.status() >= 500) {
        const errorData = await response.json();
        expect(errorData.stack).toBeUndefined();
        expect(errorData.message).not.toContain('Error:');
        expect(errorData.message).not.toContain('at ');
      }
    });

    test('should log security events for monitoring', async () => {
      // Trigger security events and verify they are logged
      // This would typically integrate with your logging system

      // Failed login attempt
      await page.goto(`${SECURITY_CONFIG.baseUrl}/auth/login`);
      await page.fill('input[name="email"]', 'attacker@evil.com');
      await page.fill('input[name="password"]', 'wrong_password');
      await page.click('button[type="submit"]');

      // Failed OAuth attempt
      await page.request.get(
        `${SECURITY_CONFIG.baseUrl}/api/social/callback/linkedin?code=malicious_code&state=invalid`
      );

      // Note: In real implementation, you would verify these events are logged
      // to your security monitoring system
    });
  });
});

// Security test utilities
export class SecurityTestUtils {
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static createMaliciousPayload(type: 'xss' | 'sql' | 'path'): string {
    const payloads = {
      xss: '<script>alert("XSS")</script>',
      sql: "'; DROP TABLE users; --",
      path: '../../../etc/passwd'
    };
    return payloads[type];
  }

  static async verifySecurityHeaders(response: any): Promise<boolean> {
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];

    return requiredHeaders.every(header => 
      response.headers().hasOwnProperty(header)
    );
  }
}