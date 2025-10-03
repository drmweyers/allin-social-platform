import request from 'supertest';
import express from 'express';

// Mock dependencies before importing the routes
const mockInstagramController = {
  getAuthUrl: jest.fn((_req: any, res: any) => res.json({ authUrl: 'https://instagram.com/oauth' })),
  completeAuth: jest.fn((_req: any, res: any) => res.json({ success: true })),
  refreshToken: jest.fn((_req: any, res: any) => res.json({ token: 'new-token' })),
  getConnectionStatus: jest.fn((_req: any, res: any) => res.json({ connected: true })),
  getAccount: jest.fn((_req: any, res: any) => res.json({ id: 'instagram-123', username: 'testuser' })),
  getMedia: jest.fn((_req: any, res: any) => res.json({ media: [] })),
  createPost: jest.fn((_req: any, res: any) => res.json({ id: 'post-123' })),
  getMediaDetails: jest.fn((req: any, res: any) => res.json({ id: req.params.mediaId })),
  getMediaInsights: jest.fn((_req: any, res: any) => res.json({ likes: 100, comments: 10 })),
  getAccountInsights: jest.fn((_req: any, res: any) => res.json({ followers: 1000 })),
  getMediaComments: jest.fn((_req: any, res: any) => res.json({ comments: [] })),
  replyToComment: jest.fn((_req: any, res: any) => res.json({ id: 'reply-123' })),
  deleteComment: jest.fn((_req: any, res: any) => res.json({ deleted: true })),
  searchHashtags: jest.fn((_req: any, res: any) => res.json({ hashtags: [] })),
  getHashtagInsights: jest.fn((_req: any, res: any) => res.json({ posts: 500 })),
};

const mockRequireAuth = jest.fn((_req: any, _res: any, next: any) => next());

jest.mock('../controllers/instagram.controller', () => {
  return jest.fn().mockImplementation(() => mockInstagramController);
});

jest.mock('../middleware/auth', () => ({
  requireAuth: mockRequireAuth,
}));

// Import routes after mocking
import instagramRoutes from './instagram.routes';

describe('Instagram Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/instagram', instagramRoutes);
    jest.clearAllMocks();
  });

  describe('OAuth Authentication', () => {
    it('GET /auth/url - should get Instagram auth URL', async () => {
      const response = await request(app).get('/instagram/auth/url');

      expect(response.status).toBe(200);
      expect(response.body.authUrl).toBe('https://instagram.com/oauth');
      expect(mockInstagramController.getAuthUrl).toHaveBeenCalled();
    });

    it('POST /auth/callback - should complete Instagram authentication', async () => {
      const authData = { code: 'auth-code-123' };

      const response = await request(app)
        .post('/instagram/auth/callback')
        .send(authData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockInstagramController.completeAuth).toHaveBeenCalled();
    });

    it('POST /refresh-token - should refresh Instagram token', async () => {
      const response = await request(app)
        .post('/instagram/refresh-token')
        .send({ refreshToken: 'old-token' });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe('new-token');
      expect(mockInstagramController.refreshToken).toHaveBeenCalled();
    });

    it('GET /connection-status - should get connection status', async () => {
      const response = await request(app).get('/instagram/connection-status');

      expect(response.status).toBe(200);
      expect(response.body.connected).toBe(true);
      expect(mockInstagramController.getConnectionStatus).toHaveBeenCalled();
    });
  });

  describe('Account Management', () => {
    it('GET /account - should get Instagram account info', async () => {
      const response = await request(app).get('/instagram/account');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('instagram-123');
      expect(response.body.username).toBe('testuser');
      expect(mockInstagramController.getAccount).toHaveBeenCalled();
    });
  });

  describe('Media Management', () => {
    it('GET /media - should get Instagram media', async () => {
      const response = await request(app).get('/instagram/media');

      expect(response.status).toBe(200);
      expect(response.body.media).toEqual([]);
      expect(mockInstagramController.getMedia).toHaveBeenCalled();
    });

    it('POST /post - should create Instagram post', async () => {
      const postData = { 
        caption: 'Test post',
        imageUrl: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post('/instagram/post')
        .send(postData);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('post-123');
      expect(mockInstagramController.createPost).toHaveBeenCalled();
    });

    it('GET /media/:mediaId - should get media details', async () => {
      const mediaId = 'media-123';

      const response = await request(app).get(`/instagram/media/${mediaId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(mediaId);
      expect(mockInstagramController.getMediaDetails).toHaveBeenCalled();
    });
  });

  describe('Analytics and Insights', () => {
    it('GET /media/:mediaId/insights - should get media insights', async () => {
      const mediaId = 'media-123';

      const response = await request(app).get(`/instagram/media/${mediaId}/insights`);

      expect(response.status).toBe(200);
      expect(response.body.likes).toBe(100);
      expect(response.body.comments).toBe(10);
      expect(mockInstagramController.getMediaInsights).toHaveBeenCalled();
    });

    it('GET /insights - should get account insights', async () => {
      const response = await request(app).get('/instagram/insights');

      expect(response.status).toBe(200);
      expect(response.body.followers).toBe(1000);
      expect(mockInstagramController.getAccountInsights).toHaveBeenCalled();
    });
  });

  describe('Comment Management', () => {
    it('GET /media/:mediaId/comments - should get media comments', async () => {
      const mediaId = 'media-123';

      const response = await request(app).get(`/instagram/media/${mediaId}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.comments).toEqual([]);
      expect(mockInstagramController.getMediaComments).toHaveBeenCalled();
    });

    it('POST /comments/:commentId/reply - should reply to comment', async () => {
      const commentId = 'comment-123';
      const replyData = { text: 'Thanks for the comment!' };

      const response = await request(app)
        .post(`/instagram/comments/${commentId}/reply`)
        .send(replyData);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('reply-123');
      expect(mockInstagramController.replyToComment).toHaveBeenCalled();
    });

    it('DELETE /comments/:commentId - should delete comment', async () => {
      const commentId = 'comment-123';

      const response = await request(app).delete(`/instagram/comments/${commentId}`);

      expect(response.status).toBe(200);
      expect(response.body.deleted).toBe(true);
      expect(mockInstagramController.deleteComment).toHaveBeenCalled();
    });
  });

  describe('Hashtag Features', () => {
    it('GET /hashtags/search - should search hashtags', async () => {
      const response = await request(app)
        .get('/instagram/hashtags/search')
        .query({ q: 'travel' });

      expect(response.status).toBe(200);
      expect(response.body.hashtags).toEqual([]);
      expect(mockInstagramController.searchHashtags).toHaveBeenCalled();
    });

    it('GET /hashtags/:hashtagId/insights - should get hashtag insights', async () => {
      const hashtagId = 'hashtag-123';

      const response = await request(app).get(`/instagram/hashtags/${hashtagId}/insights`);

      expect(response.status).toBe(200);
      expect(response.body.posts).toBe(500);
      expect(mockInstagramController.getHashtagInsights).toHaveBeenCalled();
    });
  });

  describe('Authentication Middleware', () => {
    it('should apply authentication to all routes', async () => {
      await request(app).get('/instagram/account');
      
      expect(mockRequireAuth).toHaveBeenCalled();
    });
  });
});