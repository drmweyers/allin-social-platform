import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { aiService } from '../services/ai.service';

const router = Router();

// All AI routes require authentication
router.use(authenticateToken);

// Generate content
router.post('/generate', async (req, res) => {
  try {
    const { platform, topic, tone, length, includeHashtags, includeEmojis, targetAudience, keywords } = req.body;

    if (!platform || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Platform and topic are required',
      });
    }

    const content = await aiService.generateContent({
      platform,
      topic,
      tone,
      length,
      includeHashtags,
      includeEmojis,
      targetAudience,
      keywords,
    });

    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate content',
    });
  }
});

// Generate hashtags
router.post('/hashtags', async (req, res) => {
  try {
    const { content, platform, count = 5 } = req.body;

    if (!content || !platform) {
      return res.status(400).json({
        success: false,
        error: 'Content and platform are required',
      });
    }

    const hashtags = await aiService.generateHashtags(content, platform, count);

    res.json({
      success: true,
      data: { hashtags },
    });
  } catch (error) {
    console.error('Error generating hashtags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate hashtags',
    });
  }
});

// Improve content
router.post('/improve', async (req, res) => {
  try {
    const { content, platform, goal } = req.body;

    if (!content || !platform) {
      return res.status(400).json({
        success: false,
        error: 'Content and platform are required',
      });
    }

    const improvedContent = await aiService.improveContent(
      content,
      platform,
      goal || 'increase engagement'
    );

    res.json({
      success: true,
      data: { content: improvedContent },
    });
  } catch (error) {
    console.error('Error improving content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to improve content',
    });
  }
});

// Get templates
router.get('/templates', async (req, res) => {
  try {
    const { platform } = req.query;
    const userId = (req as any).user.id;

    const templates = await aiService.getTemplates(userId, platform as string);

    res.json({
      success: true,
      data: { templates },
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
    });
  }
});

// Apply template
router.post('/templates/apply', async (req, res) => {
  try {
    const { templateId, variables } = req.body;

    if (!templateId || !variables) {
      return res.status(400).json({
        success: false,
        error: 'Template ID and variables are required',
      });
    }

    const content = await aiService.applyTemplate(templateId, variables);

    res.json({
      success: true,
      data: { content },
    });
  } catch (error) {
    console.error('Error applying template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply template',
    });
  }
});

// Save draft
router.post('/drafts', async (req, res) => {
  try {
    const { content, platforms, mediaUrls, scheduledFor } = req.body;
    const userId = (req as any).user.id;

    if (!content || !platforms || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content and at least one platform are required',
      });
    }

    const draft = await aiService.saveDraft(userId, {
      content,
      platforms,
      mediaUrls,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
    });

    res.json({
      success: true,
      data: { draft },
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save draft',
    });
  }
});

// Get drafts
router.get('/drafts', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const drafts = await aiService.getDrafts(userId);

    res.json({
      success: true,
      data: { drafts },
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drafts',
    });
  }
});

// Analyze content
router.post('/analyze', async (req, res) => {
  try {
    const { content, platform } = req.body;

    if (!content || !platform) {
      return res.status(400).json({
        success: false,
        error: 'Content and platform are required',
      });
    }

    const analysis = await aiService.analyzeContent(content, platform);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error analyzing content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze content',
    });
  }
});

export default router;