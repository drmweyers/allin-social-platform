import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { draftService } from '../services/draft.service';
import { SocialPlatform } from '@prisma/client';

const router = Router();

// All draft routes require authentication
router.use(authenticateToken);

// Draft endpoints
router.post('/drafts', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { title, content, platforms, mediaUrls, hashtags, aiGenerated, aiPrompt, aiModel, scheduledFor } = req.body;

    if (!content || !platforms || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content and at least one platform are required',
      });
    }

    const draft = await draftService.createDraft({
      userId,
      title,
      content,
      platforms,
      mediaUrls,
      hashtags,
      aiGenerated,
      aiPrompt,
      aiModel,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
    });

    res.json({
      success: true,
      data: { draft },
    });
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create draft',
    });
  }
});

router.get('/drafts', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { limit, offset, platform } = req.query;

    const result = await draftService.getDrafts(userId, undefined, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      platform: platform as SocialPlatform,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drafts',
    });
  }
});

router.get('/drafts/search', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const drafts = await draftService.searchDrafts(userId, q as string);

    res.json({
      success: true,
      data: { drafts },
    });
  } catch (error) {
    console.error('Error searching drafts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search drafts',
    });
  }
});

router.get('/drafts/:id', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const draft = await draftService.getDraftById(id, userId);

    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found',
      });
    }

    res.json({
      success: true,
      data: { draft },
    });
  } catch (error) {
    console.error('Error fetching draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch draft',
    });
  }
});

router.put('/drafts/:id', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const updateData = req.body;

    const draft = await draftService.updateDraft({
      id,
      userId,
      ...updateData,
    });

    res.json({
      success: true,
      data: { draft },
    });
  } catch (error: any) {
    console.error('Error updating draft:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Failed to update draft',
    });
  }
});

router.delete('/drafts/:id', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    await draftService.deleteDraft(id, userId);

    res.json({
      success: true,
      message: 'Draft deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting draft:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Failed to delete draft',
    });
  }
});

router.post('/drafts/:id/convert', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { socialAccountId } = req.body;

    if (!socialAccountId) {
      return res.status(400).json({
        success: false,
        error: 'Social account ID is required',
      });
    }

    const post = await draftService.convertDraftToPost(id, userId, socialAccountId);

    res.json({
      success: true,
      data: { post },
    });
  } catch (error: any) {
    console.error('Error converting draft:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Failed to convert draft',
    });
  }
});

router.delete('/drafts', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Draft IDs are required',
      });
    }

    const result = await draftService.bulkDeleteDrafts(ids, userId);

    res.json({
      success: true,
      data: { deletedCount: result.count },
    });
  } catch (error: any) {
    console.error('Error bulk deleting drafts:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Failed to delete drafts',
    });
  }
});

// Template endpoints
router.post('/templates', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { name, description, category, template, variables, platforms, isPublic } = req.body;

    if (!name || !template || !platforms || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name, template, and at least one platform are required',
      });
    }

    const contentTemplate = await draftService.createTemplate({
      userId,
      name,
      description,
      category,
      template,
      variables: variables || [],
      platforms,
      isPublic,
    });

    res.json({
      success: true,
      data: { template: contentTemplate },
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template',
    });
  }
});

router.get('/templates', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { limit, offset, platform, category, includePublic } = req.query;

    const result = await draftService.getTemplates(userId, undefined, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      platform: platform as SocialPlatform,
      category: category as string,
      includePublic: includePublic === 'true',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
    });
  }
});

router.get('/templates/categories', async (req, res) => {
  try {
    const categories = await draftService.getTemplateCategories();

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error('Error fetching template categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template categories',
    });
  }
});

router.get('/templates/search', async (req, res) => {
  try {
    const { q, includePublic } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const templates = await draftService.searchTemplates(
      q as string,
      includePublic === 'true'
    );

    res.json({
      success: true,
      data: { templates },
    });
  } catch (error) {
    console.error('Error searching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search templates',
    });
  }
});

router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await draftService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    res.json({
      success: true,
      data: { template },
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template',
    });
  }
});

router.post('/templates/:id/apply', async (req, res) => {
  try {
    const { id } = req.params;
    const { variables } = req.body;

    if (!variables) {
      return res.status(400).json({
        success: false,
        error: 'Variables are required',
      });
    }

    const content = await draftService.applyTemplate(id, variables);

    res.json({
      success: true,
      data: { content },
    });
  } catch (error: any) {
    console.error('Error applying template:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Failed to apply template',
    });
  }
});

router.put('/templates/:id', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const updateData = req.body;

    const template = await draftService.updateTemplate({
      id,
      userId,
      ...updateData,
    });

    res.json({
      success: true,
      data: { template },
    });
  } catch (error: any) {
    console.error('Error updating template:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Failed to update template',
    });
  }
});

router.delete('/templates/:id', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    await draftService.deleteTemplate(id, userId);

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Failed to delete template',
    });
  }
});

export default router;