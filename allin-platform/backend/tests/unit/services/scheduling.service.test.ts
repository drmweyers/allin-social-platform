/**
 * Scheduling Service Tests - BMAD Testing Framework
 * Streamlined tests for post scheduling functionality
 */

import { createMockScheduledPost } from '../../utils/test-helpers';

// Create mock queue instance before Bull is imported
const mockQueueInstance = {
  add: jest.fn().mockResolvedValue({ id: 'job_123' }),
  process: jest.fn(),
  getJobs: jest.fn().mockResolvedValue([]),
  close: jest.fn(),
};

// Mock Bull to return our mock queue instance
jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => mockQueueInstance);
});

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      scheduledPost: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      $disconnect: jest.fn(),
    })),
  };
});

// Mock social service
jest.mock('../../../src/services/social.service', () => ({
  socialService: {
    publishToInstagram: jest.fn().mockResolvedValue({ success: true }),
    publishToTwitter: jest.fn().mockResolvedValue({ success: true }),
    publishToFacebook: jest.fn().mockResolvedValue({ success: true }),
  },
}));

import { schedulingService } from '../../../src/services/scheduling.service';
import { PrismaClient } from '@prisma/client';

// Get the mocked Prisma instance
const mockPrisma = new (PrismaClient as any)();

describe('SchedulingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockQueueInstance.add.mockResolvedValue({ id: 'job_123' });
    mockQueueInstance.getJobs.mockResolvedValue([]);
    mockPrisma.scheduledPost.findUnique.mockResolvedValue(null);
    mockPrisma.scheduledPost.update.mockResolvedValue(createMockScheduledPost());
  });

  describe('Core Scheduling Functionality', () => {
    it('should be defined and accessible', () => {
      expect(schedulingService).toBeDefined();
      expect(typeof schedulingService.schedulePost).toBe('function');
    });

    it('should have all required methods', () => {
      expect(schedulingService.schedulePost).toBeDefined();
      expect(schedulingService.cancelScheduledPost).toBeDefined();
      expect(schedulingService.reschedulePost).toBeDefined();
      expect(schedulingService.addToQueue).toBeDefined();
      expect(schedulingService.calculateOptimalTimes).toBeDefined();
    });
  });

  describe('schedulePost', () => {
    it('should accept valid schedule parameters', async () => {
      const scheduledPostId = 'post_123';
      const scheduledFor = new Date(Date.now() + 3600000);

      mockQueueInstance.add.mockResolvedValue({ id: 'job_123' });

      await schedulingService.schedulePost(scheduledPostId, scheduledFor);

      expect(mockQueueInstance.add).toHaveBeenCalled();
    });

    it('should handle future scheduling dates', async () => {
      const scheduledPostId = 'post_456';
      const futureDate = new Date(Date.now() + 86400000); // 24 hours from now

      mockQueueInstance.add.mockResolvedValue({ id: 'job_456' });

      await schedulingService.schedulePost(scheduledPostId, futureDate);

      expect(mockQueueInstance.add).toHaveBeenCalledWith(
        'publish',
        expect.objectContaining({ postId: scheduledPostId }),
        expect.objectContaining({ delay: expect.any(Number) })
      );
    });

    it('should publish immediately if time has passed', async () => {
      const scheduledPostId = 'post_789';
      const pastDate = new Date(Date.now() - 1000); // 1 second ago

      mockPrisma.scheduledPost.findUnique.mockResolvedValue(
        createMockScheduledPost({ id: scheduledPostId, platform: 'INSTAGRAM', socialAccountId: 'acc_123' })
      );
      mockPrisma.scheduledPost.update.mockResolvedValue(
        createMockScheduledPost({ id: scheduledPostId, status: 'PUBLISHED' })
      );

      await schedulingService.schedulePost(scheduledPostId, pastDate);

      // Should attempt to publish immediately, not add to queue
      expect(mockPrisma.scheduledPost.findUnique).toHaveBeenCalled();
    });
  });

  describe('reschedulePost', () => {
    it('should reschedule a post to new date', async () => {
      const scheduledPostId = 'scheduled_123';
      const newDate = new Date(Date.now() + 86400000); // 24 hours from now

      mockQueueInstance.getJobs.mockResolvedValue([]);
      mockPrisma.scheduledPost.update.mockResolvedValue(
        createMockScheduledPost({ id: scheduledPostId, scheduledFor: newDate })
      );
      mockQueueInstance.add.mockResolvedValue({ id: 'job_123' });

      await schedulingService.reschedulePost(scheduledPostId, newDate);

      expect(mockPrisma.scheduledPost.update).toHaveBeenCalled();
      expect(mockQueueInstance.add).toHaveBeenCalled();
    });
  });

  describe('cancelScheduledPost', () => {
    it('should cancel a scheduled post', async () => {
      const scheduledPostId = 'scheduled_123';

      mockQueueInstance.getJobs.mockResolvedValue([]);
      mockPrisma.scheduledPost.update.mockResolvedValue(
        createMockScheduledPost({ id: scheduledPostId, status: 'CANCELLED' })
      );

      await schedulingService.cancelScheduledPost(scheduledPostId);

      expect(mockPrisma.scheduledPost.update).toHaveBeenCalledWith({
        where: { id: scheduledPostId },
        data: { status: 'CANCELLED' },
      });
    });

    it('should remove job from queue if exists', async () => {
      const scheduledPostId = 'scheduled_123';
      const mockJob = {
        data: { postId: scheduledPostId },
        remove: jest.fn(),
      };

      mockQueueInstance.getJobs.mockResolvedValue([mockJob]);
      mockPrisma.scheduledPost.update.mockResolvedValue(
        createMockScheduledPost({ id: scheduledPostId })
      );

      await schedulingService.cancelScheduledPost(scheduledPostId);

      expect(mockJob.remove).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle queue errors during scheduling', async () => {
      mockQueueInstance.add.mockRejectedValue(new Error('Queue error'));

      const scheduledPostId = 'post_123';
      const scheduledFor = new Date(Date.now() + 3600000);

      await expect(
        schedulingService.schedulePost(scheduledPostId, scheduledFor)
      ).rejects.toThrow('Queue error');
    });

    it('should handle database errors during cancellation', async () => {
      mockQueueInstance.getJobs.mockResolvedValue([]);
      mockPrisma.scheduledPost.update.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        schedulingService.cancelScheduledPost('scheduled_123')
      ).rejects.toThrow('Database error');
    });
  });

  describe('Integration with Queue', () => {
    it('should use queue for future posts', async () => {
      const scheduledPostId = 'post_123';
      const futureDate = new Date(Date.now() + 3600000);

      mockQueueInstance.add.mockResolvedValue({ id: 'job_123' });

      await schedulingService.schedulePost(scheduledPostId, futureDate);

      expect(mockQueueInstance.add).toHaveBeenCalledWith(
        'publish',
        expect.objectContaining({ postId: scheduledPostId }),
        expect.objectContaining({ delay: expect.any(Number) })
      );
    });
  });
});
