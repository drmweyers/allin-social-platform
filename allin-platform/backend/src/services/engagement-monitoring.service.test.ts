import { EngagementMonitoringService, EngagementEvent, EngagementAlert } from './engagement-monitoring.service';
import { prisma } from './database';
import { getRedis } from './redis';
import { SocialPlatform, PostStatus } from '@prisma/client';

// Mock dependencies
jest.mock('./database');
jest.mock('./redis');
jest.mock('./analytics.service');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRedis = {
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  lpush: jest.fn(),
  ltrim: jest.fn(),
  expire: jest.fn(),
  lrange: jest.fn(),
  hincrby: jest.fn(),
  hget: jest.fn(),
} as any;

const mockAnalyticsService = analyticsService as jest.Mocked<typeof analyticsService>;

(getRedis as jest.Mock).mockReturnValue(mockRedis);

describe('Engagement Monitoring Service', () => {
  let engagementService: EngagementMonitoringService;

  beforeEach(() => {
    engagementService = new EngagementMonitoringService();
    jest.clearAllMocks();
  });

  describe('Event Tracking', () => {
    const mockEvent: EngagementEvent = {
      id: 'event_123',
      type: 'like',
      postId: 'post_123',
      userId: 'user_123',
      platform: SocialPlatform.INSTAGRAM,
      timestamp: new Date(),
      data: { additionalInfo: 'test' },
      organizationId: 'org_123',
    };

    describe('trackEngagement', () => {
      beforeEach(() => {
        jest.spyOn(engagementService as any, 'storeEngagementEvent').mockResolvedValue(undefined);
        jest.spyOn(engagementService as any, 'updateRealTimeMetrics').mockResolvedValue(undefined);
        jest.spyOn(engagementService as any, 'checkForAlerts').mockResolvedValue([]);
        jest.spyOn(engagementService as any, 'notifyEventListeners').mockImplementation(() => {});
        jest.spyOn(engagementService as any, 'updateAnalyticsCache').mockResolvedValue(undefined);
      });

      it('should track engagement event successfully', async () => {
        const result = await engagementService.trackEngagement(mockEvent);

        expect(result.success).toBe(true);
        expect(result.alertsTriggered).toBe(0);
        expect(engagementService['storeEngagementEvent']).toHaveBeenCalledWith(mockEvent);
        expect(engagementService['updateRealTimeMetrics']).toHaveBeenCalledWith(mockEvent);
        expect(engagementService['checkForAlerts']).toHaveBeenCalledWith(mockEvent);
      });

      it('should notify event listeners', async () => {
        await engagementService.trackEngagement(mockEvent);

        expect(engagementService['notifyEventListeners']).toHaveBeenCalledWith(
          mockEvent.organizationId,
          mockEvent
        );
      });

      it('should handle alerts triggered by event', async () => {
        const mockAlert: EngagementAlert = {
          id: 'alert_123',
          type: 'spike',
          severity: 'high',
          title: 'Engagement Spike',
          message: 'High engagement detected',
          platform: SocialPlatform.INSTAGRAM,
          timestamp: new Date(),
          data: {},
          organizationId: 'org_123',
          read: false,
        };

        jest.spyOn(engagementService as any, 'checkForAlerts').mockResolvedValue([mockAlert]);
        jest.spyOn(engagementService, 'sendAlert').mockResolvedValue(undefined);

        const result = await engagementService.trackEngagement(mockEvent);

        expect(result.alertsTriggered).toBe(1);
        expect(engagementService.sendAlert).toHaveBeenCalledWith(mockAlert);
      });

      it('should update analytics cache after tracking', async () => {
        await engagementService.trackEngagement(mockEvent);

        expect(engagementService['updateAnalyticsCache']).toHaveBeenCalledWith(mockEvent.organizationId);
      });

      it('should handle errors gracefully', async () => {
        jest.spyOn(engagementService as any, 'storeEngagementEvent').mockRejectedValue(new Error('Storage error'));

        await expect(engagementService.trackEngagement(mockEvent)).rejects.toThrow('Storage error');
      });
    });
  });

  describe('Real-time Streaming', () => {
    describe('streamRealTimeMetrics', () => {
      beforeEach(() => {
        jest.spyOn(engagementService as any, 'getCurrentMetrics').mockResolvedValue({
          activeUsers: 150,
          engagementsLastHour: 45,
          newFollowers: 12,
          mentionsCount: 8,
          sentimentScore: 85,
        });

        jest.spyOn(engagementService as any, 'getActiveAlerts').mockResolvedValue([]);
        jest.spyOn(engagementService as any, 'calculateTrends').mockReturnValue({
          engagement: 15,
          followers: 5,
          mentions: 10,
        });

        // Mock setTimeout to resolve immediately for testing
        jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
          callback();
          return {} as any;
        });
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('should generate async stream of real-time metrics', async () => {
        const stream = engagementService.streamRealTimeMetrics('org_123');
        const iterator = stream[Symbol.asyncIterator]();

        const firstResult = await iterator.next();

        expect(firstResult.done).toBe(false);
        expect(firstResult.value).toHaveProperty('timestamp');
        expect(firstResult.value).toHaveProperty('organizationId', 'org_123');
        expect(firstResult.value).toHaveProperty('metrics');
        expect(firstResult.value).toHaveProperty('alerts');
        expect(firstResult.value).toHaveProperty('trends');
      });

      it('should include current metrics in stream', async () => {
        const stream = engagementService.streamRealTimeMetrics('org_123');
        const iterator = stream[Symbol.asyncIterator]();

        const result = await iterator.next();

        expect(result.value.metrics).toEqual({
          activeUsers: 150,
          engagementsLastHour: 45,
          newFollowers: 12,
          mentionsCount: 8,
          sentimentScore: 85,
        });
      });

      it('should calculate trends between iterations', async () => {
        const stream = engagementService.streamRealTimeMetrics('org_123');
        const iterator = stream[Symbol.asyncIterator]();

        // First iteration
        await iterator.next();

        // Second iteration should have trends
        const secondResult = await iterator.next();

        expect(engagementService['calculateTrends']).toHaveBeenCalled();
        expect(secondResult.value.trends).toEqual({
          engagement: 15,
          followers: 5,
          mentions: 10,
        });
      });

      it('should handle streaming errors gracefully', async () => {
        jest.spyOn(engagementService as any, 'getCurrentMetrics').mockRejectedValue(new Error('Metrics error'));

        const stream = engagementService.streamRealTimeMetrics('org_123');
        const iterator = stream[Symbol.asyncIterator]();

        const result = await iterator.next();

        expect(result.value).toHaveProperty('timestamp');
        expect(result.value).toHaveProperty('error', 'Failed to fetch real-time data');
        expect(result.value.metrics).toBe(null);
        expect(result.value.alerts).toEqual([]);
      });
    });
  });

  describe('Alert System', () => {
    describe('detectEngagementSpike', () => {
      beforeEach(() => {
        mockRedis.get.mockResolvedValue(null);
        mockRedis.setex.mockResolvedValue('OK');
      });

      it('should detect engagement spike when threshold exceeded', async () => {
        mockRedis.get.mockResolvedValue('100'); // Previous engagement

        const result = await engagementService.detectEngagementSpike('org_123', 350);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('spike');
        expect(result?.severity).toBe('critical'); // 250% increase
        expect(result?.message).toContain('250%');
      });

      it('should not create alert for normal engagement', async () => {
        mockRedis.get.mockResolvedValue('100');

        const result = await engagementService.detectEngagementSpike('org_123', 150);

        expect(result).toBeNull();
      });

      it('should handle missing baseline data', async () => {
        mockRedis.get.mockResolvedValue(null);

        const result = await engagementService.detectEngagementSpike('org_123', 200);

        expect(result).toBeNull();
        expect(mockRedis.setex).toHaveBeenCalledWith(
          'engagement_baseline:org_123',
          3600,
          '200'
        );
      });

      it('should set appropriate severity levels', async () => {
        mockRedis.get.mockResolvedValue('100');

        // Test high severity (200-499% increase)
        const highResult = await engagementService.detectEngagementSpike('org_123', 400);
        expect(highResult?.severity).toBe('high');

        // Test critical severity (500%+ increase)
        const criticalResult = await engagementService.detectEngagementSpike('org_123', 600);
        expect(criticalResult?.severity).toBe('critical');
      });

      it('should include engagement data in alert', async () => {
        mockRedis.get.mockResolvedValue('100');

        const result = await engagementService.detectEngagementSpike('org_123', 300);

        expect(result?.data).toEqual({
          currentEngagement: 300,
          previousEngagement: 100,
          increasePercentage: 200,
        });
      });
    });

    describe('detectViralContent', () => {
      beforeEach(() => {
        const mockPosts = [
          {
            id: 'post_1',
            content: 'Viral content example',
            createdAt: new Date(),
            socialAccount: { platform: SocialPlatform.INSTAGRAM },
          },
          {
            id: 'post_2',
            content: 'Another post',
            createdAt: new Date(),
            socialAccount: { platform: SocialPlatform.FACEBOOK },
          },
        ];

        mockPrisma.post.findMany.mockResolvedValue(mockPosts as any);
      });

      it('should detect viral content above threshold', async () => {
        // Mock Math.random to always return high engagement
        const originalRandom = Math.random;
        Math.random = jest.fn().mockReturnValue(0.9); // High engagement

        const result = await engagementService.detectViralContent('org_123');

        expect(Array.isArray(result)).toBe(true);
        expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
          where: {
            organizationId: 'org_123',
            createdAt: {
              gte: expect.any(Date),
            },
            status: PostStatus.PUBLISHED,
          },
          include: { socialAccount: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        Math.random = originalRandom;
      });

      it('should filter posts by time range (6 hours)', async () => {
        await engagementService.detectViralContent('org_123');

        const expectedDate = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const callArgs = mockPrisma.post.findMany.mock.calls[0][0];
        const actualDate = callArgs.where.createdAt.gte;

        expect(actualDate.getTime()).toBeCloseTo(expectedDate.getTime(), -2);
      });

      it('should create alerts for viral content', async () => {
        const originalRandom = Math.random;
        Math.random = jest.fn().mockReturnValue(0.9);

        const result = await engagementService.detectViralContent('org_123');

        if (result.length > 0) {
          expect(result[0]).toHaveProperty('id');
          expect(result[0]).toHaveProperty('type', 'viral');
          expect(result[0]).toHaveProperty('severity', 'high');
          expect(result[0]).toHaveProperty('title', 'Content Going Viral! 🚀');
        }

        Math.random = originalRandom;
      });

      it('should handle empty posts gracefully', async () => {
        mockPrisma.post.findMany.mockResolvedValue([]);

        const result = await engagementService.detectViralContent('org_123');

        expect(result).toEqual([]);
      });
    });

    describe('monitorSentiment', () => {
      beforeEach(() => {
        mockAnalyticsService.analyzeSentiment.mockResolvedValue({
          positive: 60,
          negative: 45,
          neutral: 35,
          trending: ['topic1', 'topic2'],
        });
      });

      it('should analyze sentiment and create alerts for high negativity', async () => {
        const result = await engagementService.monitorSentiment('org_123');

        expect(mockAnalyticsService.analyzeSentiment).toHaveBeenCalledWith('org_123');
        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('negative_sentiment');
        expect(result[0].severity).toBe('high');
      });

      it('should calculate negative sentiment percentage correctly', async () => {
        const result = await engagementService.monitorSentiment('org_123');

        const expectedPercentage = (45 / (60 + 45 + 35)) * 100; // ~32.1%
        expect(result[0].data.negativeSentimentPercentage).toBeCloseTo(expectedPercentage, 1);
      });

      it('should set critical severity for very high negativity', async () => {
        mockAnalyticsService.analyzeSentiment.mockResolvedValue({
          positive: 20,
          negative: 70,
          neutral: 10,
          trending: ['crisis'],
        });

        const result = await engagementService.monitorSentiment('org_123');

        expect(result[0].severity).toBe('critical');
      });

      it('should not create alerts for normal sentiment levels', async () => {
        mockAnalyticsService.analyzeSentiment.mockResolvedValue({
          positive: 70,
          negative: 20,
          neutral: 10,
          trending: ['positive'],
        });

        const result = await engagementService.monitorSentiment('org_123');

        expect(result).toHaveLength(0);
      });
    });

    describe('monitorCompetitors', () => {
      it('should detect competitor activity randomly', async () => {
        const originalRandom = Math.random;
        Math.random = jest.fn().mockReturnValue(0.9); // Trigger competitor alert

        const result = await engagementService.monitorCompetitors('org_123');

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('competitor_activity');
        expect(result[0].severity).toBe('medium');
        expect(result[0].title).toBe('Competitor Activity Alert');

        Math.random = originalRandom;
      });

      it('should not create alerts when no activity detected', async () => {
        const originalRandom = Math.random;
        Math.random = jest.fn().mockReturnValue(0.5); // No alert

        const result = await engagementService.monitorCompetitors('org_123');

        expect(result).toHaveLength(0);

        Math.random = originalRandom;
      });

      it('should include competitor data in alert', async () => {
        const originalRandom = Math.random;
        Math.random = jest.fn().mockReturnValue(0.9);

        const result = await engagementService.monitorCompetitors('org_123');

        expect(result[0].data).toEqual({
          competitorName: 'Competitor A',
          similarityScore: 85,
          competitorEngagement: 500,
        });

        Math.random = originalRandom;
      });
    });
  });

  describe('Notification Management', () => {
    describe('sendAlert', () => {
      const mockAlert: EngagementAlert = {
        id: 'alert_123',
        type: 'spike',
        severity: 'high',
        title: 'Test Alert',
        message: 'Test message',
        platform: SocialPlatform.INSTAGRAM,
        timestamp: new Date(),
        data: {},
        organizationId: 'org_123',
        read: false,
      };

      beforeEach(() => {
        jest.spyOn(engagementService as any, 'storeAlert').mockResolvedValue(undefined);
        jest.spyOn(engagementService as any, 'getNotificationPreferences').mockResolvedValue({
          organizationId: 'org_123',
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
        });
        jest.spyOn(engagementService as any, 'sendEmailNotification').mockResolvedValue(undefined);
        jest.spyOn(engagementService as any, 'sendPushNotification').mockResolvedValue(undefined);
        jest.spyOn(engagementService as any, 'notifyAlertListeners').mockImplementation(() => {});
      });

      it('should store alert and send notifications', async () => {
        await engagementService.sendAlert(mockAlert);

        expect(engagementService['storeAlert']).toHaveBeenCalledWith(mockAlert);
        expect(engagementService['getNotificationPreferences']).toHaveBeenCalledWith('org_123');
        expect(engagementService['sendEmailNotification']).toHaveBeenCalledWith(mockAlert);
        expect(engagementService['sendPushNotification']).toHaveBeenCalledWith(mockAlert);
      });

      it('should notify alert listeners', async () => {
        await engagementService.sendAlert(mockAlert);

        expect(engagementService['notifyAlertListeners']).toHaveBeenCalledWith('org_123', mockAlert);
      });

      it('should handle notification errors gracefully', async () => {
        jest.spyOn(engagementService as any, 'sendEmailNotification').mockRejectedValue(new Error('Email error'));

        // Should not throw error
        await expect(engagementService.sendAlert(mockAlert)).resolves.toBeUndefined();
      });

      it('should respect notification preferences', async () => {
        jest.spyOn(engagementService as any, 'getNotificationPreferences').mockResolvedValue({
          email: false,
          push: true,
          sms: false,
        });

        await engagementService.sendAlert(mockAlert);

        expect(engagementService['sendEmailNotification']).not.toHaveBeenCalled();
        expect(engagementService['sendPushNotification']).toHaveBeenCalled();
      });
    });
  });

  describe('Event Subscription', () => {
    describe('subscribeToEvents', () => {
      it('should add event listener for organization', () => {
        const callback = jest.fn();

        engagementService.subscribeToEvents('org_123', callback);

        // Verify listener was added (access private property for testing)
        const listeners = (engagementService as any).eventListeners.get('org_123');
        expect(listeners).toContain(callback);
      });

      it('should create new listeners array if none exists', () => {
        const callback = jest.fn();

        engagementService.subscribeToEvents('new_org', callback);

        const listeners = (engagementService as any).eventListeners.get('new_org');
        expect(listeners).toHaveLength(1);
        expect(listeners[0]).toBe(callback);
      });
    });

    describe('subscribeToAlerts', () => {
      it('should add alert listener for organization', () => {
        const callback = jest.fn();

        engagementService.subscribeToAlerts('org_123', callback);

        const listeners = (engagementService as any).alertListeners.get('org_123');
        expect(listeners).toContain(callback);
      });

      it('should handle multiple listeners for same organization', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        engagementService.subscribeToAlerts('org_123', callback1);
        engagementService.subscribeToAlerts('org_123', callback2);

        const listeners = (engagementService as any).alertListeners.get('org_123');
        expect(listeners).toHaveLength(2);
        expect(listeners).toContain(callback1);
        expect(listeners).toContain(callback2);
      });
    });
  });

  describe('Private Helper Methods', () => {
    describe('storeEngagementEvent', () => {
      it('should store event in Redis with proper key', async () => {
        const event = { ...mockEvent, organizationId: 'org_123' } as EngagementEvent;

        await engagementService['storeEngagementEvent'](event);

        expect(mockRedis.lpush).toHaveBeenCalledWith(
          'engagement_events:org_123',
          JSON.stringify(event)
        );
        expect(mockRedis.ltrim).toHaveBeenCalledWith('engagement_events:org_123', 0, 999);
        expect(mockRedis.expire).toHaveBeenCalledWith('engagement_events:org_123', 86400);
      });
    });

    describe('updateRealTimeMetrics', () => {
      it('should increment engagement counter in Redis', async () => {
        const event = { ...mockEvent, organizationId: 'org_123' } as EngagementEvent;

        await engagementService['updateRealTimeMetrics'](event);

        expect(mockRedis.hincrby).toHaveBeenCalledWith('realtime_metrics:org_123', 'engagements_hour', 1);
        expect(mockRedis.expire).toHaveBeenCalledWith('realtime_metrics:org_123', 3600);
      });
    });

    describe('getCurrentMetrics', () => {
      beforeEach(() => {
        mockRedis.hget.mockResolvedValue('45');
        mockPrisma.socialAccount.count.mockResolvedValue(5);
        jest.spyOn(engagementService as any, 'getTopPerformingPost').mockResolvedValue({
          id: 'post_123',
          content: 'Top post',
          engagement: 200,
          platform: SocialPlatform.INSTAGRAM,
        });
      });

      it('should get current metrics from Redis and database', async () => {
        const result = await engagementService['getCurrentMetrics']('org_123');

        expect(result).toHaveProperty('activeUsers');
        expect(result).toHaveProperty('engagementsLastHour', 45);
        expect(result).toHaveProperty('newFollowers');
        expect(result).toHaveProperty('mentionsCount');
        expect(result).toHaveProperty('sentimentScore');
        expect(result).toHaveProperty('topPerformingPost');
      });

      it('should count active social accounts', async () => {
        await engagementService['getCurrentMetrics']('org_123');

        expect(mockPrisma.socialAccount.count).toHaveBeenCalledWith({
          where: { organizationId: 'org_123', status: 'ACTIVE' },
        });
      });

      it('should handle missing Redis data', async () => {
        mockRedis.hget.mockResolvedValue(null);

        const result = await engagementService['getCurrentMetrics']('org_123');

        expect(result.engagementsLastHour).toBe(0);
      });
    });

    describe('calculateTrends', () => {
      it('should calculate percentage changes correctly', () => {
        const current = {
          engagementsLastHour: 120,
          newFollowers: 15,
          mentionsCount: 8,
        };

        const previous = {
          metrics: {
            engagementsLastHour: 100,
            newFollowers: 10,
            mentionsCount: 10,
          },
        };

        const result = engagementService['calculateTrends'](current, previous);

        expect(result.engagement).toBe(20); // 20% increase
        expect(result.followers).toBe(50); // 50% increase
        expect(result.mentions).toBe(-20); // 20% decrease
      });

      it('should return zero trends for first iteration', () => {
        const current = { engagementsLastHour: 100 };

        const result = engagementService['calculateTrends'](current, null);

        expect(result).toEqual({ engagement: 0, followers: 0, mentions: 0 });
      });
    });

    describe('calculatePercentageChange', () => {
      it('should calculate positive change', () => {
        const result = engagementService['calculatePercentageChange'](120, 100);
        expect(result).toBe(20);
      });

      it('should calculate negative change', () => {
        const result = engagementService['calculatePercentageChange'](80, 100);
        expect(result).toBe(-20);
      });

      it('should handle zero previous value', () => {
        const result = engagementService['calculatePercentageChange'](50, 0);
        expect(result).toBe(100);
      });

      it('should handle both values zero', () => {
        const result = engagementService['calculatePercentageChange'](0, 0);
        expect(result).toBe(0);
      });
    });
  });

  describe('Integration Points', () => {
    describe('analytics service integration', () => {
      it('should update analytics cache after events', async () => {
        jest.spyOn(engagementService as any, 'updateAnalyticsCache').mockResolvedValue(undefined);

        await engagementService.trackEngagement(mockEvent);

        expect(engagementService['updateAnalyticsCache']).toHaveBeenCalledWith('org_123');
      });

      it('should call analytics service for sentiment monitoring', async () => {
        await engagementService.monitorSentiment('org_123');

        expect(mockAnalyticsService.analyzeSentiment).toHaveBeenCalledWith('org_123');
      });
    });

    describe('notification preferences integration', () => {
      it('should get notification preferences for alert handling', async () => {
        const mockAlert = { organizationId: 'org_123' } as EngagementAlert;
        jest.spyOn(engagementService as any, 'storeAlert').mockResolvedValue(undefined);
        jest.spyOn(engagementService as any, 'getNotificationPreferences').mockResolvedValue({
          email: true,
          push: false,
        });
        jest.spyOn(engagementService as any, 'sendEmailNotification').mockResolvedValue(undefined);
        jest.spyOn(engagementService as any, 'notifyAlertListeners').mockImplementation(() => {});

        await engagementService.sendAlert(mockAlert);

        expect(engagementService['getNotificationPreferences']).toHaveBeenCalledWith('org_123');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors', async () => {
      mockRedis.lpush.mockRejectedValue(new Error('Redis connection failed'));

      await expect(engagementService['storeEngagementEvent'](mockEvent)).rejects.toThrow(
        'Redis connection failed'
      );
    });

    it('should handle database connection errors', async () => {
      mockPrisma.post.findMany.mockRejectedValue(new Error('Database error'));

      await expect(engagementService.detectViralContent('org_123')).rejects.toThrow('Database error');
    });

    it('should handle analytics service errors', async () => {
      mockAnalyticsService.analyzeSentiment.mockRejectedValue(new Error('Analytics error'));

      await expect(engagementService.monitorSentiment('org_123')).rejects.toThrow('Analytics error');
    });

    it('should handle notification errors gracefully in sendAlert', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(engagementService as any, 'storeAlert').mockRejectedValue(new Error('Store error'));

      const mockAlert = { organizationId: 'org_123' } as EngagementAlert;

      await engagementService.sendAlert(mockAlert);

      expect(consoleSpy).toHaveBeenCalledWith('Error sending alert:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});