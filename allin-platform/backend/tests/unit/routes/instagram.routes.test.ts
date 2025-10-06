import request from 'supertest';
import express from 'express';

// Mock Instagram Service BEFORE any imports
jest.mock('../../../src/services/instagram.service', () => ({
  createInstagramService: jest.fn(() => ({
    generateAuthUrl: jest.fn().mockReturnValue({
      authUrl: 'https://instagram.com/oauth',
      state: 'test-state'
    }),
    exchangeCodeForToken: jest.fn(),
    refreshAccessToken: jest.fn(),
    getProfile: jest.fn(),
    getMedia: jest.fn(),
    createPost: jest.fn()
  })),
  InstagramService: jest.fn()
}));

// Mock Instagram Controller
jest.mock('../../../src/controllers/instagram.controller', () => {
  return class MockInstagramController {
    async getAuthUrl(_req: any, res: any) {
      res.json({ success: true, url: 'https://instagram.com/oauth' });
    }
    async completeAuth(_req: any, res: any) {
      res.json({ success: true, connected: true });
    }
    async refreshToken(_req: any, res: any) {
      res.json({ success: true, token: 'new-token' });
    }
    async getConnectionStatus(_req: any, res: any) {
      res.json({ success: true, connected: true });
    }
    async getAccount(_req: any, res: any) {
      res.json({ success: true, account: { id: 'ig-123', username: 'test_account' } });
    }
    async getMedia(_req: any, res: any) {
      res.json({ success: true, media: [] });
    }
    async createPost(_req: any, res: any) {
      res.status(201).json({ success: true, post: { id: 'post-123' } });
    }
    async getMediaDetails(req: any, res: any) {
      res.json({ success: true, media: { id: req.params.mediaId } });
    }
    async getMediaInsights(_req: any, res: any) {
      res.json({ success: true, insights: { likes: 100, comments: 50 } });
    }
    async getAccountInsights(_req: any, res: any) {
      res.json({ success: true, insights: { followers: 1000 } });
    }
    async getMediaComments(_req: any, res: any) {
      res.json({ success: true, comments: [] });
    }
    async replyToComment(_req: any, res: any) {
      res.json({ success: true, reply: { id: 'reply-123' } });
    }
    async deleteComment(_req: any, res: any) {
      res.status(204).send();
    }
    async searchHashtags(_req: any, res: any) {
      res.json({ success: true, hashtags: [] });
    }
    async getHashtagInsights(_req: any, res: any) {
      res.json({ success: true, insights: { posts: 5000 } });
    }
  };
});

// Mock authentication middleware
jest.mock('../../../src/middleware/auth', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123'
    };
    next();
  }
}));

// NOW import the routes
import instagramRoutes from '../../../src/routes/instagram.routes';

const app = express();
app.use(express.json());
app.use('/api/instagram', instagramRoutes);

describe('Instagram Routes', () => {
  describe('OAuth Authentication Routes', () => {
    it('should get Instagram OAuth URL', async () => {
      const response = await request(app)
        .get('/api/instagram/auth/url')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.url).toBeDefined();
    });

    it('should complete Instagram OAuth', async () => {
      const response = await request(app)
        .post('/api/instagram/auth/callback')
        .send({ code: 'oauth-code-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.connected).toBe(true);
    });

    it('should refresh Instagram token', async () => {
      const response = await request(app)
        .post('/api/instagram/refresh-token')
        .send({ accountId: 'ig-account-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it('should get Instagram connection status', async () => {
      const response = await request(app)
        .get('/api/instagram/connection-status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.connected).toBeDefined();
    });
  });

  describe('Account Management Routes', () => {
    it('should get Instagram account information', async () => {
      const response = await request(app)
        .get('/api/instagram/account')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.account).toBeDefined();
      expect(response.body.account.id).toBe('ig-123');
      expect(response.body.account.username).toBe('test_account');
    });
  });

  describe('Media Management Routes', () => {
    it('should get user media list', async () => {
      const response = await request(app)
        .get('/api/instagram/media')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.media).toBeDefined();
    });

    it('should create Instagram post', async () => {
      const response = await request(app)
        .post('/api/instagram/post')
        .send({
          caption: 'Test post',
          imageUrl: 'https://example.com/image.jpg'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.post).toBeDefined();
      expect(response.body.post.id).toBe('post-123');
    });

    it('should get media details by ID', async () => {
      const response = await request(app)
        .get('/api/instagram/media/media-456')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.media).toBeDefined();
      expect(response.body.media.id).toBe('media-456');
    });
  });

  describe('Analytics and Insights Routes', () => {
    it('should get media insights', async () => {
      const response = await request(app)
        .get('/api/instagram/media/media-456/insights')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.insights).toBeDefined();
      expect(response.body.insights.likes).toBe(100);
      expect(response.body.insights.comments).toBe(50);
    });

    it('should get account insights', async () => {
      const response = await request(app)
        .get('/api/instagram/insights')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.insights).toBeDefined();
      expect(response.body.insights.followers).toBe(1000);
    });
  });

  describe('Comment Management Routes', () => {
    it('should get media comments', async () => {
      const response = await request(app)
        .get('/api/instagram/media/media-456/comments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.comments).toBeDefined();
    });

    it('should reply to comment', async () => {
      const response = await request(app)
        .post('/api/instagram/comments/comment-789/reply')
        .send({ text: 'Thanks for your comment!' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.reply).toBeDefined();
      expect(response.body.reply.id).toBe('reply-123');
    });

    it('should delete comment', async () => {
      await request(app)
        .delete('/api/instagram/comments/comment-789')
        .expect(204);
    });
  });

  describe('Hashtag Features Routes', () => {
    it('should search hashtags', async () => {
      const response = await request(app)
        .get('/api/instagram/hashtags/search')
        .query({ q: 'travel' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hashtags).toBeDefined();
    });

    it('should get hashtag insights', async () => {
      const response = await request(app)
        .get('/api/instagram/hashtags/hashtag-123/insights')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.insights).toBeDefined();
      expect(response.body.insights.posts).toBe(5000);
    });
  });
});
