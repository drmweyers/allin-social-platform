import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';
import { conversationService } from '../services/conversation.service';
import { MessageRole } from '@prisma/client';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Apply AI-specific rate limiting to all routes
router.use(aiRateLimiter);

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// POST /api/ai-chat/conversations - Create new conversation
router.post('/conversations',
  [
    body('title').optional().isString().isLength({ max: 200 }),
    body('currentPage').optional().isString().isLength({ max: 500 }),
    body('featureContext').optional().isString().isLength({ max: 500 }),
    body('initialMessage').optional().isString().isLength({ min: 1, max: 2000 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const conversation = await conversationService.createConversation({
        userId,
        organizationId: req.body.organizationId,
        title: req.body.title,
        currentPage: req.body.currentPage,
        featureContext: req.body.featureContext,
        initialMessage: req.body.initialMessage,
      });

      res.status(201).json({
        success: true,
        data: conversation
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({
        error: 'Failed to create conversation',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/ai-chat/conversations - Get user's conversations
router.get('/conversations',
  [
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const conversations = await conversationService.getUserConversations(
        userId,
        req.body.organizationId,
        limit
      );

      res.json({
        success: true,
        data: conversations
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({
        error: 'Failed to fetch conversations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/ai-chat/conversations/:id - Get conversation with messages
router.get('/conversations/:id',
  [
    param('id').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const conversation = await conversationService.getConversationWithMessages(req.params.id);

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Check if user has access to this conversation
      if (conversation.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({
        error: 'Failed to fetch conversation',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// POST /api/ai-chat/conversations/:id/messages - Send message and get AI response
router.post('/conversations/:id/messages',
  [
    param('id').isString().notEmpty(),
    body('message').isString().isLength({ min: 1, max: 2000 }),
    body('currentPage').optional().isString(),
    body('featureContext').optional().isString()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const conversationId = req.params.id;
      const { message, currentPage, featureContext } = req.body;

      // Verify conversation belongs to user
      const conversation = await conversationService.getConversationWithMessages(conversationId);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Generate AI response
      const aiResponse = await conversationService.generateAIResponse(
        conversationId,
        message,
        {
          currentPage,
          featureContext,
          userId,
          userRole
        }
      );

      res.json({
        success: true,
        data: aiResponse
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        error: 'Failed to send message',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// POST /api/ai-chat/messages/:id/feedback - Submit feedback for AI message
router.post('/messages/:id/feedback',
  [
    param('id').isString().notEmpty(),
    body('helpful').isBoolean(),
    body('feedback').optional().isString().isLength({ max: 1000 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { helpful, feedback } = req.body;

      const updatedMessage = await conversationService.updateMessageFeedback(
        req.params.id,
        helpful,
        feedback
      );

      res.json({
        success: true,
        data: updatedMessage
      });
    } catch (error) {
      console.error('Error updating message feedback:', error);
      res.status(500).json({
        error: 'Failed to update feedback',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// DELETE /api/ai-chat/conversations/:id - Archive conversation
router.delete('/conversations/:id',
  [
    param('id').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Verify conversation belongs to user
      const conversation = await conversationService.getConversationWithMessages(req.params.id);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const archivedConversation = await conversationService.archiveConversation(req.params.id);

      res.json({
        success: true,
        data: archivedConversation
      });
    } catch (error) {
      console.error('Error archiving conversation:', error);
      res.status(500).json({
        error: 'Failed to archive conversation',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/ai-chat/quick-questions - Get suggested questions based on context
router.get('/quick-questions',
  [
    query('page').optional().isString(),
    query('context').optional().isString()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const page = req.query.page as string || 'dashboard';
      const context = req.query.context as string || 'general';

      const questions = getQuickQuestions(page, context);

      res.json({
        success: true,
        data: { questions }
      });
    } catch (error) {
      console.error('Error fetching quick questions:', error);
      res.status(500).json({
        error: 'Failed to fetch questions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/ai-chat/analytics - Get conversation analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const analytics = await conversationService.getConversationAnalytics(
      userId,
      req.body.organizationId
    );

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to get context-based quick questions
function getQuickQuestions(page: string, context: string): string[] {
  const questionSets = {
    dashboard: [
      "How can I improve my social media engagement?",
      "What's the best time to post on Instagram?",
      "How do I create a content calendar?",
      "What metrics should I track for my social media?"
    ],
    create: [
      "Help me write a compelling Instagram caption",
      "What hashtags should I use for my post?",
      "How can I make my content more engaging?",
      "What's the ideal post length for LinkedIn?"
    ],
    analytics: [
      "How do I interpret my engagement rate?",
      "What does reach vs impressions mean?",
      "How can I improve my content performance?",
      "What are good social media KPIs to track?"
    ],
    calendar: [
      "What's the optimal posting frequency?",
      "How do I plan content for different platforms?",
      "When should I post on each social platform?",
      "How far in advance should I schedule posts?"
    ],
    team: [
      "How do I manage a social media team?",
      "What roles are needed for social media management?",
      "How do I collaborate on content creation?",
      "What permissions should team members have?"
    ],
    settings: [
      "How do I connect my social media accounts?",
      "How do I set up automated posting?",
      "What integrations are available?",
      "How do I manage my account security?"
    ]
  };

  return questionSets[page as keyof typeof questionSets] || questionSets.dashboard;
}

export default router;