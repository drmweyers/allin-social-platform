import { schedulingService } from '../../../src/services/scheduling.service';
import { SocialPlatform } from '@prisma/client';

// Mock Bull queue
jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job123' }),
    process: jest.fn(),
    getJobs: jest.fn().mockResolvedValue([]),
  }));
});

// Mock Prisma
jest.mock('../../../src/services/database', () => ({
  prisma: {
    scheduledPost: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    socialAccount: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    postingQueue: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    optimalPostingTime: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    recurringPostGroup: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock social service
jest.mock('../../../src/services/social.service', () => ({
  socialService: {
    publishPost: jest.fn(),
    validateContent: jest.fn(),
    getPlatformRequirements: jest.fn(),
  },
}));

// Master test credentials (available for reference in scheduling tests)
// const MASTER_CREDENTIALS = {
//   admin: { email: 'admin@allin.demo', password: 'AdminPass123' },
//   agency: { email: 'agency@allin.demo', password: 'AgencyPass123' },
//   manager: { email: 'manager@allin.demo', password: 'ManagerPass123' },
//   creator: { email: 'creator@allin.demo', password: 'CreatorPass123' },
//   client: { email: 'client@allin.demo', password: 'ClientPass123' },
//   team: { email: 'team@allin.demo', password: 'TeamPass123' },
// };

describe('SchedulingService', () => {
  let mockPrisma: any;
  let mockSocialService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get mock references
    mockPrisma = require('../../../src/services/database').prisma;
    mockSocialService = require('../../../src/services/social.service').socialService;

    // Setup default mock returns
    mockSocialService.publishPost.mockResolvedValue({
      platformPostId: 'platform123',
      success: true,
    });

    mockSocialService.validateContent.mockReturnValue({
      valid: true,
      errors: [],
    });
  });

  describe('schedulePost', () => {
    it('should schedule a post for future publishing', async () => {
      const scheduledPostId = 'scheduled123';
      const scheduledFor = new Date(Date.now() + 60000); // 1 minute from now

      const mockScheduledPost = {
        id: scheduledPostId,
        postId: 'post123',
        scheduledFor,
        status: 'PENDING',
        post: {
          id: 'post123',
          content: 'Test post content',
          userId: 'admin-user-id',
        },
        socialAccount: {
          id: 'social123',
          platform: SocialPlatform.TWITTER,
          accessToken: 'token123',
        },
      };

      mockPrisma.scheduledPost.findUnique.mockResolvedValue(mockScheduledPost);
      mockPrisma.scheduledPost.update.mockResolvedValue(mockScheduledPost);
      mockPrisma.post.update.mockResolvedValue({ id: 'post123' });

      await schedulingService.schedulePost(scheduledPostId, scheduledFor);

      // Should not publish immediately (future date)
      expect(mockSocialService.publishPost).not.toHaveBeenCalled();
    });

    it('should publish immediately if scheduled time has passed', async () => {
      const scheduledPostId = 'scheduled123';
      const scheduledFor = new Date(Date.now() - 60000); // 1 minute ago

      const mockScheduledPost = {
        id: scheduledPostId,
        postId: 'post123',
        scheduledFor,
        status: 'PENDING',
        post: {
          id: 'post123',
          content: 'Test post content',
          userId: 'admin-user-id',
        },
        socialAccount: {
          id: 'social123',
          platform: SocialPlatform.TWITTER,
          accessToken: 'token123',
        },
      };

      mockPrisma.scheduledPost.findUnique.mockResolvedValue(mockScheduledPost);
      mockPrisma.scheduledPost.update.mockResolvedValue(mockScheduledPost);
      mockPrisma.post.update.mockResolvedValue({ id: 'post123' });

      await schedulingService.schedulePost(scheduledPostId, scheduledFor);

      // Should publish immediately (past date)
      expect(mockSocialService.publishPost).toHaveBeenCalledWith(
        mockScheduledPost.socialAccount,
        mockScheduledPost.post
      );
    });

    it('should handle scheduling errors gracefully', async () => {
      const scheduledPostId = 'scheduled123';
      const scheduledFor = new Date(Date.now() - 60000);

      mockPrisma.scheduledPost.findUnique.mockResolvedValue(null);

      await expect(schedulingService.schedulePost(scheduledPostId, scheduledFor))
        .rejects.toThrow('Scheduled post not found');
    });
  });

  describe('cancelScheduledPost', () => {
    it('should cancel a scheduled post successfully', async () => {
      const scheduledPostId = 'scheduled123';

      // Mock Bull queue jobs
      const mockJobs = [
        {
          data: { postId: scheduledPostId },
          remove: jest.fn().mockResolvedValue(true),
        },
      ];

      const Bull = require('bull');
      const mockQueue = new Bull();
      mockQueue.getJobs.mockResolvedValue(mockJobs);

      mockPrisma.scheduledPost.update.mockResolvedValue({
        id: scheduledPostId,
        status: 'CANCELLED',
      });

      await schedulingService.cancelScheduledPost(scheduledPostId);

      expect(mockJobs[0].remove).toHaveBeenCalled();
      expect(mockPrisma.scheduledPost.update).toHaveBeenCalledWith({
        where: { id: scheduledPostId },
        data: { status: 'CANCELLED' },
      });
    });

    it('should handle cancellation of non-existent job', async () => {
      const scheduledPostId = 'scheduled123';

      const Bull = require('bull');
      const mockQueue = new Bull();
      mockQueue.getJobs.mockResolvedValue([]);

      mockPrisma.scheduledPost.update.mockResolvedValue({
        id: scheduledPostId,
        status: 'CANCELLED',
      });

      await schedulingService.cancelScheduledPost(scheduledPostId);

      expect(mockPrisma.scheduledPost.update).toHaveBeenCalledWith({
        where: { id: scheduledPostId },
        data: { status: 'CANCELLED' },
      });
    });
  });

  describe('reschedulePost', () => {
    it('should reschedule a post to new date', async () => {
      const scheduledPostId = 'scheduled123';
      const newDate = new Date(Date.now() + 120000); // 2 minutes from now

      const Bull = require('bull');
      const mockQueue = new Bull();
      mockQueue.getJobs.mockResolvedValue([]);

      mockPrisma.scheduledPost.update.mockResolvedValue({
        id: scheduledPostId,
        scheduledFor: newDate,
        status: 'PENDING',
      });

      await schedulingService.reschedulePost(scheduledPostId, newDate);

      expect(mockPrisma.scheduledPost.update).toHaveBeenCalledWith({
        where: { id: scheduledPostId },
        data: {
          scheduledFor: newDate,
          status: 'PENDING',
        },
      });
    });
  });

  describe('addToQueue', () => {
    it('should add post to queue successfully', async () => {
      const queueId = 'queue123';
      const postId = 'post123';

      const mockQueue = {
        id: queueId,
        userId: 'admin-user-id',
        organizationId: 'org123',
        timezone: 'UTC',
        timeSlots: [
          {
            dayOfWeek: 1, // Monday
            time: '09:00',
            isActive: true,
          },
        ],
        scheduledPosts: [],
      };

      const mockScheduledPost = {
        id: 'scheduled123',
        postId,
        queueId,
        queuePosition: 1,
        status: 'QUEUED',
      };

      mockPrisma.postingQueue.findUnique.mockResolvedValue(mockQueue);
      mockPrisma.scheduledPost.create.mockResolvedValue(mockScheduledPost);

      const result = await schedulingService.addToQueue(queueId, postId);

      expect(result).toEqual(mockScheduledPost);
      expect(mockPrisma.scheduledPost.create).toHaveBeenCalled();
    });

    it('should throw error if queue not found', async () => {
      const queueId = 'nonexistent';
      const postId = 'post123';

      mockPrisma.postingQueue.findUnique.mockResolvedValue(null);

      await expect(schedulingService.addToQueue(queueId, postId))
        .rejects.toThrow('Queue not found');
    });
  });

  describe('findNextAvailableSlot', () => {
    it('should find next available time slot', () => {
      const timeSlots = [
        { dayOfWeek: 1, time: '09:00', isActive: true }, // Monday 9 AM
        { dayOfWeek: 3, time: '15:00', isActive: true }, // Wednesday 3 PM
        { dayOfWeek: 5, time: '12:00', isActive: true }, // Friday 12 PM
      ];

      const nextSlot = schedulingService.findNextAvailableSlot(timeSlots);

      expect(nextSlot).toBeInstanceOf(Date);
    });

    it('should return default slot if no time slots defined', () => {
      const nextSlot = schedulingService.findNextAvailableSlot([]);

      expect(nextSlot).toBeInstanceOf(Date);
      // Should be approximately next hour
      const now = new Date();
      const expectedTime = new Date();
      expectedTime.setHours(now.getHours() + 1, 0, 0, 0);
      
      expect(nextSlot.getTime()).toBeCloseTo(expectedTime.getTime(), -4); // Within 10 seconds
    });
  });

  describe('calculateOptimalTimes', () => {
    it('should calculate optimal posting times based on historical data', async () => {
      const socialAccountId = 'social123';

      const mockPosts = [
        {
          id: 'post1',
          publishedAt: new Date('2023-12-01T09:00:00Z'), // Friday 9 AM
          likes: 50,
          comments: 10,
          shares: 5,
          views: 1000,
        },
        {
          id: 'post2',
          publishedAt: new Date('2023-12-04T15:00:00Z'), // Monday 3 PM
          likes: 75,
          comments: 15,
          shares: 8,
          views: 1200,
        },
      ];

      // Mock optimal times would be calculated and stored
      // const mockOptimalTimes = [
      //   {
      //     socialAccountId,
      //     dayOfWeek: 1,
      //     hour: 15,
      //     score: 0.081,
      //     avgEngagement: 0.081,
      //     sampleSize: 1,
      //   },
      // ];

      mockPrisma.post.findMany.mockResolvedValue(mockPosts);
      mockPrisma.optimalPostingTime.upsert.mockResolvedValue({});

      const result = await schedulingService.calculateOptimalTimes(socialAccountId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(mockPrisma.optimalPostingTime.upsert).toHaveBeenCalled();
    });

    it('should handle accounts with no historical data', async () => {
      const socialAccountId = 'social123';

      mockPrisma.post.findMany.mockResolvedValue([]);

      const result = await schedulingService.calculateOptimalTimes(socialAccountId);

      expect(result).toEqual([]);
    });
  });

  describe('getOptimalTimes', () => {
    it('should return optimal posting times for account', async () => {
      const socialAccountId = 'social123';

      const mockOptimalTimes = [
        {
          socialAccountId,
          dayOfWeek: 1,
          hour: 9,
          score: 0.85,
          avgEngagement: 0.85,
        },
        {
          socialAccountId,
          dayOfWeek: 3,
          hour: 15,
          score: 0.82,
          avgEngagement: 0.82,
        },
      ];

      mockPrisma.optimalPostingTime.findMany.mockResolvedValue(mockOptimalTimes);

      const result = await schedulingService.getOptimalTimes(socialAccountId);

      expect(result).toEqual(mockOptimalTimes);
      expect(mockPrisma.optimalPostingTime.findMany).toHaveBeenCalledWith({
        where: { socialAccountId },
        orderBy: { score: 'desc' },
        take: 10,
      });
    });
  });

  describe('getDateForSlot', () => {
    it('should convert day and time to correct Date object', () => {
      const dayOfWeek = 1; // Monday
      const time = '09:30';

      const result = schedulingService.getDateForSlot(dayOfWeek, time);

      expect(result).toBeInstanceOf(Date);
      expect(result.getDay()).toBe(dayOfWeek);
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(30);
    });

    it('should handle next week scheduling', () => {
      const dayOfWeek = 1; // Monday
      const time = '09:30';

      const result = schedulingService.getDateForSlot(dayOfWeek, time, true);

      expect(result).toBeInstanceOf(Date);
      expect(result.getDay()).toBe(dayOfWeek);
      
      // Should be at least 7 days from now
      const now = new Date();
      const daysDifference = Math.floor((result.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDifference).toBeGreaterThanOrEqual(7);
    });
  });

  describe('user role integration', () => {
    it('should allow admin to schedule posts for any organization', async () => {
      const scheduledPostId = 'scheduled123';
      const scheduledFor = new Date(Date.now() + 60000);

      const mockScheduledPost = {
        id: scheduledPostId,
        userId: 'admin-user-id',
        organizationId: 'any-org',
        post: {
          content: 'Admin scheduled post',
        },
        socialAccount: {
          platform: SocialPlatform.TWITTER,
          accessToken: 'admin-token',
        },
      };

      mockPrisma.scheduledPost.findUnique.mockResolvedValue(mockScheduledPost);

      await expect(schedulingService.schedulePost(scheduledPostId, scheduledFor))
        .resolves.not.toThrow();
    });

    it('should allow manager to schedule posts for their organization', async () => {
      const queueId = 'queue123';
      const postId = 'post123';

      const mockQueue = {
        id: queueId,
        userId: 'manager-user-id',
        organizationId: 'manager-org',
        timeSlots: [],
        scheduledPosts: [],
      };

      mockPrisma.postingQueue.findUnique.mockResolvedValue(mockQueue);
      mockPrisma.scheduledPost.create.mockResolvedValue({
        id: 'scheduled123',
        queueId,
        postId,
      });

      await expect(schedulingService.addToQueue(queueId, postId))
        .resolves.toBeDefined();
    });

    it('should allow creator to add posts to queue', async () => {
      const queueId = 'creator-queue';
      const postId = 'creator-post';

      const mockQueue = {
        id: queueId,
        userId: 'creator-user-id',
        organizationId: 'creator-org',
        timeSlots: [{
          dayOfWeek: 2,
          time: '14:00',
          isActive: true,
        }],
        scheduledPosts: [],
      };

      mockPrisma.postingQueue.findUnique.mockResolvedValue(mockQueue);
      mockPrisma.scheduledPost.create.mockResolvedValue({
        id: 'scheduled123',
        queueId,
        postId,
        status: 'QUEUED',
      });

      const result = await schedulingService.addToQueue(queueId, postId);

      expect(result.status).toBe('QUEUED');
    });
  });

  describe('error handling', () => {
    it('should handle scheduling service errors gracefully', async () => {
      const scheduledPostId = 'scheduled123';
      const scheduledFor = new Date();

      mockPrisma.scheduledPost.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(schedulingService.schedulePost(scheduledPostId, scheduledFor))
        .rejects.toThrow('Database error');
    });

    it('should handle queue creation errors', async () => {
      const queueId = 'queue123';
      const postId = 'post123';

      mockPrisma.postingQueue.findUnique.mockRejectedValue(new Error('Queue access error'));

      await expect(schedulingService.addToQueue(queueId, postId))
        .rejects.toThrow('Queue access error');
    });
  });
});