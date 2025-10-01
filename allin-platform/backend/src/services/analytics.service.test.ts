import { AnalyticsService } from './analytics.service';
import { prisma } from './database';
import { getRedis } from './redis';
import { SocialPlatform, PostStatus } from '@prisma/client';

// Mock dependencies
jest.mock('./database');
jest.mock('./redis', () => ({
  getRedis: jest.fn(() => ({
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  })),
  cacheService: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    ttl: jest.fn(),
    flush: jest.fn(),
    getKeys: jest.fn(),
    getInfo: jest.fn(),
    ping: jest.fn(),
  },
}));

// Master test credentials (kept for consistency with other tests)
// const MASTER_CREDENTIALS = {
//   admin: { email: 'admin@allin.demo', password: 'Admin123!@#' },
//   agency: { email: 'agency@allin.demo', password: 'Agency123!@#' },
//   manager: { email: 'manager@allin.demo', password: 'Manager123!@#' },
//   creator: { email: 'creator@allin.demo', password: 'Creator123!@#' },
//   client: { email: 'client@allin.demo', password: 'Client123!@#' },
//   team: { email: 'team@allin.demo', password: 'Team123!@#' },
// };

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService = new AnalyticsService();
  });

  describe('getAggregatedAnalytics', () => {
    const mockPosts = [
      {
        id: '1',
        content: 'Test post 1',
        status: PostStatus.PUBLISHED,
        organizationId: 'org-1',
        socialAccountId: 'acc-1',
        createdAt: new Date('2024-09-20'),
        updatedAt: new Date('2024-09-20'),
        publishedAt: new Date('2024-09-20'),
        scheduledAt: null,
        socialAccount: {
          id: 'acc-1',
          platform: SocialPlatform.FACEBOOK,
          username: 'test_user',
          userId: 'user-1',
        },
        analytics: [{
          engagement: 100,
          reach: 1000,
        }],
      },
      {
        id: '2',
        content: 'Test post 2',
        status: PostStatus.PUBLISHED,
        organizationId: 'org-1',
        socialAccountId: 'acc-2',
        createdAt: new Date('2024-09-21'),
        updatedAt: new Date('2024-09-21'),
        publishedAt: new Date('2024-09-21'),
        scheduledAt: null,
        socialAccount: {
          id: 'acc-2',
          platform: SocialPlatform.INSTAGRAM,
          username: 'test_user_ig',
          userId: 'user-1',
        },
        analytics: [{
          engagement: 200,
          reach: 2000,
        }],
      },
    ];

    it('should get aggregated analytics for organization', async () => {
      (prisma.post.findMany as any).mockResolvedValue(mockPosts);

      const result = await analyticsService.getAggregatedAnalytics('org-1');

      expect(result).toHaveProperty('platformMetrics');
      expect(result).toHaveProperty('engagementTrends');
      expect(result).toHaveProperty('topContent');
      expect(result).toHaveProperty('totalPosts');
      expect(result).toHaveProperty('avgEngagementRate');
      expect(result.totalPosts).toBe(2);
      expect(result.platformMetrics).toHaveLength(2);
    });

    it('should handle date range filtering', async () => {
      (prisma.post.findMany as any).mockResolvedValue(mockPosts);

      const dateRange = {
        from: new Date('2024-09-20'),
        to: new Date('2024-09-25'),
      };

      const result = await analyticsService.getAggregatedAnalytics('org-1', dateRange);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
            createdAt: {
              gte: dateRange.from,
              lte: dateRange.to,
            },
          }),
        })
      );
      expect(result.totalPosts).toBe(2);
    });

    it('should calculate platform metrics correctly', async () => {
      (prisma.post.findMany as any).mockResolvedValue(mockPosts);

      const result = await analyticsService.getAggregatedAnalytics('org-1');

      const fbMetrics = result.platformMetrics.find(m => m.platform === SocialPlatform.FACEBOOK);
      expect(fbMetrics).toBeDefined();
      expect(fbMetrics?.posts).toBe(1);
      expect(fbMetrics?.totalEngagement).toBe(100);
      expect(fbMetrics?.totalReach).toBe(1000);
      expect(fbMetrics?.avgEngagementRate).toBe(10); // (100/1000) * 100
    });

    it('should handle empty posts array', async () => {
      (prisma.post.findMany as any).mockResolvedValue([]);

      const result = await analyticsService.getAggregatedAnalytics('org-1');

      expect(result.totalPosts).toBe(0);
      expect(result.platformMetrics).toHaveLength(0);
      expect(result.avgEngagementRate).toBe(0);
    });

    it('should handle posts without analytics data', async () => {
      const postsWithoutAnalytics = [
        {
          ...mockPosts[0],
          analytics: [],
        },
      ];

      (prisma.post.findMany as any).mockResolvedValue(postsWithoutAnalytics);

      const result = await analyticsService.getAggregatedAnalytics('org-1');

      expect(result.avgEngagementRate).toBe(0);
      expect(result.platformMetrics[0].totalEngagement).toBe(0);
    });
  });

  describe('analyzeCompetitors', () => {
    it('should analyze competitors and cache results', async () => {
      const mockOrgMetrics = {
        platformMetrics: [],
        engagementTrends: [],
        topContent: [],
        totalPosts: 10,
        avgEngagementRate: 3.0,
      };

      (prisma.post.findMany as any).mockResolvedValue([]);
      jest.spyOn(analyticsService, 'getAggregatedAnalytics').mockResolvedValue(mockOrgMetrics);

      const result = await analyticsService.analyzeCompetitors('org-1', ['comp-1', 'comp-2']);

      expect(result).toHaveProperty('competitorData');
      expect(result).toHaveProperty('organizationMetrics');
      expect(result).toHaveProperty('insights');
      expect(result.competitorData).toHaveLength(2);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'competitor_analysis:org-1',
        3600,
        expect.any(String)
      );
    });

    it('should generate insights based on competitor comparison', async () => {
      const mockOrgMetrics = {
        platformMetrics: [],
        engagementTrends: [],
        topContent: [],
        totalPosts: 10,
        avgEngagementRate: 2.0, // Lower than competitors
      };

      jest.spyOn(analyticsService, 'getAggregatedAnalytics').mockResolvedValue(mockOrgMetrics);

      const result = await analyticsService.analyzeCompetitors('org-1', ['comp-1']);

      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
    });
  });

  describe('analyzeSentiment', () => {
    it('should analyze sentiment from provided content', async () => {
      const content = [
        'Great product! Love it!',
        'Not happy with the service',
        'It\'s okay, nothing special',
      ];

      const result = await analyticsService.analyzeSentiment('org-1', content);

      expect(result).toHaveProperty('positive');
      expect(result).toHaveProperty('negative');
      expect(result).toHaveProperty('neutral');
      expect(result).toHaveProperty('trending');
      expect(result.positive + result.negative + result.neutral).toBe(content.length);
    });

    it('should fetch posts for sentiment analysis when no content provided', async () => {
      const mockPosts = [
        { id: '1', content: 'Test post 1', organizationId: 'org-1' },
        { id: '2', content: 'Test post 2', organizationId: 'org-1' },
      ];

      (prisma.post.findMany as any).mockResolvedValue(mockPosts);

      const result = await analyticsService.analyzeSentiment('org-1');

      expect(prisma.post.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      expect(result.positive + result.negative + result.neutral).toBe(mockPosts.length);
    });

    it('should extract trending topics', async () => {
      const content = ['#trending #viral post', '#trending again'];

      const result = await analyticsService.analyzeSentiment('org-1', content);

      expect(result.trending).toBeDefined();
      expect(Array.isArray(result.trending)).toBe(true);
    });
  });

  describe('trackROI', () => {
    it('should calculate ROI metrics', async () => {
      const mockAnalytics = {
        platformMetrics: [
          {
            platform: SocialPlatform.FACEBOOK,
            posts: 10,
            totalReach: 10000,
            totalEngagement: 500,
            avgEngagementRate: 5,
          },
        ],
        engagementTrends: [],
        topContent: [],
        totalPosts: 10,
        avgEngagementRate: 5,
      };

      jest.spyOn(analyticsService, 'getAggregatedAnalytics').mockResolvedValue(mockAnalytics);
      jest.spyOn(analyticsService as any, 'getAdSpend').mockResolvedValue(1000);
      jest.spyOn(analyticsService as any, 'getRevenue').mockResolvedValue(5000);
      jest.spyOn(analyticsService as any, 'calculateConversionRate').mockResolvedValue(2.5);

      const result = await analyticsService.trackROI('org-1');

      expect(result).toHaveProperty('investment');
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('roi');
      expect(result).toHaveProperty('costPerEngagement');
      expect(result).toHaveProperty('conversionRate');
      expect(result.roi).toBe(400); // ((5000-1000)/1000) * 100
      expect(result.investment).toBe(1000);
      expect(result.revenue).toBe(5000);
    });

    it('should handle zero investment', async () => {
      jest.spyOn(analyticsService, 'getAggregatedAnalytics').mockResolvedValue({
        platformMetrics: [],
        engagementTrends: [],
        topContent: [],
        totalPosts: 0,
        avgEngagementRate: 0,
      });
      jest.spyOn(analyticsService as any, 'getAdSpend').mockResolvedValue(0);
      jest.spyOn(analyticsService as any, 'getRevenue').mockResolvedValue(0);

      const result = await analyticsService.trackROI('org-1');

      expect(result.roi).toBe(0);
      expect(result.costPerEngagement).toBe(0);
    });

    it('should handle date range for ROI tracking', async () => {
      const dateRange = {
        from: new Date('2024-09-01'),
        to: new Date('2024-09-30'),
      };

      jest.spyOn(analyticsService, 'getAggregatedAnalytics').mockResolvedValue({
        platformMetrics: [],
        engagementTrends: [],
        topContent: [],
        totalPosts: 5,
        avgEngagementRate: 3,
      });
      jest.spyOn(analyticsService as any, 'getAdSpend').mockResolvedValue(500);
      jest.spyOn(analyticsService as any, 'getRevenue').mockResolvedValue(2000);

      const result = await analyticsService.trackROI('org-1', dateRange);

      expect(analyticsService.getAggregatedAnalytics).toHaveBeenCalledWith('org-1', dateRange);
      expect(result.roi).toBe(300); // ((2000-500)/500) * 100
    });
  });

  describe('getPredictiveInsights', () => {
    const mockHistoricalData = [
      {
        id: '1',
        content: 'Morning post #marketing',
        status: PostStatus.PUBLISHED,
        organizationId: 'org-1',
        socialAccountId: 'acc-1',
        createdAt: new Date('2024-09-20T09:00:00'),
        updatedAt: new Date('2024-09-20T09:00:00'),
        publishedAt: new Date('2024-09-20T09:00:00'),
        scheduledAt: null,
        socialAccount: {
          platform: SocialPlatform.FACEBOOK,
        },
        analytics: [{
          engagement: 150,
          reach: 1500,
        }],
      },
      {
        id: '2',
        content: 'Evening post #business',
        status: PostStatus.PUBLISHED,
        organizationId: 'org-1',
        socialAccountId: 'acc-1',
        createdAt: new Date('2024-09-20T18:00:00'),
        updatedAt: new Date('2024-09-20T18:00:00'),
        publishedAt: new Date('2024-09-20T18:00:00'),
        scheduledAt: null,
        socialAccount: {
          platform: SocialPlatform.FACEBOOK,
        },
        analytics: [{
          engagement: 200,
          reach: 2000,
        }],
      },
    ];

    it('should generate predictive insights and cache them', async () => {
      (prisma.post.findMany as any).mockResolvedValue(mockHistoricalData);

      const result = await analyticsService.getPredictiveInsights('org-1');

      expect(result).toHaveProperty('bestTimeToPost');
      expect(result).toHaveProperty('suggestedContent');
      expect(result).toHaveProperty('predictedEngagement');
      expect(result).toHaveProperty('recommendedHashtags');
      expect(Array.isArray(result.bestTimeToPost)).toBe(true);
      expect(Array.isArray(result.suggestedContent)).toBe(true);
      expect(typeof result.predictedEngagement).toBe('number');
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'predictive_insights:org-1',
        7200,
        expect.any(String)
      );
    });

    it('should handle empty historical data', async () => {
      (prisma.post.findMany as any).mockResolvedValue([]);

      const result = await analyticsService.getPredictiveInsights('org-1');

      expect(result.bestTimeToPost).toBeDefined();
      expect(result.suggestedContent).toBeDefined();
      expect(result.predictedEngagement).toBeDefined();
      expect(result.recommendedHashtags).toBeDefined();
    });

    it('should fetch 500 historical posts for analysis', async () => {
      (prisma.post.findMany as any).mockResolvedValue(mockHistoricalData);

      await analyticsService.getPredictiveInsights('org-1');

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: 'org-1',
            status: PostStatus.PUBLISHED,
          },
          orderBy: { createdAt: 'desc' },
          take: 500,
        })
      );
    });
  });

  describe('streamRealTimeAnalytics', () => {
    it('should stream real-time analytics', async () => {
      const mockMetrics = {
        currentEngagement: 100,
        currentReach: 1000,
        activePosts: 5,
      };

      jest.spyOn(analyticsService as any, 'getLatestMetrics').mockResolvedValue(mockMetrics);

      const stream = analyticsService.streamRealTimeAnalytics('org-1');
      const result = await stream.next();

      expect(result.value).toHaveProperty('timestamp');
      expect(result.value).toHaveProperty('metrics');
      expect(result.value).toBeDefined();
      if (!result.done && result.value) {
        expect(result.value.metrics).toEqual(mockMetrics);
      }
      expect(result.done).toBe(false);
    });
  });

  describe('Private helper methods', () => {
    it('should calculate average engagement correctly', async () => {
      const mockPosts = [
        {
          id: '1',
          content: 'Test',
          createdAt: new Date(),
          socialAccount: { platform: SocialPlatform.FACEBOOK },
          analytics: [{ engagement: 100, reach: 1000 }],
        },
        {
          id: '2',
          content: 'Test 2',
          createdAt: new Date(),
          socialAccount: { platform: SocialPlatform.FACEBOOK },
          analytics: [{ engagement: 200, reach: 1000 }],
        },
      ];

      (prisma.post.findMany as any).mockResolvedValue(mockPosts);

      const result = await analyticsService.getAggregatedAnalytics('org-1');

      expect(result.avgEngagementRate).toBe(15); // (300/2000) * 100
    });

    it('should group engagement trends by date', async () => {
      const mockPosts = [
        {
          id: '1',
          content: 'Test',
          createdAt: new Date('2024-09-20'),
          socialAccount: { platform: SocialPlatform.FACEBOOK },
          analytics: [{ engagement: 100, reach: 1000 }],
        },
        {
          id: '2',
          content: 'Test 2',
          createdAt: new Date('2024-09-20'),
          socialAccount: { platform: SocialPlatform.FACEBOOK },
          analytics: [{ engagement: 50, reach: 500 }],
        },
        {
          id: '3',
          content: 'Test 3',
          createdAt: new Date('2024-09-21'),
          socialAccount: { platform: SocialPlatform.INSTAGRAM },
          analytics: [{ engagement: 200, reach: 2000 }],
        },
      ];

      (prisma.post.findMany as any).mockResolvedValue(mockPosts);

      const result = await analyticsService.getAggregatedAnalytics('org-1');

      expect(result.engagementTrends).toHaveLength(2); // Two different dates
      const trend20th = result.engagementTrends.find(t => t.date === '2024-09-20');
      expect(trend20th?.engagement).toBe(150); // 100 + 50
    });

    it('should get top performing content sorted by engagement', async () => {
      const mockPosts = [
        {
          id: '1',
          content: 'Low engagement post',
          createdAt: new Date(),
          socialAccount: { platform: SocialPlatform.FACEBOOK },
          analytics: [{ engagement: 50, reach: 1000 }],
        },
        {
          id: '2',
          content: 'High engagement post that is very long and should be truncated',
          createdAt: new Date(),
          socialAccount: { platform: SocialPlatform.FACEBOOK },
          analytics: [{ engagement: 500, reach: 1000 }],
        },
        {
          id: '3',
          content: 'Medium engagement post',
          createdAt: new Date(),
          socialAccount: { platform: SocialPlatform.FACEBOOK },
          analytics: [{ engagement: 200, reach: 1000 }],
        },
      ];

      (prisma.post.findMany as any).mockResolvedValue(mockPosts);

      const result = await analyticsService.getAggregatedAnalytics('org-1');

      expect(result.topContent).toHaveLength(3);
      expect(result.topContent[0].engagement).toBe(500);
      expect(result.topContent[1].engagement).toBe(200);
      expect(result.topContent[2].engagement).toBe(50);
      expect(result.topContent[0].content.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Master credentials integration', () => {
    it('should work with admin credentials context', async () => {
      // Simulate admin user context
      const adminOrgId = 'admin-org';
      (prisma.post.findMany as any).mockResolvedValue([]);

      const result = await analyticsService.getAggregatedAnalytics(adminOrgId);

      expect(result).toBeDefined();
      expect(result.totalPosts).toBe(0);
    });

    it('should work with agency credentials context', async () => {
      // Simulate agency user context
      const agencyOrgId = 'agency-org';
      const result = await analyticsService.analyzeCompetitors(agencyOrgId, ['comp-1']);

      expect(result).toBeDefined();
      expect(result.competitorData).toBeDefined();
    });

    it('should work with manager credentials context', async () => {
      // Simulate manager user context
      const managerOrgId = 'manager-org';
      (prisma.post.findMany as any).mockResolvedValue([]);

      const insights = await analyticsService.getPredictiveInsights(managerOrgId);

      expect(insights).toBeDefined();
      expect(insights.bestTimeToPost).toBeDefined();
    });
  });
});