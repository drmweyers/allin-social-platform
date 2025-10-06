/**
 * Test Helper Utilities for BMAD Testing Framework
 * Common utilities and helpers used across test files
 */

import { SocialPlatform, PostStatus, Role } from '../setup/enums';

/**
 * Master Test Credentials - DO NOT CHANGE
 */
export const MASTER_TEST_CREDENTIALS = {
  admin: { email: 'admin@allin.demo', password: 'Admin123!@#' },
  agency: { email: 'agency@allin.demo', password: 'Agency123!@#' },
  manager: { email: 'manager@allin.demo', password: 'Manager123!@#' },
  creator: { email: 'creator@allin.demo', password: 'Creator123!@#' },
  client: { email: 'client@allin.demo', password: 'Client123!@#' },
  team: { email: 'team@allin.demo', password: 'Team123!@#' },
};

/**
 * Create a mock user for testing
 */
export const createMockUser = (overrides: any = {}) => ({
  id: `user_${Date.now()}`,
  email: 'test@example.com',
  name: 'Test User',
  role: Role.CREATOR,
  organizationId: 'org_123',
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create a mock social account for testing
 */
export const createMockSocialAccount = (overrides: any = {}) => ({
  id: `account_${Date.now()}`,
  platform: SocialPlatform.INSTAGRAM,
  username: 'testuser',
  accessToken: 'mock_access_token',
  refreshToken: 'mock_refresh_token',
  expiresAt: new Date(Date.now() + 3600000),
  userId: 'user_123',
  organizationId: 'org_123',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create a mock post for testing
 */
export const createMockPost = (overrides: any = {}) => ({
  id: `post_${Date.now()}`,
  content: 'Test post content #testing',
  status: PostStatus.PUBLISHED,
  platform: SocialPlatform.INSTAGRAM,
  socialAccountId: 'account_123',
  organizationId: 'org_123',
  userId: 'user_123',
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create a mock scheduled post for testing
 */
export const createMockScheduledPost = (overrides: any = {}) => ({
  id: `scheduled_${Date.now()}`,
  content: 'Scheduled post content',
  scheduledFor: new Date(Date.now() + 3600000),
  platform: SocialPlatform.FACEBOOK,
  socialAccountId: 'account_123',
  organizationId: 'org_123',
  userId: 'user_123',
  status: 'PENDING',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create mock analytics data for testing
 */
export const createMockAnalytics = (overrides: any = {}) => ({
  id: `analytics_${Date.now()}`,
  postId: 'post_123',
  engagement: 150,
  reach: 1000,
  impressions: 1500,
  likes: 100,
  comments: 30,
  shares: 20,
  saves: 10,
  clicks: 50,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create mock organization for testing
 */
export const createMockOrganization = (overrides: any = {}) => ({
  id: `org_${Date.now()}`,
  name: 'Test Organization',
  plan: 'PROFESSIONAL',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create mock engagement event for testing
 */
export const createMockEngagementEvent = (overrides: any = {}) => ({
  id: `event_${Date.now()}`,
  type: 'like' as const,
  postId: 'post_123',
  userId: 'user_123',
  platform: SocialPlatform.INSTAGRAM,
  timestamp: new Date(),
  organizationId: 'org_123',
  data: {},
  ...overrides,
});

/**
 * Create mock engagement alert for testing
 */
export const createMockEngagementAlert = (overrides: any = {}) => ({
  id: `alert_${Date.now()}`,
  type: 'spike' as const,
  severity: 'high' as const,
  title: 'Engagement Spike Detected',
  message: 'Unusual engagement activity detected',
  platform: SocialPlatform.INSTAGRAM,
  timestamp: new Date(),
  organizationId: 'org_123',
  read: false,
  data: {},
  ...overrides,
});

/**
 * Create mock JWT token for testing
 */
export const createMockJWTToken = (payload: any = {}) => {
  const defaultPayload = {
    userId: 'user_123',
    email: 'test@example.com',
    role: Role.CREATOR,
    organizationId: 'org_123',
    ...payload,
  };

  // Simple mock token (not a real JWT, just for testing)
  return `mock_jwt_${Buffer.from(JSON.stringify(defaultPayload)).toString('base64')}`;
};

/**
 * Wait for a specified time (useful for async tests)
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock date utilities
 */
export const mockDates = {
  now: () => new Date('2024-01-15T12:00:00Z'),
  yesterday: () => new Date('2024-01-14T12:00:00Z'),
  tomorrow: () => new Date('2024-01-16T12:00:00Z'),
  lastWeek: () => new Date('2024-01-08T12:00:00Z'),
  nextWeek: () => new Date('2024-01-22T12:00:00Z'),
};

/**
 * Create a date range for testing
 */
export const createDateRange = (days: number = 7) => ({
  from: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
  to: new Date(),
});

/**
 * Assert that a promise rejects with specific error
 */
export const expectToReject = async (promise: Promise<any>, expectedError?: string) => {
  try {
    await promise;
    throw new Error('Expected promise to reject, but it resolved');
  } catch (error) {
    if (expectedError && error instanceof Error) {
      expect(error.message).toContain(expectedError);
    }
    return error;
  }
};

/**
 * Mock console methods to suppress logs during tests
 */
export const suppressConsoleLogs = () => {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };

  beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
  });
};

/**
 * Create mock request/response objects for Express tests
 */
export const createMockExpressReq = (overrides: any = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides,
});

export const createMockExpressRes = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
  };
  return res;
};

export const createMockExpressNext = () => jest.fn();

/**
 * Validate test environment
 */
export const validateTestEnvironment = () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Tests should only run in test environment');
  }
};

/**
 * Clean up test data
 */
export const cleanupTestData = async (prisma: any, organizationId?: string) => {
  if (organizationId) {
    await prisma.post.deleteMany({ where: { organizationId } });
    await prisma.scheduledPost.deleteMany({ where: { organizationId } });
    await prisma.socialAccount.deleteMany({ where: { organizationId } });
  }
};

/**
 * Generate random test data
 */
export const randomString = (length: number = 10) =>
  Math.random().toString(36).substring(2, length + 2);

export const randomNumber = (min: number = 0, max: number = 100) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const randomEmail = () => `test_${randomString()}@example.com`;

export const randomPlatform = (): SocialPlatform => {
  const platforms = Object.values(SocialPlatform);
  return platforms[Math.floor(Math.random() * platforms.length)];
};

/**
 * Performance testing helper
 */
export const measurePerformance = async (fn: () => Promise<any>, threshold: number = 1000) => {
  const start = Date.now();
  await fn();
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(threshold);
  return duration;
};

/**
 * Retry helper for flaky tests
 */
export const retryTest = async (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  delay: number = 100
) => {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await wait(delay);
      }
    }
  }

  throw lastError;
};

/**
 * Snapshot testing helper
 */
export const sanitizeSnapshot = (data: any) => {
  const sanitized = JSON.parse(JSON.stringify(data));

  // Remove dynamic fields
  const removeDynamicFields = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(removeDynamicFields);
    }

    if (obj && typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (!['id', 'createdAt', 'updatedAt', 'timestamp'].includes(key)) {
          cleaned[key] = removeDynamicFields(obj[key]);
        }
      }
      return cleaned;
    }

    return obj;
  };

  return removeDynamicFields(sanitized);
};
