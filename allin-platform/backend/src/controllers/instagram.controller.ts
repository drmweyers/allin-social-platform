import { Request, Response } from 'express';
import { createInstagramService, InstagramService, InstagramPostRequest } from '../services/instagram.service';

export class InstagramController {
  private instagramService: InstagramService;

  constructor() {
    this.instagramService = createInstagramService();
  }

  /**
   * GET /api/instagram/auth/url
   * Get Instagram OAuth authorization URL
   */
  async getAuthUrl(_req: Request, res: Response): Promise<void> {
    try {
      const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:3011'}/dashboard/social/instagram/callback`;
      const scopes = ['instagram_basic', 'instagram_content_publish', 'pages_show_list'];
      
      const authResponse = this.instagramService.generateAuthUrl(redirectUri, scopes);
      
      res.json({
        success: true,
        data: {
          authUrl: authResponse.authUrl,
          state: authResponse.state
        }
      });
    } catch (error) {
      console.error('Instagram auth URL error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate Instagram authorization URL',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * POST /api/instagram/auth/callback
   * Complete Instagram OAuth authentication
   */
  async completeAuth(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.body;
      
      if (!code) {
        res.status(400).json({
          success: false,
          message: 'Authorization code is required'
        });
        return;
      }

      const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:3011'}/dashboard/social/instagram/callback`;
      
      // Exchange code for access token
      const tokenResponse = await this.instagramService.exchangeCodeForToken(code, redirectUri);
      
      // Exchange short-lived token for long-lived token
      const longLivedTokenResponse = await this.instagramService.exchangeForLongLivedToken(tokenResponse.accessToken);
      
      // Get user account information
      const userAccount = await this.instagramService.getBusinessAccount(longLivedTokenResponse.accessToken);

      // In a real application, save these tokens and account info to the database
      res.json({
        success: true,
        data: {
          user: userAccount,
          accessToken: longLivedTokenResponse.accessToken,
          expiresIn: longLivedTokenResponse.expiresIn,
          connected: true,
          message: 'Instagram account connected successfully'
        }
      });
    } catch (error) {
      console.error('Instagram auth callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete Instagram authentication',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * POST /api/instagram/refresh-token
   * Refresh Instagram access token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { accessToken } = req.body;
      
      if (!accessToken) {
        res.status(400).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      const refreshResponse = await this.instagramService.refreshAccessToken(accessToken);

      res.json({
        success: true,
        data: {
          accessToken: refreshResponse.accessToken,
          expiresIn: refreshResponse.expiresIn,
          message: 'Token refreshed successfully'
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh access token',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * GET /api/instagram/account
   * Get Instagram business account information
   */
  async getAccount(_req: Request, res: Response): Promise<void> {
    try {
      // For development testing, return mock connected state
      const account = await this.instagramService.getBusinessAccount();

      res.json({
        success: true,
        data: {
          account
        }
      });
    } catch (error) {
      console.error('Get account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Instagram account',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * GET /api/instagram/media
   * Get user's Instagram media
   */
  async getMedia(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 25 } = req.query;
      
      const media = await this.instagramService.getUserMedia(
        undefined,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: {
          media,
          total: media.length
        }
      });
    } catch (error) {
      console.error('Get media error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Instagram media',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * POST /api/instagram/post
   * Create a new Instagram post
   */
  async createPost(req: Request, res: Response): Promise<void> {
    try {
      const { imageUrl, caption } = req.body;
      
      if (!imageUrl) {
        res.status(400).json({
          success: false,
          message: 'Image URL is required'
        });
        return;
      }

      const postData: InstagramPostRequest = {
        imageUrl,
        caption: caption || ''
      };

      // Step 1: Create media container
      const container = await this.instagramService.createMediaContainer(postData);
      
      // Step 2: Wait for 15 seconds (Instagram requirement)
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      // Step 3: Publish the media container
      const publishedMedia = await this.instagramService.publishMediaContainer(container.id);

      res.json({
        success: true,
        data: {
          media: publishedMedia,
          message: 'Instagram post created successfully'
        }
      });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create Instagram post',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * GET /api/instagram/media/:mediaId
   * Get specific media details
   */
  async getMediaDetails(req: Request, res: Response): Promise<void> {
    try {
      const { mediaId } = req.params;
      
      if (!mediaId) {
        res.status(400).json({
          success: false,
          message: 'Media ID is required'
        });
        return;
      }

      const media = await this.instagramService.getMediaDetails(mediaId);

      res.json({
        success: true,
        data: {
          media
        }
      });
    } catch (error) {
      console.error('Get media details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch media details',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * GET /api/instagram/media/:mediaId/insights
   * Get media insights
   */
  async getMediaInsights(req: Request, res: Response): Promise<void> {
    try {
      const { mediaId } = req.params;
      
      if (!mediaId) {
        res.status(400).json({
          success: false,
          message: 'Media ID is required'
        });
        return;
      }

      const insights = await this.instagramService.getMediaInsights(mediaId);

      res.json({
        success: true,
        data: {
          insights,
          mediaId
        }
      });
    } catch (error) {
      console.error('Get media insights error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch media insights',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * GET /api/instagram/insights
   * Get account insights
   */
  async getAccountInsights(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'day' } = req.query;

      const insights = await this.instagramService.getAccountInsights(
        period as 'day' | 'week' | 'days_28'
      );

      res.json({
        success: true,
        data: {
          insights,
          period
        }
      });
    } catch (error) {
      console.error('Get account insights error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch account insights',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * GET /api/instagram/media/:mediaId/comments
   * Get media comments
   */
  async getMediaComments(req: Request, res: Response): Promise<void> {
    try {
      const { mediaId } = req.params;
      
      if (!mediaId) {
        res.status(400).json({
          success: false,
          message: 'Media ID is required'
        });
        return;
      }

      const comments = await this.instagramService.getMediaComments(mediaId);

      res.json({
        success: true,
        data: {
          comments,
          total: comments.length
        }
      });
    } catch (error) {
      console.error('Get media comments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch media comments',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * POST /api/instagram/comments/:commentId/reply
   * Reply to a comment
   */
  async replyToComment(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const { message } = req.body;
      
      if (!commentId || !message) {
        res.status(400).json({
          success: false,
          message: 'Comment ID and message are required'
        });
        return;
      }

      const reply = await this.instagramService.replyToComment(commentId, message);

      res.json({
        success: true,
        data: {
          reply,
          message: 'Reply posted successfully'
        }
      });
    } catch (error) {
      console.error('Reply to comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reply to comment',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * DELETE /api/instagram/comments/:commentId
   * Delete a comment
   */
  async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      
      if (!commentId) {
        res.status(400).json({
          success: false,
          message: 'Comment ID is required'
        });
        return;
      }

      const result = await this.instagramService.deleteComment(commentId);

      res.json({
        success: true,
        data: {
          deleted: result.success,
          message: 'Comment deleted successfully'
        }
      });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete comment',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * GET /api/instagram/hashtags/search
   * Search hashtags
   */
  async searchHashtags(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      
      if (!q) {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
        return;
      }

      const hashtags = await this.instagramService.searchHashtags(q as string);

      res.json({
        success: true,
        data: {
          hashtags,
          query: q
        }
      });
    } catch (error) {
      console.error('Search hashtags error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search hashtags',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * GET /api/instagram/hashtags/:hashtagId/insights
   * Get hashtag insights
   */
  async getHashtagInsights(req: Request, res: Response): Promise<void> {
    try {
      const { hashtagId } = req.params;
      
      if (!hashtagId) {
        res.status(400).json({
          success: false,
          message: 'Hashtag ID is required'
        });
        return;
      }

      const insights = await this.instagramService.getHashtagInsights(hashtagId);

      res.json({
        success: true,
        data: {
          insights,
          hashtagId
        }
      });
    } catch (error) {
      console.error('Get hashtag insights error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch hashtag insights',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * GET /api/instagram/connection-status
   * Check if Instagram account is connected
   */
  async getConnectionStatus(_req: Request, res: Response): Promise<void> {
    try {
      // For development testing, return mock connected state
      const mockAccount = {
        id: '12345678901234567',
        username: 'mock_business_account',
        name: 'Mock Business Account',
        profilePictureUrl: 'https://via.placeholder.com/150',
        accountType: 'BUSINESS' as const,
        mediaCount: 142,
        followersCount: 5234,
        followsCount: 487
      };

      res.json({
        success: true,
        data: {
          connected: true,
          account: mockAccount
        }
      });
    } catch (error) {
      console.error('Get connection status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check connection status',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
}

export default InstagramController;