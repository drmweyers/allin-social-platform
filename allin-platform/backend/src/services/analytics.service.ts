import { prisma } from './database';
import { getRedis } from './redis';
import { SocialPlatform, PostStatus, Post, SocialAccount } from '@prisma/client';

interface PlatformMetrics {
  platform: SocialPlatform;
  posts: number;
  totalReach: number;
  totalEngagement: number;
  avgEngagementRate: number;
  topPerformingPost?: {
    id: string;
    content: string;
    engagement: number;
  };
}

interface CompetitorData {
  name: string;
  platform: SocialPlatform;
  followers: number;
  avgEngagement: number;
  postFrequency: number;
  topContent: string[];
}

interface SentimentData {
  positive: number;
  negative: number;
  neutral: number;
  trending: string[];
}

interface ROIMetrics {
  investment: number;
  revenue: number;
  roi: number;
  costPerEngagement: number;
  conversionRate: number;
}

interface PredictiveInsights {
  bestTimeToPost: string[];
  suggestedContent: string[];
  predictedEngagement: number;
  recommendedHashtags: string[];
}

type PostWithAccount = Post & {
  socialAccount: SocialAccount;
};

export class AnalyticsService {
  // Get aggregated analytics data
  async getAggregatedAnalytics(organizationId: string, dateRange?: { from: Date; to: Date }) {
    const where: {
      organizationId?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
      organizationId,
    };

    if (dateRange) {
      where.createdAt = {
        gte: dateRange.from,
        lte: dateRange.to,
      };
    }

    // Get posts with their social account
    const posts = await prisma.post.findMany({
      where,
      include: {
        socialAccount: true,
      },
    }) as PostWithAccount[];

    // Calculate platform-specific metrics
    const platformMetrics = await this.calculatePlatformMetrics(posts);

    // Get overall engagement trends
    const engagementTrends = await this.calculateEngagementTrends(posts);

    // Get top performing content
    const topContent = await this.getTopPerformingContent(posts);

    return {
      platformMetrics,
      engagementTrends,
      topContent,
      totalPosts: posts.length,
      avgEngagementRate: this.calculateAverageEngagement(posts),
    };
  }

  // Competitor analysis
  async analyzeCompetitors(organizationId: string, _competitorIds: string[]) {
    // Use _competitorIds for filtering in production

    // In a real implementation, this would fetch data from social media APIs
    // For now, we'll return mock data
    const competitorData: CompetitorData[] = [
      {
        name: 'Competitor A',
        platform: SocialPlatform.FACEBOOK,
        followers: 50000,
        avgEngagement: 3.5,
        postFrequency: 7, // posts per week
        topContent: ['Product launches', 'Behind the scenes', 'User testimonials'],
      },
      {
        name: 'Competitor B',
        platform: SocialPlatform.INSTAGRAM,
        followers: 75000,
        avgEngagement: 5.2,
        postFrequency: 10,
        topContent: ['Visual stories', 'Reels', 'User-generated content'],
      },
    ];

    // Compare with organization's performance
    const orgMetrics = await this.getAggregatedAnalytics(organizationId);

    const comparison = {
      competitorData,
      organizationMetrics: orgMetrics,
      insights: await this.generateCompetitorInsights(competitorData, orgMetrics),
    };

    // Cache the results
    const redis = getRedis();
    await redis.setex(
      `competitor_analysis:${organizationId}`,
      3600, // 1 hour cache
      JSON.stringify(comparison)
    );

    return comparison;
  }

  // Sentiment analysis
  async analyzeSentiment(organizationId: string, content?: string[]) {
    let dataToAnalyze: string[] = content || [];

    if (!content) {
      // Get recent posts and comments
      const posts = await prisma.post.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      dataToAnalyze = posts.map((p) => p.content);
    }

    // Simple sentiment analysis (in production, would use AI service)
    const sentimentResults = dataToAnalyze.map(() => {
      const rand = Math.random();
      if (rand < 0.4) return 'positive';
      if (rand < 0.7) return 'neutral';
      return 'negative';
    });

    // Aggregate results
    const sentiment: SentimentData = {
      positive: sentimentResults.filter((s) => s === 'positive').length,
      negative: sentimentResults.filter((s) => s === 'negative').length,
      neutral: sentimentResults.filter((s) => s === 'neutral').length,
      trending: await this.extractTrendingTopics(dataToAnalyze),
    };

    return sentiment;
  }

  // ROI tracking
  async trackROI(organizationId: string, dateRange?: { from: Date; to: Date }) {
    // Get advertising spend (would integrate with ad platforms)
    const adSpend = await this.getAdSpend(organizationId, dateRange);

    // Get revenue data (would integrate with analytics/e-commerce platforms)
    const revenue = await this.getRevenue(organizationId, dateRange);

    // Get engagement metrics
    const analytics = await this.getAggregatedAnalytics(organizationId, dateRange);
    const totalEngagement = this.calculateTotalEngagement(analytics);

    // Calculate ROI metrics
    const roi: ROIMetrics = {
      investment: adSpend,
      revenue: revenue,
      roi: adSpend > 0 ? ((revenue - adSpend) / adSpend) * 100 : 0,
      costPerEngagement: totalEngagement > 0 ? adSpend / totalEngagement : 0,
      conversionRate: await this.calculateConversionRate(organizationId, dateRange),
    };

    return roi;
  }

  // Predictive posting recommendations
  async getPredictiveInsights(organizationId: string) {
    // Get historical performance data
    const historicalData = await prisma.post.findMany({
      where: {
        organizationId,
        status: PostStatus.PUBLISHED,
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        socialAccount: true,
      },
    }) as PostWithAccount[];

    // Analyze best performing times
    const bestTimes = this.analyzeBestPostingTimes(historicalData);

    // Get content suggestions based on trends
    const contentSuggestions = await this.generateContentSuggestions(historicalData);

    // Predict engagement for next post
    const predictedEngagement = this.predictEngagement(historicalData);

    // Get recommended hashtags
    const recommendedHashtags = await this.getRecommendedHashtags(historicalData);

    const insights: PredictiveInsights = {
      bestTimeToPost: bestTimes,
      suggestedContent: contentSuggestions,
      predictedEngagement,
      recommendedHashtags,
    };

    // Cache insights
    const redis = getRedis();
    await redis.setex(
      `predictive_insights:${organizationId}`,
      7200, // 2 hour cache
      JSON.stringify(insights)
    );

    return insights;
  }

  // Real-time analytics stream
  async *streamRealTimeAnalytics(organizationId: string) {
    while (true) {
      // Get latest metrics
      const metrics = await this.getLatestMetrics(organizationId);

      // Yield the data
      yield {
        timestamp: new Date(),
        metrics,
      };

      // Wait 5 seconds before next update
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Private helper methods
  private async calculatePlatformMetrics(posts: PostWithAccount[]): Promise<PlatformMetrics[]> {
    const platformMap = new Map<SocialPlatform, PostWithAccount[]>();

    posts.forEach(post => {
      const platform = post.socialAccount.platform;
      if (!platformMap.has(platform)) {
        platformMap.set(platform, []);
      }
      platformMap.get(platform)!.push(post);
    });

    const metrics: PlatformMetrics[] = [];

    for (const [platform, platformPosts] of platformMap) {
      // Mock analytics data - in production would come from actual analytics
      const totalReach = platformPosts.length * 1000;
      const totalEngagement = platformPosts.length * 50;

      metrics.push({
        platform,
        posts: platformPosts.length,
        totalReach,
        totalEngagement,
        avgEngagementRate: totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0,
      });
    }

    return metrics;
  }

  private calculateEngagementTrends(posts: PostWithAccount[]) {
    // Group posts by date and calculate engagement
    const trendMap = new Map<string, number>();

    posts.forEach(post => {
      const date = post.createdAt.toISOString().split('T')[0];
      const engagement = 50; // Mock engagement - in production would come from actual analytics

      trendMap.set(date, (trendMap.get(date) || 0) + engagement);
    });

    return Array.from(trendMap.entries()).map(([date, engagement]) => ({
      date,
      engagement,
    }));
  }

  private async getTopPerformingContent(posts: PostWithAccount[]) {
    return posts
      .map(post => ({
        id: post.id,
        content: post.content.substring(0, 100),
        engagement: 50, // Mock engagement - in production would come from actual analytics
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10);
  }

  private calculateAverageEngagement(posts: PostWithAccount[]) {
    if (posts.length === 0) return 0;

    // Mock analytics data - in production would come from actual analytics
    const totalEngagement = posts.length * 50;
    const totalReach = posts.length * 1000;

    return totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;
  }

  private async generateCompetitorInsights(competitors: CompetitorData[], orgMetrics: { avgEngagementRate: number }) {
    const insights = [];

    // Compare engagement rates
    const avgCompetitorEngagement = competitors.reduce((sum, c) => sum + c.avgEngagement, 0) / competitors.length;
    if (orgMetrics.avgEngagementRate < avgCompetitorEngagement) {
      insights.push(`Your engagement rate is ${(avgCompetitorEngagement - orgMetrics.avgEngagementRate).toFixed(1)}% below competitors. Consider more interactive content.`);
    }

    // Analyze content strategies
    const topContentTypes = new Set<string>();
    competitors.forEach(c => c.topContent.forEach(content => topContentTypes.add(content)));
    insights.push(`Competitors are succeeding with: ${Array.from(topContentTypes).join(', ')}`);

    return insights;
  }

  private async extractTrendingTopics(content: string[]) {
    // Simple keyword extraction (in production, use NLP)
    const words = content.join(' ').toLowerCase().split(/\W+/);
    const wordCount = new Map<string, number>();

    words.forEach(word => {
      if (word.length > 4) { // Filter short words
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    });

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private async getAdSpend(_organizationId: string, _dateRange?: { from: Date; to: Date }) {
    // Mock implementation - would integrate with ad platforms
    return 5000;
  }

  private async getRevenue(_organizationId: string, _dateRange?: { from: Date; to: Date }) {
    // Mock implementation - would integrate with analytics/e-commerce
    return 15000;
  }

  private calculateTotalEngagement(analytics: { platformMetrics: { totalEngagement: number }[] }) {
    return analytics.platformMetrics.reduce((sum, m) => sum + m.totalEngagement, 0);
  }

  private async calculateConversionRate(_organizationId: string, _dateRange?: { from: Date; to: Date }) {
    // Mock implementation - would track actual conversions
    return 2.5;
  }

  private analyzeBestPostingTimes(posts: PostWithAccount[]) {
    // Analyze when posts get most engagement
    const timeEngagement = new Map<number, number>();

    posts.forEach(post => {
      const hour = new Date(post.publishedAt || post.createdAt).getHours();
      const engagement = 50; // Mock engagement - in production would come from actual analytics

      timeEngagement.set(hour, (timeEngagement.get(hour) || 0) + engagement);
    });

    // Get top 3 hours
    return Array.from(timeEngagement.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);
  }

  private async generateContentSuggestions(_posts: PostWithAccount[]) {
    // Analyze top performing content themes
    // In production, would analyze actual engagement metrics from posts

    // Extract themes (simplified)
    const suggestions = [
      'Share behind-the-scenes content',
      'Create educational posts about your industry',
      'Feature customer success stories',
      'Post interactive polls and questions',
      'Share team member spotlights',
    ];

    return suggestions;
  }

  private predictEngagement(posts: PostWithAccount[]) {
    // Simple average-based prediction
    if (posts.length === 0) return 0;

    const recentPosts = posts.slice(0, 10);
    const avgEngagement = recentPosts.reduce((sum, _post) => {
      return sum + 50; // Mock engagement - in production would come from actual analytics
    }, 0) / recentPosts.length;

    // Add some variance
    return Math.round(avgEngagement * (0.9 + Math.random() * 0.2));
  }

  private async getRecommendedHashtags(posts: PostWithAccount[]) {
    // Extract hashtags from top performing posts
    const hashtagPerformance = new Map<string, number>();

    posts.forEach(post => {
      const hashtags = post.content.match(/#\w+/g) || [];
      const engagement = 50; // Mock engagement - in production would come from actual analytics

      hashtags.forEach((tag: string) => {
        hashtagPerformance.set(tag, (hashtagPerformance.get(tag) || 0) + engagement);
      });
    });

    return Array.from(hashtagPerformance.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }

  private async getLatestMetrics(organizationId: string) {
    // Get real-time metrics
    const recentPosts = await prisma.post.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(Date.now() - 3600000), // Last hour
        },
      },
      include: {
        socialAccount: true,
      },
    });

    const totalEngagement = recentPosts.reduce((sum, _post) => {
      return sum + 50; // Mock engagement - in production would come from actual analytics
    }, 0);

    const activeAccountsCount = await prisma.socialAccount.count({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
    });

    return {
      postsLastHour: recentPosts.length,
      engagementLastHour: totalEngagement,
      activeAccounts: activeAccountsCount,
    };
  }
}

export const analyticsService = new AnalyticsService();