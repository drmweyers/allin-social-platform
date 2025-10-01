import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { analyticsService } from '../services/analytics.service';

const router = Router();

// All analytics routes require authentication
router.use(authenticateToken);

// Get aggregated analytics
router.get('/aggregate', async (req: AuthRequest, res: Response): Promise<void> => {
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
    const organizationId = req.user?.organizationId || req.body.organizationId;
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

    // Mock A/B test results (in production, would track actual tests)
    const abTests = [
      {
        id: '1',
        name: 'Emoji vs No Emoji',
        status: 'completed',
        variants: [
          { name: 'With Emoji', posts: 50, avgEngagement: 4.2 },
          { name: 'Without Emoji', posts: 50, avgEngagement: 3.1 },
        ],
        winner: 'With Emoji',
        improvement: '35.5%',
      },
      {
        id: '2',
        name: 'Morning vs Evening Posts',
        status: 'running',
        variants: [
          { name: 'Morning (9-11 AM)', posts: 25, avgEngagement: 3.8 },
          { name: 'Evening (6-8 PM)', posts: 23, avgEngagement: 4.1 },
        ],
        winner: null,
        improvement: null,
      },
    ];

    res.json({
      success: true,
      data: abTests,
    });
  } catch (error) {
    console.error('Error fetching A/B tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch A/B tests',
    });
  }
});

export default router;