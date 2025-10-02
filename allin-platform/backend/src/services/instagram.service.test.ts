import { InstagramService } from './instagram.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('InstagramService', () => {
  let instagramService: InstagramService;
  const mockAccessToken = 'mock_access_token_123';
  const mockAppId = 'mock_app_id';
  const mockAppSecret = 'mock_app_secret';
  const mockAccountId = 'mock_account_id';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.INSTAGRAM_APP_ID = mockAppId;
    process.env.INSTAGRAM_APP_SECRET = mockAppSecret;
    process.env.INSTAGRAM_ACCESS_TOKEN = mockAccessToken;
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = mockAccountId;
    
    instagramService = new InstagramService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Authentication', () => {
    describe('generateAuthUrl', () => {
      it('should generate valid Instagram OAuth URL', () => {
        const redirectUri = 'http://localhost:3000/callback';
        const scopes = ['instagram_basic', 'instagram_content_publish'];
        
        const result = instagramService.generateAuthUrl(redirectUri, scopes);
        
        expect(result.authUrl).toContain('https://api.instagram.com/oauth/authorize');
        expect(result.authUrl).toContain(`client_id=${mockAppId}`);
        expect(result.authUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
        expect(result.authUrl).toContain('scope=instagram_basic%2Cinstagram_content_publish');
        expect(result.state).toBeDefined();
        expect(result.state).toHaveLength(32);
      });

      it('should generate unique state for each call', () => {
        const redirectUri = 'http://localhost:3000/callback';
        
        const result1 = instagramService.generateAuthUrl(redirectUri);
        const result2 = instagramService.generateAuthUrl(redirectUri);
        
        expect(result1.state).not.toEqual(result2.state);
      });
    });

    describe('exchangeCodeForToken', () => {
      it('should exchange code for access token successfully', async () => {
        const mockResponse = {
          access_token: 'new_access_token',
          token_type: 'bearer',
          expires_in: 3600
        };
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });
        
        const result = await instagramService.exchangeCodeForToken('auth_code', 'http://localhost:3000/callback');
        
        expect(fetch).toHaveBeenCalledWith(
          'https://api.instagram.com/oauth/access_token',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
        );
        
        expect(result).toEqual({
          accessToken: 'new_access_token',
          tokenType: 'bearer',
          expiresIn: 3600
        });
      });

      it('should throw error on failed token exchange', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error_description: 'Invalid code' })
        });
        
        await expect(
          instagramService.exchangeCodeForToken('invalid_code', 'http://localhost:3000/callback')
        ).rejects.toThrow('Token exchange failed: Invalid code');
      });
    });

    describe('refreshAccessToken', () => {
      it('should refresh access token successfully', async () => {
        const mockResponse = {
          access_token: 'refreshed_token',
          token_type: 'bearer',
          expires_in: 5184000
        };
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });
        
        const result = await instagramService.refreshAccessToken(mockAccessToken);
        
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/refresh_access_token'),
          expect.objectContaining({
            method: 'GET'
          })
        );
        
        expect(result).toEqual({
          accessToken: 'refreshed_token',
          tokenType: 'bearer',
          expiresIn: 5184000
        });
      });
    });
  });

  describe('Account Management', () => {
    describe('getBusinessAccount', () => {
      it('should return mock data when no token is provided', async () => {
        const service = new InstagramService({ accessToken: undefined });
        
        const result = await service.getBusinessAccount();
        
        expect(result).toEqual({
          id: '12345678901234567',
          username: 'mock_business_account',
          name: 'Mock Business Account',
          profilePictureUrl: 'https://via.placeholder.com/150',
          accountType: 'BUSINESS',
          mediaCount: 142,
          followersCount: 5234,
          followsCount: 487
        });
      });

      it('should fetch business account data successfully', async () => {
        const mockResponse = {
          id: '12345',
          username: 'test_account',
          name: 'Test Account',
          profile_picture_url: 'https://example.com/pic.jpg',
          account_type: 'BUSINESS',
          media_count: 100,
          followers_count: 1000,
          follows_count: 500
        };
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });
        
        const result = await instagramService.getBusinessAccount(mockAccessToken);
        
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/${mockAccountId}`),
          expect.objectContaining({
            method: 'GET'
          })
        );
        
        expect(result).toEqual({
          id: '12345',
          username: 'test_account',
          name: 'Test Account',
          profilePictureUrl: 'https://example.com/pic.jpg',
          accountType: 'BUSINESS',
          mediaCount: 100,
          followersCount: 1000,
          followsCount: 500
        });
      });
    });
  });

  describe('Media Management', () => {
    describe('getUserMedia', () => {
      it('should return mock media when no token is provided', async () => {
        const service = new InstagramService({ accessToken: undefined });
        
        const result = await service.getUserMedia();
        
        expect(result).toHaveLength(3);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('mediaType');
        expect(result[0]).toHaveProperty('mediaUrl');
        expect(result[0]).toHaveProperty('caption');
      });

      it('should fetch user media successfully', async () => {
        const mockResponse = {
          data: [
            {
              id: 'media_1',
              media_type: 'IMAGE',
              media_url: 'https://example.com/image1.jpg',
              thumbnail_url: 'https://example.com/thumb1.jpg',
              permalink: 'https://instagram.com/p/123',
              caption: 'Test caption',
              timestamp: '2024-01-01T00:00:00Z',
              username: 'test_user',
              like_count: 100,
              comments_count: 10
            }
          ]
        };
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });
        
        const result = await instagramService.getUserMedia(mockAccountId, 10, mockAccessToken);
        
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/${mockAccountId}/media`),
          expect.objectContaining({
            method: 'GET'
          })
        );
        
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          id: 'media_1',
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/image1.jpg',
          thumbnailUrl: 'https://example.com/thumb1.jpg',
          permalink: 'https://instagram.com/p/123',
          caption: 'Test caption',
          timestamp: '2024-01-01T00:00:00Z',
          username: 'test_user',
          likesCount: 100,
          commentsCount: 10
        });
      });
    });

    describe('createMediaContainer', () => {
      it('should create media container successfully', async () => {
        const mockResponse = { id: 'container_123' };
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });
        
        const result = await instagramService.createMediaContainer({
          imageUrl: 'https://example.com/image.jpg',
          caption: 'Test post'
        });
        
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/${mockAccountId}/media`),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
        );
        
        expect(result).toEqual({ id: 'container_123' });
      });

      it('should throw error when no token is provided', async () => {
        const service = new InstagramService({ accessToken: undefined });
        
        await expect(
          service.createMediaContainer({
            imageUrl: 'https://example.com/image.jpg',
            caption: 'Test post'
          })
        ).rejects.toThrow('Access token and Instagram Business Account ID required');
      });
    });

    describe('publishMediaContainer', () => {
      it('should publish media container successfully', async () => {
        const mockPublishResponse = { id: 'published_media_123' };
        const mockMediaDetails = {
          id: 'published_media_123',
          media_type: 'IMAGE',
          media_url: 'https://example.com/image.jpg',
          permalink: 'https://instagram.com/p/456',
          caption: 'Published post',
          timestamp: '2024-01-01T00:00:00Z',
          username: 'test_user',
          like_count: 0,
          comments_count: 0
        };
        
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockPublishResponse
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockMediaDetails
          });
        
        const result = await instagramService.publishMediaContainer('container_123');
        
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch).toHaveBeenNthCalledWith(1,
          expect.stringContaining('/media_publish'),
          expect.objectContaining({
            method: 'POST'
          })
        );
        
        expect(result).toHaveProperty('id', 'published_media_123');
        expect(result).toHaveProperty('mediaType', 'IMAGE');
      });
    });
  });

  describe('Analytics and Insights', () => {
    describe('getAccountInsights', () => {
      it('should return mock insights when no token is provided', async () => {
        const service = new InstagramService({ accessToken: undefined });
        
        const result = await service.getAccountInsights();
        
        expect(result).toEqual({
          impressions: 1247,
          reach: 892,
          engagement: 156,
          saves: 23,
          videoViews: 0,
          websiteClicks: 12,
          profileViews: 45,
          follows: 8
        });
      });

      it('should fetch account insights successfully', async () => {
        const mockResponse = {
          data: [
            { name: 'impressions', values: [{ value: 500 }] },
            { name: 'reach', values: [{ value: 300 }] },
            { name: 'profile_views', values: [{ value: 50 }] },
            { name: 'website_clicks', values: [{ value: 20 }] },
            { name: 'follows', values: [{ value: 10 }] }
          ]
        };
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });
        
        const result = await instagramService.getAccountInsights('day', mockAccessToken);
        
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/${mockAccountId}/insights`),
          expect.objectContaining({
            method: 'GET'
          })
        );
        
        expect(result).toEqual({
          impressions: 500,
          reach: 300,
          engagement: 0,
          saves: 0,
          videoViews: 0,
          websiteClicks: 20,
          profileViews: 50,
          follows: 10
        });
      });
    });

    describe('getMediaInsights', () => {
      it('should fetch media insights successfully', async () => {
        const mockResponse = {
          data: [
            { name: 'impressions', values: [{ value: 200 }] },
            { name: 'reach', values: [{ value: 150 }] },
            { name: 'engagement', values: [{ value: 30 }] },
            { name: 'saves', values: [{ value: 5 }] }
          ]
        };
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });
        
        const result = await instagramService.getMediaInsights('media_123', mockAccessToken);
        
        expect(result).toEqual({
          impressions: 200,
          reach: 150,
          engagement: 30,
          saves: 5
        });
      });
    });
  });

  describe('Comment Management', () => {
    describe('getMediaComments', () => {
      it('should fetch media comments successfully', async () => {
        const mockResponse = {
          data: [
            {
              id: 'comment_1',
              text: 'Great post!',
              timestamp: '2024-01-01T00:00:00Z',
              username: 'user1',
              from: { id: 'user_1', username: 'user1' },
              like_count: 5,
              replies: { data: [] }
            }
          ]
        };
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });
        
        const result = await instagramService.getMediaComments('media_123', mockAccessToken);
        
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          id: 'comment_1',
          text: 'Great post!',
          timestamp: '2024-01-01T00:00:00Z',
          username: 'user1',
          from: { id: 'user_1', username: 'user1' },
          replies: [],
          likesCount: 5
        });
      });
    });

    describe('replyToComment', () => {
      it('should reply to comment successfully', async () => {
        const mockResponse = { id: 'reply_123' };
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });
        
        const result = await instagramService.replyToComment('comment_123', 'Thank you!', mockAccessToken);
        
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/comment_123/replies'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
        );
        
        expect(result).toEqual({ id: 'reply_123' });
      });
    });

    describe('deleteComment', () => {
      it('should delete comment successfully', async () => {
        const mockResponse = { success: true };
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });
        
        const result = await instagramService.deleteComment('comment_123', mockAccessToken);
        
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/comment_123'),
          expect.objectContaining({
            method: 'DELETE'
          })
        );
        
        expect(result).toEqual({ success: true });
      });
    });
  });

  describe('Hashtag Features', () => {
    describe('searchHashtags', () => {
      it('should search hashtags successfully', async () => {
        const mockResponse = {
          data: [
            { id: 'hashtag_1', name: 'photography' },
            { id: 'hashtag_2', name: 'photooftheday' }
          ]
        };
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });
        
        const result = await instagramService.searchHashtags('photo', mockAccessToken);
        
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/ig_hashtag_search'),
          expect.objectContaining({
            method: 'GET'
          })
        );
        
        expect(result).toEqual([
          { id: 'hashtag_1', name: 'photography' },
          { id: 'hashtag_2', name: 'photooftheday' }
        ]);
      });
    });

    describe('getHashtagInsights', () => {
      it('should fetch hashtag insights successfully', async () => {
        const mockResponse = {
          data: [
            { values: [{ value: 1000 }] }
          ]
        };
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });
        
        const result = await instagramService.getHashtagInsights('hashtag_123', mockAccessToken);
        
        expect(result).toEqual({
          impressions: 1000,
          reach: 0,
          engagement: 0,
          saves: 0
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      await expect(
        instagramService.getBusinessAccount(mockAccessToken)
      ).rejects.toThrow('Network error');
    });

    it('should handle API errors with proper messages', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Invalid access token' }
        })
      });
      
      await expect(
        instagramService.getUserMedia(mockAccountId, 10, mockAccessToken)
      ).rejects.toThrow('Failed to get user media: Invalid access token');
    });
  });
});