import { Request, Response } from 'express';
import { twitterService, TwitterPostRequest } from '../services/twitter.service';

export class TwitterController {
  /**
   * GET /api/twitter/auth/url
   * Get Twitter OAuth authorization URL
   */
  async getAuthUrl(_req: Request, res: Response): Promise<void> {
    try {
      const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/social/twitter/callback`;
      const scopes = ['tweet.read', 'tweet.write', 'users.read', 'follows.read', 'follows.write', 'like.read', 'like.write'];
      
      const authResponse = twitterService.generateAuthUrl(redirectUri, scopes);
      
      res.json({
        success: true,
        data: {
          authUrl: authResponse.authUrl,
          state: authResponse.state,
          codeChallenge: authResponse.codeChallenge,
          codeVerifier: authResponse.codeVerifier
        }
      });
    } catch (error) {
      console.error('Twitter auth URL error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate Twitter authorization URL',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * POST /api/twitter/auth/callback
   * Complete Twitter OAuth authentication
   */
  async completeAuth(req: Request, res: Response): Promise<void> {
    try {
      const { code, codeVerifier } = req.body;
      
      if (!code || !codeVerifier) {
        res.status(400).json({
          success: false,
          message: 'Authorization code and code verifier are required'
        });
        return;
      }

      const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/social/twitter/callback`;
      
      // Exchange authorization code for access token
      const tokenResponse = await twitterService.exchangeCodeForToken(code, redirectUri, codeVerifier);
      
      // Get user information
      const userInfo = await twitterService.getMe(tokenResponse.accessToken);
      
      res.json({
        success: true,
        data: {
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          expiresIn: tokenResponse.expiresIn,
          user: userInfo
        }
      });
    } catch (error) {
      console.error('Twitter auth callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete Twitter authentication',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * POST /api/twitter/auth/refresh
   * Refresh Twitter access token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
        return;
      }

      const tokenResponse = await twitterService.refreshAccessToken(refreshToken);
      
      res.json({
        success: true,
        data: tokenResponse
      });
    } catch (error) {
      console.error('Twitter token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh Twitter access token',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * GET /api/twitter/user/me
   * Get authenticated user profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      
      if (!accessToken) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      const user = await twitterService.getMe(accessToken);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Twitter get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Twitter user profile',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * GET /api/twitter/tweets
   * Get user tweets
   */
  async getTweets(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const { userId, maxResults = 10 } = req.query;
      
      if (!accessToken) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      const tweets = await twitterService.getUserTweets(
        userId as string, 
        parseInt(maxResults as string, 10), 
        accessToken
      );
      
      res.json({
        success: true,
        data: tweets
      });
    } catch (error) {
      console.error('Twitter get tweets error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Twitter tweets',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * GET /api/twitter/tweets/:id
   * Get specific tweet details
   */
  async getTweetDetails(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const { id } = req.params;
      
      if (!accessToken) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Tweet ID is required'
        });
        return;
      }

      const tweet = await twitterService.getTweetDetails(id, accessToken);
      
      res.json({
        success: true,
        data: tweet
      });
    } catch (error) {
      console.error('Twitter get tweet details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Twitter tweet details',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * POST /api/twitter/tweets
   * Create a new tweet
   */
  async createTweet(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const tweetData: TwitterPostRequest = req.body;
      
      if (!accessToken) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      if (!tweetData.text || tweetData.text.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Tweet text is required'
        });
        return;
      }

      if (tweetData.text.length > 280) {
        res.status(400).json({
          success: false,
          message: 'Tweet text exceeds 280 character limit'
        });
        return;
      }

      const tweet = await twitterService.createTweet(tweetData, accessToken);
      
      res.json({
        success: true,
        data: tweet,
        message: 'Tweet created successfully'
      });
    } catch (error) {
      console.error('Twitter create tweet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create Twitter tweet',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * DELETE /api/twitter/tweets/:id
   * Delete a tweet
   */
  async deleteTweet(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const { id } = req.params;
      
      if (!accessToken) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Tweet ID is required'
        });
        return;
      }

      const result = await twitterService.deleteTweet(id, accessToken);
      
      res.json({
        success: true,
        data: result,
        message: 'Tweet deleted successfully'
      });
    } catch (error) {
      console.error('Twitter delete tweet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete Twitter tweet',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * GET /api/twitter/search
   * Search tweets
   */
  async searchTweets(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const { query, maxResults = 10 } = req.query;
      
      if (!accessToken) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      if (!query) {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
        return;
      }

      const tweets = await twitterService.searchTweets(
        query as string, 
        parseInt(maxResults as string, 10), 
        accessToken
      );
      
      res.json({
        success: true,
        data: tweets
      });
    } catch (error) {
      console.error('Twitter search tweets error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search Twitter tweets',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * GET /api/twitter/followers
   * Get user followers
   */
  async getFollowers(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const { userId, maxResults = 100 } = req.query;
      
      if (!accessToken) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      const followers = await twitterService.getFollowers(
        userId as string, 
        parseInt(maxResults as string, 10), 
        accessToken
      );
      
      res.json({
        success: true,
        data: followers
      });
    } catch (error) {
      console.error('Twitter get followers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Twitter followers',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * GET /api/twitter/following
   * Get users being followed
   */
  async getFollowing(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const { userId, maxResults = 100 } = req.query;
      
      if (!accessToken) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      const following = await twitterService.getFollowing(
        userId as string, 
        parseInt(maxResults as string, 10), 
        accessToken
      );
      
      res.json({
        success: true,
        data: following
      });
    } catch (error) {
      console.error('Twitter get following error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Twitter following',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * POST /api/twitter/follow/:userId
   * Follow a user
   */
  async followUser(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const { userId } = req.params;
      
      if (!accessToken) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      const result = await twitterService.followUser(userId, accessToken);
      
      res.json({
        success: true,
        data: result,
        message: 'User followed successfully'
      });
    } catch (error) {
      console.error('Twitter follow user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to follow Twitter user',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * DELETE /api/twitter/follow/:userId
   * Unfollow a user
   */
  async unfollowUser(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const { userId } = req.params;
      
      if (!accessToken) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      const result = await twitterService.unfollowUser(userId, accessToken);
      
      res.json({
        success: true,
        data: result,
        message: 'User unfollowed successfully'
      });
    } catch (error) {
      console.error('Twitter unfollow user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unfollow Twitter user',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * POST /api/twitter/likes/:tweetId
   * Like a tweet
   */
  async likeTweet(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const { tweetId } = req.params;
      
      if (!accessToken) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      if (!tweetId) {
        res.status(400).json({
          success: false,
          message: 'Tweet ID is required'
        });
        return;
      }

      const result = await twitterService.likeTweet(tweetId, accessToken);
      
      res.json({
        success: true,
        data: result,
        message: 'Tweet liked successfully'
      });
    } catch (error) {
      console.error('Twitter like tweet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to like Twitter tweet',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * DELETE /api/twitter/likes/:tweetId
   * Unlike a tweet
   */
  async unlikeTweet(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const { tweetId } = req.params;
      
      if (!accessToken) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      if (!tweetId) {
        res.status(400).json({
          success: false,
          message: 'Tweet ID is required'
        });
        return;
      }

      const result = await twitterService.unlikeTweet(tweetId, accessToken);
      
      res.json({
        success: true,
        data: result,
        message: 'Tweet unliked successfully'
      });
    } catch (error) {
      console.error('Twitter unlike tweet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unlike Twitter tweet',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * POST /api/twitter/retweets/:tweetId
   * Retweet a tweet
   */
  async retweet(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const { tweetId } = req.params;
      
      if (!accessToken) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      if (!tweetId) {
        res.status(400).json({
          success: false,
          message: 'Tweet ID is required'
        });
        return;
      }

      const result = await twitterService.retweet(tweetId, accessToken);
      
      res.json({
        success: true,
        data: result,
        message: 'Tweet retweeted successfully'
      });
    } catch (error) {
      console.error('Twitter retweet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retweet Twitter tweet',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * DELETE /api/twitter/retweets/:tweetId
   * Unretweet a tweet
   */
  async unretweet(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const { tweetId } = req.params;
      
      if (!accessToken) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      if (!tweetId) {
        res.status(400).json({
          success: false,
          message: 'Tweet ID is required'
        });
        return;
      }

      const result = await twitterService.unretweet(tweetId, accessToken);
      
      res.json({
        success: true,
        data: result,
        message: 'Tweet unretweeted successfully'
      });
    } catch (error) {
      console.error('Twitter unretweet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unretweet Twitter tweet',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
}

// Export singleton instance
export const twitterController = new TwitterController();