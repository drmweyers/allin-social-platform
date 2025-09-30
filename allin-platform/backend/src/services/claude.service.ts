import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';
import { AIAgentOrchestrator } from './mcp/agents/orchestrator';

export class ClaudeService {
  private anthropic: Anthropic | null;
  private orchestrator: AIAgentOrchestrator;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } else {
      logger.warn('ANTHROPIC_API_KEY not configured - Claude features will be limited');
      this.anthropic = null;
    }

    this.orchestrator = new AIAgentOrchestrator();
  }

  async processNaturalLanguageCommand(command: string, context?: any): Promise<any> {
    try {
      logger.info('Processing natural language command:', { command });

      // First try to process with the orchestrator's natural language processing
      const orchestratorResult = await this.orchestrator.processNaturalLanguageCommand(command);

      if (orchestratorResult.success) {
        return orchestratorResult;
      }

      // If we have Claude API, use it for more complex understanding
      if (this.anthropic) {
        const claudeResponse = await this.analyzeWithClaude(command, context);

        // Execute the interpreted command
        if (claudeResponse.tool && claudeResponse.parameters) {
          return await this.orchestrator.executeTool(claudeResponse.tool, claudeResponse.parameters);
        }

        return claudeResponse;
      }

      // Fallback to basic pattern matching
      return this.processWithPatternMatching(command);
    } catch (error) {
      logger.error('Error processing natural language command:', error);
      return {
        success: false,
        error: error.message,
        suggestion: 'Try rephrasing your command or use more specific keywords',
      };
    }
  }

  private async analyzeWithClaude(command: string, context?: any): Promise<any> {
    if (!this.anthropic) {
      throw new Error('Claude API not configured');
    }

    try {
      const systemPrompt = `You are an AI assistant for the AllIN social media management platform.
      Analyze the user's command and determine:
      1. The intended action (create_post, analyze_performance, manage_campaign, etc.)
      2. The required parameters for that action
      3. Any additional context needed

      Available tools:
      - create_post: Create social media content
      - analyze_performance: Analyze metrics and performance
      - manage_campaign: Create or manage marketing campaigns
      - generate_content_ideas: Generate content suggestions
      - optimize_posting_time: Find best times to post
      - schedule_bulk_posts: Schedule multiple posts

      Respond with a JSON object containing:
      {
        "tool": "tool_name",
        "parameters": { ... },
        "explanation": "What the command will do"
      }`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: command,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          const parsed = JSON.parse(content.text);
          return {
            success: true,
            ...parsed,
          };
        } catch {
          // If not JSON, return the text response
          return {
            success: true,
            response: content.text,
            agent: 'claude',
          };
        }
      }

      return {
        success: false,
        error: 'Unexpected response format from Claude',
      };
    } catch (error) {
      logger.error('Error calling Claude API:', error);
      throw error;
    }
  }

  private async processWithPatternMatching(command: string): Promise<any> {
    const lowerCommand = command.toLowerCase();

    // Pattern matching for common commands
    if (lowerCommand.includes('create') || lowerCommand.includes('post')) {
      return await this.orchestrator.executeTool('create_post', {
        prompt: command,
        platforms: ['facebook', 'twitter', 'instagram'],
        tone: 'professional',
      });
    }

    if (lowerCommand.includes('analyze') || lowerCommand.includes('performance')) {
      return await this.orchestrator.executeTool('analyze_performance', {
        timeframe: 'week',
        metrics: ['engagement', 'reach', 'clicks'],
      });
    }

    if (lowerCommand.includes('campaign')) {
      const action = lowerCommand.includes('create') ? 'create' :
                    lowerCommand.includes('pause') ? 'pause' :
                    lowerCommand.includes('analyze') ? 'analyze' : 'create';

      return await this.orchestrator.executeTool('manage_campaign', {
        action,
        name: 'New Campaign',
        description: 'Campaign from natural language command',
      });
    }

    if (lowerCommand.includes('idea') || lowerCommand.includes('suggest')) {
      return await this.orchestrator.executeTool('generate_content_ideas', {
        topic: 'general content',
        count: 5,
      });
    }

    if (lowerCommand.includes('schedule') || lowerCommand.includes('time')) {
      return await this.orchestrator.executeTool('optimize_posting_time', {
        platform: 'facebook',
      });
    }

    return {
      success: false,
      error: 'Command not recognized',
      suggestion: 'Try using keywords like: create, analyze, campaign, schedule, or ideas',
    };
  }

  async generateContent(params: {
    prompt: string;
    tone?: string;
    platforms?: string[];
    useAI?: boolean;
  }): Promise<any> {
    try {
      if (params.useAI !== false && this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 500,
          messages: [
            {
              role: 'system',
              content: `Create engaging social media content in a ${params.tone || 'professional'} tone for ${params.platforms?.join(', ') || 'all platforms'}.`,
            },
            {
              role: 'user',
              content: params.prompt,
            },
          ],
        });

        const content = response.content[0];
        if (content.type === 'text') {
          return {
            success: true,
            content: content.text,
            source: 'claude-ai',
          };
        }
      }

      // Fallback to orchestrator's content generation
      return await this.orchestrator.executeTool('create_post', {
        prompt: params.prompt,
        platforms: params.platforms || ['facebook', 'twitter'],
        tone: params.tone || 'professional',
      });
    } catch (error) {
      logger.error('Error generating content:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async analyzeText(text: string, analysisType: string): Promise<any> {
    try {
      if (this.anthropic) {
        const prompts = {
          sentiment: 'Analyze the sentiment of this text (positive, negative, neutral)',
          engagement: 'Predict the engagement potential of this social media content',
          improvements: 'Suggest improvements for this social media content',
          hashtags: 'Generate relevant hashtags for this content',
        };

        const systemPrompt = prompts[analysisType] || 'Analyze this text';

        const response = await this.anthropic.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 300,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: text,
            },
          ],
        });

        const content = response.content[0];
        if (content.type === 'text') {
          return {
            success: true,
            analysis: content.text,
            type: analysisType,
          };
        }
      }

      // Fallback to basic analysis
      return this.basicTextAnalysis(text, analysisType);
    } catch (error) {
      logger.error('Error analyzing text:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private basicTextAnalysis(text: string, analysisType: string): any {
    const analysis: any = {
      success: true,
      type: analysisType,
    };

    switch (analysisType) {
      case 'sentiment':
        // Simple sentiment analysis
        const positiveWords = ['great', 'awesome', 'love', 'excellent', 'amazing'];
        const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible'];

        const hasPositive = positiveWords.some(word => text.toLowerCase().includes(word));
        const hasNegative = negativeWords.some(word => text.toLowerCase().includes(word));

        analysis.sentiment = hasPositive ? 'positive' : hasNegative ? 'negative' : 'neutral';
        break;

      case 'engagement':
        // Simple engagement prediction
        const hasQuestion = text.includes('?');
        const hasEmoji = /[\u{1F300}-\u{1F9FF}]/gu.test(text);
        const hasHashtag = text.includes('#');

        let score = 50;
        if (hasQuestion) score += 20;
        if (hasEmoji) score += 15;
        if (hasHashtag) score += 15;

        analysis.engagementScore = Math.min(score, 100);
        analysis.level = score > 75 ? 'high' : score > 50 ? 'medium' : 'low';
        break;

      case 'improvements':
        const suggestions = [];
        if (!text.includes('?')) suggestions.push('Add a question to encourage engagement');
        if (!/[\u{1F300}-\u{1F9FF}]/gu.test(text)) suggestions.push('Add emojis for visual appeal');
        if (!text.includes('#')) suggestions.push('Include relevant hashtags');
        if (text.length > 500) suggestions.push('Consider shortening for better readability');

        analysis.suggestions = suggestions;
        break;

      case 'hashtags':
        // Extract important words as hashtags
        const words = text.split(/\s+/)
          .filter(word => word.length > 4 && !word.includes('http'))
          .map(word => word.replace(/[^a-zA-Z0-9]/g, ''))
          .slice(0, 5)
          .map(word => `#${word.charAt(0).toUpperCase() + word.slice(1)}`);

        analysis.hashtags = words;
        break;
    }

    return analysis;
  }

  async executeAutomation(trigger: string, context: any): Promise<any> {
    return this.orchestrator.executeAutomation(trigger, context);
  }

  async getAgentCapabilities(): Promise<any> {
    return {
      agents: [
        {
          name: 'content-creator',
          description: 'Creates engaging social media content',
          capabilities: ['generate_content', 'generate_ideas', 'enhance_content'],
        },
        {
          name: 'analytics-advisor',
          description: 'Analyzes performance and provides insights',
          capabilities: ['analyze_performance', 'generate_reports', 'detect_trends'],
        },
        {
          name: 'campaign-manager',
          description: 'Manages marketing campaigns',
          capabilities: ['create_campaign', 'optimize_campaign', 'track_roi'],
        },
        {
          name: 'engagement-optimizer',
          description: 'Optimizes content for maximum engagement',
          capabilities: ['optimize_content', 'find_best_times', 'predict_performance'],
        },
        {
          name: 'strategy-planner',
          description: 'Provides strategic planning and insights',
          capabilities: ['develop_strategy', 'analyze_competition', 'forecast_trends'],
        },
      ],
      naturalLanguageEnabled: !!this.anthropic,
      mcpEnabled: true,
    };
  }
}