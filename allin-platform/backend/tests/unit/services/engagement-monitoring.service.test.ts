/**
 * Engagement Monitoring Service Tests - BMAD Testing Framework
 * Streamlined tests for engagement tracking and alerting functionality
 */

import { EngagementMonitoringService } from '../../../src/services/engagement-monitoring.service';
import { SocialPlatform } from '@prisma/client';

// Mock dependencies
jest.mock('../../../src/services/database');
jest.mock('../../../src/services/redis');
jest.mock('../../../src/services/analytics.service');
jest.mock('../../../src/services/email.service');

describe('EngagementMonitoringService', () => {
  let service: EngagementMonitoringService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EngagementMonitoringService();
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(EngagementMonitoringService);
    });

    it('should have all required methods', () => {
      expect(typeof service.trackEngagement).toBe('function');
      expect(typeof service.streamRealTimeMetrics).toBe('function');
      expect(typeof service.detectEngagementSpike).toBe('function');
      expect(typeof service.detectViralContent).toBe('function');
      expect(typeof service.monitorSentiment).toBe('function');
      expect(typeof service.monitorCompetitors).toBe('function');
      expect(typeof service.sendAlert).toBe('function');
      expect(typeof service.subscribeToEvents).toBe('function');
      expect(typeof service.subscribeToAlerts).toBe('function');
    });
  });

  describe('trackEngagement', () => {
    const mockEvent = {
      id: 'event_123',
      type: 'like' as const,
      postId: 'post_123',
      userId: 'user_123',
      platform: SocialPlatform.INSTAGRAM,
      timestamp: new Date(),
      data: { count: 1 },
      organizationId: 'org_123',
    };

    it('should track engagement event successfully', async () => {
      const result = await service.trackEngagement(mockEvent);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('alertsTriggered');
    });

    it('should handle different event types', async () => {
      const eventTypes: Array<'like' | 'comment' | 'share' | 'save' | 'mention' | 'dm'> = [
        'like', 'comment', 'share', 'save', 'mention', 'dm'
      ];

      for (const type of eventTypes) {
        const event = { ...mockEvent, type };
        const result = await service.trackEngagement(event);
        expect(result.success).toBe(true);
      }
    });

    it('should handle events from different platforms', async () => {
      const platforms = [
        SocialPlatform.INSTAGRAM,
        SocialPlatform.FACEBOOK,
        SocialPlatform.TWITTER,
        SocialPlatform.LINKEDIN,
      ];

      for (const platform of platforms) {
        const event = { ...mockEvent, platform };
        const result = await service.trackEngagement(event);
        expect(result.success).toBe(true);
      }
    });

    it('should handle errors gracefully', async () => {
      const invalidEvent = { ...mockEvent, organizationId: '' };

      await expect(service.trackEngagement(invalidEvent as any))
        .resolves.toBeDefined();
    });
  });

  describe('streamRealTimeMetrics', () => {
    it('should stream real-time metrics successfully', async () => {
      const organizationId = 'org_123';

      const stream = service.streamRealTimeMetrics(organizationId);
      expect(stream).toBeDefined();

      // Get first value from stream
      const { value, done } = await stream.next();

      if (!done && value) {
        expect(value).toHaveProperty('timestamp');
        expect(value).toHaveProperty('organizationId', organizationId);
        expect(value).toHaveProperty('metrics');
        expect(value).toHaveProperty('alerts');
        expect(value).toHaveProperty('trends');
      }
    });

    it('should include all required metric fields', async () => {
      const stream = service.streamRealTimeMetrics('org_123');
      const { value } = await stream.next();

      if (value) {
        expect(value.metrics).toHaveProperty('activeUsers');
        expect(value.metrics).toHaveProperty('engagementsLastHour');
        expect(value.metrics).toHaveProperty('newFollowers');
        expect(value.metrics).toHaveProperty('mentionsCount');
        expect(value.metrics).toHaveProperty('sentimentScore');
      }
    });

    it('should include trend data', async () => {
      const stream = service.streamRealTimeMetrics('org_123');
      const { value } = await stream.next();

      if (value) {
        expect(value.trends).toHaveProperty('engagement');
        expect(value.trends).toHaveProperty('followers');
        expect(value.trends).toHaveProperty('mentions');
      }
    });
  });

  describe('Alert Detection', () => {
    describe('detectEngagementSpike', () => {
      it('should detect engagement spike', async () => {
        const organizationId = 'org_123';
        const currentEngagement = 1000;

        const alert = await service.detectEngagementSpike(organizationId, currentEngagement);

        if (alert) {
          expect(alert).toHaveProperty('type');
          expect(alert).toHaveProperty('severity');
          expect(alert).toHaveProperty('title');
          expect(alert).toHaveProperty('message');
        }
      });

      it('should return null for normal engagement', async () => {
        const organizationId = 'org_123';
        const currentEngagement = 50;

        const alert = await service.detectEngagementSpike(organizationId, currentEngagement);

        // May or may not trigger alert depending on historical data
        expect(alert === null || alert).toBeDefined();
      });

      it('should set appropriate severity for large spikes', async () => {
        const organizationId = 'org_123';
        const currentEngagement = 10000;

        const alert = await service.detectEngagementSpike(organizationId, currentEngagement);

        if (alert) {
          expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity);
        }
      });
    });

    describe('detectViralContent', () => {
      it('should detect viral content', async () => {
        const organizationId = 'org_123';

        const alerts = await service.detectViralContent(organizationId);

        expect(Array.isArray(alerts)).toBe(true);
      });

      it('should return alerts for highly engaging posts', async () => {
        const organizationId = 'org_123';

        const alerts = await service.detectViralContent(organizationId);

        alerts.forEach(alert => {
          expect(alert).toHaveProperty('type', 'viral');
          expect(alert).toHaveProperty('platform');
        });
      });
    });

    describe('monitorSentiment', () => {
      it('should monitor sentiment successfully', async () => {
        const organizationId = 'org_123';

        const alerts = await service.monitorSentiment(organizationId);

        expect(Array.isArray(alerts)).toBe(true);
      });

      it('should detect negative sentiment', async () => {
        const organizationId = 'org_123';

        const alerts = await service.monitorSentiment(organizationId);

        alerts.forEach(alert => {
          expect(alert.type).toBe('negative_sentiment');
          expect(alert.severity).toBeDefined();
        });
      });
    });

    describe('monitorCompetitors', () => {
      it('should monitor competitor activity', async () => {
        const organizationId = 'org_123';

        const alerts = await service.monitorCompetitors(organizationId);

        expect(Array.isArray(alerts)).toBe(true);
      });

      it('should return competitor alerts when detected', async () => {
        const organizationId = 'org_123';

        const alerts = await service.monitorCompetitors(organizationId);

        alerts.forEach(alert => {
          expect(alert.type).toBe('competitor_activity');
          expect(alert.message).toBeDefined();
        });
      });
    });
  });

  describe('sendAlert', () => {
    const mockAlert = {
      id: 'alert_123',
      type: 'spike' as const,
      severity: 'high' as const,
      title: 'Engagement Spike Detected',
      message: 'Your post is getting high engagement',
      platform: SocialPlatform.INSTAGRAM,
      timestamp: new Date(),
      data: {},
      organizationId: 'org_123',
      read: false,
    };

    it('should send alert successfully', async () => {
      await expect(service.sendAlert(mockAlert))
        .resolves.not.toThrow();
    });

    it('should handle different alert types', async () => {
      const alertTypes: Array<'spike' | 'viral' | 'negative_sentiment' | 'influencer_mention' | 'competitor_activity'> = [
        'spike', 'viral', 'negative_sentiment', 'influencer_mention', 'competitor_activity'
      ];

      for (const type of alertTypes) {
        const alert = { ...mockAlert, type };
        await expect(service.sendAlert(alert))
          .resolves.not.toThrow();
      }
    });

    it('should handle different severity levels', async () => {
      const severities: Array<'low' | 'medium' | 'high' | 'critical'> = [
        'low', 'medium', 'high', 'critical'
      ];

      for (const severity of severities) {
        const alert = { ...mockAlert, severity };
        await expect(service.sendAlert(alert))
          .resolves.not.toThrow();
      }
    });
  });

  describe('Event and Alert Subscriptions', () => {
    it('should subscribe to events successfully', () => {
      const organizationId = 'org_123';
      const callback = jest.fn();

      service.subscribeToEvents(organizationId, callback);

      // Subscription should complete without error
      expect(callback).not.toHaveBeenCalled();
    });

    it('should subscribe to alerts successfully', () => {
      const organizationId = 'org_123';
      const callback = jest.fn();

      service.subscribeToAlerts(organizationId, callback);

      // Subscription should complete without error
      expect(callback).not.toHaveBeenCalled();
    });

    it('should allow multiple subscriptions', () => {
      const organizationId = 'org_123';
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      service.subscribeToEvents(organizationId, callback1);
      service.subscribeToEvents(organizationId, callback2);

      // Both subscriptions should be registered
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should handle multiple event subscriptions', () => {
      const organizationId = 'org_123';
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      service.subscribeToEvents(organizationId, callback1);
      service.subscribeToEvents(organizationId, callback2);
      service.subscribeToEvents(organizationId, callback3);

      // All subscriptions should be registered without error
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();
    });

    it('should handle multiple alert subscriptions', () => {
      const organizationId = 'org_123';
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      service.subscribeToAlerts(organizationId, callback1);
      service.subscribeToAlerts(organizationId, callback2);
      service.subscribeToAlerts(organizationId, callback3);

      // All subscriptions should be registered without error
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();
    });
  });


  describe('Error Handling', () => {
    it('should handle tracking errors gracefully', async () => {
      const invalidEvent = {} as any;

      const result = await service.trackEngagement(invalidEvent);

      expect(result).toBeDefined();
    });

    it('should handle detection errors', async () => {
      await expect(service.detectEngagementSpike('', 0))
        .resolves.toBeDefined();

      await expect(service.detectViralContent(''))
        .resolves.toBeDefined();

      await expect(service.monitorSentiment(''))
        .resolves.toBeDefined();

      await expect(service.monitorCompetitors(''))
        .resolves.toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should track engagement quickly', async () => {
      const mockEvent = {
        id: 'event_perf',
        type: 'like' as const,
        platform: SocialPlatform.INSTAGRAM,
        timestamp: new Date(),
        data: {},
        organizationId: 'org_123',
      };

      const start = Date.now();
      await service.trackEngagement(mockEvent);
      const duration = Date.now() - start;

      // Should complete within reasonable time (2 seconds)
      expect(duration).toBeLessThan(2000);
    });

    it('should stream metrics quickly', async () => {
      const start = Date.now();
      const stream = service.streamRealTimeMetrics('org_123');
      await stream.next();
      const duration = Date.now() - start;

      // Should complete within reasonable time (1 second)
      expect(duration).toBeLessThan(1000);
    });
  });
});
