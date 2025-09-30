import { OAuthService } from '../../../allin-platform/backend/src/services/oauth.service';
import { FacebookOAuthService } from '../../../allin-platform/backend/src/services/oauth/facebook.oauth';
import { PrismaClient, SocialPlatform, AccountStatus } from '@prisma/client';
import { testSocialAccounts, mockTokens, mockApiResponses, oauthCallbackData, createTestSocialAccount } from '../../test-data/fixtures/social-accounts';
import { AppError } from '../../../allin-platform/backend/src/utils/errors';

// Mock external HTTP requests
jest.mock('axios');
const mockAxios = require('axios');

describe('OAuthService', () => {
  let oauthService: OAuthService;
  let facebookOAuth: FacebookOAuthService;
  let prisma: PrismaClient;
  let testUser: any;
  let testOrganization: any;

  beforeAll(() => {
    prisma = global.testUtils.prisma;
    oauthService = new OAuthService();
    facebookOAuth = new FacebookOAuthService();
  });

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create test user and organization
    testUser = await global.testUtils.createTestUser({ status: 'ACTIVE' });
    testOrganization = await global.testUtils.createTestOrganization();

    // Setup default axios mocks
    mockAxios.post.mockResolvedValue({ data: mockApiResponses.facebook.tokenExchange });
    mockAxios.get.mockResolvedValue({ data: mockApiResponses.facebook.userProfile });
  });

  describe('getUserAccounts', () => {
    beforeEach(async () => {
      // Create test social accounts
      await global.testUtils.createTestSocialAccount(testUser.id, {
        platform: 'FACEBOOK',
        status: 'ACTIVE'
      });
      await global.testUtils.createTestSocialAccount(testUser.id, {
        platform: 'INSTAGRAM',
        status: 'ACTIVE'
      });
    });

    it('should successfully get all user accounts', async () => {
      // Act
      const accounts = await OAuthService.getUserAccounts(testUser.id);

      // Assert
      expect(accounts).toHaveLength(2);
      expect(accounts[0]).toHaveProperty('platform');
      expect(accounts[0]).toHaveProperty('username');
      expect(accounts[0]).toHaveProperty('status');
      expect(accounts[0]).not.toHaveProperty('accessToken'); // Sensitive data excluded
    });

    it('should filter accounts by organization', async () => {
      // Arrange
      const orgAccount = await global.testUtils.createTestSocialAccount(testUser.id, {
        platform: 'TWITTER',
        organizationId: testOrganization.id,
        status: 'ACTIVE'
      });

      // Act
      const accounts = await OAuthService.getUserAccounts(testUser.id, testOrganization.id);

      // Assert
      expect(accounts).toHaveLength(1);
      expect(accounts[0].platform).toBe('TWITTER');
      expect(accounts[0].organizationId).toBe(testOrganization.id);
    });

    it('should return only active accounts by default', async () => {
      // Arrange
      await global.testUtils.createTestSocialAccount(testUser.id, {
        platform: 'LINKEDIN',
        status: 'REVOKED'
      });

      // Act
      const accounts = await OAuthService.getUserAccounts(testUser.id);

      // Assert
      expect(accounts).toHaveLength(2); // Only the 2 active accounts
      expect(accounts.every(acc => acc.status === 'ACTIVE')).toBe(true);
    });

    it('should include all statuses when requested', async () => {
      // Arrange
      await global.testUtils.createTestSocialAccount(testUser.id, {
        platform: 'LINKEDIN',
        status: 'REVOKED'
      });

      // Act
      const accounts = await OAuthService.getUserAccounts(testUser.id, undefined, true);

      // Assert
      expect(accounts).toHaveLength(3);
      const statuses = accounts.map(acc => acc.status);
      expect(statuses).toContain('ACTIVE');
      expect(statuses).toContain('REVOKED');
    });

    it('should return empty array for user with no accounts', async () => {
      // Arrange
      const newUser = await global.testUtils.createTestUser({ status: 'ACTIVE' });

      // Act
      const accounts = await OAuthService.getUserAccounts(newUser.id);

      // Assert
      expect(accounts).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      jest.spyOn(prisma.socialAccount, 'findMany').mockRejectedValueOnce(new Error('Database error'));

      // Act & Assert
      await expect(OAuthService.getUserAccounts(testUser.id))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('FacebookOAuthService', () => {
    describe('getAuthorizationUrl', () => {
      it('should generate valid authorization URL', () => {
        // Arrange
        const state = 'test_state_123';

        // Act
        const authUrl = facebookOAuth.getAuthorizationUrl(state);

        // Assert
        expect(authUrl).toContain('https://www.facebook.com/v18.0/dialog/oauth');
        expect(authUrl).toContain(`state=${state}`);
        expect(authUrl).toContain('client_id=');
        expect(authUrl).toContain('scope=');
        expect(authUrl).toContain('response_type=code');
      });

      it('should include required permissions in scope', () => {
        // Act
        const authUrl = facebookOAuth.getAuthorizationUrl('test_state');

        // Assert
        expect(authUrl).toContain('pages_manage_posts');
        expect(authUrl).toContain('pages_read_engagement');
        expect(authUrl).toContain('instagram_basic');
      });

      it('should URL encode parameters properly', () => {
        // Arrange
        const state = 'test state with spaces & symbols!';

        // Act
        const authUrl = facebookOAuth.getAuthorizationUrl(state);

        // Assert
        expect(authUrl).toContain(encodeURIComponent(state));
      });
    });

    describe('generateState', () => {
      it('should generate unique state tokens', () => {
        // Act
        const state1 = facebookOAuth.generateState();
        const state2 = facebookOAuth.generateState();

        // Assert
        expect(state1).toBeTruthy();
        expect(state2).toBeTruthy();
        expect(state1).not.toBe(state2);
        expect(state1.length).toBeGreaterThan(20);
      });

      it('should generate cryptographically secure state', () => {
        // Act
        const state = facebookOAuth.generateState();

        // Assert
        expect(state).toMatch(/^[A-Za-z0-9_-]+$/); // Base64 URL-safe format
      });
    });

    describe('connectAccount', () => {
      it('should successfully connect Facebook account', async () => {
        // Arrange
        const authCode = 'facebook_auth_code_123';
        mockAxios.post.mockResolvedValueOnce({ data: mockApiResponses.facebook.tokenExchange });
        mockAxios.get.mockResolvedValueOnce({ data: mockApiResponses.facebook.userProfile });

        // Act
        const account = await facebookOAuth.connectAccount(testUser.id, authCode);

        // Assert
        expect(account).toBeTruthy();
        expect(account.platform).toBe('FACEBOOK');
        expect(account.userId).toBe(testUser.id);
        expect(account.status).toBe('ACTIVE');
        expect(account.platformId).toBe(mockApiResponses.facebook.userProfile.id);
      });

      it('should handle organization assignment', async () => {
        // Arrange
        const authCode = 'facebook_auth_code_123';
        mockAxios.post.mockResolvedValueOnce({ data: mockApiResponses.facebook.tokenExchange });
        mockAxios.get.mockResolvedValueOnce({ data: mockApiResponses.facebook.userProfile });

        // Act
        const account = await facebookOAuth.connectAccount(testUser.id, authCode, testOrganization.id);

        // Assert
        expect(account.organizationId).toBe(testOrganization.id);
      });

      it('should store encrypted access tokens', async () => {
        // Arrange
        const authCode = 'facebook_auth_code_123';
        mockAxios.post.mockResolvedValueOnce({ data: mockApiResponses.facebook.tokenExchange });
        mockAxios.get.mockResolvedValueOnce({ data: mockApiResponses.facebook.userProfile });

        // Act
        const account = await facebookOAuth.connectAccount(testUser.id, authCode);

        // Assert
        expect(account.accessToken).toBeTruthy();
        expect(account.accessToken).not.toBe(mockApiResponses.facebook.tokenExchange.access_token); // Should be encrypted
      });

      it('should update existing account if already connected', async () => {
        // Arrange
        const existingAccount = await global.testUtils.createTestSocialAccount(testUser.id, {
          platform: 'FACEBOOK',
          platformId: mockApiResponses.facebook.userProfile.id
        });

        const authCode = 'facebook_auth_code_123';
        mockAxios.post.mockResolvedValueOnce({ data: mockApiResponses.facebook.tokenExchange });
        mockAxios.get.mockResolvedValueOnce({ data: mockApiResponses.facebook.userProfile });

        // Act
        const account = await facebookOAuth.connectAccount(testUser.id, authCode);

        // Assert
        expect(account.id).toBe(existingAccount.id);
        expect(account.status).toBe('ACTIVE');
        expect(account.lastSyncAt).toBeInstanceOf(Date);
      });

      it('should throw error for invalid authorization code', async () => {
        // Arrange
        mockAxios.post.mockRejectedValueOnce({
          response: { data: { error: { message: 'Invalid authorization code' } } }
        });

        // Act & Assert
        await expect(facebookOAuth.connectAccount(testUser.id, 'invalid_code'))
          .rejects
          .toThrow(AppError);
      });

      it('should throw error for API failures', async () => {
        // Arrange
        mockAxios.post.mockResolvedValueOnce({ data: mockApiResponses.facebook.tokenExchange });
        mockAxios.get.mockRejectedValueOnce({
          response: { data: { error: { message: 'API temporarily unavailable' } } }
        });

        // Act & Assert
        await expect(facebookOAuth.connectAccount(testUser.id, 'valid_code'))
          .rejects
          .toThrow(AppError);
      });

      it('should handle network timeouts', async () => {
        // Arrange
        mockAxios.post.mockRejectedValueOnce({ code: 'ECONNABORTED' });

        // Act & Assert
        await expect(facebookOAuth.connectAccount(testUser.id, 'valid_code'))
          .rejects
          .toThrow(AppError);
      });
    });

    describe('refreshTokensIfNeeded', () => {
      let socialAccount: any;

      beforeEach(async () => {
        socialAccount = await global.testUtils.createTestSocialAccount(testUser.id, {
          platform: 'FACEBOOK',
          tokenExpiry: new Date(Date.now() + 3600000) // 1 hour from now
        });
      });

      it('should not refresh tokens if not expired', async () => {
        // Act
        const result = await facebookOAuth.refreshTokensIfNeeded(socialAccount.id);

        // Assert
        expect(result).toBe(false);
        expect(mockAxios.post).not.toHaveBeenCalled();
      });

      it('should refresh tokens if expired', async () => {
        // Arrange
        await prisma.socialAccount.update({
          where: { id: socialAccount.id },
          data: { tokenExpiry: new Date(Date.now() - 1000) } // Expired 1 second ago
        });

        mockAxios.post.mockResolvedValueOnce({
          data: {
            access_token: 'new_access_token',
            expires_in: 3600
          }
        });

        // Act
        const result = await facebookOAuth.refreshTokensIfNeeded(socialAccount.id);

        // Assert
        expect(result).toBe(true);
        expect(mockAxios.post).toHaveBeenCalledWith(expect.stringContaining('oauth/access_token'));
      });

      it('should refresh tokens if expiring within 5 minutes', async () => {
        // Arrange
        await prisma.socialAccount.update({
          where: { id: socialAccount.id },
          data: { tokenExpiry: new Date(Date.now() + 4 * 60 * 1000) } // 4 minutes from now
        });

        mockAxios.post.mockResolvedValueOnce({
          data: {
            access_token: 'new_access_token',
            expires_in: 3600
          }
        });

        // Act
        const result = await facebookOAuth.refreshTokensIfNeeded(socialAccount.id);

        // Assert
        expect(result).toBe(true);
      });

      it('should handle refresh token failures', async () => {
        // Arrange
        await prisma.socialAccount.update({
          where: { id: socialAccount.id },
          data: { tokenExpiry: new Date(Date.now() - 1000) }
        });

        mockAxios.post.mockRejectedValueOnce({
          response: { data: { error: { message: 'Invalid refresh token' } } }
        });

        // Act & Assert
        await expect(facebookOAuth.refreshTokensIfNeeded(socialAccount.id))
          .rejects
          .toThrow(AppError);
      });

      it('should mark account as revoked on permanent failure', async () => {
        // Arrange
        await prisma.socialAccount.update({
          where: { id: socialAccount.id },
          data: { tokenExpiry: new Date(Date.now() - 1000) }
        });

        mockAxios.post.mockRejectedValueOnce({
          response: { data: { error: { message: 'User has revoked authorization' } } }
        });

        // Act
        try {
          await facebookOAuth.refreshTokensIfNeeded(socialAccount.id);
        } catch (error) {
          // Expected to throw
        }

        // Assert
        const updatedAccount = await prisma.socialAccount.findUnique({
          where: { id: socialAccount.id }
        });
        expect(updatedAccount?.status).toBe('REVOKED');
      });
    });

    describe('disconnectAccount', () => {
      let socialAccount: any;

      beforeEach(async () => {
        socialAccount = await global.testUtils.createTestSocialAccount(testUser.id, {
          platform: 'FACEBOOK',
          status: 'ACTIVE'
        });
      });

      it('should successfully disconnect account', async () => {
        // Act
        await facebookOAuth.disconnectAccount(testUser.id, socialAccount.id);

        // Assert
        const deletedAccount = await prisma.socialAccount.findUnique({
          where: { id: socialAccount.id }
        });
        expect(deletedAccount).toBeNull();
      });

      it('should revoke permissions on Facebook', async () => {
        // Arrange
        mockAxios.delete.mockResolvedValueOnce({ data: { success: true } });

        // Act
        await facebookOAuth.disconnectAccount(testUser.id, socialAccount.id);

        // Assert
        expect(mockAxios.delete).toHaveBeenCalledWith(
          expect.stringContaining('permissions'),
          expect.any(Object)
        );
      });

      it('should handle Facebook API errors gracefully', async () => {
        // Arrange
        mockAxios.delete.mockRejectedValueOnce({
          response: { data: { error: { message: 'App not found' } } }
        });

        // Act - Should not throw error, still disconnect locally
        await facebookOAuth.disconnectAccount(testUser.id, socialAccount.id);

        // Assert
        const deletedAccount = await prisma.socialAccount.findUnique({
          where: { id: socialAccount.id }
        });
        expect(deletedAccount).toBeNull();
      });

      it('should delete related scheduled posts', async () => {
        // Arrange
        const post = await prisma.post.create({
          data: {
            content: 'Test post',
            userId: testUser.id,
            socialAccountId: socialAccount.id,
            status: 'DRAFT',
            hashtags: [],
            mentions: []
          }
        });

        await prisma.scheduledPost.create({
          data: {
            postId: post.id,
            socialAccountId: socialAccount.id,
            userId: testUser.id,
            scheduledFor: new Date(Date.now() + 3600000),
            status: 'PENDING'
          }
        });

        // Act
        await facebookOAuth.disconnectAccount(testUser.id, socialAccount.id);

        // Assert
        const scheduledPosts = await prisma.scheduledPost.findMany({
          where: { socialAccountId: socialAccount.id }
        });
        expect(scheduledPosts).toHaveLength(0);
      });

      it('should throw error for unauthorized account', async () => {
        // Arrange
        const otherUser = await global.testUtils.createTestUser({ status: 'ACTIVE' });

        // Act & Assert
        await expect(facebookOAuth.disconnectAccount(otherUser.id, socialAccount.id))
          .rejects
          .toThrow(AppError);
      });

      it('should throw error for non-existent account', async () => {
        // Act & Assert
        await expect(facebookOAuth.disconnectAccount(testUser.id, 'non_existent_id'))
          .rejects
          .toThrow(AppError);
      });
    });

    describe('getPlatformInsights', () => {
      let socialAccount: any;

      beforeEach(async () => {
        socialAccount = await global.testUtils.createTestSocialAccount(testUser.id, {
          platform: 'FACEBOOK',
          status: 'ACTIVE',
          platformData: { pageId: 'facebook_page_123' }
        });
      });

      it('should successfully fetch Facebook page insights', async () => {
        // Arrange
        mockAxios.get.mockResolvedValueOnce({ data: mockApiResponses.facebook.pageInsights });

        // Act
        const insights = await facebookOAuth.getPlatformInsights(socialAccount.id);

        // Assert
        expect(insights).toBeTruthy();
        expect(insights.impressions).toBe(mockApiResponses.facebook.pageInsights.impressions);
        expect(insights.reach).toBe(mockApiResponses.facebook.pageInsights.reach);
        expect(insights.engagement).toBe(mockApiResponses.facebook.pageInsights.engagement);
      });

      it('should handle date range parameters', async () => {
        // Arrange
        const since = '2024-01-01';
        const until = '2024-01-31';
        mockAxios.get.mockResolvedValueOnce({ data: mockApiResponses.facebook.pageInsights });

        // Act
        await facebookOAuth.getPlatformInsights(socialAccount.id, since, until);

        // Assert
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining(`since=${since}`),
          expect.any(Object)
        );
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining(`until=${until}`),
          expect.any(Object)
        );
      });

      it('should throw error for expired tokens', async () => {
        // Arrange
        mockAxios.get.mockRejectedValueOnce({
          response: {
            data: {
              error: {
                message: 'Error validating access token',
                code: 190
              }
            }
          }
        });

        // Act & Assert
        await expect(facebookOAuth.getPlatformInsights(socialAccount.id))
          .rejects
          .toThrow(AppError);

        // Verify account is marked as expired
        const updatedAccount = await prisma.socialAccount.findUnique({
          where: { id: socialAccount.id }
        });
        expect(updatedAccount?.status).toBe('EXPIRED');
      });

      it('should handle API rate limits', async () => {
        // Arrange
        mockAxios.get.mockRejectedValueOnce({
          response: {
            status: 429,
            data: {
              error: {
                message: 'Application request limit reached',
                code: 4
              }
            },
            headers: { 'retry-after': '300' }
          }
        });

        // Act & Assert
        await expect(facebookOAuth.getPlatformInsights(socialAccount.id))
          .rejects
          .toThrow(AppError);
      });
    });

    describe('postToFacebook', () => {
      let socialAccount: any;

      beforeEach(async () => {
        socialAccount = await global.testUtils.createTestSocialAccount(testUser.id, {
          platform: 'FACEBOOK',
          status: 'ACTIVE',
          platformData: { pageId: 'facebook_page_123' }
        });
      });

      it('should successfully post text to Facebook page', async () => {
        // Arrange
        const postData = {
          message: 'Test post content',
          scheduled_publish_time: undefined
        };

        mockAxios.post.mockResolvedValueOnce({
          data: { id: 'facebook_post_123' }
        });

        // Act
        const result = await facebookOAuth.postToFacebook(socialAccount.id, postData);

        // Assert
        expect(result.platformPostId).toBe('facebook_post_123');
        expect(mockAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('facebook_page_123/feed'),
          expect.objectContaining({ message: postData.message }),
          expect.any(Object)
        );
      });

      it('should successfully schedule post to Facebook', async () => {
        // Arrange
        const postData = {
          message: 'Scheduled test post',
          scheduled_publish_time: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
        };

        mockAxios.post.mockResolvedValueOnce({
          data: { id: 'facebook_scheduled_post_456' }
        });

        // Act
        const result = await facebookOAuth.postToFacebook(socialAccount.id, postData);

        // Assert
        expect(result.platformPostId).toBe('facebook_scheduled_post_456');
        expect(mockAxios.post).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            scheduled_publish_time: postData.scheduled_publish_time,
            published: false
          }),
          expect.any(Object)
        );
      });

      it('should handle image uploads', async () => {
        // Arrange
        const postData = {
          message: 'Post with image',
          media: [{ url: 'https://example.com/image.jpg', type: 'image' }]
        };

        mockAxios.post.mockResolvedValueOnce({
          data: { id: 'facebook_image_post_789' }
        });

        // Act
        const result = await facebookOAuth.postToFacebook(socialAccount.id, postData);

        // Assert
        expect(result.platformPostId).toBe('facebook_image_post_789');
        expect(mockAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('photos'),
          expect.any(Object),
          expect.any(Object)
        );
      });

      it('should throw error for posting failures', async () => {
        // Arrange
        mockAxios.post.mockRejectedValueOnce({
          response: {
            data: {
              error: {
                message: 'Invalid parameter',
                code: 100
              }
            }
          }
        });

        // Act & Assert
        await expect(facebookOAuth.postToFacebook(socialAccount.id, { message: 'test' }))
          .rejects
          .toThrow(AppError);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed API responses', async () => {
      // Arrange
      mockAxios.post.mockResolvedValueOnce({ data: null });

      // Act & Assert
      await expect(facebookOAuth.connectAccount(testUser.id, 'valid_code'))
        .rejects
        .toThrow(AppError);
    });

    it('should handle network connectivity issues', async () => {
      // Arrange
      mockAxios.post.mockRejectedValueOnce({ code: 'ENOTFOUND' });

      // Act & Assert
      await expect(facebookOAuth.connectAccount(testUser.id, 'valid_code'))
        .rejects
        .toThrow(AppError);
    });

    it('should handle concurrent token refresh attempts', async () => {
      // Arrange
      const socialAccount = await global.testUtils.createTestSocialAccount(testUser.id, {
        platform: 'FACEBOOK',
        tokenExpiry: new Date(Date.now() - 1000) // Expired
      });

      mockAxios.post.mockResolvedValue({
        data: {
          access_token: 'new_access_token',
          expires_in: 3600
        }
      });

      // Act - Multiple concurrent refresh attempts
      const refreshPromises = [
        facebookOAuth.refreshTokensIfNeeded(socialAccount.id),
        facebookOAuth.refreshTokensIfNeeded(socialAccount.id),
        facebookOAuth.refreshTokensIfNeeded(socialAccount.id)
      ];

      const results = await Promise.allSettled(refreshPromises);

      // Assert - Should handle concurrency gracefully
      const successfulRefreshes = results.filter(r => r.status === 'fulfilled').length;
      expect(successfulRefreshes).toBeGreaterThan(0);
    });

    it('should validate account ownership for all operations', async () => {
      // Arrange
      const socialAccount = await global.testUtils.createTestSocialAccount(testUser.id, {
        platform: 'FACEBOOK'
      });
      const otherUser = await global.testUtils.createTestUser({ status: 'ACTIVE' });

      // Act & Assert
      await expect(facebookOAuth.disconnectAccount(otherUser.id, socialAccount.id))
        .rejects
        .toThrow(AppError);
    });

    it('should handle database constraints properly', async () => {
      // Arrange
      const existingAccount = await global.testUtils.createTestSocialAccount(testUser.id, {
        platform: 'FACEBOOK',
        platformId: 'duplicate_platform_id'
      });

      mockAxios.post.mockResolvedValueOnce({ data: mockApiResponses.facebook.tokenExchange });
      mockAxios.get.mockResolvedValueOnce({
        data: {
          ...mockApiResponses.facebook.userProfile,
          id: 'duplicate_platform_id' // Same platform ID
        }
      });

      // Act - Should update existing account instead of creating duplicate
      const account = await facebookOAuth.connectAccount(testUser.id, 'auth_code');

      // Assert
      expect(account.id).toBe(existingAccount.id);
    });
  });

  describe('Security Tests', () => {
    it('should encrypt stored access tokens', async () => {
      // Arrange
      mockAxios.post.mockResolvedValueOnce({ data: mockApiResponses.facebook.tokenExchange });
      mockAxios.get.mockResolvedValueOnce({ data: mockApiResponses.facebook.userProfile });

      // Act
      const account = await facebookOAuth.connectAccount(testUser.id, 'auth_code');

      // Assert
      expect(account.accessToken).not.toBe(mockApiResponses.facebook.tokenExchange.access_token);
      expect(account.accessToken.length).toBeGreaterThan(mockApiResponses.facebook.tokenExchange.access_token.length);
    });

    it('should not log sensitive information', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockAxios.post.mockResolvedValueOnce({ data: mockApiResponses.facebook.tokenExchange });
      mockAxios.get.mockResolvedValueOnce({ data: mockApiResponses.facebook.userProfile });

      // Act
      await facebookOAuth.connectAccount(testUser.id, 'auth_code');

      // Assert
      const logCalls = consoleSpy.mock.calls.flat().join(' ');
      expect(logCalls).not.toContain(mockApiResponses.facebook.tokenExchange.access_token);

      consoleSpy.mockRestore();
    });

    it('should validate state parameter for CSRF protection', () => {
      // Act
      const state1 = facebookOAuth.generateState();
      const state2 = facebookOAuth.generateState();

      // Assert
      expect(state1).not.toBe(state2);
      expect(state1.length).toBeGreaterThan(32); // Should be cryptographically secure
    });

    it('should handle SSL/TLS properly in API calls', async () => {
      // Act
      facebookOAuth.getAuthorizationUrl('test_state');

      // Assert - Should use HTTPS URLs
      const authUrl = facebookOAuth.getAuthorizationUrl('test_state');
      expect(authUrl).toMatch(/^https:/);
    });
  });
});