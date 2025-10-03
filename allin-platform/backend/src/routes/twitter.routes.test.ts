import request from 'supertest';
import express from 'express';

// Mock dependencies before importing the routes
const mockTwitterController = {
  getAuthUrl: jest.fn((_req: any, res: any) => res.json({ authUrl: 'https://twitter.com/oauth' })),
  completeAuth: jest.fn((_req: any, res: any) => res.json({ success: true })),
  refreshToken: jest.fn((_req: any, res: any) => res.json({ token: 'new-token' })),
  getProfile: jest.fn((_req: any, res: any) => res.json({ id: 'twitter-123', username: 'testuser' })),
  getTweets: jest.fn((_req: any, res: any) => res.json({ tweets: [] })),
  createTweet: jest.fn((_req: any, res: any) => res.json({ id: 'tweet-123' })),
  getTweetDetails: jest.fn((req: any, res: any) => res.json({ id: req.params.id })),
  deleteTweet: jest.fn((req: any, res: any) => res.json({ deleted: req.params.id })),
  searchTweets: jest.fn((_req: any, res: any) => res.json({ tweets: [] })),
  getFollowers: jest.fn((_req: any, res: any) => res.json({ followers: [] })),
  getFollowing: jest.fn((_req: any, res: any) => res.json({ following: [] })),
  followUser: jest.fn((req: any, res: any) => res.json({ followed: req.params.userId })),
  unfollowUser: jest.fn((req: any, res: any) => res.json({ unfollowed: req.params.userId })),
  likeTweet: jest.fn((req: any, res: any) => res.json({ liked: req.params.tweetId })),
  unlikeTweet: jest.fn((req: any, res: any) => res.json({ unliked: req.params.tweetId })),
  retweet: jest.fn((req: any, res: any) => res.json({ retweeted: req.params.tweetId })),
  unretweet: jest.fn((req: any, res: any) => res.json({ unretweeted: req.params.tweetId })),
};

const mockRequireAuth = jest.fn((_req: any, _res: any, next: any) => next());

jest.mock('../controllers/twitter.controller', () => ({
  twitterController: mockTwitterController,
}));

jest.mock('../middleware/auth', () => ({
  requireAuth: mockRequireAuth,
}));

// Import routes after mocking
import twitterRoutes from './twitter.routes';

describe('Twitter Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/twitter', twitterRoutes);
    jest.clearAllMocks();
  });

  describe('OAuth Authentication', () => {
    it('GET /auth/url - should get Twitter auth URL', async () => {
      const response = await request(app).get('/twitter/auth/url');

      expect(response.status).toBe(200);
      expect(response.body.authUrl).toBe('https://twitter.com/oauth');
      expect(mockTwitterController.getAuthUrl).toHaveBeenCalled();
    });

    it('POST /auth/callback - should complete Twitter authentication', async () => {
      const authData = { code: 'auth-code-123' };

      const response = await request(app)
        .post('/twitter/auth/callback')
        .send(authData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockTwitterController.completeAuth).toHaveBeenCalled();
    });

    it('POST /auth/refresh - should refresh Twitter token', async () => {
      const response = await request(app)
        .post('/twitter/auth/refresh')
        .send({ refreshToken: 'old-token' });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe('new-token');
      expect(mockTwitterController.refreshToken).toHaveBeenCalled();
    });
  });

  describe('User Profile Management', () => {
    it('GET /user/me - should get user profile', async () => {
      const response = await request(app).get('/twitter/user/me');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('twitter-123');
      expect(response.body.username).toBe('testuser');
      expect(mockTwitterController.getProfile).toHaveBeenCalled();
    });
  });

  describe('Tweet Management', () => {
    it('GET /tweets - should get user tweets', async () => {
      const response = await request(app).get('/twitter/tweets');

      expect(response.status).toBe(200);
      expect(response.body.tweets).toEqual([]);
      expect(mockTwitterController.getTweets).toHaveBeenCalled();
    });

    it('POST /tweets - should create a tweet', async () => {
      const tweetData = { text: 'Hello Twitter!' };

      const response = await request(app)
        .post('/twitter/tweets')
        .send(tweetData);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('tweet-123');
      expect(mockTwitterController.createTweet).toHaveBeenCalled();
    });

    it('GET /tweets/:id - should get tweet details', async () => {
      const tweetId = 'tweet-123';

      const response = await request(app).get(`/twitter/tweets/${tweetId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(tweetId);
      expect(mockTwitterController.getTweetDetails).toHaveBeenCalled();
    });

    it('DELETE /tweets/:id - should delete a tweet', async () => {
      const tweetId = 'tweet-123';

      const response = await request(app).delete(`/twitter/tweets/${tweetId}`);

      expect(response.status).toBe(200);
      expect(response.body.deleted).toBe(tweetId);
      expect(mockTwitterController.deleteTweet).toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('GET /search - should search tweets', async () => {
      const response = await request(app)
        .get('/twitter/search')
        .query({ q: 'test search' });

      expect(response.status).toBe(200);
      expect(response.body.tweets).toEqual([]);
      expect(mockTwitterController.searchTweets).toHaveBeenCalled();
    });
  });

  describe('Social Interactions', () => {
    it('GET /followers - should get followers list', async () => {
      const response = await request(app).get('/twitter/followers');

      expect(response.status).toBe(200);
      expect(response.body.followers).toEqual([]);
      expect(mockTwitterController.getFollowers).toHaveBeenCalled();
    });

    it('GET /following - should get following list', async () => {
      const response = await request(app).get('/twitter/following');

      expect(response.status).toBe(200);
      expect(response.body.following).toEqual([]);
      expect(mockTwitterController.getFollowing).toHaveBeenCalled();
    });

    it('POST /follow/:userId - should follow a user', async () => {
      const userId = 'user-123';

      const response = await request(app).post(`/twitter/follow/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body.followed).toBe(userId);
      expect(mockTwitterController.followUser).toHaveBeenCalled();
    });

    it('DELETE /follow/:userId - should unfollow a user', async () => {
      const userId = 'user-123';

      const response = await request(app).delete(`/twitter/follow/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body.unfollowed).toBe(userId);
      expect(mockTwitterController.unfollowUser).toHaveBeenCalled();
    });
  });

  describe('Tweet Interactions', () => {
    it('POST /likes/:tweetId - should like a tweet', async () => {
      const tweetId = 'tweet-123';

      const response = await request(app).post(`/twitter/likes/${tweetId}`);

      expect(response.status).toBe(200);
      expect(response.body.liked).toBe(tweetId);
      expect(mockTwitterController.likeTweet).toHaveBeenCalled();
    });

    it('DELETE /likes/:tweetId - should unlike a tweet', async () => {
      const tweetId = 'tweet-123';

      const response = await request(app).delete(`/twitter/likes/${tweetId}`);

      expect(response.status).toBe(200);
      expect(response.body.unliked).toBe(tweetId);
      expect(mockTwitterController.unlikeTweet).toHaveBeenCalled();
    });

    it('POST /retweets/:tweetId - should retweet', async () => {
      const tweetId = 'tweet-123';

      const response = await request(app).post(`/twitter/retweets/${tweetId}`);

      expect(response.status).toBe(200);
      expect(response.body.retweeted).toBe(tweetId);
      expect(mockTwitterController.retweet).toHaveBeenCalled();
    });

    it('DELETE /retweets/:tweetId - should unretweet', async () => {
      const tweetId = 'tweet-123';

      const response = await request(app).delete(`/twitter/retweets/${tweetId}`);

      expect(response.status).toBe(200);
      expect(response.body.unretweeted).toBe(tweetId);
      expect(mockTwitterController.unretweet).toHaveBeenCalled();
    });
  });

  describe('Authentication Middleware', () => {
    it('should apply authentication to all routes', async () => {
      await request(app).get('/twitter/user/me');
      
      expect(mockRequireAuth).toHaveBeenCalled();
    });
  });
});