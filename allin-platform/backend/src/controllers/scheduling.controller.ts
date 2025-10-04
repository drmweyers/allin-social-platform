import { Request, Response } from 'express';
import { schedulingService } from '../services/scheduling.service';
import { socialService } from '../services/social.service';
import { prisma } from '../services/database';

export class SchedulingController {
  /**
   * POST /api/scheduling/schedule
   * Schedule a post for future publishing
   */
  async schedulePost(req: Request, res: Response): Promise<void> {
    try {
      const { postId, socialAccountId, scheduledFor, timezone, isRecurring, recurringPattern, recurringEndDate } = req.body;
      const userId = req.user?.id;

      if (!postId || !socialAccountId || !scheduledFor || !userId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: postId, socialAccountId, scheduledFor'
        });
        return;
      }

      // Validate post exists
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { socialAccount: true }
      });

      if (!post) {
        res.status(404).json({
          success: false,
          message: 'Post not found'
        });
        return;
      }

      // Validate social account
      const socialAccount = await prisma.socialAccount.findUnique({
        where: { id: socialAccountId }
      });

      if (!socialAccount) {
        res.status(404).json({
          success: false,
          message: 'Social account not found'
        });
        return;
      }

      // Validate content for platform
      const validation = socialService.validateContent(socialAccount.platform, post);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: 'Post content validation failed',
          errors: validation.errors
        });
        return;
      }

      // Create scheduled post
      const scheduledPost = await prisma.scheduledPost.create({
        data: {
          postId,
          socialAccountId,
          userId,
          organizationId: post.organizationId,
          scheduledFor: new Date(scheduledFor),
          timezone: timezone || 'UTC',
          isRecurring: isRecurring || false,
          recurringPattern: recurringPattern || null,
          recurringEndDate: recurringEndDate ? new Date(recurringEndDate) : null,
          status: 'PENDING'
        }
      });

      // Schedule the post
      await schedulingService.schedulePost(scheduledPost.id, new Date(scheduledFor));

      res.status(201).json({
        success: true,
        data: scheduledPost
      });
    } catch (error) {
      console.error('Schedule post error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule post',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * GET /api/scheduling/scheduled
   * Get all scheduled posts for the user
   */
  async getScheduledPosts(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { status, platform, limit = 50, offset = 0 } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      const where: any = { userId };

      if (status) {
        where.status = status;
      }

      const scheduledPosts = await prisma.scheduledPost.findMany({
        where,
        include: {
          post: {
            include: {
              socialAccount: true
            }
          }
        },
        orderBy: { scheduledFor: 'asc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      });

      // Filter by platform if specified
      const filteredPosts = platform 
        ? scheduledPosts.filter(sp => sp.post.socialAccount?.platform === platform)
        : scheduledPosts;

      res.json({
        success: true,
        data: filteredPosts,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: filteredPosts.length
        }
      });
    } catch (error) {
      console.error('Get scheduled posts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get scheduled posts',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * PUT /api/scheduling/reschedule/:id
   * Reschedule a post
   */
  async reschedulePost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { scheduledFor } = req.body;
      const userId = req.user?.id;

      if (!scheduledFor) {
        res.status(400).json({
          success: false,
          message: 'New scheduled time is required'
        });
        return;
      }

      // Verify ownership
      const scheduledPost = await prisma.scheduledPost.findFirst({
        where: { id, userId }
      });

      if (!scheduledPost) {
        res.status(404).json({
          success: false,
          message: 'Scheduled post not found'
        });
        return;
      }

      // Reschedule
      await schedulingService.reschedulePost(id, new Date(scheduledFor));

      const updatedPost = await prisma.scheduledPost.findUnique({
        where: { id },
        include: {
          post: {
            include: {
              socialAccount: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: updatedPost
      });
    } catch (error) {
      console.error('Reschedule post error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reschedule post',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * DELETE /api/scheduling/cancel/:id
   * Cancel a scheduled post
   */
  async cancelScheduledPost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Verify ownership
      const scheduledPost = await prisma.scheduledPost.findFirst({
        where: { id, userId }
      });

      if (!scheduledPost) {
        res.status(404).json({
          success: false,
          message: 'Scheduled post not found'
        });
        return;
      }

      // Cancel
      await schedulingService.cancelScheduledPost(id);

      res.json({
        success: true,
        message: 'Scheduled post cancelled successfully'
      });
    } catch (error) {
      console.error('Cancel scheduled post error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel scheduled post',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * POST /api/scheduling/queue/:queueId/add
   * Add post to a posting queue
   */
  async addToQueue(req: Request, res: Response): Promise<void> {
    try {
      const { queueId } = req.params;
      const { postId } = req.body;
      const userId = req.user?.id;

      if (!postId) {
        res.status(400).json({
          success: false,
          message: 'Post ID is required'
        });
        return;
      }

      // Verify queue ownership
      const queue = await prisma.postingQueue.findFirst({
        where: { id: queueId, userId }
      });

      if (!queue) {
        res.status(404).json({
          success: false,
          message: 'Queue not found'
        });
        return;
      }

      // Add to queue
      const scheduledPost = await schedulingService.addToQueue(queueId, postId);

      res.status(201).json({
        success: true,
        data: scheduledPost
      });
    } catch (error) {
      console.error('Add to queue error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add post to queue',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * GET /api/scheduling/optimal-times/:socialAccountId
   * Get optimal posting times for a social account
   */
  async getOptimalTimes(req: Request, res: Response): Promise<void> {
    try {
      const { socialAccountId } = req.params;
      const userId = req.user?.id;

      // Verify access to social account
      const socialAccount = await prisma.socialAccount.findFirst({
        where: { id: socialAccountId, userId }
      });

      if (!socialAccount) {
        res.status(404).json({
          success: false,
          message: 'Social account not found'
        });
        return;
      }

      // Get optimal times
      const optimalTimes = await schedulingService.getOptimalTimes(socialAccountId);

      res.json({
        success: true,
        data: optimalTimes
      });
    } catch (error) {
      console.error('Get optimal times error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get optimal posting times',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * POST /api/scheduling/calculate-optimal/:socialAccountId
   * Calculate optimal posting times based on historical data
   */
  async calculateOptimalTimes(req: Request, res: Response): Promise<void> {
    try {
      const { socialAccountId } = req.params;
      const userId = req.user?.id;

      // Verify access to social account
      const socialAccount = await prisma.socialAccount.findFirst({
        where: { id: socialAccountId, userId }
      });

      if (!socialAccount) {
        res.status(404).json({
          success: false,
          message: 'Social account not found'
        });
        return;
      }

      // Calculate optimal times
      const optimalTimes = await schedulingService.calculateOptimalTimes(socialAccountId);

      res.json({
        success: true,
        data: optimalTimes,
        message: 'Optimal posting times calculated successfully'
      });
    } catch (error) {
      console.error('Calculate optimal times error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate optimal posting times',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * GET /api/scheduling/requirements/:platform
   * Get platform-specific posting requirements
   */
  async getPlatformRequirements(req: Request, res: Response): Promise<void> {
    try {
      const { platform } = req.params;

      const requirements = socialService.getPlatformRequirements(platform as any);

      if (!requirements) {
        res.status(400).json({
          success: false,
          message: 'Invalid platform specified'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          platform,
          requirements
        }
      });
    } catch (error) {
      console.error('Get platform requirements error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get platform requirements',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
}