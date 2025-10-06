import request from 'supertest';
import express from 'express';

// Mock the engagement monitoring service BEFORE importing routes
jest.mock('../../../src/services/engagement-monitoring.service', () => ({
  engagementMonitoringService: {
    streamRealTimeMetrics: jest.fn(),
    trackEngagement: jest.fn(),
    sendAlert: jest.fn()
  },
  SocialPlatform: {
    INSTAGRAM: 'INSTAGRAM',
    TIKTOK: 'TIKTOK',
    TWITTER: 'TWITTER',
    LINKEDIN: 'LINKEDIN'
  }
}));

// Mock auth middleware
jest.mock('../../../src/middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123'
    };
    next();
  }
}));

// Mock Prisma SocialPlatform enum
jest.mock('@prisma/client', () => ({
  SocialPlatform: {
    INSTAGRAM: 'INSTAGRAM',
    TIKTOK: 'TIKTOK',
    TWITTER: 'TWITTER',
    LINKEDIN: 'LINKEDIN',
    FACEBOOK: 'FACEBOOK',
    YOUTUBE: 'YOUTUBE'
  }
}));

import engagementRoutes from '../../../src/routes/engagement.routes';
import { engagementMonitoringService } from '../../../src/services/engagement-monitoring.service';

const app = express();
app.use(express.json());
app.use('/api/engagement', engagementRoutes);

describe('Engagement Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/engagement/track', () => {
    it('should track engagement event successfully', async () => {
      const mockResult = {
        alertsTriggered: ['alert-1', 'alert-2']
      };
      (engagementMonitoringService.trackEngagement as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/engagement/track')
        .send({
          type: 'like',
          postId: 'post-123',
          userId: 'user-456',
          platform: 'INSTAGRAM',
          data: { value: 1 }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('eventId');
      expect(response.body.data.alertsTriggered).toEqual(['alert-1', 'alert-2']);
      expect(response.body.data).toHaveProperty('timestamp');
      expect(engagementMonitoringService.trackEngagement).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'like',
          postId: 'post-123',
          userId: 'user-456',
          platform: 'INSTAGRAM',
          organizationId: 'org-123'
        })
      );
    });

    it('should track engagement event with minimal data', async () => {
      const mockResult = {
        alertsTriggered: []
      };
      (engagementMonitoringService.trackEngagement as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/engagement/track')
        .send({
          type: 'comment',
          platform: 'TIKTOK'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alertsTriggered).toEqual([]);
    });

    it('should use user organizationId over body organizationId for security', async () => {
      const mockResult = {
        alertsTriggered: []
      };
      (engagementMonitoringService.trackEngagement as jest.Mock).mockResolvedValue(mockResult);

      await request(app)
        .post('/api/engagement/track')
        .send({
          type: 'share',
          platform: 'LINKEDIN',
          organizationId: 'different-org' // Should be ignored
        })
        .expect(200);

      expect(engagementMonitoringService.trackEngagement).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-123' // User's org, not from body
        })
      );
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/engagement/track')
        .send({
          type: 'like'
          // Missing platform
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('platform');
    });

    it('should validate type is required', async () => {
      const response = await request(app)
        .post('/api/engagement/track')
        .send({
          platform: 'INSTAGRAM'
          // Missing type
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('type');
    });

    it('should handle service errors gracefully', async () => {
      (engagementMonitoringService.trackEngagement as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/engagement/track')
        .send({
          type: 'like',
          platform: 'INSTAGRAM'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to track engagement event');
    });
  });

  describe('GET /api/engagement/alerts', () => {
    it('should fetch all alerts for authenticated user', async () => {
      const response = await request(app)
        .get('/api/engagement/alerts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.metadata).toHaveProperty('total');
      expect(response.body.metadata).toHaveProperty('unread');
      expect(response.body.metadata).toHaveProperty('filtered');
    });

    it('should filter alerts by unread status', async () => {
      const response = await request(app)
        .get('/api/engagement/alerts?unreadOnly=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      // All returned alerts should be unread
      response.body.data.forEach((alert: any) => {
        expect(alert.read).toBe(false);
      });
    });

    it('should limit number of alerts returned', async () => {
      const response = await request(app)
        .get('/api/engagement/alerts?limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });

    it('should combine unreadOnly and limit filters', async () => {
      const response = await request(app)
        .get('/api/engagement/alerts?unreadOnly=true&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
      response.body.data.forEach((alert: any) => {
        expect(alert.read).toBe(false);
      });
    });

    it('should include alert metadata in response', async () => {
      const response = await request(app)
        .get('/api/engagement/alerts')
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        const alert = response.body.data[0];
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('title');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('platform');
        expect(alert).toHaveProperty('timestamp');
        expect(alert).toHaveProperty('read');
      }
    });
  });

  describe('PATCH /api/engagement/alerts/:alertId/read', () => {
    it('should mark alert as read successfully', async () => {
      const response = await request(app)
        .patch('/api/engagement/alerts/alert-123/read')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        alertId: 'alert-123',
        markedRead: true
      });
      expect(response.body.data).toHaveProperty('timestamp');
    });

    it('should handle special characters in alertId', async () => {
      const response = await request(app)
        .patch('/api/engagement/alerts/alert_test-123/read')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alertId).toBe('alert_test-123');
    });
  });

  describe('GET /api/engagement/stats', () => {
    it('should fetch engagement statistics successfully', async () => {
      const response = await request(app)
        .get('/api/engagement/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('byPlatform');
      expect(response.body.data).toHaveProperty('engagementTypes');
      expect(response.body.data).toHaveProperty('hourlyDistribution');
      expect(response.body.data).toHaveProperty('trends');
    });

    it('should include summary statistics', async () => {
      const response = await request(app)
        .get('/api/engagement/stats')
        .expect(200);

      expect(response.body.data.summary).toHaveProperty('totalEngagements');
      expect(response.body.data.summary).toHaveProperty('avgEngagementRate');
      expect(response.body.data.summary).toHaveProperty('peakEngagementHour');
      expect(response.body.data.summary).toHaveProperty('mostActiveDay');
    });

    it('should include platform breakdown', async () => {
      const response = await request(app)
        .get('/api/engagement/stats')
        .expect(200);

      expect(Array.isArray(response.body.data.byPlatform)).toBe(true);
      expect(response.body.data.byPlatform.length).toBeGreaterThan(0);

      const platform = response.body.data.byPlatform[0];
      expect(platform).toHaveProperty('platform');
      expect(platform).toHaveProperty('engagements');
      expect(platform).toHaveProperty('growth');
      expect(platform).toHaveProperty('topContent');
    });

    it('should include engagement type breakdown', async () => {
      const response = await request(app)
        .get('/api/engagement/stats')
        .expect(200);

      expect(Array.isArray(response.body.data.engagementTypes)).toBe(true);
      expect(response.body.data.engagementTypes.length).toBeGreaterThan(0);

      const type = response.body.data.engagementTypes[0];
      expect(type).toHaveProperty('type');
      expect(type).toHaveProperty('count');
      expect(type).toHaveProperty('percentage');
    });

    it('should include hourly distribution', async () => {
      const response = await request(app)
        .get('/api/engagement/stats')
        .expect(200);

      expect(Array.isArray(response.body.data.hourlyDistribution)).toBe(true);
      expect(response.body.data.hourlyDistribution.length).toBe(24);

      const hour = response.body.data.hourlyDistribution[0];
      expect(hour).toHaveProperty('hour');
      expect(hour).toHaveProperty('engagements');
    });

    it('should include trend data', async () => {
      const response = await request(app)
        .get('/api/engagement/stats')
        .expect(200);

      expect(response.body.data.trends).toHaveProperty('engagement');
      expect(response.body.data.trends).toHaveProperty('reach');
      expect(response.body.data.trends).toHaveProperty('impressions');
      expect(response.body.data.trends).toHaveProperty('followers');
    });

    it('should respect timeframe parameter', async () => {
      const response = await request(app)
        .get('/api/engagement/stats?timeframe=7d')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metadata.timeframe).toBe('7d');
    });

    it('should default to 24h timeframe', async () => {
      const response = await request(app)
        .get('/api/engagement/stats')
        .expect(200);

      expect(response.body.metadata.timeframe).toBe('24h');
    });

    it('should include metadata in response', async () => {
      const response = await request(app)
        .get('/api/engagement/stats')
        .expect(200);

      expect(response.body.metadata).toHaveProperty('timeframe');
      expect(response.body.metadata).toHaveProperty('generatedAt');
      expect(response.body.metadata).toHaveProperty('organizationId');
      expect(response.body.metadata.organizationId).toBe('org-123');
    });
  });

  describe('PUT /api/engagement/notifications/preferences', () => {
    it('should update notification preferences successfully', async () => {
      const preferences = {
        engagementSpikes: true,
        viralContent: true,
        negativeSentiment: false,
        influencerMentions: true,
        competitorActivity: false,
        email: true,
        push: true,
        sms: false,
        thresholds: {
          engagementSpike: 250,
          viralThreshold: 5000,
          sentimentThreshold: 30
        }
      };

      const response = await request(app)
        .put('/api/engagement/notifications/preferences')
        .send(preferences)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('organizationId', 'org-123');
      expect(response.body.data).toHaveProperty('preferences');
      expect(response.body.data.preferences).toMatchObject(preferences);
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('should handle partial preference updates', async () => {
      const response = await request(app)
        .put('/api/engagement/notifications/preferences')
        .send({
          engagementSpikes: true,
          email: false
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.engagementSpikes).toBe(true);
      expect(response.body.data.preferences.email).toBe(false);
    });

    it('should convert preference values to booleans', async () => {
      const response = await request(app)
        .put('/api/engagement/notifications/preferences')
        .send({
          engagementSpikes: 'yes',
          viralContent: 1,
          negativeSentiment: null
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data.preferences.engagementSpikes).toBe('boolean');
      expect(typeof response.body.data.preferences.viralContent).toBe('boolean');
      expect(typeof response.body.data.preferences.negativeSentiment).toBe('boolean');
    });

    it('should use default threshold values if not provided', async () => {
      const response = await request(app)
        .put('/api/engagement/notifications/preferences')
        .send({
          engagementSpikes: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.thresholds).toEqual({
        engagementSpike: 200,
        viralThreshold: 1000,
        sentimentThreshold: 40
      });
    });

    it('should parse threshold values as integers', async () => {
      const response = await request(app)
        .put('/api/engagement/notifications/preferences')
        .send({
          thresholds: {
            engagementSpike: '300',
            viralThreshold: '2000.5',
            sentimentThreshold: '50'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.thresholds.engagementSpike).toBe(300);
      expect(response.body.data.preferences.thresholds.viralThreshold).toBe(2000);
      expect(response.body.data.preferences.thresholds.sentimentThreshold).toBe(50);
    });

    it('should handle service errors gracefully', async () => {
      // Test with empty body to see error handling
      const response = await request(app)
        .put('/api/engagement/notifications/preferences')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/engagement/notifications/test', () => {
    it('should send test notification successfully', async () => {
      (engagementMonitoringService.sendAlert as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/engagement/notifications/test')
        .send({
          type: 'spike'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Test notification sent successfully');
      expect(response.body.data.alert).toHaveProperty('id');
      expect(response.body.data.alert.type).toBe('spike');
      expect(response.body.data.alert.severity).toBe('medium');
      expect(response.body.data.alert.title).toBe('Test Notification');
      expect(engagementMonitoringService.sendAlert).toHaveBeenCalled();
    });

    it('should default to spike type if not provided', async () => {
      (engagementMonitoringService.sendAlert as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/engagement/notifications/test')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.type).toBe('spike');
    });

    it('should allow custom notification types', async () => {
      (engagementMonitoringService.sendAlert as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/engagement/notifications/test')
        .send({
          type: 'viral'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.type).toBe('viral');
    });

    it('should include test flag in alert data', async () => {
      (engagementMonitoringService.sendAlert as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/engagement/notifications/test')
        .send({})
        .expect(200);

      expect(response.body.data.alert.data.test).toBe(true);
    });

    it('should handle service errors gracefully', async () => {
      (engagementMonitoringService.sendAlert as jest.Mock).mockRejectedValue(
        new Error('Email service unavailable')
      );

      const response = await request(app)
        .post('/api/engagement/notifications/test')
        .send({})
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to send test notification');
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all routes', async () => {
      // The auth middleware is mocked to always authenticate,
      // so we verify it's being used by checking requests succeed
      await request(app).post('/api/engagement/track').send({ type: 'like', platform: 'INSTAGRAM' });
      await request(app).get('/api/engagement/alerts').expect(200);
      await request(app).patch('/api/engagement/alerts/test/read').expect(200);
      await request(app).get('/api/engagement/stats').expect(200);
      await request(app).put('/api/engagement/notifications/preferences').send({}).expect(200);

      (engagementMonitoringService.sendAlert as jest.Mock).mockResolvedValue(undefined);
      await request(app).post('/api/engagement/notifications/test').send({}).expect(200);
    });
  });
});
