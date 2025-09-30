// Mock modules for Jest tests
import { SocialPlatform } from './enums';

// Mock Redis constructor for Bull
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    duplicate: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      on: jest.fn(),
    })),
  }));
});

// Mock Bull queue
jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
    removeAllListeners: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
  }));
});

// Mock @prisma/client
jest.mock('@prisma/client', () => {
  const enums = require('./enums');
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $transaction: jest.fn(),
      // Add all model mocks here
      user: {
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
      // Add more as needed
    })),
    // Export all enums
    Role: enums.Role,
    PostStatus: enums.PostStatus,
    SocialPlatform: enums.SocialPlatform,
    ScheduleStatus: enums.ScheduleStatus,
    RecurringPattern: enums.RecurringPattern,
    TeamRole: enums.TeamRole,
    InboxMessageType: enums.InboxMessageType,
    InboxMessageStatus: enums.InboxMessageStatus,
    MediaType: enums.MediaType,
  };
});

// Mock OAuth services
jest.mock('../../src/services/oauth/facebook.oauth', () => ({
  FacebookOAuthService: jest.fn().mockImplementation(() => ({
    getAuthorizationUrl: jest.fn(),
    exchangeCodeForToken: jest.fn(),
    refreshAccessToken: jest.fn(),
    getUserProfile: jest.fn(),
    getPages: jest.fn(),
  })),
}));

export {};