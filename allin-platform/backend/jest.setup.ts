// Jest setup file for comprehensive testing
// This file runs before all tests

import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only-minimum-64-characters-required-by-auth';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-key-minimum-64-characters-required-for-testing';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-32-chars!!';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-key-minimum-64-characters-required-for-testing';
process.env.CSRF_SECRET = process.env.CSRF_SECRET || 'test-csrf-secret-key-32-characters-minimum-required-for-testing';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    caption: 'Test AI-generated caption',
                    hashtags: ['#test', '#ai'],
                    suggestions: ['Test suggestion'],
                  }),
                },
              },
            ],
          }),
        },
      },
    })),
  };
});

// Mock Anthropic AI
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [
            {
              text: JSON.stringify({
                response: 'Test AI response',
                suggestions: ['Test suggestion'],
              }),
            },
          ],
        }),
      },
    })),
  };
});

// Mock Redis/IORedis
jest.mock('ioredis', () => {
  const RedisMock = jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    flushall: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  }));

  return {
    __esModule: true,
    default: RedisMock,
  };
});

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    socialAccount: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    // Export enums for tests
    PostStatus: {
      DRAFT: 'DRAFT',
      SCHEDULED: 'SCHEDULED',
      PUBLISHED: 'PUBLISHED',
      FAILED: 'FAILED',
      ARCHIVED: 'ARCHIVED',
    },
    SocialPlatform: {
      FACEBOOK: 'FACEBOOK',
      TWITTER: 'TWITTER',
      INSTAGRAM: 'INSTAGRAM',
      LINKEDIN: 'LINKEDIN',
      YOUTUBE: 'YOUTUBE',
      TIKTOK: 'TIKTOK',
    },
    Role: {
      ADMIN: 'ADMIN',
      AGENCY_OWNER: 'AGENCY_OWNER',
      MANAGER: 'MANAGER',
      CREATOR: 'CREATOR',
      CLIENT: 'CLIENT',
      USER: 'USER',
    },
  };
});

// Mock Nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      accepted: ['test@example.com'],
    }),
  }),
}));

// Global test timeout
jest.setTimeout(30000);

// Console suppression for cleaner test output
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

console.log('✅ Jest setup complete with all mocks configured');
