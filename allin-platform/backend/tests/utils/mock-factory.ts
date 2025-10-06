/**
 * Centralized Mock Factory for BMAD Testing Framework
 * Provides consistent mock implementations across all test files
 */

import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import Queue from 'bull';

/**
 * Creates a comprehensive Prisma mock with all models
 */
export const createMockPrisma = () => {
  const mockPrisma = {
    // User Model
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
    },

    // Social Account Model
    socialAccount: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
    },

    // Post Model
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    },

    // Scheduled Post Model
    scheduledPost: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
    },

    // Analytics Model
    analytics: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
    },

    // Organization Model
    organization: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },

    // Posting Queue Model
    postingQueue: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },

    // Optimal Posting Time Model
    optimalPostingTime: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },

    // Recurring Post Group Model
    recurringPostGroup: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },

    // Prisma Client Methods
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn((callback) => callback(mockPrisma)),
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  } as unknown as jest.Mocked<PrismaClient>;

  return mockPrisma;
};

/**
 * Creates a comprehensive Redis mock with all common methods
 */
export const createMockRedis = () => {
  const mockRedis = {
    // String operations
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),

    // List operations
    lpush: jest.fn(),
    rpush: jest.fn(),
    lpop: jest.fn(),
    rpop: jest.fn(),
    lrange: jest.fn(),
    ltrim: jest.fn(),
    llen: jest.fn(),

    // Hash operations
    hget: jest.fn(),
    hset: jest.fn(),
    hdel: jest.fn(),
    hincrby: jest.fn(),
    hgetall: jest.fn(),
    hkeys: jest.fn(),
    hvals: jest.fn(),

    // Set operations
    sadd: jest.fn(),
    srem: jest.fn(),
    smembers: jest.fn(),
    sismember: jest.fn(),

    // Sorted set operations
    zadd: jest.fn(),
    zrem: jest.fn(),
    zrange: jest.fn(),
    zrangebyscore: jest.fn(),

    // Connection
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue('OK'),
    ping: jest.fn().mockResolvedValue('PONG'),
  } as unknown as jest.Mocked<Redis>;

  return mockRedis;
};

/**
 * Creates a Bull queue mock
 */
export const createMockQueue = (_queueName: string = 'default') => {
  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job_123' }),
    process: jest.fn(),
    getJobs: jest.fn().mockResolvedValue([]),
    getJob: jest.fn(),
    removeJobs: jest.fn(),
    clean: jest.fn(),
    close: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    empty: jest.fn(),
    getJobCounts: jest.fn().mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    }),
  } as unknown as jest.Mocked<Queue.Queue>;

  return mockQueue;
};

/**
 * Creates a mock Analytics Service
 */
export const createMockAnalyticsService = () => ({
  getAggregatedAnalytics: jest.fn(),
  detectViralContent: jest.fn().mockResolvedValue([]),
  predictContentPerformance: jest.fn(),
  analyzeSentiment: jest.fn(),
  trackROI: jest.fn(),
  getPredictiveInsights: jest.fn(),
  streamRealTimeAnalytics: jest.fn(),
  analyzeEngagementFactors: jest.fn(),
  optimizeForAlgorithm: jest.fn(),
  predictPerformance: jest.fn(),
  generateVariants: jest.fn(),
  abTestRecommendations: jest.fn(),
});

/**
 * Creates a mock Email Service
 */
export const createMockEmailService = () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
});

/**
 * Creates a mock Social Service
 */
export const createMockSocialService = () => ({
  publishPost: jest.fn(),
  validateContent: jest.fn(),
  getPlatformRequirements: jest.fn(),
  getAccountInfo: jest.fn(),
  refreshToken: jest.fn(),
});

/**
 * Convenience function to setup all mocks at once
 */
export const setupTestMocks = () => ({
  prisma: createMockPrisma(),
  redis: createMockRedis(),
  queue: createMockQueue(),
  analyticsService: createMockAnalyticsService(),
  emailService: createMockEmailService(),
  socialService: createMockSocialService(),
});

/**
 * Helper to reset all mocks
 */
export const resetAllMocks = () => {
  jest.clearAllMocks();
  jest.resetModules();
};

/**
 * Helper to create mock timestamps
 */
export const createMockTimestamps = () => ({
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
});

/**
 * Helper to create mock IDs
 */
export const createMockId = (prefix: string = 'mock') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
