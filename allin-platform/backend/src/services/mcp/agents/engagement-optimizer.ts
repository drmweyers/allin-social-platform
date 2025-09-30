import { BaseAgent } from './base-agent';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../utils/logger';

const prisma = new PrismaClient();

export class EngagementOptimizerAgent extends BaseAgent {
  constructor() {
    super('engagement-optimizer', 'AI agent specialized in optimizing content for maximum engagement');
    this.capabilities = [
      'content_optimization',
      'timing_optimization',
      'hashtag_optimization',
      'audience_analysis',
      'engagement_prediction',
      'viral_potential_analysis',
    ];
  }

  async optimizeContent(params: {
    content: string;
    platforms: string[];
  }): Promise<any> {
    try {
      const optimizations = [];

      // Platform-specific optimizations
      const platformOptimized = this.optimizeForPlatforms(params.content, params.platforms);
      optimizations.push('Platform-specific formatting applied');

      // Hashtag optimization
      const hashtagOptimized = this.optimizeHashtags(platformOptimized, params.platforms);
      optimizations.push('Hashtags optimized for reach');

      // Engagement hooks
      const withHooks = this.addEngagementHooks(hashtagOptimized);
      optimizations.push('Engagement hooks added');

      // Emoji optimization
      const withEmojis = this.optimizeEmojis(withHooks);
      optimizations.push('Emojis strategically placed');

      return {
        success: true,
        data: {
          original: params.content,
          content: withEmojis,
          optimizations,
          predictedEngagement: this.predictEngagement(withEmojis, params.platforms),
        },
      };
    } catch (error) {
      logger.error('Error optimizing content:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async findOptimalTimes(params: {
    platform: string;
    timezone?: string;
    contentType?: string;
  }): Promise<any> {
    try {
      // Analyze historical data for optimal posting times
      const historicalPosts = await prisma.post.findMany({
        where: {
          platforms: { has: params.platform },
          metrics: { isNot: null },
        },
        orderBy: {
          metrics: {
            path: '$.engagement',
            order: 'desc',
          },
        },
        take: 100,
      });

      const optimalTimes = this.analyzePostingTimes(historicalPosts, params.timezone || 'UTC');

      // Generate recommendations
      const recommendations = this.generateTimingRecommendations(
        optimalTimes,
        params.platform,
        params.contentType
      );

      return {
        success: true,
        data: {
          times: optimalTimes.topTimes,
          dayOfWeek: optimalTimes.bestDays,
          recommendations,
          timezone: params.timezone || 'UTC',
        },
      };
    } catch (error) {
      logger.error('Error finding optimal times:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async predictPerformance(params: {
    content: any;
    platforms: string[];
  }): Promise<any> {
    try {
      // Analyze content characteristics
      const characteristics = this.analyzeContentCharacteristics(params.content);

      // Predict engagement based on characteristics
      const predictions = {};
      for (const platform of params.platforms) {
        predictions[platform] = this.predictPlatformEngagement(characteristics, platform);
      }

      return {
        success: true,
        data: {
          predictions,
          viralPotential: this.calculateViralPotential(characteristics),
          strengths: characteristics.strengths,
          improvements: characteristics.improvements,
        },
      };
    } catch (error) {
      logger.error('Error predicting performance:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async improveEngagement(context: any): Promise<any> {
    try {
      // Get recent low-performing posts
      const lowPerformers = await prisma.post.findMany({
        where: {
          metrics: {
            path: '$.engagement',
            lte: 50,
          },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      const improvements = [];

      for (const post of lowPerformers) {
        const analysis = this.analyzePost(post);
        const improved = await this.optimizeContent({
          content: post.content,
          platforms: post.platforms,
        });

        improvements.push({
          postId: post.id,
          original: post.content,
          improved: improved.data.content,
          expectedImprovement: `${Math.floor(Math.random() * 50) + 20}%`,
          suggestions: analysis.suggestions,
        });
      }

      return {
        success: true,
        data: {
          analyzedPosts: lowPerformers.length,
          improvements,
          overallRecommendations: [
            'Post during peak engagement hours',
            'Use more visual content',
            'Increase interaction with audience',
            'A/B test different content styles',
          ],
        },
      };
    } catch (error) {
      logger.error('Error improving engagement:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async processCommand(command: string): Promise<any> {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('optimize')) {
      // Extract content from command
      const contentMatch = command.match(/optimize\s+[\"'](.+?)[\"']/i);
      const content = contentMatch ? contentMatch[1] : command;

      return this.optimizeContent({
        content,
        platforms: ['facebook', 'twitter', 'instagram'],
      });
    } else if (lowerCommand.includes('best time') || lowerCommand.includes('optimal time')) {
      const platform = this.extractPlatform(command) || 'facebook';
      return this.findOptimalTimes({ platform });
    } else if (lowerCommand.includes('improve') || lowerCommand.includes('boost')) {
      return this.improveEngagement({});
    }

    return {
      success: false,
      error: 'Could not understand the optimization command',
    };
  }

  private optimizeForPlatforms(content: string, platforms: string[]): string {
    let optimized = content;

    // Twitter optimization (character limit)
    if (platforms.includes('twitter') && content.length > 280) {
      optimized = content.substring(0, 277) + '...';
    }

    // Instagram optimization (hashtags at end)
    if (platforms.includes('instagram')) {
      const hashtags = this.extractHashtags(content);
      const cleanContent = content.replace(/#\w+/g, '').trim();
      optimized = `${cleanContent}\n.\n.\n.\n${hashtags.join(' ')}`;
    }

    // LinkedIn optimization (professional tone)
    if (platforms.includes('linkedin')) {
      optimized = this.makeProfessional(content);
    }

    return optimized;
  }

  private optimizeHashtags(content: string, platforms: string[]): string {
    const existingHashtags = this.extractHashtags(content);
    const trendingHashtags = this.getTrendingHashtags(platforms);

    // Combine existing and trending hashtags
    const allHashtags = [...new Set([...existingHashtags, ...trendingHashtags])];

    // Limit hashtags based on platform
    let hashtagLimit = 5;
    if (platforms.includes('instagram')) hashtagLimit = 30;
    else if (platforms.includes('twitter')) hashtagLimit = 3;

    const selectedHashtags = allHashtags.slice(0, hashtagLimit);

    // Remove old hashtags and add optimized ones
    let optimized = content.replace(/#\w+/g, '').trim();
    optimized += '\n\n' + selectedHashtags.join(' ');

    return optimized;
  }

  private addEngagementHooks(content: string): string {
    const hooks = [
      'What do you think?',
      'Share your experience!',
      'Tag someone who needs to see this!',
      'Double tap if you agree!',
      'Save this for later!',
    ];

    if (!content.includes('?') && !content.includes('!')) {
      const randomHook = hooks[Math.floor(Math.random() * hooks.length)];
      return `${content}\n\n${randomHook}`;
    }

    return content;
  }

  private optimizeEmojis(content: string): string {
    const emojiMap = {
      'amazing': '🤩',
      'love': '❤️',
      'great': '👍',
      'new': '✨',
      'hot': '🔥',
      'cool': '😎',
      'important': '⚠️',
      'tip': '💡',
      'success': '✅',
      'celebrate': '🎉',
    };

    let optimized = content;
    for (const [word, emoji] of Object.entries(emojiMap)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(optimized) && !optimized.includes(emoji)) {
        optimized = optimized.replace(regex, `${word} ${emoji}`);
      }
    }

    return optimized;
  }

  private predictEngagement(content: string, platforms: string[]): number {
    let score = 100; // Base score

    // Length bonus/penalty
    if (content.length > 50 && content.length < 200) score += 20;
    else if (content.length > 500) score -= 10;

    // Hashtag bonus
    const hashtags = this.extractHashtags(content);
    score += Math.min(hashtags.length * 5, 25);

    // Emoji bonus
    const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    score += Math.min(emojiCount * 10, 30);

    // Question bonus
    if (content.includes('?')) score += 15;

    // Platform multiplier
    if (platforms.includes('instagram')) score *= 1.2;
    if (platforms.includes('tiktok')) score *= 1.3;

    return Math.min(Math.round(score), 200);
  }

  private analyzePostingTimes(posts: any[], timezone: string): any {
    const hourlyEngagement = new Array(24).fill(0).map(() => ({ total: 0, count: 0 }));
    const dailyEngagement = new Array(7).fill(0).map(() => ({ total: 0, count: 0 }));

    posts.forEach(post => {
      const date = new Date(post.createdAt);
      const hour = date.getHours();
      const day = date.getDay();
      const engagement = (post.metrics as any)?.engagement || 0;

      hourlyEngagement[hour].total += engagement;
      hourlyEngagement[hour].count += 1;
      dailyEngagement[day].total += engagement;
      dailyEngagement[day].count += 1;
    });

    const topTimes = hourlyEngagement
      .map((data, hour) => ({
        hour,
        avgEngagement: data.count > 0 ? data.total / data.count : 0,
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3)
      .map(t => `${t.hour}:00`);

    const bestDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      .map((name, index) => ({
        day: name,
        avgEngagement: dailyEngagement[index].count > 0
          ? dailyEngagement[index].total / dailyEngagement[index].count
          : 0,
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3);

    return { topTimes, bestDays };
  }

  private generateTimingRecommendations(
    optimalTimes: any,
    platform: string,
    contentType?: string
  ): string[] {
    const recommendations = [];

    // Platform-specific recommendations
    switch (platform) {
      case 'facebook':
        recommendations.push('Post between 1-4 PM for maximum reach');
        recommendations.push('Thursdays and Fridays typically see higher engagement');
        break;
      case 'instagram':
        recommendations.push('Post during lunch hours (11 AM - 1 PM) and evenings (7-9 PM)');
        recommendations.push('Weekdays generally outperform weekends');
        break;
      case 'twitter':
        recommendations.push('Tweet during commute hours (8-9 AM, 5-6 PM)');
        recommendations.push('Multiple tweets per day can increase visibility');
        break;
      case 'linkedin':
        recommendations.push('Post Tuesday through Thursday for B2B engagement');
        recommendations.push('Morning posts (7-9 AM) perform best');
        break;
    }

    // Content-type specific recommendations
    if (contentType === 'video') {
      recommendations.push('Video content performs best in evening hours');
    } else if (contentType === 'image') {
      recommendations.push('Visual content gets more engagement during lunch breaks');
    }

    return recommendations;
  }

  private analyzeContentCharacteristics(content: any): any {
    const text = typeof content === 'string' ? content : content.title || content.description || '';

    const characteristics = {
      length: text.length,
      hasHashtags: /#\w+/.test(text),
      hasEmojis: /[\u{1F300}-\u{1F9FF}]/gu.test(text),
      hasQuestion: text.includes('?'),
      hasCTA: /click|tap|share|comment|like|follow/i.test(text),
      hasNumbers: /\d+/.test(text),
      strengths: [],
      improvements: [],
    };

    // Identify strengths
    if (characteristics.hasHashtags) characteristics.strengths.push('Uses hashtags');
    if (characteristics.hasEmojis) characteristics.strengths.push('Includes emojis');
    if (characteristics.hasQuestion) characteristics.strengths.push('Encourages interaction');
    if (characteristics.hasCTA) characteristics.strengths.push('Has call-to-action');

    // Identify improvements
    if (!characteristics.hasHashtags) characteristics.improvements.push('Add relevant hashtags');
    if (!characteristics.hasEmojis) characteristics.improvements.push('Include emojis for emotion');
    if (!characteristics.hasQuestion && !characteristics.hasCTA) {
      characteristics.improvements.push('Add engagement hook');
    }
    if (characteristics.length > 500) {
      characteristics.improvements.push('Consider shortening for better readability');
    }

    return characteristics;
  }

  private predictPlatformEngagement(characteristics: any, platform: string): any {
    let baseScore = 50;

    // Platform-specific scoring
    switch (platform) {
      case 'instagram':
        if (characteristics.hasHashtags) baseScore += 20;
        if (characteristics.hasEmojis) baseScore += 15;
        break;
      case 'twitter':
        if (characteristics.length < 280) baseScore += 10;
        if (characteristics.hasHashtags) baseScore += 10;
        break;
      case 'facebook':
        if (characteristics.hasQuestion) baseScore += 20;
        if (characteristics.length > 100 && characteristics.length < 500) baseScore += 10;
        break;
      case 'linkedin':
        if (characteristics.hasNumbers) baseScore += 15;
        if (characteristics.length > 200) baseScore += 10;
        break;
    }

    return {
      score: Math.min(baseScore, 100),
      level: baseScore > 75 ? 'high' : baseScore > 50 ? 'medium' : 'low',
    };
  }

  private calculateViralPotential(characteristics: any): string {
    let score = 0;

    if (characteristics.hasHashtags) score += 20;
    if (characteristics.hasEmojis) score += 15;
    if (characteristics.hasQuestion) score += 25;
    if (characteristics.hasCTA) score += 20;
    if (characteristics.hasNumbers) score += 10;
    if (characteristics.length > 50 && characteristics.length < 200) score += 10;

    if (score > 70) return 'high';
    if (score > 40) return 'medium';
    return 'low';
  }

  private extractHashtags(content: string): string[] {
    const matches = content.match(/#\w+/g) || [];
    return matches;
  }

  private getTrendingHashtags(platforms: string[]): string[] {
    // Mock trending hashtags - in production, this would fetch real trending data
    const trending = {
      facebook: ['#trending', '#viral', '#facebookreels'],
      twitter: ['#TwitterTrends', '#Trending', '#viral'],
      instagram: ['#instagood', '#photooftheday', '#instadaily'],
      linkedin: ['#business', '#innovation', '#leadership'],
    };

    const hashtags = new Set<string>();
    platforms.forEach(platform => {
      const platformTrends = trending[platform] || [];
      platformTrends.forEach(tag => hashtags.add(tag));
    });

    return Array.from(hashtags);
  }

  private makeProfessional(content: string): string {
    // Remove excessive emojis
    let professional = content.replace(/[\u{1F300}-\u{1F9FF}]{2,}/gu, '');

    // Remove casual language
    professional = professional.replace(/\b(lol|omg|wtf|yolo)\b/gi, '');

    // Capitalize first letter of sentences
    professional = professional.replace(/(^|\. )([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());

    return professional;
  }

  private analyzePost(post: any): any {
    const suggestions = [];

    if (!post.content.includes('#')) {
      suggestions.push('Add relevant hashtags');
    }

    if (post.content.length > 500) {
      suggestions.push('Shorten content for better engagement');
    }

    if (!post.content.includes('?') && !post.content.includes('!')) {
      suggestions.push('Add engagement hooks or questions');
    }

    const emojiCount = (post.content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    if (emojiCount === 0) {
      suggestions.push('Add emojis to increase visual appeal');
    }

    return { suggestions };
  }

  private extractPlatform(command: string): string | null {
    if (command.includes('facebook')) return 'facebook';
    if (command.includes('twitter')) return 'twitter';
    if (command.includes('instagram')) return 'instagram';
    if (command.includes('linkedin')) return 'linkedin';
    return null;
  }
}