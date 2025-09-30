import { AuthRequest } from '../../src/middleware/auth';
import { Response, NextFunction } from 'express';

/**
 * Test utilities for creating mock objects and common test scenarios
 */

export interface MockUser {
  id: string;
  email: string;
  name: string;
  organizationId?: string;
  role?: string;
}

export interface MockSocialAccount {
  id: string;
  userId: string;
  platform: string;
  username: string;
  displayName: string;
  status: string;
}

export interface MockPost {
  id: string;
  content: string;
  userId: string;
  socialAccountId: string;
  status: string;
}

export interface MockScheduledPost {
  id: string;
  postId: string;
  socialAccountId: string;
  userId: string;
  scheduledFor: Date;
  status: string;
}

/**
 * Create a mock request object with user authentication
 */
export function createMockAuthRequest(user?: MockUser, overrides: any = {}): Partial<AuthRequest> {
  return {
    user: user || {
      id: 'user-id-123',
      email: 'test@example.com',
      name: 'Test User',
      organizationId: 'org-id-123',
      role: 'user'
    },
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    ...overrides
  };
}

/**
 * Create a mock response object
 */
export function createMockResponse(): any {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    header: jest.fn().mockReturnThis(),
    locals: {}
  };
  return res;
}

/**
 * Create a mock next function
 */
export function createMockNext(): jest.Mock<any, any> {
  return jest.fn();
}

/**
 * Create mock user data
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user-id-123',
    email: 'test@example.com',
    name: 'Test User',
    organizationId: 'org-id-123',
    role: 'user',
    ...overrides
  };
}

/**
 * Create mock social account data
 */
export function createMockSocialAccount(overrides: Partial<MockSocialAccount> = {}): MockSocialAccount {
  return {
    id: 'social-account-123',
    userId: 'user-id-123',
    platform: 'FACEBOOK',
    username: 'testuser',
    displayName: 'Test User',
    status: 'ACTIVE',
    ...overrides
  };
}

/**
 * Create mock post data
 */
export function createMockPost(overrides: Partial<MockPost> = {}): MockPost {
  return {
    id: 'post-123',
    content: 'Test post content',
    userId: 'user-id-123',
    socialAccountId: 'social-account-123',
    status: 'SCHEDULED',
    ...overrides
  };
}

/**
 * Create mock scheduled post data
 */
export function createMockScheduledPost(overrides: Partial<MockScheduledPost> = {}): MockScheduledPost {
  return {
    id: 'scheduled-post-123',
    postId: 'post-123',
    socialAccountId: 'social-account-123',
    userId: 'user-id-123',
    scheduledFor: new Date('2024-01-20T14:00:00.000Z'),
    status: 'PENDING',
    ...overrides
  };
}

/**
 * Create mock analytics data
 */
export function createMockAnalytics(overrides: any = {}) {
  return {
    engagement: 150,
    reach: 1000,
    clicks: 25,
    shares: 10,
    comments: 5,
    likes: 110,
    ...overrides
  };
}

/**
 * Create mock media data
 */
export function createMockMedia(overrides: any = {}) {
  return {
    id: 'media-123',
    url: 'https://example.com/image.jpg',
    type: 'IMAGE',
    mimeType: 'image/jpeg',
    size: 1024000,
    ...overrides
  };
}

/**
 * Create a date in the future for testing scheduled posts
 */
export function createFutureDate(daysFromNow: number = 7): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

/**
 * Create a date in the past for testing published posts
 */
export function createPastDate(daysAgo: number = 7): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Wait for a specified number of milliseconds (useful for async tests)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random string for testing
 */
export function randomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Generate a random email for testing
 */
export function randomEmail(): string {
  return `test-${randomString(8)}@example.com`;
}

/**
 * Generate a random UUID-like string for testing
 */
export function randomId(): string {
  return `${randomString(8)}-${randomString(4)}-${randomString(4)}-${randomString(4)}-${randomString(12)}`;
}

/**
 * Assert that a function throws an error with a specific message
 */
export function expectErrorMessage(fn: () => any, expectedMessage: string) {
  try {
    fn();
    throw new Error('Expected function to throw an error');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(expectedMessage);
  }
}

/**
 * Assert that an async function throws an error with a specific message
 */
export async function expectAsyncErrorMessage(fn: () => Promise<any>, expectedMessage: string) {
  try {
    await fn();
    throw new Error('Expected function to throw an error');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(expectedMessage);
  }
}

/**
 * Mock environment variables for testing
 */
export function mockEnvVars(vars: Record<string, string>): () => void {
  const originalEnv = { ...process.env };

  Object.entries(vars).forEach(([key, value]) => {
    process.env[key] = value;
  });

  return () => {
    process.env = originalEnv;
  };
}

/**
 * Create a test database URL for isolation
 */
export function createTestDatabaseUrl(testName: string): string {
  return `postgresql://test:test@localhost:5432/test_${testName.replace(/\s+/g, '_').toLowerCase()}`;
}

/**
 * Common test constants
 */
export const TEST_CONSTANTS = {
  VALID_JWT_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token',
  INVALID_JWT_TOKEN: 'invalid.jwt.token',
  EXPIRED_JWT_TOKEN: 'expired.jwt.token',
  DEFAULT_PAGINATION: {
    page: 1,
    limit: 20
  },
  SOCIAL_PLATFORMS: ['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'TIKTOK'],
  POST_STATUSES: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED'],
  SCHEDULE_STATUSES: ['PENDING', 'QUEUED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED']
} as const;

/**
 * Mock Prisma transaction wrapper
 */
export function mockPrismaTransaction<T>(mockResults: T[]): jest.Mock {
  return jest.fn().mockImplementation((operations: any[]) => {
    return Promise.resolve(mockResults);
  });
}

/**
 * Create a mock Express app for testing middleware
 */
export function createMockApp() {
  const app = {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    listen: jest.fn(),
    locals: {}
  };
  return app;
}