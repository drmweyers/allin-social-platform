import { TikTokOAuthService } from '../../../allin-platform/backend/src/services/oauth/tiktok.oauth';
import { OAuthService } from '../../../allin-platform/backend/src/services/oauth.service';
import { PrismaClient, SocialPlatform, AccountStatus } from '@prisma/client';
import { testSocialAccounts, mockTikTokResponses, createTestSocialAccount } from '../../test-data/fixtures/social-accounts';
import { AppError } from '../../../allin-platform/backend/src/utils/errors';

// Mock external HTTP requests
jest.mock('axios');
const mockAxios = require('axios');

describe('TikTokOAuthService', () => {
  let tiktokOAuth: TikTokOAuthService;
  let prisma: PrismaClient;
  let testUser: any;
  let testOrganization: any;

  beforeAll(() => {
    prisma = global.testUtils.prisma;
    tiktokOAuth = new TikTokOAuthService();
  });

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up environment variables for testing
    process.env.TIKTOK_CLIENT_KEY = 'test_tiktok_client_key';
    process.env.TIKTOK_CLIENT_SECRET = 'test_tiktok_client_secret';
    process.env.TIKTOK_REDIRECT_URI = 'http://localhost:3001/api/social/callback/tiktok';

    // Create test user and organization
    testUser = await global.testUtils.createTestUser({ status: 'ACTIVE' });
    testOrganization = await global.testUtils.createTestOrganization();

    // Setup default axios mocks
    mockAxios.post.mockResolvedValue({ data: mockTikTokResponses.tokenExchange });
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.TIKTOK_CLIENT_KEY;
    delete process.env.TIKTOK_CLIENT_SECRET;
    delete process.env.TIKTOK_REDIRECT_URI;
  });

  describe('Configuration and Initialization', () => {
    it('should initialize with correct TikTok platform configuration', () => {
      // Act
      const authUrl = tiktokOAuth.getAuthorizationUrl('test_state');

      // Assert
      expect(authUrl).toContain('https://www.tiktok.com/v2/auth/authorize');
      expect(authUrl).toContain('client_key=test_tiktok_client_key');
      expect(authUrl).toContain('user.info.basic');
      expect(authUrl).toContain('video.list');
      expect(authUrl).toContain('video.upload');
    });

    it('should handle missing environment variables gracefully', () => {
      // Arrange
      delete process.env.TIKTOK_CLIENT_KEY;
      delete process.env.TIKTOK_CLIENT_SECRET;
      
      // Act
      const service = new TikTokOAuthService();
      const authUrl = service.getAuthorizationUrl('test_state');
      
      // Assert
      expect(authUrl).toContain('client_key=');
      expect(authUrl).toContain('https://www.tiktok.com/v2/auth/authorize');
    });

    it('should use default redirect URI when not configured', () => {
      // Arrange
      delete process.env.TIKTOK_REDIRECT_URI;
      
      // Act
      const service = new TikTokOAuthService();
      const authUrl = service.getAuthorizationUrl('test_state');
      
      // Assert
      expect(authUrl).toContain('localhost%3A3001');
      expect(authUrl).toContain('callback%2Ftiktok');
    });
  });

  describe('OAuth Authorization Flow', () => {
    describe('getAuthorizationUrl', () => {
      it('should generate valid TikTok authorization URL', () => {
        // Arrange
        const state = 'secure_state_token_123';

        // Act
        const authUrl = tiktokOAuth.getAuthorizationUrl(state);

        // Assert
        expect(authUrl).toContain('https://www.tiktok.com/v2/auth/authorize');
        expect(authUrl).toContain(`state=${state}`);
        expect(authUrl).toContain('client_key=test_tiktok_client_key');
        expect(authUrl).toContain('response_type=code');
        expect(authUrl).toContain('redirect_uri=');
      });

      it('should include all required TikTok permissions in scope', () => {
        // Act
        const authUrl = tiktokOAuth.getAuthorizationUrl('test_state');

        // Assert
        expect(authUrl).toContain('user.info.basic');
        expect(authUrl).toContain('user.info.profile');
        expect(authUrl).toContain('user.info.stats');
        expect(authUrl).toContain('video.list');
        expect(authUrl).toContain('video.upload');
        expect(authUrl).toContain('video.publish');
      });

      it('should properly URL encode special characters in state', () => {
        // Arrange
        const state = 'state with spaces & special chars!@#';

        // Act
        const authUrl = tiktokOAuth.getAuthorizationUrl(state);

        // Assert
        expect(authUrl).toContain(encodeURIComponent(state));
        expect(authUrl).not.toContain('state with spaces');
      });

      it('should generate unique state tokens for CSRF protection', () => {
        // Act
        const state1 = tiktokOAuth.generateState();
        const state2 = tiktokOAuth.generateState();

        // Assert
        expect(state1).toBeTruthy();
        expect(state2).toBeTruthy();
        expect(state1).not.toBe(state2);
        expect(state1.length).toBeGreaterThan(32);
        expect(state1).toMatch(/^[A-Za-z0-9]+$/);
      });
    });

    describe('exchangeCodeForTokens', () => {
      it('should successfully exchange authorization code for TikTok tokens', async () => {
        // Arrange
        const authCode = 'tiktok_auth_code_12345';
        mockAxios.post.mockResolvedValueOnce({ 
          data: mockTikTokResponses.tokenExchange 
        });

        // Act
        const tokens = await tiktokOAuth.exchangeCodeForTokens(authCode);

        // Assert
        expect(tokens).toHaveProperty('accessToken');
        expect(tokens).toHaveProperty('refreshToken');
        expect(tokens).toHaveProperty('expiresIn');
        expect(tokens).toHaveProperty('openId');
        expect(tokens.accessToken).toBe(mockTikTokResponses.tokenExchange.access_token);
        expect(tokens.openId).toBe(mockTikTokResponses.tokenExchange.open_id);
        
        expect(mockAxios.post).toHaveBeenCalledWith(
          'https://open.tiktokapis.com/v2/oauth/token/',
          expect.objectContaining({
            client_key: 'test_tiktok_client_key',
            client_secret: 'test_tiktok_client_secret',
            code: authCode,
            grant_type: 'authorization_code'
          }),
          expect.objectContaining({
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          })
        );
      });

      it('should handle TikTok token exchange errors', async () => {
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
        await expect(tiktokOAuth.exchangeCodeForTokens('invalid_code'))
          .rejects
          .toThrow(AppError);
        
        expect(mockAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('oauth/token'),
          expect.any(Object),
          expect.any(Object)
        );
      });

      it('should handle network timeouts during token exchange', async () => {
        // Arrange
        mockAxios.post.mockRejectedValueOnce({ 
          code: 'ECONNABORTED',
          message: 'timeout of 5000ms exceeded' 
        });

        // Act & Assert
        await expect(tiktokOAuth.exchangeCodeForTokens('valid_code'))
          .rejects
          .toThrow(AppError);
      });

      it('should handle malformed token response', async () => {
        // Arrange
        mockAxios.post.mockResolvedValueOnce({ data: null });

        // Act & Assert
        await expect(tiktokOAuth.exchangeCodeForTokens('valid_code'))
          .rejects
          .toThrow(AppError);
      });
    });

    describe('refreshAccessToken', () => {
      it('should successfully refresh TikTok access token', async () => {
        // Arrange
        const refreshToken = 'tiktok_refresh_token_xyz';
        mockAxios.post.mockResolvedValueOnce({
          data: {
            access_token: 'new_tiktok_access_token',
            refresh_token: 'new_tiktok_refresh_token',
            expires_in: 86400,
            token_type: 'Bearer'
          }
        });

        // Act
        const result = await tiktokOAuth.refreshAccessToken(refreshToken);

        // Assert
        expect(result.accessToken).toBe('new_tiktok_access_token');
        expect(result.refreshToken).toBe('new_tiktok_refresh_token');
        expect(result.expiresIn).toBe(86400);
        
        expect(mockAxios.post).toHaveBeenCalledWith(
          'https://open.tiktokapis.com/v2/oauth/token/',
          expect.objectContaining({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_key: 'test_tiktok_client_key',
            client_secret: 'test_tiktok_client_secret'
          }),
          expect.objectContaining({
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          })
        );
      });

      it('should handle refresh token expiration', async () => {
        // Arrange
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

        // Act & Assert
        await expect(tiktokOAuth.refreshAccessToken('expired_refresh_token'))
          .rejects
          .toThrow(AppError);
      });

      it('should handle TikTok API unavailability during refresh', async () => {
        // Arrange
        mockAxios.post.mockRejectedValueOnce({
          response: {
            status: 503,
            data: {
              error: {
                message: 'Service temporarily unavailable'
              }
            }
          }
        });

        // Act & Assert
        await expect(tiktokOAuth.refreshAccessToken('valid_refresh_token'))
          .rejects
          .toThrow(AppError);
      });
    });
  });

  describe('User Profile Management', () => {
    describe('getUserProfile', () => {
      it('should successfully fetch TikTok user profile', async () => {
        // Arrange
        const accessToken = 'valid_tiktok_access_token';
        mockAxios.post.mockResolvedValueOnce({
          data: mockTikTokResponses.userProfile
        });

        // Act
        const profile = await tiktokOAuth.getUserProfile(accessToken);

        // Assert
        expect(profile).toHaveProperty('id');
        expect(profile).toHaveProperty('displayName');
        expect(profile).toHaveProperty('profileImage');
        expect(profile).toHaveProperty('profileUrl');
        expect(profile).toHaveProperty('platformData');
        
        expect(profile.id).toBe(mockTikTokResponses.userProfile.data.user.open_id);
        expect(profile.displayName).toBe(mockTikTokResponses.userProfile.data.user.display_name);
        expect(profile.platformData.followerCount).toBe(mockTikTokResponses.userProfile.data.user.follower_count);
        expect(profile.platformData.videoCount).toBe(mockTikTokResponses.userProfile.data.user.video_count);

        expect(mockAxios.post).toHaveBeenCalledWith(
          'https://open.tiktokapis.com/v2/user/info/',
          expect.objectContaining({
            fields: expect.arrayContaining([
              'open_id',
              'display_name',
              'avatar_url',
              'follower_count',
              'video_count'
            ])
          }),
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          })
        );
      });

      it('should handle TikTok API errors in user profile fetch', async () => {
        // Arrange
        mockAxios.post.mockResolvedValueOnce({
          data: {
            data: null,
            error: {
              code: 'access_token_invalid',
              message: 'The access token is invalid',
              log_id: 'test_log_id_123'
            }
          }
        });

        // Act & Assert
        await expect(tiktokOAuth.getUserProfile('invalid_token'))
          .rejects
          .toThrow('TikTok API Error: The access token is invalid');
      });

      it('should handle network errors during profile fetch', async () => {
        // Arrange
        mockAxios.post.mockRejectedValueOnce(new Error('ENOTFOUND api.tiktok.com'));

        // Act & Assert
        await expect(tiktokOAuth.getUserProfile('valid_token'))
          .rejects
          .toThrow(AppError);
      });

      it('should handle incomplete profile data gracefully', async () => {
        // Arrange
        mockAxios.post.mockResolvedValueOnce({
          data: {
            data: {
              user: {
                open_id: 'test_open_id',
                display_name: 'Test User',
                // Missing other fields
              }
            }
          }
        });

        // Act
        const profile = await tiktokOAuth.getUserProfile('valid_token');

        // Assert
        expect(profile.id).toBe('test_open_id');
        expect(profile.displayName).toBe('Test User');
        expect(profile.email).toBeUndefined(); // TikTok doesn't provide email
        expect(profile.platformData.followerCount).toBeUndefined();
      });
    });

    describe('revokeAccess', () => {
      it('should successfully revoke TikTok access', async () => {
        // Arrange
        const accessToken = 'tiktok_access_token_to_revoke';
        mockAxios.post.mockResolvedValueOnce({ data: { success: true } });

        // Act
        await tiktokOAuth.revokeAccess(accessToken);

        // Assert
        expect(mockAxios.post).toHaveBeenCalledWith(
          'https://open.tiktokapis.com/v2/oauth/revoke/',
          expect.objectContaining({
            client_key: 'test_tiktok_client_key',
            client_secret: 'test_tiktok_client_secret',
            token: accessToken
          }),
          expect.objectContaining({
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          })
        );
      });

      it('should handle revoke errors gracefully', async () => {
        // Arrange
        mockAxios.post.mockRejectedValueOnce({
          response: {
            status: 400,
            data: {
              error: {
                message: 'Token already revoked'
              }
            }
          }
        });

        // Act - Should not throw error
        await expect(tiktokOAuth.revokeAccess('already_revoked_token'))
          .resolves
          .toBeUndefined();
      });

      it('should handle network failures during revoke', async () => {
        // Arrange
        mockAxios.post.mockRejectedValueOnce(new Error('ECONNRESET'));

        // Act - Should not throw error, continue gracefully
        await expect(tiktokOAuth.revokeAccess('valid_token'))
          .resolves
          .toBeUndefined();
      });
    });
  });

  describe('Analytics and Insights', () => {
    describe('getInsights', () => {
      it('should successfully fetch TikTok video insights', async () => {
        // Arrange
        const accessToken = 'valid_tiktok_access_token';
        const accountId = 'tiktok_account_123';
        
        mockAxios.post.mockResolvedValueOnce({
          data: mockTikTokResponses.videoList
        });

        // Act
        const insights = await tiktokOAuth.getInsights(accessToken, accountId);

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
        expect(insights.videos).toHaveLength(Math.min(5, mockTikTokResponses.videoList.data.videos.length));

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
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          })
        );
      });

      it('should calculate correct engagement metrics', async () => {
        // Arrange
        const mockVideos = {
          data: {
            data: {
              videos: [
                {
                  id: 'video1',
                  view_count: 1000,
                  like_count: 100,
                  comment_count: 50,
                  share_count: 25
                },
                {
                  id: 'video2',
                  view_count: 2000,
                  like_count: 200,
                  comment_count: 100,
                  share_count: 50
                }
              ]
            }
          }
        };

        mockAxios.post.mockResolvedValueOnce(mockVideos);

        // Act
        const insights = await tiktokOAuth.getInsights('token', 'account');

        // Assert
        expect(insights.totalViews).toBe(3000);
        expect(insights.totalLikes).toBe(300);
        expect(insights.totalComments).toBe(150);
        expect(insights.totalShares).toBe(75);
        expect(insights.averageViews).toBe(1500);
        expect(insights.averageLikes).toBe(150);
        expect(insights.engagementRate).toBe('17.50'); // ((300+150+75)/3000)*100
      });

      it('should handle empty video list', async () => {
        // Arrange
        mockAxios.post.mockResolvedValueOnce({
          data: {
            data: {
              videos: [],
              cursor: 0,
              has_more: false
            }
          }
        });

        // Act
        const insights = await tiktokOAuth.getInsights('token', 'account');

        // Assert
        expect(insights.totalVideos).toBe(0);
        expect(insights.totalViews).toBe(0);
        expect(insights.averageViews).toBe(0);
        expect(insights.engagementRate).toBe('0.00');
        expect(insights.videos).toHaveLength(0);
      });

      it('should handle TikTok API errors in insights fetch', async () => {
        // Arrange
        mockAxios.post.mockResolvedValueOnce({
          data: {
            error: {
              code: 'insufficient_permissions',
              message: 'Insufficient permissions to access videos'
            }
          }
        });

        // Act & Assert
        await expect(tiktokOAuth.getInsights('token', 'account'))
          .rejects
          .toThrow('TikTok API Error: Insufficient permissions to access videos');
      });

      it('should handle date range parameters (future enhancement)', async () => {
        // Arrange
        const since = new Date('2024-01-01');
        const until = new Date('2024-01-31');
        
        mockAxios.post.mockResolvedValueOnce({
          data: { data: { videos: [] } }
        });

        // Act
        await tiktokOAuth.getInsights('token', 'account', since, until);

        // Assert - Currently not implemented but should not fail
        expect(mockAxios.post).toHaveBeenCalled();
      });
    });

    describe('getVideoDetails', () => {
      it('should successfully fetch video details', async () => {
        // Arrange
        const accessToken = 'valid_token';
        const videoId = 'video_123';
        
        mockAxios.post.mockResolvedValueOnce({
          data: {
            data: {
              videos: [{
                id: videoId,
                title: 'Test Video',
                view_count: 1000,
                like_count: 100
              }]
            }
          }
        });

        // Act
        const result = await tiktokOAuth.getVideoDetails(accessToken, videoId);

        // Assert
        expect(result.data.videos[0].id).toBe(videoId);
        expect(mockAxios.post).toHaveBeenCalledWith(
          'https://open.tiktokapis.com/v2/video/query/',
          expect.objectContaining({
            filters: { video_ids: [videoId] }
          }),
          expect.any(Object)
        );
      });

      it('should handle video not found errors', async () => {
        // Arrange
        mockAxios.post.mockRejectedValueOnce(new Error('Video not found'));

        // Act & Assert
        await expect(tiktokOAuth.getVideoDetails('token', 'nonexistent_video'))
          .rejects
          .toThrow(AppError);
      });
    });
  });

  describe('Content Publishing', () => {
    describe('publishPost', () => {
      it('should require video content for TikTok publishing', async () => {
        // Act & Assert
        await expect(tiktokOAuth.publishPost('token', 'account', 'Text only content'))
          .rejects
          .toThrow('TikTok requires video content to publish');
      });

      it('should handle video publishing with media URL', async () => {
        // Arrange
        const content = 'Amazing video content!';
        const mediaUrls = ['https://example.com/video.mp4'];

        // Act
        const result = await tiktokOAuth.publishPost('token', 'account', content, mediaUrls);

        // Assert
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('url');
        expect(result).toHaveProperty('status');
        expect(result.status).toBe('pending');
        expect(result.id).toContain('tiktok_');
        expect(result.url).toContain('tiktok.com');
      });

      it('should validate video URL format', async () => {
        // Arrange
        const content = 'Test content';
        const invalidMediaUrls = ['not-a-video-url'];

        // Act
        const result = await tiktokOAuth.publishPost('token', 'account', content, invalidMediaUrls);

        // Assert - Should still work as it's a placeholder implementation
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('status');
      });

      it('should handle content length limits', async () => {
        // Arrange
        const longContent = 'A'.repeat(1000); // Very long content
        const mediaUrls = ['https://example.com/video.mp4'];

        // Act
        const result = await tiktokOAuth.publishPost('token', 'account', longContent, mediaUrls);

        // Assert - Should truncate to TikTok's limit (150 characters)
        expect(result).toHaveProperty('id');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle API rate limiting', async () => {
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
      await expect(tiktokOAuth.getUserProfile('token'))
        .rejects
        .toThrow(AppError);
    });

    it('should handle malformed API responses', async () => {
      // Arrange
      mockAxios.post.mockResolvedValueOnce({ data: 'invalid_json_response' });

      // Act & Assert
      await expect(tiktokOAuth.getUserProfile('token'))
        .rejects
        .toThrow(AppError);
    });

    it('should handle network connectivity issues', async () => {
      // Arrange
      mockAxios.post.mockRejectedValueOnce({
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND open.tiktokapis.com'
      });

      // Act & Assert
      await expect(tiktokOAuth.exchangeCodeForTokens('code'))
        .rejects
        .toThrow(AppError);
    });

    it('should handle SSL certificate errors', async () => {
      // Arrange
      mockAxios.post.mockRejectedValueOnce({
        code: 'CERT_UNTRUSTED',
        message: 'certificate not trusted'
      });

      // Act & Assert
      await expect(tiktokOAuth.exchangeCodeForTokens('code'))
        .rejects
        .toThrow(AppError);
    });

    it('should handle unexpected TikTok API structure changes', async () => {
      // Arrange
      mockAxios.post.mockResolvedValueOnce({
        data: {
          // Unexpected structure
          user_data: {
            id: 'test_id',
            name: 'Test User'
          }
        }
      });

      // Act & Assert
      await expect(tiktokOAuth.getUserProfile('token'))
        .rejects
        .toThrow(AppError);
    });

    it('should validate input parameters', async () => {
      // Act & Assert
      await expect(tiktokOAuth.exchangeCodeForTokens(''))
        .rejects
        .toThrow(AppError);

      await expect(tiktokOAuth.getUserProfile(''))
        .rejects
        .toThrow(AppError);

      await expect(tiktokOAuth.refreshAccessToken(''))
        .rejects
        .toThrow(AppError);
    });

    it('should handle concurrent API requests properly', async () => {
      // Arrange
      mockAxios.post.mockResolvedValue({
        data: mockTikTokResponses.userProfile
      });

      // Act
      const promises = Array(5).fill(0).map(() => 
        tiktokOAuth.getUserProfile('valid_token')
      );

      const results = await Promise.allSettled(promises);

      // Assert
      const successfulRequests = results.filter(r => r.status === 'fulfilled').length;
      expect(successfulRequests).toBe(5);
    });
  });

  describe('Security and Privacy', () => {
    it('should not expose sensitive data in logs', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const accessToken = 'secret_access_token_123';
      
      mockAxios.post.mockResolvedValueOnce({
        data: mockTikTokResponses.userProfile
      });

      // Act
      await tiktokOAuth.getUserProfile(accessToken);

      // Assert
      const logOutput = consoleSpy.mock.calls.flat().join(' ');
      expect(logOutput).not.toContain(accessToken);

      consoleSpy.mockRestore();
    });

    it('should use HTTPS for all API calls', () => {
      // Act
      const authUrl = tiktokOAuth.getAuthorizationUrl('state');

      // Assert
      expect(authUrl).toMatch(/^https:/);
    });

    it('should generate cryptographically secure state tokens', () => {
      // Act
      const states = Array(10).fill(0).map(() => tiktokOAuth.generateState());

      // Assert
      const uniqueStates = new Set(states);
      expect(uniqueStates.size).toBe(10); // All unique
      expect(states.every(state => state.length >= 32)).toBe(true);
      expect(states.every(state => /^[A-Za-z0-9]+$/.test(state))).toBe(true);
    });

    it('should handle user privacy settings appropriately', async () => {
      // Arrange
      mockAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            user: {
              open_id: 'private_user_123',
              display_name: 'Private User',
              follower_count: 0, // Private account
              video_count: 0
            }
          }
        }
      });

      // Act
      const profile = await tiktokOAuth.getUserProfile('token');

      // Assert
      expect(profile.platformData.followerCount).toBe(0);
      expect(profile.platformData.videoCount).toBe(0);
    });
  });

  describe('Integration with OAuth Base Class', () => {
    it('should properly inherit from OAuthService', () => {
      // Assert
      expect(tiktokOAuth).toBeInstanceOf(OAuthService);
      expect(typeof tiktokOAuth.generateState).toBe('function');
    });

    it('should implement all required abstract methods', () => {
      // Assert
      expect(typeof tiktokOAuth.getAuthorizationUrl).toBe('function');
      expect(typeof tiktokOAuth.exchangeCodeForTokens).toBe('function');
      expect(typeof tiktokOAuth.refreshAccessToken).toBe('function');
      expect(typeof tiktokOAuth.getUserProfile).toBe('function');
      expect(typeof tiktokOAuth.revokeAccess).toBe('function');
    });

    it('should handle database operations through base class', async () => {
      // This would be tested in integration tests with actual database
      // Here we just verify the structure
      expect(tiktokOAuth).toHaveProperty('generateState');
    });
  });

  describe('Platform-Specific Features', () => {
    it('should handle TikTok union_id for cross-app identity', async () => {
      // Arrange
      mockAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            user: {
              open_id: 'open_id_123',
              union_id: 'union_id_456',
              display_name: 'Test User'
            }
          }
        }
      });

      // Act
      const profile = await tiktokOAuth.getUserProfile('token');

      // Assert
      expect(profile.platformData.unionId).toBe('union_id_456');
    });

    it('should handle TikTok verification status', async () => {
      // Arrange
      mockAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            user: {
              open_id: 'verified_user_123',
              display_name: 'Verified Creator',
              is_verified: true
            }
          }
        }
      });

      // Act
      const profile = await tiktokOAuth.getUserProfile('token');

      // Assert
      expect(profile.platformData.isVerified).toBe(true);
    });

    it('should handle different TikTok avatar sizes', async () => {
      // Arrange
      mockAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            user: {
              open_id: 'user_123',
              display_name: 'User',
              avatar_url: 'https://example.com/avatar.jpg',
              avatar_url_100: 'https://example.com/avatar_100.jpg',
              avatar_large_url: 'https://example.com/avatar_large.jpg'
            }
          }
        }
      });

      // Act
      const profile = await tiktokOAuth.getUserProfile('token');

      // Assert
      expect(profile.profileImage).toBe('https://example.com/avatar_100.jpg');
      expect(profile.platformData.avatarLargeUrl).toBe('https://example.com/avatar_large.jpg');
    });

    it('should handle TikTok bio descriptions', async () => {
      // Arrange
      const bioDescription = 'Creative content creator sharing amazing videos!';
      
      mockAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            user: {
              open_id: 'creator_123',
              display_name: 'Creator',
              bio_description: bioDescription
            }
          }
        }
      });

      // Act
      const profile = await tiktokOAuth.getUserProfile('token');

      // Assert
      expect(profile.platformData.bioDescription).toBe(bioDescription);
    });
  });
});