import { prisma } from './database';

describe('Database Service', () => {
  it('should export prisma client instance', () => {
    expect(prisma).toBeDefined();
    expect(prisma).toHaveProperty('$connect');
    expect(prisma).toHaveProperty('$disconnect');
    expect(prisma).toHaveProperty('user');
    expect(prisma).toHaveProperty('post');
    expect(prisma).toHaveProperty('socialAccount');
  });

  it('should have all required models', () => {
    // Check for all the main models
    const requiredModels = [
      'user',
      'session',
      'verificationToken',
      'passwordResetToken',
      'organization',
      'organizationMember',
      'socialAccount',
      'post',
      'draft',
      'scheduledPost',
      'postingQueue',
      'queueTimeSlot',
      'optimalPostingTime',
      'recurringPostGroup',
      'contentTemplate',
      'media',
      'analytics',
      'inboxMessage',
      'collaboration',
      'workflow',
      'aiAgent',
      'aiChatHistory',
      'aiSettings'
    ];

    requiredModels.forEach(model => {
      expect(prisma).toHaveProperty(model);
    });
  });

  it('should have CRUD operations for user model', () => {
    expect(prisma.user).toHaveProperty('create');
    expect(prisma.user).toHaveProperty('findUnique');
    expect(prisma.user).toHaveProperty('findMany');
    expect(prisma.user).toHaveProperty('update');
    expect(prisma.user).toHaveProperty('delete');
    expect(prisma.user).toHaveProperty('upsert');
    expect(prisma.user).toHaveProperty('count');
  });

  it('should have transaction support', () => {
    expect(prisma).toHaveProperty('$transaction');
    expect(typeof prisma.$transaction).toBe('function');
  });

  it('should have query raw support', () => {
    expect(prisma).toHaveProperty('$queryRaw');
    expect(prisma).toHaveProperty('$executeRaw');
  });

  describe('connection management', () => {
    it('should have connect method', () => {
      expect(prisma.$connect).toBeDefined();
      expect(typeof prisma.$connect).toBe('function');
    });

    it('should have disconnect method', () => {
      expect(prisma.$disconnect).toBeDefined();
      expect(typeof prisma.$disconnect).toBe('function');
    });

    it('should connect successfully', async () => {
      // Since we're mocking, this should resolve
      await expect(prisma.$connect()).resolves.toBeUndefined();
    });

    it('should disconnect successfully', async () => {
      // Since we're mocking, this should resolve
      await expect(prisma.$disconnect()).resolves.toBeUndefined();
    });
  });
});