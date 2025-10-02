import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { jest } from '@jest/globals';
import { createTestApp } from '../utils/test-app';
import { createTestUser, getAuthToken } from '../utils/test-helpers';
import { mockTikTokResponses } from '../test-data/fixtures/social-accounts';
import { TikTokOAuthService } from '../../allin-platform/backend/src/services/oauth/tiktok.oauth';

// Mock external HTTP requests to TikTok API
jest.mock('axios');
const mockAxios = require('axios');

describe('TikTok OAuth Integration Tests', () => {
  let app: any;
  let prisma: PrismaClient;
  let testUser: any;
  let authToken: string;
  let tiktokOAuthService: TikTokOAuthService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = global.testUtils.prisma;
    tiktokOAuthService = new TikTokOAuthService();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Set up environment variables for testing
    process.env.TIKTOK_CLIENT_KEY = 'test_tiktok_client_key';
    process.env.TIKTOK_CLIENT_SECRET = 'test_tiktok_client_secret';
    process.env.TIKTOK_REDIRECT_URI = 'http://localhost:3001/api/social/callback/tiktok';

    // Create test user and auth token
    testUser = await createTestUser({
      email: 'tiktok-test@example.com',
      name: 'TikTok Test User',
      status: 'ACTIVE'
    });
    authToken = getAuthToken(testUser);

    // Setup default axios mocks for TikTok API
    mockAxios.post.mockResolvedValue({
      data: mockTikTokResponses.tokenExchange
    });
    mockAxios.get.mockResolvedValue({
      data: mockTikTokResponses.userProfile
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.socialAccount.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.user.delete({
      where: { id: testUser.id }
    });

    // Clean up environment variables
    delete process.env.TIKTOK_CLIENT_KEY;
    delete process.env.TIKTOK_CLIENT_SECRET;
    delete process.env.TIKTOK_REDIRECT_URI;
  });

  describe('TikTok OAuth Connection Flow', () => {
    it('should complete full TikTok OAuth flow successfully', async () => {
      // Step 1: Initiate OAuth connection
      const connectResponse = await request(app)
        .post('/api/social/connect/TIKTOK')
        .set('Authorization', `Bearer ${authToken}`)
        .send()
        .expect(200);

      expect(connectResponse.body).toHaveProperty('success', true);
      expect(connectResponse.body).toHaveProperty('authUrl');
      expect(connectResponse.body.authUrl).toContain('www.tiktok.com');
      expect(connectResponse.body.authUrl).toContain('client_key=test_tiktok_client_key');

      // Step 2: Simulate OAuth callback
      const authCode = 'tiktok_auth_code_12345';
      const state = 'oauth_state_12345';

      // Mock the OAuth state storage (normally handled by the route)
      const oauthStates = new Map();
      oauthStates.set(state, {
        userId: testUser.id,
        platform: 'TIKTOK',
        organizationId: null
      });

      // Mock successful token exchange and profile fetch
      mockAxios.post.mockResolvedValueOnce({
        data: mockTikTokResponses.tokenExchange
      });
      mockAxios.post.mockResolvedValueOnce({
        data: mockTikTokResponses.userProfile
      });

      // Step 3: Complete OAuth by connecting account
      const account = await tiktokOAuthService.connectAccount(testUser.id, authCode);

      expect(account).toBeDefined();
      expect(account.platform).toBe('TIKTOK');
      expect(account.userId).toBe(testUser.id);
      expect(account.status).toBe('ACTIVE');
      expect(account.platformId).toBe(mockTikTokResponses.userProfile.data.user.open_id);
      expect(account.displayName).toBe(mockTikTokResponses.userProfile.data.user.display_name);

      // Step 4: Verify account is stored in database
      const storedAccount = await prisma.socialAccount.findFirst({
        where: {
          userId: testUser.id,
          platform: 'TIKTOK'
        }
      });

      expect(storedAccount).toBeDefined();
      expect(storedAccount?.platformId).toBe(mockTikTokResponses.userProfile.data.user.open_id);
      expect(storedAccount?.accessToken).toBeDefined();
      expect(storedAccount?.accessToken).not.toBe(mockTikTokResponses.tokenExchange.access_token); // Should be encrypted

      // Step 5: Verify API calls were made correctly
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://open.tiktokapis.com/v2/oauth/token/',
        expect.objectContaining({
          client_key: 'test_tiktok_client_key',
          client_secret: 'test_tiktok_client_secret',
          code: authCode,
          grant_type: 'authorization_code'
        }),
        expect.any(Object)
      );

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://open.tiktokapis.com/v2/user/info/',
        expect.objectContaining({
          fields: expect.arrayContaining([
            'open_id',
            'display_name',
            'follower_count',
            'video_count'
          ])
        }),
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockTikTokResponses.tokenExchange.access_token}`,
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should handle TikTok OAuth errors gracefully', async () => {
      // Arrange
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            error: {
              code: 'invalid_grant',
              message: 'Invalid authorization code'
            }
          }
        }
      });

      // Act & Assert
      await expect(
        tiktokOAuthService.connectAccount(testUser.id, 'invalid_auth_code')
      ).rejects.toThrow('Failed to exchange code for tokens');
    });

    it('should update existing TikTok account on reconnection', async () => {
      // Step 1: Create existing TikTok account
      const existingAccount = await prisma.socialAccount.create({
        data: {
          userId: testUser.id,
          platform: 'TIKTOK',
          platformId: mockTikTokResponses.userProfile.data.user.open_id,
          username: 'old_username',
          displayName: 'Old Display Name',
          accessToken: 'old_encrypted_token',
          refreshToken: 'old_refresh_token',
          tokenExpiry: new Date(Date.now() - 1000), // Expired
          scope: ['user.info.basic'],
          platformData: {},
          status: 'EXPIRED'
        }
      });

      // Step 2: Reconnect account
      const updatedAccount = await tiktokOAuthService.connectAccount(testUser.id, 'new_auth_code');

      // Step 3: Verify account was updated, not duplicated
      expect(updatedAccount.id).toBe(existingAccount.id);
      expect(updatedAccount.status).toBe('ACTIVE');
      expect(updatedAccount.displayName).toBe(mockTikTokResponses.userProfile.data.user.display_name);

      // Step 4: Verify only one account exists
      const accounts = await prisma.socialAccount.findMany({
        where: {
          userId: testUser.id,
          platform: 'TIKTOK'
        }
      });

      expect(accounts).toHaveLength(1);
    });

    it('should handle organization-specific TikTok connections', async () => {
      // Step 1: Create test organization
      const testOrg = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org',
          type: 'AGENCY'
        }
      });

      // Step 2: Connect TikTok account to organization
      const account = await tiktokOAuthService.connectAccount(
        testUser.id, 
        'auth_code_123', 
        testOrg.id
      );

      expect(account.organizationId).toBe(testOrg.id);

      // Step 3: Verify organization assignment in database
      const storedAccount = await prisma.socialAccount.findFirst({
        where: {
          userId: testUser.id,
          platform: 'TIKTOK',
          organizationId: testOrg.id
        }
      });

      expect(storedAccount).toBeDefined();
      expect(storedAccount?.organizationId).toBe(testOrg.id);

      // Cleanup
      await prisma.socialAccount.delete({ where: { id: account.id } });
      await prisma.organization.delete({ where: { id: testOrg.id } });
    });
  });

  describe('TikTok Account Management', () => {
    let tiktokAccount: any;

    beforeEach(async () => {
      // Create connected TikTok account
      tiktokAccount = await prisma.socialAccount.create({
        data: {
          userId: testUser.id,
          platform: 'TIKTOK',
          platformId: mockTikTokResponses.userProfile.data.user.open_id,
          username: 'testcreator',
          displayName: 'Test Creator',
          accessToken: 'encrypted_access_token',
          refreshToken: 'encrypted_refresh_token',
          tokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
          scope: ['user.info.basic', 'video.list'],
          platformData: {
            followerCount: 10000,
            videoCount: 25,
            likesCount: 50000,
            isVerified: false
          },
          status: 'ACTIVE'
        }
      });
    });

    it('should fetch TikTok accounts through API endpoint', async () => {
      // Act
      const response = await request(app)
        .get('/api/social/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);

      const tiktokAccounts = response.body.data.filter(
        (account: any) => account.platform === 'TIKTOK'
      );
      expect(tiktokAccounts).toHaveLength(1);
      
      const account = tiktokAccounts[0];
      expect(account.username).toBe('testcreator');
      expect(account.displayName).toBe('Test Creator');
      expect(account.status).toBe('ACTIVE');
      expect(account).not.toHaveProperty('accessToken'); // Sensitive data should be excluded
    });

    it('should disconnect TikTok account successfully', async () => {
      // Arrange
      mockAxios.post.mockResolvedValueOnce({ data: { success: true } });

      // Act
      const response = await request(app)
        .delete(`/api/social/disconnect/${tiktokAccount.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('TikTok');

      // Verify account is deleted from database
      const deletedAccount = await prisma.socialAccount.findUnique({
        where: { id: tiktokAccount.id }
      });
      expect(deletedAccount).toBeNull();

      // Verify TikTok revoke API was called
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://open.tiktokapis.com/v2/oauth/revoke/',
        expect.objectContaining({
          token: 'encrypted_access_token',
          client_key: 'test_tiktok_client_key',
          client_secret: 'test_tiktok_client_secret'
        }),
        expect.any(Object)
      );
    });

    it('should refresh TikTok tokens when needed', async () => {
      // Step 1: Set token to expire soon
      await prisma.socialAccount.update({
        where: { id: tiktokAccount.id },
        data: { tokenExpiry: new Date(Date.now() + 4 * 60 * 1000) } // 4 minutes from now
      });

      // Step 2: Mock successful token refresh
      mockAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
          expires_in: 86400
        }
      });

      // Step 3: Trigger token refresh
      const refreshed = await tiktokOAuthService.refreshTokensIfNeeded(tiktokAccount.id);

      expect(refreshed).toBe(true);

      // Step 4: Verify database was updated
      const updatedAccount = await prisma.socialAccount.findUnique({
        where: { id: tiktokAccount.id }
      });

      expect(updatedAccount?.tokenExpiry).not.toEqual(tiktokAccount.tokenExpiry);
      expect(updatedAccount?.lastSyncAt).toBeInstanceOf(Date);

      // Step 5: Verify API call was made
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://open.tiktokapis.com/v2/oauth/token/',
        expect.objectContaining({
          grant_type: 'refresh_token',
          refresh_token: 'encrypted_refresh_token'
        }),
        expect.any(Object)
      );
    });

    it('should handle TikTok token refresh failures', async () => {
      // Step 1: Set token to expired
      await prisma.socialAccount.update({
        where: { id: tiktokAccount.id },
        data: { tokenExpiry: new Date(Date.now() - 1000) } // Expired 1 second ago
      });

      // Step 2: Mock token refresh failure
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            error: {
              code: 'invalid_grant',
              message: 'The refresh token is invalid or expired'
            }
          }
        }
      });

      // Step 3: Attempt token refresh
      await expect(
        tiktokOAuthService.refreshTokensIfNeeded(tiktokAccount.id)
      ).rejects.toThrow('Failed to refresh access token');

      // Step 4: Verify account status is updated
      const updatedAccount = await prisma.socialAccount.findUnique({
        where: { id: tiktokAccount.id }
      });

      expect(updatedAccount?.status).toBe('EXPIRED');
    });
  });

  describe('TikTok Analytics Integration', () => {
    let tiktokAccount: any;

    beforeEach(async () => {
      // Create connected TikTok account with analytics data
      tiktokAccount = await prisma.socialAccount.create({
        data: {
          userId: testUser.id,
          platform: 'TIKTOK',
          platformId: 'tiktok_creator_123',
          username: 'analyticscreator',
          displayName: 'Analytics Creator',
          accessToken: 'encrypted_access_token',
          refreshToken: 'encrypted_refresh_token',
          tokenExpiry: new Date(Date.now() + 3600000),
          scope: ['user.info.basic', 'video.list', 'user.info.stats'],
          platformData: {
            followerCount: 50000,
            videoCount: 75,
            likesCount: 250000,
            averageViews: 15000,
            engagementRate: 6.8
          },
          status: 'ACTIVE'
        }
      });
    });

    it('should fetch TikTok video insights successfully', async () => {
      // Arrange
      mockAxios.post.mockResolvedValueOnce({
        data: mockTikTokResponses.videoList
      });

      // Act
      const insights = await tiktokOAuthService.getInsights(
        'test_access_token',
        tiktokAccount.platformId
      );

      // Assert
      expect(insights).toHaveProperty('totalVideos');
      expect(insights).toHaveProperty('totalViews');
      expect(insights).toHaveProperty('totalLikes');
      expect(insights).toHaveProperty('totalComments');
      expect(insights).toHaveProperty('totalShares');
      expect(insights).toHaveProperty('averageViews');
      expect(insights).toHaveProperty('engagementRate');
      expect(insights).toHaveProperty('videos');

      expect(insights.totalVideos).toBe(mockTikTokResponses.videoList.data.videos.length);
      expect(Array.isArray(insights.videos)).toBe(true);
      expect(insights.videos.length).toBeLessThanOrEqual(5); // Should return max 5 recent videos

      // Verify API call
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://open.tiktokapis.com/v2/video/list/',
        expect.objectContaining({
          fields: expect.arrayContaining([
            'id',
            'title',
            'view_count',
            'like_count',
            'comment_count',
            'share_count'
          ])
        }),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test_access_token',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should calculate engagement metrics correctly', async () => {
      // Arrange
      const mockVideosWithMetrics = {
        data: {
          videos: [
            {
              id: 'video1',
              view_count: 10000,
              like_count: 800,
              comment_count: 120,
              share_count: 80
            },
            {
              id: 'video2',
              view_count: 15000,
              like_count: 1200,
              comment_count: 180,
              share_count: 120
            }
          ]
        }
      };

      mockAxios.post.mockResolvedValueOnce({
        data: mockVideosWithMetrics
      });

      // Act
      const insights = await tiktokOAuthService.getInsights(
        'test_access_token',
        tiktokAccount.platformId
      );

      // Assert
      expect(insights.totalViews).toBe(25000);
      expect(insights.totalLikes).toBe(2000);
      expect(insights.totalComments).toBe(300);
      expect(insights.totalShares).toBe(200);
      expect(insights.averageViews).toBe(12500);
      expect(insights.averageLikes).toBe(1000);
      
      // Engagement rate should be calculated as (likes + comments + shares) / views * 100
      const expectedEngagementRate = ((2000 + 300 + 200) / 25000 * 100).toFixed(2);
      expect(insights.engagementRate).toBe(expectedEngagementRate);
    });

    it('should handle TikTok insights API endpoint through routes', async () => {
      // Arrange
      mockAxios.post.mockResolvedValueOnce({
        data: mockTikTokResponses.videoList
      });

      // Act
      const response = await request(app)
        .get(`/api/social/accounts/${tiktokAccount.id}/insights`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      
      const insights = response.body.data;
      expect(insights).toHaveProperty('impressions');
      expect(insights).toHaveProperty('reach');
      expect(insights).toHaveProperty('engagement');
      
      // For now, returns mock data as per current implementation
      expect(typeof insights.impressions).toBe('number');
      expect(typeof insights.reach).toBe('number');
      expect(typeof insights.engagement).toBe('number');
    });

    it('should handle TikTok API rate limiting in insights', async () => {
      // Arrange
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 429,
          data: {
            error: {
              code: 'rate_limit_exceeded',
              message: 'Rate limit exceeded'
            }
          },
          headers: {
            'retry-after': '300'
          }
        }
      });

      // Act & Assert
      await expect(
        tiktokOAuthService.getInsights('test_access_token', tiktokAccount.platformId)
      ).rejects.toThrow('Failed to fetch insights');
    });
  });

  describe('TikTok Error Scenarios', () => {
    it('should handle TikTok service unavailability', async () => {
      // Arrange
      mockAxios.post.mockRejectedValueOnce({
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND open.tiktokapis.com'
      });

      // Act & Assert
      await expect(
        tiktokOAuthService.exchangeCodeForTokens('auth_code_123')
      ).rejects.toThrow('Failed to exchange code for tokens');
    });

    it('should handle malformed TikTok API responses', async () => {
      // Arrange
      mockAxios.post.mockResolvedValueOnce({
        data: null // Malformed response
      });

      // Act & Assert
      await expect(
        tiktokOAuthService.exchangeCodeForTokens('auth_code_123')
      ).rejects.toThrow('Failed to exchange code for tokens');
    });

    it('should handle TikTok account suspension', async () => {
      // Arrange
      mockAxios.post.mockResolvedValueOnce({
        data: {
          error: {
            code: 'account_suspended',
            message: 'Account has been suspended'
          }
        }
      });

      // Act & Assert
      await expect(
        tiktokOAuthService.getUserProfile('suspended_access_token')
      ).rejects.toThrow('TikTok API Error: Account has been suspended');
    });

    it('should handle insufficient TikTok permissions', async () => {
      // Arrange
      mockAxios.post.mockResolvedValueOnce({
        data: {
          error: {
            code: 'insufficient_permissions',
            message: 'Insufficient permissions to access video data'
          }
        }
      });

      // Act & Assert
      await expect(
        tiktokOAuthService.getInsights('limited_access_token', 'user_123')
      ).rejects.toThrow('TikTok API Error: Insufficient permissions to access video data');
    });
  });

  describe('TikTok Data Privacy and Security', () => {
    it('should encrypt TikTok access tokens before storage', async () => {
      // Act
      const account = await tiktokOAuthService.connectAccount(testUser.id, 'auth_code_123');

      // Assert
      expect(account.accessToken).toBeDefined();
      expect(account.accessToken).not.toBe(mockTikTokResponses.tokenExchange.access_token);
      expect(account.accessToken.length).toBeGreaterThan(mockTikTokResponses.tokenExchange.access_token.length);
    });

    it('should not expose TikTok tokens in API responses', async () => {
      // Arrange
      const tiktokAccount = await prisma.socialAccount.create({
        data: {
          userId: testUser.id,
          platform: 'TIKTOK',
          platformId: 'secure_user_123',
          username: 'secureuser',
          displayName: 'Secure User',
          accessToken: 'encrypted_secret_token',
          refreshToken: 'encrypted_secret_refresh',
          tokenExpiry: new Date(Date.now() + 3600000),
          scope: ['user.info.basic'],
          platformData: {},
          status: 'ACTIVE'
        }
      });

      // Act
      const response = await request(app)
        .get('/api/social/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      const accounts = response.body.data;
      const tiktokAccounts = accounts.filter((acc: any) => acc.platform === 'TIKTOK');
      
      expect(tiktokAccounts).toHaveLength(1);
      expect(tiktokAccounts[0]).not.toHaveProperty('accessToken');
      expect(tiktokAccounts[0]).not.toHaveProperty('refreshToken');

      // Cleanup
      await prisma.socialAccount.delete({ where: { id: tiktokAccount.id } });
    });

    it('should validate user ownership of TikTok accounts', async () => {
      // Step 1: Create TikTok account for different user
      const otherUser = await createTestUser({
        email: 'other-tiktok-user@example.com',
        name: 'Other TikTok User',
        status: 'ACTIVE'
      });

      const otherUserAccount = await prisma.socialAccount.create({
        data: {
          userId: otherUser.id,
          platform: 'TIKTOK',
          platformId: 'other_user_tiktok',
          username: 'otheruser',
          displayName: 'Other User',
          accessToken: 'encrypted_token',
          refreshToken: 'encrypted_refresh',
          tokenExpiry: new Date(Date.now() + 3600000),
          scope: ['user.info.basic'],
          platformData: {},
          status: 'ACTIVE'
        }
      });

      // Step 2: Try to disconnect other user's account
      const response = await request(app)
        .delete(`/api/social/disconnect/${otherUserAccount.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);

      // Cleanup
      await prisma.socialAccount.delete({ where: { id: otherUserAccount.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('TikTok Performance and Scalability', () => {
    it('should handle multiple concurrent TikTok operations', async () => {
      // Arrange
      const operations = Array(5).fill(0).map((_, index) => 
        tiktokOAuthService.connectAccount(testUser.id, `auth_code_${index}`)
      );

      // Act
      const results = await Promise.allSettled(operations);

      // Assert
      const successfulOperations = results.filter(result => result.status === 'fulfilled');
      expect(successfulOperations.length).toBeGreaterThan(0);
    });

    it('should efficiently query multiple TikTok accounts', async () => {
      // Step 1: Create multiple TikTok accounts
      const accounts = await Promise.all(
        Array(5).fill(0).map((_, index) => 
          prisma.socialAccount.create({
            data: {
              userId: testUser.id,
              platform: 'TIKTOK',
              platformId: `tiktok_user_${index}`,
              username: `creator_${index}`,
              displayName: `Creator ${index}`,
              accessToken: `encrypted_token_${index}`,
              refreshToken: `encrypted_refresh_${index}`,
              tokenExpiry: new Date(Date.now() + 3600000),
              scope: ['user.info.basic'],
              platformData: { followerCount: 1000 * (index + 1) },
              status: 'ACTIVE'
            }
          })
        )
      );

      // Step 2: Fetch all accounts through API
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/social/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const endTime = Date.now();

      // Step 3: Verify performance and results
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

      const tiktokAccounts = response.body.data.filter(
        (account: any) => account.platform === 'TIKTOK'
      );
      expect(tiktokAccounts).toHaveLength(5);

      // Cleanup
      await Promise.all(
        accounts.map(account => 
          prisma.socialAccount.delete({ where: { id: account.id } })
        )
      );
    });
  });
});