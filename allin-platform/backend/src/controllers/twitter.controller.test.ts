import { Request, Response } from 'express';
import { TwitterController } from './twitter.controller';

// Mock the twitter service with actual methods
jest.mock('../services/twitter.service', () => ({
  twitterService: {
    generateAuthUrl: jest.fn(),
    exchangeCodeForToken: jest.fn(),
    refreshAccessToken: jest.fn(),
    getMe: jest.fn(),
    getUserTweets: jest.fn(),
    createTweet: jest.fn(),
    deleteTweet: jest.fn(),
    getTweetDetails: jest.fn(),
    searchTweets: jest.fn(),
    getFollowers: jest.fn(),
    getFollowing: jest.fn(),
    followUser: jest.fn(),
    unfollowUser: jest.fn(),
    likeTweet: jest.fn(),
    unlikeTweet: jest.fn(),
    retweet: jest.fn(),
    unretweet: jest.fn(),
  }
}));

import { twitterService } from '../services/twitter.service';

// Master test credentials (keeping for reference but not using in this controller test)
// const MASTER_CREDENTIALS = {
//   admin: { email: 'admin@allin.demo', password: 'AdminPass123' },
//   agency: { email: 'agency@allin.demo', password: 'AgencyPass123' },
//   manager: { email: 'manager@allin.demo', password: 'ManagerPass123' },
//   creator: { email: 'creator@allin.demo', password: 'CreatorPass123' },
//   client: { email: 'client@allin.demo', password: 'ClientPass123' },
//   team: { email: 'team@allin.demo', password: 'TeamPass123' },
// };

describe('TwitterController - Simplified Test Suite', () => {
  let controller: TwitterController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    controller = new TwitterController();
    
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
    
    mockRequest = {
      headers: { authorization: 'Bearer valid-token' },
      body: {},
      query: {},
      params: {}
    };
  });

  describe('getAuthUrl', () => {
    it('should generate Twitter auth URL successfully', async () => {
      const mockAuthResponse = {
        authUrl: 'https://twitter.com/oauth2/authorize?...',
        state: 'state123',
        codeChallenge: 'challenge123',
        codeVerifier: 'verifier123'
      };

      (twitterService.generateAuthUrl as jest.Mock).mockReturnValue(mockAuthResponse);

      await controller.getAuthUrl(mockRequest as Request, mockResponse as Response);

      expect(twitterService.generateAuthUrl).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockAuthResponse
      });
    });

    it('should handle auth URL generation errors', async () => {
      (twitterService.generateAuthUrl as jest.Mock).mockImplementation(() => {
        throw new Error('Configuration error');
      });

      // Set NODE_ENV to development to get error details
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      await controller.getAuthUrl(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to generate Twitter authorization URL',
        error: 'Configuration error'
      });

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('completeAuth', () => {
    it('should complete Twitter authentication successfully', async () => {
      const mockTokenResponse = {
        accessToken: 'access123',
        refreshToken: 'refresh123',
        expiresIn: 7200
      };

      const mockUser = {
        id: 'user123',
        username: 'testuser',
        name: 'Test User'
      };

      mockRequest.body = {
        code: 'auth_code_123',
        codeVerifier: 'verifier123'
      };

      (twitterService.exchangeCodeForToken as jest.Mock).mockResolvedValue(mockTokenResponse);
      (twitterService.getMe as jest.Mock).mockResolvedValue(mockUser);

      await controller.completeAuth(mockRequest as Request, mockResponse as Response);

      expect(twitterService.exchangeCodeForToken).toHaveBeenCalledWith(
        'auth_code_123',
        expect.any(String),
        'verifier123'
      );
      expect(twitterService.getMe).toHaveBeenCalledWith('access123');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          ...mockTokenResponse,
          user: mockUser
        }
      });
    });

    it('should handle missing parameters', async () => {
      mockRequest.body = { code: 'auth_code_123' }; // Missing codeVerifier

      await controller.completeAuth(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Authorization code and code verifier are required'
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token successfully', async () => {
      const mockTokenResponse = {
        accessToken: 'new_access123',
        refreshToken: 'new_refresh123',
        expiresIn: 7200
      };

      mockRequest.body = { refreshToken: 'refresh123' };

      (twitterService.refreshAccessToken as jest.Mock).mockResolvedValue(mockTokenResponse);

      await controller.refreshToken(mockRequest as Request, mockResponse as Response);

      expect(twitterService.refreshAccessToken).toHaveBeenCalledWith('refresh123');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockTokenResponse
      });
    });

    it('should handle missing refresh token', async () => {
      mockRequest.body = {}; // Missing refreshToken

      await controller.refreshToken(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Refresh token is required'
      });
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        id: 'user123',
        username: 'testuser',
        name: 'Test User',
        verified: false,
        publicMetrics: {
          followersCount: 100,
          followingCount: 50,
          tweetCount: 25,
          listedCount: 5
        }
      };

      (twitterService.getMe as jest.Mock).mockResolvedValue(mockUser);

      await controller.getProfile(mockRequest as Request, mockResponse as Response);

      expect(twitterService.getMe).toHaveBeenCalledWith('valid-token');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    it('should handle missing access token', async () => {
      mockRequest.headers = {}; // Missing authorization header

      await controller.getProfile(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Access token is required'
      });
    });
  });

  describe('getTweets', () => {
    it('should get user tweets successfully', async () => {
      const mockTweets = [
        {
          id: 'tweet1',
          text: 'First tweet',
          authorId: 'user123',
          createdAt: '2023-12-01T10:00:00.000Z'
        },
        {
          id: 'tweet2',
          text: 'Second tweet',
          authorId: 'user123',
          createdAt: '2023-12-01T09:00:00.000Z'
        }
      ];

      (twitterService.getUserTweets as jest.Mock).mockResolvedValue(mockTweets);

      await controller.getTweets(mockRequest as Request, mockResponse as Response);

      expect(twitterService.getUserTweets).toHaveBeenCalledWith(undefined, 10, 'valid-token');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockTweets
      });
    });

    it('should handle custom parameters', async () => {
      mockRequest.query = { userId: 'user456', maxResults: '20' };

      const mockTweets: any[] = [];
      (twitterService.getUserTweets as jest.Mock).mockResolvedValue(mockTweets);

      await controller.getTweets(mockRequest as Request, mockResponse as Response);

      expect(twitterService.getUserTweets).toHaveBeenCalledWith('user456', 20, 'valid-token');
    });
  });

  describe('getTweetDetails', () => {
    it('should get tweet details successfully', async () => {
      const mockTweet = {
        id: 'tweet123',
        text: 'This is a test tweet',
        authorId: 'user123',
        createdAt: '2023-12-01T10:00:00.000Z',
        publicMetrics: {
          retweetCount: 12,
          likeCount: 45,
          replyCount: 8,
          quoteCount: 3
        }
      };

      mockRequest.params = { id: 'tweet123' };

      (twitterService.getTweetDetails as jest.Mock).mockResolvedValue(mockTweet);

      await controller.getTweetDetails(mockRequest as Request, mockResponse as Response);

      expect(twitterService.getTweetDetails).toHaveBeenCalledWith('tweet123', 'valid-token');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockTweet
      });
    });
  });
});