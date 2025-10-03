import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { engagementMonitoringService, EngagementEvent } from '../services/engagement-monitoring.service';
import { SocialPlatform } from '@prisma/client';

const router = Router();

// All engagement monitoring routes require authentication
router.use(authenticateToken);

// Real-time engagement metrics stream
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

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection confirmation
    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ status: 'connected', timestamp: new Date() })}\n\n`);

    console.log(`🔥 Real-time engagement monitoring started for organization: ${organizationId}`);

    // Stream real-time metrics
    const stream = engagementMonitoringService.streamRealTimeMetrics(organizationId);
    let streamActive = true;

    // Handle client disconnect
    req.on('close', () => {
      streamActive = false;
      console.log(`📊 Engagement monitoring stream closed for organization: ${organizationId}`);
    });

    req.on('error', (error) => {
      console.error('Stream error:', error);
      streamActive = false;
    });

    // Stream data to client
    for await (const data of stream) {
      if (!streamActive || res.writableEnded) {
        break;
      }

      try {
        // Send metrics update
        res.write(`event: metrics\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);

        // Send individual alerts as separate events
        if (data.alerts && data.alerts.length > 0) {
          for (const alert of data.alerts) {
            res.write(`event: alert\n`);
            res.write(`data: ${JSON.stringify(alert)}\n\n`);
          }
        }

        // Send trend updates
        if (data.trends) {
          res.write(`event: trends\n`);
          res.write(`data: ${JSON.stringify(data.trends)}\n\n`);
        }
      } catch (error) {
        console.error('Error writing to stream:', error);
        break;
      }
    }

    res.end();
  } catch (error) {
    console.error('Error in engagement stream:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to start engagement monitoring stream',
      });
    }
  }
});

// Track manual engagement event
router.post('/track', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.body.organizationId;
    const { type, postId, userId, platform, data } = req.body;

    if (!organizationId || !type || !platform) {
      res.status(400).json({
        success: false,
        error: 'Organization ID, type, and platform are required',
      });
      return;
    }

    const event: EngagementEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      postId,
      userId,
      platform: platform as SocialPlatform,
      timestamp: new Date(),
      data: data || {},
      organizationId,
    };

    const result = await engagementMonitoringService.trackEngagement(event);

    res.json({
      success: true,
      data: {
        eventId: event.id,
        alertsTriggered: result.alertsTriggered,
        timestamp: event.timestamp,
      },
    });
  } catch (error) {
    console.error('Error tracking engagement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track engagement event',
    });
  }
});

// Get current engagement alerts
router.get('/alerts', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.query.organizationId as string;
    const { unreadOnly = 'false', limit = '50' } = req.query;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    // In a real implementation, this would query the database
    // For now, we'll simulate with some mock alerts
    const mockAlerts = [
      {
        id: 'alert_1',
        type: 'spike',
        severity: 'high',
        title: 'Engagement Spike Detected! 🚀',
        message: 'Your Instagram post is receiving 300% more engagement than usual',
        platform: 'INSTAGRAM',
        timestamp: new Date(),
        data: { increasePercentage: 300 },
        organizationId,
        read: false,
      },
      {
        id: 'alert_2',
        type: 'viral',
        severity: 'high',
        title: 'Content Going Viral!',
        message: 'Your TikTok video has reached 10,000 views in 2 hours',
        platform: 'TIKTOK',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        data: { views: 10000, timeframe: '2 hours' },
        organizationId,
        read: false,
      },
      {
        id: 'alert_3',
        type: 'negative_sentiment',
        severity: 'medium',
        title: 'Negative Sentiment Alert',
        message: '25% of recent mentions contain negative sentiment',
        platform: 'TWITTER',
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        data: { negativeSentimentPercentage: 25 },
        organizationId,
        read: true,
      },
    ];

    let filteredAlerts = mockAlerts;
    
    if (unreadOnly === 'true') {
      filteredAlerts = mockAlerts.filter(alert => !alert.read);
    }

    filteredAlerts = filteredAlerts.slice(0, parseInt(limit as string));

    res.json({
      success: true,
      data: filteredAlerts,
      metadata: {
        total: mockAlerts.length,
        unread: mockAlerts.filter(alert => !alert.read).length,
        filtered: filteredAlerts.length,
      },
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engagement alerts',
    });
  }
});

// Mark alerts as read
router.patch('/alerts/:alertId/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { alertId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    // In a real implementation, this would update the database
    console.log(`✅ Marked alert ${alertId} as read for organization ${organizationId}`);

    res.json({
      success: true,
      data: {
        alertId,
        markedRead: true,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark alert as read',
    });
  }
});

// Get engagement statistics
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.query.organizationId as string;
    const { timeframe = '24h' } = req.query;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    // Mock engagement statistics
    const stats = {
      summary: {
        totalEngagements: 2847,
        avgEngagementRate: 4.2,
        peakEngagementHour: '19:00',
        mostActiveDay: 'Wednesday',
      },
      byPlatform: [
        {
          platform: 'INSTAGRAM',
          engagements: 1245,
          growth: '+15%',
          topContent: 'Behind-the-scenes video',
        },
        {
          platform: 'TIKTOK',
          engagements: 892,
          growth: '+22%',
          topContent: 'Product demo',
        },
        {
          platform: 'TWITTER',
          engagements: 456,
          growth: '+8%',
          topContent: 'Industry insights thread',
        },
        {
          platform: 'LINKEDIN',
          engagements: 254,
          growth: '+12%',
          topContent: 'Company milestone post',
        },
      ],
      engagementTypes: [
        { type: 'likes', count: 1890, percentage: 66.4 },
        { type: 'comments', count: 512, percentage: 18.0 },
        { type: 'shares', count: 285, percentage: 10.0 },
        { type: 'saves', count: 160, percentage: 5.6 },
      ],
      hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        engagements: Math.floor(Math.random() * 200) + 50,
      })),
      trends: {
        engagement: '+18%',
        reach: '+12%',
        impressions: '+25%',
        followers: '+5%',
      },
    };

    res.json({
      success: true,
      data: stats,
      metadata: {
        timeframe,
        generatedAt: new Date(),
        organizationId,
      },
    });
  } catch (error) {
    console.error('Error fetching engagement stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engagement statistics',
    });
  }
});

// Configure notification preferences
router.put('/notifications/preferences', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.body.organizationId;
    const preferences = req.body;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    // Validate preferences structure
    const validPreferences = {
      engagementSpikes: Boolean(preferences.engagementSpikes),
      viralContent: Boolean(preferences.viralContent),
      negativeSentiment: Boolean(preferences.negativeSentiment),
      influencerMentions: Boolean(preferences.influencerMentions),
      competitorActivity: Boolean(preferences.competitorActivity),
      email: Boolean(preferences.email),
      push: Boolean(preferences.push),
      sms: Boolean(preferences.sms),
      thresholds: {
        engagementSpike: parseInt(preferences.thresholds?.engagementSpike || '200'),
        viralThreshold: parseInt(preferences.thresholds?.viralThreshold || '1000'),
        sentimentThreshold: parseInt(preferences.thresholds?.sentimentThreshold || '40'),
      },
    };

    // In a real implementation, this would save to database
    console.log(`💾 Updated notification preferences for organization ${organizationId}:`, validPreferences);

    res.json({
      success: true,
      data: {
        organizationId,
        preferences: validPreferences,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences',
    });
  }
});

// Test notification system
router.post('/notifications/test', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.body.organizationId;
    const { type = 'spike' } = req.body;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
      return;
    }

    // Create a test alert
    const testAlert = {
      id: `test_${Date.now()}`,
      type,
      severity: 'medium' as const,
      title: 'Test Notification',
      message: 'This is a test notification to verify your alert system is working',
      platform: SocialPlatform.INSTAGRAM,
      timestamp: new Date(),
      data: { test: true },
      organizationId,
      read: false,
    };

    await engagementMonitoringService.sendAlert(testAlert);

    res.json({
      success: true,
      data: {
        message: 'Test notification sent successfully',
        alert: testAlert,
      },
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
    });
  }
});

export default router;