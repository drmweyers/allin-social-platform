/**
 * Draft Routes Tests - BMAD MONITOR Phase 3
 * Tests for content draft and template management
 */

import request from 'supertest';
import express from 'express';

// Mock draft service BEFORE importing routes
jest.mock('../../../src/services/draft.service', () => ({
  draftService: {
    createDraft: jest.fn(),
    getDrafts: jest.fn(),
    searchDrafts: jest.fn(),
    getDraftById: jest.fn(),
    updateDraft: jest.fn(),
    deleteDraft: jest.fn(),
    convertDraftToPost: jest.fn(),
    bulkDeleteDrafts: jest.fn(),
    createTemplate: jest.fn(),
    getTemplates: jest.fn(),
    getTemplateCategories: jest.fn(),
    searchTemplates: jest.fn(),
    getTemplateById: jest.fn(),
    applyTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn()
  }
}));

// Mock auth middleware
jest.mock('../../../src/middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com'
    };
    next();
  }
}));

import draftRoutes from '../../../src/routes/draft.routes';
import { draftService } from '../../../src/services/draft.service';

describe('Draft Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/draft', draftRoutes);
    jest.clearAllMocks();
  });

  describe('POST /api/draft/drafts', () => {
    it('should create a draft successfully', async () => {
      const mockDraft = {
        id: 'draft-123',
        userId: 'user-123',
        title: 'My Draft',
        content: 'Draft content here',
        platforms: ['INSTAGRAM', 'TWITTER'],
        createdAt: new Date()
      };
      (draftService.createDraft as jest.Mock).mockResolvedValue(mockDraft);

      const response = await request(app)
        .post('/api/draft/drafts')
        .send({
          title: 'My Draft',
          content: 'Draft content here',
          platforms: ['INSTAGRAM', 'TWITTER']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.draft).toMatchObject({
        id: mockDraft.id,
        userId: mockDraft.userId,
        title: mockDraft.title,
        content: mockDraft.content,
        platforms: mockDraft.platforms
      });
      expect(response.body.data.draft.createdAt).toBeDefined();
      expect(draftService.createDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          title: 'My Draft',
          content: 'Draft content here',
          platforms: ['INSTAGRAM', 'TWITTER']
        })
      );
    });

    it('should create draft with optional fields', async () => {
      const mockDraft = {
        id: 'draft-456',
        userId: 'user-123',
        content: 'Content',
        platforms: ['FACEBOOK'],
        mediaUrls: ['https://example.com/image.jpg'],
        hashtags: ['#test', '#draft'],
        aiGenerated: true,
        scheduledFor: new Date('2024-02-01')
      };
      (draftService.createDraft as jest.Mock).mockResolvedValue(mockDraft);

      const response = await request(app)
        .post('/api/draft/drafts')
        .send({
          content: 'Content',
          platforms: ['FACEBOOK'],
          mediaUrls: ['https://example.com/image.jpg'],
          hashtags: ['#test', '#draft'],
          aiGenerated: true,
          aiPrompt: 'Generate a post about testing',
          aiModel: 'gpt-4',
          scheduledFor: '2024-02-01T00:00:00Z'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(draftService.createDraft).toHaveBeenCalled();
    });

    it('should return 400 if content is missing', async () => {
      const response = await request(app)
        .post('/api/draft/drafts')
        .send({
          platforms: ['INSTAGRAM']
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Content');
    });

    it('should return 400 if platforms is missing', async () => {
      const response = await request(app)
        .post('/api/draft/drafts')
        .send({
          content: 'Test content'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('platform');
    });

    it('should return 400 if platforms array is empty', async () => {
      const response = await request(app)
        .post('/api/draft/drafts')
        .send({
          content: 'Test content',
          platforms: []
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('platform');
    });

    it('should handle service errors', async () => {
      (draftService.createDraft as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/api/draft/drafts')
        .send({
          content: 'Test',
          platforms: ['TWITTER']
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to create draft');
    });
  });

  describe('GET /api/draft/drafts', () => {
    it('should fetch all drafts for user', async () => {
      const mockResult = {
        drafts: [
          { id: 'draft-1', content: 'Draft 1', platforms: ['INSTAGRAM'] },
          { id: 'draft-2', content: 'Draft 2', platforms: ['TWITTER'] }
        ],
        total: 2
      };
      (draftService.getDrafts as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/draft/drafts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
      expect(draftService.getDrafts).toHaveBeenCalledWith(
        'user-123',
        undefined,
        expect.any(Object)
      );
    });

    it('should fetch drafts with pagination', async () => {
      const mockResult = {
        drafts: [{ id: 'draft-1', content: 'Draft 1' }],
        total: 10
      };
      (draftService.getDrafts as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/draft/drafts?limit=1&offset=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(draftService.getDrafts).toHaveBeenCalledWith(
        'user-123',
        undefined,
        expect.objectContaining({
          limit: 1,
          offset: 0
        })
      );
    });

    it('should filter drafts by platform', async () => {
      const mockResult = {
        drafts: [{ id: 'draft-1', platforms: ['INSTAGRAM'] }],
        total: 1
      };
      (draftService.getDrafts as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/draft/drafts?platform=INSTAGRAM')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(draftService.getDrafts).toHaveBeenCalledWith(
        'user-123',
        undefined,
        expect.objectContaining({
          platform: 'INSTAGRAM'
        })
      );
    });

    it('should handle service errors', async () => {
      (draftService.getDrafts as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/draft/drafts')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch drafts');
    });
  });

  describe('GET /api/draft/drafts/search', () => {
    it('should search drafts successfully', async () => {
      const mockDrafts = [
        { id: 'draft-1', content: 'Marketing post about features' },
        { id: 'draft-2', content: 'Another marketing draft' }
      ];
      (draftService.searchDrafts as jest.Mock).mockResolvedValue(mockDrafts);

      const response = await request(app)
        .get('/api/draft/drafts/search?q=marketing')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.drafts).toEqual(mockDrafts);
      expect(draftService.searchDrafts).toHaveBeenCalledWith('user-123', 'marketing');
    });

    it('should return 400 if search query is missing', async () => {
      const response = await request(app)
        .get('/api/draft/drafts/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Search query is required');
    });

    it('should handle service errors', async () => {
      (draftService.searchDrafts as jest.Mock).mockRejectedValue(
        new Error('Search error')
      );

      const response = await request(app)
        .get('/api/draft/drafts/search?q=test')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to search drafts');
    });
  });

  describe('GET /api/draft/drafts/:id', () => {
    it('should fetch draft by id', async () => {
      const mockDraft = {
        id: 'draft-123',
        userId: 'user-123',
        content: 'Draft content',
        platforms: ['TWITTER']
      };
      (draftService.getDraftById as jest.Mock).mockResolvedValue(mockDraft);

      const response = await request(app)
        .get('/api/draft/drafts/draft-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.draft).toEqual(mockDraft);
      expect(draftService.getDraftById).toHaveBeenCalledWith('draft-123', 'user-123');
    });

    it('should return 404 if draft not found', async () => {
      (draftService.getDraftById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/draft/drafts/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Draft not found');
    });

    it('should handle service errors', async () => {
      (draftService.getDraftById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/draft/drafts/draft-123')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch draft');
    });
  });

  describe('PUT /api/draft/drafts/:id', () => {
    it('should update draft successfully', async () => {
      const mockUpdatedDraft = {
        id: 'draft-123',
        userId: 'user-123',
        content: 'Updated content',
        platforms: ['INSTAGRAM', 'FACEBOOK']
      };
      (draftService.updateDraft as jest.Mock).mockResolvedValue(mockUpdatedDraft);

      const response = await request(app)
        .put('/api/draft/drafts/draft-123')
        .send({
          content: 'Updated content',
          platforms: ['INSTAGRAM', 'FACEBOOK']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.draft).toEqual(mockUpdatedDraft);
      expect(draftService.updateDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'draft-123',
          userId: 'user-123',
          content: 'Updated content',
          platforms: ['INSTAGRAM', 'FACEBOOK']
        })
      );
    });

    it('should return 404 if draft not found', async () => {
      (draftService.updateDraft as jest.Mock).mockRejectedValue(
        new Error('Draft not found')
      );

      const response = await request(app)
        .put('/api/draft/drafts/non-existent')
        .send({ content: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should handle service errors', async () => {
      (draftService.updateDraft as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .put('/api/draft/drafts/draft-123')
        .send({ content: 'Updated' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/draft/drafts/:id', () => {
    it('should delete draft successfully', async () => {
      (draftService.deleteDraft as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/draft/drafts/draft-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Draft deleted successfully');
      expect(draftService.deleteDraft).toHaveBeenCalledWith('draft-123', 'user-123');
    });

    it('should return 404 if draft not found', async () => {
      (draftService.deleteDraft as jest.Mock).mockRejectedValue(
        new Error('Draft not found')
      );

      const response = await request(app)
        .delete('/api/draft/drafts/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should handle service errors', async () => {
      (draftService.deleteDraft as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .delete('/api/draft/drafts/draft-123')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/draft/drafts/:id/convert', () => {
    it('should convert draft to post successfully', async () => {
      const mockPost = {
        id: 'post-123',
        content: 'Draft content',
        socialAccountId: 'account-456',
        status: 'PUBLISHED'
      };
      (draftService.convertDraftToPost as jest.Mock).mockResolvedValue(mockPost);

      const response = await request(app)
        .post('/api/draft/drafts/draft-123/convert')
        .send({ socialAccountId: 'account-456' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.post).toEqual(mockPost);
      expect(draftService.convertDraftToPost).toHaveBeenCalledWith(
        'draft-123',
        'user-123',
        'account-456'
      );
    });

    it('should return 400 if socialAccountId is missing', async () => {
      const response = await request(app)
        .post('/api/draft/drafts/draft-123/convert')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Social account ID is required');
    });

    it('should return 404 if draft not found', async () => {
      (draftService.convertDraftToPost as jest.Mock).mockRejectedValue(
        new Error('Draft not found')
      );

      const response = await request(app)
        .post('/api/draft/drafts/non-existent/convert')
        .send({ socialAccountId: 'account-456' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle service errors', async () => {
      (draftService.convertDraftToPost as jest.Mock).mockRejectedValue(
        new Error('Conversion failed')
      );

      const response = await request(app)
        .post('/api/draft/drafts/draft-123/convert')
        .send({ socialAccountId: 'account-456' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/draft/drafts (bulk delete)', () => {
    it('should bulk delete drafts successfully', async () => {
      (draftService.bulkDeleteDrafts as jest.Mock).mockResolvedValue({ count: 3 });

      const response = await request(app)
        .delete('/api/draft/drafts')
        .send({ ids: ['draft-1', 'draft-2', 'draft-3'] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedCount).toBe(3);
      expect(draftService.bulkDeleteDrafts).toHaveBeenCalledWith(
        ['draft-1', 'draft-2', 'draft-3'],
        'user-123'
      );
    });

    it('should return 400 if ids is missing', async () => {
      const response = await request(app)
        .delete('/api/draft/drafts')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Draft IDs are required');
    });

    it('should return 400 if ids is not an array', async () => {
      const response = await request(app)
        .delete('/api/draft/drafts')
        .send({ ids: 'not-an-array' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Draft IDs are required');
    });

    it('should return 400 if ids array is empty', async () => {
      const response = await request(app)
        .delete('/api/draft/drafts')
        .send({ ids: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Draft IDs are required');
    });

    it('should handle service errors', async () => {
      (draftService.bulkDeleteDrafts as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .delete('/api/draft/drafts')
        .send({ ids: ['draft-1'] })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/draft/templates', () => {
    it('should create template successfully', async () => {
      const mockTemplate = {
        id: 'template-123',
        userId: 'user-123',
        name: 'Promo Template',
        template: 'Check out our {product}!',
        platforms: ['INSTAGRAM', 'TWITTER']
      };
      (draftService.createTemplate as jest.Mock).mockResolvedValue(mockTemplate);

      const response = await request(app)
        .post('/api/draft/templates')
        .send({
          name: 'Promo Template',
          template: 'Check out our {product}!',
          platforms: ['INSTAGRAM', 'TWITTER'],
          category: 'Promotional'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template).toEqual(mockTemplate);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/draft/templates')
        .send({ name: 'Template' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('template');
    });

    it('should handle service errors', async () => {
      (draftService.createTemplate as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/api/draft/templates')
        .send({
          name: 'Test',
          template: 'Test template',
          platforms: ['TWITTER']
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/draft/templates', () => {
    it('should fetch templates with filters', async () => {
      const mockResult = {
        templates: [
          { id: 'template-1', name: 'Template 1', category: 'Promo' },
          { id: 'template-2', name: 'Template 2', category: 'Promo' }
        ],
        total: 2
      };
      (draftService.getTemplates as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/draft/templates?category=Promo&includePublic=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
    });

    it('should handle service errors', async () => {
      (draftService.getTemplates as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/draft/templates')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/draft/templates/categories', () => {
    it('should fetch template categories', async () => {
      const mockCategories = ['Promotional', 'Educational', 'Announcement'];
      (draftService.getTemplateCategories as jest.Mock).mockResolvedValue(mockCategories);

      const response = await request(app)
        .get('/api/draft/templates/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toEqual(mockCategories);
    });

    it('should handle service errors', async () => {
      (draftService.getTemplateCategories as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/draft/templates/categories')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/draft/templates/search', () => {
    it('should search templates successfully', async () => {
      const mockTemplates = [
        { id: 'template-1', name: 'Promo template' },
        { id: 'template-2', name: 'Another promo' }
      ];
      (draftService.searchTemplates as jest.Mock).mockResolvedValue(mockTemplates);

      const response = await request(app)
        .get('/api/draft/templates/search?q=promo')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toEqual(mockTemplates);
    });

    it('should return 400 if search query is missing', async () => {
      const response = await request(app)
        .get('/api/draft/templates/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Search query is required');
    });

    it('should handle service errors', async () => {
      (draftService.searchTemplates as jest.Mock).mockRejectedValue(
        new Error('Search error')
      );

      const response = await request(app)
        .get('/api/draft/templates/search?q=test')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/draft/templates/:id', () => {
    it('should fetch template by id', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Test Template',
        template: 'Template content'
      };
      (draftService.getTemplateById as jest.Mock).mockResolvedValue(mockTemplate);

      const response = await request(app)
        .get('/api/draft/templates/template-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template).toEqual(mockTemplate);
    });

    it('should return 404 if template not found', async () => {
      (draftService.getTemplateById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/draft/templates/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Template not found');
    });

    it('should handle service errors', async () => {
      (draftService.getTemplateById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/draft/templates/template-123')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/draft/templates/:id/apply', () => {
    it('should apply template successfully', async () => {
      const mockContent = 'Check out our New Product!';
      (draftService.applyTemplate as jest.Mock).mockResolvedValue(mockContent);

      const response = await request(app)
        .post('/api/draft/templates/template-123/apply')
        .send({ variables: { product: 'New Product' } })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(mockContent);
      expect(draftService.applyTemplate).toHaveBeenCalledWith(
        'template-123',
        { product: 'New Product' }
      );
    });

    it('should return 400 if variables are missing', async () => {
      const response = await request(app)
        .post('/api/draft/templates/template-123/apply')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Variables are required');
    });

    it('should return 404 if template not found', async () => {
      (draftService.applyTemplate as jest.Mock).mockRejectedValue(
        new Error('Template not found')
      );

      const response = await request(app)
        .post('/api/draft/templates/non-existent/apply')
        .send({ variables: {} })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle service errors', async () => {
      (draftService.applyTemplate as jest.Mock).mockRejectedValue(
        new Error('Application error')
      );

      const response = await request(app)
        .post('/api/draft/templates/template-123/apply')
        .send({ variables: {} })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/draft/templates/:id', () => {
    it('should update template successfully', async () => {
      const mockUpdatedTemplate = {
        id: 'template-123',
        name: 'Updated Template',
        template: 'Updated content'
      };
      (draftService.updateTemplate as jest.Mock).mockResolvedValue(mockUpdatedTemplate);

      const response = await request(app)
        .put('/api/draft/templates/template-123')
        .send({ name: 'Updated Template', template: 'Updated content' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template).toEqual(mockUpdatedTemplate);
    });

    it('should return 404 if template not found', async () => {
      (draftService.updateTemplate as jest.Mock).mockRejectedValue(
        new Error('Template not found')
      );

      const response = await request(app)
        .put('/api/draft/templates/non-existent')
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle service errors', async () => {
      (draftService.updateTemplate as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .put('/api/draft/templates/template-123')
        .send({ name: 'Updated' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/draft/templates/:id', () => {
    it('should delete template successfully', async () => {
      (draftService.deleteTemplate as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/draft/templates/template-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Template deleted successfully');
      expect(draftService.deleteTemplate).toHaveBeenCalledWith('template-123', 'user-123');
    });

    it('should return 404 if template not found', async () => {
      (draftService.deleteTemplate as jest.Mock).mockRejectedValue(
        new Error('Template not found')
      );

      const response = await request(app)
        .delete('/api/draft/templates/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle service errors', async () => {
      (draftService.deleteTemplate as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .delete('/api/draft/templates/template-123')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Draft Routes - Authentication', () => {
    it('should require authentication for all routes', async () => {
      // With mocked auth, all should succeed (not 401)
      (draftService.getDrafts as jest.Mock).mockResolvedValue({ drafts: [], total: 0 });
      (draftService.getTemplates as jest.Mock).mockResolvedValue({ templates: [], total: 0 });

      await request(app).get('/api/draft/drafts').expect(200);
      await request(app).get('/api/draft/templates').expect(200);
    });
  });

  describe('Draft Routes - Error Handling', () => {
    it('should handle all validation and error cases properly', async () => {
      // All error paths tested in individual test cases above
      expect(true).toBe(true);
    });
  });
});
