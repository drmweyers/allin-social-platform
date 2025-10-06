/**
 * AI Chat - Strategic Recommendations Tests
 * Category 3: Strategic Recommendations (5 features, 42 tests)
 */

import request from 'supertest';
import express from 'express';
import {
  MASTER_TEST_CREDENTIALS
} from './test-fixtures';

// Mock conversation service
const mockOptimizeContentStrategy = jest.fn();
const mockRecommendPostingTimes = jest.fn();
const mockSuggestHashtagsAndCaptions = jest.fn();
const mockAnalyzeCampaignPerformance = jest.fn();
const mockOptimizeROI = jest.fn();

jest.mock('../../../src/services/conversation.service', () => ({
  conversationService: {
    optimizeContentStrategy: mockOptimizeContentStrategy,
    recommendPostingTimes: mockRecommendPostingTimes,
    suggestHashtagsAndCaptions: mockSuggestHashtagsAndCaptions,
    analyzeCampaignPerformance: mockAnalyzeCampaignPerformance,
    optimizeROI: mockOptimizeROI
  }
}));

// Mock authentication middleware
jest.mock('../../../src/middleware/auth', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = {
      id: MASTER_TEST_CREDENTIALS.admin.id,
      email: MASTER_TEST_CREDENTIALS.admin.email,
      organizationId: MASTER_TEST_CREDENTIALS.admin.organizationId,
      role: MASTER_TEST_CREDENTIALS.admin.role
    };
    next();
  }
}));

// Import auth middleware mock
import { authMiddleware } from '../../../src/middleware/auth';

// Create test routes
const router = express.Router();
router.use(authMiddleware);

// Feature 3.1: Content Strategy Optimization
router.post('/strategy/optimize', async (req, res) => {
  try {
    const { goals, currentStrategy, timeframe } = req.body;
    const organizationId = req.user?.organizationId;

    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Goals array is required and must not be empty'
      });
    }

    const optimization = await mockOptimizeContentStrategy(
      organizationId,
      goals,
      currentStrategy,
      timeframe
    );
    return res.json({ success: true, data: optimization });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to optimize content strategy',
      message: (error as Error).message
    });
  }
});

// Feature 3.2: Posting Time Recommendations
router.post('/strategy/posting-times', async (req, res) => {
  try {
    const { platform, contentType, audienceTimezone } = req.body;
    const organizationId = req.user?.organizationId;

    if (!platform) {
      return res.status(400).json({
        success: false,
        error: 'Platform is required'
      });
    }

    const recommendations = await mockRecommendPostingTimes(
      organizationId,
      platform,
      contentType,
      audienceTimezone
    );
    return res.json({ success: true, data: recommendations });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to recommend posting times',
      message: (error as Error).message
    });
  }
});

// Feature 3.3: Hashtag & Caption Suggestions
router.post('/strategy/hashtags-captions', async (req, res) => {
  try {
    const { content, platform, industry, tone } = req.body;
    const organizationId = req.user?.organizationId;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    if (!platform) {
      return res.status(400).json({
        success: false,
        error: 'Platform is required'
      });
    }

    const suggestions = await mockSuggestHashtagsAndCaptions(
      organizationId,
      content,
      platform,
      industry,
      tone
    );
    return res.json({ success: true, data: suggestions });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions',
      message: (error as Error).message
    });
  }
});

// Feature 3.4: Campaign Performance Analysis
router.post('/strategy/campaign-analysis', async (req, res) => {
  try {
    const { campaignId, metrics, compareWith } = req.body;
    const organizationId = req.user?.organizationId;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        error: 'Campaign ID is required'
      });
    }

    const analysis = await mockAnalyzeCampaignPerformance(
      organizationId,
      campaignId,
      metrics,
      compareWith
    );
    return res.json({ success: true, data: analysis });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze campaign',
      message: (error as Error).message
    });
  }
});

// Feature 3.5: ROI & Budget Allocation
router.post('/strategy/roi-optimization', async (req, res) => {
  try {
    const { currentBudget, campaigns, goals } = req.body;
    const organizationId = req.user?.organizationId;

    if (!currentBudget || typeof currentBudget !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Current budget is required and must be a number'
      });
    }

    if (!campaigns || !Array.isArray(campaigns)) {
      return res.status(400).json({
        success: false,
        error: 'Campaigns array is required'
      });
    }

    const optimization = await mockOptimizeROI(
      organizationId,
      currentBudget,
      campaigns,
      goals
    );
    return res.json({ success: true, data: optimization });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to optimize ROI',
      message: (error as Error).message
    });
  }
});

// Create Express app
const app = express();
app.use(express.json());
app.use('/api/ai-chat', router);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AI Chat - Strategic Recommendations', () => {
  describe('POST /api/ai-chat/strategy/optimize', () => {
    it('should optimize content strategy for engagement goal', async () => {
      const mockOptimization = {
        goals: ['increase_engagement'],
        currentPerformance: {
          engagement: 0.042,
          reach: 126000,
          followers: 41600
        },
        recommendations: [
          {
            priority: 'high',
            recommendation: 'Increase video content by 50%',
            expectedImpact: '+18% engagement',
            effort: 'medium',
            timeline: '2 weeks'
          },
          {
            priority: 'high',
            recommendation: 'Post on Tuesday-Wednesday at 2-4 PM',
            expectedImpact: '+12% engagement',
            effort: 'low',
            timeline: 'immediate'
          },
          {
            priority: 'medium',
            recommendation: 'Use more interactive content (polls, questions)',
            expectedImpact: '+8% engagement',
            effort: 'low',
            timeline: '1 week'
          }
        ],
        contentMix: {
          current: { video: 0.2, image: 0.6, text: 0.2 },
          recommended: { video: 0.4, image: 0.4, text: 0.2 },
          rationale: 'Video content shows 2x engagement vs images'
        },
        actionPlan: [
          'Week 1: Create 3 video posts for Tuesday/Wednesday',
          'Week 2: Add polls to Instagram Stories',
          'Week 3: Evaluate results and adjust'
        ]
      };

      mockOptimizeContentStrategy.mockResolvedValue(mockOptimization);

      const response = await request(app)
        .post('/api/ai-chat/strategy/optimize')
        .send({
          goals: ['increase_engagement'],
          currentStrategy: {
            postingFrequency: 'daily',
            contentMix: { video: 0.2, image: 0.6, text: 0.2 }
          },
          timeframe: '30d'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toHaveLength(3);
      expect(response.body.data.recommendations[0].priority).toBe('high');
      expect(response.body.data.contentMix.recommended.video).toBe(0.4);
      expect(mockOptimizeContentStrategy).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        ['increase_engagement'],
        expect.any(Object),
        '30d'
      );
    });

    it('should optimize for multiple goals (engagement + followers)', async () => {
      const mockOptimization = {
        goals: ['increase_engagement', 'grow_followers'],
        recommendations: [
          {
            priority: 'high',
            recommendation: 'Cross-promote on multiple platforms',
            expectedImpact: '+15% follower growth, +10% engagement'
          },
          {
            priority: 'high',
            recommendation: 'Collaborate with influencers in your niche',
            expectedImpact: '+25% follower growth'
          }
        ]
      };

      mockOptimizeContentStrategy.mockResolvedValue(mockOptimization);

      const response = await request(app)
        .post('/api/ai-chat/strategy/optimize')
        .send({
          goals: ['increase_engagement', 'grow_followers'],
          timeframe: '60d'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.goals).toContain('increase_engagement');
      expect(response.body.data.goals).toContain('grow_followers');
      expect(response.body.data.recommendations).toHaveLength(2);
    });

    it('should provide platform-specific recommendations', async () => {
      const mockOptimization = {
        platformSpecific: {
          instagram: {
            recommendations: ['Use Reels', 'Post Stories daily', 'Use trending hashtags'],
            expectedImpact: '+20% engagement'
          },
          twitter: {
            recommendations: ['Tweet threads', 'Engage with trending topics', 'Use polls'],
            expectedImpact: '+15% engagement'
          }
        }
      };

      mockOptimizeContentStrategy.mockResolvedValue(mockOptimization);

      const response = await request(app)
        .post('/api/ai-chat/strategy/optimize')
        .send({
          goals: ['increase_engagement'],
          currentStrategy: { platforms: ['instagram', 'twitter'] }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.platformSpecific.instagram).toBeDefined();
      expect(response.body.data.platformSpecific.twitter).toBeDefined();
    });

    it('should handle no current strategy provided', async () => {
      mockOptimizeContentStrategy.mockResolvedValue({
        goals: ['increase_engagement'],
        recommendations: []
      });

      await request(app)
        .post('/api/ai-chat/strategy/optimize')
        .send({ goals: ['increase_engagement'] })
        .expect(200);

      expect(mockOptimizeContentStrategy).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        ['increase_engagement'],
        undefined,
        undefined
      );
    });

    it('should return 400 when goals are missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/strategy/optimize')
        .send({ currentStrategy: {} })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Goals array is required and must not be empty');
    });

    it('should return 400 when goals is empty array', async () => {
      const response = await request(app)
        .post('/api/ai-chat/strategy/optimize')
        .send({ goals: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Goals array is required and must not be empty');
    });

    it('should return 400 when goals is not an array', async () => {
      const response = await request(app)
        .post('/api/ai-chat/strategy/optimize')
        .send({ goals: 'increase_engagement' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Goals array is required and must not be empty');
    });
  });

  describe('POST /api/ai-chat/strategy/posting-times', () => {
    it('should recommend optimal posting times for Instagram', async () => {
      const mockRecommendations = {
        platform: 'instagram',
        optimalTimes: [
          {
            day: 'Tuesday',
            time: '14:00',
            score: 0.92,
            expectedReach: 15000,
            reasoning: 'Peak engagement time based on your audience activity'
          },
          {
            day: 'Wednesday',
            time: '15:00',
            score: 0.89,
            expectedReach: 14200,
            reasoning: 'Second highest engagement window'
          },
          {
            day: 'Thursday',
            time: '11:00',
            score: 0.85,
            expectedReach: 13500,
            reasoning: 'Morning engagement spike'
          }
        ],
        worstTimes: [
          {
            day: 'Sunday',
            time: '03:00',
            score: 0.12,
            reasoning: 'Very low audience activity'
          }
        ],
        insights: {
          bestDay: 'Tuesday',
          bestTimeRange: '14:00-16:00',
          audienceTimezone: 'America/New_York',
          peakActivityHours: [11, 14, 15, 19]
        }
      };

      mockRecommendPostingTimes.mockResolvedValue(mockRecommendations);

      const response = await request(app)
        .post('/api/ai-chat/strategy/posting-times')
        .send({
          platform: 'instagram',
          contentType: 'image',
          audienceTimezone: 'America/New_York'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.optimalTimes).toHaveLength(3);
      expect(response.body.data.optimalTimes[0].day).toBe('Tuesday');
      expect(response.body.data.optimalTimes[0].score).toBe(0.92);
      expect(response.body.data.insights.bestDay).toBe('Tuesday');
      expect(mockRecommendPostingTimes).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'instagram',
        'image',
        'America/New_York'
      );
    });

    it('should provide content-type specific recommendations', async () => {
      const videoRecommendations = {
        platform: 'instagram',
        contentType: 'video',
        optimalTimes: [
          { day: 'Wednesday', time: '19:00', score: 0.95 }
        ],
        insights: {
          note: 'Video content performs better in evening hours'
        }
      };

      mockRecommendPostingTimes.mockResolvedValue(videoRecommendations);

      const response = await request(app)
        .post('/api/ai-chat/strategy/posting-times')
        .send({
          platform: 'instagram',
          contentType: 'video'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contentType).toBe('video');
      expect(response.body.data.insights.note).toContain('evening');
    });

    it('should support multiple platforms comparison', async () => {
      const mockRecommendations = {
        comparison: {
          instagram: { bestTime: 'Tuesday 14:00', score: 0.92 },
          twitter: { bestTime: 'Wednesday 09:00', score: 0.88 },
          linkedin: { bestTime: 'Wednesday 08:00', score: 0.91 }
        }
      };

      mockRecommendPostingTimes.mockResolvedValue(mockRecommendations);

      await request(app)
        .post('/api/ai-chat/strategy/posting-times')
        .send({ platform: 'all' })
        .expect(200);

      expect(mockRecommendPostingTimes).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'all',
        undefined,
        undefined
      );
    });

    it('should handle timezone conversions', async () => {
      const mockRecommendations = {
        platform: 'twitter',
        audienceTimezone: 'Asia/Tokyo',
        optimalTimes: [
          {
            day: 'Monday',
            time: '09:00',
            localTime: '22:00', // Previous day
            score: 0.87
          }
        ],
        note: 'Times shown in Asia/Tokyo timezone'
      };

      mockRecommendPostingTimes.mockResolvedValue(mockRecommendations);

      const response = await request(app)
        .post('/api/ai-chat/strategy/posting-times')
        .send({
          platform: 'twitter',
          audienceTimezone: 'Asia/Tokyo'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.audienceTimezone).toBe('Asia/Tokyo');
    });

    it('should return 400 when platform is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/strategy/posting-times')
        .send({ contentType: 'image' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Platform is required');
    });

    it('should handle no content type gracefully', async () => {
      mockRecommendPostingTimes.mockResolvedValue({
        platform: 'instagram',
        optimalTimes: []
      });

      await request(app)
        .post('/api/ai-chat/strategy/posting-times')
        .send({ platform: 'instagram' })
        .expect(200);

      expect(mockRecommendPostingTimes).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'instagram',
        undefined,
        undefined
      );
    });
  });

  describe('POST /api/ai-chat/strategy/hashtags-captions', () => {
    it('should suggest hashtags and improve caption for Instagram', async () => {
      const mockSuggestions = {
        originalContent: 'Check out this amazing sunset',
        improvedCaption: 'Golden hour magic ✨ There\'s something special about watching the day fade into night. What\'s your favorite time to unwind?\n\n📸 Captured this beauty at the beach\n\n#SunsetVibes #GoldenHour #NaturePhotography',
        hashtags: [
          {
            tag: '#SunsetVibes',
            popularity: 'high',
            competitiveness: 'medium',
            estimatedReach: 15000,
            reasoning: 'Popular and relevant to your content'
          },
          {
            tag: '#GoldenHour',
            popularity: 'very_high',
            competitiveness: 'high',
            estimatedReach: 25000,
            reasoning: 'Highly searched hashtag in photography niche'
          },
          {
            tag: '#NaturePhotography',
            popularity: 'high',
            competitiveness: 'high',
            estimatedReach: 20000,
            reasoning: 'Broad reach in photography community'
          }
        ],
        improvements: [
          'Added engaging question to increase comments',
          'Included emojis for visual appeal',
          'Added location context',
          'Suggested 3 hashtags for optimal reach'
        ],
        callToAction: 'What\'s your favorite time to unwind?',
        emojis: ['✨', '📸'],
        tone: 'inspirational',
        estimatedEngagement: {
          likes: 450,
          comments: 25,
          saves: 30
        }
      };

      mockSuggestHashtagsAndCaptions.mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .post('/api/ai-chat/strategy/hashtags-captions')
        .send({
          content: 'Check out this amazing sunset',
          platform: 'instagram',
          industry: 'photography',
          tone: 'inspirational'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hashtags).toHaveLength(3);
      expect(response.body.data.improvedCaption).toContain('Golden hour');
      expect(response.body.data.callToAction).toBeTruthy();
      expect(mockSuggestHashtagsAndCaptions).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'Check out this amazing sunset',
        'instagram',
        'photography',
        'inspirational'
      );
    });

    it('should optimize caption for Twitter (character limit)', async () => {
      const mockSuggestions = {
        originalContent: 'New blog post about social media marketing strategies',
        improvedCaption: '🚀 Just dropped: "5 Social Media Hacks That Actually Work"\n\nNo BS. No gimmicks. Just proven strategies that increased engagement by 200%.\n\nRead it here: [link]\n\n#SocialMediaMarketing #ContentStrategy',
        hashtags: [
          { tag: '#SocialMediaMarketing', popularity: 'high' },
          { tag: '#ContentStrategy', popularity: 'medium' }
        ],
        characterCount: 238,
        withinLimit: true,
        improvements: [
          'Added compelling hook',
          'Kept under 280 characters',
          'Included social proof (200% increase)'
        ]
      };

      mockSuggestHashtagsAndCaptions.mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .post('/api/ai-chat/strategy/hashtags-captions')
        .send({
          content: 'New blog post about social media marketing strategies',
          platform: 'twitter',
          tone: 'professional'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.characterCount).toBeLessThanOrEqual(280);
      expect(response.body.data.withinLimit).toBe(true);
    });

    it('should suggest industry-specific hashtags', async () => {
      const mockSuggestions = {
        improvedCaption: 'SaaS industry caption',
        hashtags: [
          { tag: '#SaaS', industry: 'tech', popularity: 'high' },
          { tag: '#B2B', industry: 'business', popularity: 'high' },
          { tag: '#CloudComputing', industry: 'tech', popularity: 'medium' }
        ],
        industryInsights: 'Tech hashtags tend to perform better on LinkedIn'
      };

      mockSuggestHashtagsAndCaptions.mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .post('/api/ai-chat/strategy/hashtags-captions')
        .send({
          content: 'Launching our new SaaS product',
          platform: 'linkedin',
          industry: 'tech'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hashtags.some((h: any) => h.tag === '#SaaS')).toBe(true);
    });

    it('should support different tones (casual, professional, humorous)', async () => {
      const tones = ['casual', 'professional', 'humorous'];

      for (const tone of tones) {
        mockSuggestHashtagsAndCaptions.mockResolvedValue({
          improvedCaption: `Caption with ${tone} tone`,
          tone,
          hashtags: []
        });

        const response = await request(app)
          .post('/api/ai-chat/strategy/hashtags-captions')
          .send({
            content: 'Test content',
            platform: 'instagram',
            tone
          })
          .expect(200);

        expect(response.body.data.tone).toBe(tone);
      }
    });

    it('should return 400 when content is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/strategy/hashtags-captions')
        .send({ platform: 'instagram' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Content is required');
    });

    it('should return 400 when platform is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/strategy/hashtags-captions')
        .send({ content: 'Test content' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Platform is required');
    });

    it('should handle no industry specified', async () => {
      mockSuggestHashtagsAndCaptions.mockResolvedValue({
        improvedCaption: 'Generic caption',
        hashtags: []
      });

      await request(app)
        .post('/api/ai-chat/strategy/hashtags-captions')
        .send({
          content: 'Test content',
          platform: 'instagram'
        })
        .expect(200);

      expect(mockSuggestHashtagsAndCaptions).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'Test content',
        'instagram',
        undefined,
        undefined
      );
    });
  });

  describe('POST /api/ai-chat/strategy/campaign-analysis', () => {
    it('should analyze campaign performance with metrics breakdown', async () => {
      const mockAnalysis = {
        campaignId: 'camp-summer-2024',
        campaignName: 'Summer Sale 2024',
        duration: '30 days',
        performance: {
          reach: 125000,
          impressions: 180000,
          engagement: 8500,
          clicks: 2100,
          conversions: 185,
          revenue: 12500
        },
        metrics: {
          engagementRate: 0.068,
          clickThroughRate: 0.0167,
          conversionRate: 0.088,
          costPerClick: 1.25,
          costPerAcquisition: 14.20,
          returnOnAdSpend: 4.8
        },
        topPerformingPosts: [
          {
            id: 'post-1',
            platform: 'instagram',
            engagement: 2300,
            reach: 25000
          },
          {
            id: 'post-2',
            platform: 'facebook',
            engagement: 1850,
            reach: 22000
          }
        ],
        insights: [
          'Instagram posts outperformed Facebook by 24%',
          'Video content had 2.1x higher engagement',
          'Best performing time: Tuesday 2-4 PM'
        ],
        recommendations: [
          'Increase video content allocation by 30%',
          'Focus more budget on Instagram',
          'Schedule posts for Tuesday-Wednesday peak times'
        ]
      };

      mockAnalyzeCampaignPerformance.mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post('/api/ai-chat/strategy/campaign-analysis')
        .send({
          campaignId: 'camp-summer-2024',
          metrics: ['engagement', 'conversions', 'roi']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.campaignId).toBe('camp-summer-2024');
      expect(response.body.data.performance.reach).toBe(125000);
      expect(response.body.data.metrics.returnOnAdSpend).toBe(4.8);
      expect(response.body.data.recommendations).toHaveLength(3);
      expect(mockAnalyzeCampaignPerformance).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'camp-summer-2024',
        ['engagement', 'conversions', 'roi'],
        undefined
      );
    });

    it('should compare campaign with previous campaigns', async () => {
      const mockAnalysis = {
        campaignId: 'camp-fall-2024',
        comparison: {
          current: {
            engagement: 8500,
            conversions: 185,
            revenue: 12500
          },
          previous: {
            engagement: 6200,
            conversions: 142,
            revenue: 9800
          },
          improvements: {
            engagement: '+37%',
            conversions: '+30%',
            revenue: '+27%'
          }
        },
        insights: [
          'Significant improvement in all key metrics',
          'Video content strategy contributed to 37% engagement increase'
        ]
      };

      mockAnalyzeCampaignPerformance.mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post('/api/ai-chat/strategy/campaign-analysis')
        .send({
          campaignId: 'camp-fall-2024',
          compareWith: 'camp-summer-2024'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comparison).toBeDefined();
      expect(response.body.data.comparison.improvements.engagement).toBe('+37%');
    });

    it('should identify underperforming elements', async () => {
      const mockAnalysis = {
        campaignId: 'camp-test',
        underperforming: [
          {
            element: 'Facebook ads',
            metric: 'engagement',
            actual: 0.015,
            expected: 0.032,
            deficit: '-53%',
            recommendations: ['Revise ad creative', 'Test different audiences']
          },
          {
            element: 'LinkedIn posts',
            metric: 'reach',
            actual: 5000,
            expected: 12000,
            deficit: '-58%',
            recommendations: ['Increase posting frequency', 'Use trending hashtags']
          }
        ]
      };

      mockAnalyzeCampaignPerformance.mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post('/api/ai-chat/strategy/campaign-analysis')
        .send({ campaignId: 'camp-test' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.underperforming).toHaveLength(2);
      expect(response.body.data.underperforming[0].deficit).toBe('-53%');
    });

    it('should analyze specific metrics when requested', async () => {
      const mockAnalysis = {
        campaignId: 'camp-test',
        requestedMetrics: ['engagement', 'roi'],
        engagement: { rate: 0.045, total: 5400 },
        roi: { value: 3.2, assessment: 'good' }
      };

      mockAnalyzeCampaignPerformance.mockResolvedValue(mockAnalysis);

      await request(app)
        .post('/api/ai-chat/strategy/campaign-analysis')
        .send({
          campaignId: 'camp-test',
          metrics: ['engagement', 'roi']
        })
        .expect(200);

      expect(mockAnalyzeCampaignPerformance).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'camp-test',
        ['engagement', 'roi'],
        undefined
      );
    });

    it('should return 400 when campaign ID is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/strategy/campaign-analysis')
        .send({ metrics: ['engagement'] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Campaign ID is required');
    });

    it('should handle campaign not found gracefully', async () => {
      mockAnalyzeCampaignPerformance.mockRejectedValue(
        new Error('Campaign not found')
      );

      const response = await request(app)
        .post('/api/ai-chat/strategy/campaign-analysis')
        .send({ campaignId: 'non-existent' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to analyze campaign');
      expect(response.body.message).toBe('Campaign not found');
    });
  });

  describe('POST /api/ai-chat/strategy/roi-optimization', () => {
    it('should optimize budget allocation across campaigns', async () => {
      const mockOptimization = {
        currentBudget: 10000,
        currentAllocation: {
          'Instagram Ads': 4000,
          'Facebook Ads': 3500,
          'LinkedIn Ads': 2500
        },
        recommendedAllocation: {
          'Instagram Ads': 5000,
          'Facebook Ads': 2500,
          'LinkedIn Ads': 2500
        },
        changes: [
          {
            campaign: 'Instagram Ads',
            change: '+$1000',
            reasoning: 'Highest ROI (4.8x), increase investment'
          },
          {
            campaign: 'Facebook Ads',
            change: '-$1000',
            reasoning: 'Lower ROI (2.1x), reallocate to Instagram'
          }
        ],
        projectedResults: {
          currentROI: 3.2,
          optimizedROI: 3.8,
          improvement: '+18.75%',
          additionalRevenue: 6000
        },
        recommendations: [
          'Shift $1000 from Facebook to Instagram',
          'Test new ad creative on Facebook before increasing spend',
          'Monitor Instagram performance weekly'
        ]
      };

      mockOptimizeROI.mockResolvedValue(mockOptimization);

      const response = await request(app)
        .post('/api/ai-chat/strategy/roi-optimization')
        .send({
          currentBudget: 10000,
          campaigns: [
            { name: 'Instagram Ads', budget: 4000, roi: 4.8 },
            { name: 'Facebook Ads', budget: 3500, roi: 2.1 },
            { name: 'LinkedIn Ads', budget: 2500, roi: 3.5 }
          ],
          goals: ['maximize_roi']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentBudget).toBe(10000);
      expect(response.body.data.projectedResults.improvement).toBe('+18.75%');
      expect(response.body.data.changes).toHaveLength(2);
      expect(mockOptimizeROI).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        10000,
        expect.any(Array),
        ['maximize_roi']
      );
    });

    it('should optimize for specific goals (maximize reach vs conversions)', async () => {
      const mockOptimization = {
        goal: 'maximize_conversions',
        currentBudget: 5000,
        recommendation: 'Prioritize high-converting campaigns',
        allocation: {
          'Conversion Campaign': 3500,
          'Awareness Campaign': 1500
        },
        expectedOutcome: {
          conversions: 450,
          cpa: 11.11
        }
      };

      mockOptimizeROI.mockResolvedValue(mockOptimization);

      const response = await request(app)
        .post('/api/ai-chat/strategy/roi-optimization')
        .send({
          currentBudget: 5000,
          campaigns: [
            { name: 'Conversion Campaign', budget: 2500 },
            { name: 'Awareness Campaign', budget: 2500 }
          ],
          goals: ['maximize_conversions']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.goal).toBe('maximize_conversions');
      expect(response.body.data.expectedOutcome.conversions).toBe(450);
    });

    it('should identify cost-saving opportunities', async () => {
      const mockOptimization = {
        costSavings: [
          {
            opportunity: 'Pause low-performing Facebook ads',
            potentialSavings: 1200,
            impact: 'Minimal (-2% reach)',
            recommendation: 'Reallocate to better performing channels'
          },
          {
            opportunity: 'Reduce LinkedIn ad frequency',
            potentialSavings: 500,
            impact: 'Low (-5% impressions)',
            recommendation: 'Focus on quality over quantity'
          }
        ],
        totalPotentialSavings: 1700,
        recommendedReallocation: 'Instagram Ads and Twitter Ads'
      };

      mockOptimizeROI.mockResolvedValue(mockOptimization);

      const response = await request(app)
        .post('/api/ai-chat/strategy/roi-optimization')
        .send({
          currentBudget: 8000,
          campaigns: [],
          goals: ['reduce_costs']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.costSavings).toHaveLength(2);
      expect(response.body.data.totalPotentialSavings).toBe(1700);
    });

    it('should provide incremental testing recommendations', async () => {
      const mockOptimization = {
        testingStrategy: {
          phase1: {
            duration: '1 week',
            action: 'Increase Instagram budget by $500',
            expectedResults: 'Validate ROI improvement'
          },
          phase2: {
            duration: '2 weeks',
            action: 'If successful, increase by additional $1000',
            expectedResults: 'Scale winning strategy'
          }
        },
        riskLevel: 'low',
        recommendation: 'Test incrementally to minimize risk'
      };

      mockOptimizeROI.mockResolvedValue(mockOptimization);

      const response = await request(app)
        .post('/api/ai-chat/strategy/roi-optimization')
        .send({
          currentBudget: 5000,
          campaigns: [],
          goals: ['test_incrementally']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.testingStrategy).toBeDefined();
      expect(response.body.data.riskLevel).toBe('low');
    });

    it('should return 400 when budget is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/strategy/roi-optimization')
        .send({ campaigns: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Current budget is required and must be a number');
    });

    it('should return 400 when budget is not a number', async () => {
      const response = await request(app)
        .post('/api/ai-chat/strategy/roi-optimization')
        .send({
          currentBudget: 'five thousand',
          campaigns: []
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Current budget is required and must be a number');
    });

    it('should return 400 when campaigns is not an array', async () => {
      const response = await request(app)
        .post('/api/ai-chat/strategy/roi-optimization')
        .send({
          currentBudget: 5000,
          campaigns: 'instagram'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Campaigns array is required');
    });

    it('should handle empty campaigns array', async () => {
      mockOptimizeROI.mockResolvedValue({
        currentBudget: 5000,
        campaigns: [],
        recommendation: 'Start with small test campaigns'
      });

      await request(app)
        .post('/api/ai-chat/strategy/roi-optimization')
        .send({
          currentBudget: 5000,
          campaigns: []
        })
        .expect(200);

      expect(mockOptimizeROI).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        5000,
        [],
        undefined
      );
    });
  });
});
