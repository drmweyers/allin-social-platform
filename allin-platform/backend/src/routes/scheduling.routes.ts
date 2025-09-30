import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { schedulingService } from '../services/scheduling.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticate);

/**
 * Schedule a new post
 * POST /api/scheduling/schedule
 */
router.post(
  '/schedule',
  [
    body('content').notEmpty().withMessage('Content is required'),
    body('platforms').isArray().withMessage('Platforms must be an array'),
    body('platforms.*').isString().withMessage('Platform must be a string'),
    body('scheduledFor').isISO8601().withMessage('Valid date is required'),
    body('title').optional().isString(),
    body('hashtags').optional().isArray(),
    body('mediaUrls').optional().isArray(),
    body('isRecurring').optional().isBoolean(),
    body('recurringPattern').optional().isIn(['daily', 'weekly', 'biweekly', 'monthly']),
    body('recurringEndDate').optional().isISO8601(),
    body('timezone').optional().isString(),
    validate
  ],
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const organizationId = req.user!.organizationId;

      // Create post first
      const post = await prisma.post.create({
        data: {
          content: req.body.content,
          platforms: req.body.platforms,
          hashtags: req.body.hashtags || [],
          mediaUrls: req.body.mediaUrls || [],
          userId,
          organizationId,
          status: 'scheduled',
          metadata: {
            title: req.body.title,
            timezone: req.body.timezone || 'UTC'
          }
        }
      });

      // Create scheduled post
      const scheduledPost = await prisma.scheduledPost.create({
        data: {
          postId: post.id,
          scheduledFor: new Date(req.body.scheduledFor),
          platforms: req.body.platforms,
          status: 'pending',
          isRecurring: req.body.isRecurring || false,
          recurringPattern: req.body.recurringPattern,
          recurringEndDate: req.body.recurringEndDate ? new Date(req.body.recurringEndDate) : null,
          timezone: req.body.timezone || 'UTC',
          priority: 0
        }
      });

      // Schedule with the service
      await schedulingService.schedulePost(scheduledPost.id, scheduledPost.scheduledFor);

      res.status(201).json({
        success: true,
        data: {
          post,
          scheduledPost
        }
      });
    } catch (error) {
      console.error('Error scheduling post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule post'
      });
    }
  }
);

/**
 * Get scheduled posts
 * GET /api/scheduling/posts
 */
router.get(
  '/posts',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('platform').optional().isString(),
    query('status').optional().isIn(['pending', 'published', 'failed', 'cancelled']),
    validate
  ],
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { startDate, endDate, platform, status } = req.query;

      const where: any = {};

      // Build where clause
      if (startDate || endDate) {
        where.scheduledFor = {};
        if (startDate) where.scheduledFor.gte = new Date(startDate as string);
        if (endDate) where.scheduledFor.lte = new Date(endDate as string);
      }

      if (platform) {
        where.platforms = { has: platform };
      }

      if (status) {
        where.status = status;
      }

      const scheduledPosts = await prisma.scheduledPost.findMany({
        where: {
          ...where,
          post: {
            userId
          }
        },
        include: {
          post: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          scheduledFor: 'asc'
        }
      });

      res.json({
        success: true,
        data: scheduledPosts
      });
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch scheduled posts'
      });
    }
  }
);

/**
 * Reschedule a post
 * PUT /api/scheduling/posts/:id/reschedule
 */
router.put(
  '/posts/:id/reschedule',
  [
    param('id').isUUID(),
    body('scheduledFor').isISO8601().withMessage('Valid date is required'),
    validate
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const newDate = new Date(req.body.scheduledFor);

      await schedulingService.reschedulePost(id, newDate);

      res.json({
        success: true,
        message: 'Post rescheduled successfully'
      });
    } catch (error) {
      console.error('Error rescheduling post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reschedule post'
      });
    }
  }
);

/**
 * Cancel a scheduled post
 * DELETE /api/scheduling/posts/:id
 */
router.delete(
  '/posts/:id',
  [
    param('id').isUUID(),
    validate
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      await schedulingService.cancelScheduledPost(id);

      res.json({
        success: true,
        message: 'Scheduled post cancelled'
      });
    } catch (error) {
      console.error('Error cancelling post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel post'
      });
    }
  }
);

/**
 * Get optimal posting times
 * GET /api/scheduling/optimal-times
 */
router.get(
  '/optimal-times',
  [
    query('platform').optional().isString(),
    query('socialAccountId').optional().isUUID(),
    validate
  ],
  async (req, res) => {
    try {
      const { platform, socialAccountId } = req.query;

      // If socialAccountId provided, get specific times
      if (socialAccountId) {
        const optimalTimes = await schedulingService.getOptimalTimes(socialAccountId as string);
        return res.json({
          success: true,
          data: optimalTimes
        });
      }

      // Otherwise return general optimal times
      const generalTimes = {
        facebook: [
          { dayOfWeek: 1, hour: 9, score: 0.85 },
          { dayOfWeek: 3, hour: 15, score: 0.82 },
          { dayOfWeek: 5, hour: 13, score: 0.80 }
        ],
        instagram: [
          { dayOfWeek: 2, hour: 11, score: 0.87 },
          { dayOfWeek: 4, hour: 17, score: 0.85 },
          { dayOfWeek: 6, hour: 20, score: 0.83 }
        ],
        twitter: [
          { dayOfWeek: 1, hour: 8, score: 0.86 },
          { dayOfWeek: 3, hour: 19, score: 0.84 },
          { dayOfWeek: 5, hour: 12, score: 0.81 }
        ],
        linkedin: [
          { dayOfWeek: 2, hour: 7, score: 0.88 },
          { dayOfWeek: 3, hour: 17, score: 0.86 },
          { dayOfWeek: 4, hour: 9, score: 0.84 }
        ]
      };

      const result = platform
        ? { [platform as string]: generalTimes[platform as keyof typeof generalTimes] }
        : generalTimes;

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching optimal times:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch optimal times'
      });
    }
  }
);

/**
 * Add post to queue
 * POST /api/scheduling/queue
 */
router.post(
  '/queue',
  [
    body('postId').isUUID(),
    body('queueId').optional().isUUID(),
    validate
  ],
  async (req, res) => {
    try {
      const { postId, queueId } = req.body;
      const userId = req.user!.id;

      // Find or create default queue
      let queue;
      if (queueId) {
        queue = await prisma.postingQueue.findUnique({
          where: { id: queueId }
        });
      } else {
        queue = await prisma.postingQueue.findFirst({
          where: {
            userId,
            isDefault: true
          }
        });

        if (!queue) {
          // Create default queue
          queue = await prisma.postingQueue.create({
            data: {
              name: 'Default Queue',
              userId,
              organizationId: req.user!.organizationId,
              isActive: true,
              isDefault: true,
              timezone: 'UTC'
            }
          });
        }
      }

      const scheduledPost = await schedulingService.addToQueue(queue.id, postId);

      res.status(201).json({
        success: true,
        data: scheduledPost
      });
    } catch (error) {
      console.error('Error adding to queue:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add post to queue'
      });
    }
  }
);

/**
 * Get queue status
 * GET /api/scheduling/queue/status
 */
router.get('/queue/status', async (req, res) => {
  try {
    const userId = req.user!.id;

    // Get user's queues
    const queues = await prisma.postingQueue.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            scheduledPosts: {
              where: {
                status: { in: ['QUEUED', 'PENDING'] }
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: queues.map(queue => ({
        id: queue.id,
        name: queue.name,
        postsInQueue: queue._count.scheduledPosts,
        isActive: queue.isActive,
        isDefault: queue.isDefault
      }))
    });
  } catch (error) {
    console.error('Error fetching queue status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queue status'
    });
  }
});

/**
 * Bulk schedule posts
 * POST /api/scheduling/bulk
 */
router.post(
  '/bulk',
  [
    body('posts').isArray().withMessage('Posts must be an array'),
    body('posts.*.content').notEmpty(),
    body('posts.*.platforms').isArray(),
    body('posts.*.scheduledFor').isISO8601(),
    validate
  ],
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const organizationId = req.user!.organizationId;
      const { posts } = req.body;

      const scheduledPosts = [];

      for (const postData of posts) {
        // Create post
        const post = await prisma.post.create({
          data: {
            content: postData.content,
            platforms: postData.platforms,
            hashtags: postData.hashtags || [],
            mediaUrls: postData.mediaUrls || [],
            userId,
            organizationId,
            status: 'scheduled'
          }
        });

        // Create scheduled post
        const scheduledPost = await prisma.scheduledPost.create({
          data: {
            postId: post.id,
            scheduledFor: new Date(postData.scheduledFor),
            platforms: postData.platforms,
            status: 'pending',
            timezone: postData.timezone || 'UTC',
            priority: 0
          }
        });

        // Schedule with service
        await schedulingService.schedulePost(scheduledPost.id, scheduledPost.scheduledFor);

        scheduledPosts.push({ post, scheduledPost });
      }

      res.status(201).json({
        success: true,
        data: scheduledPosts,
        message: `Successfully scheduled ${scheduledPosts.length} posts`
      });
    } catch (error) {
      console.error('Error bulk scheduling:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk schedule posts'
      });
    }
  }
);

/**
 * Get calendar view data
 * GET /api/scheduling/calendar
 */
router.get(
  '/calendar',
  [
    query('year').isInt(),
    query('month').isInt({ min: 1, max: 12 }),
    validate
  ],
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const year = parseInt(req.query.year as string);
      const month = parseInt(req.query.month as string) - 1; // JavaScript months are 0-indexed

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const scheduledPosts = await prisma.scheduledPost.findMany({
        where: {
          post: { userId },
          scheduledFor: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          post: true
        },
        orderBy: {
          scheduledFor: 'asc'
        }
      });

      // Group by day
      const calendar: Record<string, any[]> = {};

      scheduledPosts.forEach(sp => {
        const dateKey = sp.scheduledFor.toISOString().split('T')[0];
        if (!calendar[dateKey]) {
          calendar[dateKey] = [];
        }
        calendar[dateKey].push({
          id: sp.id,
          postId: sp.postId,
          title: sp.post.metadata ? (sp.post.metadata as any).title : 'Untitled',
          content: sp.post.content,
          platforms: sp.platforms,
          scheduledFor: sp.scheduledFor,
          status: sp.status
        });
      });

      res.json({
        success: true,
        data: calendar
      });
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch calendar data'
      });
    }
  }
);

export default router;