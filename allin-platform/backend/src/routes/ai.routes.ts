import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';
import { aiService } from '../services/ai.service';

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

// POST /api/ai/generate-content - Generate social media content
router.post('/generate-content',
  [
    body('platform').isIn(['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok']),
    body('topic').isString().isLength({ min: 1, max: 500 }),
    body('tone').optional().isIn(['professional', 'casual', 'friendly', 'humorous', 'informative']),
    body('length').optional().isIn(['short', 'medium', 'long']),
    body('includeHashtags').optional().isBoolean(),
    body('includeEmojis').optional().isBoolean(),
    body('targetAudience').optional().isString(),
    body('keywords').optional().isArray()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const options = {
        platform: req.body.platform,
        topic: req.body.topic,
        tone: req.body.tone,
        length: req.body.length,
        includeHashtags: req.body.includeHashtags,
        includeEmojis: req.body.includeEmojis,
        targetAudience: req.body.targetAudience,
        keywords: req.body.keywords
      };

      const generatedContent = await aiService.generateContent(options);

      res.json({
        success: true,
        data: generatedContent
      });
    } catch (error) {
      console.error('Error generating content:', error);
      res.status(500).json({
        error: 'Failed to generate content',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// POST /api/ai/generate-hashtags - Generate hashtags for content
router.post('/generate-hashtags',
  [
    body('content').isString().isLength({ min: 1, max: 2000 }),
    body('platform').isString(),
    body('count').optional().isInt({ min: 1, max: 30 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { content, platform, count = 5 } = req.body;
      const hashtags = await aiService.generateHashtags(content, platform, count);

      res.json({
        success: true,
        data: { hashtags }
      });
    } catch (error) {
      console.error('Error generating hashtags:', error);
      res.status(500).json({
        error: 'Failed to generate hashtags',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// POST /api/ai/improve-content - Improve existing content
router.post('/improve-content',
  [
    body('content').isString().isLength({ min: 1, max: 2000 }),
    body('platform').isString(),
    body('goal').isString().isLength({ min: 1, max: 200 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { content, platform, goal } = req.body;
      const improvedContent = await aiService.improveContent(content, platform, goal);

      res.json({
        success: true,
        data: { improvedContent }
      });
    } catch (error) {
      console.error('Error improving content:', error);
      res.status(500).json({
        error: 'Failed to improve content',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/ai/templates - Get content templates
router.get('/templates',
  [
    query('platform').optional().isString()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const platform = req.query.platform as string;
      const templates = await aiService.getTemplates(userId, platform);

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        error: 'Failed to fetch templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// POST /api/ai/apply-template - Apply template with variables
router.post('/apply-template',
  [
    body('templateId').isString().notEmpty(),
    body('variables').isObject()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { templateId, variables } = req.body;
      const content = await aiService.applyTemplate(templateId, variables);

      res.json({
        success: true,
        data: { content }
      });
    } catch (error) {
      console.error('Error applying template:', error);
      res.status(500).json({
        error: 'Failed to apply template',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// POST /api/ai/save-draft - Save content as draft
router.post('/save-draft',
  [
    body('content').isString().notEmpty(),
    body('platforms').isArray().isLength({ min: 1 }),
    body('mediaUrls').optional().isArray(),
    body('scheduledFor').optional().isISO8601()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const draft = {
        content: req.body.content,
        platforms: req.body.platforms,
        mediaUrls: req.body.mediaUrls,
        scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : undefined
      };

      const savedDraft = await aiService.saveDraft(userId, draft);

      res.json({
        success: true,
        data: savedDraft
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      res.status(500).json({
        error: 'Failed to save draft',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/ai/drafts - Get user's drafts
router.get('/drafts', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const drafts = await aiService.getDrafts(userId);

    res.json({
      success: true,
      data: drafts
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({
      error: 'Failed to fetch drafts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/ai/analyze-content - Analyze content for optimization
router.post('/analyze-content',
  [
    body('content').isString().isLength({ min: 1, max: 2000 }),
    body('platform').isString()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { content, platform } = req.body;
      const analysis = await aiService.analyzeContent(content, platform);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('Error analyzing content:', error);
      res.status(500).json({
        error: 'Failed to analyze content',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;