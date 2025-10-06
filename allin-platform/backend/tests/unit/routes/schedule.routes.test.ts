import request from 'supertest';
import express from 'express';
import { mockPrismaClient } from '../../setup/jest.setup';
import { PostStatus, ScheduleStatus, RecurringPattern } from '@prisma/client';

// Mock auth middleware BEFORE importing routes
jest.mock('../../../src/middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user-id-123',
      email: 'test@example.com',
      name: 'Test User',
      organizationId: 'org-id-123'
    };
    next();
  },
  AuthRequest: {} as any,
}));

import scheduleRoutes from '../../../src/routes/schedule.routes';

// Test data
const mockUser = {
  id: 'user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  organizationId: 'org-id-123'
};

const mockSocialAccount = {
  id: 'social-account-123',
  userId: 'user-id-123',
  platform: 'FACEBOOK',
  username: 'testuser',
  displayName: 'Test User'
};

const mockPost = {
  id: 'post-123',
  content: 'Test post content',
  hashtags: ['#test'],
  mentions: ['@user'],
  userId: 'user-id-123',
  socialAccountId: 'social-account-123',
  status: PostStatus.SCHEDULED,
  media: [],
  socialAccount: mockSocialAccount
};

const mockScheduledPost = {
  id: 'scheduled-post-123',
  postId: 'post-123',
  socialAccountId: 'social-account-123',
  userId: 'user-id-123',
  scheduledFor: new Date('2024-01-20T14:00:00.000Z'),
  timezone: 'UTC',
  isRecurring: false,
  recurringPattern: null,
  recurringEndDate: null,
  status: ScheduleStatus.PENDING
};

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/schedule', scheduleRoutes);

describe('Schedule Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/schedule/posts', () => {
    const validPostData = {
      content: 'Test post content',
      accountIds: ['social-account-123'],
      scheduledFor: '2024-01-20T14:00:00.000Z',
      timezone: 'UTC',
      mediaUrls: ['https://example.com/image.jpg'],
      hashtags: ['#test', '#post'],
      mentions: ['@user1', '@user2'],
      isRecurring: false
    };

    it('should create a scheduled post successfully', async () => {
      // Mock Prisma calls
      mockPrismaClient.user.findUnique.mockResolvedValue({
        ...mockUser,
        organizations: [{ organizationId: 'org-id-123' }]
      } as any);
      mockPrismaClient.post.create.mockResolvedValue(mockPost);
      mockPrismaClient.scheduledPost.create.mockResolvedValue(mockScheduledPost);

      const response = await request(app)
        .post('/api/schedule/posts')
        .send(validPostData)
        .expect(201);

      expect(response.body.scheduledPosts).toBeDefined();
      expect(Array.isArray(response.body.scheduledPosts)).toBe(true);
      expect(response.body.scheduledPosts.length).toBe(1);

      // Verify Prisma calls
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        include: {
          organizations: {
            take: 1
          }
        }
      });

      expect(mockPrismaClient.post.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          organizationId: 'org-id-123',
          content: validPostData.content,
          socialAccountId: validPostData.accountIds[0],
          status: 'DRAFT',
          media: { create: [] },
          hashtags: [],
          mentions: []
        }
      });

      expect(mockPrismaClient.scheduledPost.create).toHaveBeenCalledWith({
        data: {
          postId: mockPost.id,
          socialAccountId: validPostData.accountIds[0],
          userId: mockUser.id,
          organizationId: 'org-id-123',
          scheduledFor: new Date(validPostData.scheduledFor),
          timezone: validPostData.timezone,
          isRecurring: false,
          recurringPattern: undefined,
          recurringEndDate: undefined,
          isOptimalTime: false,
          suggestedBy: 'USER',
          queueId: undefined,
          status: 'PENDING'
        }
      });
    });

    it('should create a recurring scheduled post', async () => {
      const recurringPostData = {
        ...validPostData,
        isRecurring: true,
        recurringPattern: 'WEEKLY',
        recurringEndDate: '2024-03-20T14:00:00.000Z'
      };

      mockPrismaClient.user.findUnique.mockResolvedValue({
        ...mockUser,
        organizations: [{ organizationId: 'org-id-123' }]
      } as any);
      mockPrismaClient.post.create.mockResolvedValue(mockPost);
      mockPrismaClient.scheduledPost.create.mockResolvedValue({
        ...mockScheduledPost,
        isRecurring: true,
        recurringPattern: RecurringPattern.WEEKLY,
        recurringEndDate: new Date('2024-03-20T14:00:00.000Z')
      });

      const response = await request(app)
        .post('/api/schedule/posts')
        .send(recurringPostData)
        .expect(201);

      expect(response.body.scheduledPosts).toBeDefined();
      expect(response.body.scheduledPosts.length).toBe(1);
      expect(response.body.scheduledPosts[0].isRecurring).toBe(true);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        content: '', // Invalid: empty content
        accountIds: ['social-account-123'],
        scheduledFor: 'invalid-date' // Invalid: not ISO8601
      };

      const response = await request(app)
        .post('/api/schedule/posts')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should return 404 if social account not found', async () => {
      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/schedule/posts')
        .send(validPostData)
        .expect(404);

      expect(response.body.error).toBe('Social account not found');
    });

    it('should return 401 if user not authenticated', async () => {
      // Create app without user in request
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use((req: any, _res, next) => {
        req.user = null; // No user
        next();
      });
      appNoAuth.use('/api/schedule', scheduleRoutes);

      const response = await request(appNoAuth)
        .post('/api/schedule/posts')
        .send(validPostData)
        .expect(401);

      expect(response.body.error).toBe('User not authenticated');
    });

    it('should handle database errors', async () => {
      mockPrismaClient.socialAccount.findFirst.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/schedule/posts')
        .send(validPostData)
        .expect(500);

      expect(response.body.error).toBe('Failed to schedule post');
      expect(response.body.message).toBe('Database error');
    });
  });

  describe('GET /api/schedule/posts', () => {
    const mockScheduledPosts = [
      {
        ...mockScheduledPost,
        post: { ...mockPost, media: [] },
        socialAccount: {
          platform: 'FACEBOOK',
          username: 'testuser',
          displayName: 'Test User'
        }
      }
    ];

    it('should get scheduled posts successfully', async () => {
      mockPrismaClient.scheduledPost.findMany.mockResolvedValue(mockScheduledPosts);
      mockPrismaClient.scheduledPost.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/schedule/posts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toEqual(mockScheduledPosts);
      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        pages: 1
      });
    });

    it('should filter by status', async () => {
      const pendingPosts = mockScheduledPosts.filter(p => p.status === ScheduleStatus.PENDING);
      mockPrismaClient.scheduledPost.findMany.mockResolvedValue(pendingPosts);
      mockPrismaClient.scheduledPost.count.mockResolvedValue(pendingPosts.length);

      const response = await request(app)
        .get('/api/schedule/posts?status=PENDING')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrismaClient.scheduledPost.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          status: ScheduleStatus.PENDING
        },
        skip: 0,
        take: 20,
        include: expect.any(Object),
        orderBy: { scheduledFor: 'asc' }
      });
    });

    it('should filter by social account', async () => {
      mockPrismaClient.scheduledPost.findMany.mockResolvedValue(mockScheduledPosts);
      mockPrismaClient.scheduledPost.count.mockResolvedValue(1);

      await request(app)
        .get('/api/schedule/posts?socialAccountId=social-account-123')
        .expect(200);

      expect(mockPrismaClient.scheduledPost.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          socialAccountId: 'social-account-123'
        },
        skip: 0,
        take: 20,
        include: expect.any(Object),
        orderBy: { scheduledFor: 'asc' }
      });
    });

    it('should filter by date range', async () => {
      mockPrismaClient.scheduledPost.findMany.mockResolvedValue(mockScheduledPosts);
      mockPrismaClient.scheduledPost.count.mockResolvedValue(1);

      await request(app)
        .get('/api/schedule/posts?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z')
        .expect(200);

      expect(mockPrismaClient.scheduledPost.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          scheduledFor: {
            gte: new Date('2024-01-01T00:00:00.000Z'),
            lte: new Date('2024-01-31T23:59:59.999Z')
          }
        },
        skip: 0,
        take: 20,
        include: expect.any(Object),
        orderBy: { scheduledFor: 'asc' }
      });
    });

    it('should handle pagination', async () => {
      mockPrismaClient.scheduledPost.findMany.mockResolvedValue(mockScheduledPosts);
      mockPrismaClient.scheduledPost.count.mockResolvedValue(100);

      const response = await request(app)
        .get('/api/schedule/posts?page=2&limit=10')
        .expect(200);

      expect(response.body.data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 100,
        pages: 10
      });

      expect(mockPrismaClient.scheduledPost.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        skip: 10, // (page 2 - 1) * limit 10
        take: 10,
        include: expect.any(Object),
        orderBy: { scheduledFor: 'asc' }
      });
    });

    it('should return 401 if user not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use((req: any, _res, next) => {
        req.user = null;
        next();
      });
      appNoAuth.use('/api/schedule', scheduleRoutes);

      const response = await request(appNoAuth)
        .get('/api/schedule/posts')
        .expect(401);

      expect(response.body.error).toBe('User not authenticated');
    });
  });

  describe('GET /api/schedule/posts/:id', () => {
    const mockScheduledPostWithDetails = {
      ...mockScheduledPost,
      post: { ...mockPost, media: [] },
      socialAccount: {
        platform: 'FACEBOOK',
        username: 'testuser',
        displayName: 'Test User'
      }
    };

    it('should get specific scheduled post successfully', async () => {
      mockPrismaClient.scheduledPost.findFirst.mockResolvedValue(mockScheduledPostWithDetails);

      const response = await request(app)
        .get('/api/schedule/posts/scheduled-post-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockScheduledPostWithDetails);

      expect(mockPrismaClient.scheduledPost.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'scheduled-post-123',
          userId: mockUser.id
        },
        include: {
          post: {
            include: {
              media: true
            }
          },
          socialAccount: {
            select: {
              platform: true,
              username: true,
              displayName: true
            }
          }
        }
      });
    });

    it('should return 404 if scheduled post not found', async () => {
      mockPrismaClient.scheduledPost.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/schedule/posts/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Scheduled post not found');
    });

    it('should return 400 for invalid ID format', async () => {
      await request(app)
        .get('/api/schedule/posts/') // Empty ID
        .expect(404); // Express returns 404 for missing route parameter

      // Test with validation middleware properly
      await request(app)
        .get('/api/schedule/posts/%20') // Whitespace
        .expect(400);
    });
  });

  describe('PUT /api/schedule/posts/:id', () => {
    const updateData = {
      content: 'Updated post content',
      scheduledFor: '2024-01-21T15:00:00.000Z',
      timezone: 'America/New_York',
      hashtags: ['#updated', '#test'],
      mentions: ['@updateduser']
    };

    it('should update scheduled post successfully', async () => {
      const mockUpdatedPost = {
        ...mockPost,
        content: updateData.content,
        hashtags: updateData.hashtags,
        mentions: updateData.mentions
      };

      const mockUpdatedScheduledPost = {
        ...mockScheduledPost,
        scheduledFor: new Date(updateData.scheduledFor),
        timezone: updateData.timezone,
        post: { ...mockUpdatedPost, media: [] },
        socialAccount: mockSocialAccount
      };

      mockPrismaClient.scheduledPost.findFirst
        .mockResolvedValueOnce({ ...mockScheduledPost, post: mockPost })
        .mockResolvedValueOnce(mockUpdatedScheduledPost);
      mockPrismaClient.post.update.mockResolvedValue(mockUpdatedPost);
      mockPrismaClient.scheduledPost.update.mockResolvedValue(mockUpdatedScheduledPost);

      const response = await request(app)
        .put('/api/schedule/posts/scheduled-post-123')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUpdatedScheduledPost);

      // Verify post content update
      expect(mockPrismaClient.post.update).toHaveBeenCalledWith({
        where: { id: mockScheduledPost.postId },
        data: {
          content: updateData.content,
          hashtags: updateData.hashtags,
          mentions: updateData.mentions
        }
      });

      // Verify scheduled post timing update
      expect(mockPrismaClient.scheduledPost.update).toHaveBeenCalledWith({
        where: { id: 'scheduled-post-123' },
        data: {
          scheduledFor: new Date(updateData.scheduledFor),
          timezone: updateData.timezone
        }
      });
    });

    it('should return 404 if scheduled post not found', async () => {
      mockPrismaClient.scheduledPost.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/schedule/posts/non-existent-id')
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('Scheduled post not found');
    });

    it('should return 400 if post is not in pending status', async () => {
      const publishedScheduledPost = {
        ...mockScheduledPost,
        status: ScheduleStatus.PUBLISHED,
        post: mockPost
      };

      mockPrismaClient.scheduledPost.findFirst.mockResolvedValue(publishedScheduledPost);

      const response = await request(app)
        .put('/api/schedule/posts/scheduled-post-123')
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Cannot update post that is not in pending status');
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { content: 'Only content update' };

      mockPrismaClient.scheduledPost.findFirst
        .mockResolvedValueOnce({ ...mockScheduledPost, post: mockPost })
        .mockResolvedValueOnce({
          ...mockScheduledPost,
          post: { ...mockPost, content: partialUpdate.content, media: [] },
          socialAccount: mockSocialAccount
        });
      mockPrismaClient.post.update.mockResolvedValue({
        ...mockPost,
        content: partialUpdate.content
      });

      const response = await request(app)
        .put('/api/schedule/posts/scheduled-post-123')
        .send(partialUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Should only update post content, not schedule timing
      expect(mockPrismaClient.post.update).toHaveBeenCalledWith({
        where: { id: mockScheduledPost.postId },
        data: {
          content: partialUpdate.content
        }
      });
      expect(mockPrismaClient.scheduledPost.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/schedule/posts/:id', () => {
    it('should cancel scheduled post successfully', async () => {
      mockPrismaClient.scheduledPost.findFirst.mockResolvedValue(mockScheduledPost);
      mockPrismaClient.scheduledPost.update.mockResolvedValue({
        ...mockScheduledPost,
        status: ScheduleStatus.CANCELLED
      });

      const response = await request(app)
        .delete('/api/schedule/posts/scheduled-post-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Scheduled post cancelled successfully');

      expect(mockPrismaClient.scheduledPost.update).toHaveBeenCalledWith({
        where: { id: 'scheduled-post-123' },
        data: { status: ScheduleStatus.CANCELLED }
      });
    });

    it('should return 404 if scheduled post not found', async () => {
      mockPrismaClient.scheduledPost.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/schedule/posts/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Scheduled post not found');
    });

    it('should return 400 if trying to delete published post', async () => {
      const publishedPost = {
        ...mockScheduledPost,
        status: ScheduleStatus.PUBLISHED
      };

      mockPrismaClient.scheduledPost.findFirst.mockResolvedValue(publishedPost);

      const response = await request(app)
        .delete('/api/schedule/posts/scheduled-post-123')
        .expect(400);

      expect(response.body.error).toBe('Cannot delete already published post');
    });
  });

  describe('GET /api/schedule/optimal-times/:socialAccountId', () => {
    const mockOptimalTimes = [
      {
        id: 'optimal-time-1',
        socialAccountId: 'social-account-123',
        dayOfWeek: 1, // Monday
        hour: 9,
        engagementScore: 85.5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'optimal-time-2',
        socialAccountId: 'social-account-123',
        dayOfWeek: 3, // Wednesday
        hour: 14,
        engagementScore: 78.2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should get optimal posting times successfully', async () => {
      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(mockSocialAccount);
      mockPrismaClient.optimalPostingTime.findMany.mockResolvedValue(mockOptimalTimes);

      const response = await request(app)
        .get('/api/schedule/optimal-times/social-account-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockOptimalTimes);

      expect(mockPrismaClient.socialAccount.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'social-account-123',
          userId: mockUser.id
        }
      });

      expect(mockPrismaClient.optimalPostingTime.findMany).toHaveBeenCalledWith({
        where: { socialAccountId: 'social-account-123' },
        orderBy: [
          { dayOfWeek: 'asc' },
          { hour: 'asc' }
        ]
      });
    });

    it('should return 404 if social account not found', async () => {
      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/schedule/optimal-times/non-existent-account')
        .expect(404);

      expect(response.body.error).toBe('Social account not found');
    });

    it('should return empty array if no optimal times found', async () => {
      mockPrismaClient.socialAccount.findFirst.mockResolvedValue(mockSocialAccount);
      mockPrismaClient.optimalPostingTime.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/schedule/optimal-times/social-account-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });
});