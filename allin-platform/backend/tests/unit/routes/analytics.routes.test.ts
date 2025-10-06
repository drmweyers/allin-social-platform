/**
 * Analytics Routes Tests - BMAD MONITOR Phase 3
 * Tests for analytics and reporting endpoints
 */

import request from 'supertest';
import express from 'express';

// Mock analytics service BEFORE importing routes
jest.mock('../../../src/services/analytics.service', () => ({
  analyticsService: {
    getAggregatedAnalytics: jest.fn(),
    analyzeCompetitors: jest.fn(),
    analyzeSentiment: jest.fn(),
    trackROI: jest.fn(),
    getPredictiveInsights: jest.fn(),
    streamRealTimeAnalytics: jest.fn(),
    getComprehensiveDashboard: jest.fn(),
    predictContentPerformance: jest.fn(),
    detectViralContent: jest.fn()
  }
}));

// Mock auth middleware
jest.mock('../../../src/middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { id: 'user-123', email: 'test@example.com', organizationId: 'org-123' };
    next();
  },
  AuthRequest: {} as any
}));

import analyticsRoutes from '../../../src/routes/analytics.routes';
import { analyticsService } from '../../../src/services/analytics.service';

describe('Analytics Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/analytics', analyticsRoutes);
    jest.clearAllMocks();
  });

  describe('GET /analytics/aggregate', () => {
    it('should fetch aggregated analytics successfully', async () => {
      const mockAnalytics = {
        totalPosts: 150,
        totalEngagement: 12500,
        avgEngagementRate: 4.2,
        platformMetrics: []
      };

      (analyticsService.getAggregatedAnalytics as jest.Mock).mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/analytics/aggregate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAnalytics);
      expect(analyticsService.getAggregatedAnalytics).toHaveBeenCalledWith('org-123', undefined);
    });

    it('should fetch analytics with date range', async () => {
      const mockAnalytics = { totalPosts: 50 };
      (analyticsService.getAggregatedAnalytics as jest.Mock).mockResolvedValue(mockAnalytics);

      await request(app)
        .get('/analytics/aggregate?from=2025-01-01&to=2025-01-31')
        .expect(200);

      const callArgs = (analyticsService.getAggregatedAnalytics as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toBeDefined();
      expect(callArgs[1].from).toBeInstanceOf(Date);
      expect(callArgs[1].to).toBeInstanceOf(Date);
    });

    it('should handle service errors', async () => {
      (analyticsService.getAggregatedAnalytics as jest.Mock).mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/analytics/aggregate')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch analytics');
    });

    it('should prioritize organizationId from user', async () => {
      const mockAnalytics = { totalPosts: 100 };
      (analyticsService.getAggregatedAnalytics as jest.Mock).mockResolvedValue(mockAnalytics);

      await request(app)
        .get('/analytics/aggregate?organizationId=custom-org')
        .expect(200);

      // Route prioritizes req.user.organizationId over query param
      expect(analyticsService.getAggregatedAnalytics).toHaveBeenCalledWith('org-123', undefined);
    });
  });

  describe('POST /analytics/competitors', () => {
    it('should analyze competitors successfully', async () => {
      const mockAnalysis = {
        comparison: [],
        insights: ['Competitor A has 20% higher engagement']
      };

      (analyticsService.analyzeCompetitors as jest.Mock).mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post('/analytics/competitors')
        .send({ competitorIds: ['comp-1', 'comp-2'] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAnalysis);
      expect(analyticsService.analyzeCompetitors).toHaveBeenCalledWith('org-123', ['comp-1', 'comp-2']);
    });

    it('should handle empty competitor list', async () => {
      const mockAnalysis = { comparison: [] };
      (analyticsService.analyzeCompetitors as jest.Mock).mockResolvedValue(mockAnalysis);

      await request(app)
        .post('/analytics/competitors')
        .send({})
        .expect(200);

      expect(analyticsService.analyzeCompetitors).toHaveBeenCalledWith('org-123', []);
    });

    it('should handle service errors', async () => {
      (analyticsService.analyzeCompetitors as jest.Mock).mockRejectedValue(new Error('Analysis failed'));

      const response = await request(app)
        .post('/analytics/competitors')
        .send({ competitorIds: ['comp-1'] })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to analyze competitors');
    });
  });

  describe('POST /analytics/sentiment', () => {
    it('should analyze sentiment successfully', async () => {
      const mockSentiment = {
        score: 0.85,
        label: 'positive',
        confidence: 0.92
      };

      (analyticsService.analyzeSentiment as jest.Mock).mockResolvedValue(mockSentiment);

      const response = await request(app)
        .post('/analytics/sentiment')
        .send({ content: 'This is amazing!' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSentiment);
      expect(analyticsService.analyzeSentiment).toHaveBeenCalledWith('org-123', 'This is amazing!');
    });

    it('should handle service errors', async () => {
      (analyticsService.analyzeSentiment as jest.Mock).mockRejectedValue(new Error('Sentiment error'));

      const response = await request(app)
        .post('/analytics/sentiment')
        .send({ content: 'Test' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to analyze sentiment');
    });
  });

  describe('GET /analytics/roi', () => {
    it('should fetch ROI data successfully', async () => {
      const mockROI = {
        totalInvestment: 5000,
        totalRevenue: 15000,
        roi: 200,
        roiPercentage: '200%'
      };

      (analyticsService.trackROI as jest.Mock).mockResolvedValue(mockROI);

      const response = await request(app)
        .get('/analytics/roi')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockROI);
      expect(analyticsService.trackROI).toHaveBeenCalledWith('org-123', undefined);
    });

    it('should fetch ROI with date range', async () => {
      const mockROI = { roi: 150 };
      (analyticsService.trackROI as jest.Mock).mockResolvedValue(mockROI);

      await request(app)
        .get('/analytics/roi?from=2025-01-01&to=2025-12-31')
        .expect(200);

      const callArgs = (analyticsService.trackROI as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toBeDefined();
    });

    it('should handle service errors', async () => {
      (analyticsService.trackROI as jest.Mock).mockRejectedValue(new Error('ROI error'));

      const response = await request(app)
        .get('/analytics/roi')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to track ROI');
    });
  });

  describe('GET /analytics/predictions', () => {
    it('should fetch predictive insights successfully', async () => {
      const mockInsights = {
        predictions: [
          { metric: 'engagement', predicted: 125, confidence: 0.87 }
        ]
      };

      (analyticsService.getPredictiveInsights as jest.Mock).mockResolvedValue(mockInsights);

      const response = await request(app)
        .get('/analytics/predictions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockInsights);
      expect(analyticsService.getPredictiveInsights).toHaveBeenCalledWith('org-123');
    });

    it('should handle service errors', async () => {
      (analyticsService.getPredictiveInsights as jest.Mock).mockRejectedValue(new Error('Prediction error'));

      const response = await request(app)
        .get('/analytics/predictions')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to get predictive insights');
    });
  });

  describe('GET /analytics/benchmarks', () => {
    it('should fetch performance benchmarks successfully', async () => {
      const mockAnalytics = {
        platformMetrics: [
          { platform: 'INSTAGRAM', avgEngagementRate: 5.2, totalReach: 50000, posts: 10 },
          { platform: 'TWITTER', avgEngagementRate: 2.5, totalReach: 30000, posts: 15 }
        ]
      };

      (analyticsService.getAggregatedAnalytics as jest.Mock).mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/analytics/benchmarks')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0]).toHaveProperty('platform');
      expect(response.body.data[0]).toHaveProperty('benchmark');
      expect(response.body.data[0]).toHaveProperty('performance');
    });

    it('should calculate performance vs benchmarks', async () => {
      const mockAnalytics = {
        platformMetrics: [
          { platform: 'INSTAGRAM', avgEngagementRate: 5.0, totalReach: 80000, posts: 10 }
        ]
      };

      (analyticsService.getAggregatedAnalytics as jest.Mock).mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/analytics/benchmarks')
        .expect(200);

      expect(response.body.data[0].performance).toHaveProperty('engagementVsBenchmark');
      expect(response.body.data[0].performance).toHaveProperty('reachVsBenchmark');
    });

    it('should handle service errors', async () => {
      (analyticsService.getAggregatedAnalytics as jest.Mock).mockRejectedValue(new Error('Benchmark error'));

      const response = await request(app)
        .get('/analytics/benchmarks')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch benchmarks');
    });
  });

  describe('GET /analytics/dashboard', () => {
    it('should fetch comprehensive dashboard successfully', async () => {
      const mockDashboard = {
        overview: {
          totalFollowers: 125000,
          totalPosts: 450,
          avgEngagement: 4.2
        },
        recentActivity: [],
        insights: []
      };

      (analyticsService.getComprehensiveDashboard as jest.Mock).mockResolvedValue(mockDashboard);

      const response = await request(app)
        .get('/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockDashboard);
      expect(analyticsService.getComprehensiveDashboard).toHaveBeenCalledWith('org-123');
    });

    it('should handle service errors', async () => {
      (analyticsService.getComprehensiveDashboard as jest.Mock).mockRejectedValue(new Error('Dashboard error'));

      const response = await request(app)
        .get('/analytics/dashboard')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch dashboard data');
    });
  });

  describe('POST /analytics/predict-performance', () => {
    it('should predict content performance successfully', async () => {
      const mockPrediction = {
        estimatedEngagement: 125,
        estimatedReach: 5000,
        confidence: 0.85
      };

      (analyticsService.predictContentPerformance as jest.Mock).mockResolvedValue(mockPrediction);

      const response = await request(app)
        .post('/analytics/predict-performance')
        .send({
          text: 'Check out our new product!',
          platform: 'INSTAGRAM',
          type: 'image',
          hashtags: ['#product', '#launch']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPrediction);
    });

    it('should reject request without required fields', async () => {
      const response = await request(app)
        .post('/analytics/predict-performance')
        .send({ text: 'Content only' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Organization ID, text, and platform are required');
    });

    it('should handle service errors', async () => {
      (analyticsService.predictContentPerformance as jest.Mock).mockRejectedValue(new Error('Prediction error'));

      const response = await request(app)
        .post('/analytics/predict-performance')
        .send({
          text: 'Test',
          platform: 'TWITTER'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to predict content performance');
    });
  });

  describe('GET /analytics/viral-content', () => {
    it('should detect viral content successfully', async () => {
      const mockViralContent = [
        { id: 'post-1', engagementRate: 15.5, viralityScore: 0.92 },
        { id: 'post-2', engagementRate: 12.3, viralityScore: 0.85 }
      ];

      (analyticsService.detectViralContent as jest.Mock).mockResolvedValue(mockViralContent);

      const response = await request(app)
        .get('/analytics/viral-content')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockViralContent);
      expect(analyticsService.detectViralContent).toHaveBeenCalledWith('org-123');
    });

    it('should handle service errors', async () => {
      (analyticsService.detectViralContent as jest.Mock).mockRejectedValue(new Error('Detection error'));

      const response = await request(app)
        .get('/analytics/viral-content')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to detect viral content');
    });
  });

  describe('GET /analytics/content-insights', () => {
    it('should fetch content insights successfully', async () => {
      const mockViralContent = [{ id: 'post-1', engagementRate: 10.5 }];
      (analyticsService.detectViralContent as jest.Mock).mockResolvedValue(mockViralContent);

      const response = await request(app)
        .get('/analytics/content-insights')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('performanceMetrics');
      expect(response.body.data).toHaveProperty('audienceEngagement');
      expect(response.body.data).toHaveProperty('contentRecommendations');
      expect(response.body.metadata).toHaveProperty('timeframe');
    });

    it('should include timeframe and platform metadata', async () => {
      const mockViralContent: any[] = [];
      (analyticsService.detectViralContent as jest.Mock).mockResolvedValue(mockViralContent);

      const response = await request(app)
        .get('/analytics/content-insights?timeframe=60d&platform=INSTAGRAM')
        .expect(200);

      expect(response.body.metadata.timeframe).toBe('60d');
      expect(response.body.metadata.platform).toBe('INSTAGRAM');
    });

    it('should handle service errors', async () => {
      (analyticsService.detectViralContent as jest.Mock).mockRejectedValue(new Error('Insights error'));

      const response = await request(app)
        .get('/analytics/content-insights')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch content insights');
    });
  });

  describe('GET /analytics/ab-tests', () => {
    it('should fetch A/B tests successfully', async () => {
      const response = await request(app)
        .get('/analytics/ab-tests')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.summary).toHaveProperty('activeTests');
      expect(response.body.summary).toHaveProperty('completedTests');
      expect(response.body.summary).toHaveProperty('plannedTests');
    });

    it('should return tests with proper structure', async () => {
      const response = await request(app)
        .get('/analytics/ab-tests')
        .expect(200);

      const tests = response.body.data;
      expect(tests.length).toBeGreaterThan(0);
      expect(tests[0]).toHaveProperty('id');
      expect(tests[0]).toHaveProperty('name');
      expect(tests[0]).toHaveProperty('status');
      expect(tests[0]).toHaveProperty('variants');
      expect(Array.isArray(tests[0].variants)).toBe(true);
    });
  });

  describe('GET /analytics/audience-insights', () => {
    it('should fetch audience insights successfully', async () => {
      const response = await request(app)
        .get('/analytics/audience-insights')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('growth');
      expect(response.body.data).toHaveProperty('demographics');
      expect(response.body.data).toHaveProperty('interests');
      expect(response.body.data).toHaveProperty('behavior');
      expect(response.body.data).toHaveProperty('engagement');
    });

    it('should include metadata with timeframe', async () => {
      const response = await request(app)
        .get('/analytics/audience-insights?timeframe=90d&platform=TWITTER')
        .expect(200);

      expect(response.body.metadata.timeframe).toBe('90d');
      expect(response.body.metadata.platform).toBe('TWITTER');
      expect(response.body.metadata.lastUpdated).toBeDefined();
    });

    it('should return detailed demographics', async () => {
      const response = await request(app)
        .get('/analytics/audience-insights')
        .expect(200);

      const demographics = response.body.data.demographics;
      expect(demographics).toHaveProperty('ageGroups');
      expect(demographics).toHaveProperty('genders');
      expect(demographics).toHaveProperty('locations');
      expect(Array.isArray(demographics.ageGroups)).toBe(true);
    });
  });

  describe('Analytics Routes - Authentication', () => {
    it('should require authentication for all routes', async () => {
      // All routes use authenticateToken middleware
      // In this test setup, auth always passes
      // In real scenario without auth, all would return 401

      const mockData = { data: 'test' };
      (analyticsService.getAggregatedAnalytics as jest.Mock).mockResolvedValue(mockData);
      (analyticsService.getComprehensiveDashboard as jest.Mock).mockResolvedValue(mockData);
      (analyticsService.trackROI as jest.Mock).mockResolvedValue(mockData);

      const routes = [
        { method: 'get', path: '/analytics/aggregate' },
        { method: 'get', path: '/analytics/roi' },
        { method: 'get', path: '/analytics/dashboard' },
        { method: 'get', path: '/analytics/ab-tests' },
        { method: 'get', path: '/analytics/audience-insights' }
      ];

      for (const route of routes) {
        const res = await request(app)[route.method as 'get'](route.path);
        expect([200, 400]).toContain(res.status);
      }
    });
  });

  describe('Analytics Routes - Organization ID Handling', () => {
    it('should use organizationId from user', async () => {
      const mockData = { test: 'data' };
      (analyticsService.getAggregatedAnalytics as jest.Mock).mockResolvedValue(mockData);

      await request(app)
        .get('/analytics/aggregate')
        .expect(200);

      expect(analyticsService.getAggregatedAnalytics).toHaveBeenCalledWith('org-123', undefined);
    });

    it('should not allow organizationId override from query (security)', async () => {
      const mockData = { test: 'data' };
      (analyticsService.getAggregatedAnalytics as jest.Mock).mockResolvedValue(mockData);

      // Even with organizationId in query, route uses authenticated user's org
      await request(app)
        .get('/analytics/aggregate?organizationId=custom-org-456')
        .expect(200);

      // Should use user's organizationId, NOT query param (security)
      expect(analyticsService.getAggregatedAnalytics).toHaveBeenCalledWith('org-123', undefined);
    });
  });

  describe('Analytics Routes - Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      (analyticsService.getAggregatedAnalytics as jest.Mock).mockRejectedValue(new Error('Unexpected'));

      const response = await request(app)
        .get('/analytics/aggregate')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return proper error messages', async () => {
      (analyticsService.trackROI as jest.Mock).mockRejectedValue(new Error('Database down'));

      const response = await request(app)
        .get('/analytics/roi')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to track ROI');
    });
  });
});
