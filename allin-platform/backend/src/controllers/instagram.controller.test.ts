import { Request, Response } from 'express';
import InstagramController from './instagram.controller';
import * as instagramService from '../services/instagram.service';

// Mock the Instagram service
jest.mock('../services/instagram.service');

describe('InstagramController', () => {
  let controller: InstagramController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    controller = new InstagramController();
    
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    
    mockRequest = {
      user: {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      },
      body: {},
      query: {},
      params: {}
    };
    
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
    
    jest.clearAllMocks();
  });

  describe('getAuthUrl', () => {
    it('should generate auth URL successfully', async () => {
      const mockAuthResponse = {
        authUrl: 'https://api.instagram.com/oauth/authorize?...',
        state: 'random_state'
      };
      
      const mockService = {
        generateAuthUrl: jest.fn().mockReturnValue(mockAuthResponse)
      };
      
      (instagramService.createInstagramService as jest.Mock).mockReturnValue(mockService);
      controller = new InstagramController();
      
      await controller.getAuthUrl(mockRequest as any, mockResponse as Response);
      
      expect(mockService.generateAuthUrl).toHaveBeenCalledWith(
        expect.stringContaining('/dashboard/social/instagram/callback'),
        ['instagram_basic', 'instagram_content_publish', 'pages_show_list']
      );
      
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          authUrl: mockAuthResponse.authUrl,
          state: mockAuthResponse.state
        }
      });
    });

    it('should handle errors when generating auth URL', async () => {
      const mockService = {
        generateAuthUrl: jest.fn().mockImplementation(() => {
          throw new Error('Service error');
        })
      };
      
      (instagramService.createInstagramService as jest.Mock).mockReturnValue(mockService);
      controller = new InstagramController();
      
      await controller.getAuthUrl(mockRequest as any, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to generate Instagram authorization URL'
        })
      );
    });
  });

  describe('completeAuth', () => {
    it('should complete authentication successfully', async () => {
      mockRequest.body = { code: 'auth_code', state: 'state_value' };
      
      const mockService = {
        exchangeCodeForToken: jest.fn().mockResolvedValue({
          accessToken: 'short_token',
          tokenType: 'bearer'
        }),
        exchangeForLongLivedToken: jest.fn().mockResolvedValue({
          accessToken: 'long_token',
          expiresIn: 5184000
        }),
        getBusinessAccount: jest.fn().mockResolvedValue({
          id: '123',
          username: 'test_account',
          accountType: 'BUSINESS'
        })
      };
      
      (instagramService.createInstagramService as jest.Mock).mockReturnValue(mockService);
      controller = new InstagramController();
      
      await controller.completeAuth(mockRequest as any, mockResponse as Response);
      
      expect(mockService.exchangeCodeForToken).toHaveBeenCalledWith(
        'auth_code',
        expect.stringContaining('/dashboard/social/instagram/callback')
      );
      
      expect(mockService.exchangeForLongLivedToken).toHaveBeenCalledWith('short_token');
      expect(mockService.getBusinessAccount).toHaveBeenCalledWith('long_token');
      
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({
            id: '123',
            username: 'test_account'
          }),
          accessToken: 'long_token',
          connected: true,
          message: 'Instagram account connected successfully'
        })
      });
    });

    it('should return error when code is missing', async () => {
      mockRequest.body = {};
      
      await controller.completeAuth(mockRequest as any, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Authorization code is required'
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      mockRequest.body = { accessToken: 'old_token' };
      
      const mockService = {
        refreshAccessToken: jest.fn().mockResolvedValue({
          accessToken: 'new_token',
          expiresIn: 5184000
        })
      };
      
      (instagramService.createInstagramService as jest.Mock).mockReturnValue(mockService);
      controller = new InstagramController();
      
      await controller.refreshToken(mockRequest as any, mockResponse as Response);
      
      expect(mockService.refreshAccessToken).toHaveBeenCalledWith('old_token');
      
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: 'new_token',
          expiresIn: 5184000,
          message: 'Token refreshed successfully'
        }
      });
    });
  });

  describe('getAccount', () => {
    it('should get account information successfully', async () => {
      const mockAccount = {
        id: '123',
        username: 'test_account',
        name: 'Test Account',
        accountType: 'BUSINESS'
      };
      
      const mockService = {
        getBusinessAccount: jest.fn().mockResolvedValue(mockAccount)
      };
      
      (instagramService.createInstagramService as jest.Mock).mockReturnValue(mockService);
      controller = new InstagramController();
      
      await controller.getAccount(mockRequest as any, mockResponse as Response);
      
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          account: mockAccount
        }
      });
    });
  });

  describe('getMedia', () => {
    it('should get user media successfully', async () => {
      mockRequest.query = { limit: '10' };
      
      const mockMedia = [
        { id: '1', mediaType: 'IMAGE', caption: 'Test post 1' },
        { id: '2', mediaType: 'VIDEO', caption: 'Test post 2' }
      ];
      
      const mockService = {
        getUserMedia: jest.fn().mockResolvedValue(mockMedia)
      };
      
      (instagramService.createInstagramService as jest.Mock).mockReturnValue(mockService);
      controller = new InstagramController();
      
      await controller.getMedia(mockRequest as any, mockResponse as Response);
      
      expect(mockService.getUserMedia).toHaveBeenCalledWith(undefined, 10);
      
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          media: mockMedia,
          total: 2
        }
      });
    });
  });

  describe('createPost', () => {
    it('should create post successfully', async () => {
      mockRequest.body = {
        imageUrl: 'https://example.com/image.jpg',
        caption: 'Test caption'
      };
      
      const mockService = {
        createMediaContainer: jest.fn().mockResolvedValue({ id: 'container_123' }),
        publishMediaContainer: jest.fn().mockResolvedValue({
          id: 'media_123',
          mediaType: 'IMAGE',
          permalink: 'https://instagram.com/p/123'
        })
      };
      
      (instagramService.createInstagramService as jest.Mock).mockReturnValue(mockService);
      controller = new InstagramController();
      
      await controller.createPost(mockRequest as any, mockResponse as Response);
      
      expect(mockService.createMediaContainer).toHaveBeenCalledWith({
        imageUrl: 'https://example.com/image.jpg',
        caption: 'Test caption'
      });
      
      expect(mockService.publishMediaContainer).toHaveBeenCalledWith('container_123');
      
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          media: expect.objectContaining({
            id: 'media_123',
            mediaType: 'IMAGE'
          }),
          message: 'Instagram post created successfully'
        }
      });
    });

    it('should return error when image URL is missing', async () => {
      mockRequest.body = { caption: 'Test caption' };
      
      await controller.createPost(mockRequest as any, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Image URL is required'
      });
    });
  });

  describe('getMediaDetails', () => {
    it('should get media details successfully', async () => {
      mockRequest.params = { mediaId: 'media_123' };
      
      const mockMediaDetails = {
        id: 'media_123',
        mediaType: 'IMAGE',
        caption: 'Test post'
      };
      
      const mockService = {
        getMediaDetails: jest.fn().mockResolvedValue(mockMediaDetails)
      };
      
      (instagramService.createInstagramService as jest.Mock).mockReturnValue(mockService);
      controller = new InstagramController();
      
      await controller.getMediaDetails(mockRequest as any, mockResponse as Response);
      
      expect(mockService.getMediaDetails).toHaveBeenCalledWith('media_123');
      
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          media: mockMediaDetails
        }
      });
    });
  });

  describe('getAccountInsights', () => {
    it('should get account insights successfully', async () => {
      mockRequest.query = { period: 'week' };
      
      const mockInsights = {
        impressions: 1000,
        reach: 800,
        engagement: 100,
        saves: 20
      };
      
      const mockService = {
        getAccountInsights: jest.fn().mockResolvedValue(mockInsights)
      };
      
      (instagramService.createInstagramService as jest.Mock).mockReturnValue(mockService);
      controller = new InstagramController();
      
      await controller.getAccountInsights(mockRequest as any, mockResponse as Response);
      
      expect(mockService.getAccountInsights).toHaveBeenCalledWith('week');
      
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          insights: mockInsights,
          period: 'week'
        }
      });
    });
  });

  describe('getMediaComments', () => {
    it('should get media comments successfully', async () => {
      mockRequest.params = { mediaId: 'media_123' };
      
      const mockComments = [
        { id: 'comment_1', text: 'Great post!' },
        { id: 'comment_2', text: 'Love it!' }
      ];
      
      const mockService = {
        getMediaComments: jest.fn().mockResolvedValue(mockComments)
      };
      
      (instagramService.createInstagramService as jest.Mock).mockReturnValue(mockService);
      controller = new InstagramController();
      
      await controller.getMediaComments(mockRequest as any, mockResponse as Response);
      
      expect(mockService.getMediaComments).toHaveBeenCalledWith('media_123');
      
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          comments: mockComments,
          total: 2
        }
      });
    });
  });

  describe('replyToComment', () => {
    it('should reply to comment successfully', async () => {
      mockRequest.params = { commentId: 'comment_123' };
      mockRequest.body = { message: 'Thank you!' };
      
      const mockService = {
        replyToComment: jest.fn().mockResolvedValue({ id: 'reply_123' })
      };
      
      (instagramService.createInstagramService as jest.Mock).mockReturnValue(mockService);
      controller = new InstagramController();
      
      await controller.replyToComment(mockRequest as any, mockResponse as Response);
      
      expect(mockService.replyToComment).toHaveBeenCalledWith('comment_123', 'Thank you!');
      
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          reply: { id: 'reply_123' },
          message: 'Reply posted successfully'
        }
      });
    });
  });

  describe('deleteComment', () => {
    it('should delete comment successfully', async () => {
      mockRequest.params = { commentId: 'comment_123' };
      
      const mockService = {
        deleteComment: jest.fn().mockResolvedValue({ success: true })
      };
      
      (instagramService.createInstagramService as jest.Mock).mockReturnValue(mockService);
      controller = new InstagramController();
      
      await controller.deleteComment(mockRequest as any, mockResponse as Response);
      
      expect(mockService.deleteComment).toHaveBeenCalledWith('comment_123');
      
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          deleted: true,
          message: 'Comment deleted successfully'
        }
      });
    });
  });

  describe('searchHashtags', () => {
    it('should search hashtags successfully', async () => {
      mockRequest.query = { q: 'photography' };
      
      const mockHashtags = [
        { id: 'hashtag_1', name: 'photography' },
        { id: 'hashtag_2', name: 'photooftheday' }
      ];
      
      const mockService = {
        searchHashtags: jest.fn().mockResolvedValue(mockHashtags)
      };
      
      (instagramService.createInstagramService as jest.Mock).mockReturnValue(mockService);
      controller = new InstagramController();
      
      await controller.searchHashtags(mockRequest as any, mockResponse as Response);
      
      expect(mockService.searchHashtags).toHaveBeenCalledWith('photography');
      
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          hashtags: mockHashtags,
          query: 'photography'
        }
      });
    });
  });

  describe('getConnectionStatus', () => {
    it('should return connection status successfully', async () => {
      await controller.getConnectionStatus(mockRequest as any, mockResponse as Response);
      
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          connected: true,
          account: expect.objectContaining({
            id: '12345678901234567',
            username: 'mock_business_account',
            accountType: 'BUSINESS'
          })
        }
      });
    });
  });
});