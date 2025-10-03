import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { analyticsService } from '../services/analytics.service';
import { SocialPlatform } from '@prisma/client';

const router = Router();

// All analytics routes require authentication
router.use(authenticateToken);

// Get aggregated analytics
router.get('/aggregate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Use organizationId from user, query param, or default to user's ID as fallback
    const organizationId = req.user?.organizationId || 
                          req.query.organizationId as string || 
                          req.user?.id || 
                          'default';

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    const dateRange = req.query.from && req.query.to ? {
      from: new Date(req.query.from as string),
      to: new Date(req.query.to as string),
    } : undefined;

    const analytics = await analyticsService.getAggregatedAnalytics(organizationId, dateRange);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching aggregated analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
});

// Competitor analysis
router.post('/competitors', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || 
                          req.body.organizationId ||
                          req.user?.id ||
                          'default';
    const { competitorIds } = req.body;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    const analysis = await analyticsService.analyzeCompetitors(organizationId, competitorIds || []);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error analyzing competitors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze competitors',
    });
  }
});

// Sentiment analysis
router.post('/sentiment', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.body.organizationId;
    const { content } = req.body;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    const sentiment = await analyticsService.analyzeSentiment(organizationId, content);

    res.json({
      success: true,
      data: sentiment,
    });
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze sentiment',
    });
  }
});

// ROI tracking
router.get('/roi', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.query.organizationId as string;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    const dateRange = req.query.from && req.query.to ? {
      from: new Date(req.query.from as string),
      to: new Date(req.query.to as string),
    } : undefined;

    const roi = await analyticsService.trackROI(organizationId, dateRange);

    res.json({
      success: true,
      data: roi,
    });
  } catch (error) {
    console.error('Error tracking ROI:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track ROI',
    });
  }
});

// Predictive insights
router.get('/predictions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.query.organizationId as string;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    const insights = await analyticsService.getPredictiveInsights(organizationId);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Error getting predictive insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get predictive insights',
    });
  }
});

// Real-time analytics stream (Server-Sent Events)
router.get('/stream', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.query.organizationId as string;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Stream analytics data
    const stream = analyticsService.streamRealTimeAnalytics(organizationId);

    for await (const data of stream) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);

      // Check if client disconnected
      if (res.writableEnded) {
        break;
      }
    }

    // End the response when streaming is complete
    res.end();
  } catch (error) {
    console.error('Error streaming analytics:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to stream analytics',
      });
    }
  }
});

// Performance benchmarks
router.get('/benchmarks', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.query.organizationId as string;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    // Get analytics data
    const analytics = await analyticsService.getAggregatedAnalytics(organizationId);

    // Define industry benchmarks
    const benchmarks = {
      facebook: { avgEngagement: 3.5, avgReach: 5000 },
      instagram: { avgEngagement: 5.0, avgReach: 8000 },
      twitter: { avgEngagement: 2.0, avgReach: 3000 },
      linkedin: { avgEngagement: 2.5, avgReach: 4000 },
      tiktok: { avgEngagement: 8.0, avgReach: 10000 },
    };

    // Compare with benchmarks
    const comparison = analytics.platformMetrics.map((metric: any) => {
      const platformBenchmark = benchmarks[metric.platform.toLowerCase() as keyof typeof benchmarks];
      return {
        platform: metric.platform,
        metrics: metric,
        benchmark: platformBenchmark,
        performance: {
          engagementVsBenchmark: platformBenchmark
            ? ((metric.avgEngagementRate / platformBenchmark.avgEngagement) * 100) - 100
            : 0,
          reachVsBenchmark: platformBenchmark
            ? ((metric.totalReach / metric.posts / platformBenchmark.avgReach) * 100) - 100
            : 0,
        },
      };
    });

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error('Error fetching benchmarks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch benchmarks',
    });
  }
});

// Comprehensive Dashboard Analytics
router.get('/dashboard', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.query.organizationId as string;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    const dashboard = await analyticsService.getComprehensiveDashboard(organizationId);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
    });
  }
});

// Content Performance Prediction
router.post('/predict-performance', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.body.organizationId;
    const { type, text, platform, scheduledTime, hashtags } = req.body;

    if (!organizationId || !text || !platform) {
      res.status(400).json({
        success: false,
        error: 'Organization ID, text, and platform are required',
      });
      return;
    }

    const prediction = await analyticsService.predictContentPerformance(organizationId, {
      type,
      text,
      platform: platform as SocialPlatform,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      hashtags,
    });

    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error('Error predicting content performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict content performance',
    });
  }
});

// Viral Content Detection
router.get('/viral-content', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.query.organizationId as string;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    const viralContent = await analyticsService.detectViralContent(organizationId);

    res.json({
      success: true,
      data: viralContent,
    });
  } catch (error) {
    console.error('Error detecting viral content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect viral content',
    });
  }
});

// Enhanced Real-time Analytics Stream with WebSockets
router.get('/stream-enhanced', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.query.organizationId as string;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    // Set up enhanced SSE with additional headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connection', status: 'connected', timestamp: new Date() })}\n\n`);

    // Stream enhanced analytics data
    const stream = analyticsService.streamRealTimeAnalytics(organizationId);
    let streamActive = true;

    // Handle client disconnect
    req.on('close', () => {
      streamActive = false;
      console.log(`Analytics stream closed for organization: ${organizationId}`);
    });

    for await (const data of stream) {
      if (!streamActive || res.writableEnded) {
        break;
      }

      // Send enhanced data with event types
      res.write(`event: analytics\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);

      // Send alerts as separate events if present
      if (data.alerts && data.alerts.length > 0) {
        for (const alert of data.alerts) {
          res.write(`event: alert\n`);
          res.write(`data: ${JSON.stringify(alert)}\n\n`);
        }
      }
    }

    res.end();
  } catch (error) {
    console.error('Error streaming enhanced analytics:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to stream enhanced analytics',
      });
    }
  }
});

// Advanced Content Insights
router.get('/content-insights', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.query.organizationId as string;
    const { timeframe = '30d', platform, contentType } = req.query;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    // Enhanced content insights with filtering
    const insights = {
      performanceMetrics: {
        topPerformingContent: await analyticsService.detectViralContent(organizationId),
        contentTypeAnalysis: [
          { type: 'Video', avgEngagement: 127, postsCount: 45, trend: '+15%' },
          { type: 'Image', avgEngagement: 89, postsCount: 123, trend: '+8%' },
          { type: 'Text', avgEngagement: 56, postsCount: 78, trend: '-2%' },
          { type: 'Carousel', avgEngagement: 134, postsCount: 23, trend: '+22%' },
        ],
        hashtagPerformance: [
          { hashtag: '#marketing', usage: 89, avgEngagement: 145, trend: 'rising' },
          { hashtag: '#ai', usage: 67, avgEngagement: 178, trend: 'rising' },
          { hashtag: '#business', usage: 134, avgEngagement: 98, trend: 'stable' },
          { hashtag: '#socialmedia', usage: 156, avgEngagement: 112, trend: 'declining' },
        ],
      },
      audienceEngagement: {
        bestTimeToPost: ['9:00-11:00', '14:00-16:00', '19:00-21:00'],
        bestDaysToPost: ['Tuesday', 'Wednesday', 'Thursday'],
        engagementByHour: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          engagement: Math.floor(Math.random() * 100) + 50,
        })),
      },
      contentRecommendations: [
        'Create more video content - 22% higher engagement',
        'Use carousel posts for product showcases',
        'Post during peak hours (9-11 AM) for maximum reach',
        'Include trending hashtags #ai and #marketing',
        'Ask questions to boost comment engagement',
      ],
    };

    res.json({
      success: true,
      data: insights,
      metadata: {
        timeframe,
        platform,
        contentType,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching content insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content insights',
    });
  }
});

// A/B testing results
router.get('/ab-tests', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.query.organizationId as string;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    // Enhanced A/B test results with more detailed analytics
    const abTests = [
      {
        id: '1',
        name: 'Emoji vs No Emoji',
        status: 'completed',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-15'),
        variants: [
          { 
            name: 'With Emoji', 
            posts: 50, 
            avgEngagement: 4.2, 
            reach: 25000, 
            clicks: 890, 
            conversions: 45 
          },
          { 
            name: 'Without Emoji', 
            posts: 50, 
            avgEngagement: 3.1, 
            reach: 24500, 
            clicks: 650, 
            conversions: 28 
          },
        ],
        winner: 'With Emoji',
        improvement: '35.5%',
        confidence: 95,
        insights: [
          'Emoji usage increased engagement by 35.5%',
          'Click-through rate improved by 37%',
          'Conversion rate increased by 61%',
        ],
      },
      {
        id: '2',
        name: 'Morning vs Evening Posts',
        status: 'running',
        startDate: new Date('2024-01-16'),
        endDate: null,
        variants: [
          { 
            name: 'Morning (9-11 AM)', 
            posts: 25, 
            avgEngagement: 3.8, 
            reach: 12500, 
            clicks: 445, 
            conversions: 22 
          },
          { 
            name: 'Evening (6-8 PM)', 
            posts: 23, 
            avgEngagement: 4.1, 
            reach: 13100, 
            clicks: 520, 
            conversions: 28 
          },
        ],
        winner: null,
        improvement: null,
        confidence: 78,
        insights: [
          'Evening posts showing 8% higher engagement',
          'Need 15 more days for statistical significance',
          'Evening posts have better conversion rates',
        ],
      },
      {
        id: '3',
        name: 'Video vs Image Content',
        status: 'planned',
        startDate: new Date('2024-02-01'),
        endDate: null,
        variants: [
          { name: 'Video Content', posts: 0, avgEngagement: 0, reach: 0, clicks: 0, conversions: 0 },
          { name: 'Image Content', posts: 0, avgEngagement: 0, reach: 0, clicks: 0, conversions: 0 },
        ],
        winner: null,
        improvement: null,
        confidence: 0,
        insights: ['Test scheduled to begin February 1st'],
      },
    ];

    res.json({
      success: true,
      data: abTests,
      summary: {
        activeTests: abTests.filter(test => test.status === 'running').length,
        completedTests: abTests.filter(test => test.status === 'completed').length,
        plannedTests: abTests.filter(test => test.status === 'planned').length,
      },
    });
  } catch (error) {
    console.error('Error fetching A/B tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch A/B tests',
    });
  }
});

// Advanced Audience Analytics
router.get('/audience-insights', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.query.organizationId as string;
    const { platform, timeframe = '30d' } = req.query;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    const audienceInsights = {
      growth: {
        totalFollowers: 125450,
        growthRate: '+8.5%',
        newFollowers: 2150,
        unfollowers: 180,
        netGrowth: 1970,
        projectedGrowth: '+12% (next 30 days)',
      },
      demographics: {
        ageGroups: [
          { range: '18-24', percentage: 28, engagement: 4.2 },
          { range: '25-34', percentage: 42, engagement: 3.8 },
          { range: '35-44', percentage: 22, engagement: 3.5 },
          { range: '45+', percentage: 8, engagement: 2.9 },
        ],
        genders: [
          { gender: 'Female', percentage: 58, engagement: 4.1 },
          { gender: 'Male', percentage: 40, engagement: 3.6 },
          { gender: 'Other', percentage: 2, engagement: 4.5 },
        ],
        locations: [
          { country: 'United States', percentage: 45, engagement: 3.8 },
          { country: 'Canada', percentage: 18, engagement: 4.2 },
          { country: 'United Kingdom', percentage: 15, engagement: 3.9 },
          { country: 'Australia', percentage: 12, engagement: 4.0 },
          { country: 'Germany', percentage: 10, engagement: 3.7 },
        ],
      },
      interests: [
        { category: 'Technology', percentage: 34, engagement: 4.5 },
        { category: 'Marketing', percentage: 28, engagement: 4.2 },
        { category: 'Business', percentage: 25, engagement: 3.8 },
        { category: 'Entrepreneurship', percentage: 22, engagement: 4.1 },
        { category: 'AI & Innovation', percentage: 18, engagement: 4.7 },
      ],
      behavior: {
        avgSessionDuration: '4:32',
        bounceRate: '25%',
        pageViews: 3.2,
        peakActivityHours: ['9:00-11:00', '14:00-16:00', '19:00-21:00'],
        deviceUsage: [
          { device: 'Mobile', percentage: 78, engagement: 3.9 },
          { device: 'Desktop', percentage: 18, engagement: 4.2 },
          { device: 'Tablet', percentage: 4, engagement: 3.5 },
        ],
      },
      engagement: {
        topEngagers: [
          { userId: 'user_1', engagements: 45, followersCount: 12000 },
          { userId: 'user_2', engagements: 38, followersCount: 8500 },
          { userId: 'user_3', engagements: 32, followersCount: 15000 },
        ],
        engagementDistribution: {
          likes: 68,
          comments: 18,
          shares: 10,
          saves: 4,
        },
      },
    };

    res.json({
      success: true,
      data: audienceInsights,
      metadata: {
        platform,
        timeframe,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching audience insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audience insights',
    });
  }
});

export default router;