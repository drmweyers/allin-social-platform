import { AnalyticsService, analyticsService } from '../../../src/services/analytics.service';
import { mockPrismaClient, mockRedisClient } from '../../setup/jest.setup';
import { SocialPlatform, PostStatus } from '../../setup/enums';

// Mock data
const mockOrganizationId = 'org-id-123';
const mockDateRange = {
  from: new Date('2024-01-01'),
  to: new Date('2024-01-31')
};

const mockPostsWithAnalytics = [
  {
    id: 'post-1',
    content: 'Test post about marketing strategies #marketing #business',
    organizationId: mockOrganizationId,
    status: PostStatus.PUBLISHED,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    publishedAt: new Date('2024-01-15T10:00:00Z'),
    socialAccount: {
      platform: SocialPlatform.FACEBOOK,
      username: 'testuser'
    },
    analytics: [{
      engagement: 150,
      reach: 1000
    }]
  },
  {
    id: 'post-2',
    content: 'Another post about social media tips #socialmedia #tips',
    organizationId: mockOrganizationId,
    status: PostStatus.PUBLISHED,
    createdAt: new Date('2024-01-16T14:00:00Z'),
    publishedAt: new Date('2024-01-16T14:00:00Z'),
    socialAccount: {
      platform: SocialPlatform.INSTAGRAM,
      username: 'testuser_insta'
    },
    analytics: [{
      engagement: 200,
      reach: 1500
    }]
  },
  {
    id: 'post-3',
    content: 'Behind the scenes content #behindthescenes',
    organizationId: mockOrganizationId,
    status: PostStatus.PUBLISHED,
    createdAt: new Date('2024-01-17T16:00:00Z'),
    publishedAt: new Date('2024-01-17T16:00:00Z'),
    socialAccount: {
      platform: SocialPlatform.FACEBOOK,
      username: 'testuser'
    },
    analytics: [{
      engagement: 100,
      reach: 800
    }]
  }
];

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
    jest.clearAllMocks();
  });

  describe('getAggregatedAnalytics', () => {
    it('should return aggregated analytics data', async () => {
      mockPrismaClient.post.findMany.mockResolvedValue(mockPostsWithAnalytics);

      const result = await service.getAggregatedAnalytics(mockOrganizationId, mockDateRange);

      expect(result).toHaveProperty('platformMetrics');
      expect(result).toHaveProperty('engagementTrends');
      expect(result).toHaveProperty('topContent');
      expect(result).toHaveProperty('totalPosts');
      expect(result).toHaveProperty('avgEngagementRate');

      expect(result.totalPosts).toBe(3);
      expect(result.avgEngagementRate).toBeGreaterThan(0);

      // Verify Prisma query
      expect(mockPrismaClient.post.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: mockOrganizationId,
          createdAt: {
            gte: mockDateRange.from,
            lte: mockDateRange.to
          }
        },
        include: {
          socialAccount: true,
          analytics: true
        }
      });
    });

    it('should handle empty date range', async () => {
      mockPrismaClient.post.findMany.mockResolvedValue(mockPostsWithAnalytics);

      const result = await service.getAggregatedAnalytics(mockOrganizationId);

      expect(mockPrismaClient.post.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: mockOrganizationId
        },
        include: {
          socialAccount: true,
          analytics: true
        }
      });

      expect(result.totalPosts).toBe(3);
    });

    it('should handle posts without analytics data', async () => {
      const postsWithoutAnalytics = mockPostsWithAnalytics.map(post => ({
        ...post,
        analytics: []
      }));

      mockPrismaClient.post.findMany.mockResolvedValue(postsWithoutAnalytics);

      const result = await service.getAggregatedAnalytics(mockOrganizationId);

      expect(result.totalPosts).toBe(3);
      expect(result.avgEngagementRate).toBe(0);
    });
  });

  describe('analyzeCompetitors', () => {
    it('should return competitor analysis with insights', async () => {
      const competitorIds = ['comp-1', 'comp-2'];

      // Mock the aggregated analytics for organization
      mockPrismaClient.post.findMany.mockResolvedValue(mockPostsWithAnalytics);
      mockRedisClient.setex.mockResolvedValue('OK');

      const result = await service.analyzeCompetitors(mockOrganizationId, competitorIds);

      expect(result).toHaveProperty('competitorData');
      expect(result).toHaveProperty('organizationMetrics');
      expect(result).toHaveProperty('insights');

      expect(Array.isArray(result.competitorData)).toBe(true);
      expect(result.competitorData.length).toBeGreaterThan(0);
      expect(Array.isArray(result.insights)).toBe(true);

      // Verify Redis caching
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        `competitor_analysis:${mockOrganizationId}`,
        3600,
        expect.any(String)
      );
    });

    it('should include competitor data with required fields', async () => {
      mockPrismaClient.post.findMany.mockResolvedValue(mockPostsWithAnalytics);
      mockRedisClient.setex.mockResolvedValue('OK');

      const result = await service.analyzeCompetitors(mockOrganizationId, []);

      result.competitorData.forEach(competitor => {
        expect(competitor).toHaveProperty('name');
        expect(competitor).toHaveProperty('platform');
        expect(competitor).toHaveProperty('followers');
        expect(competitor).toHaveProperty('avgEngagement');
        expect(competitor).toHaveProperty('postFrequency');
        expect(competitor).toHaveProperty('topContent');
        expect(Array.isArray(competitor.topContent)).toBe(true);
      });
    });
  });

  describe('analyzeSentiment', () => {
    it('should analyze sentiment of provided content', async () => {
      const testContent = [
        'This is a great product! Love it!',
        'Not satisfied with the service',
        'Average experience, nothing special'
      ];

      const result = await service.analyzeSentiment(mockOrganizationId, testContent);

      expect(result).toHaveProperty('positive');
      expect(result).toHaveProperty('negative');
      expect(result).toHaveProperty('neutral');
      expect(result).toHaveProperty('trending');

      expect(typeof result.positive).toBe('number');
      expect(typeof result.negative).toBe('number');
      expect(typeof result.neutral).toBe('number');
      expect(Array.isArray(result.trending)).toBe(true);

      // Total should equal content length
      expect(result.positive + result.negative + result.neutral).toBe(testContent.length);
    });

    it('should analyze sentiment of organization posts when no content provided', async () => {
      mockPrismaClient.post.findMany.mockResolvedValue(mockPostsWithAnalytics);

      const result = await service.analyzeSentiment(mockOrganizationId);

      expect(mockPrismaClient.post.findMany).toHaveBeenCalledWith({
        where: { organizationId: mockOrganizationId },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      expect(result.positive + result.negative + result.neutral).toBe(mockPostsWithAnalytics.length);
    });

    it('should extract trending topics', async () => {
      const contentWithTopics = [
        'Marketing strategies for small businesses',
        'Social media marketing tips and tricks',
        'Content marketing best practices',
        'Digital marketing trends for 2024'
      ];

      const result = await service.analyzeSentiment(mockOrganizationId, contentWithTopics);

      expect(Array.isArray(result.trending)).toBe(true);
      expect(result.trending.length).toBeGreaterThan(0);

      // Should filter out short words and return trending topics
      result.trending.forEach(topic => {
        expect(topic.length).toBeGreaterThan(4);
      });
    });
  });

  describe('trackROI', () => {
    it('should calculate ROI metrics', async () => {
      mockPrismaClient.post.findMany.mockResolvedValue(mockPostsWithAnalytics);

      const result = await service.trackROI(mockOrganizationId, mockDateRange);

      expect(result).toHaveProperty('investment');
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('roi');
      expect(result).toHaveProperty('costPerEngagement');
      expect(result).toHaveProperty('conversionRate');

      expect(typeof result.investment).toBe('number');
      expect(typeof result.revenue).toBe('number');
      expect(typeof result.roi).toBe('number');
      expect(typeof result.costPerEngagement).toBe('number');
      expect(typeof result.conversionRate).toBe('number');
    });

    it('should handle zero investment', async () => {
      mockPrismaClient.post.findMany.mockResolvedValue(mockPostsWithAnalytics);

      const result = await service.trackROI(mockOrganizationId);

      // When ad spend is 0, ROI should be 0
      if (result.investment === 0) {
        expect(result.roi).toBe(0);
      }
    });

    it('should handle zero engagement', async () => {
      const postsWithoutEngagement = mockPostsWithAnalytics.map(post => ({
        ...post,
        analytics: [{ engagement: 0, reach: 1000 }]
      }));

      mockPrismaClient.post.findMany.mockResolvedValue(postsWithoutEngagement);

      const result = await service.trackROI(mockOrganizationId);

      // When total engagement is 0, cost per engagement should be 0
      expect(result.costPerEngagement).toBe(0);
    });
  });

  describe('getPredictiveInsights', () => {
    it('should return predictive insights', async () => {
      mockPrismaClient.post.findMany.mockResolvedValue(mockPostsWithAnalytics);
      mockRedisClient.setex.mockResolvedValue('OK');

      const result = await service.getPredictiveInsights(mockOrganizationId);

      expect(result).toHaveProperty('bestTimeToPost');
      expect(result).toHaveProperty('suggestedContent');
      expect(result).toHaveProperty('predictedEngagement');
      expect(result).toHaveProperty('recommendedHashtags');

      expect(Array.isArray(result.bestTimeToPost)).toBe(true);
      expect(Array.isArray(result.suggestedContent)).toBe(true);
      expect(Array.isArray(result.recommendedHashtags)).toBe(true);
      expect(typeof result.predictedEngagement).toBe('number');

      // Verify caching
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        `predictive_insights:${mockOrganizationId}`,
        7200,
        expect.any(String)
      );
    });

    it('should analyze best posting times from historical data', async () => {
      const postsAtDifferentHours = [
        {
          ...mockPostsWithAnalytics[0],
          createdAt: new Date('2024-01-15T09:00:00Z'), // 9 AM
          publishedAt: new Date('2024-01-15T09:00:00Z'),
          analytics: [{ engagement: 300, reach: 1000 }]
        },
        {
          ...mockPostsWithAnalytics[1],
          createdAt: new Date('2024-01-16T14:00:00Z'), // 2 PM
          publishedAt: new Date('2024-01-16T14:00:00Z'),
          analytics: [{ engagement: 150, reach: 800 }]
        },
        {
          ...mockPostsWithAnalytics[2],
          createdAt: new Date('2024-01-17T18:00:00Z'), // 6 PM
          publishedAt: new Date('2024-01-17T18:00:00Z'),
          analytics: [{ engagement: 250, reach: 900 }]
        }
      ];

      mockPrismaClient.post.findMany.mockResolvedValue(postsAtDifferentHours);
      mockRedisClient.setex.mockResolvedValue('OK');

      const result = await service.getPredictiveInsights(mockOrganizationId);

      expect(result.bestTimeToPost).toContain('9:00');
      expect(result.bestTimeToPost.length).toBeLessThanOrEqual(3);
    });

    it('should extract recommended hashtags from high-performing posts', async () => {
      mockPrismaClient.post.findMany.mockResolvedValue(mockPostsWithAnalytics);
      mockRedisClient.setex.mockResolvedValue('OK');

      const result = await service.getPredictiveInsights(mockOrganizationId);

      expect(Array.isArray(result.recommendedHashtags)).toBe(true);
      result.recommendedHashtags.forEach(hashtag => {
        expect(hashtag.startsWith('#')).toBe(true);
      });
    });

    it('should handle empty historical data', async () => {
      mockPrismaClient.post.findMany.mockResolvedValue([]);
      mockRedisClient.setex.mockResolvedValue('OK');

      const result = await service.getPredictiveInsights(mockOrganizationId);

      expect(result.predictedEngagement).toBe(0);
      expect(result.bestTimeToPost).toEqual([]);
      expect(result.recommendedHashtags).toEqual([]);
    });
  });

  describe('streamRealTimeAnalytics', () => {
    it('should create async generator for real-time metrics', async () => {
      const mockMetrics = {
        postsLastHour: 5,
        engagementLastHour: 250,
        activeAccounts: 3
      };

      mockPrismaClient.post.findMany.mockResolvedValue([]);
      mockPrismaClient.socialAccount.count.mockResolvedValue(3);

      const generator = service.streamRealTimeAnalytics(mockOrganizationId);

      // Get first value from generator
      const firstResult = await generator.next();

      expect(firstResult.done).toBe(false);
      expect(firstResult.value).toHaveProperty('timestamp');
      expect(firstResult.value).toHaveProperty('metrics');
      expect(firstResult.value.metrics).toHaveProperty('postsLastHour');
      expect(firstResult.value.metrics).toHaveProperty('engagementLastHour');
      expect(firstResult.value.metrics).toHaveProperty('activeAccounts');
    });
  });

  describe('private helper methods', () => {
    it('should calculate platform metrics correctly', async () => {
      const result = await service.getAggregatedAnalytics(mockOrganizationId);

      expect(Array.isArray(result.platformMetrics)).toBe(true);

      result.platformMetrics.forEach(metric => {
        expect(metric).toHaveProperty('platform');
        expect(metric).toHaveProperty('posts');
        expect(metric).toHaveProperty('totalReach');
        expect(metric).toHaveProperty('totalEngagement');
        expect(metric).toHaveProperty('avgEngagementRate');

        expect(typeof metric.posts).toBe('number');
        expect(typeof metric.totalReach).toBe('number');
        expect(typeof metric.totalEngagement).toBe('number');
        expect(typeof metric.avgEngagementRate).toBe('number');
      });
    });

    it('should calculate engagement trends by date', async () => {
      mockPrismaClient.post.findMany.mockResolvedValue(mockPostsWithAnalytics);

      const result = await service.getAggregatedAnalytics(mockOrganizationId);

      expect(Array.isArray(result.engagementTrends)).toBe(true);

      result.engagementTrends.forEach(trend => {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('engagement');
        expect(typeof trend.date).toBe('string');
        expect(typeof trend.engagement).toBe('number');
      });
    });

    it('should identify top performing content', async () => {
      mockPrismaClient.post.findMany.mockResolvedValue(mockPostsWithAnalytics);

      const result = await service.getAggregatedAnalytics(mockOrganizationId);

      expect(Array.isArray(result.topContent)).toBe(true);
      expect(result.topContent.length).toBeLessThanOrEqual(10);

      result.topContent.forEach(content => {
        expect(content).toHaveProperty('id');
        expect(content).toHaveProperty('content');
        expect(content).toHaveProperty('engagement');
        expect(typeof content.engagement).toBe('number');
      });

      // Should be sorted by engagement (highest first)
      if (result.topContent.length > 1) {
        for (let i = 1; i < result.topContent.length; i++) {
          expect(result.topContent[i - 1].engagement).toBeGreaterThanOrEqual(
            result.topContent[i].engagement
          );
        }
      }
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrismaClient.post.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getAggregatedAnalytics(mockOrganizationId))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle Redis errors gracefully', async () => {
      mockPrismaClient.post.findMany.mockResolvedValue(mockPostsWithAnalytics);
      mockRedisClient.setex.mockRejectedValue(new Error('Redis connection failed'));

      // Should still complete the operation even if caching fails
      const result = await service.analyzeCompetitors(mockOrganizationId, []);
      expect(result).toHaveProperty('competitorData');
    });
  });
});