import { prisma } from './database';
import { getRedis } from './redis';
import { SocialPlatform, PostStatus } from '@prisma/client';
import { analyticsService } from './analytics.service';

interface EngagementEvent {
  id: string;
  type: 'like' | 'comment' | 'share' | 'save' | 'mention' | 'dm';
  postId?: string;
  userId?: string;
  platform: SocialPlatform;
  timestamp: Date;
  data: any;
  organizationId: string;
}

interface EngagementAlert {
  id: string;
  type: 'spike' | 'viral' | 'negative_sentiment' | 'influencer_mention' | 'competitor_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  platform: SocialPlatform;
  timestamp: Date;
  data: any;
  organizationId: string;
  read: boolean;
}

interface RealTimeMetrics {
  timestamp: Date;
  organizationId: string;
  metrics: {
    activeUsers: number;
    engagementsLastHour: number;
    newFollowers: number;
    mentionsCount: number;
    sentimentScore: number;
    topPerformingPost?: {
      id: string;
      content: string;
      engagement: number;
      platform: SocialPlatform;
    };
  };
  alerts: EngagementAlert[];
  trends: {
    engagement: number; // percentage change
    followers: number;
    mentions: number;
  };
}

interface NotificationPreferences {
  organizationId: string;
  engagementSpikes: boolean;
  viralContent: boolean;
  negativeSentiment: boolean;
  influencerMentions: boolean;
  competitorActivity: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
  thresholds: {
    engagementSpike: number; // percentage increase
    viralThreshold: number; // engagement count
    sentimentThreshold: number; // negative sentiment percentage
  };
}

export class EngagementMonitoringService {
  private eventListeners = new Map<string, ((event: EngagementEvent) => void)[]>();
  private alertListeners = new Map<string, ((alert: EngagementAlert) => void)[]>();

  // Real-time engagement tracking
  async trackEngagement(event: EngagementEvent) {
    try {
      // Store the event
      await this.storeEngagementEvent(event);
      
      // Update real-time metrics
      await this.updateRealTimeMetrics(event);
      
      // Check for alerts
      const alerts = await this.checkForAlerts(event);
      
      // Notify listeners
      this.notifyEventListeners(event.organizationId, event);
      
      // Send alerts if any
      for (const alert of alerts) {
        await this.sendAlert(alert);
      }
      
      // Update analytics cache
      await this.updateAnalyticsCache(event.organizationId);
      
      return { success: true, alertsTriggered: alerts.length };
    } catch (error) {
      console.error('Error tracking engagement:', error);
      throw error;
    }
  }

  // Real-time metrics streaming
  async *streamRealTimeMetrics(organizationId: string): AsyncGenerator<RealTimeMetrics> {
    let previousMetrics: RealTimeMetrics | null = null;
    
    while (true) {
      try {
        const currentMetrics = await this.getCurrentMetrics(organizationId);
        const alerts = await this.getActiveAlerts(organizationId);
        const trends = this.calculateTrends(currentMetrics, previousMetrics);
        
        const realTimeData: RealTimeMetrics = {
          timestamp: new Date(),
          organizationId,
          metrics: currentMetrics,
          alerts,
          trends,
        };
        
        yield realTimeData;
        previousMetrics = realTimeData;
        
        // Wait 5 seconds before next update
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('Real-time metrics error:', error);
        yield {
          timestamp: new Date(),
          organizationId,
          metrics: {
            activeUsers: 0,
            engagementsLastHour: 0,
            newFollowers: 0,
            mentionsCount: 0,
            sentimentScore: 0,
          },
          alerts: [],
          trends: { engagement: 0, followers: 0, mentions: 0 },
        };
      }
    }
  }

  // Engagement spike detection
  async detectEngagementSpike(organizationId: string, currentEngagement: number): Promise<EngagementAlert | null> {
    const redis = getRedis();
    const previousEngagementKey = `engagement_baseline:${organizationId}`;
    const previousEngagement = await redis.get(previousEngagementKey);
    
    if (!previousEngagement) {
      // Store current as baseline
      await redis.setex(previousEngagementKey, 3600, currentEngagement.toString());
      return null;
    }
    
    const baseline = parseInt(previousEngagement);
    const increasePercentage = ((currentEngagement - baseline) / baseline) * 100;
    
    // Check if it's a significant spike (>200% increase)
    if (increasePercentage > 200) {
      return {
        id: `spike_${Date.now()}`,
        type: 'spike',
        severity: increasePercentage > 500 ? 'critical' : 'high',
        title: 'Engagement Spike Detected!',
        message: `Your content is receiving ${increasePercentage.toFixed(0)}% more engagement than usual`,
        platform: SocialPlatform.INSTAGRAM, // Would determine dynamically
        timestamp: new Date(),
        data: {
          currentEngagement,
          previousEngagement: baseline,
          increasePercentage,
        },
        organizationId,
        read: false,
      };
    }
    
    return null;
  }

  // Viral content detection
  async detectViralContent(organizationId: string): Promise<EngagementAlert[]> {
    const alerts: EngagementAlert[] = [];
    
    // Get recent posts with high engagement
    const recentPosts = await prisma.post.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(Date.now() - 6 * 60 * 60 * 1000), // Last 6 hours
        },
        status: PostStatus.PUBLISHED,
      },
      include: {
        socialAccount: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    for (const post of recentPosts) {
      // Mock engagement data - in production would come from platform APIs
      const engagement = Math.floor(Math.random() * 1000) + 100;
      const followerCount = 10000; // Mock follower count
      const viralThreshold = followerCount * 0.1; // 10% of followers
      
      if (engagement > viralThreshold) {
        alerts.push({
          id: `viral_${post.id}`,
          type: 'viral',
          severity: 'high',
          title: 'Content Going Viral! 🚀',
          message: `Your ${post.socialAccount.platform} post is trending with ${engagement} engagements`,
          platform: post.socialAccount.platform,
          timestamp: new Date(),
          data: {
            postId: post.id,
            content: post.content.substring(0, 100),
            engagement,
            viralityScore: (engagement / followerCount) * 100,
          },
          organizationId,
          read: false,
        });
      }
    }
    
    return alerts;
  }

  // Sentiment monitoring
  async monitorSentiment(organizationId: string): Promise<EngagementAlert[]> {
    const alerts: EngagementAlert[] = [];
    
    // Get recent mentions and comments
    const sentimentData = await analyticsService.analyzeSentiment(organizationId);
    const negativeSentimentPercentage = (sentimentData.negative / 
      (sentimentData.positive + sentimentData.negative + sentimentData.neutral)) * 100;
    
    // Alert if negative sentiment is above 40%
    if (negativeSentimentPercentage > 40) {
      alerts.push({
        id: `sentiment_${Date.now()}`,
        type: 'negative_sentiment',
        severity: negativeSentimentPercentage > 60 ? 'critical' : 'high',
        title: 'High Negative Sentiment Detected',
        message: `${negativeSentimentPercentage.toFixed(1)}% of recent mentions are negative`,
        platform: SocialPlatform.INSTAGRAM, // Would aggregate across platforms
        timestamp: new Date(),
        data: {
          negativeSentimentPercentage,
          totalMentions: sentimentData.positive + sentimentData.negative + sentimentData.neutral,
          trendingTopics: sentimentData.trending,
        },
        organizationId,
        read: false,
      });
    }
    
    return alerts;
  }

  // Competitor activity monitoring
  async monitorCompetitors(organizationId: string): Promise<EngagementAlert[]> {
    const alerts: EngagementAlert[] = [];
    
    // Mock competitor activity detection
    const competitorActivity = Math.random();
    
    if (competitorActivity > 0.8) { // 20% chance of competitor alert
      alerts.push({
        id: `competitor_${Date.now()}`,
        type: 'competitor_activity',
        severity: 'medium',
        title: 'Competitor Activity Alert',
        message: 'A competitor just posted content similar to your recent campaign',
        platform: SocialPlatform.INSTAGRAM,
        timestamp: new Date(),
        data: {
          competitorName: 'Competitor A',
          similarityScore: 85,
          competitorEngagement: 500,
        },
        organizationId,
        read: false,
      });
    }
    
    return alerts;
  }

  // Notification management
  async sendAlert(alert: EngagementAlert) {
    try {
      // Store alert in database
      await this.storeAlert(alert);
      
      // Get notification preferences
      const preferences = await this.getNotificationPreferences(alert.organizationId);
      
      // Send notifications based on preferences
      if (preferences?.email) {
        await this.sendEmailNotification(alert);
      }
      
      if (preferences?.push) {
        await this.sendPushNotification(alert);
      }
      
      // Notify real-time listeners
      this.notifyAlertListeners(alert.organizationId, alert);
      
    } catch (error) {
      console.error('Error sending alert:', error);
    }
  }

  // Subscribe to real-time events
  subscribeToEvents(organizationId: string, callback: (event: EngagementEvent) => void) {
    if (!this.eventListeners.has(organizationId)) {
      this.eventListeners.set(organizationId, []);
    }
    this.eventListeners.get(organizationId)!.push(callback);
  }

  subscribeToAlerts(organizationId: string, callback: (alert: EngagementAlert) => void) {
    if (!this.alertListeners.has(organizationId)) {
      this.alertListeners.set(organizationId, []);
    }
    this.alertListeners.get(organizationId)!.push(callback);
  }

  // Private helper methods
  private async storeEngagementEvent(event: EngagementEvent) {
    const redis = getRedis();
    const key = `engagement_events:${event.organizationId}`;
    
    if ('lpush' in redis && 'ltrim' in redis) {
      await redis.lpush(key, JSON.stringify(event));
      await redis.ltrim(key, 0, 999); // Keep only last 1000 events
    }
    await redis.expire(key, 86400); // Expire after 24 hours
  }

  private async updateRealTimeMetrics(event: EngagementEvent) {
    const redis = getRedis();
    const key = `realtime_metrics:${event.organizationId}`;
    
    // Increment engagement counter
    if ('hincrby' in redis) {
      await redis.hincrby(key, 'engagements_hour', 1);
    }
    await redis.expire(key, 3600); // Expire after 1 hour
  }

  private async checkForAlerts(event: EngagementEvent): Promise<EngagementAlert[]> {
    const alerts: EngagementAlert[] = [];
    
    // Get current engagement metrics
    const currentMetrics = await this.getCurrentMetrics(event.organizationId);
    
    // Check for engagement spike
    const spikeAlert = await this.detectEngagementSpike(event.organizationId, currentMetrics.engagementsLastHour);
    if (spikeAlert) alerts.push(spikeAlert);
    
    // Check for viral content
    const viralAlerts = await this.detectViralContent(event.organizationId);
    alerts.push(...viralAlerts);
    
    // Check sentiment
    const sentimentAlerts = await this.monitorSentiment(event.organizationId);
    alerts.push(...sentimentAlerts);
    
    // Check competitor activity
    const competitorAlerts = await this.monitorCompetitors(event.organizationId);
    alerts.push(...competitorAlerts);
    
    return alerts;
  }

  private notifyEventListeners(organizationId: string, event: EngagementEvent) {
    const listeners = this.eventListeners.get(organizationId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  private notifyAlertListeners(organizationId: string, alert: EngagementAlert) {
    const listeners = this.alertListeners.get(organizationId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(alert);
        } catch (error) {
          console.error('Error in alert listener:', error);
        }
      });
    }
  }

  private async getCurrentMetrics(organizationId: string) {
    const redis = getRedis();
    const metricsKey = `realtime_metrics:${organizationId}`;
    
    // Get real-time data from Redis
    const engagementsLastHour = ('hget' in redis) ? 
      await redis.hget(metricsKey, 'engagements_hour') || '0' : '0';
    
    // Get additional metrics from database
    const accountsQuery = await prisma.socialAccount.count({
      where: { organizationId, status: 'ACTIVE' },
    });
    
    // Mock additional metrics
    return {
      activeUsers: accountsQuery || Math.floor(Math.random() * 500) + 100,
      engagementsLastHour: parseInt(engagementsLastHour),
      newFollowers: Math.floor(Math.random() * 50) + 10,
      mentionsCount: Math.floor(Math.random() * 20) + 5,
      sentimentScore: Math.floor(Math.random() * 40) + 60, // 60-100 range
      topPerformingPost: await this.getTopPerformingPost(organizationId),
    };
  }

  private async getActiveAlerts(organizationId: string): Promise<EngagementAlert[]> {
    const redis = getRedis();
    const alertsKey = `active_alerts:${organizationId}`;
    
    const alertsData = ('lrange' in redis) ? await redis.lrange(alertsKey, 0, -1) : [];
    return alertsData.map((data: string) => JSON.parse(data));
  }

  private calculateTrends(current: any, previous: RealTimeMetrics | null) {
    if (!previous) {
      return { engagement: 0, followers: 0, mentions: 0 };
    }
    
    return {
      engagement: this.calculatePercentageChange(
        current.engagementsLastHour, 
        previous.metrics.engagementsLastHour
      ),
      followers: this.calculatePercentageChange(
        current.newFollowers, 
        previous.metrics.newFollowers
      ),
      mentions: this.calculatePercentageChange(
        current.mentionsCount, 
        previous.metrics.mentionsCount
      ),
    };
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private async getTopPerformingPost(organizationId: string) {
    const post = await prisma.post.findFirst({
      where: { organizationId },
      include: { socialAccount: true },
      orderBy: { createdAt: 'desc' },
    });
    
    if (!post) return undefined;
    
    return {
      id: post.id,
      content: post.content.substring(0, 100),
      engagement: Math.floor(Math.random() * 200) + 50,
      platform: post.socialAccount.platform,
    };
  }

  private async updateAnalyticsCache(organizationId: string) {
    const redis = getRedis();
    const cacheKey = `analytics_cache:${organizationId}`;
    
    // Invalidate analytics cache to force refresh
    await redis.del(cacheKey);
  }

  private async storeAlert(alert: EngagementAlert) {
    const redis = getRedis();
    const alertsKey = `active_alerts:${alert.organizationId}`;
    
    if ('lpush' in redis && 'ltrim' in redis) {
      await redis.lpush(alertsKey, JSON.stringify(alert));
      await redis.ltrim(alertsKey, 0, 49); // Keep only last 50 alerts
    }
    await redis.expire(alertsKey, 86400); // Expire after 24 hours
  }

  private async getNotificationPreferences(organizationId: string): Promise<NotificationPreferences | null> {
    // Mock preferences - in production would come from database
    return {
      organizationId,
      engagementSpikes: true,
      viralContent: true,
      negativeSentiment: true,
      influencerMentions: true,
      competitorActivity: false,
      email: true,
      push: true,
      sms: false,
      thresholds: {
        engagementSpike: 200,
        viralThreshold: 1000,
        sentimentThreshold: 40,
      },
    };
  }

  private async sendEmailNotification(alert: EngagementAlert) {
    // Mock email sending - would integrate with email service
    console.log(`📧 Email notification sent for ${alert.type}: ${alert.message}`);
  }

  private async sendPushNotification(alert: EngagementAlert) {
    // Mock push notification - would integrate with push service
    console.log(`📱 Push notification sent for ${alert.type}: ${alert.message}`);
  }
}

export const engagementMonitoringService = new EngagementMonitoringService();
export { EngagementEvent, EngagementAlert, RealTimeMetrics, NotificationPreferences };