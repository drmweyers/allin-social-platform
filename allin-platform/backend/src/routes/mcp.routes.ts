import { Router } from 'express';
import { ClaudeService } from '../services/claude.service';
import { AIAgentOrchestrator } from '../services/mcp/agents/orchestrator';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const claudeService = new ClaudeService();
const orchestrator = new AIAgentOrchestrator();

/**
 * @route POST /api/mcp/command
 * @desc Process natural language command through MCP
 * @access Private
 */
router.post('/command', authMiddleware, async (req, res) => {
  try {
    const { command, context } = req.body;

    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'Command is required',
      });
    }

    logger.info('Processing MCP command:', { command, userId: req.user?.id });

    const result = await claudeService.processNaturalLanguageCommand(command, context);

    res.json(result);
  } catch (error) {
    logger.error('Error processing MCP command:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process command',
      details: error.message,
    });
  }
});

/**
 * @route POST /api/mcp/tool
 * @desc Execute specific MCP tool
 * @access Private
 */
router.post('/tool', authMiddleware, async (req, res) => {
  try {
    const { tool, parameters } = req.body;

    if (!tool) {
      return res.status(400).json({
        success: false,
        error: 'Tool name is required',
      });
    }

    logger.info('Executing MCP tool:', { tool, userId: req.user?.id });

    const result = await orchestrator.executeTool(tool, parameters || {});

    res.json(result);
  } catch (error) {
    logger.error('Error executing MCP tool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute tool',
      details: error.message,
    });
  }
});

/**
 * @route POST /api/mcp/generate
 * @desc Generate content using AI
 * @access Private
 */
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { prompt, tone, platforms, useAI } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required',
      });
    }

    logger.info('Generating AI content:', { prompt, userId: req.user?.id });

    const result = await claudeService.generateContent({
      prompt,
      tone,
      platforms,
      useAI,
    });

    res.json(result);
  } catch (error) {
    logger.error('Error generating content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate content',
      details: error.message,
    });
  }
});

/**
 * @route POST /api/mcp/analyze
 * @desc Analyze text using AI
 * @access Private
 */
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { text, analysisType } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      });
    }

    logger.info('Analyzing text:', { analysisType, userId: req.user?.id });

    const result = await claudeService.analyzeText(
      text,
      analysisType || 'sentiment'
    );

    res.json(result);
  } catch (error) {
    logger.error('Error analyzing text:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze text',
      details: error.message,
    });
  }
});

/**
 * @route POST /api/mcp/automation
 * @desc Execute automation workflow
 * @access Private
 */
router.post('/automation', authMiddleware, async (req, res) => {
  try {
    const { trigger, context } = req.body;

    if (!trigger) {
      return res.status(400).json({
        success: false,
        error: 'Trigger is required',
      });
    }

    logger.info('Executing automation:', { trigger, userId: req.user?.id });

    const result = await claudeService.executeAutomation(trigger, context || {});

    res.json(result);
  } catch (error) {
    logger.error('Error executing automation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute automation',
      details: error.message,
    });
  }
});

/**
 * @route GET /api/mcp/capabilities
 * @desc Get available AI agent capabilities
 * @access Private
 */
router.get('/capabilities', authMiddleware, async (req, res) => {
  try {
    const capabilities = await claudeService.getAgentCapabilities();

    res.json({
      success: true,
      capabilities,
    });
  } catch (error) {
    logger.error('Error getting capabilities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get capabilities',
      details: error.message,
    });
  }
});

/**
 * @route GET /api/mcp/tools
 * @desc List available MCP tools
 * @access Private
 */
router.get('/tools', authMiddleware, async (req, res) => {
  try {
    const tools = [
      {
        name: 'create_post',
        description: 'Create a new social media post with AI-generated content',
        parameters: ['prompt', 'platforms', 'tone', 'schedule'],
      },
      {
        name: 'analyze_performance',
        description: 'Analyze social media performance and get insights',
        parameters: ['timeframe', 'metrics', 'platforms'],
      },
      {
        name: 'manage_campaign',
        description: 'Create or manage marketing campaigns',
        parameters: ['action', 'name', 'description', 'startDate', 'endDate', 'budget'],
      },
      {
        name: 'generate_content_ideas',
        description: 'Generate content ideas based on trends and analytics',
        parameters: ['topic', 'count', 'platforms', 'audience'],
      },
      {
        name: 'optimize_posting_time',
        description: 'Find optimal posting times based on audience activity',
        parameters: ['platform', 'timezone', 'contentType'],
      },
      {
        name: 'schedule_bulk_posts',
        description: 'Schedule multiple posts at once',
        parameters: ['posts', 'spacing'],
      },
    ];

    res.json({
      success: true,
      tools,
    });
  } catch (error) {
    logger.error('Error listing tools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list tools',
      details: error.message,
    });
  }
});

/**
 * @route GET /api/mcp/analytics
 * @desc Get analytics overview via MCP
 * @access Private
 */
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const overview = await orchestrator.getAnalyticsOverview();

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    logger.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
      details: error.message,
    });
  }
});

/**
 * @route GET /api/mcp/campaigns
 * @desc Get active campaigns via MCP
 * @access Private
 */
router.get('/campaigns', authMiddleware, async (req, res) => {
  try {
    const campaigns = await orchestrator.getActiveCampaigns();

    res.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    logger.error('Error getting campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get campaigns',
      details: error.message,
    });
  }
});

/**
 * @route POST /api/mcp/webhook
 * @desc Webhook endpoint for external MCP integrations
 * @access Public (with verification)
 */
router.post('/webhook', async (req, res) => {
  try {
    const { event, data, signature } = req.body;

    // TODO: Verify webhook signature
    logger.info('MCP webhook received:', { event });

    // Process webhook based on event type
    let result;
    switch (event) {
      case 'content_needed':
        result = await orchestrator.executeAutomation('content_needed', data);
        break;
      case 'low_engagement':
        result = await orchestrator.executeAutomation('low_engagement', data);
        break;
      case 'campaign_update':
        result = await orchestrator.executeAutomation('campaign_optimization', data);
        break;
      default:
        logger.warn('Unknown webhook event:', { event });
        result = { success: false, error: 'Unknown event type' };
    }

    res.json(result);
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      details: error.message,
    });
  }
});

export { router as mcpRoutes };