import { BaseAgent } from './base-agent';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../utils/logger';

const prisma = new PrismaClient();

export class AnalyticsAdvisorAgent extends BaseAgent {
  constructor() {
    super('analytics-advisor', 'AI agent specialized in analyzing social media performance and providing insights');
    this.capabilities = [
      'performance_analysis',
      'trend_detection',
      'anomaly_detection',
      'predictive_analytics',
      'report_generation',
      'competitive_analysis',
    ];
  }

  async analyzePerformance(params: {
    timeframe: string;
    metrics: string[];
    platforms?: string[];
  }): Promise<any> {
    try {
      const dateRange = this.getDateRange(params.timeframe);

      // Get posts within timeframe
      const posts = await prisma.post.findMany({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
          ...(params.platforms && { platforms: { hasSome: params.platforms } }),
        },
        include: {
          metrics: true,
        },
      });

      // Calculate aggregate metrics
      const aggregateMetrics = this.calculateAggregateMetrics(posts, params.metrics);

      // Identify trends
      const trends = this.identifyTrends(posts);

      // Generate insights
      const insights = this.generateInsights(aggregateMetrics, trends);

      return {
        success: true,
        data: {
          timeframe: params.timeframe,
          dateRange,
          metrics: aggregateMetrics,
          trends,
          insights,
          postsAnalyzed: posts.length,
        },
      };
    } catch (error) {
      logger.error('Error analyzing performance:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getHistoricalEngagement(params: {
    platform: string;
    timezone?: string;
  }): Promise<any> {
    try {
      const posts = await prisma.post.findMany({
        where: {
          platforms: { has: params.platform },
          metrics: { isNot: null },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const engagementByHour = new Array(24).fill(0).map(() => ({
        total: 0,
        count: 0,
      }));

      posts.forEach(post => {
        const hour = new Date(post.createdAt).getHours();
        const engagement = (post.metrics as any)?.engagement || 0;
        engagementByHour[hour].total += engagement;
        engagementByHour[hour].count += 1;
      });

      const patterns = engagementByHour.map((data, hour) => ({
        hour,
        avgEngagement: data.count > 0 ? data.total / data.count : 0,
        postCount: data.count,
      }));

      return {
        success: true,
        data: {
          platform: params.platform,
          patterns,
          bestHours: patterns
            .sort((a, b) => b.avgEngagement - a.avgEngagement)
            .slice(0, 3)
            .map(p => p.hour),
        },
      };
    } catch (error) {
      logger.error('Error getting historical engagement:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async generateReport(context: any): Promise<any> {
    try {
      const weeklyData = await this.analyzePerformance({
        timeframe: 'week',
        metrics: ['engagement', 'reach', 'clicks', 'conversions'],
      });

      const topPosts = await prisma.post.findMany({
        where: {
          createdAt: {
            gte: this.getDateRange('week').start,
          },
        },
        orderBy: {
          metrics: {
            path: '$.engagement',
            order: 'desc',
          },
        },
        take: 5,
      });

      const recommendations = this.generateRecommendations(weeklyData.data);

      return {
        success: true,
        data: {
          report: {
            period: 'Weekly Report',
            generatedAt: new Date(),
            summary: weeklyData.data,
            topPerformers: topPosts,
            recommendations,
            nextSteps: this.generateActionItems(recommendations),
          },
        },
      };
    } catch (error) {
      logger.error('Error generating report:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getOverview(): Promise<any> {
    try {
      const today = this.getDateRange('today');
      const week = this.getDateRange('week');
      const month = this.getDateRange('month');

      const [todayPosts, weekPosts, monthPosts] = await Promise.all([
        prisma.post.count({ where: { createdAt: { gte: today.start } } }),
        prisma.post.count({ where: { createdAt: { gte: week.start } } }),
        prisma.post.count({ where: { createdAt: { gte: month.start } } }),
      ]);

      const recentPosts = await prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { metrics: true },
      });

      const totalEngagement = recentPosts.reduce((sum, post) => {
        return sum + ((post.metrics as any)?.engagement || 0);
      }, 0);

      return {
        overview: {
          postsToday: todayPosts,
          postsThisWeek: weekPosts,
          postsThisMonth: monthPosts,
          totalEngagement,
          avgEngagement: recentPosts.length > 0 ? totalEngagement / recentPosts.length : 0,
        },
        recentActivity: recentPosts.slice(0, 5),
      };
    } catch (error) {
      logger.error('Error getting overview:', error);
      return { overview: {}, recentActivity: [] };
    }
  }

  async processCommand(command: string): Promise<any> {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('analyze') || lowerCommand.includes('performance')) {
      let timeframe = 'week';
      if (lowerCommand.includes('today')) timeframe = 'today';
      else if (lowerCommand.includes('month')) timeframe = 'month';
      else if (lowerCommand.includes('year')) timeframe = 'year';

      return this.analyzePerformance({
        timeframe,
        metrics: ['engagement', 'reach', 'clicks'],
      });
    } else if (lowerCommand.includes('report')) {
      return this.generateReport({});
    } else if (lowerCommand.includes('trends')) {
      return this.detectTrends({});
    }

    return {
      success: false,
      error: 'Could not understand the analytics command',
    };
  }

  private getDateRange(timeframe: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (timeframe) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return { start, end };
  }

  private calculateAggregateMetrics(posts: any[], metricNames: string[]): any {
    const metrics: any = {};

    metricNames.forEach(name => {
      metrics[name] = {
        total: 0,
        average: 0,
        max: 0,
        min: Infinity,
      };
    });

    posts.forEach(post => {
      if (!post.metrics) return;

      metricNames.forEach(name => {
        const value = (post.metrics as any)[name] || 0;
        metrics[name].total += value;
        metrics[name].max = Math.max(metrics[name].max, value);
        metrics[name].min = Math.min(metrics[name].min, value);
      });
    });

    metricNames.forEach(name => {
      if (posts.length > 0) {
        metrics[name].average = metrics[name].total / posts.length;
      }
      if (metrics[name].min === Infinity) {
        metrics[name].min = 0;
      }
    });

    return metrics;
  }

  private identifyTrends(posts: any[]): any {
    if (posts.length < 2) return { trend: 'insufficient_data' };

    // Sort posts by date
    const sortedPosts = posts.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Calculate engagement trend
    const firstHalf = sortedPosts.slice(0, Math.floor(posts.length / 2));
    const secondHalf = sortedPosts.slice(Math.floor(posts.length / 2));

    const firstHalfAvg = this.calculateAvgEngagement(firstHalf);
    const secondHalfAvg = this.calculateAvgEngagement(secondHalf);

    const trendDirection = secondHalfAvg > firstHalfAvg ? 'increasing' :
                          secondHalfAvg < firstHalfAvg ? 'decreasing' : 'stable';
    const trendStrength = Math.abs(secondHalfAvg - firstHalfAvg) / firstHalfAvg;

    return {
      direction: trendDirection,
      strength: trendStrength,
      firstPeriodAvg: firstHalfAvg,
      secondPeriodAvg: secondHalfAvg,
    };
  }

  private calculateAvgEngagement(posts: any[]): number {
    if (posts.length === 0) return 0;
    const total = posts.reduce((sum, post) => {
      return sum + ((post.metrics as any)?.engagement || 0);
    }, 0);
    return total / posts.length;
  }

  private generateInsights(metrics: any, trends: any): string[] {
    const insights = [];

    // Engagement insights
    if (metrics.engagement) {
      if (metrics.engagement.average > 100) {
        insights.push('High engagement rate indicates strong content resonance');
      } else if (metrics.engagement.average < 50) {
        insights.push('Low engagement suggests content strategy needs adjustment');
      }
    }

    // Trend insights
    if (trends.direction === 'increasing') {
      insights.push(`Performance is improving with ${(trends.strength * 100).toFixed(1)}% growth`);
    } else if (trends.direction === 'decreasing') {
      insights.push(`Performance is declining by ${(trends.strength * 100).toFixed(1)}%`);
    }

    // Reach insights
    if (metrics.reach && metrics.reach.average > 1000) {
      insights.push('Strong reach indicates good content distribution');
    }

    return insights;
  }

  private generateRecommendations(data: any): string[] {
    const recommendations = [];

    if (data.trends?.direction === 'decreasing') {
      recommendations.push('Consider refreshing content strategy');
      recommendations.push('Analyze top-performing content for patterns');
      recommendations.push('Experiment with posting times');
    }

    if (data.metrics?.engagement?.average < 50) {
      recommendations.push('Increase use of visual content');
      recommendations.push('Add more calls-to-action');
      recommendations.push('Engage more with audience comments');
    }

    if (data.metrics?.reach?.average < 500) {
      recommendations.push('Use more relevant hashtags');
      recommendations.push('Cross-promote on other platforms');
      recommendations.push('Collaborate with other accounts');
    }

    return recommendations;
  }

  private generateActionItems(recommendations: string[]): string[] {
    return recommendations.map(rec => {
      if (rec.includes('content strategy')) {
        return 'Schedule content strategy review meeting';
      } else if (rec.includes('visual content')) {
        return 'Create 5 new visual posts this week';
      } else if (rec.includes('hashtags')) {
        return 'Research and implement new hashtag strategy';
      } else {
        return `Action: ${rec}`;
      }
    });
  }

  private async detectTrends(context: any): Promise<any> {
    const posts = await prisma.post.findMany({
      where: { createdAt: { gte: this.getDateRange('month').start } },
      orderBy: { createdAt: 'desc' },
      include: { metrics: true },
    });

    const trends = this.identifyTrends(posts);
    const patterns = this.detectPatterns(posts);

    return {
      success: true,
      data: {
        trends,
        patterns,
        recommendations: this.generateRecommendations({ trends, metrics: {} }),
      },
    };
  }

  private detectPatterns(posts: any[]): any {
    const dayPattern = new Array(7).fill(0).map(() => ({ total: 0, count: 0 }));
    const hourPattern = new Array(24).fill(0).map(() => ({ total: 0, count: 0 }));

    posts.forEach(post => {
      const date = new Date(post.createdAt);
      const day = date.getDay();
      const hour = date.getHours();
      const engagement = (post.metrics as any)?.engagement || 0;

      dayPattern[day].total += engagement;
      dayPattern[day].count += 1;
      hourPattern[hour].total += engagement;
      hourPattern[hour].count += 1;
    });

    return {
      bestDays: this.findBestPeriods(dayPattern, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
      bestHours: this.findBestPeriods(hourPattern, Array.from({ length: 24 }, (_, i) => `${i}:00`)),
    };
  }

  private findBestPeriods(pattern: any[], labels: string[]): any[] {
    return pattern
      .map((data, index) => ({
        period: labels[index],
        avgEngagement: data.count > 0 ? data.total / data.count : 0,
        postCount: data.count,
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3);
  }
}