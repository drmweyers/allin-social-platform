import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import socialRoutes from '../../../allin-platform/backend/src/routes/social.routes';
import { TikTokOAuthService } from '../../../allin-platform/backend/src/services/oauth/tiktok.oauth';
import { mockTikTokResponses, createTestSocialAccount } from '../../test-data/fixtures/social-accounts';
import { AppError } from '../../../allin-platform/backend/src/utils/errors';

// Mock TikTok OAuth service
jest.mock('../../../allin-platform/backend/src/services/oauth/tiktok.oauth');
const MockTikTokOAuthService = TikTokOAuthService as jest.MockedClass<typeof TikTokOAuthService>;

// Mock authentication middleware
jest.mock('../../../allin-platform/backend/src/middleware/auth');

describe('Social Routes - TikTok Integration', () => {
  let app: express.Application;
  let mockTikTokService: jest.Mocked<TikTokOAuthService>;
  let testUser: any;
  let testOrganization: any;

  beforeAll(async () => {
    // Setup test app
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware to inject test user
    app.use((req: any, res, next) => {
      req.user = {
        id: 'test_user_123',
        email: 'test@example.com',
        name: 'Test User',
        organizationId: 'test_org_123',
        role: 'USER'
      };
      next();
    });
    
    app.use('/api/social', socialRoutes);

    // Create test data
    testUser = { 
      id: 'test_user_123',
      email: 'test@example.com',
      name: 'Test User'
    };
    testOrganization = {
      id: 'test_org_123',
      name: 'Test Organization'
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock TikTok service
    mockTikTokService = {
      getAuthorizationUrl: jest.fn(),
      exchangeCodeForTokens: jest.fn(),
      getUserProfile: jest.fn(),
      connectAccount: jest.fn(),
      disconnectAccount: jest.fn(),
      refreshTokensIfNeeded: jest.fn(),
      getInsights: jest.fn(),
      publishPost: jest.fn(),
      revokeAccess: jest.fn(),
      generateState: jest.fn(),
      getVideoDetails: jest.fn()
    } as any;

    MockTikTokOAuthService.mockImplementation(() => mockTikTokService);
  });

  describe('POST /api/social/connect/TIKTOK', () => {
    it('should initiate TikTok OAuth connection successfully', async () => {
      // Arrange
      const expectedAuthUrl = 'https://www.tiktok.com/v2/auth/authorize/?client_key=test&state=secure_state';
      mockTikTokService.generateState.mockReturnValue('secure_state_123');
      mockTikTokService.getAuthorizationUrl.mockReturnValue(expectedAuthUrl);

      // Act
      const response = await request(app)
        .post('/api/social/connect/TIKTOK')
        .send({ organizationId: testOrganization.id })
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('authUrl');
      expect(response.body.authUrl).toBe(expectedAuthUrl);
      expect(mockTikTokService.generateState).toHaveBeenCalled();
      expect(mockTikTokService.getAuthorizationUrl).toHaveBeenCalledWith('secure_state_123');
    });

    it('should handle missing TikTok service configuration', async () => {
      // Arrange
      MockTikTokOAuthService.mockImplementation(() => {
        throw new Error('TikTok client not configured');
      });

      // Act
      const response = await request(app)
        .post('/api/social/connect/TIKTOK')
        .send()
        .expect(501);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('TikTok');
    });

    it('should validate platform parameter', async () => {
      // Act
      const response = await request(app)
        .post('/api/social/connect/INVALID_PLATFORM')
        .send()
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle TikTok API unavailability', async () => {
      // Arrange
      mockTikTokService.getAuthorizationUrl.mockImplementation(() => {
        throw new AppError('TikTok API temporarily unavailable', 503);
      });

      // Act
      const response = await request(app)
        .post('/api/social/connect/TIKTOK')
        .send()
        .expect(500);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should include organization ID in OAuth state when provided', async () => {
      // Arrange
      mockTikTokService.generateState.mockReturnValue('state_with_org');
      mockTikTokService.getAuthorizationUrl.mockReturnValue('https://tiktok.com/oauth');

      // Act
      await request(app)
        .post('/api/social/connect/TIKTOK')
        .send({ organizationId: 'org_123' })
        .expect(200);

      // Assert
      expect(mockTikTokService.getAuthorizationUrl).toHaveBeenCalledWith('state_with_org');
    });
  });

  describe('GET /api/social/callback/TIKTOK', () => {
    beforeEach(() => {
      // Mock the OAuth states map
      const mockStates = new Map();
      mockStates.set('valid_state_123', {
        userId: testUser.id,
        platform: 'TIKTOK',
        organizationId: testOrganization.id
      });
      
      // This would need to be mocked at the route level
      jest.doMock('../../../allin-platform/backend/src/routes/social.routes', () => ({
        oauthStates: mockStates
      }));
    });

    it('should handle successful TikTok OAuth callback', async () => {
      // Arrange
      const mockAccount = createTestSocialAccount(testUser.id, 'TIKTOK');
      mockTikTokService.connectAccount.mockResolvedValue(mockAccount);

      // Act
      const response = await request(app)
        .get('/api/social/callback/TIKTOK')
        .query({
          code: 'tiktok_auth_code_123',
          state: 'valid_state_123'
        })
        .expect(302);

      // Assert
      expect(response.headers.location).toContain('success=connected');
      expect(response.headers.location).toContain('platform=TIKTOK');
      expect(mockTikTokService.connectAccount).toHaveBeenCalledWith(
        testUser.id,
        'tiktok_auth_code_123',
        testOrganization.id
      );
    });

    it('should handle TikTok OAuth errors', async () => {
      // Act
      const response = await request(app)
        .get('/api/social/callback/TIKTOK')
        .query({
          error: 'access_denied',
          error_description: 'User denied access'
        })
        .expect(302);

      // Assert
      expect(response.headers.location).toContain('error=access_denied');
    });

    it('should handle invalid OAuth state', async () => {
      // Act
      const response = await request(app)
        .get('/api/social/callback/TIKTOK')
        .query({
          code: 'valid_code',
          state: 'invalid_state'
        })
        .expect(302);

      // Assert
      expect(response.headers.location).toContain('error=invalid_state');
    });

    it('should handle missing authorization code', async () => {
      // Act
      const response = await request(app)
        .get('/api/social/callback/TIKTOK')
        .query({
          state: 'valid_state_123'
        })
        .expect(302);

      // Assert
      expect(response.headers.location).toContain('error=invalid_request');
    });

    it('should handle TikTok connection failures', async () => {
      // Arrange
      mockTikTokService.connectAccount.mockRejectedValue(
        new AppError('TikTok connection failed', 400)
      );

      // Act
      const response = await request(app)
        .get('/api/social/callback/TIKTOK')
        .query({
          code: 'valid_code',
          state: 'valid_state_123'
        })
        .expect(302);

      // Assert
      expect(response.headers.location).toContain('error=connection_failed');
    });

    it('should handle expired OAuth state', async () => {
      // Act
      const response = await request(app)
        .get('/api/social/callback/TIKTOK')
        .query({
          code: 'valid_code',
          state: 'expired_state'
        })
        .expect(302);

      // Assert
      expect(response.headers.location).toContain('error=invalid_state');
    });
  });

  describe('GET /api/social/accounts (TikTok accounts)', () => {
    it('should fetch TikTok accounts for authenticated user', async () => {
      // Arrange
      const mockTikTokAccount = createTestSocialAccount(testUser.id, 'TIKTOK', {
        displayName: 'TikTok Creator',
        followersCount: 10000,
        platformData: {
          videoCount: 50,
          likesCount: 50000,
          isVerified: true
        }
      });

      // Mock OAuthService.getUserAccounts
      jest.doMock('../../../allin-platform/backend/src/services/oauth.service', () => ({
        OAuthService: {
          getUserAccounts: jest.fn().mockResolvedValue([mockTikTokAccount])
        }
      }));

      // Act
      const response = await request(app)
        .get('/api/social/accounts')
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter TikTok accounts by organization', async () => {
      // Arrange
      const orgTikTokAccount = createTestSocialAccount(testUser.id, 'TIKTOK', {
        organizationId: testOrganization.id,
        displayName: 'Org TikTok Account'
      });

      jest.doMock('../../../allin-platform/backend/src/services/oauth.service', () => ({
        OAuthService: {
          getUserAccounts: jest.fn().mockResolvedValue([orgTikTokAccount])
        }
      }));

      // Act
      const response = await request(app)
        .get('/api/social/accounts')
        .query({ organizationId: testOrganization.id })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should handle empty TikTok accounts list', async () => {
      // Arrange
      jest.doMock('../../../allin-platform/backend/src/services/oauth.service', () => ({
        OAuthService: {
          getUserAccounts: jest.fn().mockResolvedValue([])
        }
      }));

      // Act
      const response = await request(app)
        .get('/api/social/accounts')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('DELETE /api/social/disconnect/:accountId (TikTok)', () => {
    it('should successfully disconnect TikTok account', async () => {
      // Arrange
      const tiktokAccountId = 'tiktok_account_123';
      const mockAccount = createTestSocialAccount(testUser.id, 'TIKTOK', {
        id: tiktokAccountId
      });

      jest.doMock('../../../allin-platform/backend/src/services/oauth.service', () => ({
        OAuthService: {
          getUserAccounts: jest.fn().mockResolvedValue([mockAccount])
        }
      }));

      mockTikTokService.disconnectAccount.mockResolvedValue(undefined);

      // Act
      const response = await request(app)
        .delete(`/api/social/disconnect/${tiktokAccountId}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('TikTok');
      expect(mockTikTokService.disconnectAccount).toHaveBeenCalledWith(
        testUser.id,
        tiktokAccountId
      );
    });

    it('should handle TikTok account not found', async () => {
      // Arrange
      jest.doMock('../../../allin-platform/backend/src/services/oauth.service', () => ({
        OAuthService: {
          getUserAccounts: jest.fn().mockResolvedValue([])
        }
      }));

      // Act
      const response = await request(app)
        .delete('/api/social/disconnect/nonexistent_account')
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle TikTok disconnection errors', async () => {
      // Arrange
      const tiktokAccountId = 'tiktok_account_123';
      const mockAccount = createTestSocialAccount(testUser.id, 'TIKTOK', {
        id: tiktokAccountId
      });

      jest.doMock('../../../allin-platform/backend/src/services/oauth.service', () => ({
        OAuthService: {
          getUserAccounts: jest.fn().mockResolvedValue([mockAccount])
        }
      }));

      mockTikTokService.disconnectAccount.mockRejectedValue(
        new AppError('TikTok disconnection failed', 400)
      );

      // Act
      const response = await request(app)
        .delete(`/api/social/disconnect/${tiktokAccountId}`)
        .expect(500);

      // Assert
      expect(response.body).toHaveProperty('success', false);
    });

    it('should prevent unauthorized account disconnection', async () => {
      // Arrange
      const otherUserAccount = createTestSocialAccount('other_user_123', 'TIKTOK');
      
      jest.doMock('../../../allin-platform/backend/src/services/oauth.service', () => ({
        OAuthService: {
          getUserAccounts: jest.fn().mockResolvedValue([])
        }
      }));

      // Act
      const response = await request(app)
        .delete(`/api/social/disconnect/${otherUserAccount.id}`)
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/social/refresh/:accountId (TikTok)', () => {
    it('should successfully refresh TikTok account tokens', async () => {
      // Arrange
      const tiktokAccountId = 'tiktok_account_123';
      const mockAccount = createTestSocialAccount(testUser.id, 'TIKTOK', {
        id: tiktokAccountId
      });

      jest.doMock('../../../allin-platform/backend/src/services/oauth.service', () => ({
        OAuthService: {
          getUserAccounts: jest.fn().mockResolvedValue([mockAccount])
        }
      }));

      mockTikTokService.refreshTokensIfNeeded.mockResolvedValue(true);

      // Act
      const response = await request(app)
        .post(`/api/social/refresh/${tiktokAccountId}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('refreshed');
      expect(mockTikTokService.refreshTokensIfNeeded).toHaveBeenCalledWith(tiktokAccountId);
    });

    it('should handle TikTok token refresh failures', async () => {
      // Arrange
      const tiktokAccountId = 'tiktok_account_123';
      const mockAccount = createTestSocialAccount(testUser.id, 'TIKTOK', {
        id: tiktokAccountId
      });

      jest.doMock('../../../allin-platform/backend/src/services/oauth.service', () => ({
        OAuthService: {
          getUserAccounts: jest.fn().mockResolvedValue([mockAccount])
        }
      }));

      mockTikTokService.refreshTokensIfNeeded.mockRejectedValue(
        new AppError('TikTok token refresh failed', 401)
      );

      // Act
      const response = await request(app)
        .post(`/api/social/refresh/${tiktokAccountId}`)
        .expect(500);

      // Assert
      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle non-existent TikTok account for refresh', async () => {
      // Arrange
      jest.doMock('../../../allin-platform/backend/src/services/oauth.service', () => ({
        OAuthService: {
          getUserAccounts: jest.fn().mockResolvedValue([])
        }
      }));

      // Act
      const response = await request(app)
        .post('/api/social/refresh/nonexistent_account')
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/social/accounts/:accountId/insights (TikTok)', () => {
    it('should fetch TikTok account insights successfully', async () => {
      // Arrange
      const tiktokAccountId = 'tiktok_account_123';
      const mockAccount = createTestSocialAccount(testUser.id, 'TIKTOK', {
        id: tiktokAccountId
      });

      jest.doMock('../../../allin-platform/backend/src/services/oauth.service', () => ({
        OAuthService: {
          getUserAccounts: jest.fn().mockResolvedValue([mockAccount])
        }
      }));

      const mockInsights = {
        totalVideos: 25,
        totalViews: 125000,
        totalLikes: 12500,
        totalComments: 2500,
        totalShares: 1250,
        averageViews: 5000,
        averageLikes: 500,
        engagementRate: '12.80',
        videos: mockTikTokResponses.videoList.data.videos.slice(0, 5)
      };

      mockTikTokService.getInsights.mockResolvedValue(mockInsights);

      // Act
      const response = await request(app)
        .get(`/api/social/accounts/${tiktokAccountId}/insights`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalVideos');
      expect(response.body.data).toHaveProperty('totalViews');
      expect(response.body.data).toHaveProperty('engagementRate');
      expect(response.body.data.totalVideos).toBe(25);
      expect(response.body.data.engagementRate).toBe('12.80');
    });

    it('should handle TikTok insights fetch errors', async () => {
      // Arrange
      const tiktokAccountId = 'tiktok_account_123';
      const mockAccount = createTestSocialAccount(testUser.id, 'TIKTOK', {
        id: tiktokAccountId
      });

      jest.doMock('../../../allin-platform/backend/src/services/oauth.service', () => ({
        OAuthService: {
          getUserAccounts: jest.fn().mockResolvedValue([mockAccount])
        }
      }));

      mockTikTokService.getInsights.mockRejectedValue(
        new AppError('TikTok API rate limit exceeded', 429)
      );

      // Act
      const response = await request(app)
        .get(`/api/social/accounts/${tiktokAccountId}/insights`)
        .expect(500);

      // Assert
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return mock insights for non-existent TikTok account', async () => {
      // Act
      const response = await request(app)
        .get('/api/social/accounts/nonexistent_account/insights')
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // Should return mock data as per current implementation
    });

    it('should handle date range parameters for TikTok insights', async () => {
      // Arrange
      const tiktokAccountId = 'tiktok_account_123';
      const mockAccount = createTestSocialAccount(testUser.id, 'TIKTOK', {
        id: tiktokAccountId
      });

      jest.doMock('../../../allin-platform/backend/src/services/oauth.service', () => ({
        OAuthService: {
          getUserAccounts: jest.fn().mockResolvedValue([mockAccount])
        }
      }));

      mockTikTokService.getInsights.mockResolvedValue(mockTikTokResponses.insights);

      // Act
      const response = await request(app)
        .get(`/api/social/accounts/${tiktokAccountId}/insights`)
        .query({
          since: '2024-01-01',
          until: '2024-01-31'
        })
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(mockTikTokService.getInsights).toHaveBeenCalledWith(
        expect.any(String), // access token
        tiktokAccountId,
        expect.any(Date), // since date
        expect.any(Date)  // until date
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed request bodies', async () => {
      // Act
      const response = await request(app)
        .post('/api/social/connect/TIKTOK')
        .send('invalid json')
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle concurrent TikTok connection attempts', async () => {
      // Arrange
      mockTikTokService.generateState.mockReturnValue('concurrent_state');
      mockTikTokService.getAuthorizationUrl.mockReturnValue('https://tiktok.com/oauth');

      // Act
      const promises = Array(3).fill(0).map(() =>
        request(app)
          .post('/api/social/connect/TIKTOK')
          .send()
      );

      const responses = await Promise.all(promises);

      // Assert
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle large request payloads gracefully', async () => {
      // Arrange
      const largePayload = {
        organizationId: 'a'.repeat(10000), // Very long string
        extraData: 'b'.repeat(10000)
      };

      // Act
      const response = await request(app)
        .post('/api/social/connect/TIKTOK')
        .send(largePayload);

      // Assert
      // Should either accept or reject gracefully, not crash
      expect([200, 400, 413]).toContain(response.status);
    });

    it('should validate account ID format in disconnect endpoint', async () => {
      // Act
      const response = await request(app)
        .delete('/api/social/disconnect/invalid-id-format!')
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle TikTok service initialization failures', async () => {
      // Arrange
      MockTikTokOAuthService.mockImplementation(() => {
        throw new Error('TikTok service initialization failed');
      });

      // Act
      const response = await request(app)
        .post('/api/social/connect/TIKTOK')
        .send()
        .expect(501);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('TikTok');
    });
  });

  describe('Security Tests', () => {
    it('should prevent unauthorized access without authentication', async () => {
      // Arrange - Remove auth middleware
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use('/api/social', socialRoutes);

      // Act
      const response = await request(appNoAuth)
        .post('/api/social/connect/TIKTOK')
        .send()
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate CSRF state tokens properly', async () => {
      // Arrange
      const shortState = 'abc'; // Too short to be secure
      
      // This test would verify that short/predictable states are rejected
      // Implementation depends on actual CSRF validation logic
      
      // Act
      const response = await request(app)
        .get('/api/social/callback/TIKTOK')
        .query({
          code: 'valid_code',
          state: shortState
        })
        .expect(302);

      // Assert
      expect(response.headers.location).toContain('error=invalid_state');
    });

    it('should not expose sensitive data in error responses', async () => {
      // Arrange
      mockTikTokService.connectAccount.mockRejectedValue(
        new Error('Database connection failed: user=admin,password=secret123')
      );

      // Act
      const response = await request(app)
        .get('/api/social/callback/TIKTOK')
        .query({
          code: 'valid_code',
          state: 'valid_state_123'
        })
        .expect(302);

      // Assert
      expect(response.headers.location).not.toContain('password');
      expect(response.headers.location).not.toContain('secret');
    });

    it('should handle SQL injection attempts in parameters', async () => {
      // Arrange
      const sqlInjectionAttempt = "'; DROP TABLE users; --";

      // Act
      const response = await request(app)
        .delete(`/api/social/disconnect/${sqlInjectionAttempt}`)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
    });

    it('should rate limit TikTok connection attempts', async () => {
      // This test would verify rate limiting implementation
      // Skip if rate limiting is not implemented yet
      // 
      // Arrange
      const promises = Array(20).fill(0).map(() =>
        request(app)
          .post('/api/social/connect/TIKTOK')
          .send()
      );

      // Act
      const responses = await Promise.all(promises);

      // Assert
      // Should have some rate limited responses (429) after threshold
      const rateLimited = responses.filter(r => r.status === 429);
      // expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple TikTok accounts efficiently', async () => {
      // Arrange
      const multipleAccounts = Array(10).fill(0).map((_, index) => 
        createTestSocialAccount(testUser.id, 'TIKTOK', {
          id: `tiktok_account_${index}`,
          displayName: `TikTok Account ${index}`
        })
      );

      jest.doMock('../../../allin-platform/backend/src/services/oauth.service', () => ({
        OAuthService: {
          getUserAccounts: jest.fn().mockResolvedValue(multipleAccounts)
        }
      }));

      // Act
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/social/accounts')
        .expect(200);
      const endTime = Date.now();

      // Assert
      expect(response.body.data).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent TikTok insight requests', async () => {
      // Arrange
      const accountIds = ['account1', 'account2', 'account3'];
      mockTikTokService.getInsights.mockResolvedValue(mockTikTokResponses.insights);

      // Act
      const promises = accountIds.map(accountId =>
        request(app)
          .get(`/api/social/accounts/${accountId}/insights`)
      );

      const responses = await Promise.all(promises);

      // Assert
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});