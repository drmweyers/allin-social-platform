import request from 'supertest';
import express from 'express';

// Create mock functions that will be shared
const mockProcessNaturalLanguageCommand = jest.fn();
const mockGenerateContent = jest.fn();
const mockAnalyzeText = jest.fn();
const mockExecuteAutomation = jest.fn();
const mockGetAgentCapabilities = jest.fn();
const mockExecuteTool = jest.fn();
const mockGetAnalyticsOverview = jest.fn();
const mockGetActiveCampaigns = jest.fn();
const mockOrchestratorExecuteAutomation = jest.fn();

// Mock ClaudeService BEFORE any imports
jest.mock('../../../src/services/claude.service', () => ({
  ClaudeService: jest.fn().mockImplementation(() => ({
    processNaturalLanguageCommand: mockProcessNaturalLanguageCommand,
    generateContent: mockGenerateContent,
    analyzeText: mockAnalyzeText,
    executeAutomation: mockExecuteAutomation,
    getAgentCapabilities: mockGetAgentCapabilities
  }))
}));

// Mock AIAgentOrchestrator BEFORE any imports
jest.mock('../../../src/services/mcp/agents/orchestrator', () => ({
  AIAgentOrchestrator: jest.fn().mockImplementation(() => ({
    executeTool: mockExecuteTool,
    getAnalyticsOverview: mockGetAnalyticsOverview,
    getActiveCampaigns: mockGetActiveCampaigns,
    executeAutomation: mockOrchestratorExecuteAutomation
  }))
}));

// Mock authentication middleware
jest.mock('../../../src/middleware/auth', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123'
    };
    next();
  }
}));

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// NOW import the routes
import { mcpRoutes } from '../../../src/routes/mcp.routes';

const app = express();
app.use(express.json());
app.use('/api/mcp', mcpRoutes);

beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
});

describe('MCP Routes', () => {
  describe('POST /api/mcp/command', () => {
    it('should process natural language command successfully', async () => {
      const mockResult = {
        success: true,
        action: 'post_created',
        data: { postId: 'post-123' }
      };

      mockProcessNaturalLanguageCommand.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/mcp/command')
        .send({
          command: 'Create a post about AI trends',
          context: { platform: 'twitter' }
        })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(mockProcessNaturalLanguageCommand).toHaveBeenCalledWith(
        'Create a post about AI trends',
        { platform: 'twitter' }
      );
    });

    it('should return 400 when command is missing', async () => {
      const response = await request(app)
        .post('/api/mcp/command')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Command is required');
    });

    it('should handle service errors', async () => {
      mockProcessNaturalLanguageCommand.mockRejectedValue(
        new Error('Service unavailable')
      );

      const response = await request(app)
        .post('/api/mcp/command')
        .send({ command: 'test command' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to process command');
      expect(response.body.details).toBe('Service unavailable');
    });
  });

  describe('POST /api/mcp/tool', () => {
    it('should execute MCP tool successfully', async () => {
      const mockResult = {
        success: true,
        toolResult: { status: 'completed' }
      };

      mockExecuteTool.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/mcp/tool')
        .send({
          tool: 'create_post',
          parameters: { prompt: 'Test post', platforms: ['twitter'] }
        })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(mockExecuteTool).toHaveBeenCalledWith(
        'create_post',
        { prompt: 'Test post', platforms: ['twitter'] }
      );
    });

    it('should return 400 when tool name is missing', async () => {
      const response = await request(app)
        .post('/api/mcp/tool')
        .send({ parameters: {} })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Tool name is required');
    });

    it('should handle missing parameters gracefully', async () => {
      const mockResult = { success: true };
      mockExecuteTool.mockResolvedValue(mockResult);

      await request(app)
        .post('/api/mcp/tool')
        .send({ tool: 'analyze_performance' })
        .expect(200);

      expect(mockExecuteTool).toHaveBeenCalledWith(
        'analyze_performance',
        {}
      );
    });
  });

  describe('POST /api/mcp/generate', () => {
    it('should generate content using AI', async () => {
      const mockResult = {
        success: true,
        content: {
          text: 'Generated content about AI',
          platforms: {
            twitter: 'AI is revolutionizing...',
            linkedin: 'In-depth look at AI trends...'
          }
        }
      };

      mockGenerateContent.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/mcp/generate')
        .send({
          prompt: 'Write about AI trends',
          tone: 'professional',
          platforms: ['twitter', 'linkedin'],
          useAI: true
        })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(mockGenerateContent).toHaveBeenCalledWith({
        prompt: 'Write about AI trends',
        tone: 'professional',
        platforms: ['twitter', 'linkedin'],
        useAI: true
      });
    });

    it('should return 400 when prompt is missing', async () => {
      const response = await request(app)
        .post('/api/mcp/generate')
        .send({ tone: 'casual' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Prompt is required');
    });
  });

  describe('POST /api/mcp/analyze', () => {
    it('should analyze text using AI', async () => {
      const mockResult = {
        success: true,
        analysis: {
          sentiment: 'positive',
          score: 0.85,
          keywords: ['AI', 'innovation', 'future']
        }
      };

      mockAnalyzeText.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/mcp/analyze')
        .send({
          text: 'AI is the future of innovation',
          analysisType: 'sentiment'
        })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(mockAnalyzeText).toHaveBeenCalledWith(
        'AI is the future of innovation',
        'sentiment'
      );
    });

    it('should use default analysis type when not provided', async () => {
      const mockResult = { success: true, analysis: {} };
      mockAnalyzeText.mockResolvedValue(mockResult);

      await request(app)
        .post('/api/mcp/analyze')
        .send({ text: 'Test text' })
        .expect(200);

      expect(mockAnalyzeText).toHaveBeenCalledWith(
        'Test text',
        'sentiment'
      );
    });

    it('should return 400 when text is missing', async () => {
      const response = await request(app)
        .post('/api/mcp/analyze')
        .send({ analysisType: 'sentiment' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Text is required');
    });
  });

  describe('POST /api/mcp/automation', () => {
    it('should execute automation workflow', async () => {
      const mockResult = {
        success: true,
        automation: {
          trigger: 'schedule_post',
          status: 'executed',
          postsScheduled: 5
        }
      };

      mockExecuteAutomation.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/mcp/automation')
        .send({
          trigger: 'schedule_post',
          context: { frequency: 'daily', platforms: ['twitter'] }
        })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(mockExecuteAutomation).toHaveBeenCalledWith(
        'schedule_post',
        { frequency: 'daily', platforms: ['twitter'] }
      );
    });

    it('should return 400 when trigger is missing', async () => {
      const response = await request(app)
        .post('/api/mcp/automation')
        .send({ context: {} })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Trigger is required');
    });

    it('should handle missing context with empty object', async () => {
      const mockResult = { success: true };
      mockExecuteAutomation.mockResolvedValue(mockResult);

      await request(app)
        .post('/api/mcp/automation')
        .send({ trigger: 'test_trigger' })
        .expect(200);

      expect(mockExecuteAutomation).toHaveBeenCalledWith(
        'test_trigger',
        {}
      );
    });
  });

  describe('GET /api/mcp/capabilities', () => {
    it('should get agent capabilities', async () => {
      const mockCapabilities = {
        agents: ['content_creator', 'analyst', 'campaign_manager'],
        features: ['natural_language', 'multi_platform', 'automation']
      };

      mockGetAgentCapabilities.mockResolvedValue(mockCapabilities);

      const response = await request(app)
        .get('/api/mcp/capabilities')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.capabilities).toEqual(mockCapabilities);
    });

    it('should handle service errors', async () => {
      mockGetAgentCapabilities.mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .get('/api/mcp/capabilities')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to get capabilities');
    });
  });

  describe('GET /api/mcp/tools', () => {
    it('should list available MCP tools', async () => {
      const response = await request(app)
        .get('/api/mcp/tools')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tools).toBeInstanceOf(Array);
      expect(response.body.tools.length).toBeGreaterThan(0);

      // Verify tool structure
      const tool = response.body.tools[0];
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('parameters');
      expect(tool.parameters).toBeInstanceOf(Array);
    });

    it('should include expected tools', async () => {
      const response = await request(app)
        .get('/api/mcp/tools')
        .expect(200);

      const toolNames = response.body.tools.map((t: any) => t.name);
      expect(toolNames).toContain('create_post');
      expect(toolNames).toContain('analyze_performance');
      expect(toolNames).toContain('manage_campaign');
      expect(toolNames).toContain('generate_content_ideas');
      expect(toolNames).toContain('optimize_posting_time');
      expect(toolNames).toContain('schedule_bulk_posts');
    });
  });

  describe('GET /api/mcp/analytics', () => {
    it('should get analytics overview', async () => {
      const mockOverview = {
        totalPosts: 150,
        totalEngagement: 5000,
        platforms: {
          twitter: { posts: 50, engagement: 2000 },
          linkedin: { posts: 100, engagement: 3000 }
        }
      };

      mockGetAnalyticsOverview.mockResolvedValue(mockOverview);

      const response = await request(app)
        .get('/api/mcp/analytics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockOverview);
    });
  });

  describe('GET /api/mcp/campaigns', () => {
    it('should get active campaigns', async () => {
      const mockCampaigns = [
        {
          id: 'camp-1',
          name: 'Summer Sale',
          status: 'active',
          startDate: '2024-06-01',
          endDate: '2024-08-31'
        },
        {
          id: 'camp-2',
          name: 'Product Launch',
          status: 'active',
          startDate: '2024-07-15',
          endDate: '2024-09-15'
        }
      ];

      mockGetActiveCampaigns.mockResolvedValue(mockCampaigns);

      const response = await request(app)
        .get('/api/mcp/campaigns')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCampaigns);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('POST /api/mcp/webhook', () => {
    it('should process content_needed webhook event', async () => {
      const mockResult = {
        success: true,
        action: 'content_generated',
        posts: 3
      };

      mockOrchestratorExecuteAutomation.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/mcp/webhook')
        .send({
          event: 'content_needed',
          data: { platform: 'twitter', count: 3 },
          signature: 'test-signature'
        })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(mockOrchestratorExecuteAutomation).toHaveBeenCalledWith(
        'content_needed',
        { platform: 'twitter', count: 3 }
      );
    });

    it('should process low_engagement webhook event', async () => {
      const mockResult = {
        success: true,
        action: 'engagement_boost',
        strategy: 'increase_frequency'
      };

      mockOrchestratorExecuteAutomation.mockResolvedValue(mockResult);

      await request(app)
        .post('/api/mcp/webhook')
        .send({
          event: 'low_engagement',
          data: { threshold: 100 }
        })
        .expect(200);

      expect(mockOrchestratorExecuteAutomation).toHaveBeenCalledWith(
        'low_engagement',
        { threshold: 100 }
      );
    });

    it('should process campaign_update webhook event', async () => {
      const mockResult = {
        success: true,
        action: 'campaign_optimized'
      };

      mockOrchestratorExecuteAutomation.mockResolvedValue(mockResult);

      await request(app)
        .post('/api/mcp/webhook')
        .send({
          event: 'campaign_update',
          data: { campaignId: 'camp-123' }
        })
        .expect(200);

      expect(mockOrchestratorExecuteAutomation).toHaveBeenCalledWith(
        'campaign_optimization',
        { campaignId: 'camp-123' }
      );
    });

    it('should handle unknown webhook event', async () => {
      const response = await request(app)
        .post('/api/mcp/webhook')
        .send({
          event: 'unknown_event',
          data: {}
        })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unknown event type');
    });

    it('should handle webhook processing errors', async () => {
      mockOrchestratorExecuteAutomation.mockRejectedValue(
        new Error('Automation failed')
      );

      const response = await request(app)
        .post('/api/mcp/webhook')
        .send({
          event: 'content_needed',
          data: {}
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to process webhook');
      expect(response.body.details).toBe('Automation failed');
    });
  });
});
