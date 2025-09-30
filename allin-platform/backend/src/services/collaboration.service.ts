import { prisma } from './database';
import { redisClient } from './redis';
import { EventEmitter } from 'events';

interface Comment {
  id: string;
  postId?: string;
  userId: string;
  content: string;
  mentions: string[];
  parentId?: string; // For threaded comments
  createdAt: Date;
  updatedAt: Date;
  reactions?: CommentReaction[];
}

interface CommentReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: any;
  read: boolean;
  createdAt: Date;
}

export enum NotificationType {
  MENTION = 'MENTION',
  COMMENT = 'COMMENT',
  APPROVAL_NEEDED = 'APPROVAL_NEEDED',
  POST_APPROVED = 'POST_APPROVED',
  POST_REJECTED = 'POST_REJECTED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  POST_PUBLISHED = 'POST_PUBLISHED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING'
}

interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
}

interface ActivityLog {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  entityType: 'post' | 'comment' | 'user' | 'account' | 'workflow';
  entityId: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export class CollaborationService extends EventEmitter {
  constructor() {
    super();
  }

  // Comment Management
  async addComment(
    userId: string,
    content: string,
    postId?: string,
    parentId?: string
  ): Promise<Comment> {
    // Extract mentions from content
    const mentions = this.extractMentions(content);

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      postId,
      userId,
      content,
      mentions,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      reactions: []
    };

    // Store in Redis for real-time access
    const key = postId ? `comments:post:${postId}` : `comments:thread:${parentId}`;
    const comments = await this.getComments(postId, parentId);
    comments.push(comment);

    await redisClient.setex(key, 86400, JSON.stringify(comments));

    // Create notifications for mentioned users
    for (const mentionedUserId of mentions) {
      await this.createNotification({
        userId: mentionedUserId,
        type: NotificationType.MENTION,
        title: 'You were mentioned',
        message: `${await this.getUserName(userId)} mentioned you in a comment`,
        metadata: { commentId: comment.id, postId }
      });
    }

    // Emit real-time event
    this.emit('commentAdded', comment);

    // Log activity
    await this.logActivity({
      organizationId: await this.getUserOrganization(userId),
      userId,
      action: 'COMMENT_ADDED',
      entityType: 'comment',
      entityId: comment.id,
      metadata: { postId, mentions }
    });

    return comment;
  }

  async getComments(postId?: string, parentId?: string): Promise<Comment[]> {
    const key = postId ? `comments:post:${postId}` : `comments:thread:${parentId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : [];
  }

  async updateComment(commentId: string, userId: string, content: string): Promise<Comment> {
    // Find and update comment
    const allKeys = await redisClient.keys('comments:*');

    for (const key of allKeys) {
      const comments = JSON.parse(await redisClient.get(key) || '[]');
      const commentIndex = comments.findIndex((c: Comment) => c.id === commentId);

      if (commentIndex !== -1) {
        const comment = comments[commentIndex];

        // Check if user can edit
        if (comment.userId !== userId) {
          throw new Error('Unauthorized to edit this comment');
        }

        comment.content = content;
        comment.mentions = this.extractMentions(content);
        comment.updatedAt = new Date();

        await redisClient.setex(key, 86400, JSON.stringify(comments));

        this.emit('commentUpdated', comment);
        return comment;
      }
    }

    throw new Error('Comment not found');
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const allKeys = await redisClient.keys('comments:*');

    for (const key of allKeys) {
      const comments = JSON.parse(await redisClient.get(key) || '[]');
      const commentIndex = comments.findIndex((c: Comment) => c.id === commentId);

      if (commentIndex !== -1) {
        const comment = comments[commentIndex];

        // Check if user can delete
        if (comment.userId !== userId) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { organizations: true }
          });

          if (!user?.organizations[0] ||
              user.organizations[0].role !== 'ADMIN' &&
              user.organizations[0].role !== 'OWNER') {
            throw new Error('Unauthorized to delete this comment');
          }
        }

        comments.splice(commentIndex, 1);
        await redisClient.setex(key, 86400, JSON.stringify(comments));

        this.emit('commentDeleted', { commentId });
        return;
      }
    }
  }

  async addReaction(commentId: string, userId: string, emoji: string): Promise<void> {
    const allKeys = await redisClient.keys('comments:*');

    for (const key of allKeys) {
      const comments = JSON.parse(await redisClient.get(key) || '[]');
      const comment = comments.find((c: Comment) => c.id === commentId);

      if (comment) {
        if (!comment.reactions) {
          comment.reactions = [];
        }

        // Remove existing reaction from user
        comment.reactions = comment.reactions.filter((r: CommentReaction) => r.userId !== userId);

        // Add new reaction
        comment.reactions.push({
          userId,
          emoji,
          createdAt: new Date()
        });

        await redisClient.setex(key, 86400, JSON.stringify(comments));

        this.emit('reactionAdded', { commentId, userId, emoji });
        return;
      }
    }
  }

  // Notification Management
  async createNotification(data: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<Notification> {
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      ...data,
      read: false,
      createdAt: new Date()
    };

    // Store in Redis
    const userNotifications = await this.getUserNotifications(data.userId);
    userNotifications.unshift(notification);

    await redisClient.setex(
      `notifications:${data.userId}`,
      86400 * 7, // 7 days
      JSON.stringify(userNotifications)
    );

    // Emit real-time event
    this.emit('notificationCreated', notification);

    // Track unread count
    await this.updateUnreadCount(data.userId, 1);

    return notification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const data = await redisClient.get(`notifications:${userId}`);
    return data ? JSON.parse(data) : [];
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    const notifications = await this.getUserNotifications(userId);
    const notification = notifications.find(n => n.id === notificationId);

    if (notification && !notification.read) {
      notification.read = true;

      await redisClient.setex(
        `notifications:${userId}`,
        86400 * 7,
        JSON.stringify(notifications)
      );

      await this.updateUnreadCount(userId, -1);
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const notifications = await this.getUserNotifications(userId);
    let unreadCount = 0;

    notifications.forEach(n => {
      if (!n.read) {
        n.read = true;
        unreadCount++;
      }
    });

    await redisClient.setex(
      `notifications:${userId}`,
      86400 * 7,
      JSON.stringify(notifications)
    );

    await redisClient.set(`notifications:unread:${userId}`, '0');
  }

  private async updateUnreadCount(userId: string, delta: number): Promise<void> {
    const currentCount = parseInt(await redisClient.get(`notifications:unread:${userId}`) || '0');
    const newCount = Math.max(0, currentCount + delta);
    await redisClient.set(`notifications:unread:${userId}`, newCount.toString());
  }

  async getUnreadCount(userId: string): Promise<number> {
    return parseInt(await redisClient.get(`notifications:unread:${userId}`) || '0');
  }

  // Team Management
  async getTeamMembers(organizationId: string): Promise<TeamMember[]> {
    const orgUsers = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: true
      }
    });

    const teamMembers: TeamMember[] = [];

    for (const orgUser of orgUsers) {
      const status = await this.getUserStatus(orgUser.userId);

      teamMembers.push({
        userId: orgUser.userId,
        name: orgUser.user.name || 'Unknown',
        email: orgUser.user.email,
        role: orgUser.role,
        avatar: orgUser.user.image || undefined,
        status,
        lastSeen: await this.getLastSeen(orgUser.userId)
      });
    }

    return teamMembers;
  }

  async updateUserStatus(userId: string, status: 'online' | 'offline' | 'away'): Promise<void> {
    await redisClient.setex(`user:status:${userId}`, 300, status); // 5 minutes
    await redisClient.set(`user:lastseen:${userId}`, new Date().toISOString());

    this.emit('userStatusChanged', { userId, status });
  }

  private async getUserStatus(userId: string): Promise<'online' | 'offline' | 'away'> {
    const status = await redisClient.get(`user:status:${userId}`);
    return (status as 'online' | 'offline' | 'away') || 'offline';
  }

  private async getLastSeen(userId: string): Promise<Date> {
    const lastSeen = await redisClient.get(`user:lastseen:${userId}`);
    return lastSeen ? new Date(lastSeen) : new Date();
  }

  // Activity Logging
  async logActivity(data: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    const activity: ActivityLog = {
      id: `activity_${Date.now()}`,
      ...data,
      timestamp: new Date()
    };

    // Store in Redis (in production, also store in database)
    const key = `activities:${data.organizationId}`;
    const activities = await this.getActivities(data.organizationId);
    activities.unshift(activity);

    // Keep only last 1000 activities
    if (activities.length > 1000) {
      activities.pop();
    }

    await redisClient.setex(key, 86400 * 30, JSON.stringify(activities)); // 30 days
  }

  async getActivities(
    organizationId: string,
    filters?: {
      userId?: string;
      action?: string;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<ActivityLog[]> {
    const data = await redisClient.get(`activities:${organizationId}`);
    let activities: ActivityLog[] = data ? JSON.parse(data) : [];

    if (filters) {
      activities = activities.filter(activity => {
        if (filters.userId && activity.userId !== filters.userId) return false;
        if (filters.action && activity.action !== filters.action) return false;
        if (filters.entityType && activity.entityType !== filters.entityType) return false;
        if (filters.startDate && new Date(activity.timestamp) < filters.startDate) return false;
        if (filters.endDate && new Date(activity.timestamp) > filters.endDate) return false;
        return true;
      });
    }

    return activities;
  }

  // Helper Methods
  private extractMentions(content: string): string[] {
    const mentionPattern = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionPattern.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  private async getUserName(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });
    return user?.name || 'Unknown User';
  }

  private async getUserOrganization(userId: string): Promise<string> {
    const userOrg = await prisma.organizationMember.findFirst({
      where: { userId },
      select: { organizationId: true }
    });
    return userOrg?.organizationId || '';
  }

  // Task Assignment
  async assignTask(
    taskId: string,
    assignedBy: string,
    assignedTo: string,
    description: string,
    dueDate?: Date
  ): Promise<void> {
    await this.createNotification({
      userId: assignedTo,
      type: NotificationType.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: `${await this.getUserName(assignedBy)} assigned you a task: ${description}`,
      metadata: { taskId, dueDate }
    });

    await this.logActivity({
      organizationId: await this.getUserOrganization(assignedBy),
      userId: assignedBy,
      action: 'TASK_ASSIGNED',
      entityType: 'post',
      entityId: taskId,
      metadata: { assignedTo, description, dueDate }
    });

    this.emit('taskAssigned', { taskId, assignedBy, assignedTo, description, dueDate });
  }
}

export const collaborationService = new CollaborationService();