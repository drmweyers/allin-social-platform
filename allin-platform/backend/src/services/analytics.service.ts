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
  contentPerformancePrediction: {
    contentType: string;
    predictedEngagement: number;
    confidence: number;
  }[];
  audienceGrowthForecast: {
    platform: SocialPlatform;
    predictedGrowth: number;
    timeframe: string;
  }[];
}

interface AdvancedMetrics {
  viralityScore: number;
  brandMentions: number;
  shareOfVoice: number;
  influencerReach: number;
  audienceQualityScore: number;
  contentMix: {
    type: string;
    percentage: number;
    performance: number;
  }[];
}

interface RealTimeAlert {
  id: string;
  type: 'engagement_spike' | 'viral_content' | 'negative_sentiment' | 'competitor_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  platform?: SocialPlatform;
  data?: any;
}

interface ComprehensiveDashboard {
  summary: {
    totalFollowers: number;
    totalEngagement: number;
    brandMentions: number;
    viralityScore: number;
    sentimentScore: number;
  };
  realTimeMetrics: {
    activeUsers: number;
    postsLastHour: number;
    engagementRate: number;
    trendingHashtags: string[];
  };
  platformPerformance: PlatformMetrics[];
  contentAnalysis: {
    topPerforming: any[];
    underPerforming: any[];
    contentMix: any[];
  };
  audienceInsights: {
    demographics: any;
    interests: string[];
    behavior: any;
  };
  competitorComparison: any;
  alerts: RealTimeAlert[];
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

    // Add null check for posts array
    const safePosts = posts || [];

    // Calculate platform-specific metrics
    const platformMetrics = await this.calculatePlatformMetrics(safePosts);

    // Get overall engagement trends
    const engagementTrends = await this.calculateEngagementTrends(safePosts);

    // Get top performing content
    const topContent = await this.getTopPerformingContent(safePosts);

    return {
      platformMetrics,
      engagementTrends,
      topContent,
      totalPosts: safePosts.length,
      avgEngagementRate: this.calculateAverageEngagement(safePosts),
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
      contentPerformancePrediction: [],
      audienceGrowthForecast: [
        {
          platform: 'INSTAGRAM' as SocialPlatform,
          predictedGrowth: Math.floor(Math.random() * 20) + 10,
          timeframe: '30 days'
        },
        {
          platform: 'FACEBOOK' as SocialPlatform,
          predictedGrowth: Math.floor(Math.random() * 15) + 5,
          timeframe: '30 days'
        }
      ]
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

  // Advanced Dashboard Analytics
  async getComprehensiveDashboard(organizationId: string): Promise<ComprehensiveDashboard> {
    const [summary, realTimeMetrics, platformMetrics, contentAnalysis, audienceInsights, competitors, alerts] = await Promise.all([
      this.getDashboardSummary(organizationId),
      this.getRealTimeMetrics(organizationId),
      this.getAggregatedAnalytics(organizationId),
      this.getContentAnalysis(organizationId),
      this.getAudienceInsights(organizationId),
      this.getCompetitorComparison(organizationId),
      this.getActiveAlerts(organizationId)
    ]);

    return {
      summary,
      realTimeMetrics,
      platformPerformance: platformMetrics.platformMetrics,
      contentAnalysis,
      audienceInsights,
      competitorComparison: competitors,
      alerts
    };
  }

  // Enhanced Real-time analytics with alerting
  async *streamRealTimeAnalytics(organizationId: string) {
    let previousMetrics: any = null;
    
    while (true) {
      try {
        // Get latest comprehensive metrics
        const metrics = await this.getLatestMetrics(organizationId);
        const alerts = await this.detectRealTimeAlerts(organizationId, metrics, previousMetrics);
        
        // Yield the enhanced data
        yield {
          timestamp: new Date(),
          metrics,
          alerts,
          trends: await this.calculateTrends(metrics, previousMetrics),
        };

        previousMetrics = metrics;
        
        // Wait 5 seconds before next update
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('Real-time analytics error:', error);
        yield {
          timestamp: new Date(),
          error: 'Failed to fetch real-time data',
          metrics: null,
          alerts: [],
        };
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait longer on error
      }
    }
  }

  // Advanced Content Performance Prediction
  async predictContentPerformance(organizationId: string, contentData: {
    type: string;
    text: string;
    platform: SocialPlatform;
    scheduledTime?: Date;
    hashtags?: string[];
  }) {
    const historicalData = await this.getHistoricalPerformanceData(organizationId, contentData.platform);
    
    // Analyze content characteristics
    const contentScore = this.analyzeContentCharacteristics(contentData.text);
    const hashtagScore = contentData.hashtags ? await this.analyzeHashtagPerformance(contentData.hashtags, organizationId) : 0;
    const timingScore = contentData.scheduledTime ? this.analyzePostingTime(contentData.scheduledTime, historicalData) : 0;
    
    // Calculate prediction
    const baseEngagement = this.getBaselineEngagement(historicalData);
    const multiplier = (contentScore + hashtagScore + timingScore) / 3;
    const predictedEngagement = Math.round(baseEngagement * (0.5 + multiplier));
    const confidence = Math.min(95, Math.max(60, multiplier * 100));
    
    return {
      predictedEngagement,
      confidence,
      factors: {
        contentQuality: contentScore,
        hashtagRelevance: hashtagScore,
        optimalTiming: timingScore,
      },
      recommendations: await this.generateContentRecommendations(contentData, historicalData),
    };
  }

  // Viral Content Detection
  async detectViralContent(organizationId: string) {
    const recentPosts = await prisma.post.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        socialAccount: true,
      },
    });

    const viralCandidates = recentPosts.filter(() => {
      const engagement = 100; // Mock - would get real engagement
      const followersCount = 10000; // Mock - would get real followers
      const viralityThreshold = followersCount * 0.05; // 5% engagement rate
      
      return engagement > viralityThreshold;
    });

    return viralCandidates.map(post => ({
      id: post.id,
      content: post.content.substring(0, 100),
      platform: post.socialAccount.platform,
      engagement: 100, // Mock engagement
      viralityScore: this.calculateViralityScore(post),
      trend: 'rising',
    }));
  }

  // Private helper methods
  private async calculatePlatformMetrics(posts: PostWithAccount[]): Promise<PlatformMetrics[]> {
    // Add null/undefined check
    if (!posts || !Array.isArray(posts)) {
      return [];
    }

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
    // Add null/undefined check
    if (!posts || !Array.isArray(posts)) {
      return [];
    }

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
    // Add null/undefined check
    if (!posts || !Array.isArray(posts)) {
      return [];
    }

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
    if (!posts || !Array.isArray(posts) || posts.length === 0) return 0;

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

  // Private helper methods for advanced analytics
  private async getDashboardSummary(organizationId: string) {
    const analytics = await this.getAggregatedAnalytics(organizationId);
    const viralContent = await this.detectViralContent(organizationId);
    const sentiment = await this.analyzeSentiment(organizationId);
    
    return {
      totalFollowers: 125000, // Mock - would aggregate from all platforms
      totalEngagement: analytics.platformMetrics.reduce((sum, p) => sum + p.totalEngagement, 0),
      brandMentions: 450, // Mock - would track mentions across platforms
      viralityScore: viralContent.length > 0 ? viralContent[0].viralityScore : 0,
      sentimentScore: (sentiment.positive / (sentiment.positive + sentiment.negative + sentiment.neutral)) * 100,
    };
  }

  private async getRealTimeMetrics(organizationId: string) {
    const recentActivity = await this.getLatestMetrics(organizationId);
    
    return {
      activeUsers: Math.floor(Math.random() * 500) + 100, // Mock active users
      postsLastHour: recentActivity.postsLastHour,
      engagementRate: recentActivity.engagementLastHour > 0 ? 
        (recentActivity.engagementLastHour / (recentActivity.postsLastHour * 1000)) * 100 : 0,
      trendingHashtags: ['#marketing', '#socialmedia', '#ai', '#automation'],
    };
  }

  private async getContentAnalysis(organizationId: string) {
    const posts = await prisma.post.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { socialAccount: true },
    });

    const topPerforming = posts.slice(0, 5).map(post => ({
      id: post.id,
      content: post.content.substring(0, 100),
      engagement: 150, // Mock
      platform: post.socialAccount.platform,
    }));

    const underPerforming = posts.slice(-5).map(post => ({
      id: post.id,
      content: post.content.substring(0, 100),
      engagement: 25, // Mock
      platform: post.socialAccount.platform,
    }));

    const contentMix = [
      { type: 'Educational', percentage: 35, performance: 4.2 },
      { type: 'Entertainment', percentage: 25, performance: 3.8 },
      { type: 'Promotional', percentage: 20, performance: 2.9 },
      { type: 'Behind-the-scenes', percentage: 20, performance: 4.5 },
    ];

    return { topPerforming, underPerforming, contentMix };
  }

  private async getAudienceInsights(_organizationId: string) {
    // Mock audience data - in production would come from platform APIs
    return {
      demographics: {
        ageGroups: [
          { range: '18-24', percentage: 25 },
          { range: '25-34', percentage: 40 },
          { range: '35-44', percentage: 25 },
          { range: '45+', percentage: 10 },
        ],
        genders: [
          { gender: 'Female', percentage: 55 },
          { gender: 'Male', percentage: 43 },
          { gender: 'Other', percentage: 2 },
        ],
        locations: [
          { country: 'United States', percentage: 45 },
          { country: 'Canada', percentage: 20 },
          { country: 'United Kingdom', percentage: 15 },
          { country: 'Australia', percentage: 10 },
          { country: 'Other', percentage: 10 },
        ],
      },
      interests: ['Technology', 'Marketing', 'Business', 'Entrepreneurship', 'AI'],
      behavior: {
        bestTimeToEngage: ['9:00-11:00', '14:00-16:00', '19:00-21:00'],
        avgSessionDuration: '3:45',
        engagementPreferences: ['Video', 'Images', 'Text posts'],
      },
    };
  }

  private async getCompetitorComparison(_organizationId: string) {
    // Simplified competitor comparison
    return {
      marketPosition: 'Top 25%',
      engagementVsCompetitors: '+15%',
      growthRate: '+8% (last 30 days)',
      shareOfVoice: '12%',
    };
  }

  private async getActiveAlerts(_organizationId: string): Promise<RealTimeAlert[]> {
    // Mock real-time alerts - in production would track actual events
    const alerts: RealTimeAlert[] = [];
    
    // Simulate engagement spike detection
    if (Math.random() > 0.7) {
      alerts.push({
        id: `alert_${Date.now()}`,
        type: 'engagement_spike',
        severity: 'high',
        message: 'Your Instagram post is experiencing 300% higher engagement than average',
        timestamp: new Date(),
        platform: SocialPlatform.INSTAGRAM,
        data: { engagementIncrease: 300 },
      });
    }

    return alerts;
  }

  private async detectRealTimeAlerts(_organizationId: string, currentMetrics: any, previousMetrics: any): Promise<RealTimeAlert[]> {
    const alerts: RealTimeAlert[] = [];
    
    if (previousMetrics && currentMetrics.engagementLastHour > previousMetrics.engagementLastHour * 2) {
      alerts.push({
        id: `spike_${Date.now()}`,
        type: 'engagement_spike',
        severity: 'high',
        message: `Engagement increased by ${Math.round(((currentMetrics.engagementLastHour / previousMetrics.engagementLastHour) - 1) * 100)}% in the last hour`,
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  private async calculateTrends(currentMetrics: any, previousMetrics: any) {
    if (!previousMetrics) return {};
    
    return {
      engagement: this.calculatePercentageChange(currentMetrics.engagementLastHour, previousMetrics.engagementLastHour),
      posts: this.calculatePercentageChange(currentMetrics.postsLastHour, previousMetrics.postsLastHour),
    };
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
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
      return sum + Math.floor(Math.random() * 100) + 50; // More realistic mock engagement
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
      avgEngagementPerPost: recentPosts.length > 0 ? Math.round(totalEngagement / recentPosts.length) : 0,
    };
  }

  // Additional helper methods for advanced features
  private async getHistoricalPerformanceData(organizationId: string, platform: SocialPlatform) {
    return await prisma.post.findMany({
      where: {
        organizationId,
        socialAccount: { platform },
        status: PostStatus.PUBLISHED,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  private analyzeContentCharacteristics(text: string): number {
    // Simple content scoring - in production would use AI
    let score = 0.5;
    
    // Check for engagement triggers
    if (text.includes('?')) score += 0.1; // Questions
    if (text.match(/[!]{1,3}/)) score += 0.05; // Excitement
    if (text.length > 50 && text.length < 280) score += 0.1; // Optimal length
    if (text.match(/#\w+/g)) score += 0.1; // Hashtags
    if (text.match(/@\w+/g)) score += 0.05; // Mentions
    
    return Math.min(1, score);
  }

  private async analyzeHashtagPerformance(hashtags: string[], _organizationId: string): Promise<number> {
    // Mock hashtag analysis - would check historical performance
    const performanceMap = new Map([
      ['#marketing', 0.8],
      ['#socialmedia', 0.7],
      ['#ai', 0.9],
      ['#business', 0.6],
    ]);
    
    const scores = hashtags.map(tag => performanceMap.get(tag.toLowerCase()) || 0.5);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private analyzePostingTime(scheduledTime: Date, _historicalData: any[]): number {
    // Analyze if scheduled time aligns with best performing times
    const hour = scheduledTime.getHours();
    const dayOfWeek = scheduledTime.getDay();
    
    // Mock optimal times - would analyze historical data
    const optimalHours = [9, 10, 11, 14, 15, 19, 20];
    const optimalDays = [1, 2, 3, 4, 5]; // Weekdays
    
    let score = 0.5;
    if (optimalHours.includes(hour)) score += 0.3;
    if (optimalDays.includes(dayOfWeek)) score += 0.2;
    
    return Math.min(1, score);
  }

  private getBaselineEngagement(historicalData: any[]): number {
    if (historicalData.length === 0) return 50;
    return 75; // Mock baseline
  }

  private async generateContentRecommendations(contentData: any, _historicalData: any[]) {
    const recommendations = [];
    
    if (contentData.text.length > 280) {
      recommendations.push('Consider shortening your content for better engagement');
    }
    
    if (!contentData.hashtags || contentData.hashtags.length < 3) {
      recommendations.push('Add 3-5 relevant hashtags to increase discoverability');
    }
    
    if (!contentData.text.includes('?')) {
      recommendations.push('Consider adding a question to encourage engagement');
    }
    
    return recommendations;
  }

  private calculateViralityScore(_post: any): number {
    // Mock virality calculation - would use real engagement metrics
    return Math.floor(Math.random() * 100) + 50;
  }
}

export const analyticsService = new AnalyticsService();
export { AdvancedMetrics, RealTimeAlert, ComprehensiveDashboard };