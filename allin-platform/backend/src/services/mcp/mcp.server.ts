import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  CreateMessageRequestSchema,
  ListRootsRequestSchema,
  Tool,
  Resource,
  Prompt,
  TextContent,
  ImageContent,
  // EmbeddedContent,  // Not available in current SDK version
} from '@modelcontextprotocol/sdk/types.js';
// import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AIAgentOrchestrator } from './agents/orchestrator';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export class AllINMCPServer {
  private server: Server;
  private orchestrator: AIAgentOrchestrator;

  constructor() {
    this.server = new Server(
      {
        name: 'allin-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: { subscribe: false },
          tools: {},
          prompts: {},
        },
      }
    );

    this.orchestrator = new AIAgentOrchestrator();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getAvailableTools(),
    }));

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: await this.getAvailableResources(),
    }));

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      return await this.readResource(uri);
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: this.getAvailablePrompts(),
    }));

    // Get specific prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this.getPrompt(name, args);
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this.executeTool(name, args);
    });

    // List roots for file navigation
    this.server.setRequestHandler(ListRootsRequestSchema, async () => ({
      roots: [
        {
          uri: 'allin://dashboard',
          name: 'AllIN Dashboard',
        },
        {
          uri: 'allin://accounts',
          name: 'Social Accounts',
        },
        {
          uri: 'allin://content',
          name: 'Content Library',
        },
        {
          uri: 'allin://analytics',
          name: 'Analytics Data',
        },
      ],
    }));
  }

  private getAvailableTools(): Tool[] {
    return [
      {
        name: 'create_post',
        description: 'Create a new social media post with AI-generated content',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Description of the post to create',
            },
            platforms: {
              type: 'array',
              items: { type: 'string' },
              description: 'Target platforms (facebook, twitter, instagram, linkedin)',
            },
            tone: {
              type: 'string',
              enum: ['professional', 'casual', 'friendly', 'informative', 'promotional'],
              description: 'Tone of the content',
            },
            schedule: {
              type: 'string',
              description: 'ISO datetime to schedule the post (optional)',
            },
          },
          required: ['prompt', 'platforms'],
        },
      },
      {
        name: 'analyze_performance',
        description: 'Analyze social media performance and get insights',
        inputSchema: {
          type: 'object',
          properties: {
            timeframe: {
              type: 'string',
              enum: ['today', 'week', 'month', 'quarter', 'year'],
              description: 'Time period to analyze',
            },
            metrics: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['engagement', 'reach', 'clicks', 'conversions', 'sentiment'],
              },
              description: 'Metrics to analyze',
            },
            platforms: {
              type: 'array',
              items: { type: 'string' },
              description: 'Platforms to analyze (optional, all if not specified)',
            },
          },
          required: ['timeframe'],
        },
      },
      {
        name: 'manage_campaign',
        description: 'Create or manage marketing campaigns',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['create', 'update', 'pause', 'resume', 'analyze'],
              description: 'Campaign action',
            },
            name: {
              type: 'string',
              description: 'Campaign name',
            },
            description: {
              type: 'string',
              description: 'Campaign description',
            },
            startDate: {
              type: 'string',
              description: 'Campaign start date',
            },
            endDate: {
              type: 'string',
              description: 'Campaign end date',
            },
            budget: {
              type: 'number',
              description: 'Campaign budget (optional)',
            },
          },
          required: ['action', 'name'],
        },
      },
      {
        name: 'generate_content_ideas',
        description: 'Generate content ideas based on trends and analytics',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'Topic or theme for content ideas',
            },
            count: {
              type: 'number',
              description: 'Number of ideas to generate',
              default: 5,
            },
            platforms: {
              type: 'array',
              items: { type: 'string' },
              description: 'Target platforms',
            },
            audience: {
              type: 'string',
              description: 'Target audience description',
            },
          },
          required: ['topic'],
        },
      },
      {
        name: 'optimize_posting_time',
        description: 'Find optimal posting times based on audience activity',
        inputSchema: {
          type: 'object',
          properties: {
            platform: {
              type: 'string',
              description: 'Platform to optimize for',
            },
            timezone: {
              type: 'string',
              description: 'Target timezone',
              default: 'UTC',
            },
            contentType: {
              type: 'string',
              enum: ['text', 'image', 'video', 'link'],
              description: 'Type of content',
            },
          },
          required: ['platform'],
        },
      },
      {
        name: 'schedule_bulk_posts',
        description: 'Schedule multiple posts at once',
        inputSchema: {
          type: 'object',
          properties: {
            posts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                  platforms: { type: 'array', items: { type: 'string' } },
                  scheduledTime: { type: 'string' },
                },
              },
              description: 'Array of posts to schedule',
            },
            spacing: {
              type: 'string',
              enum: ['hourly', 'daily', 'optimal'],
              description: 'How to space out the posts',
            },
          },
          required: ['posts'],
        },
      },
    ];
  }

  private async getAvailableResources(): Promise<Resource[]> {
    const resources: Resource[] = [
      {
        uri: 'allin://analytics/overview',
        mimeType: 'application/json',
        name: 'Analytics Overview',
        description: 'Current analytics and performance metrics',
      },
      {
        uri: 'allin://content/drafts',
        mimeType: 'application/json',
        name: 'Content Drafts',
        description: 'Unpublished content drafts',
      },
      {
        uri: 'allin://content/templates',
        mimeType: 'application/json',
        name: 'Content Templates',
        description: 'Reusable content templates',
      },
      {
        uri: 'allin://accounts/connected',
        mimeType: 'application/json',
        name: 'Connected Accounts',
        description: 'List of connected social media accounts',
      },
      {
        uri: 'allin://campaigns/active',
        mimeType: 'application/json',
        name: 'Active Campaigns',
        description: 'Currently running marketing campaigns',
      },
    ];

    return resources;
  }

  private async readResource(uri: string): Promise<{ contents: Array<TextContent | ImageContent> }> {
    const contents: TextContent[] = [];

    try {
      switch (uri) {
        case 'allin://analytics/overview': {
          const analytics = await this.orchestrator.getAnalyticsOverview();
          contents.push({
            type: 'text',
            text: JSON.stringify(analytics, null, 2),
          });
          break;
        }
        case 'allin://content/drafts': {
          const drafts = await prisma.draft.findMany({
            take: 10,
            orderBy: { updatedAt: 'desc' },
          });
          contents.push({
            type: 'text',
            text: JSON.stringify(drafts, null, 2),
          });
          break;
        }
        case 'allin://content/templates': {
          const templates = await prisma.contentTemplate.findMany({
            take: 10,
            orderBy: { usageCount: 'desc' },
          });
          contents.push({
            type: 'text',
            text: JSON.stringify(templates, null, 2),
          });
          break;
        }
        case 'allin://accounts/connected': {
          const accounts = await prisma.socialAccount.findMany();
          contents.push({
            type: 'text',
            text: JSON.stringify(accounts, null, 2),
          });
          break;
        }
        case 'allin://campaigns/active': {
          // Get active campaigns (placeholder for now)
          const campaigns = await this.orchestrator.getActiveCampaigns();
          contents.push({
            type: 'text',
            text: JSON.stringify(campaigns, null, 2),
          });
          break;
        }
        default:
          contents.push({
            type: 'text',
            text: `Resource not found: ${uri}`,
          });
      }
    } catch (error) {
      logger.error('Error reading resource:', error);
      contents.push({
        type: 'text',
        text: `Error reading resource: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    return { contents };
  }

  private getAvailablePrompts(): Prompt[] {
    return [
      {
        name: 'social_media_expert',
        description: 'Act as a social media marketing expert',
        arguments: [
          {
            name: 'task',
            description: 'The specific task to help with',
            required: true,
          },
        ],
      },
      {
        name: 'content_creator',
        description: 'Act as a creative content creator',
        arguments: [
          {
            name: 'platform',
            description: 'The platform to create content for',
            required: true,
          },
          {
            name: 'style',
            description: 'The style of content to create',
            required: false,
          },
        ],
      },
      {
        name: 'analytics_advisor',
        description: 'Act as a data-driven analytics advisor',
        arguments: [
          {
            name: 'metrics',
            description: 'The metrics to analyze',
            required: true,
          },
        ],
      },
    ];
  }

  private async getPrompt(name: string, args?: Record<string, string>): Promise<{ messages: any[] }> {
    const prompts: Record<string, (args: Record<string, string>) => any[]> = {
      social_media_expert: (args) => [
        {
          role: 'system',
          content: {
            type: 'text',
            text: `You are an expert social media marketing strategist with deep knowledge of all major platforms. Your task is to ${args.task || 'provide strategic advice'}.`,
          },
        },
      ],
      content_creator: (args) => [
        {
          role: 'system',
          content: {
            type: 'text',
            text: `You are a creative content creator specializing in ${args.platform || 'social media'}. Create engaging content in a ${args.style || 'professional'} style.`,
          },
        },
      ],
      analytics_advisor: (args) => [
        {
          role: 'system',
          content: {
            type: 'text',
            text: `You are a data-driven analytics advisor. Analyze the following metrics: ${args.metrics || 'all available metrics'}. Provide actionable insights and recommendations.`,
          },
        },
      ],
    };

    const promptFunction = prompts[name];
    if (!promptFunction) {
      throw new Error(`Prompt '${name}' not found`);
    }

    return {
      messages: promptFunction(args || {}),
    };
  }

  private async executeTool(name: string, args: any): Promise<{ content: Array<TextContent | ImageContent> }> {
    try {
      const result = await this.orchestrator.executeTool(name, args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error(`Error executing tool ${name}:`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('MCP Server started successfully');
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new AllINMCPServer();
  server.start().catch((error) => {
    logger.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}