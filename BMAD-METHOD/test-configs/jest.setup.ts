import { PrismaClient } from '@prisma/client';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import express from 'express';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log in tests unless debugging
  log: process.env.DEBUG_TESTS ? console.log : jest.fn(),
  debug: process.env.DEBUG_TESTS ? console.debug : jest.fn(),
  info: process.env.DEBUG_TESTS ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Database setup
let prisma: PrismaClient;
let testServer: Server;
let testPort: number;

beforeAll(async () => {
  // Initialize test database
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
      },
    },
  });

  // Connect to database
  await prisma.$connect();

  // Run database migrations for test environment
  const { execSync } = require('child_process');
  try {
    execSync('npx prisma migrate deploy', {
      cwd: 'allin-platform/backend',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST }
    });
  } catch (error) {
    console.warn('Database migration failed:', error);
  }

  // Start test server
  const app = express();
  testServer = createServer(app);

  await new Promise<void>((resolve) => {
    testServer.listen(0, 'localhost', () => {
      testPort = (testServer.address() as AddressInfo).port;
      process.env.TEST_SERVER_URL = `http://localhost:${testPort}`;
      resolve();
    });
  });
});

beforeEach(async () => {
  // Clean database before each test
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }

  // Reset all mocks
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

afterEach(async () => {
  // Clean up after each test
  jest.clearAllTimers();
  jest.useRealTimers();
});

afterAll(async () => {
  // Close database connection
  await prisma.$disconnect();

  // Close test server
  if (testServer) {
    await new Promise<void>((resolve) => {
      testServer.close(() => resolve());
    });
  }
});

// Global test utilities
global.testUtils = {
  prisma,
  testPort: () => testPort,
  testServerUrl: () => process.env.TEST_SERVER_URL,

  // Helper to create test user
  createTestUser: async (userData = {}) => {
    const defaultUser = {
      email: 'test@example.com',
      name: 'Test User',
      password: '$2b$10$testhashedpassword',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
    };

    return prisma.user.create({
      data: { ...defaultUser, ...userData }
    });
  },

  // Helper to create test organization
  createTestOrganization: async (orgData = {}) => {
    const defaultOrg = {
      name: 'Test Organization',
      slug: 'test-org',
    };

    return prisma.organization.create({
      data: { ...defaultOrg, ...orgData }
    });
  },

  // Helper to create test social account
  createTestSocialAccount: async (userId: string, accountData = {}) => {
    const defaultAccount = {
      userId,
      platform: 'FACEBOOK' as const,
      platformId: 'test123',
      username: 'testuser',
      accessToken: 'test_token',
      status: 'ACTIVE' as const,
    };

    return prisma.socialAccount.create({
      data: { ...defaultAccount, ...accountData }
    });
  },

  // Helper to create test conversation
  createTestConversation: async (userId: string, conversationData = {}) => {
    const defaultConversation = {
      userId,
      title: 'Test Conversation',
      isActive: true,
    };

    return prisma.conversation.create({
      data: { ...defaultConversation, ...conversationData }
    });
  },

  // Wait utility for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock environment variables
  mockEnv: (envVars: Record<string, string>) => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, ...envVars };
    return () => {
      process.env = originalEnv;
    };
  }
};

// Mock external services
jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'Mocked AI response' }],
        role: 'assistant'
      })
    }
  }))
}));

jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mocked OpenAI response' } }]
        })
      }
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      })
    }
  }))
}));

// Mock Redis
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  };
  return jest.fn(() => mockRedis);
});

// Mock Socket.io
jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn()
    }))
  }))
}));

// Mock file uploads
jest.mock('multer', () => ({
  __esModule: true,
  default: () => ({
    single: () => (req: any, res: any, next: any) => {
      req.file = {
        filename: 'test-file.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('fake image data')
      };
      next();
    },
    array: () => (req: any, res: any, next: any) => {
      req.files = [
        {
          filename: 'test-file1.jpg',
          originalname: 'test1.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          buffer: Buffer.from('fake image data 1')
        }
      ];
      next();
    }
  })
}));

// Increase timeout for integration tests
jest.setTimeout(30000);

// Export types for TypeScript support
declare global {
  var testUtils: {
    prisma: PrismaClient;
    testPort: () => number;
    testServerUrl: () => string;
    createTestUser: (userData?: any) => Promise<any>;
    createTestOrganization: (orgData?: any) => Promise<any>;
    createTestSocialAccount: (userId: string, accountData?: any) => Promise<any>;
    createTestConversation: (userId: string, conversationData?: any) => Promise<any>;
    wait: (ms: number) => Promise<void>;
    mockEnv: (envVars: Record<string, string>) => () => void;
  };
}