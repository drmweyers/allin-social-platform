import { jest } from '@jest/globals';
import axios from 'axios';
import { TikTokOAuthService } from './tiktok.oauth';
import { AppError } from '../../utils/errors';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TikTokOAuthService', () => {
  let service: TikTokOAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables before creating service
    process.env.TIKTOK_CLIENT_KEY = 'test_client_key';
    process.env.TIKTOK_CLIENT_SECRET = 'test_client_secret';
    process.env.TIKTOK_REDIRECT_URI = 'http://localhost:3001/api/social/callback/tiktok';
    
    service = new TikTokOAuthService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct platform and configuration', () => {
      // Test by checking that getAuthorizationUrl works with expected parameters
      const state = 'test_state';
      const authUrl = service.getAuthorizationUrl(state);
      
      expect(authUrl).toContain('client_key=test_client_key');
      expect(authUrl).toContain('user.info.basic');
      expect(authUrl).toContain('video.list');
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL', () => {
      const state = 'test_state_123';
      const authUrl = service.getAuthorizationUrl(state);

      expect(authUrl).toContain('https://www.tiktok.com/v2/auth/authorize/');
      expect(authUrl).toContain('client_key=test_client_key');
      expect(authUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fsocial%2Fcallback%2Ftiktok');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('state=test_state_123');
      expect(authUrl).toContain('scope=user.info.basic%2Cuser.info.profile');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens successfully', async () => {
      const mockResponse = {
        data: {
          access_token: 'test_access_token',
          refresh_token: 'test_refresh_token',
          expires_in: 86400,
          token_type: 'Bearer',
          scope: 'user.info.basic,video.list',
          open_id: 'test_open_id_123',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.exchangeCodeForTokens('test_auth_code');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://open.tiktokapis.com/v2/oauth/token/',
        expect.objectContaining({
          client_key: 'test_client_key',
          client_secret: 'test_client_secret',
          code: 'test_auth_code',
          grant_type: 'authorization_code',
          redirect_uri: 'http://localhost:3001/api/social/callback/tiktok',
        }),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );

      expect(result).toEqual({
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        expiresIn: 86400,
        openId: 'test_open_id_123',
      });
    });

    it('should handle token exchange errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Token exchange failed'));

      await expect(service.exchangeCodeForTokens('invalid_code'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const mockResponse = {
        data: {
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
          expires_in: 86400,
          token_type: 'Bearer',
          scope: 'user.info.basic,video.list',
          open_id: 'test_open_id_123',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.refreshAccessToken('test_refresh_token');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://open.tiktokapis.com/v2/oauth/token/',
        expect.objectContaining({
          client_key: 'test_client_key',
          client_secret: 'test_client_secret',
          grant_type: 'refresh_token',
          refresh_token: 'test_refresh_token',
        }),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );

      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresIn: 86400,
      });
    });

    it('should handle refresh token errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Refresh failed'));

      await expect(service.refreshAccessToken('invalid_refresh_token'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('getUserProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            user: {
              open_id: 'test_open_id',
              union_id: 'test_union_id',
              avatar_url: 'https://example.com/avatar.jpg',
              avatar_url_100: 'https://example.com/avatar_100.jpg',
              avatar_large_url: 'https://example.com/avatar_large.jpg',
              display_name: 'Test User',
              bio_description: 'Test bio',
              profile_deep_link: 'https://tiktok.com/@testuser',
              is_verified: true,
              follower_count: 1000,
              following_count: 500,
              likes_count: 50000,
              video_count: 25,
            },
          },
          error: null,
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.getUserProfile('test_access_token');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://open.tiktokapis.com/v2/user/info/',
        expect.objectContaining({
          fields: expect.arrayContaining([
            'open_id',
            'display_name',
            'avatar_url',
            'follower_count',
            'video_count',
          ]),
        }),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test_access_token',
            'Content-Type': 'application/json',
          },
        })
      );

      expect(result).toEqual({
        id: 'test_open_id',
        displayName: 'Test User',
        email: undefined,
        profileImage: 'https://example.com/avatar_100.jpg',
        profileUrl: 'https://tiktok.com/@testuser',
        platformData: {
          unionId: 'test_union_id',
          avatarLargeUrl: 'https://example.com/avatar_large.jpg',
          bioDescription: 'Test bio',
          isVerified: true,
          followerCount: 1000,
          followingCount: 500,
          likesCount: 50000,
          videoCount: 25,
        },
      });
    });

    it('should handle API errors from TikTok', async () => {
      const mockResponse = {
        data: {
          data: null,
          error: {
            code: 'access_token_invalid',
            message: 'The access token is invalid',
            log_id: 'test_log_id',
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      await expect(service.getUserProfile('invalid_token'))
        .rejects
        .toThrow(AppError);
    });

    it('should handle network errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getUserProfile('test_access_token'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('revokeAccess', () => {
    it('should revoke access successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      await expect(service.revokeAccess('test_access_token')).resolves.toBeUndefined();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://open.tiktokapis.com/v2/oauth/revoke/',
        expect.objectContaining({
          client_key: 'test_client_key',
          client_secret: 'test_client_secret',
          token: 'test_access_token',
        }),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
    });

    it('should handle revoke errors gracefully', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Revoke failed'));

      // Should not throw error
      await expect(service.revokeAccess('test_access_token')).resolves.toBeUndefined();
    });
  });

  describe('getInsights', () => {
    it('should fetch user insights successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            videos: [
              {
                id: 'video1',
                title: 'Test Video 1',
                view_count: 1000,
                like_count: 100,
                comment_count: 50,
                share_count: 25,
                create_time: 1640995200,
              },
              {
                id: 'video2',
                title: 'Test Video 2',
                view_count: 2000,
                like_count: 200,
                comment_count: 100,
                share_count: 50,
                create_time: 1640908800,
              },
            ],
            cursor: 0,
            has_more: false,
          },
          error: null,
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.getInsights('test_access_token', 'test_account_id');

      expect(result).toEqual({
        totalVideos: 2,
        totalViews: 3000,
        totalLikes: 300,
        totalComments: 150,
        totalShares: 75,
        averageViews: 1500,
        averageLikes: 150,
        engagementRate: '17.50',
        videos: mockResponse.data.data.videos,
      });
    });

    it('should handle empty video list', async () => {
      const mockResponse = {
        data: {
          data: {
            videos: [],
            cursor: 0,
            has_more: false,
          },
          error: null,
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.getInsights('test_access_token', 'test_account_id');

      expect(result).toEqual({
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        averageViews: 0,
        averageLikes: 0,
        engagementRate: '0.00',
        videos: [],
      });
    });
  });

  describe('publishPost', () => {
    it('should handle video publishing (mock implementation)', async () => {
      const result = await service.publishPost(
        'test_access_token',
        'test_account_id',
        'Test video content',
        ['https://example.com/video.mp4']
      );

      expect(result).toEqual({
        id: expect.stringContaining('tiktok_'),
        url: expect.stringContaining('https://tiktok.com/@username/video/'),
        status: 'pending',
      });
    });

    it('should require video content for publishing', async () => {
      await expect(service.publishPost(
        'test_access_token',
        'test_account_id',
        'Test content without video'
      )).rejects.toThrow(AppError);
    });
  });

  describe('getVideoDetails', () => {
    it('should fetch video details successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            videos: [{
              id: 'video_123',
              title: 'Test Video',
              cover_image_url: 'https://example.com/cover.jpg',
              share_url: 'https://tiktok.com/@user/video/123',
              video_description: 'Test description',
              duration: 30000,
              height: 1920,
              width: 1080,
              create_time: 1640995200,
              view_count: 5000,
              like_count: 500,
              comment_count: 250,
              share_count: 100,
            }],
          },
          error: null,
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.getVideoDetails('test_access_token', 'video_123');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://open.tiktokapis.com/v2/video/query/',
        expect.objectContaining({
          fields: expect.arrayContaining([
            'id',
            'title',
            'view_count',
            'like_count',
            'comment_count',
            'share_count',
          ]),
          filters: {
            video_ids: ['video_123'],
          },
        }),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test_access_token',
            'Content-Type': 'application/json',
          },
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle video details fetch errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Video not found'));

      await expect(service.getVideoDetails('test_access_token', 'invalid_video_id'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('configuration validation', () => {
    it('should handle missing environment variables', () => {
      delete process.env.TIKTOK_CLIENT_KEY;
      delete process.env.TIKTOK_CLIENT_SECRET;
      
      const newService = new TikTokOAuthService();
      const authUrl = newService.getAuthorizationUrl('test');
      
      // Should still work but with empty client_key
      expect(authUrl).toContain('client_key=');
    });

    it('should use default redirect URI when not provided', () => {
      delete process.env.TIKTOK_REDIRECT_URI;
      
      const newService = new TikTokOAuthService();
      const authUrl = newService.getAuthorizationUrl('test');
      
      expect(authUrl).toContain('localhost%3A3001');
    });
  });

  describe('error handling', () => {
    it('should handle axios errors with proper error messages', async () => {
      const axiosError = {
        response: {
          status: 400,
          data: {
            error: {
              code: 'invalid_request',
              message: 'Invalid request parameters',
            },
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(axiosError);

      await expect(service.exchangeCodeForTokens('invalid_code'))
        .rejects
        .toThrow(AppError);
    });

    it('should handle network timeout errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('ETIMEDOUT'));

      await expect(service.getUserProfile('test_access_token'))
        .rejects
        .toThrow(AppError);
    });
  });
});