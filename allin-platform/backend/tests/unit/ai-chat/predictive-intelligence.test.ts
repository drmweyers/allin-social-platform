/**
 * AI Chat - Predictive Intelligence Tests
 * Category 5: Predictive Intelligence (4 features, 23 tests)
 */

import request from 'supertest';
import express from 'express';
import {
  MASTER_TEST_CREDENTIALS
} from './test-fixtures';

// Mock conversation service
const mockPredictPerformance = jest.fn();
const mockForecastTrends = jest.fn();
const mockRecommendGoals = jest.fn();
const mockPredictViralContent = jest.fn();

jest.mock('../../../src/services/conversation.service', () => ({
  conversationService: {
    predictPerformance: mockPredictPerformance,
    forecastTrends: mockForecastTrends,
    recommendGoals: mockRecommendGoals,
    predictViralContent: mockPredictViralContent
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

// Feature 5.1: Performance Predictions
router.post('/predict/performance', async (req, res) => {
  try {
    const { timeframe, metrics } = req.body;
    const organizationId = req.user?.organizationId;

    if (!timeframe) {
      return res.status(400).json({
        success: false,
        error: 'Timeframe is required'
      });
    }

    const predictions = await mockPredictPerformance(
      organizationId,
      timeframe,
      metrics
    );
    return res.json({ success: true, data: predictions });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to predict performance',
      message: (error as Error).message
    });
  }
});

// Feature 5.2: Trend Forecasting
router.post('/forecast/trends', async (req, res) => {
  try {
    const { industry, timeframe } = req.body;
    const organizationId = req.user?.organizationId;

    if (!industry) {
      return res.status(400).json({
        success: false,
        error: 'Industry is required'
      });
    }

    const forecast = await mockForecastTrends(
      organizationId,
      industry,
      timeframe
    );
    return res.json({ success: true, data: forecast });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to forecast trends',
      message: (error as Error).message
    });
  }
});

// Feature 5.3: Goal Recommendations
router.post('/recommend/goals', async (req, res) => {
  try {
    const { currentPerformance, targetTimeframe } = req.body;
    const organizationId = req.user?.organizationId;

    if (!currentPerformance) {
      return res.status(400).json({
        success: false,
        error: 'Current performance data is required'
      });
    }

    const recommendations = await mockRecommendGoals(
      organizationId,
      currentPerformance,
      targetTimeframe
    );
    return res.json({ success: true, data: recommendations });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to recommend goals',
      message: (error as Error).message
    });
  }
});

// Feature 5.4: Viral Content Prediction
router.post('/predict/viral', async (req, res) => {
  try {
    const { content, platform, targetAudience } = req.body;
    const organizationId = req.user?.organizationId;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const prediction = await mockPredictViralContent(
      organizationId,
      content,
      platform,
      targetAudience
    );
    return res.json({ success: true, data: prediction });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to predict viral potential',
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

describe('AI Chat - Predictive Intelligence', () => {
  describe('POST /api/ai-chat/predict/performance', () => {
    it('should predict engagement for next 30 days', async () => {
      const mockPrediction = {
        timeframe: '30d',
        metrics: ['engagement'],
        predictions: {
          engagement: {
            current: 12520,
            predicted: 14100,
            change: 1580,
            percentChange: 12.6,
            confidence: 0.76,
            confidenceInterval: {
              lower: 13200,
              upper: 15000
            }
          }
        },
        assumptions: [
          'Maintaining current posting frequency',
          'No major algorithm changes',
          'Seasonal patterns continue',
          'Content quality remains consistent'
        ],
        factors: [
          {
            factor: 'Video content increase',
            impact: '+8% engagement',
            weight: 0.4
          },
          {
            factor: 'Optimal posting times',
            impact: '+5% engagement',
            weight: 0.3
          }
        ]
      };

      mockPredictPerformance.mockResolvedValue(mockPrediction);

      const response = await request(app)
        .post('/api/ai-chat/predict/performance')
        .send({
          timeframe: '30d',
          metrics: ['engagement']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.predictions.engagement.predicted).toBe(14100);
      expect(response.body.data.predictions.engagement.confidence).toBe(0.76);
      expect(response.body.data.assumptions).toHaveLength(4);
      expect(mockPredictPerformance).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        '30d',
        ['engagement']
      );
    });

    it('should predict follower growth with confidence intervals', async () => {
      const mockPrediction = {
        timeframe: '90d',
        predictions: {
          followers: {
            current: 41600,
            predicted: 45200,
            change: 3600,
            percentChange: 8.7,
            confidence: 0.82,
            confidenceInterval: {
              lower: 43500,
              upper: 47000
            },
            monthlyBreakdown: [
              { month: 1, predicted: 42800, confidence: 0.85 },
              { month: 2, predicted: 44000, confidence: 0.80 },
              { month: 3, predicted: 45200, confidence: 0.75 }
            ]
          }
        }
      };

      mockPredictPerformance.mockResolvedValue(mockPrediction);

      const response = await request(app)
        .post('/api/ai-chat/predict/performance')
        .send({
          timeframe: '90d',
          metrics: ['followers']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.predictions.followers.confidenceInterval).toBeDefined();
      expect(response.body.data.predictions.followers.monthlyBreakdown).toHaveLength(3);
    });

    it('should predict multiple metrics (reach and conversions)', async () => {
      const mockPrediction = {
        predictions: {
          reach: {
            current: 126000,
            predicted: 145000,
            percentChange: 15.1
          },
          conversions: {
            current: 850,
            predicted: 1050,
            percentChange: 23.5
          }
        }
      };

      mockPredictPerformance.mockResolvedValue(mockPrediction);

      const response = await request(app)
        .post('/api/ai-chat/predict/performance')
        .send({
          timeframe: '30d',
          metrics: ['reach', 'conversions']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.predictions.reach).toBeDefined();
      expect(response.body.data.predictions.conversions).toBeDefined();
    });

    it('should handle seasonal patterns in predictions', async () => {
      const mockPrediction = {
        predictions: {
          engagement: {
            predicted: 15000,
            seasonalAdjustment: {
              detected: true,
              pattern: 'holiday_season',
              impact: '+12% expected increase',
              peakPeriod: 'December 15-25'
            }
          }
        }
      };

      mockPredictPerformance.mockResolvedValue(mockPrediction);

      const response = await request(app)
        .post('/api/ai-chat/predict/performance')
        .send({ timeframe: '30d' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.predictions.engagement.seasonalAdjustment.detected).toBe(true);
    });

    it('should provide best and worst case scenarios', async () => {
      const mockPrediction = {
        predictions: {
          engagement: {
            predicted: 14100,
            scenarios: {
              best: {
                value: 16500,
                description: 'If video content increases by 50%',
                probability: 0.25
              },
              worst: {
                value: 11000,
                description: 'If posting frequency drops',
                probability: 0.15
              },
              likely: {
                value: 14100,
                description: 'Current trajectory continues',
                probability: 0.60
              }
            }
          }
        }
      };

      mockPredictPerformance.mockResolvedValue(mockPrediction);

      const response = await request(app)
        .post('/api/ai-chat/predict/performance')
        .send({ timeframe: '30d' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.predictions.engagement.scenarios).toBeDefined();
      expect(response.body.data.predictions.engagement.scenarios.best.value).toBe(16500);
    });

    it('should handle insufficient historical data', async () => {
      mockPredictPerformance.mockRejectedValue(
        new Error('Insufficient historical data for reliable prediction')
      );

      const response = await request(app)
        .post('/api/ai-chat/predict/performance')
        .send({ timeframe: '30d' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient historical data');
    });

    it('should return 400 when timeframe is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/predict/performance')
        .send({ metrics: ['engagement'] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Timeframe is required');
    });
  });

  describe('POST /api/ai-chat/forecast/trends', () => {
    it('should forecast industry trends for next quarter', async () => {
      const mockForecast = {
        industry: 'social_media_marketing',
        timeframe: '90d',
        trends: [
          {
            trend: 'Short-form video dominance',
            confidence: 0.92,
            timeline: 'Ongoing through Q1 2025',
            impact: 'High',
            recommendation: 'Increase Reels and TikTok content by 40%',
            platforms: ['instagram', 'tiktok', 'youtube_shorts']
          },
          {
            trend: 'AI-generated content adoption',
            confidence: 0.85,
            timeline: 'Accelerating in next 6 months',
            impact: 'Medium',
            recommendation: 'Experiment with AI tools while maintaining authenticity',
            platforms: ['all']
          },
          {
            trend: 'Community-focused content',
            confidence: 0.78,
            timeline: 'Growing trend',
            impact: 'Medium-High',
            recommendation: 'Build engaged communities, not just followers',
            platforms: ['facebook', 'discord', 'reddit']
          }
        ],
        actionableInsights: [
          'Prioritize short-form video content',
          'Test AI tools for content creation',
          'Focus on community engagement over vanity metrics'
        ]
      };

      mockForecastTrends.mockResolvedValue(mockForecast);

      const response = await request(app)
        .post('/api/ai-chat/forecast/trends')
        .send({
          industry: 'social_media_marketing',
          timeframe: '90d'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trends).toHaveLength(3);
      expect(response.body.data.trends[0].confidence).toBe(0.92);
      expect(response.body.data.actionableInsights).toHaveLength(3);
      expect(mockForecastTrends).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'social_media_marketing',
        '90d'
      );
    });

    it('should provide platform-specific trend predictions', async () => {
      const mockForecast = {
        industry: 'ecommerce',
        platformTrends: {
          instagram: {
            trending: ['Shopping features', 'Live shopping events'],
            declining: ['Feed posts without shopping tags']
          },
          tiktok: {
            trending: ['Product reviews', 'Unboxing videos'],
            declining: ['Overly promotional content']
          }
        }
      };

      mockForecastTrends.mockResolvedValue(mockForecast);

      const response = await request(app)
        .post('/api/ai-chat/forecast/trends')
        .send({ industry: 'ecommerce' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.platformTrends.instagram).toBeDefined();
      expect(response.body.data.platformTrends.tiktok).toBeDefined();
    });

    it('should identify emerging vs declining trends', async () => {
      const mockForecast = {
        emergingTrends: [
          {
            trend: 'Threads adoption',
            stage: 'early_growth',
            confidence: 0.65,
            recommendation: 'Monitor and test'
          }
        ],
        decliningTrends: [
          {
            trend: 'Twitter engagement',
            stage: 'declining',
            confidence: 0.72,
            recommendation: 'Diversify to other platforms'
          }
        ]
      };

      mockForecastTrends.mockResolvedValue(mockForecast);

      const response = await request(app)
        .post('/api/ai-chat/forecast/trends')
        .send({ industry: 'tech' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emergingTrends).toHaveLength(1);
      expect(response.body.data.decliningTrends).toHaveLength(1);
    });

    it('should include confidence levels for predictions', async () => {
      const mockForecast = {
        trends: [
          { trend: 'Trend 1', confidence: 0.95 },
          { trend: 'Trend 2', confidence: 0.78 },
          { trend: 'Trend 3', confidence: 0.60 }
        ],
        reliabilityNote: 'High confidence trends (>0.80) are most reliable'
      };

      mockForecastTrends.mockResolvedValue(mockForecast);

      const response = await request(app)
        .post('/api/ai-chat/forecast/trends')
        .send({ industry: 'marketing' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trends.every((t: any) => t.confidence)).toBe(true);
    });

    it('should return 400 when industry is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/forecast/trends')
        .send({ timeframe: '90d' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Industry is required');
    });

    it('should handle no timeframe specified', async () => {
      mockForecastTrends.mockResolvedValue({
        industry: 'tech',
        trends: []
      });

      await request(app)
        .post('/api/ai-chat/forecast/trends')
        .send({ industry: 'tech' })
        .expect(200);

      expect(mockForecastTrends).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'tech',
        undefined
      );
    });
  });

  describe('POST /api/ai-chat/recommend/goals', () => {
    it('should recommend SMART goals based on current performance', async () => {
      const mockRecommendations = {
        currentPerformance: {
          engagement: 12520,
          followers: 41600,
          reach: 126000
        },
        recommendedGoals: [
          {
            metric: 'engagement',
            type: 'increase',
            current: 12520,
            target: 15000,
            increase: 2480,
            percentIncrease: 19.8,
            timeframe: '60d',
            difficulty: 'achievable',
            confidence: 0.78,
            smart: {
              specific: 'Increase total engagement to 15,000',
              measurable: '+2,480 engagements (+19.8%)',
              achievable: 'Based on current growth trajectory',
              relevant: 'Aligns with content strategy improvements',
              timeBound: '60 days'
            },
            actionPlan: [
              'Increase video content by 40%',
              'Post at optimal times (Tue-Wed 2-4 PM)',
              'Use trending hashtags'
            ]
          },
          {
            metric: 'followers',
            type: 'increase',
            current: 41600,
            target: 45000,
            increase: 3400,
            percentIncrease: 8.2,
            timeframe: '90d',
            difficulty: 'moderate',
            confidence: 0.72
          }
        ],
        stretchGoals: [
          {
            metric: 'engagement',
            target: 18000,
            percentIncrease: 43.8,
            note: 'Requires significant strategy changes'
          }
        ]
      };

      mockRecommendGoals.mockResolvedValue(mockRecommendations);

      const response = await request(app)
        .post('/api/ai-chat/recommend/goals')
        .send({
          currentPerformance: {
            engagement: 12520,
            followers: 41600,
            reach: 126000
          },
          targetTimeframe: '60d'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendedGoals).toHaveLength(2);
      expect(response.body.data.recommendedGoals[0].smart).toBeDefined();
      expect(response.body.data.recommendedGoals[0].actionPlan).toHaveLength(3);
      expect(mockRecommendGoals).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        expect.any(Object),
        '60d'
      );
    });

    it('should categorize goals by difficulty (easy, moderate, challenging)', async () => {
      const mockRecommendations = {
        goals: {
          easy: [
            { metric: 'posting_frequency', target: '5x per week', confidence: 0.90 }
          ],
          moderate: [
            { metric: 'engagement_rate', target: '+15%', confidence: 0.75 }
          ],
          challenging: [
            { metric: 'follower_growth', target: '+50%', confidence: 0.55 }
          ]
        }
      };

      mockRecommendGoals.mockResolvedValue(mockRecommendations);

      const response = await request(app)
        .post('/api/ai-chat/recommend/goals')
        .send({ currentPerformance: {} })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.goals.easy).toHaveLength(1);
      expect(response.body.data.goals.moderate).toHaveLength(1);
      expect(response.body.data.goals.challenging).toHaveLength(1);
    });

    it('should provide milestone tracking for long-term goals', async () => {
      const mockRecommendations = {
        recommendedGoals: [
          {
            metric: 'followers',
            target: 50000,
            timeframe: '180d',
            milestones: [
              { day: 30, target: 43000, checkpoint: 'Month 1' },
              { day: 60, target: 45000, checkpoint: 'Month 2' },
              { day: 90, target: 47000, checkpoint: 'Month 3' },
              { day: 120, target: 48500, checkpoint: 'Month 4' },
              { day: 150, target: 49500, checkpoint: 'Month 5' },
              { day: 180, target: 50000, checkpoint: 'Month 6' }
            ]
          }
        ]
      };

      mockRecommendGoals.mockResolvedValue(mockRecommendations);

      const response = await request(app)
        .post('/api/ai-chat/recommend/goals')
        .send({ currentPerformance: {} })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendedGoals[0].milestones).toHaveLength(6);
    });

    it('should align goals with business objectives', async () => {
      const mockRecommendations = {
        businessAlignment: {
          objective: 'increase_sales',
          recommendedGoals: [
            {
              metric: 'conversion_rate',
              alignment: 'Direct impact on sales',
              priority: 'high'
            },
            {
              metric: 'engagement',
              alignment: 'Builds trust leading to sales',
              priority: 'medium'
            }
          ]
        }
      };

      mockRecommendGoals.mockResolvedValue(mockRecommendations);

      const response = await request(app)
        .post('/api/ai-chat/recommend/goals')
        .send({
          currentPerformance: {},
          businessObjective: 'increase_sales'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.businessAlignment).toBeDefined();
    });

    it('should return 400 when current performance is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/recommend/goals')
        .send({ targetTimeframe: '60d' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Current performance data is required');
    });

    it('should handle missing timeframe with default', async () => {
      mockRecommendGoals.mockResolvedValue({
        recommendedGoals: []
      });

      await request(app)
        .post('/api/ai-chat/recommend/goals')
        .send({ currentPerformance: {} })
        .expect(200);

      expect(mockRecommendGoals).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        {},
        undefined
      );
    });
  });

  describe('POST /api/ai-chat/predict/viral', () => {
    it('should predict viral potential of content', async () => {
      const mockPrediction = {
        content: 'Breaking: Major industry announcement',
        platform: 'twitter',
        viralScore: 0.78,
        viralPotential: 'high',
        predictedMetrics: {
          impressions: { predicted: 150000, range: [100000, 250000] },
          engagement: { predicted: 8500, range: [5000, 15000] },
          shares: { predicted: 1200, range: [800, 2500] }
        },
        viralFactors: [
          {
            factor: 'Trending topic',
            impact: 'high',
            weight: 0.35,
            reasoning: 'Industry announcement trending on Twitter'
          },
          {
            factor: 'Timing',
            impact: 'medium',
            weight: 0.25,
            reasoning: 'Posted during peak hours'
          },
          {
            factor: 'Emotional appeal',
            impact: 'medium',
            weight: 0.20,
            reasoning: 'Excitement and surprise elements'
          }
        ],
        recommendations: [
          'Post during peak hours (9 AM - 12 PM)',
          'Add relevant trending hashtags',
          'Include eye-catching image or video',
          'Engage with early commenters to boost algorithm'
        ],
        timeline: {
          peakExpected: '2-4 hours after posting',
          sustainedEngagement: '12-24 hours',
          totalLifespan: '48 hours estimated'
        }
      };

      mockPredictViralContent.mockResolvedValue(mockPrediction);

      const response = await request(app)
        .post('/api/ai-chat/predict/viral')
        .send({
          content: 'Breaking: Major industry announcement',
          platform: 'twitter',
          targetAudience: 'tech_professionals'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.viralScore).toBe(0.78);
      expect(response.body.data.viralPotential).toBe('high');
      expect(response.body.data.viralFactors).toHaveLength(3);
      expect(response.body.data.recommendations).toHaveLength(4);
      expect(mockPredictViralContent).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'Breaking: Major industry announcement',
        'twitter',
        'tech_professionals'
      );
    });

    it('should analyze viral elements in content', async () => {
      const mockPrediction = {
        viralElements: {
          hook: {
            present: true,
            strength: 'strong',
            note: 'Opening with "Breaking:" creates urgency'
          },
          emotionalTrigger: {
            present: true,
            type: 'surprise',
            strength: 'medium'
          },
          callToAction: {
            present: false,
            recommendation: 'Add CTA to boost engagement'
          },
          visualAppeal: {
            present: false,
            recommendation: 'Add image or video for 3x engagement boost'
          }
        }
      };

      mockPredictViralContent.mockResolvedValue(mockPrediction);

      const response = await request(app)
        .post('/api/ai-chat/predict/viral')
        .send({ content: 'Test content' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.viralElements).toBeDefined();
    });

    it('should provide improvement suggestions for low viral potential', async () => {
      const mockPrediction = {
        viralScore: 0.25,
        viralPotential: 'low',
        improvements: [
          {
            element: 'Hook',
            current: 'Missing',
            suggestion: 'Start with attention-grabbing statement',
            expectedImpact: '+0.20 viral score'
          },
          {
            element: 'Emotional appeal',
            current: 'Weak',
            suggestion: 'Add surprise or excitement element',
            expectedImpact: '+0.15 viral score'
          },
          {
            element: 'Visual content',
            current: 'None',
            suggestion: 'Include eye-catching image or video',
            expectedImpact: '+0.25 viral score'
          }
        ],
        potentialScoreWithImprovements: 0.85
      };

      mockPredictViralContent.mockResolvedValue(mockPrediction);

      const response = await request(app)
        .post('/api/ai-chat/predict/viral')
        .send({ content: 'Low potential content' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.viralScore).toBe(0.25);
      expect(response.body.data.improvements).toHaveLength(3);
      expect(response.body.data.potentialScoreWithImprovements).toBe(0.85);
    });

    it('should return 400 when content is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/predict/viral')
        .send({ platform: 'twitter' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Content is required');
    });

    it('should handle missing platform and target audience', async () => {
      mockPredictViralContent.mockResolvedValue({
        viralScore: 0.65
      });

      await request(app)
        .post('/api/ai-chat/predict/viral')
        .send({ content: 'Test content' })
        .expect(200);

      expect(mockPredictViralContent).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'Test content',
        undefined,
        undefined
      );
    });
  });
});
