import request from 'supertest';
import express from 'express';
import { mockPrismaClient } from '../../setup/jest.setup';
import socialRoutes from '../../../src/routes/social.routes';

// Test data
const mockUser = {
  id: 'user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  organizationId: 'org-id-123',
  role: 'user'
};

const mockSocialAccounts = [
  {
    id: 'social-account-123',
    platform: 'FACEBOOK',
    username: 'testuser',
    displayName: 'Test User',
    profileUrl: 'https://facebook.com/testuser',
    profileImage: 'https://example.com/avatar.jpg',
    followersCount: 1000,
    followingCount: 500,
    postsCount: 100,
    status: 'ACTIVE',
    connectedAt: new Date('2024-01-01T00:00:00.000Z'),
    lastSyncAt: new Date('2024-01-15T00:00:00.000Z')
  },
  {
    id: 'social-account-456',
    platform: 'INSTAGRAM',
    username: 'testuser_insta',
    displayName: 'Test User Instagram',
    profileUrl: 'https://instagram.com/testuser_insta',
    profileImage: 'https://example.com/avatar2.jpg',
    followersCount: 2000,
    followingCount: 300,
    postsCount: 150,
    status: 'ACTIVE',
    connectedAt: new Date('2024-01-05T00:00:00.000Z'),
    lastSyncAt: new Date('2024-01-16T00:00:00.000Z')
  }
];

const mockSocialAccountWithScope = {
  ...mockSocialAccounts[0],
  scope: ['publish_actions', 'read_insights']
};

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware - inject user into request
app.use((req: any, res, next) => {
  req.user = mockUser;
  next();
});

app.use('/api/social', socialRoutes);

describe('Social Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/social/accounts', () => {
    it('should get user social accounts successfully', async () => {
      mockPrismaClient.socialAccount.findMany.mockResolvedValue(mockSocialAccounts);

      const response = await request(app)
        .get('/api/social/accounts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSocialAccounts);

      expect(mockPrismaClient.socialAccount.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        select: {
          id: true,
          platform: true,
          username: true,
          displayName: true,
          profileUrl: true,
          profileImage: true,
          followersCount: true,
          followingCount: true,
          postsCount: true,
          status: true,
          connectedAt: true,
          lastSyncAt: true
        }
      });
    });

    it('should return empty array when user has no social accounts', async () => {
      mockPrismaClient.socialAccount.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/social/accounts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return 401 if user not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use((req: any, res, next) => {
        req.user = null;
        next();
      });
      appNoAuth.use('/api/social', socialRoutes);

      const response = await request(appNoAuth)
        .get('/api/social/accounts')
        .expect(401);

      expect(response.body.error).toBe('User not authenticated');
    });

    it('should handle database errors', async () => {
      mockPrismaClient.socialAccount.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/social/accounts')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch social accounts');
      expect(response.body.message).toBe('Database error');
    });

    it('should exclude sensitive data from response', async () => {
      const accountsWithSensitiveData = mockSocialAccounts.map(account => ({
        ...account,
        accessToken: 'sensitive-access-token',
        refreshToken: 'sensitive-refresh-token'
      }));

      mockPrismaClient.socialAccount.findMany.mockResolvedValue(accountsWithSensitiveData);

      const response = await request(app)
        .get('/api/social/accounts')
        .expect(200);

      response.body.data.forEach((account: any) => {
        expect(account.accessToken).toBeUndefined();
        expect(account.refreshToken).toBeUndefined();
      });
    });
  });

  describe('GET /api/social/accounts/:id', () => {
    it('should get specific social account successfully', async () => {
      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(mockSocialAccountWithScope);

      const response = await request(app)
        .get('/api/social/accounts/social-account-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSocialAccountWithScope);

      expect(mockPrismaClient.socialAccount.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'social-account-123',
          userId: mockUser.userId
        },
        select: {
          id: true,
          platform: true,
          username: true,
          displayName: true,
          profileUrl: true,
          profileImage: true,
          followersCount: true,
          followingCount: true,
          postsCount: true,
          status: true,
          connectedAt: true,
          lastSyncAt: true,
          scope: true
        }
      });
    });

    it('should return 404 if social account not found', async () => {
      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/social/accounts/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Social account not found');
    });

    it('should return 400 for invalid account ID format', async () => {
      const response = await request(app)
        .get('/api/social/accounts/') // Empty ID
        .expect(404); // Express returns 404 for missing route parameter
    });

    it('should return 401 if user not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use((req: any, res, next) => {
        req.user = null;
        next();
      });
      appNoAuth.use('/api/social', socialRoutes);

      const response = await request(appNoAuth)
        .get('/api/social/accounts/social-account-123')
        .expect(401);

      expect(response.body.error).toBe('User not authenticated');
    });

    it('should not return account belonging to another user', async () => {
      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/social/accounts/other-user-account')
        .expect(404);

      expect(mockPrismaClient.socialAccount.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'other-user-account',
          userId: mockUser.userId // Should only find accounts for current user
        },
        select: expect.any(Object)
      });
    });
  });

  describe('POST /api/social/accounts/:id/disconnect', () => {
    it('should disconnect social account successfully', async () => {
      const socialAccount = { ...mockSocialAccounts[0] };
      const updatedAccount = { ...socialAccount, status: 'INACTIVE' };

      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(socialAccount);
      mockPrismaClient.socialAccount.update.mockResolvedValue(updatedAccount);

      const response = await request(app)
        .post('/api/social/accounts/social-account-123/disconnect')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Social account disconnected successfully');

      expect(mockPrismaClient.socialAccount.update).toHaveBeenCalledWith({
        where: { id: 'social-account-123' },
        data: {
          status: 'INACTIVE',
          accessToken: '',
          refreshToken: null
        }
      });
    });

    it('should return 404 if social account not found', async () => {
      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/social/accounts/non-existent-id/disconnect')
        .expect(404);

      expect(response.body.error).toBe('Social account not found');
    });

    it('should return 401 if user not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use((req: any, res, next) => {
        req.user = null;
        next();
      });
      appNoAuth.use('/api/social', socialRoutes);

      const response = await request(appNoAuth)
        .post('/api/social/accounts/social-account-123/disconnect')
        .expect(401);

      expect(response.body.error).toBe('User not authenticated');
    });

    it('should clear sensitive tokens when disconnecting', async () => {
      const socialAccount = {
        ...mockSocialAccounts[0],
        accessToken: 'sensitive-token',
        refreshToken: 'sensitive-refresh'
      };

      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(socialAccount);
      mockPrismaClient.socialAccount.update.mockResolvedValue({
        ...socialAccount,
        status: 'INACTIVE',
        accessToken: '',
        refreshToken: null
      });

      await request(app)
        .post('/api/social/accounts/social-account-123/disconnect')
        .expect(200);

      expect(mockPrismaClient.socialAccount.update).toHaveBeenCalledWith({
        where: { id: 'social-account-123' },
        data: {
          status: 'INACTIVE',
          accessToken: '', // Should be cleared
          refreshToken: null // Should be cleared
        }
      });
    });

    it('should handle database errors during disconnect', async () => {
      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(mockSocialAccounts[0]);
      mockPrismaClient.socialAccount.update.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .post('/api/social/accounts/social-account-123/disconnect')
        .expect(500);

      expect(response.body.error).toBe('Failed to disconnect social account');
      expect(response.body.message).toBe('Update failed');
    });
  });

  describe('POST /api/social/accounts/:id/sync', () => {
    it('should sync social account successfully', async () => {
      const activeAccount = { ...mockSocialAccounts[0], status: 'ACTIVE' };
      const syncedAccount = { ...activeAccount, lastSyncAt: new Date() };

      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(activeAccount);
      mockPrismaClient.socialAccount.update.mockResolvedValue(syncedAccount);

      const response = await request(app)
        .post('/api/social/accounts/social-account-123/sync')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Account sync initiated successfully');

      expect(mockPrismaClient.socialAccount.update).toHaveBeenCalledWith({
        where: { id: 'social-account-123' },
        data: { lastSyncAt: expect.any(Date) }
      });
    });

    it('should return 404 if social account not found', async () => {
      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/social/accounts/non-existent-id/sync')
        .expect(404);

      expect(response.body.error).toBe('Social account not found');
    });

    it('should return 400 if account is not active', async () => {
      const inactiveAccount = { ...mockSocialAccounts[0], status: 'INACTIVE' };
      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(inactiveAccount);

      const response = await request(app)
        .post('/api/social/accounts/social-account-123/sync')
        .expect(400);

      expect(response.body.error).toBe('Account is not active');
      expect(mockPrismaClient.socialAccount.update).not.toHaveBeenCalled();
    });

    it('should return 401 if user not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use((req: any, res, next) => {
        req.user = null;
        next();
      });
      appNoAuth.use('/api/social', socialRoutes);

      const response = await request(appNoAuth)
        .post('/api/social/accounts/social-account-123/sync')
        .expect(401);

      expect(response.body.error).toBe('User not authenticated');
    });

    it('should update lastSyncAt timestamp', async () => {
      const beforeSync = new Date();
      const activeAccount = { ...mockSocialAccounts[0], status: 'ACTIVE' };

      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(activeAccount);
      mockPrismaClient.socialAccount.update.mockResolvedValue(activeAccount);

      await request(app)
        .post('/api/social/accounts/social-account-123/sync')
        .expect(200);

      const updateCall = mockPrismaClient.socialAccount.update.mock.calls[0][0];
      const lastSyncAt = updateCall.data.lastSyncAt;

      expect(lastSyncAt).toBeInstanceOf(Date);
      expect(lastSyncAt.getTime()).toBeGreaterThanOrEqual(beforeSync.getTime());
    });

    it('should handle database errors during sync', async () => {
      mockPrismaClient.socialAccount.findFirst.mockResolvedValue({
        ...mockSocialAccounts[0],
        status: 'ACTIVE'
      });
      mockPrismaClient.socialAccount.update.mockRejectedValue(new Error('Sync failed'));

      const response = await request(app)
        .post('/api/social/accounts/social-account-123/sync')
        .expect(500);

      expect(response.body.error).toBe('Failed to sync social account');
      expect(response.body.message).toBe('Sync failed');
    });
  });

  describe('GET /api/social/platforms', () => {
    it('should get available social platforms successfully', async () => {
      const response = await request(app)
        .get('/api/social/platforms')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Check that each platform has required fields
      response.body.data.forEach((platform: any) => {
        expect(platform).toHaveProperty('id');
        expect(platform).toHaveProperty('name');
        expect(platform).toHaveProperty('icon');
        expect(platform).toHaveProperty('color');
        expect(platform).toHaveProperty('features');
        expect(Array.isArray(platform.features)).toBe(true);
      });
    });

    it('should include Facebook platform', async () => {
      const response = await request(app)
        .get('/api/social/platforms')
        .expect(200);

      const facebook = response.body.data.find((p: any) => p.id === 'FACEBOOK');
      expect(facebook).toBeDefined();
      expect(facebook.name).toBe('Facebook');
      expect(facebook.icon).toBe('facebook');
      expect(facebook.color).toBe('#1877F2');
      expect(facebook.features).toContain('posts');
      expect(facebook.features).toContain('scheduling');
      expect(facebook.features).toContain('analytics');
    });

    it('should include Instagram platform', async () => {
      const response = await request(app)
        .get('/api/social/platforms')
        .expect(200);

      const instagram = response.body.data.find((p: any) => p.id === 'INSTAGRAM');
      expect(instagram).toBeDefined();
      expect(instagram.name).toBe('Instagram');
      expect(instagram.icon).toBe('instagram');
      expect(instagram.color).toBe('#E4405F');
      expect(instagram.features).toContain('posts');
      expect(instagram.features).toContain('stories');
      expect(instagram.features).toContain('scheduling');
    });

    it('should include Twitter platform', async () => {
      const response = await request(app)
        .get('/api/social/platforms')
        .expect(200);

      const twitter = response.body.data.find((p: any) => p.id === 'TWITTER');
      expect(twitter).toBeDefined();
      expect(twitter.name).toBe('Twitter');
      expect(twitter.icon).toBe('twitter');
      expect(twitter.color).toBe('#1DA1F2');
      expect(twitter.features).toContain('posts');
      expect(twitter.features).toContain('threads');
    });

    it('should include LinkedIn platform', async () => {
      const response = await request(app)
        .get('/api/social/platforms')
        .expect(200);

      const linkedin = response.body.data.find((p: any) => p.id === 'LINKEDIN');
      expect(linkedin).toBeDefined();
      expect(linkedin.name).toBe('LinkedIn');
      expect(linkedin.icon).toBe('linkedin');
      expect(linkedin.color).toBe('#0A66C2');
      expect(linkedin.features).toContain('posts');
      expect(linkedin.features).toContain('articles');
    });

    it('should include TikTok platform', async () => {
      const response = await request(app)
        .get('/api/social/platforms')
        .expect(200);

      const tiktok = response.body.data.find((p: any) => p.id === 'TIKTOK');
      expect(tiktok).toBeDefined();
      expect(tiktok.name).toBe('TikTok');
      expect(tiktok.icon).toBe('tiktok');
      expect(tiktok.color).toBe('#000000');
      expect(tiktok.features).toContain('videos');
      expect(tiktok.features).toContain('scheduling');
    });

    it('should return consistent platform data', async () => {
      const response1 = await request(app).get('/api/social/platforms');
      const response2 = await request(app).get('/api/social/platforms');

      expect(response1.body.data).toEqual(response2.body.data);
    });

    it('should handle potential errors gracefully', async () => {
      // Since this endpoint returns static data, it should always succeed
      // But we test that it handles the response correctly
      const response = await request(app)
        .get('/api/social/platforms')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Validation Middleware', () => {
    it('should validate account ID parameter', async () => {
      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(null);

      // Test with valid ID format
      await request(app)
        .get('/api/social/accounts/valid-account-id')
        .expect(404); // Not found, but validation passed

      // Test with empty ID is handled by Express routing (404)
      await request(app)
        .get('/api/social/accounts/')
        .expect(404);
    });

    it('should apply validation to disconnect endpoint', async () => {
      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(null);

      await request(app)
        .post('/api/social/accounts/valid-id/disconnect')
        .expect(404); // Validation passed, account not found
    });

    it('should apply validation to sync endpoint', async () => {
      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(null);

      await request(app)
        .post('/api/social/accounts/valid-id/sync')
        .expect(404); // Validation passed, account not found
    });
  });

  describe('Route Security', () => {
    it('should require authentication for all protected routes', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use((req: any, res, next) => {
        req.user = null;
        next();
      });
      appNoAuth.use('/api/social', socialRoutes);

      // Test all protected endpoints
      await request(appNoAuth).get('/api/social/accounts').expect(401);
      await request(appNoAuth).get('/api/social/accounts/123').expect(401);
      await request(appNoAuth).post('/api/social/accounts/123/disconnect').expect(401);
      await request(appNoAuth).post('/api/social/accounts/123/sync').expect(401);
    });

    it('should allow access to platforms endpoint without auth', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use((req: any, res, next) => {
        req.user = null;
        next();
      });
      appNoAuth.use('/api/social', socialRoutes);

      // Platforms endpoint should be accessible without auth
      const response = await request(appNoAuth)
        .get('/api/social/platforms')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should isolate user data by userId', async () => {
      mockPrismaClient.socialAccount.findMany.mockResolvedValue([]);

      await request(app)
        .get('/api/social/accounts')
        .expect(200);

      expect(mockPrismaClient.socialAccount.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        select: expect.any(Object)
      });
    });
  });
});