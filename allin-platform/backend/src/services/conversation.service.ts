import { MessageRole, Conversation, Message } from '@prisma/client';
import { prisma } from './database';
import { aiService } from './ai.service';
import { ragService } from './rag.service';

export interface CreateConversationRequest {
  userId: string;
  organizationId?: string;
  title?: string;
  currentPage?: string;
  featureContext?: string;
  initialMessage?: string;
}

export interface CreateMessageRequest {
  conversationId: string;
  content: string;
  role: MessageRole;
  intent?: string;
}

export interface ChatResponse {
  id: string;
  content: string;
  role: MessageRole;
  suggestedActions?: string[];
  confidenceScore?: number;
  responseTime?: number;
  createdAt: Date;
}

export interface ConversationWithMessages {
  id: string;
  title?: string;
  topic?: string;
  currentPage?: string;
  featureContext?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  messages: Message[];
}

class ConversationService {
  /**
   * Create a new conversation
   */
  async createConversation(request: CreateConversationRequest): Promise<Conversation> {
    const conversation = await prisma.conversation.create({
      data: {
        userId: request.userId,
        organizationId: request.organizationId,
        title: request.title,
        currentPage: request.currentPage,
        featureContext: request.featureContext,
        isActive: true,
      },
    });

    // If there's an initial message, add it
    if (request.initialMessage) {
      await this.addMessage({
        conversationId: conversation.id,
        content: request.initialMessage,
        role: MessageRole.USER,
      });
    }

    return conversation;
  }

  /**
   * Get conversation by ID with messages
   */
  async getConversationWithMessages(conversationId: string): Promise<ConversationWithMessages | null> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return conversation;
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(
    userId: string,
    organizationId?: string,
    limit = 50
  ): Promise<Conversation[]> {
    return await prisma.conversation.findMany({
      where: {
        userId,
        organizationId: organizationId || undefined,
        isActive: true,
      },
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Add a message to conversation
   */
  async addMessage(request: CreateMessageRequest): Promise<Message> {
    const message = await prisma.message.create({
      data: {
        conversationId: request.conversationId,
        content: request.content,
        role: request.role,
        intent: request.intent,
      },
    });

    // Update conversation's lastMessageAt
    await prisma.conversation.update({
      where: { id: request.conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  /**
   * Generate AI response for a conversation
   */
  async generateAIResponse(
    conversationId: string,
    userMessage: string,
    context?: {
      currentPage?: string;
      featureContext?: string;
      userId?: string;
      userRole?: string;
    }
  ): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      // Add user message first
      const userMsg = await this.addMessage({
        conversationId,
        content: userMessage,
        role: MessageRole.USER,
      });

      // Get conversation history for context
      const conversation = await this.getConversationWithMessages(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Build conversation context
      const messageHistory = conversation.messages
        .slice(-10) // Last 10 messages for context
        .map(msg => ({
          role: msg.role.toLowerCase(),
          content: msg.content,
        }));

      // Check if this is a platform-specific question using RAG
      let aiResponse: string;
      let confidenceScore: number = 0.8;
      let suggestedActions: string[] = [];

      // Use RAG for platform-specific questions
      if (this.isPlatformQuestion(userMessage)) {
        try {
          const ragResponse = await ragService.answer({
            query: userMessage,
            userId: context?.userId,
            userRole: context?.userRole,
            featureContext: context?.featureContext,
          });

          aiResponse = ragResponse.answer;
          confidenceScore = ragResponse.confidence || 0.8;
          suggestedActions = ragResponse.suggestedActions || [];
        } catch (ragError) {
          console.warn('RAG service failed, falling back to general AI:', ragError);
          aiResponse = await this.generateGeneralResponse(userMessage, messageHistory, context);
        }
      } else {
        // Use general AI service for marketing questions
        aiResponse = await this.generateGeneralResponse(userMessage, messageHistory, context);
        suggestedActions = this.generateSuggestedActions(userMessage, context);
      }

      const responseTime = Date.now() - startTime;

      // Save AI response
      const aiMsg = await prisma.message.create({
        data: {
          conversationId,
          content: aiResponse,
          role: MessageRole.ASSISTANT,
          model: 'gpt-4-turbo-preview',
          tokens: Math.ceil(aiResponse.length / 4), // Rough token estimate
          responseTime,
          confidenceScore,
          suggestedActions,
        },
      });

      // Update conversation topic if not set
      if (!conversation.topic) {
        const inferredTopic = await this.inferConversationTopic(userMessage);
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { topic: inferredTopic },
        });
      }

      return {
        id: aiMsg.id,
        content: aiResponse,
        role: MessageRole.ASSISTANT,
        suggestedActions,
        confidenceScore,
        responseTime,
        createdAt: aiMsg.createdAt,
      };
    } catch (error) {
      console.error('Error generating AI response:', error);

      // Create fallback response
      const fallbackResponse = this.getFallbackResponse(userMessage, context);
      const responseTime = Date.now() - startTime;

      const aiMsg = await prisma.message.create({
        data: {
          conversationId,
          content: fallbackResponse,
          role: MessageRole.ASSISTANT,
          model: 'fallback',
          responseTime,
          confidenceScore: 0.3,
        },
      });

      return {
        id: aiMsg.id,
        content: fallbackResponse,
        role: MessageRole.ASSISTANT,
        responseTime,
        createdAt: aiMsg.createdAt,
      };
    }
  }

  /**
   * Generate general AI response using social media marketing knowledge
   */
  private async generateGeneralResponse(
    userMessage: string,
    messageHistory: any[],
    context?: any
  ): Promise<string> {
    const prompt = this.buildMarketingPrompt(userMessage, messageHistory, context);

    // Use the existing AI service
    return await aiService.generateMarketingAdvice(prompt);
  }

  /**
   * Build marketing-focused prompt
   */
  private buildMarketingPrompt(userMessage: string, messageHistory: any[], context?: any): string {
    let prompt = `You are an expert social media marketing consultant helping users with the AllIN platform.

Context:
- Current page: ${context?.currentPage || 'dashboard'}
- Feature context: ${context?.featureContext || 'general'}
- User role: ${context?.userRole || 'user'}

Conversation History:
${messageHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Current Question: ${userMessage}

Provide helpful, actionable advice for social media marketing. Keep responses concise but comprehensive. Include specific strategies, best practices, and platform-specific tips when relevant.

Response:`;

    return prompt;
  }

  /**
   * Check if message is platform-specific question
   */
  private isPlatformQuestion(message: string): boolean {
    const platformKeywords = [
      'allin', 'platform', 'feature', 'how to', 'setup', 'configure',
      'dashboard', 'analytics', 'schedule', 'calendar', 'team', 'settings',
      'account', 'integration', 'api', 'error', 'bug', 'issue'
    ];

    return platformKeywords.some(keyword =>
      message.toLowerCase().includes(keyword)
    );
  }

  /**
   * Generate suggested actions based on context
   */
  private generateSuggestedActions(message: string, context?: any): string[] {
    const suggestions: string[] = [];

    // Context-based suggestions
    if (context?.currentPage?.includes('create')) {
      suggestions.push('Create a new post', 'Use AI content generator', 'Browse templates');
    } else if (context?.currentPage?.includes('analytics')) {
      suggestions.push('View detailed analytics', 'Export report', 'Set up tracking');
    } else if (context?.currentPage?.includes('schedule')) {
      suggestions.push('Schedule a post', 'View calendar', 'Set optimal times');
    } else {
      // General suggestions
      suggestions.push('Learn more about social media strategy', 'Explore AllIN features', 'Contact support');
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Infer conversation topic from first message
   */
  private async inferConversationTopic(message: string): Promise<string> {
    const topicKeywords = {
      'content creation': ['content', 'post', 'create', 'write', 'generate'],
      'analytics': ['analytics', 'metrics', 'performance', 'insights', 'data'],
      'scheduling': ['schedule', 'calendar', 'time', 'when', 'post timing'],
      'strategy': ['strategy', 'plan', 'campaign', 'growth', 'engagement'],
      'platform help': ['how to', 'setup', 'configure', 'feature', 'help'],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
        return topic;
      }
    }

    return 'general discussion';
  }

  /**
   * Get fallback response for errors
   */
  private getFallbackResponse(message: string, context?: any): string {
    const fallbacks = [
      "I'm having trouble processing your request right now. Could you try rephrasing your question?",
      "I apologize, but I'm experiencing some technical difficulties. Is there something specific about social media marketing I can help you with?",
      "I'm currently unable to provide a detailed response. For immediate assistance, please check our help documentation or contact support.",
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  /**
   * Update message feedback
   */
  async updateMessageFeedback(
    messageId: string,
    isHelpful: boolean,
    feedback?: string
  ): Promise<Message> {
    return await prisma.message.update({
      where: { id: messageId },
      data: {
        isHelpful,
        feedback,
      },
    });
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string): Promise<Conversation> {
    return await prisma.conversation.update({
      where: { id: conversationId },
      data: { isActive: false },
    });
  }

  /**
   * Get conversation analytics
   */
  async getConversationAnalytics(userId: string, organizationId?: string) {
    const totalConversations = await prisma.conversation.count({
      where: { userId, organizationId },
    });

    const totalMessages = await prisma.message.count({
      where: {
        conversation: { userId, organizationId },
      },
    });

    const avgResponseTime = await prisma.message.aggregate({
      where: {
        conversation: { userId, organizationId },
        role: MessageRole.ASSISTANT,
        responseTime: { not: null },
      },
      _avg: { responseTime: true },
    });

    const helpfulMessages = await prisma.message.count({
      where: {
        conversation: { userId, organizationId },
        role: MessageRole.ASSISTANT,
        isHelpful: true,
      },
    });

    const ratedMessages = await prisma.message.count({
      where: {
        conversation: { userId, organizationId },
        role: MessageRole.ASSISTANT,
        isHelpful: { not: null },
      },
    });

    return {
      totalConversations,
      totalMessages,
      avgResponseTime: avgResponseTime._avg.responseTime || 0,
      helpfulnessRate: ratedMessages > 0 ? helpfulMessages / ratedMessages : 0,
    };
  }
}

// Add marketing advice method to AI service if not exists
declare module './ai.service' {
  interface AIService {
    generateMarketingAdvice(prompt: string): Promise<string>;
  }
}

export const conversationService = new ConversationService();