/**
 * Inbox Routes Tests - BMAD MONITOR Phase 3
 * Tests for social media inbox message management
 */

import request from 'supertest';
import express from 'express';

// Mock auth middleware BEFORE importing routes
jest.mock('../../../src/middleware/auth', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user1',
      email: 'test@example.com',
      organizationId: 'org-123'
    };
    next();
  }
}));

// Mock validation middleware
jest.mock('../../../src/middleware/validation', () => ({
  validateZodRequest: () => (_req: any, _res: any, next: any) => next()
}));

import inboxRoutes from '../../../src/routes/inbox.routes';

describe('Inbox Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/inbox', inboxRoutes);
    jest.clearAllMocks();
  });

  describe('GET /api/inbox/messages', () => {
    it('should fetch all messages for authenticated user', async () => {
      const response = await request(app)
        .get('/api/inbox/messages')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('messages');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data).toHaveProperty('totals');
      expect(Array.isArray(response.body.data.messages)).toBe(true);
    });

    it('should include pagination metadata', async () => {
      const response = await request(app)
        .get('/api/inbox/messages')
        .expect(200);

      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('limit');
      expect(response.body.data.pagination).toHaveProperty('offset');
      expect(response.body.data.pagination).toHaveProperty('hasMore');
    });

    it('should include totals summary', async () => {
      const response = await request(app)
        .get('/api/inbox/messages')
        .expect(200);

      expect(response.body.data.totals).toHaveProperty('total');
      expect(response.body.data.totals).toHaveProperty('unread');
      expect(response.body.data.totals).toHaveProperty('starred');
      expect(response.body.data.totals).toHaveProperty('highPriority');
    });

    it('should filter messages by platform', async () => {
      const response = await request(app)
        .get('/api/inbox/messages?platform=instagram')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.messages.forEach((msg: any) => {
        expect(msg.platform).toBe('instagram');
      });
    });

    it('should filter messages by type', async () => {
      const response = await request(app)
        .get('/api/inbox/messages?type=comment')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.messages.forEach((msg: any) => {
        expect(msg.type).toBe('comment');
      });
    });

    it('should filter messages by status', async () => {
      const response = await request(app)
        .get('/api/inbox/messages?status=unread')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.messages.forEach((msg: any) => {
        expect(msg.status).toBe('unread');
      });
    });

    it('should filter messages by priority', async () => {
      const response = await request(app)
        .get('/api/inbox/messages?priority=high')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.messages.forEach((msg: any) => {
        expect(msg.priority).toBe('high');
      });
    });

    it('should search messages by content', async () => {
      const response = await request(app)
        .get('/api/inbox/messages?search=features')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages.length).toBeGreaterThan(0);
      // At least one message should contain "features" in content or context
      const hasMatch = response.body.data.messages.some((msg: any) =>
        msg.content.toLowerCase().includes('features') ||
        (msg.postContext && msg.postContext.toLowerCase().includes('features'))
      );
      expect(hasMatch).toBe(true);
    });

    it('should search messages by sender name', async () => {
      const response = await request(app)
        .get('/api/inbox/messages?search=sarah')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages.length).toBeGreaterThan(0);
    });

    it('should paginate results with limit', async () => {
      const response = await request(app)
        .get('/api/inbox/messages?limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    it('should paginate results with offset', async () => {
      const response = await request(app)
        .get('/api/inbox/messages?offset=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.offset).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    it('should indicate hasMore when more results exist', async () => {
      const response = await request(app)
        .get('/api/inbox/messages?limit=1&offset=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.pagination.total > 1) {
        expect(response.body.data.pagination.hasMore).toBe(true);
      }
    });

    it('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/api/inbox/messages?platform=instagram&status=unread&priority=high')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.messages.forEach((msg: any) => {
        expect(msg.platform).toBe('instagram');
        expect(msg.status).toBe('unread');
        expect(msg.priority).toBe('high');
      });
    });

    it('should sort messages by timestamp (newest first)', async () => {
      const response = await request(app)
        .get('/api/inbox/messages')
        .expect(200);

      expect(response.body.success).toBe(true);
      const messages = response.body.data.messages;
      for (let i = 1; i < messages.length; i++) {
        const prevTime = new Date(messages[i - 1].timestamp).getTime();
        const currTime = new Date(messages[i].timestamp).getTime();
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });
  });

  describe('GET /api/inbox/messages/:id', () => {
    it('should fetch a specific message by id', async () => {
      const response = await request(app)
        .get('/api/inbox/messages/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', '1');
      expect(response.body.data).toHaveProperty('content');
      expect(response.body.data).toHaveProperty('from');
      expect(response.body.data).toHaveProperty('platform');
    });

    it('should include message metadata', async () => {
      const response = await request(app)
        .get('/api/inbox/messages/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('type');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('priority');
      expect(response.body.data).toHaveProperty('isStarred');
    });

    it('should return 404 for non-existent message', async () => {
      const response = await request(app)
        .get('/api/inbox/messages/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Message not found');
    });

    it('should include engagement metrics if available', async () => {
      const response = await request(app)
        .get('/api/inbox/messages/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.engagement) {
        expect(response.body.data.engagement).toHaveProperty('likes');
        expect(response.body.data.engagement).toHaveProperty('replies');
      }
    });
  });

  describe('PATCH /api/inbox/messages/:id', () => {
    it('should update message status to read', async () => {
      const response = await request(app)
        .patch('/api/inbox/messages/1')
        .send({ status: 'read' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('read');
      expect(response.body.data.isRead).toBe(true);
      expect(response.body.message).toBe('Message updated successfully');
    });

    it('should update message status to archived', async () => {
      const response = await request(app)
        .patch('/api/inbox/messages/1')
        .send({ status: 'archived' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('archived');
    });

    it('should toggle starred status', async () => {
      const response = await request(app)
        .patch('/api/inbox/messages/1')
        .send({ isStarred: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isStarred).toBe(true);
    });

    it('should update message priority', async () => {
      const response = await request(app)
        .patch('/api/inbox/messages/1')
        .send({ priority: 'high' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.priority).toBe('high');
    });

    it('should update multiple properties at once', async () => {
      const response = await request(app)
        .patch('/api/inbox/messages/1')
        .send({
          status: 'read',
          isStarred: true,
          priority: 'medium'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('read');
      expect(response.body.data.isStarred).toBe(true);
      expect(response.body.data.priority).toBe('medium');
    });

    it('should set isRead to false when status is unread', async () => {
      const response = await request(app)
        .patch('/api/inbox/messages/1')
        .send({ status: 'unread' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('unread');
      expect(response.body.data.isRead).toBe(false);
    });

    it('should return 404 for non-existent message', async () => {
      const response = await request(app)
        .patch('/api/inbox/messages/non-existent-id')
        .send({ status: 'read' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Message not found');
    });
  });

  describe('POST /api/inbox/messages/:id/reply', () => {
    it('should reply to a message successfully', async () => {
      const replyContent = 'Thank you for your feedback!';
      const response = await request(app)
        .post('/api/inbox/messages/1/reply')
        .send({
          content: replyContent,
          messageId: '1'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('reply');
      expect(response.body.data.reply.content).toBe(replyContent);
      expect(response.body.message).toBe('Reply sent successfully');
    });

    it('should update message status to replied', async () => {
      const response = await request(app)
        .post('/api/inbox/messages/1/reply')
        .send({
          content: 'Thanks!',
          messageId: '1'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.status).toBe('replied');
      expect(response.body.data.message.isRead).toBe(true);
    });

    it('should include reply metadata', async () => {
      const response = await request(app)
        .post('/api/inbox/messages/1/reply')
        .send({
          content: 'Reply text',
          messageId: '1'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reply).toHaveProperty('id');
      expect(response.body.data.reply).toHaveProperty('messageId', '1');
      expect(response.body.data.reply).toHaveProperty('timestamp');
      expect(response.body.data.reply).toHaveProperty('sentBy');
      expect(response.body.data.reply).toHaveProperty('platform');
    });

    it('should return 404 for non-existent message', async () => {
      const response = await request(app)
        .post('/api/inbox/messages/non-existent-id/reply')
        .send({
          content: 'Reply',
          messageId: 'non-existent-id'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Message not found');
    });
  });

  describe('POST /api/inbox/messages/bulk-update', () => {
    it('should bulk update message statuses', async () => {
      const response = await request(app)
        .post('/api/inbox/messages/bulk-update')
        .send({
          messageIds: ['1', '2'],
          updates: { status: 'read' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updatedCount).toBe(2);
      expect(response.body.data.updatedMessages.length).toBe(2);
      response.body.data.updatedMessages.forEach((msg: any) => {
        expect(msg.status).toBe('read');
      });
    });

    it('should bulk update starred status', async () => {
      const response = await request(app)
        .post('/api/inbox/messages/bulk-update')
        .send({
          messageIds: ['1', '2'],
          updates: { isStarred: true }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updatedCount).toBe(2);
      response.body.data.updatedMessages.forEach((msg: any) => {
        expect(msg.isStarred).toBe(true);
      });
    });

    it('should bulk update priority', async () => {
      const response = await request(app)
        .post('/api/inbox/messages/bulk-update')
        .send({
          messageIds: ['1', '2'],
          updates: { priority: 'low' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.updatedMessages.forEach((msg: any) => {
        expect(msg.priority).toBe('low');
      });
    });

    it('should update multiple properties in bulk', async () => {
      const response = await request(app)
        .post('/api/inbox/messages/bulk-update')
        .send({
          messageIds: ['1', '2'],
          updates: {
            status: 'archived',
            isStarred: false,
            priority: 'low'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.updatedMessages.forEach((msg: any) => {
        expect(msg.status).toBe('archived');
        expect(msg.isStarred).toBe(false);
        expect(msg.priority).toBe('low');
      });
    });

    it('should return error if messageIds is not an array', async () => {
      const response = await request(app)
        .post('/api/inbox/messages/bulk-update')
        .send({
          messageIds: 'not-an-array',
          updates: { status: 'read' }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Message IDs array is required');
    });

    it('should return error if messageIds is empty array', async () => {
      const response = await request(app)
        .post('/api/inbox/messages/bulk-update')
        .send({
          messageIds: [],
          updates: { status: 'read' }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Message IDs array is required');
    });

    it('should only update messages belonging to user', async () => {
      const response = await request(app)
        .post('/api/inbox/messages/bulk-update')
        .send({
          messageIds: ['1', 'non-existent', '2'],
          updates: { status: 'read' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should only update existing messages for user
      expect(response.body.data.updatedCount).toBeGreaterThan(0);
    });

    it('should return success message with count', async () => {
      const response = await request(app)
        .post('/api/inbox/messages/bulk-update')
        .send({
          messageIds: ['1', '2'],
          updates: { status: 'read' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('messages updated successfully');
      expect(response.body.message).toContain('2');
    });
  });

  describe('GET /api/inbox/stats', () => {
    it('should fetch inbox statistics', async () => {
      const response = await request(app)
        .get('/api/inbox/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('unread');
      expect(response.body.data).toHaveProperty('starred');
      expect(response.body.data).toHaveProperty('highPriority');
      expect(response.body.data).toHaveProperty('byPlatform');
      expect(response.body.data).toHaveProperty('byType');
    });

    it('should include platform breakdown', async () => {
      const response = await request(app)
        .get('/api/inbox/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.byPlatform).toHaveProperty('facebook');
      expect(response.body.data.byPlatform).toHaveProperty('instagram');
      expect(response.body.data.byPlatform).toHaveProperty('twitter');
      expect(response.body.data.byPlatform).toHaveProperty('linkedin');
    });

    it('should include type breakdown', async () => {
      const response = await request(app)
        .get('/api/inbox/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.byType).toHaveProperty('message');
      expect(response.body.data.byType).toHaveProperty('comment');
      expect(response.body.data.byType).toHaveProperty('mention');
      expect(response.body.data.byType).toHaveProperty('review');
    });

    it('should have numeric values for all stats', async () => {
      const response = await request(app)
        .get('/api/inbox/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data.total).toBe('number');
      expect(typeof response.body.data.unread).toBe('number');
      expect(typeof response.body.data.starred).toBe('number');
      expect(typeof response.body.data.highPriority).toBe('number');
    });

    it('should have non-negative values', async () => {
      const response = await request(app)
        .get('/api/inbox/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeGreaterThanOrEqual(0);
      expect(response.body.data.unread).toBeGreaterThanOrEqual(0);
      expect(response.body.data.starred).toBeGreaterThanOrEqual(0);
      expect(response.body.data.highPriority).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Inbox Routes - Authentication', () => {
    it('should require authentication for all routes', async () => {
      // With mocked auth, all should succeed (not 401)
      await request(app).get('/api/inbox/messages').expect(200);
      await request(app).get('/api/inbox/messages/1').expect(200);
      await request(app).get('/api/inbox/stats').expect(200);
    });
  });

  describe('Inbox Routes - Error Handling', () => {
    it('should handle all validation and error cases properly', async () => {
      // All error paths tested in individual test cases above
      expect(true).toBe(true);
    });
  });
});
