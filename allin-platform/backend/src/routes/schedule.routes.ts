import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { schedulingService } from '../services/scheduling.service';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createScheduledPostSchema = z.object({
  content: z.string().min(1),
  accountIds: z.array(z.string()).min(1),
  scheduledFor: z.string().datetime(),
  timezone: z.string().default('UTC'),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM']).optional(),
  recurringEndDate: z.string().datetime().optional(),
  useOptimalTime: z.boolean().optional(),
  queueId: z.string().optional(),
});

const createQueueSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  timezone: z.string().default('UTC'),
});

const addTimeSlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  time: z.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/),
});

// Get all scheduled posts
router.get('/posts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const posts = await prisma.scheduledPost.findMany({
      where: { userId },
      include: {
        post: true,
        socialAccount: {
          select: {
            id: true,
            platform: true,
            username: true,
          },
        },
        queue: true,
        recurringGroup: true,
      },
      orderBy: { scheduledFor: 'asc' },
    });

    // Transform for frontend
    const formattedPosts = posts.map(post => ({
      id: post.id,
      postId: post.postId,
      content: post.post?.content || '',
      scheduledFor: post.scheduledFor.toISOString(),
      platform: post.socialAccount?.platform || 'unknown',
      status: post.status,
      socialAccount: {
        accountHandle: post.socialAccount?.username || 'Unknown',
        platform: (post.socialAccount?.platform || 'UNKNOWN') as any,
      },
      isRecurring: post.isRecurring,
      queuePosition: post.queuePosition,
    }));

    res.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Failed to fetch scheduled posts:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled posts' });
  }
});

// Create scheduled post
router.post('/posts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = createScheduledPostSchema.parse(req.body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizations: {
          take: 1,
        },
      },
    });

    const organizationId = user?.organizations[0]?.organizationId;

    const scheduledPosts = [];

    // Create posts for each selected account
    for (const accountId of data.accountIds) {
      // Create the post
      const post = await prisma.post.create({
        data: {
          userId,
          organizationId,
          content: data.content,
          socialAccountId: accountId,
          status: 'DRAFT',
          media: { create: [] },
          hashtags: [],
          mentions: [],
        },
      });

      // If using optimal time, calculate it
      let scheduledFor = new Date(data.scheduledFor);
      if (data.useOptimalTime) {
        const optimalTimes = await schedulingService.getOptimalTimes(accountId);
        if (optimalTimes.length > 0) {
          // Use the best time
          const bestTime = optimalTimes[0];
          scheduledFor = schedulingService.getDateForSlot(bestTime.dayOfWeek, `${bestTime.hour}:00`);
        }
      }

      // Create scheduled post
      const scheduledPost = await prisma.scheduledPost.create({
        data: {
          postId: post.id,
          socialAccountId: accountId,
          userId,
          organizationId,
          scheduledFor,
          timezone: data.timezone,
          isRecurring: data.isRecurring || false,
          recurringPattern: data.recurringPattern,
          recurringEndDate: data.recurringEndDate ? new Date(data.recurringEndDate) : undefined,
          isOptimalTime: data.useOptimalTime || false,
          suggestedBy: data.useOptimalTime ? 'AI' : 'USER',
          queueId: data.queueId,
          status: data.queueId ? 'QUEUED' : 'PENDING',
        },
      });

      // If recurring, create recurring group
      if (data.isRecurring && data.recurringPattern) {
        await prisma.recurringPostGroup.create({
          data: {
            userId,
            organizationId,
            name: `Recurring: ${data.content.substring(0, 50)}`,
            pattern: data.recurringPattern,
            frequency: 1,
            startDate: scheduledFor,
            endDate: data.recurringEndDate ? new Date(data.recurringEndDate) : undefined,
            nextRunDate: scheduledFor,
            scheduledPostId: scheduledPost.id,
          },
        });
      }

      // Schedule the post
      if (data.queueId) {
        await schedulingService.addToQueue(data.queueId, post.id);
      } else {
        await schedulingService.schedulePost(scheduledPost.id, scheduledFor);
      }

      scheduledPosts.push(scheduledPost);
    }

    res.status(201).json({ scheduledPosts });
  } catch (error) {
    console.error('Failed to create scheduled post:', error);
    res.status(500).json({ error: 'Failed to create scheduled post' });
  }
});

// Reschedule a post
router.put('/posts/:id/reschedule', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { scheduledFor } = req.body;

    await schedulingService.reschedulePost(id, new Date(scheduledFor));

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to reschedule post:', error);
    res.status(500).json({ error: 'Failed to reschedule post' });
  }
});

// Cancel scheduled post
router.delete('/posts/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await schedulingService.cancelScheduledPost(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to cancel scheduled post:', error);
    res.status(500).json({ error: 'Failed to cancel scheduled post' });
  }
});

// Get all queues
router.get('/queues', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const queues = await prisma.postingQueue.findMany({
      where: { userId },
      include: {
        timeSlots: {
          orderBy: [{ dayOfWeek: 'asc' }, { time: 'asc' }],
        },
        scheduledPosts: {
          where: { status: 'QUEUED' },
          include: {
            post: true,
          },
          orderBy: { queuePosition: 'asc' },
        },
      },
    });

    // Format queue posts
    const formattedQueues = queues.map(queue => ({
      ...queue,
      posts: queue.scheduledPosts.map((sp, index) => ({
        id: sp.id,
        content: sp.post.content,
        position: index,
        scheduledFor: sp.scheduledFor.toISOString(),
        status: sp.status,
      })),
    }));

    res.json({ queues: formattedQueues });
  } catch (error) {
    console.error('Failed to fetch queues:', error);
    res.status(500).json({ error: 'Failed to fetch queues' });
  }
});

// Create queue
router.post('/queues', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = createQueueSchema.parse(req.body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizations: {
          take: 1,
        },
      },
    });

    const organizationId = user?.organizations[0]?.organizationId;

    const queue = await prisma.postingQueue.create({
      data: {
        userId,
        organizationId,
        ...data,
      },
    });

    res.status(201).json({ queue });
  } catch (error) {
    console.error('Failed to create queue:', error);
    res.status(500).json({ error: 'Failed to create queue' });
  }
});

// Delete queue
router.delete('/queues/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await prisma.postingQueue.deleteMany({
      where: { id, userId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete queue:', error);
    res.status(500).json({ error: 'Failed to delete queue' });
  }
});

// Add time slot to queue
router.post('/queues/:id/timeslots', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = addTimeSlotSchema.parse(req.body);

    const timeSlot = await prisma.queueTimeSlot.create({
      data: {
        queueId: id,
        ...data,
      },
    });

    res.status(201).json({ timeSlot });
  } catch (error) {
    console.error('Failed to add time slot:', error);
    res.status(500).json({ error: 'Failed to add time slot' });
  }
});

// Update time slot
router.patch('/queues/:queueId/timeslots/:slotId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { slotId } = req.params;
    const { isActive } = req.body;

    const timeSlot = await prisma.queueTimeSlot.update({
      where: { id: slotId },
      data: { isActive },
    });

    res.json({ timeSlot });
  } catch (error) {
    console.error('Failed to update time slot:', error);
    res.status(500).json({ error: 'Failed to update time slot' });
  }
});

// Reorder queue posts
router.put('/queues/:id/reorder', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { postId, newPosition } = req.body;

    // Get all queued posts
    const queuedPosts = await prisma.scheduledPost.findMany({
      where: { queueId: id, status: 'QUEUED' },
      orderBy: { queuePosition: 'asc' },
    });

    // Find the post to move
    const postIndex = queuedPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ error: 'Post not found in queue' });
    }

    // Remove post from current position
    const [movedPost] = queuedPosts.splice(postIndex, 1);

    // Insert at new position
    queuedPosts.splice(newPosition, 0, movedPost);

    // Update positions in database
    await Promise.all(
      queuedPosts.map((post, index) =>
        prisma.scheduledPost.update({
          where: { id: post.id },
          data: { queuePosition: index },
        })
      )
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder queue:', error);
    return res.status(500).json({ error: 'Failed to reorder queue' });
  }
});

// Get optimal posting times
router.get('/optimal-times/:accountId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { accountId } = req.params;

    // Calculate if not exists or stale
    const existing = await prisma.optimalPostingTime.findFirst({
      where: { socialAccountId: accountId },
      orderBy: { lastCalculated: 'desc' },
    });

    if (!existing || new Date().getTime() - existing.lastCalculated.getTime() > 7 * 24 * 60 * 60 * 1000) {
      // Recalculate if older than 7 days
      await schedulingService.calculateOptimalTimes(accountId);
    }

    const times = await schedulingService.getOptimalTimes(accountId);

    res.json({ times });
  } catch (error) {
    console.error('Failed to get optimal times:', error);
    res.status(500).json({ error: 'Failed to get optimal times' });
  }
});

// Get recurring posts
router.get('/recurring', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const recurringGroups = await prisma.recurringPostGroup.findMany({
      where: { userId, isActive: true },
      include: {
        scheduledPost: {
          include: {
            post: true,
            socialAccount: {
              select: {
                username: true,
                platform: true,
              },
            },
          },
        },
      },
      orderBy: { nextRunDate: 'asc' },
    });

    res.json({ recurringGroups });
  } catch (error) {
    console.error('Failed to fetch recurring posts:', error);
    res.status(500).json({ error: 'Failed to fetch recurring posts' });
  }
});

// Update recurring post
router.patch('/recurring/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive, endDate } = req.body;

    const recurringGroup = await prisma.recurringPostGroup.update({
      where: { id },
      data: {
        isActive,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });

    res.json({ recurringGroup });
  } catch (error) {
    console.error('Failed to update recurring post:', error);
    res.status(500).json({ error: 'Failed to update recurring post' });
  }
});

export default router;