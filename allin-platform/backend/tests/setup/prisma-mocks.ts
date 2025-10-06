/**
 * Prisma Mock Configurations for BMAD Testing Framework
 * Provides type-safe Prisma mocking patterns
 */

import { PrismaClient } from '@prisma/client';
import { createMockPrisma } from '../utils/mock-factory';

/**
 * Setup Prisma mocks for a test file
 *
 * Usage:
 * ```typescript
 * import { setupPrismaMocks } from '../../setup/prisma-mocks';
 *
 * const mockPrisma = setupPrismaMocks();
 * ```
 */
export const setupPrismaMocks = () => {
  const mockPrisma = createMockPrisma();

  // Mock the database module
  jest.mock('../../src/services/database', () => ({
    prisma: mockPrisma,
    checkDatabaseConnection: jest.fn().mockResolvedValue(true),
  }));

  return mockPrisma;
};

/**
 * Configure Prisma mock responses for common queries
 */
export const configurePrismaMockResponses = (mockPrisma: jest.Mocked<PrismaClient>) => {
  // Default successful responses
  (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
  (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([]);
  (mockPrisma.user.create as jest.Mock).mockImplementation((args) =>
    Promise.resolve({ id: 'user_123', ...args.data })
  );

  (mockPrisma.socialAccount.findMany as jest.Mock).mockResolvedValue([]);
  (mockPrisma.socialAccount.findUnique as jest.Mock).mockResolvedValue(null);
  (mockPrisma.socialAccount.create as jest.Mock).mockImplementation((args) =>
    Promise.resolve({ id: 'account_123', ...args.data })
  );

  (mockPrisma.post.findMany as jest.Mock).mockResolvedValue([]);
  (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(null);
  (mockPrisma.post.create as jest.Mock).mockImplementation((args) =>
    Promise.resolve({ id: 'post_123', ...args.data })
  );

  (mockPrisma.scheduledPost.findMany as jest.Mock).mockResolvedValue([]);
  (mockPrisma.scheduledPost.findUnique as jest.Mock).mockResolvedValue(null);
  (mockPrisma.scheduledPost.create as jest.Mock).mockImplementation((args) =>
    Promise.resolve({ id: 'scheduled_123', ...args.data })
  );

  (mockPrisma.$connect as jest.Mock).mockResolvedValue(undefined);
  (mockPrisma.$disconnect as jest.Mock).mockResolvedValue(undefined);
  (mockPrisma.$transaction as jest.Mock).mockImplementation((callback) =>
    callback(mockPrisma)
  );

  return mockPrisma;
};

/**
 * Create Prisma mock with error responses
 */
export const createPrismaErrorMock = (errorMessage: string = 'Database error') => {
  const mockPrisma = createMockPrisma();
  const error = new Error(errorMessage);

  (mockPrisma.user.findMany as jest.Mock).mockRejectedValue(error);
  (mockPrisma.user.create as jest.Mock).mockRejectedValue(error);
  (mockPrisma.post.findMany as jest.Mock).mockRejectedValue(error);
  (mockPrisma.post.create as jest.Mock).mockRejectedValue(error);

  return mockPrisma;
};

/**
 * Mock Prisma transaction behavior
 */
export const mockPrismaTransaction = (
  mockPrisma: jest.Mocked<PrismaClient>,
  callback: (tx: any) => Promise<any>
) => {
  (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
    return fn(mockPrisma);
  });
};

/**
 * Verify Prisma method was called with correct arguments
 */
export const expectPrismaCall = (
  mockPrisma: jest.Mocked<PrismaClient>,
  model: keyof PrismaClient,
  method: string,
  expectedArgs?: any
) => {
  const modelMock = mockPrisma[model] as any;
  expect(modelMock[method]).toHaveBeenCalled();

  if (expectedArgs) {
    expect(modelMock[method]).toHaveBeenCalledWith(
      expect.objectContaining(expectedArgs)
    );
  }
};

/**
 * Reset all Prisma mocks
 */
export const resetPrismaMocks = (mockPrisma: jest.Mocked<PrismaClient>) => {
  Object.keys(mockPrisma).forEach((key) => {
    const model = mockPrisma[key as keyof PrismaClient] as any;
    if (model && typeof model === 'object') {
      Object.keys(model).forEach((method) => {
        if (jest.isMockFunction(model[method])) {
          (model[method] as jest.Mock).mockClear();
        }
      });
    }
  });
};

/**
 * Type-safe Prisma query result builder
 */
export class PrismaResultBuilder {
  static user(overrides: any = {}) {
    return {
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'CREATOR',
      organizationId: 'org_123',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static socialAccount(overrides: any = {}) {
    return {
      id: 'account_123',
      platform: 'INSTAGRAM',
      username: 'testuser',
      accessToken: 'mock_token',
      userId: 'user_123',
      organizationId: 'org_123',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static post(overrides: any = {}) {
    return {
      id: 'post_123',
      content: 'Test post',
      status: 'PUBLISHED',
      socialAccountId: 'account_123',
      organizationId: 'org_123',
      userId: 'user_123',
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
      ...overrides,
    };
  }

  static scheduledPost(overrides: any = {}) {
    return {
      id: 'scheduled_123',
      content: 'Scheduled post',
      scheduledFor: new Date(Date.now() + 3600000),
      socialAccountId: 'account_123',
      organizationId: 'org_123',
      userId: 'user_123',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static analytics(overrides: any = {}) {
    return {
      id: 'analytics_123',
      postId: 'post_123',
      engagement: 150,
      reach: 1000,
      impressions: 1500,
      likes: 100,
      comments: 30,
      shares: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static organization(overrides: any = {}) {
    return {
      id: 'org_123',
      name: 'Test Organization',
      plan: 'PROFESSIONAL',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }
}

/**
 * Prisma query matcher utilities
 */
export const prismaMatchers = {
  whereEquals: (field: string, value: any) => ({
    where: expect.objectContaining({
      [field]: value,
    }),
  }),

  includeRelation: (relation: string) => ({
    include: expect.objectContaining({
      [relation]: true,
    }),
  }),

  orderBy: (field: string, direction: 'asc' | 'desc') => ({
    orderBy: expect.objectContaining({
      [field]: direction,
    }),
  }),

  pagination: (skip: number, take: number) => ({
    skip,
    take,
  }),
};

/**
 * Common Prisma test scenarios
 */
export const prismaScenarios = {
  /**
   * Simulate successful database operations
   */
  success: (mockPrisma: jest.Mocked<PrismaClient>) => {
    configurePrismaMockResponses(mockPrisma);
  },

  /**
   * Simulate database connection error
   */
  connectionError: (mockPrisma: jest.Mocked<PrismaClient>) => {
    const error = new Error('Connection to database failed');
    (mockPrisma.$connect as jest.Mock).mockRejectedValue(error);
  },

  /**
   * Simulate record not found
   */
  notFound: (mockPrisma: jest.Mocked<PrismaClient>) => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.socialAccount.findUnique as jest.Mock).mockResolvedValue(null);
  },

  /**
   * Simulate unique constraint violation
   */
  uniqueConstraint: (mockPrisma: jest.Mocked<PrismaClient>) => {
    const error = new Error('Unique constraint violation');
    (error as any).code = 'P2002';
    (mockPrisma.user.create as jest.Mock).mockRejectedValue(error);
  },

  /**
   * Simulate foreign key constraint violation
   */
  foreignKeyConstraint: (mockPrisma: jest.Mocked<PrismaClient>) => {
    const error = new Error('Foreign key constraint violation');
    (error as any).code = 'P2003';
    (mockPrisma.post.create as jest.Mock).mockRejectedValue(error);
  },
};
