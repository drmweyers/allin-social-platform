import { PrismaClient } from '@prisma/client';
import { checkDatabaseConnection } from '../../../src/services/database';
import { logger } from '../../../src/utils/logger';

// Mock PrismaClient
jest.mock('@prisma/client');
jest.mock('../../../src/utils/logger');

const MockedPrismaClient = PrismaClient as jest.MockedClass<typeof PrismaClient>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('Database Service', () => {
  let mockPrismaInstance: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock Prisma instance with proper jest.Mock typing
    mockPrismaInstance = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $transaction: jest.fn(),
      $queryRaw: jest.fn(),
      user: {
        findMany: jest.fn() as jest.Mock,
        findUnique: jest.fn() as jest.Mock,
        findFirst: jest.fn() as jest.Mock,
        create: jest.fn() as jest.Mock,
        update: jest.fn() as jest.Mock,
        delete: jest.fn() as jest.Mock,
        count: jest.fn() as jest.Mock,
      },
      socialAccount: {
        findMany: jest.fn() as jest.Mock,
        findUnique: jest.fn() as jest.Mock,
        findFirst: jest.fn() as jest.Mock,
        create: jest.fn() as jest.Mock,
        update: jest.fn() as jest.Mock,
        delete: jest.fn() as jest.Mock,
        count: jest.fn() as jest.Mock,
      },
      post: {
        findMany: jest.fn() as jest.Mock,
        findUnique: jest.fn() as jest.Mock,
        findFirst: jest.fn() as jest.Mock,
        create: jest.fn() as jest.Mock,
        update: jest.fn() as jest.Mock,
        delete: jest.fn() as jest.Mock,
        count: jest.fn() as jest.Mock,
      },
      draft: {
        findMany: jest.fn() as jest.Mock,
        findUnique: jest.fn() as jest.Mock,
        findFirst: jest.fn() as jest.Mock,
        create: jest.fn() as jest.Mock,
        update: jest.fn() as jest.Mock,
        delete: jest.fn() as jest.Mock,
        count: jest.fn() as jest.Mock,
      },
      scheduledPost: {
        findMany: jest.fn() as jest.Mock,
        findUnique: jest.fn() as jest.Mock,
        findFirst: jest.fn() as jest.Mock,
        create: jest.fn() as jest.Mock,
        update: jest.fn() as jest.Mock,
        delete: jest.fn() as jest.Mock,
        count: jest.fn() as jest.Mock,
      },
    } as any;

    // Mock the PrismaClient constructor
    MockedPrismaClient.mockImplementation(() => mockPrismaInstance);
  });

  describe('PrismaClient Configuration', () => {
    it('should create PrismaClient with development logging in development environment', () => {
      // Set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Re-require the module to get new instance with updated env
      jest.resetModules();
      require('../../../src/services/database');

      expect(MockedPrismaClient).toHaveBeenCalledWith({
        log: ['query', 'error', 'warn']
      });

      // Restore original env
      process.env.NODE_ENV = originalEnv;
    });

    it('should create PrismaClient with error-only logging in production environment', () => {
      // Set NODE_ENV to production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Re-require the module to get new instance with updated env
      jest.resetModules();
      require('../../../src/services/database');

      expect(MockedPrismaClient).toHaveBeenCalledWith({
        log: ['error']
      });

      // Restore original env
      process.env.NODE_ENV = originalEnv;
    });

    it('should create PrismaClient with error-only logging when NODE_ENV is not development', () => {
      // Set NODE_ENV to test
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      // Re-require the module to get new instance with updated env
      jest.resetModules();
      require('../../../src/services/database');

      expect(MockedPrismaClient).toHaveBeenCalledWith({
        log: ['error']
      });

      // Restore original env
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('checkDatabaseConnection', () => {
    it('should return true when database connection is successful', async () => {
      mockPrismaInstance.$connect.mockResolvedValue(undefined);

      const result = await checkDatabaseConnection();

      expect(result).toBe(true);
      expect(mockPrismaInstance.$connect).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Database connected successfully');
    });

    it('should return false when database connection fails', async () => {
      const connectionError = new Error('Connection failed');
      mockPrismaInstance.$connect.mockRejectedValue(connectionError);

      const result = await checkDatabaseConnection();

      expect(result).toBe(false);
      expect(mockPrismaInstance.$connect).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Database connection failed:', connectionError);
    });

    it('should handle connection timeout errors', async () => {
      const timeoutError = new Error('Connection timeout');
      mockPrismaInstance.$connect.mockRejectedValue(timeoutError);

      const result = await checkDatabaseConnection();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Database connection failed:', timeoutError);
    });

    it('should handle database authentication errors', async () => {
      const authError = new Error('Authentication failed');
      mockPrismaInstance.$connect.mockRejectedValue(authError);

      const result = await checkDatabaseConnection();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Database connection failed:', authError);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network unreachable');
      mockPrismaInstance.$connect.mockRejectedValue(networkError);

      const result = await checkDatabaseConnection();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Database connection failed:', networkError);
    });
  });

  describe('prisma export', () => {
    it('should export prisma instance', () => {
      // Re-require to get fresh instance
      jest.resetModules();
      const { prisma: exportedPrisma } = require('../../../src/services/database');

      expect(exportedPrisma).toBeDefined();
      expect(exportedPrisma).toBeInstanceOf(Object);
    });

    it('should export the same prisma instance consistently', () => {
      jest.resetModules();
      const { prisma: prisma1 } = require('../../../src/services/database');
      const { prisma: prisma2 } = require('../../../src/services/database');

      expect(prisma1).toBe(prisma2);
    });
  });

  describe('Database Operations', () => {
    beforeEach(() => {
      // Reset modules to get fresh instance for each test
      jest.resetModules();
    });

    it('should support user operations', async () => {
      const { prisma } = require('../../../src/services/database');

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      // Mock user operations
      mockPrismaInstance.user.findMany.mockResolvedValue([mockUser]);
      mockPrismaInstance.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaInstance.user.create.mockResolvedValue(mockUser);
      mockPrismaInstance.user.update.mockResolvedValue(mockUser);
      mockPrismaInstance.user.delete.mockResolvedValue(mockUser);

      // Test operations are available
      expect(typeof prisma.user.findMany).toBe('function');
      expect(typeof prisma.user.findUnique).toBe('function');
      expect(typeof prisma.user.create).toBe('function');
      expect(typeof prisma.user.update).toBe('function');
      expect(typeof prisma.user.delete).toBe('function');
    });

    it('should support social account operations', async () => {
      const { prisma } = require('../../../src/services/database');

      const mockSocialAccount = {
        id: 'social-123',
        platform: 'FACEBOOK',
        username: 'testuser'
      };

      // Mock social account operations
      mockPrismaInstance.socialAccount.findMany.mockResolvedValue([mockSocialAccount]);
      mockPrismaInstance.socialAccount.findUnique.mockResolvedValue(mockSocialAccount);
      mockPrismaInstance.socialAccount.create.mockResolvedValue(mockSocialAccount);
      mockPrismaInstance.socialAccount.update.mockResolvedValue(mockSocialAccount);
      mockPrismaInstance.socialAccount.delete.mockResolvedValue(mockSocialAccount);

      // Test operations are available
      expect(typeof prisma.socialAccount.findMany).toBe('function');
      expect(typeof prisma.socialAccount.findUnique).toBe('function');
      expect(typeof prisma.socialAccount.create).toBe('function');
      expect(typeof prisma.socialAccount.update).toBe('function');
      expect(typeof prisma.socialAccount.delete).toBe('function');
    });

    it('should support post operations', async () => {
      const { prisma } = require('../../../src/services/database');

      const mockPost = {
        id: 'post-123',
        content: 'Test post',
        status: 'PUBLISHED'
      };

      // Mock post operations
      mockPrismaInstance.post.findMany.mockResolvedValue([mockPost]);
      mockPrismaInstance.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaInstance.post.create.mockResolvedValue(mockPost);
      mockPrismaInstance.post.update.mockResolvedValue(mockPost);
      mockPrismaInstance.post.delete.mockResolvedValue(mockPost);

      // Test operations are available
      expect(typeof prisma.post.findMany).toBe('function');
      expect(typeof prisma.post.findUnique).toBe('function');
      expect(typeof prisma.post.create).toBe('function');
      expect(typeof prisma.post.update).toBe('function');
      expect(typeof prisma.post.delete).toBe('function');
    });

    it('should support scheduled post operations', async () => {
      const { prisma } = require('../../../src/services/database');

      const mockScheduledPost = {
        id: 'scheduled-123',
        postId: 'post-123',
        status: 'PENDING'
      };

      // Mock scheduled post operations
      mockPrismaInstance.scheduledPost.findMany.mockResolvedValue([mockScheduledPost]);
      mockPrismaInstance.scheduledPost.findUnique.mockResolvedValue(mockScheduledPost);
      mockPrismaInstance.scheduledPost.create.mockResolvedValue(mockScheduledPost);
      mockPrismaInstance.scheduledPost.update.mockResolvedValue(mockScheduledPost);
      mockPrismaInstance.scheduledPost.delete.mockResolvedValue(mockScheduledPost);

      // Test operations are available
      expect(typeof prisma.scheduledPost.findMany).toBe('function');
      expect(typeof prisma.scheduledPost.findUnique).toBe('function');
      expect(typeof prisma.scheduledPost.create).toBe('function');
      expect(typeof prisma.scheduledPost.update).toBe('function');
      expect(typeof prisma.scheduledPost.delete).toBe('function');
    });

    it('should support transaction operations', async () => {
      const { prisma } = require('../../../src/services/database');

      mockPrismaInstance.$transaction.mockResolvedValue(['result1', 'result2']);

      // Test transaction operation is available
      expect(typeof prisma.$transaction).toBe('function');
    });

    it('should support connection operations', async () => {
      const { prisma } = require('../../../src/services/database');

      mockPrismaInstance.$connect.mockResolvedValue(undefined);
      mockPrismaInstance.$disconnect.mockResolvedValue(undefined);

      // Test connection operations are available
      expect(typeof prisma.$connect).toBe('function');
      expect(typeof prisma.$disconnect).toBe('function');
    });
  });

  describe('Error Handling in Database Operations', () => {
    it('should handle database query errors', async () => {
      const { prisma } = require('../../../src/services/database');

      const dbError = new Error('Database query failed');
      mockPrismaInstance.user.findMany.mockRejectedValue(dbError);

      await expect(prisma.user.findMany()).rejects.toThrow('Database query failed');
    });

    it('should handle connection errors during operations', async () => {
      const { prisma } = require('../../../src/services/database');

      const connectionError = new Error('Connection lost');
      mockPrismaInstance.user.create.mockRejectedValue(connectionError);

      await expect(prisma.user.create({ data: {} })).rejects.toThrow('Connection lost');
    });

    it('should handle transaction rollback errors', async () => {
      const { prisma } = require('../../../src/services/database');

      const transactionError = new Error('Transaction rolled back');
      mockPrismaInstance.$transaction.mockRejectedValue(transactionError);

      await expect(prisma.$transaction([])).rejects.toThrow('Transaction rolled back');
    });
  });

  describe('Module Imports and Exports', () => {
    it('should export checkDatabaseConnection function', () => {
      expect(typeof checkDatabaseConnection).toBe('function');
    });

    it('should export prisma instance', () => {
      jest.resetModules();
      const { prisma } = require('../../../src/services/database');
      expect(prisma).toBeDefined();
    });

    it('should allow multiple imports of the same module', () => {
      jest.resetModules();
      const module1 = require('../../../src/services/database');
      const module2 = require('../../../src/services/database');

      expect(module1.prisma).toBe(module2.prisma);
      expect(module1.checkDatabaseConnection).toBe(module2.checkDatabaseConnection);
    });
  });
});