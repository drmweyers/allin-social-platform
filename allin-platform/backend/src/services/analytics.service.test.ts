import { AnalyticsService } from './analytics.service';
import { prisma } from './database';
import { getRedis } from './redis';
import { SocialPlatform, PostStatus } from '@prisma/client';

// Mock dependencies
jest.mock('./database');
jest.mock('./redis');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRedis = {
  setex: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  hincrby: jest.fn(),
  hget: jest.fn(),
  lpush: jest.fn(),
  ltrim: jest.fn(),
  expire: jest.fn(),
  lrange: jest.fn(),
} as any;

(getRedis as jest.Mock).mockReturnValue(mockRedis);

describe('Enhanced Analytics Service', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    jest.clearAllMocks();
  });

  describe('Core Analytics Methods', () => {
    describe('getAggregatedAnalytics', () => {
      const mockPosts = [
        {
          id: 'post1',
          content: 'Test post content',
          createdAt: new Date(),
          organizationId: 'org1',
          socialAccount: {
            platform: SocialPlatform.INSTAGRAM,
            id: 'account1',
          },
        },
        {
          id: 'post2',
          content: 'Another test post',
          createdAt: new Date(),
          organizationId: 'org1',
          socialAccount: {
            platform: SocialPlatform.FACEBOOK,
            id: 'account2',
          },
        },
      ];

      beforeEach(() => {
        mockPrisma.post.findMany.mockResolvedValue(mockPosts as any);
      });

      it('should return aggregated analytics with platform metrics', async () => {
        const result = await analyticsService.getAggregatedAnalytics('org1');

        expect(result).toHaveProperty('platformMetrics');
        expect(result).toHaveProperty('engagementTrends');
        expect(result).toHaveProperty('topContent');
        expect(result.totalPosts).toBe(2);
        expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
          where: { organizationId: 'org1' },
          include: { socialAccount: true },
        });
      });

      it('should handle date range filtering', async () => {
        const dateRange = {
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31'),
        };

        await analyticsService.getAggregatedAnalytics('org1', dateRange);

        expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
          where: {
            organizationId: 'org1',
            createdAt: {
              gte: dateRange.from,
              lte: dateRange.to,
            },
          },
          include: { socialAccount: true },
        });
      });

      it('should handle empty posts array gracefully', async () => {
        mockPrisma.post.findMany.mockResolvedValue([]);

        const result = await analyticsService.getAggregatedAnalytics('org1');

        expect(result.totalPosts).toBe(0);
        expect(result.platformMetrics).toEqual([]);
        expect(result.avgEngagementRate).toBe(0);
      });

      it('should handle null posts array gracefully', async () => {
        mockPrisma.post.findMany.mockResolvedValue(null as any);

        const result = await analyticsService.getAggregatedAnalytics('org1');

        expect(result.totalPosts).toBe(0);
        expect(result.platformMetrics).toEqual([]);
      });

      it('should calculate platform-specific metrics correctly', async () => {
        const result = await analyticsService.getAggregatedAnalytics('org1');

        expect(result.platformMetrics).toHaveLength(2);
        expect(result.platformMetrics[0].platform).toBe(SocialPlatform.INSTAGRAM);
        expect(result.platformMetrics[1].platform).toBe(SocialPlatform.FACEBOOK);
        expect(result.platformMetrics[0].posts).toBe(1);
        expect(result.platformMetrics[1].posts).toBe(1);
      });
    });

    describe('getComprehensiveDashboard', () => {
      beforeEach(() => {
        // Mock all the helper methods
        jest.spyOn(analyticsService as any, 'getDashboardSummary').mockResolvedValue({
          totalFollowers: 125000,
          totalEngagement: 5000,
          brandMentions: 450,
          viralityScore: 75,
          sentimentScore: 85,
        });

        jest.spyOn(analyticsService as any, 'getRealTimeMetrics').mockResolvedValue({
          activeUsers: 250,
          postsLastHour: 5,
          engagementRate: 4.2,
          trendingHashtags: ['#marketing', '#ai'],
        });

        jest.spyOn(analyticsService, 'getAggregatedAnalytics').mockResolvedValue({
          platformMetrics: [],
          engagementTrends: [],
          topContent: [],
          totalPosts: 0,
          avgEngagementRate: 0,
        });

        jest.spyOn(analyticsService as any, 'getContentAnalysis').mockResolvedValue({
          topPerforming: [],
          underPerforming: [],
          contentMix: [],
        });

        jest.spyOn(analyticsService as any, 'getAudienceInsights').mockResolvedValue({
          demographics: {},
          interests: [],
          behavior: {},
        });

        jest.spyOn(analyticsService as any, 'getCompetitorComparison').mockResolvedValue({
          marketPosition: 'Top 25%',
        });

        jest.spyOn(analyticsService as any, 'getActiveAlerts').mockResolvedValue([]);
      });

      it('should return comprehensive dashboard data', async () => {
        const result = await analyticsService.getComprehensiveDashboard('org1');

        expect(result).toHaveProperty('summary');
        expect(result).toHaveProperty('realTimeMetrics');
        expect(result).toHaveProperty('platformPerformance');
        expect(result).toHaveProperty('contentAnalysis');
        expect(result).toHaveProperty('audienceInsights');
        expect(result).toHaveProperty('competitorComparison');
        expect(result).toHaveProperty('alerts');
      });

      it('should call all required helper methods', async () => {
        await analyticsService.getComprehensiveDashboard('org1');

        expect(analyticsService.getAggregatedAnalytics).toHaveBeenCalledWith('org1');
      });

      it('should handle errors in helper methods gracefully', async () => {
        jest.spyOn(analyticsService as any, 'getDashboardSummary').mockRejectedValue(new Error('Test error'));

        await expect(analyticsService.getComprehensiveDashboard('org1')).rejects.toThrow('Test error');
      });
    });

    describe('predictContentPerformance', () => {
      const mockContentData = {
        type: 'post',
        text: 'This is a test post with great content! #marketing #social',
        platform: SocialPlatform.INSTAGRAM,
        scheduledTime: new Date(),
        hashtags: ['#marketing', '#social'],
      };

      beforeEach(() => {
        jest.spyOn(analyticsService as any, 'getHistoricalPerformanceData').mockResolvedValue([]);
        jest.spyOn(analyticsService as any, 'analyzeContentCharacteristics').mockReturnValue(0.8);
        jest.spyOn(analyticsService as any, 'analyzeHashtagPerformance').mockResolvedValue(0.7);
        jest.spyOn(analyticsService as any, 'analyzePostingTime').mockReturnValue(0.9);
        jest.spyOn(analyticsService as any, 'getBaselineEngagement').mockReturnValue(100);
        jest.spyOn(analyticsService as any, 'generateContentRecommendations').mockResolvedValue([
          'Add more hashtags',
          'Include a question',
        ]);
      });

      it('should predict content performance with confidence score', async () => {
        const result = await analyticsService.predictContentPerformance('org1', mockContentData);

        expect(result).toHaveProperty('predictedEngagement');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('factors');
        expect(result).toHaveProperty('recommendations');
        expect(result.confidence).toBeGreaterThanOrEqual(60);
        expect(result.confidence).toBeLessThanOrEqual(95);
      });

      it('should analyze content characteristics correctly', async () => {
        await analyticsService.predictContentPerformance('org1', mockContentData);

        expect(analyticsService['analyzeContentCharacteristics']).toHaveBeenCalledWith(mockContentData.text);
      });

      it('should factor in hashtag performance when hashtags provided', async () => {
        await analyticsService.predictContentPerformance('org1', mockContentData);

        expect(analyticsService['analyzeHashtagPerformance']).toHaveBeenCalledWith(
          mockContentData.hashtags,
          'org1'
        );
      });

      it('should handle content without hashtags', async () => {
        const contentWithoutHashtags = { ...mockContentData, hashtags: undefined };

        const result = await analyticsService.predictContentPerformance('org1', contentWithoutHashtags);

        expect(result.factors.hashtagRelevance).toBe(0);
      });

      it('should handle content without scheduled time', async () => {
        const contentWithoutTime = { ...mockContentData, scheduledTime: undefined };

        const result = await analyticsService.predictContentPerformance('org1', contentWithoutTime);

        expect(result.factors.optimalTiming).toBe(0);
      });

      it('should generate content recommendations', async () => {
        const result = await analyticsService.predictContentPerformance('org1', mockContentData);

        expect(result.recommendations).toEqual(['Add more hashtags', 'Include a question']);
        expect(analyticsService['generateContentRecommendations']).toHaveBeenCalled();
      });
    });

    describe('detectViralContent', () => {
      const mockRecentPosts = [
        {
          id: 'post1',
          content: 'Viral post content',
          createdAt: new Date(),
          socialAccount: { platform: SocialPlatform.INSTAGRAM },
        },
        {
          id: 'post2',
          content: 'Regular post content',
          createdAt: new Date(),
          socialAccount: { platform: SocialPlatform.FACEBOOK },
        },
      ];

      beforeEach(() => {
        mockPrisma.post.findMany.mockResolvedValue(mockRecentPosts as any);
        jest.spyOn(analyticsService as any, 'calculateViralityScore').mockReturnValue(85);
      });

      it('should detect viral content in recent posts', async () => {
        const result = await analyticsService.detectViralContent('org1');

        expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
          where: {
            organizationId: 'org1',
            createdAt: {
              gte: expect.any(Date),
            },
          },
          include: { socialAccount: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        expect(Array.isArray(result)).toBe(true);
      });

      it('should calculate virality scores for detected content', async () => {
        const result = await analyticsService.detectViralContent('org1');

        if (result.length > 0) {
          expect(result[0]).toHaveProperty('viralityScore');
          expect(result[0]).toHaveProperty('content');
          expect(result[0]).toHaveProperty('platform');
          expect(result[0]).toHaveProperty('trend');
        }
      });

      it('should handle empty posts array', async () => {
        mockPrisma.post.findMany.mockResolvedValue([]);

        const result = await analyticsService.detectViralContent('org1');

        expect(result).toEqual([]);
      });

      it('should filter posts by recent timeframe (6 hours)', async () => {
        await analyticsService.detectViralContent('org1');

        const expectedDate = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const callArgs = mockPrisma.post.findMany.mock.calls[0][0];
        const actualDate = callArgs.where.createdAt.gte;

        // Allow for small time differences in test execution
        expect(actualDate.getTime()).toBeCloseTo(expectedDate.getTime(), -2);
      });
    });
  });

  describe('Real-time Analytics', () => {
    describe('streamRealTimeAnalytics', () => {
      beforeEach(() => {
        jest.spyOn(analyticsService as any, 'getLatestMetrics').mockResolvedValue({
          postsLastHour: 3,
          engagementLastHour: 150,
          activeAccounts: 5,
        });

        jest.spyOn(analyticsService as any, 'getActiveAlerts').mockResolvedValue([]);
        jest.spyOn(analyticsService as any, 'calculateTrends').mockReturnValue({
          engagement: 15,
          followers: 5,
          mentions: 10,
        });

        // Mock the Promise.resolve for the timeout
        jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
          callback();
          return {} as any;
        });
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('should generate async stream of real-time metrics', async () => {
        const stream = analyticsService.streamRealTimeAnalytics('org1');
        const iterator = stream[Symbol.asyncIterator]();

        const firstResult = await iterator.next();

        expect(firstResult.done).toBe(false);
        expect(firstResult.value).toHaveProperty('timestamp');
        expect(firstResult.value).toHaveProperty('organizationId', 'org1');
        expect(firstResult.value).toHaveProperty('metrics');
        expect(firstResult.value).toHaveProperty('alerts');
        expect(firstResult.value).toHaveProperty('trends');
      });

      it('should handle errors in metrics collection gracefully', async () => {
        jest.spyOn(analyticsService as any, 'getLatestMetrics').mockRejectedValue(new Error('Metrics error'));

        const stream = analyticsService.streamRealTimeAnalytics('org1');
        const iterator = stream[Symbol.asyncIterator]();

        const result = await iterator.next();

        expect(result.value).toHaveProperty('error', 'Failed to fetch real-time data');
        expect(result.value.metrics).toBe(null);
        expect(result.value.alerts).toEqual([]);
      });

      it('should calculate trends between iterations', async () => {
        const stream = analyticsService.streamRealTimeAnalytics('org1');
        const iterator = stream[Symbol.asyncIterator]();

        // First iteration
        await iterator.next();

        // Second iteration should have trends
        const secondResult = await iterator.next();

        expect(analyticsService['calculateTrends']).toHaveBeenCalled();
        expect(secondResult.value.trends).toEqual({
          engagement: 15,
          followers: 5,
          mentions: 10,
        });
      });
    });

    describe('detectRealTimeAlerts', () => {
      beforeEach(() => {
        jest.spyOn(analyticsService as any, 'detectEngagementSpike').mockResolvedValue(null);
        jest.spyOn(analyticsService as any, 'detectViralContent').mockResolvedValue([]);
        jest.spyOn(analyticsService as any, 'monitorSentiment').mockResolvedValue([]);
        jest.spyOn(analyticsService as any, 'monitorCompetitors').mockResolvedValue([]);
      });

      it('should check for engagement spikes', async () => {
        const currentMetrics = { engagementLastHour: 200 };
        const previousMetrics = { engagementLastHour: 100 };

        await analyticsService['detectRealTimeAlerts']('org1', currentMetrics, previousMetrics);

        expect(analyticsService['detectEngagementSpike']).toHaveBeenCalledWith('org1', 200);
      });

      it('should create engagement spike alerts when threshold exceeded', async () => {
        const currentMetrics = { engagementLastHour: 300 };
        const previousMetrics = { engagementLastHour: 100 };

        const result = await analyticsService['detectRealTimeAlerts']('org1', currentMetrics, previousMetrics);

        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              type: 'engagement_spike',
              severity: 'high',
              message: expect.stringContaining('200%'),
            }),
          ])
        );
      });

      it('should aggregate alerts from all detection methods', async () => {
        const mockViralAlert = {
          id: 'viral1',
          type: 'viral' as const,
          severity: 'high' as const,
          message: 'Viral content detected',
          timestamp: new Date(),
        };

        jest.spyOn(analyticsService as any, 'detectViralContent').mockResolvedValue([mockViralAlert]);

        const result = await analyticsService['detectRealTimeAlerts']('org1', {}, null);

        expect(result).toContain(mockViralAlert);
      });
    });
  });

  describe('Advanced Content Analysis', () => {
    describe('analyzeEngagementFactors', () => {
      it('should analyze emotional triggers correctly', () => {
        const content = 'This is amazing and incredible news that will surprise everyone!';

        const result = analyticsService.analyzeEngagementFactors(content, 'instagram');

        expect(result.emotionalTriggers.joy).toBeGreaterThan(0);
        expect(result.emotionalTriggers.surprise).toBeGreaterThan(0);
      });

      it('should detect action triggers', () => {
        const content = 'What do you think about this? Click here to learn more!';

        const result = analyticsService.analyzeEngagementFactors(content, 'instagram');

        expect(result.actionTriggers.hasQuestion).toBe(true);
        expect(result.actionTriggers.hasCallToAction).toBe(true);
      });

      it('should analyze visual elements', () => {
        const content = 'Check this out! 🚀 #marketing #social @mention https://example.com';

        const result = analyticsService.analyzeEngagementFactors(content, 'instagram');

        expect(result.visualElements.hasEmojis).toBe(true);
        expect(result.visualElements.hashtagCount).toBe(2);
        expect(result.visualElements.mentionsCount).toBe(1);
        expect(result.visualElements.urlCount).toBe(1);
      });

      it('should calculate readability metrics', () => {
        const content = 'This is a simple sentence. This is another simple sentence.';

        const result = analyticsService.analyzeEngagementFactors(content, 'instagram');

        expect(result.readability.sentenceLength).toBeGreaterThan(0);
        expect(result.readability.wordComplexity).toBeGreaterThanOrEqual(0);
        expect(result.readability.punctuationDensity).toBeGreaterThan(0);
      });

      it('should handle empty content gracefully', () => {
        const result = analyticsService.analyzeEngagementFactors('', 'instagram');

        expect(result.emotionalTriggers.joy).toBe(0);
        expect(result.actionTriggers.hasQuestion).toBe(false);
        expect(result.visualElements.hasEmojis).toBe(false);
      });
    });

    describe('optimizeForAlgorithm', () => {
      it('should add engagement questions when missing', async () => {
        const content = 'This is a post without any questions.';

        const result = await analyticsService.optimizeForAlgorithm(content, 'instagram');

        expect(result).toContain('?');
      });

      it('should optimize hashtag count for non-Twitter platforms', async () => {
        const content = 'Post with only one hashtag #test';
        jest.spyOn(analyticsService, 'generateHashtags').mockResolvedValue(['#marketing', '#social']);

        const result = await analyticsService.optimizeForAlgorithm(content, 'instagram');

        expect(result).toContain('#marketing');
        expect(result).toContain('#social');
      });

      it('should add emojis when none present', async () => {
        const content = 'Post without any emojis';

        const result = await analyticsService.optimizeForAlgorithm(content, 'instagram');

        // Should contain at least one emoji
        expect(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(result)).toBe(true);
      });

      it('should preserve original content intent', async () => {
        const originalContent = 'Original important message';

        const result = await analyticsService.optimizeForAlgorithm(originalContent, 'instagram');

        expect(result).toContain('Original important message');
      });
    });

    describe('predictPerformance', () => {
      beforeEach(() => {
        jest.spyOn(analyticsService as any, 'getBaselineEngagement').mockReturnValue(100);
        jest.spyOn(analyticsService as any, 'calculateContentScore').mockReturnValue(0.8);
        jest.spyOn(analyticsService as any, 'getPlatformMultiplier').mockReturnValue(1.2);
      });

      it('should calculate performance prediction with multipliers', () => {
        const content = 'Test content for prediction';

        const result = analyticsService.predictPerformance(content, 'instagram');

        expect(result).toHaveProperty('engagementRate');
        expect(result).toHaveProperty('reach');
        expect(result).toHaveProperty('impressions');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('factors');
      });

      it('should cap engagement rate at 15%', () => {
        jest.spyOn(analyticsService as any, 'calculateContentScore').mockReturnValue(10); // Extremely high score

        const result = analyticsService.predictPerformance('test', 'instagram');

        expect(result.engagementRate).toBeLessThanOrEqual(15);
      });

      it('should factor in historical data when provided', () => {
        const historicalData = [{ engagement: 200 }, { engagement: 150 }];

        const result = analyticsService.predictPerformance('test', 'instagram', historicalData);

        expect(analyticsService['getBaselineEngagement']).toHaveBeenCalledWith('instagram', historicalData);
      });

      it('should calculate confidence score correctly', () => {
        const result = analyticsService.predictPerformance('test', 'instagram');

        expect(result.confidence).toBeGreaterThanOrEqual(60);
        expect(result.confidence).toBeLessThanOrEqual(95);
      });
    });

    describe('generateVariants', () => {
      beforeEach(() => {
        jest.spyOn(analyticsService as any, 'getMockVariants').mockReturnValue([
          'Variant 1 content!',
          'Variant 2 content 🚀',
          'Variant 3 content - what do you think?',
        ]);
      });

      it('should generate multiple content variants', async () => {
        const result = await analyticsService.generateVariants('Original content', 'instagram', 3);

        expect(result).toHaveLength(3);
        expect(result[0]).toContain('Variant 1');
        expect(result[1]).toContain('Variant 2');
        expect(result[2]).toContain('Variant 3');
      });

      it('should default to 3 variants when count not specified', async () => {
        const result = await analyticsService.generateVariants('Original content', 'instagram');

        expect(result).toHaveLength(3);
      });

      it('should handle different platforms', async () => {
        await analyticsService.generateVariants('test', 'twitter');
        await analyticsService.generateVariants('test', 'linkedin');
        await analyticsService.generateVariants('test', 'facebook');

        expect(analyticsService['getMockVariants']).toHaveBeenCalledTimes(3);
      });
    });

    describe('abTestRecommendations', () => {
      it('should suggest emoji test when emojis missing', () => {
        const content = 'Content without emojis';

        const result = analyticsService.abTestRecommendations(content, 'instagram');

        expect(result.variants).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              hypothesis: 'Adding emojis will increase engagement by 15-25%',
              expectedImprovement: 20,
            }),
          ])
        );
      });

      it('should suggest question test when questions missing', () => {
        const content = 'Content without questions.';

        const result = analyticsService.abTestRecommendations(content, 'instagram');

        expect(result.variants).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              hypothesis: 'Adding a question will increase comments by 30-40%',
              expectedImprovement: 35,
            }),
          ])
        );
      });

      it('should suggest CTA test when call-to-action missing', () => {
        const content = 'Content without call to action.';

        const result = analyticsService.abTestRecommendations(content, 'instagram');

        expect(result.variants).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              hypothesis: 'Adding a call-to-action will increase engagement by 10-20%',
              expectedImprovement: 15,
            }),
          ])
        );
      });

      it('should provide test duration and success metrics', () => {
        const result = analyticsService.abTestRecommendations('test content', 'instagram');

        expect(result.testDuration).toBe(7);
        expect(result.successMetrics).toEqual(['engagement_rate', 'reach', 'comments', 'shares']);
      });
    });
  });

  describe('Helper Methods', () => {
    describe('calculatePercentageChange', () => {
      it('should calculate positive percentage change', () => {
        const result = analyticsService['calculatePercentageChange'](120, 100);
        expect(result).toBe(20);
      });

      it('should calculate negative percentage change', () => {
        const result = analyticsService['calculatePercentageChange'](80, 100);
        expect(result).toBe(-20);
      });

      it('should handle zero previous value', () => {
        const result = analyticsService['calculatePercentageChange'](50, 0);
        expect(result).toBe(100);
      });

      it('should handle zero current and previous values', () => {
        const result = analyticsService['calculatePercentageChange'](0, 0);
        expect(result).toBe(0);
      });
    });

    describe('calculateContentScore', () => {
      it('should calculate content score based on engagement factors', () => {
        const factors = {
          emotionalTriggers: { joy: 0.8, surprise: 0.6, trust: 0.7, anticipation: 0.5 },
          actionTriggers: { hasQuestion: true, hasCallToAction: true, hasPersonalStory: false, hasStatistic: true },
          visualElements: { hasEmojis: true, hashtagCount: 3, mentionsCount: 1, urlCount: 0 },
          readability: { sentenceLength: 15, wordComplexity: 0.2, punctuationDensity: 0.1 },
        };

        const result = analyticsService['calculateContentScore'](factors);

        expect(result).toBeGreaterThan(0.5);
        expect(result).toBeLessThanOrEqual(1);
      });

      it('should handle empty factors', () => {
        const factors = {
          emotionalTriggers: { joy: 0, surprise: 0, trust: 0, anticipation: 0 },
          actionTriggers: { hasQuestion: false, hasCallToAction: false, hasPersonalStory: false, hasStatistic: false },
          visualElements: { hasEmojis: false, hashtagCount: 0, mentionsCount: 0, urlCount: 0 },
          readability: { sentenceLength: 0, wordComplexity: 0, punctuationDensity: 0 },
        };

        const result = analyticsService['calculateContentScore'](factors);

        expect(result).toBe(0.75); // Base score (0.5) + readability bonus (0.25)
      });
    });

    describe('analyzeContentCharacteristics', () => {
      it('should score content with engagement triggers higher', () => {
        const highEngagementContent = 'This is amazing! What do you think? #test @mention';
        const lowEngagementContent = 'Basic content.';

        const highScore = analyticsService['analyzeContentCharacteristics'](highEngagementContent);
        const lowScore = analyticsService['analyzeContentCharacteristics'](lowEngagementContent);

        expect(highScore).toBeGreaterThan(lowScore);
      });

      it('should give bonus for optimal length', () => {
        const optimalContent = 'Content with optimal length for social media platforms with good engagement';
        const tooShortContent = 'Short';
        const tooLongContent = 'Very long content that exceeds the optimal character count for most social media platforms and may not perform as well due to reduced readability and user attention spans which are getting shorter in the digital age';

        const optimalScore = analyticsService['analyzeContentCharacteristics'](optimalContent);
        const shortScore = analyticsService['analyzeContentCharacteristics'](tooShortContent);
        const longScore = analyticsService['analyzeContentCharacteristics'](tooLongContent);

        expect(optimalScore).toBeGreaterThan(shortScore);
        expect(optimalScore).toBeGreaterThan(longScore);
      });

      it('should cap score at 1.0', () => {
        const superOptimizedContent = 'Amazing incredible content! What do you think? #test #marketing @mention';

        const score = analyticsService['analyzeContentCharacteristics'](superOptimizedContent);

        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Redis Integration', () => {
    describe('caching behavior', () => {
      it('should cache predictive insights', async () => {
        const mockHistoricalData = [];
        jest.spyOn(analyticsService as any, 'getHistoricalPerformanceData').mockResolvedValue(mockHistoricalData);
        jest.spyOn(analyticsService as any, 'analyzeBestPostingTimes').mockReturnValue(['9:00', '14:00']);
        jest.spyOn(analyticsService as any, 'generateContentSuggestions').mockResolvedValue(['suggestion1']);
        jest.spyOn(analyticsService as any, 'predictEngagement').mockReturnValue(75);
        jest.spyOn(analyticsService as any, 'getRecommendedHashtags').mockResolvedValue(['#test']);

        await analyticsService.getPredictiveInsights('org1');

        expect(mockRedis.setex).toHaveBeenCalledWith(
          'predictive_insights:org1',
          7200,
          expect.any(String)
        );
      });

      it('should cache competitor analysis', async () => {
        jest.spyOn(analyticsService, 'getAggregatedAnalytics').mockResolvedValue({
          platformMetrics: [],
          engagementTrends: [],
          topContent: [],
          totalPosts: 0,
          avgEngagementRate: 4.2,
        });

        jest.spyOn(analyticsService as any, 'generateCompetitorInsights').mockResolvedValue(['insight1']);

        await analyticsService.analyzeCompetitors('org1', ['comp1']);

        expect(mockRedis.setex).toHaveBeenCalledWith(
          'competitor_analysis:org1',
          3600,
          expect.any(String)
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.post.findMany.mockRejectedValue(new Error('Database error'));

      await expect(analyticsService.getAggregatedAnalytics('org1')).rejects.toThrow('Database error');
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      // Should not throw error, just log it
      await expect(analyticsService.getPredictiveInsights('org1')).resolves.toBeDefined();
    });

    it('should handle missing organization ID', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);

      const result = await analyticsService.getAggregatedAnalytics('');

      expect(result.totalPosts).toBe(0);
    });
  });
});