import { Router, Request, Response } from 'express';
import { collaborationService } from '../services/collaboration.service';
import { authenticate } from '../middleware/auth';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

// Add comment to post
router.post(
  '/comments',
  authenticate,
  [
    body('content').notEmpty().withMessage('Comment content is required'),
    body('postId').optional().isString(),
    body('parentId').optional().isString()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { content, postId, parentId } = req.body;
      const userId = req.user?.id!;

      const comment = await collaborationService.addComment(
        userId,
        content,
        postId,
        parentId
      );

      return res.status(201).json({
        success: true,
        comment
      });
    } catch (error) {
      console.error('Add comment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add comment'
      });
    }
  }
);

// Get comments for a post
router.get(
  '/comments/:postId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const comments = await collaborationService.getComments(postId);

      return res.json({
        success: true,
        comments,
        count: comments.length
      });
    } catch (error) {
      console.error('Get comments error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get comments'
      });
    }
  }
);

// Update comment
router.put(
  '/comments/:commentId',
  authenticate,
  [
    param('commentId').notEmpty(),
    body('content').notEmpty().withMessage('Comment content is required')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user?.id!;

      const comment = await collaborationService.updateComment(
        commentId,
        userId,
        content
      );

      return res.json({
        success: true,
        comment
      });
    } catch (error) {
      console.error('Update comment error:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update comment'
      });
    }
  }
);

// Delete comment
router.delete(
  '/comments/:commentId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      const userId = req.user?.id!;

      await collaborationService.deleteComment(commentId, userId);

      return res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Delete comment error:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete comment'
      });
    }
  }
);

// Add reaction to comment
router.post(
  '/comments/:commentId/reactions',
  authenticate,
  [
    param('commentId').notEmpty(),
    body('emoji').notEmpty().withMessage('Emoji is required')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { commentId } = req.params;
      const { emoji } = req.body;
      const userId = req.user?.id!;

      await collaborationService.addReaction(commentId, userId, emoji);

      return res.json({
        success: true,
        message: 'Reaction added successfully'
      });
    } catch (error) {
      console.error('Add reaction error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add reaction'
      });
    }
  }
);

// Get user notifications
router.get(
  '/notifications',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id!;
      const notifications = await collaborationService.getUserNotifications(userId);
      const unreadCount = await collaborationService.getUnreadCount(userId);

      return res.json({
        success: true,
        notifications,
        unreadCount
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get notifications'
      });
    }
  }
);

// Mark notification as read
router.put(
  '/notifications/:notificationId/read',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user?.id!;

      await collaborationService.markNotificationAsRead(notificationId, userId);

      return res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read'
      });
    }
  }
);

// Mark all notifications as read
router.put(
  '/notifications/read-all',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id!;
      await collaborationService.markAllNotificationsAsRead(userId);

      return res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read'
      });
    }
  }
);

// Get team members
router.get(
  '/team/members',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId || 'default';
      const teamMembers = await collaborationService.getTeamMembers(organizationId);

      return res.json({
        success: true,
        members: teamMembers,
        count: teamMembers.length
      });
    } catch (error) {
      console.error('Get team members error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get team members'
      });
    }
  }
);

// Update user status
router.put(
  '/team/status',
  authenticate,
  [
    body('status').isIn(['online', 'offline', 'away']).withMessage('Invalid status')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { status } = req.body;
      const userId = req.user?.id!;

      await collaborationService.updateUserStatus(userId, status);

      return res.json({
        success: true,
        message: 'Status updated successfully'
      });
    } catch (error) {
      console.error('Update status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update status'
      });
    }
  }
);

// Get activity logs
router.get(
  '/activities',
  authenticate,
  [
    query('userId').optional().isString(),
    query('action').optional().isString(),
    query('entityType').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const organizationId = req.user?.organizationId || 'default';
      const filters = {
        userId: req.query.userId as string,
        action: req.query.action as string,
        entityType: req.query.entityType as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };

      const activities = await collaborationService.getActivities(
        organizationId,
        filters
      );

      return res.json({
        success: true,
        activities,
        count: activities.length
      });
    } catch (error) {
      console.error('Get activities error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get activities'
      });
    }
  }
);

// Assign task to user
router.post(
  '/tasks/assign',
  authenticate,
  [
    body('taskId').notEmpty().withMessage('Task ID is required'),
    body('assignedTo').notEmpty().withMessage('Assignee is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('dueDate').optional().isISO8601()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { taskId, assignedTo, description, dueDate } = req.body;
      const assignedBy = req.user?.id!;

      await collaborationService.assignTask(
        taskId,
        assignedBy,
        assignedTo,
        description,
        dueDate ? new Date(dueDate) : undefined
      );

      return res.json({
        success: true,
        message: 'Task assigned successfully'
      });
    } catch (error) {
      console.error('Assign task error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to assign task'
      });
    }
  }
);

export default router;