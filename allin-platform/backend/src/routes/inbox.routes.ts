import express from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validateZodRequest } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const messageQuerySchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'twitter', 'linkedin']).optional(),
  type: z.enum(['message', 'comment', 'mention', 'review']).optional(),
  status: z.enum(['unread', 'read', 'replied', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional()
});

const updateMessageSchema = z.object({
  status: z.enum(['unread', 'read', 'replied', 'archived']).optional(),
  isStarred: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
});

const replySchema = z.object({
  content: z.string().min(1, 'Reply content is required'),
  messageId: z.string().min(1, 'Message ID is required')
});

// Mock data for development
const mockMessages = [
  {
    id: '1',
    platform: 'instagram',
    type: 'comment',
    from: {
      name: 'Sarah Johnson',
      username: '@sarahjohnson',
      avatar: '/api/placeholder/32/32'
    },
    content: 'Love this post! When will you be releasing the new features?',
    timestamp: '2024-01-20T10:30:00Z',
    isRead: false,
    isStarred: true,
    engagement: { likes: 5, replies: 2, shares: 0 },
    postContext: 'Introducing our new AI-powered features!',
    priority: 'high',
    status: 'unread',
    userId: 'user1'
  },
  {
    id: '2',
    platform: 'twitter',
    type: 'mention',
    from: {
      name: 'Tech Reviewer',
      username: '@techreviewer',
      avatar: '/api/placeholder/32/32'
    },
    content: '@allin_app This looks amazing! Can you tell us more about the pricing plans?',
    timestamp: '2024-01-20T09:15:00Z',
    isRead: true,
    isStarred: false,
    engagement: { likes: 12, replies: 3, shares: 1 },
    priority: 'medium',
    status: 'read',
    userId: 'user1'
  },
  {
    id: '3',
    platform: 'facebook',
    type: 'message',
    from: {
      name: 'Business Owner',
      username: 'business.owner',
      avatar: '/api/placeholder/32/32'
    },
    content: 'Hi! I\'m interested in using your platform for my business. Could you provide more information about enterprise features?',
    timestamp: '2024-01-20T08:45:00Z',
    isRead: false,
    isStarred: false,
    priority: 'high',
    status: 'unread',
    userId: 'user1'
  },
  {
    id: '4',
    platform: 'linkedin',
    type: 'comment',
    from: {
      name: 'Marketing Pro',
      username: 'marketing.pro',
      avatar: '/api/placeholder/32/32'
    },
    content: 'Great insights on social media automation! This is exactly what our team needs.',
    timestamp: '2024-01-19T16:20:00Z',
    isRead: true,
    isStarred: false,
    engagement: { likes: 8, replies: 1, shares: 2 },
    postContext: 'Tips for maximizing your social media ROI',
    priority: 'medium',
    status: 'replied',
    userId: 'user1'
  }
];

/**
 * @route GET /api/inbox/messages
 * @desc Get inbox messages with filtering and pagination
 * @access Private
 */
router.get('/messages', authMiddleware, validateZodRequest(messageQuerySchema, 'query'), async (req: AuthRequest, res) => {
  try {
    const query = req.query as z.infer<typeof messageQuerySchema>;
    const { platform, type, status, priority, limit = 50, offset = 0, search } = query;
    const userId = req.user?.id;

    // Filter messages based on query parameters
    let filteredMessages = mockMessages.filter(message => message.userId === userId);

    if (platform) {
      filteredMessages = filteredMessages.filter(msg => msg.platform === platform);
    }

    if (type) {
      filteredMessages = filteredMessages.filter(msg => msg.type === type);
    }

    if (status) {
      filteredMessages = filteredMessages.filter(msg => msg.status === status);
    }

    if (priority) {
      filteredMessages = filteredMessages.filter(msg => msg.priority === priority);
    }

    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filteredMessages = filteredMessages.filter(msg =>
        msg.content.toLowerCase().includes(searchLower) ||
        msg.from.name.toLowerCase().includes(searchLower) ||
        (msg.postContext && msg.postContext.toLowerCase().includes(searchLower))
      );
    }

    // Sort by timestamp (newest first)
    filteredMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const paginatedMessages = filteredMessages.slice(Number(offset), Number(offset) + Number(limit));

    // Calculate totals for response
    const totals = {
      total: filteredMessages.length,
      unread: filteredMessages.filter(msg => msg.status === 'unread').length,
      starred: filteredMessages.filter(msg => msg.isStarred).length,
      highPriority: filteredMessages.filter(msg => msg.priority === 'high').length
    };

    res.json({
      success: true,
      data: {
        messages: paginatedMessages,
        pagination: {
          total: filteredMessages.length,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < filteredMessages.length
        },
        totals
      }
    });
  } catch (error) {
    console.error('Error fetching inbox messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inbox messages'
    });
  }
});

/**
 * @route GET /api/inbox/messages/:id
 * @desc Get a specific message by ID
 * @access Private
 */
router.get('/messages/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const message = mockMessages.find(msg => msg.id === id && msg.userId === userId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    return res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch message'
    });
  }
});

/**
 * @route PATCH /api/inbox/messages/:id
 * @desc Update message properties (status, starred, priority)
 * @access Private
 */
router.patch('/messages/:id', authMiddleware, validateZodRequest(updateMessageSchema), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updates = req.body as z.infer<typeof updateMessageSchema>;

    const messageIndex = mockMessages.findIndex(msg => msg.id === id && msg.userId === userId);

    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Update message properties
    if (updates.status !== undefined) {
      mockMessages[messageIndex].status = updates.status;
      mockMessages[messageIndex].isRead = updates.status !== 'unread';
    }

    if (updates.isStarred !== undefined) {
      mockMessages[messageIndex].isStarred = updates.isStarred;
    }

    if (updates.priority !== undefined) {
      mockMessages[messageIndex].priority = updates.priority;
    }

    return res.json({
      success: true,
      data: mockMessages[messageIndex],
      message: 'Message updated successfully'
    });
  } catch (error) {
    console.error('Error updating message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update message'
    });
  }
});

/**
 * @route POST /api/inbox/messages/:id/reply
 * @desc Reply to a message
 * @access Private
 */
router.post('/messages/:id/reply', authMiddleware, validateZodRequest(replySchema), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body as z.infer<typeof replySchema>;
    const userId = req.user?.id;

    const messageIndex = mockMessages.findIndex(msg => msg.id === id && msg.userId === userId);

    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Update message status to replied
    mockMessages[messageIndex].status = 'replied';
    mockMessages[messageIndex].isRead = true;

    // In a real implementation, this would send the reply via the respective platform's API
    const reply = {
      id: Date.now().toString(),
      messageId: id,
      content,
      timestamp: new Date().toISOString(),
      sentBy: userId,
      platform: mockMessages[messageIndex].platform
    };

    // Log the reply for audit purposes
    console.log('Reply sent:', reply);

    return res.json({
      success: true,
      data: {
        message: mockMessages[messageIndex],
        reply
      },
      message: 'Reply sent successfully'
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send reply'
    });
  }
});

/**
 * @route POST /api/inbox/messages/bulk-update
 * @desc Bulk update multiple messages
 * @access Private
 */
router.post('/messages/bulk-update', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { messageIds, updates } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs array is required'
      });
    }

    let updatedCount = 0;
    const updatedMessages = [];

    for (const messageId of messageIds) {
      const messageIndex = mockMessages.findIndex(msg => msg.id === messageId && msg.userId === userId);

      if (messageIndex !== -1) {
        if (updates.status !== undefined) {
          mockMessages[messageIndex].status = updates.status;
          mockMessages[messageIndex].isRead = updates.status !== 'unread';
        }

        if (updates.isStarred !== undefined) {
          mockMessages[messageIndex].isStarred = updates.isStarred;
        }

        if (updates.priority !== undefined) {
          mockMessages[messageIndex].priority = updates.priority;
        }

        updatedMessages.push(mockMessages[messageIndex]);
        updatedCount++;
      }
    }

    return res.json({
      success: true,
      data: {
        updatedMessages,
        updatedCount
      },
      message: `${updatedCount} messages updated successfully`
    });
  } catch (error) {
    console.error('Error bulk updating messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to bulk update messages'
    });
  }
});

/**
 * @route GET /api/inbox/stats
 * @desc Get inbox statistics
 * @access Private
 */
router.get('/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userMessages = mockMessages.filter(msg => msg.userId === userId);

    const stats = {
      total: userMessages.length,
      unread: userMessages.filter(msg => msg.status === 'unread').length,
      starred: userMessages.filter(msg => msg.isStarred).length,
      highPriority: userMessages.filter(msg => msg.priority === 'high').length,
      byPlatform: {
        facebook: userMessages.filter(msg => msg.platform === 'facebook').length,
        instagram: userMessages.filter(msg => msg.platform === 'instagram').length,
        twitter: userMessages.filter(msg => msg.platform === 'twitter').length,
        linkedin: userMessages.filter(msg => msg.platform === 'linkedin').length
      },
      byType: {
        message: userMessages.filter(msg => msg.type === 'message').length,
        comment: userMessages.filter(msg => msg.type === 'comment').length,
        mention: userMessages.filter(msg => msg.type === 'mention').length,
        review: userMessages.filter(msg => msg.type === 'review').length
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching inbox stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inbox statistics'
    });
  }
});

export default router;