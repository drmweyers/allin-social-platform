import { PrismaClient } from '@prisma/client';
import { ContentCreatorAgent } from './content-creator';
import { AnalyticsAdvisorAgent } from './analytics-advisor';
import { CampaignManagerAgent } from './campaign-manager';
import { EngagementOptimizerAgent } from './engagement-optimizer';
import { StrategyPlannerAgent } from './strategy-planner';
import { logger } from '../../../utils/logger';

const prisma = new PrismaClient();

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  agent: string;
  timestamp: Date;
}

export class AIAgentOrchestrator {
  private contentCreator: ContentCreatorAgent;
  private analyticsAdvisor: AnalyticsAdvisorAgent;
  private campaignManager: CampaignManagerAgent;
  private engagementOptimizer: EngagementOptimizerAgent;
  private strategyPlanner: StrategyPlannerAgent;

  constructor() {
    this.contentCreator = new ContentCreatorAgent();
    this.analyticsAdvisor = new AnalyticsAdvisorAgent();
    this.campaignManager = new CampaignManagerAgent();
    this.engagementOptimizer = new EngagementOptimizerAgent();
    this.strategyPlanner = new StrategyPlannerAgent();
  }

  async executeTool(toolName: string, args: any): Promise<AgentResponse> {
    logger.info(`Executing tool: ${toolName}`, { args });

    try {
      switch (toolName) {
        case 'create_post':
          return await this.createPost(args);
        case 'analyze_performance':
          return await this.analyzePerformance(args);
        case 'manage_campaign':
          return await this.manageCampaign(args);
        case 'generate_content_ideas':
          return await this.generateContentIdeas(args);
        case 'optimize_posting_time':
          return await this.optimizePostingTime(args);
        case 'schedule_bulk_posts':
          return await this.scheduleBulkPosts(args);
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      logger.error(`Error in orchestrator executing ${toolName}:`, error);
      return {
        success: false,
        error: error.message,
        agent: 'orchestrator',
        timestamp: new Date(),
      };
    }
  }

  private async createPost(args: {
    prompt: string;
    platforms: string[];
    tone?: string;
    schedule?: string;
  }): Promise<AgentResponse> {
    // Use Content Creator Agent to generate post
    const content = await this.contentCreator.generateContent({
      prompt: args.prompt,
      platforms: args.platforms,
      tone: args.tone || 'professional',
    });

    if (!content.success) {
      return content;
    }

    // Use Engagement Optimizer to enhance the content
    const optimized = await this.engagementOptimizer.optimizeContent({
      content: content.data,
      platforms: args.platforms,
    });

    // Schedule the post if requested
    if (args.schedule) {
      const post = await prisma.post.create({
        data: {
          content: optimized.data.content,
          platforms: args.platforms,
          status: 'scheduled',
          scheduledAt: new Date(args.schedule),
          userId: 'system', // This should come from auth context
          metadata: {
            tone: args.tone,
            aiGenerated: true,
            optimizations: optimized.data.optimizations,
          },
        },
      });

      return {
        success: true,
        data: {
          post,
          content: optimized.data,
        },
        agent: 'content-creator',
        timestamp: new Date(),
      };
    }

    // Save as draft if not scheduled
    const draft = await prisma.draft.create({
      data: {
        title: `AI Generated: ${args.prompt.substring(0, 50)}...`,
        content: optimized.data.content,
        platforms: args.platforms,
        userId: 'system',
        metadata: {
          tone: args.tone,
          aiGenerated: true,
          optimizations: optimized.data.optimizations,
        },
      },
    });

    return {
      success: true,
      data: {
        draft,
        content: optimized.data,
      },
      agent: 'content-creator',
      timestamp: new Date(),
    };
  }

  private async analyzePerformance(args: {
    timeframe: string;
    metrics?: string[];
    platforms?: string[];
  }): Promise<AgentResponse> {
    // Get analytics data
    const analytics = await this.analyticsAdvisor.analyzePerformance({
      timeframe: args.timeframe,
      metrics: args.metrics || ['engagement', 'reach', 'clicks'],
      platforms: args.platforms,
    });

    // Get strategic insights
    const insights = await this.strategyPlanner.generateInsights({
      analyticsData: analytics.data,
      timeframe: args.timeframe,
    });

    return {
      success: true,
      data: {
        performance: analytics.data,
        insights: insights.data,
        recommendations: insights.data.recommendations,
      },
      agent: 'analytics-advisor',
      timestamp: new Date(),
    };
  }

  private async manageCampaign(args: {
    action: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
  }): Promise<AgentResponse> {
    const result = await this.campaignManager.manageCampaign(args);

    // If creating a new campaign, get strategy recommendations
    if (args.action === 'create' && result.success) {
      const strategy = await this.strategyPlanner.planCampaignStrategy({
        campaignName: args.name,
        description: args.description,
        budget: args.budget,
        duration: {
          start: args.startDate,
          end: args.endDate,
        },
      });

      result.data.strategy = strategy.data;
    }

    return result;
  }

  private async generateContentIdeas(args: {
    topic: string;
    count?: number;
    platforms?: string[];
    audience?: string;
  }): Promise<AgentResponse> {
    // Get content ideas from Content Creator
    const ideas = await this.contentCreator.generateIdeas({
      topic: args.topic,
      count: args.count || 5,
      platforms: args.platforms || ['facebook', 'twitter', 'instagram'],
      audience: args.audience,
    });

    // Analyze potential performance of each idea
    const analyzedIdeas = await Promise.all(
      ideas.data.ideas.map(async (idea: any) => {
        const performance = await this.engagementOptimizer.predictPerformance({
          content: idea,
          platforms: args.platforms,
        });
        return {
          ...idea,
          predictedPerformance: performance.data,
        };
      })
    );

    return {
      success: true,
      data: {
        ideas: analyzedIdeas,
        topic: args.topic,
        generatedCount: analyzedIdeas.length,
      },
      agent: 'content-creator',
      timestamp: new Date(),
    };
  }

  private async optimizePostingTime(args: {
    platform: string;
    timezone?: string;
    contentType?: string;
  }): Promise<AgentResponse> {
    // Get optimal times from Engagement Optimizer
    const optimalTimes = await this.engagementOptimizer.findOptimalTimes({
      platform: args.platform,
      timezone: args.timezone || 'UTC',
      contentType: args.contentType || 'text',
    });

    // Get historical performance data for validation
    const historicalData = await this.analyticsAdvisor.getHistoricalEngagement({
      platform: args.platform,
      timezone: args.timezone,
    });

    return {
      success: true,
      data: {
        optimalTimes: optimalTimes.data,
        historicalPatterns: historicalData.data,
        recommendations: optimalTimes.data.recommendations,
      },
      agent: 'engagement-optimizer',
      timestamp: new Date(),
    };
  }

  private async scheduleBulkPosts(args: {
    posts: Array<{
      content: string;
      platforms: string[];
      scheduledTime?: string;
    }>;
    spacing?: string;
  }): Promise<AgentResponse> {
    const scheduledPosts = [];

    for (const postData of args.posts) {
      // Optimize each post
      const optimized = await this.engagementOptimizer.optimizeContent({
        content: postData.content,
        platforms: postData.platforms,
      });

      // Determine scheduling time
      let scheduledTime: Date;
      if (postData.scheduledTime) {
        scheduledTime = new Date(postData.scheduledTime);
      } else if (args.spacing === 'optimal') {
        const optimal = await this.engagementOptimizer.findOptimalTimes({
          platform: postData.platforms[0],
        });
        scheduledTime = new Date(optimal.data.times[0]);
      } else {
        scheduledTime = new Date();
      }

      // Create the post
      const post = await prisma.post.create({
        data: {
          content: optimized.data.content,
          platforms: postData.platforms,
          status: 'scheduled',
          scheduledAt: scheduledTime,
          userId: 'system',
          metadata: {
            bulkScheduled: true,
            aiOptimized: true,
          },
        },
      });

      scheduledPosts.push(post);
    }

    return {
      success: true,
      data: {
        scheduledCount: scheduledPosts.length,
        posts: scheduledPosts,
      },
      agent: 'campaign-manager',
      timestamp: new Date(),
    };
  }

  async getAnalyticsOverview(): Promise<any> {
    return this.analyticsAdvisor.getOverview();
  }

  async getActiveCampaigns(): Promise<any> {
    return this.campaignManager.getActiveCampaigns();
  }

  async processNaturalLanguageCommand(command: string): Promise<AgentResponse> {
    // Determine which agent should handle this command
    const intent = await this.strategyPlanner.analyzeIntent(command);

    logger.info(`Processing command with intent: ${intent.data.intent}`, {
      command,
      confidence: intent.data.confidence,
    });

    // Route to appropriate agent based on intent
    switch (intent.data.intent) {
      case 'create_content':
        return await this.contentCreator.processCommand(command);
      case 'analyze_data':
        return await this.analyticsAdvisor.processCommand(command);
      case 'manage_campaign':
        return await this.campaignManager.processCommand(command);
      case 'optimize_engagement':
        return await this.engagementOptimizer.processCommand(command);
      case 'strategic_planning':
        return await this.strategyPlanner.processCommand(command);
      default:
        // Use strategy planner for general queries
        return await this.strategyPlanner.processCommand(command);
    }
  }

  async executeAutomation(trigger: string, context: any): Promise<AgentResponse> {
    logger.info(`Executing automation for trigger: ${trigger}`, { context });

    // Determine which automation to run
    switch (trigger) {
      case 'low_engagement':
        return await this.engagementOptimizer.improveEngagement(context);
      case 'content_needed':
        return await this.contentCreator.generateAutomatedContent(context);
      case 'campaign_optimization':
        return await this.campaignManager.optimizeCampaign(context);
      case 'weekly_report':
        return await this.analyticsAdvisor.generateReport(context);
      case 'strategy_review':
        return await this.strategyPlanner.reviewStrategy(context);
      default:
        return {
          success: false,
          error: `Unknown automation trigger: ${trigger}`,
          agent: 'orchestrator',
          timestamp: new Date(),
        };
    }
  }
}