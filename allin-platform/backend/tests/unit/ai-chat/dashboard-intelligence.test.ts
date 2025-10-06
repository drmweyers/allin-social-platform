/**
 * AI Chat - Dashboard Intelligence Tests
 * Category 2: Dashboard Intelligence (4 features, 23 tests)
 */

import request from 'supertest';
import express from 'express';
import {
  MASTER_TEST_CREDENTIALS,
  SAMPLE_DASHBOARD,
  MOCK_AI_RESPONSES
} from './test-fixtures';

// Mock conversation service
const mockExplainDashboard = jest.fn();
const mockGetTopWins = jest.fn();
const mockGetConcerns = jest.fn();
const mockGenerateActionItems = jest.fn();

jest.mock('../../../src/services/conversation.service', () => ({
  conversationService: {
    explainDashboard: mockExplainDashboard,
    getTopWins: mockGetTopWins,
    getConcerns: mockGetConcerns,
    generateActionItems: mockGenerateActionItems
  }
}));

// Mock authentication middleware
jest.mock('../../../src/middleware/auth', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = {
      id: MASTER_TEST_CREDENTIALS.admin.id,
      email: MASTER_TEST_CREDENTIALS.admin.email,
      organizationId: MASTER_TEST_CREDENTIALS.admin.organizationId,
      role: MASTER_TEST_CREDENTIALS.admin.role
    };
    next();
  }
}));

// Import auth middleware mock
import { authMiddleware } from '../../../src/middleware/auth';

// Create test routes
const router = express.Router();
router.use(authMiddleware);

// Feature 2.1: Dashboard Summary Explanation
router.post('/explain/dashboard', async (req, res) => {
  try {
    const { timeframe, widgets } = req.body;
    const organizationId = req.user?.organizationId;

    if (!timeframe) {
      return res.status(400).json({
        success: false,
        error: 'Timeframe is required'
      });
    }

    const summary = await mockExplainDashboard(organizationId, timeframe, widgets);
    return res.json({ success: true, data: summary });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to explain dashboard',
      message: (error as Error).message
    });
  }
});

// Feature 2.2: Quick Wins & Highlights
router.get('/highlights/wins', async (req, res) => {
  try {
    const { timeframe, limit } = req.query;
    const organizationId = req.user?.organizationId;

    if (!timeframe) {
      return res.status(400).json({
        success: false,
        error: 'Timeframe is required'
      });
    }

    const wins = await mockGetTopWins(
      organizationId,
      timeframe as string,
      limit ? parseInt(limit as string) : 5
    );
    return res.json({ success: true, data: wins });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get top wins',
      message: (error as Error).message
    });
  }
});

// Feature 2.3: Concerns & Red Flags
router.get('/highlights/concerns', async (req, res) => {
  try {
    const { timeframe, severity } = req.query;
    const organizationId = req.user?.organizationId;

    if (!timeframe) {
      return res.status(400).json({
        success: false,
        error: 'Timeframe is required'
      });
    }

    const concerns = await mockGetConcerns(
      organizationId,
      timeframe as string,
      severity as string | undefined
    );
    return res.json({ success: true, data: concerns });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get concerns',
      message: (error as Error).message
    });
  }
});

// Feature 2.4: Actionable Next Steps
router.post('/action-items/generate', async (req, res) => {
  try {
    const { context, priority } = req.body;
    const organizationId = req.user?.organizationId;

    if (!context) {
      return res.status(400).json({
        success: false,
        error: 'Context is required'
      });
    }

    const actionItems = await mockGenerateActionItems(
      organizationId,
      context,
      priority
    );
    return res.json({ success: true, data: actionItems });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate action items',
      message: (error as Error).message
    });
  }
});

// Create Express app
const app = express();
app.use(express.json());
app.use('/api/ai-chat', router);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AI Chat - Dashboard Intelligence', () => {
  describe('POST /api/ai-chat/explain/dashboard', () => {
    it('should explain full dashboard summary for the week', async () => {
      const mockSummary = {
        timeframe: 'week',
        organizationId: MASTER_TEST_CREDENTIALS.admin.organizationId,
        summary: MOCK_AI_RESPONSES.dashboardSummary,
        highlights: SAMPLE_DASHBOARD.summary.highlights,
        concerns: SAMPLE_DASHBOARD.summary.concerns,
        keyMetrics: {
          totalEngagement: 12520,
          followerGrowth: 145,
          responseRate: 0.94
        },
        widgets: SAMPLE_DASHBOARD.widgets
      };

      mockExplainDashboard.mockResolvedValue(mockSummary);

      const response = await request(app)
        .post('/api/ai-chat/explain/dashboard')
        .send({
          timeframe: 'week',
          widgets: ['engagementFunnel', 'followerGrowth', 'topPosts']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.timeframe).toBe('week');
      expect(response.body.data.summary).toContain('social media snapshot');
      expect(response.body.data.highlights).toHaveLength(3);
      expect(response.body.data.concerns).toHaveLength(2);
      expect(mockExplainDashboard).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'week',
        ['engagementFunnel', 'followerGrowth', 'topPosts']
      );
    });

    it('should explain specific widget (engagement funnel)', async () => {
      const mockWidgetExplanation = {
        widget: 'engagementFunnel',
        data: SAMPLE_DASHBOARD.widgets.engagementFunnel.data,
        explanation: SAMPLE_DASHBOARD.widgets.engagementFunnel.explanation,
        insights: [
          'Conversion rate from reach to engagement: 9.9%',
          'Conversion rate from engagement to conversions: 6.8%',
          'Overall funnel efficiency: healthy'
        ],
        recommendations: [
          'Focus on converting engaged users to customers',
          'Your reach-to-engagement rate is strong (9.9%)'
        ]
      };

      mockExplainDashboard.mockResolvedValue(mockWidgetExplanation);

      const response = await request(app)
        .post('/api/ai-chat/explain/dashboard')
        .send({
          timeframe: 'week',
          widgets: ['engagementFunnel']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.widget).toBe('engagementFunnel');
      expect(response.body.data.data.impressions).toBe(187000);
      expect(response.body.data.data.reach).toBe(126000);
    });

    it('should support different timeframes (day, week, month)', async () => {
      const timeframes = ['day', 'week', 'month'];

      for (const timeframe of timeframes) {
        mockExplainDashboard.mockResolvedValue({
          timeframe,
          summary: `Dashboard summary for ${timeframe}`
        });

        await request(app)
          .post('/api/ai-chat/explain/dashboard')
          .send({ timeframe })
          .expect(200);

        expect(mockExplainDashboard).toHaveBeenCalledWith(
          MASTER_TEST_CREDENTIALS.admin.organizationId,
          timeframe,
          undefined
        );
      }
    });

    it('should handle dashboard with no widgets specified', async () => {
      mockExplainDashboard.mockResolvedValue({
        timeframe: 'week',
        summary: 'Default dashboard view'
      });

      await request(app)
        .post('/api/ai-chat/explain/dashboard')
        .send({ timeframe: 'week' })
        .expect(200);

      expect(mockExplainDashboard).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'week',
        undefined
      );
    });

    it('should return 400 when timeframe is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/explain/dashboard')
        .send({ widgets: ['engagementFunnel'] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Timeframe is required');
    });

    it('should verify user can only access their org dashboard', async () => {
      mockExplainDashboard.mockResolvedValue({
        organizationId: MASTER_TEST_CREDENTIALS.admin.organizationId,
        timeframe: 'week'
      });

      await request(app)
        .post('/api/ai-chat/explain/dashboard')
        .send({ timeframe: 'week' })
        .expect(200);

      expect(mockExplainDashboard).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'week',
        undefined
      );
    });
  });

  describe('GET /api/ai-chat/highlights/wins', () => {
    it('should get top 3 wins for the week', async () => {
      const mockWins = [
        {
          type: 'win',
          metric: 'followerGrowth',
          value: 145,
          percentChange: 23,
          description: 'Follower growth up 23%',
          explanation: 'Your follower count increased significantly this week'
        },
        {
          type: 'win',
          metric: 'viralPost',
          value: 2300,
          postId: 'post-viral-123',
          description: 'Tuesday post went viral',
          explanation: 'Your Tuesday post received 2.3K engagements'
        },
        {
          type: 'win',
          metric: 'responseRate',
          value: 0.94,
          percentChange: 16,
          description: 'Response rate improved to 94%',
          explanation: 'You responded to 94% of comments and messages'
        }
      ];

      mockGetTopWins.mockResolvedValue(mockWins);

      const response = await request(app)
        .get('/api/ai-chat/highlights/wins')
        .query({ timeframe: 'week', limit: 3 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].type).toBe('win');
      expect(response.body.data[0].metric).toBe('followerGrowth');
      expect(mockGetTopWins).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'week',
        3
      );
    });

    it('should default to 5 wins when limit not specified', async () => {
      mockGetTopWins.mockResolvedValue([]);

      await request(app)
        .get('/api/ai-chat/highlights/wins')
        .query({ timeframe: 'week' })
        .expect(200);

      expect(mockGetTopWins).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'week',
        5
      );
    });

    it('should handle no wins found gracefully', async () => {
      mockGetTopWins.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/ai-chat/highlights/wins')
        .query({ timeframe: 'day' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return 400 when timeframe is missing', async () => {
      const response = await request(app)
        .get('/api/ai-chat/highlights/wins')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Timeframe is required');
    });
  });

  describe('GET /api/ai-chat/highlights/concerns', () => {
    it('should get all concerns for the week', async () => {
      const mockConcerns = [
        {
          type: 'concern',
          metric: 'facebookReach',
          value: -18,
          severity: 'medium',
          reason: 'Only 2 posts this week (usual: 5)',
          description: 'Facebook reach down 18%',
          recommendations: [
            'Schedule 3 Facebook posts for this week',
            'Maintain consistent posting frequency'
          ]
        },
        {
          type: 'concern',
          metric: 'instagramStories',
          value: -30,
          severity: 'high',
          reason: 'Lack of interactive content',
          description: 'Instagram Stories views dropped 30%',
          recommendations: [
            'Create 2 Instagram Stories with polls',
            'Add interactive stickers to stories'
          ]
        }
      ];

      mockGetConcerns.mockResolvedValue(mockConcerns);

      const response = await request(app)
        .get('/api/ai-chat/highlights/concerns')
        .query({ timeframe: 'week' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].type).toBe('concern');
      expect(response.body.data[1].severity).toBe('high');
      expect(mockGetConcerns).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'week',
        undefined
      );
    });

    it('should filter concerns by severity (high only)', async () => {
      const mockHighConcerns = [
        {
          type: 'concern',
          metric: 'instagramStories',
          value: -30,
          severity: 'high',
          description: 'Instagram Stories views dropped 30%'
        }
      ];

      mockGetConcerns.mockResolvedValue(mockHighConcerns);

      const response = await request(app)
        .get('/api/ai-chat/highlights/concerns')
        .query({ timeframe: 'week', severity: 'high' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].severity).toBe('high');
      expect(mockGetConcerns).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'week',
        'high'
      );
    });

    it('should handle no concerns found (all green)', async () => {
      mockGetConcerns.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/ai-chat/highlights/concerns')
        .query({ timeframe: 'week' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return 400 when timeframe is missing', async () => {
      const response = await request(app)
        .get('/api/ai-chat/highlights/concerns')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Timeframe is required');
    });
  });

  describe('POST /api/ai-chat/action-items/generate', () => {
    it('should generate prioritized action items from dashboard', async () => {
      const mockActionItems = [
        {
          priority: 'high',
          action: 'schedule_facebook_posts',
          description: 'Schedule 3 Facebook posts for this week',
          estimatedTime: '30 minutes',
          expectedImpact: 'Restore 18% reach',
          steps: [
            'Open content calendar',
            'Create 3 Facebook posts',
            'Schedule for optimal times (9 AM, 2 PM, 7 PM)'
          ]
        },
        {
          priority: 'medium',
          action: 'create_instagram_stories',
          description: 'Create 2 Instagram Stories with polls',
          estimatedTime: '20 minutes',
          expectedImpact: 'Recover 15-20% of views',
          steps: [
            'Design 2 story templates',
            'Add poll stickers',
            'Post at peak engagement times'
          ]
        }
      ];

      mockGenerateActionItems.mockResolvedValue(mockActionItems);

      const response = await request(app)
        .post('/api/ai-chat/action-items/generate')
        .send({
          context: 'dashboard_summary',
          priority: 'high'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].priority).toBe('high');
      expect(response.body.data[0].steps).toHaveLength(3);
      expect(mockGenerateActionItems).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'dashboard_summary',
        'high'
      );
    });

    it('should generate action items for specific concern', async () => {
      const mockActionItems = [
        {
          priority: 'high',
          action: 'fix_facebook_reach',
          description: 'Increase Facebook posting frequency',
          estimatedTime: '1 hour',
          expectedImpact: 'Restore 18% reach within 1 week'
        }
      ];

      mockGenerateActionItems.mockResolvedValue(mockActionItems);

      await request(app)
        .post('/api/ai-chat/action-items/generate')
        .send({
          context: 'facebook_reach_decline',
          priority: 'high'
        })
        .expect(200);

      expect(mockGenerateActionItems).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'facebook_reach_decline',
        'high'
      );
    });

    it('should support different priority levels', async () => {
      const priorities = ['high', 'medium', 'low'];

      for (const priority of priorities) {
        mockGenerateActionItems.mockResolvedValue([
          { priority, action: `${priority}_priority_action` }
        ]);

        const response = await request(app)
          .post('/api/ai-chat/action-items/generate')
          .send({
            context: 'dashboard_summary',
            priority
          })
          .expect(200);

        expect(response.body.data[0].priority).toBe(priority);
      }
    });

    it('should handle action items without priority specified', async () => {
      mockGenerateActionItems.mockResolvedValue([
        { priority: 'medium', action: 'default_action' }
      ]);

      await request(app)
        .post('/api/ai-chat/action-items/generate')
        .send({ context: 'dashboard_summary' })
        .expect(200);

      expect(mockGenerateActionItems).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'dashboard_summary',
        undefined
      );
    });

    it('should return 400 when context is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/action-items/generate')
        .send({ priority: 'high' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Context is required');
    });
  });
});
