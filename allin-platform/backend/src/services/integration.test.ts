import { AnalyticsService } from './analytics.service';
import { EngagementMonitoringService } from './engagement-monitoring.service';
import { AIService } from './ai.service';

// Mock Redis and external dependencies
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    flushAll: jest.fn(),
    on: jest.fn(),
  })),
}));

jest.mock('openai');

// Master test credentials
const MASTER_CREDENTIALS = {
  admin: { email: 'admin@allin.demo', password: 'Admin123!@#' },
  agency: { email: 'agency@allin.demo', password: 'Agency123!@#' },
  manager: { email: 'manager@allin.demo', password: 'Manager123!@#' },
  creator: { email: 'creator@allin.demo', password: 'Creator123!@#' },
  client: { email: 'client@allin.demo', password: 'Client123!@#' },
  team: { email: 'team@allin.demo', password: 'Team123!@#' },
};

describe('Priority 2 Cross-Service Integration Tests', () => {
  let analyticsService: AnalyticsService;
  let engagementService: EngagementMonitoringService;
  let aiService: AIService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    analyticsService = new AnalyticsService();
    engagementService = new EngagementMonitoringService();
    aiService = new AIService();
  });

  describe('Analytics + Engagement Monitoring Integration', () => {
    it('should trigger analytics updates when engagement events occur', async () => {
      const organizationId = 'test-org-id';
      const eventData = {
        type: 'post_engagement',
        platform: 'instagram',
        postId: 'post-123',
        engagement: {
          likes: 150,
          comments: 25,
          shares: 10,
        },
        timestamp: new Date(),
      };

      // Track engagement event
      await engagementService.trackEngagement(organizationId, eventData);

      // Get comprehensive dashboard which should include the engagement data
      const dashboardData = await analyticsService.getComprehensiveDashboard(organizationId);

      expect(dashboardData).toBeDefined();
      expect(dashboardData.realTimeMetrics).toBeDefined();
      expect(dashboardData.viralContent).toBeDefined();
      expect(dashboardData.platformBreakdown).toBeDefined();
    });

    it('should share alert data between services', async () => {
      const organizationId = 'test-org-id';
      
      // Create engagement spike that should trigger alert
      const spikeEvent = {
        type: 'engagement_spike',
        platform: 'tiktok',
        postId: 'viral-post-456',
        engagement: {
          likes: 5000, // Large spike
          comments: 800,
          shares: 1200,
        },
        timestamp: new Date(),
      };

      await engagementService.trackEngagement(organizationId, spikeEvent);

      // Analytics should detect this in viral content
      const viralContent = await analyticsService.detectViralContent(organizationId);
      
      expect(viralContent).toBeDefined();
      expect(viralContent.length).toBeGreaterThan(0);
      
      // Find the viral post
      const viralPost = viralContent.find(post => post.id === 'viral-post-456');
      expect(viralPost).toBeDefined();
      expect(viralPost?.viralityScore).toBeGreaterThan(0.7);
    });

    it('should synchronize real-time metrics between services', async () => {
      const organizationId = 'test-org-id';
      
      // Generate multiple engagement events
      const events = [
        { type: 'like', platform: 'instagram', value: 1 },
        { type: 'comment', platform: 'instagram', value: 1 },
        { type: 'share', platform: 'facebook', value: 1 },
        { type: 'like', platform: 'twitter', value: 1 },
      ];

      for (const event of events) {
        await engagementService.trackEngagement(organizationId, {
          type: 'post_engagement',
          platform: event.platform,
          postId: `post-${Date.now()}`,
          engagement: { [event.type]: event.value },
          timestamp: new Date(),
        });
      }

      // Get real-time metrics from both services
      const engagementMetrics = await engagementService.getLiveMetrics(organizationId);
      const analyticsMetrics = await analyticsService.streamRealTimeAnalytics(organizationId);

      expect(engagementMetrics.totalEngagement).toBeGreaterThan(0);
      expect(analyticsMetrics.currentMetrics.engagement).toBeGreaterThan(0);
    });

    it('should handle cross-service error scenarios gracefully', async () => {
      const organizationId = 'test-org-id';
      
      // Simulate analytics service error
      jest.spyOn(analyticsService, 'getComprehensiveDashboard').mockRejectedValue(new Error('Analytics service unavailable'));

      // Engagement service should still work
      const result = await engagementService.trackEngagement(organizationId, {
        type: 'post_engagement',
        platform: 'facebook',
        postId: 'post-789',
        engagement: { likes: 10 },
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.tracked).toBe(true);
    });

    it('should maintain data consistency across service updates', async () => {
      const organizationId = 'test-org-id';
      const postId = 'consistency-test-post';
      
      // Track initial engagement
      await engagementService.trackEngagement(organizationId, {
        type: 'post_engagement',
        platform: 'linkedin',
        postId,
        engagement: { likes: 50, comments: 5 },
        timestamp: new Date(),
      });

      // Get initial analytics
      const initialAnalytics = await analyticsService.getComprehensiveDashboard(organizationId);
      
      // Track additional engagement
      await engagementService.trackEngagement(organizationId, {
        type: 'post_engagement',
        platform: 'linkedin',
        postId,
        engagement: { likes: 75, comments: 8 },
        timestamp: new Date(),
      });

      // Get updated analytics
      const updatedAnalytics = await analyticsService.getComprehensiveDashboard(organizationId);
      
      // Verify consistency
      expect(updatedAnalytics.realTimeMetrics.totalEngagement)
        .toBeGreaterThan(initialAnalytics.realTimeMetrics.totalEngagement);
    });
  });

  describe('AI + Analytics Integration', () => {
    it('should use analytics data for AI predictions', async () => {
      const organizationId = 'test-org-id';
      const content = 'Exciting product launch announcement! 🚀 What do you think?';
      
      // Get historical analytics data
      const analyticsData = await analyticsService.getComprehensiveDashboard(organizationId);
      
      // Use analytics in AI prediction
      const prediction = await aiService.predictPerformance(content, 'instagram', analyticsData.historicalData);
      
      expect(prediction).toBeDefined();
      expect(prediction.expectedEngagement).toBeDefined();
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.factors).toContain('historical performance');
    });

    it('should update performance baselines from analytics', async () => {
      const organizationId = 'test-org-id';
      
      // Get performance benchmarks from analytics
      const benchmarks = await analyticsService.generatePerformanceBenchmarks(organizationId);
      
      // AI should incorporate these benchmarks in content scoring
      const content = 'Standard social media post with average engagement potential.';
      const analysis = await aiService.performAdvancedContentAnalysis(content);
      
      expect(analysis).toBeDefined();
      expect(analysis.engagementPredictors.overallScore).toBeGreaterThan(0);
      expect(analysis.platformOptimization).toBeDefined();
    });

    it('should share content scoring between services', async () => {
      const organizationId = 'test-org-id';
      const content = 'Amazing breakthrough in technology! This will change everything! 🔥⚡ #innovation #tech';
      
      // Analyze content with AI
      const aiAnalysis = await aiService.performAdvancedContentAnalysis(content);
      
      // Analytics should be able to use AI scoring for predictions
      const prediction = await analyticsService.predictContentPerformance(organizationId, content, 'twitter');
      
      expect(prediction).toBeDefined();
      expect(prediction.expectedEngagement).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.aiEnhanced).toBe(true);
    });

    it('should integrate AI optimization with analytics insights', async () => {
      const organizationId = 'test-org-id';
      const content = 'Simple product announcement.';
      
      // Get analytics insights for optimization context
      const insights = await analyticsService.getContentInsights(organizationId);
      
      // AI should optimize based on analytics insights
      const optimization = await aiService.optimizeForAlgorithm(content, 'facebook');
      
      expect(optimization).toBeDefined();
      expect(optimization.optimizedContent).not.toBe(content);
      expect(optimization.optimizationScore).toBeGreaterThan(0);
      expect(optimization.analyticsInformed).toBe(true);
    });

    it('should validate AI predictions against analytics trends', async () => {
      const organizationId = 'test-org-id';
      const content = 'Trending topic discussion with engagement elements!';
      
      // Get current analytics trends
      const trends = await analyticsService.streamRealTimeAnalytics(organizationId);
      
      // AI prediction should align with trends
      const prediction = await aiService.predictPerformance(content, 'twitter');
      
      expect(prediction).toBeDefined();
      expect(prediction.trendAlignment).toBeDefined();
      expect(prediction.trendAlignment.score).toBeGreaterThan(0);
    });
  });

  describe('Real-time + Visualization Integration', () => {
    it('should stream live data to visualization endpoints', async () => {
      const organizationId = 'test-org-id';
      
      // Start real-time monitoring
      const metricsStream = engagementService.streamRealTimeMetrics(organizationId);
      
      // Get first batch of real-time data
      const firstBatch = await metricsStream.next();
      expect(firstBatch.value).toBeDefined();
      expect(firstBatch.value.timestamp).toBeDefined();
      expect(firstBatch.value.metrics).toBeDefined();
      
      // Verify visualization-ready format
      expect(firstBatch.value.visualizationData).toBeDefined();
      expect(firstBatch.value.visualizationData.chartUpdates).toBeDefined();
    });

    it('should update charts with real-time metrics', async () => {
      const organizationId = 'test-org-id';
      
      // Track engagement events
      await engagementService.trackEngagement(organizationId, {
        type: 'post_engagement',
        platform: 'instagram',
        postId: 'real-time-post',
        engagement: { likes: 100, comments: 20 },
        timestamp: new Date(),
      });

      // Get real-time analytics stream
      const analyticsStream = await analyticsService.streamRealTimeAnalytics(organizationId);
      
      expect(analyticsStream.currentMetrics).toBeDefined();
      expect(analyticsStream.chartUpdates).toBeDefined();
      expect(analyticsStream.chartUpdates.engagementTrend).toBeDefined();
    });

    it('should maintain data consistency across real-time streams', async () => {
      const organizationId = 'test-org-id';
      
      // Start multiple streams
      const engagementStream = engagementService.streamRealTimeMetrics(organizationId);
      const analyticsStream = await analyticsService.streamRealTimeAnalytics(organizationId);
      
      // Track an event
      await engagementService.trackEngagement(organizationId, {
        type: 'post_engagement',
        platform: 'facebook',
        postId: 'consistency-post',
        engagement: { likes: 50 },
        timestamp: new Date(),
      });

      // Both streams should reflect the update
      const engagementData = await engagementStream.next();
      
      expect(engagementData.value.metrics.totalEngagement).toBeGreaterThan(0);
      expect(analyticsStream.currentMetrics.engagement).toBeGreaterThan(0);
    });

    it('should handle real-time visualization performance requirements', async () => {
      const organizationId = 'test-org-id';
      const startTime = Date.now();
      
      // Get real-time visualization data
      const visualData = await analyticsService.streamRealTimeAnalytics(organizationId);
      
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(100); // Should be under 100ms
      expect(visualData.performanceMetrics.latency).toBeLessThan(50);
    });

    it('should support concurrent real-time connections', async () => {
      const organizationId = 'test-org-id';
      
      // Start multiple concurrent streams
      const streams = await Promise.all([
        engagementService.streamRealTimeMetrics(organizationId),
        engagementService.streamRealTimeMetrics(organizationId),
        engagementService.streamRealTimeMetrics(organizationId),
      ]);

      expect(streams).toHaveLength(3);
      streams.forEach(stream => {
        expect(stream).toBeDefined();
      });
    });
  });

  describe('Multi-Service Workflow Integration', () => {
    it('should handle complete content optimization workflow', async () => {
      const organizationId = 'test-org-id';
      const originalContent = 'Basic product announcement without optimization.';
      
      // Step 1: AI analyzes content
      const analysis = await aiService.performAdvancedContentAnalysis(originalContent);
      
      // Step 2: AI optimizes based on analytics insights
      const optimization = await aiService.optimizeForAlgorithm(originalContent, 'instagram');
      
      // Step 3: Predict performance with analytics
      const prediction = await analyticsService.predictContentPerformance(organizationId, optimization.optimizedContent, 'instagram');
      
      // Step 4: Track if content is published
      await engagementService.trackEngagement(organizationId, {
        type: 'post_published',
        platform: 'instagram',
        postId: 'optimized-post-123',
        content: optimization.optimizedContent,
        timestamp: new Date(),
      });

      // Verify complete workflow
      expect(analysis.engagementPredictors.overallScore).toBeGreaterThan(0);
      expect(optimization.optimizationScore).toBeGreaterThan(analysis.engagementPredictors.overallScore);
      expect(prediction.expectedEngagement).toBeGreaterThan(0);
    });

    it('should maintain data flow across service boundaries', async () => {
      const organizationId = 'test-org-id';
      const workflow = {
        content: 'Cross-service integration test content 🧪',
        platform: 'linkedin',
        userId: MASTER_CREDENTIALS.manager.email,
      };

      // Analytics: Get baseline metrics
      const baseline = await analyticsService.getComprehensiveDashboard(organizationId);
      
      // AI: Optimize content
      const optimization = await aiService.optimizeForAlgorithm(workflow.content, workflow.platform);
      
      // Analytics: Predict optimized performance
      const prediction = await analyticsService.predictContentPerformance(organizationId, optimization.optimizedContent, workflow.platform);
      
      // Engagement: Track publication
      const trackingResult = await engagementService.trackEngagement(organizationId, {
        type: 'post_published',
        platform: workflow.platform,
        postId: 'cross-service-post',
        content: optimization.optimizedContent,
        timestamp: new Date(),
      });

      // Verify data flow
      expect(baseline).toBeDefined();
      expect(optimization.optimizationScore).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(trackingResult.success).toBe(true);
    });

    it('should handle error cascading across services', async () => {
      const organizationId = 'test-org-id';
      
      // Simulate analytics service failure
      jest.spyOn(analyticsService, 'predictContentPerformance').mockRejectedValue(new Error('Analytics unavailable'));
      
      // AI service should handle gracefully
      const content = 'Error handling test content';
      const prediction = await aiService.predictPerformance(content, 'facebook');
      
      expect(prediction).toBeDefined();
      expect(prediction.fallbackUsed).toBe(true);
      expect(prediction.confidence).toBeLessThan(0.5); // Lower confidence without analytics
    });

    it('should maintain performance under load across services', async () => {
      const organizationId = 'test-org-id';
      const startTime = Date.now();
      
      // Simulate high load scenario
      const promises = Array.from({ length: 10 }, async (_, i) => {
        const content = `Load test content ${i}`;
        
        return Promise.all([
          aiService.performAdvancedContentAnalysis(content),
          analyticsService.predictContentPerformance(organizationId, content, 'twitter'),
          engagementService.trackEngagement(organizationId, {
            type: 'test_event',
            platform: 'twitter',
            postId: `load-test-${i}`,
            timestamp: new Date(),
          }),
        ]);
      });

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      expect(results).toHaveLength(10);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      results.forEach(([analysis, prediction, tracking]) => {
        expect(analysis).toBeDefined();
        expect(prediction).toBeDefined();
        expect(tracking.success).toBe(true);
      });
    });
  });

  describe('Master Credentials Cross-Service Integration', () => {
    it('should maintain user context across all services', async () => {
      const testScenarios = Object.entries(MASTER_CREDENTIALS).map(([role, credentials]) => ({
        role,
        email: credentials.email,
        organizationId: `${role}-org-id`,
      }));

      for (const scenario of testScenarios) {
        // Test all services with user context
        const content = `${scenario.role} test content`;
        
        const [analysis, prediction, tracking] = await Promise.all([
          aiService.performAdvancedContentAnalysis(content),
          analyticsService.predictContentPerformance(scenario.organizationId, content, 'facebook'),
          engagementService.trackEngagement(scenario.organizationId, {
            type: 'user_test',
            platform: 'facebook',
            postId: `${scenario.role}-test-post`,
            userId: scenario.email,
            timestamp: new Date(),
          }),
        ]);

        expect(analysis).toBeDefined();
        expect(prediction).toBeDefined();
        expect(tracking.success).toBe(true);
        expect(tracking.userId).toBe(scenario.email);
      }
    });

    it('should enforce proper data isolation between organizations', async () => {
      const org1 = 'admin-org-1';
      const org2 = 'admin-org-2';
      
      // Create data in different organizations
      await Promise.all([
        engagementService.trackEngagement(org1, {
          type: 'isolation_test',
          platform: 'instagram',
          postId: 'org1-post',
          timestamp: new Date(),
        }),
        engagementService.trackEngagement(org2, {
          type: 'isolation_test',
          platform: 'instagram',
          postId: 'org2-post',
          timestamp: new Date(),
        }),
      ]);

      // Verify data isolation
      const [org1Metrics, org2Metrics] = await Promise.all([
        engagementService.getLiveMetrics(org1),
        engagementService.getLiveMetrics(org2),
      ]);

      expect(org1Metrics).toBeDefined();
      expect(org2Metrics).toBeDefined();
      // Each org should only see their own data
      expect(org1Metrics.organizationId).toBe(org1);
      expect(org2Metrics.organizationId).toBe(org2);
    });

    it('should handle role-based access across service integrations', async () => {
      const organizationId = 'role-based-test-org';
      
      // Admin should have full access
      const adminAnalytics = await analyticsService.getComprehensiveDashboard(organizationId);
      expect(adminAnalytics.fullAccess).toBe(true);
      
      // Client should have limited access
      const clientAnalytics = await analyticsService.getComprehensiveDashboard(organizationId, { role: 'client' });
      expect(clientAnalytics.restrictedAccess).toBe(true);
      expect(clientAnalytics.sensitiveData).toBeUndefined();
    });
  });

  describe('Real-world Integration Scenarios', () => {
    it('should handle viral content detection and optimization cycle', async () => {
      const organizationId = 'viral-test-org';
      
      // Step 1: Track viral content
      await engagementService.trackEngagement(organizationId, {
        type: 'post_engagement',
        platform: 'tiktok',
        postId: 'viral-candidate',
        engagement: { likes: 10000, comments: 500, shares: 800 },
        timestamp: new Date(),
      });

      // Step 2: Analytics detects viral content
      const viralContent = await analyticsService.detectViralContent(organizationId);
      const viralPost = viralContent.find(post => post.id === 'viral-candidate');
      
      expect(viralPost).toBeDefined();
      expect(viralPost?.viralityScore).toBeGreaterThan(0.8);

      // Step 3: AI analyzes viral content patterns
      const viralAnalysis = await aiService.performAdvancedContentAnalysis(viralPost?.content || 'viral content');
      
      expect(viralAnalysis.viralityIndicators.overallScore).toBeGreaterThan(0.7);

      // Step 4: Generate optimized variants based on viral patterns
      const variants = await aiService.generateVariants(viralPost?.content || 'viral content', 'tiktok', 3);
      
      expect(variants.variants).toHaveLength(3);
      variants.variants.forEach(variant => {
        expect(variant.viralOptimized).toBe(true);
      });
    });

    it('should support A/B testing workflow across services', async () => {
      const organizationId = 'ab-test-org';
      const originalContent = 'A/B testing candidate content';
      
      // Step 1: AI generates A/B test recommendations
      const recommendations = await aiService.abTestRecommendations(originalContent);
      
      expect(recommendations.recommendations.length).toBeGreaterThan(0);
      expect(recommendations.testVariants).toBeDefined();

      // Step 2: Analytics predicts performance for variants
      const variantA = recommendations.testVariants[recommendations.recommendations[0].type]?.variant;
      const [predictionA, predictionB] = await Promise.all([
        analyticsService.predictContentPerformance(organizationId, originalContent, 'facebook'),
        analyticsService.predictContentPerformance(organizationId, variantA || originalContent, 'facebook'),
      ]);

      expect(predictionA).toBeDefined();
      expect(predictionB).toBeDefined();

      // Step 3: Track performance for both variants
      await Promise.all([
        engagementService.trackEngagement(organizationId, {
          type: 'ab_test_variant_a',
          platform: 'facebook',
          postId: 'ab-test-control',
          content: originalContent,
          timestamp: new Date(),
        }),
        engagementService.trackEngagement(organizationId, {
          type: 'ab_test_variant_b',
          platform: 'facebook',
          postId: 'ab-test-variant',
          content: variantA,
          timestamp: new Date(),
        }),
      ]);

      // Verify A/B test tracking
      const metrics = await engagementService.getLiveMetrics(organizationId);
      expect(metrics.abTestData).toBeDefined();
    });

    it('should handle competitive analysis integration', async () => {
      const organizationId = 'competitive-analysis-org';
      
      // Step 1: Analytics gathers competitive benchmarks
      const benchmarks = await analyticsService.generatePerformanceBenchmarks(organizationId);
      
      expect(benchmarks.competitorData).toBeDefined();
      expect(benchmarks.industryAverages).toBeDefined();

      // Step 2: AI optimizes content based on competitive insights
      const content = 'Competitive optimization test content';
      const optimization = await aiService.optimizeForAlgorithm(content, 'linkedin');
      
      expect(optimization.competitiveOptimized).toBe(true);
      expect(optimization.benchmarkComparison).toBeDefined();

      // Step 3: Real-time monitoring tracks competitive performance
      const competitiveMetrics = await engagementService.getCompetitiveMetrics(organizationId);
      
      expect(competitiveMetrics.relativePerformance).toBeDefined();
      expect(competitiveMetrics.competitorComparison).toBeDefined();
    });
  });

  describe('System Resilience and Error Recovery', () => {
    it('should gracefully degrade when services are unavailable', async () => {
      const organizationId = 'resilience-test-org';
      
      // Simulate partial service failures
      jest.spyOn(engagementService, 'trackEngagement').mockRejectedValue(new Error('Service unavailable'));
      
      // AI and Analytics should continue working
      const content = 'Resilience test content';
      const [analysis, prediction] = await Promise.all([
        aiService.performAdvancedContentAnalysis(content),
        analyticsService.predictContentPerformance(organizationId, content, 'twitter'),
      ]);

      expect(analysis).toBeDefined();
      expect(analysis.degradedMode).toBe(true);
      expect(prediction).toBeDefined();
      expect(prediction.limitedData).toBe(true);
    });

    it('should handle Redis connection failures gracefully', async () => {
      const organizationId = 'redis-failure-test';
      
      // Simulate Redis failure in engagement service
      jest.spyOn(engagementService, 'streamRealTimeMetrics').mockImplementation(async function* () {
        yield { error: 'Redis connection failed', fallback: true };
      });

      // Services should fall back to alternative storage
      const result = await engagementService.trackEngagement(organizationId, {
        type: 'redis_failure_test',
        platform: 'instagram',
        postId: 'fallback-test',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
    });

    it('should maintain data consistency during partial failures', async () => {
      const organizationId = 'consistency-test-org';
      
      // Simulate intermittent failures
      let failureCount = 0;
      jest.spyOn(analyticsService, 'predictContentPerformance').mockImplementation(async () => {
        if (failureCount++ < 2) {
          throw new Error('Intermittent failure');
        }
        return {
          expectedEngagement: 100,
          confidence: 0.8,
          factors: ['fallback'],
          retrySucceeded: true,
        };
      });

      // System should retry and eventually succeed
      const content = 'Consistency test content';
      const prediction = await analyticsService.predictContentPerformance(organizationId, content, 'facebook');

      expect(prediction).toBeDefined();
      expect(prediction.retrySucceeded).toBe(true);
    });
  });
});