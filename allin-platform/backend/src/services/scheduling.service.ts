import Bull from 'bull';
import { PrismaClient } from '@prisma/client';
import { addDays, addWeeks, addMonths } from 'date-fns';
import { socialService } from './social.service';

const prisma = new PrismaClient();

// Create Bull queue for post scheduling
const schedulingQueue = new Bull('post-scheduling', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6380'),
  },
});

// Queue processor
schedulingQueue.process(async (job: any) => {
  const { postId, action } = job.data;

  try {
    if (action === 'publish') {
      await publishScheduledPost(postId);
    } else if (action === 'process-recurring') {
      await processRecurringPost(postId);
    }
  } catch (error) {
    console.error(`Failed to process job ${job.id}:`, error);
    throw error;
  }
});

async function publishScheduledPost(scheduledPostId: string) {
  const scheduledPost = await prisma.scheduledPost.findUnique({
    where: { id: scheduledPostId },
    include: {
      post: true,
      socialAccount: true,
    },
  });

  if (!scheduledPost) {
    throw new Error('Scheduled post not found');
  }

  try {
    // Update status to publishing
    await prisma.scheduledPost.update({
      where: { id: scheduledPostId },
      data: { status: 'PUBLISHING' },
    });

    // Publish to social media platform
    const result = await socialService.publishPost(
      scheduledPost.socialAccount,
      scheduledPost.post
    );

    // Update post with platform ID and status
    await prisma.post.update({
      where: { id: scheduledPost.postId },
      data: {
        platformPostId: result.platformPostId,
        publishedAt: new Date(),
        status: 'PUBLISHED',
      },
    });

    // Update scheduled post status
    await prisma.scheduledPost.update({
      where: { id: scheduledPostId },
      data: { status: 'PUBLISHED' },
    });

    // If it's a recurring post, schedule the next occurrence
    if (scheduledPost.isRecurring && scheduledPost.recurringPattern) {
      await scheduleNextRecurrence(scheduledPost);
    }
  } catch (error) {
    // Update status to failed
    await prisma.scheduledPost.update({
      where: { id: scheduledPostId },
      data: {
        status: 'FAILED',
        lastError: error instanceof Error ? error.message : 'Unknown error',
        publishAttempts: { increment: 1 },
      },
    });
    throw error;
  }
}

async function processRecurringPost(recurringGroupId: string) {
  const recurringGroup = await prisma.recurringPostGroup.findUnique({
    where: { id: recurringGroupId },
    include: {
      scheduledPost: {
        include: {
          post: true,
        },
      },
    },
  });

  if (!recurringGroup || !recurringGroup.isActive) {
    return;
  }

  // Check if we've reached the end date
  if (recurringGroup.endDate && new Date() > recurringGroup.endDate) {
    await prisma.recurringPostGroup.update({
      where: { id: recurringGroupId },
      data: { isActive: false },
    });
    return;
  }

  // Create a new scheduled post for the next occurrence
  const nextDate = calculateNextRecurrence(
    recurringGroup.pattern,
    recurringGroup.frequency,
    new Date()
  );

  // Clone the original post
  const newPost = await prisma.post.create({
    data: {
      userId: recurringGroup.scheduledPost.userId,
      organizationId: recurringGroup.scheduledPost.organizationId,
      content: recurringGroup.scheduledPost.post.content,
      // media: recurringGroup.scheduledPost.post.media, // TODO: Add media field to Post model
      hashtags: recurringGroup.scheduledPost.post.hashtags || [],
      mentions: recurringGroup.scheduledPost.post.mentions || [],
      socialAccountId: recurringGroup.scheduledPost.socialAccountId,
      status: 'DRAFT',
    },
  });

  // Create new scheduled post
  const newScheduledPost = await prisma.scheduledPost.create({
    data: {
      postId: newPost.id,
      socialAccountId: recurringGroup.scheduledPost.socialAccountId,
      userId: recurringGroup.scheduledPost.userId,
      organizationId: recurringGroup.scheduledPost.organizationId,
      scheduledFor: nextDate,
      timezone: recurringGroup.scheduledPost.timezone,
      isRecurring: true,
      recurringPattern: recurringGroup.pattern,
      recurringEndDate: recurringGroup.endDate,
      status: 'PENDING',
    },
  });

  // Schedule the job
  await schedulingService.schedulePost(newScheduledPost.id, nextDate);

  // Update next run date
  await prisma.recurringPostGroup.update({
    where: { id: recurringGroupId },
    data: { nextRunDate: nextDate },
  });
}

function calculateNextRecurrence(
  pattern: string,
  frequency: number,
  currentDate: Date
): Date {
  switch (pattern) {
    case 'DAILY':
      return addDays(currentDate, frequency);
    case 'WEEKLY':
      return addWeeks(currentDate, frequency);
    case 'BIWEEKLY':
      return addWeeks(currentDate, frequency * 2);
    case 'MONTHLY':
      return addMonths(currentDate, frequency);
    default:
      return addDays(currentDate, 1);
  }
}

async function scheduleNextRecurrence(scheduledPost: any) {
  const nextDate = calculateNextRecurrence(
    scheduledPost.recurringPattern,
    1, // Default frequency
    new Date(scheduledPost.scheduledFor)
  );

  // Check if we're still within the end date
  if (scheduledPost.recurringEndDate && nextDate > scheduledPost.recurringEndDate) {
    return;
  }

  // Schedule the next occurrence  
  await schedulingQueue.add(
    'process-recurring',
    { postId: scheduledPost.id, action: 'process-recurring' },
    { delay: nextDate.getTime() - Date.now() }
  );
}

export const schedulingService = {
  // Schedule a post for publishing
  async schedulePost(scheduledPostId: string, scheduledFor: Date) {
    const delay = scheduledFor.getTime() - Date.now();

    if (delay <= 0) {
      // If the time has passed, publish immediately
      await publishScheduledPost(scheduledPostId);
    } else {
      // Add to queue with delay
      await schedulingQueue.add(
        'publish',
        { postId: scheduledPostId, action: 'publish' },
        { delay }
      );
    }
  },

  // Cancel a scheduled post
  async cancelScheduledPost(scheduledPostId: string) {
    // Remove from queue if exists
    const jobs = await schedulingQueue.getJobs(['delayed', 'waiting']);
    for (const job of jobs) {
      if (job.data.postId === scheduledPostId) {
        await job.remove();
      }
    }

    // Update status
    await prisma.scheduledPost.update({
      where: { id: scheduledPostId },
      data: { status: 'CANCELLED' },
    });
  },

  // Reschedule a post
  async reschedulePost(scheduledPostId: string, newDate: Date) {
    // Cancel existing schedule
    await this.cancelScheduledPost(scheduledPostId);

    // Update scheduled date
    await prisma.scheduledPost.update({
      where: { id: scheduledPostId },
      data: {
        scheduledFor: newDate,
        status: 'PENDING',
      },
    });

    // Schedule with new date
    await this.schedulePost(scheduledPostId, newDate);
  },

  // Add post to queue
  async addToQueue(queueId: string, postId: string) {
    const queue = await prisma.postingQueue.findUnique({
      where: { id: queueId },
      include: {
        timeSlots: {
          where: { isActive: true },
          orderBy: [{ dayOfWeek: 'asc' }, { time: 'asc' }],
        },
        scheduledPosts: {
          where: { status: 'QUEUED' },
          orderBy: { queuePosition: 'asc' },
        },
      },
    });

    if (!queue) {
      throw new Error('Queue not found');
    }

    // Find next available time slot
    const nextSlot = this.findNextAvailableSlot(queue.timeSlots);

    // Get the last position in queue
    const lastPosition = queue.scheduledPosts.length > 0
      ? queue.scheduledPosts[queue.scheduledPosts.length - 1].queuePosition || 0
      : 0;

    // Create scheduled post
    const scheduledPost = await prisma.scheduledPost.create({
      data: {
        postId,
        socialAccountId: '', // This should be provided
        userId: queue.userId,
        organizationId: queue.organizationId,
        scheduledFor: nextSlot,
        timezone: queue.timezone,
        queueId: queue.id,
        queuePosition: lastPosition + 1,
        status: 'QUEUED',
      },
    });

    // Schedule the post
    await this.schedulePost(scheduledPost.id, nextSlot);

    return scheduledPost;
  },

  // Find next available time slot
  findNextAvailableSlot(timeSlots: any[]): Date {
    if (timeSlots.length === 0) {
      // Default to next hour if no slots defined
      const next = new Date();
      next.setHours(next.getHours() + 1, 0, 0, 0);
      return next;
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Find next slot
    for (const slot of timeSlots) {
      if (slot.dayOfWeek > currentDay ||
          (slot.dayOfWeek === currentDay && slot.time > currentTime)) {
        return this.getDateForSlot(slot.dayOfWeek, slot.time);
      }
    }

    // If no slots found this week, use first slot next week
    return this.getDateForSlot(timeSlots[0].dayOfWeek, timeSlots[0].time, true);
  },

  // Convert day and time to Date
  getDateForSlot(dayOfWeek: number, time: string, nextWeek = false): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();

    // Calculate days until target day
    let daysUntil = dayOfWeek - date.getDay();
    if (daysUntil < 0 || (daysUntil === 0 && `${hours}:${minutes}` <= `${date.getHours()}:${date.getMinutes()}`)) {
      daysUntil += 7;
    }
    if (nextWeek) {
      daysUntil += 7;
    }

    date.setDate(date.getDate() + daysUntil);
    date.setHours(hours, minutes, 0, 0);

    return date;
  },

  // Calculate optimal posting times
  async calculateOptimalTimes(socialAccountId: string) {
    // Get historical post performance
    const posts = await prisma.post.findMany({
      where: {
        socialAccountId,
        publishedAt: { not: null },
      },
      orderBy: { publishedAt: 'desc' },
      take: 100,
    });

    // Group by day and hour
    const timePerformance: Record<string, number[]> = {};

    for (const post of posts) {
      if (!post.publishedAt) continue;

      const date = new Date(post.publishedAt);
      const key = `${date.getDay()}-${date.getHours()}`;

      if (!timePerformance[key]) {
        timePerformance[key] = [];
      }

      // Calculate engagement rate
      const engagement = (post.likes + post.comments + post.shares) / Math.max(post.views, 1);
      timePerformance[key].push(engagement);
    }

    // Calculate average engagement for each time slot
    const optimalTimes = [];

    for (const [key, engagements] of Object.entries(timePerformance)) {
      const [day, hour] = key.split('-').map(Number);
      const avgEngagement = engagements.reduce((a, b) => a + b, 0) / engagements.length;

      optimalTimes.push({
        dayOfWeek: day,
        hour,
        score: avgEngagement,
        avgEngagement,
        avgReach: 0, // Calculate based on actual data
        sampleSize: engagements.length,
      });
    }

    // Sort by score
    optimalTimes.sort((a, b) => b.score - a.score);

    // Store in database
    for (const time of optimalTimes.slice(0, 10)) {
      await prisma.optimalPostingTime.upsert({
        where: {
          socialAccountId_dayOfWeek_hour: {
            socialAccountId,
            dayOfWeek: time.dayOfWeek,
            hour: time.hour,
          },
        },
        create: {
          socialAccountId,
          platform: 'FACEBOOK', // Should be dynamic
          ...time,
          lastCalculated: new Date(),
        },
        update: {
          ...time,
          lastCalculated: new Date(),
        },
      });
    }

    return optimalTimes;
  },

  // Get optimal times for an account
  async getOptimalTimes(socialAccountId: string) {
    return prisma.optimalPostingTime.findMany({
      where: { socialAccountId },
      orderBy: { score: 'desc' },
      take: 10,
    });
  },
};