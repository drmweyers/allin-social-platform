import request from 'supertest';
import express from 'express';

// Mock Twitter Service BEFORE any imports
jest.mock('../../../src/services/twitter.service', () => ({
  TwitterService: jest.fn().mockImplementation(() => ({
    generateAuthUrl: jest.fn().mockReturnValue({
      authUrl: 'https://twitter.com/oauth',
      state: 'test-state',
      codeChallenge: 'challenge',
      codeVerifier: 'verifier'
    }),
    exchangeCodeForToken: jest.fn(),
    refreshAccessToken: jest.fn(),
    getUserProfile: jest.fn(),
    getTweets: jest.fn(),
    createTweet: jest.fn(),
    deleteTweet: jest.fn()
  })),
  twitterService: {
    generateAuthUrl: jest.fn(),
    exchangeCodeForToken: jest.fn(),
    refreshAccessToken: jest.fn(),
    getUserProfile: jest.fn(),
    getTweets: jest.fn(),
    createTweet: jest.fn(),
    deleteTweet: jest.fn()
  }
}));

// Mock Twitter Controller as CLASS
jest.mock('../../../src/controllers/twitter.controller', () => ({
  TwitterController: class MockTwitterController {
    async getAuthUrl(_req: any, res: any) {
      res.json({ success: true, url: 'https://twitter.com/oauth' });
    }
    async completeAuth(_req: any, res: any) {
      res.json({ success: true, connected: true });
    }
    async refreshToken(_req: any, res: any) {
      res.json({ success: true, token: 'new-token' });
    }
    async getProfile(_req: any, res: any) {
      res.json({ success: true, profile: { id: 'tw-123', username: '@testuser' } });
    }
    async getTweets(_req: any, res: any) {
      res.json({ success: true, tweets: [] });
    }
    async createTweet(_req: any, res: any) {
      res.status(201).json({ success: true, tweet: { id: 'tweet-123' } });
    }
    async getTweetDetails(req: any, res: any) {
      res.json({ success: true, tweet: { id: req.params.id } });
    }
    async deleteTweet(_req: any, res: any) {
      res.status(204).send();
    }
    async searchTweets(_req: any, res: any) {
      res.json({ success: true, tweets: [] });
    }
    async getFollowers(_req: any, res: any) {
      res.json({ success: true, followers: [] });
    }
    async getFollowing(_req: any, res: any) {
      res.json({ success: true, following: [] });
    }
    async followUser(_req: any, res: any) {
      res.json({ success: true, followed: true });
    }
    async unfollowUser(_req: any, res: any) {
      res.json({ success: true, unfollowed: true });
    }
    async likeTweet(_req: any, res: any) {
      res.json({ success: true, liked: true });
    }
    async unlikeTweet(_req: any, res: any) {
      res.json({ success: true, unliked: true });
    }
    async retweet(_req: any, res: any) {
      res.json({ success: true, retweeted: true });
    }
    async unretweet(_req: any, res: any) {
      res.json({ success: true, unretweeted: true });
    }
  }
}));

// Mock authentication middleware
jest.mock('../../../src/middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123'
    };
    next();
  }
}));

// NOW import the routes
import twitterRoutes from '../../../src/routes/twitter.routes';

const app = express();
app.use(express.json());
app.use('/api/twitter', twitterRoutes);

describe('Twitter Routes', () => {
  describe('OAuth Authentication Routes', () => {
    it('should get Twitter OAuth URL', async () => {
      const response = await request(app)
        .get('/api/twitter/auth/url')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.url).toBeDefined();
    });

    it('should complete Twitter OAuth', async () => {
      const response = await request(app)
        .post('/api/twitter/auth/callback')
        .send({ code: 'oauth-code-123', verifier: 'verifier-abc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.connected).toBe(true);
    });

    it('should refresh Twitter access token', async () => {
      const response = await request(app)
        .post('/api/twitter/auth/refresh')
        .send({ accountId: 'tw-account-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });
  });

  describe('User Profile Routes', () => {
    it('should get authenticated user profile', async () => {
      const response = await request(app)
        .get('/api/twitter/user/me')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.id).toBe('tw-123');
      expect(response.body.profile.username).toBe('@testuser');
    });
  });

  describe('Tweet Management Routes', () => {
    it('should get user tweets', async () => {
      const response = await request(app)
        .get('/api/twitter/tweets')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tweets).toBeDefined();
    });

    it('should create a new tweet', async () => {
      const response = await request(app)
        .post('/api/twitter/tweets')
        .send({ text: 'Hello Twitter!' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.tweet).toBeDefined();
      expect(response.body.tweet.id).toBe('tweet-123');
    });

    it('should get tweet details', async () => {
      const response = await request(app)
        .get('/api/twitter/tweets/tweet-456')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tweet.id).toBe('tweet-456');
    });

    it('should delete a tweet', async () => {
      await request(app)
        .delete('/api/twitter/tweets/tweet-456')
        .expect(204);
    });
  });

  describe('Search Routes', () => {
    it('should search tweets', async () => {
      const response = await request(app)
        .get('/api/twitter/search')
        .query({ q: 'nodejs', count: 20 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tweets).toBeDefined();
    });
  });

  describe('Social Interaction Routes', () => {
    it('should get followers list', async () => {
      const response = await request(app)
        .get('/api/twitter/followers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.followers).toBeDefined();
    });

    it('should get following list', async () => {
      const response = await request(app)
        .get('/api/twitter/following')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.following).toBeDefined();
    });

    it('should follow a user', async () => {
      const response = await request(app)
        .post('/api/twitter/follow/user-789')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.followed).toBe(true);
    });

    it('should unfollow a user', async () => {
      const response = await request(app)
        .delete('/api/twitter/follow/user-789')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.unfollowed).toBe(true);
    });
  });

  describe('Tweet Interaction Routes', () => {
    it('should like a tweet', async () => {
      const response = await request(app)
        .post('/api/twitter/likes/tweet-789')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.liked).toBe(true);
    });

    it('should unlike a tweet', async () => {
      const response = await request(app)
        .delete('/api/twitter/likes/tweet-789')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.unliked).toBe(true);
    });

    it('should retweet a tweet', async () => {
      const response = await request(app)
        .post('/api/twitter/retweets/tweet-789')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.retweeted).toBe(true);
    });

    it('should unretweet a tweet', async () => {
      const response = await request(app)
        .delete('/api/twitter/retweets/tweet-789')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.unretweeted).toBe(true);
    });
  });
});
