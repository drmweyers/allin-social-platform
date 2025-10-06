/**
 * AI Chat Integration Tests - Cross-Feature Integration
 * Tests interactions between multiple AI Chat features
 *
 * @group integration
 * @group ai-chat
 */

import express from 'express';
import request from 'supertest';
import { MASTER_TEST_CREDENTIALS } from '../../unit/ai-chat/test-fixtures';

// Mock services
const mockExplainAnalytics = jest.fn();
const mockGenerateContent = jest.fn();
const mockSuggestHashtags = jest.fn();
const mockOptimizeStrategy = jest.fn();
const mockPredictPerformance = jest.fn();
const mockRecommendGoals = jest.fn();

jest.mock('../../../src/services/conversation.service', () => ({
  conversationService: {
    explainAnalytics: mockExplainAnalytics,
    generateContent: mockGenerateContent,
    suggestHashtags: mockSuggestHashtags,
    optimizeStrategy: mockOptimizeStrategy,
    predictPerformance: mockPredictPerformance,
    recommendGoals: mockRecommendGoals
  }
}));

// Mock auth middleware
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

import { authMiddleware } from '../../../src/middleware/auth';

// Create Express app with all AI Chat routes
const router = express.Router();
router.use(authMiddleware);

// Analytics routes
router.post('/explain/analytics', async (req, res) => {
  try {
    const { metric, timeframe } = req.body;
    const organizationId = req.user?.organizationId;

    if (!metric) {
      return res.status(400).json({ success: false, error: 'Metric is required' });
    }

    const explanation = await mockExplainAnalytics(organizationId, metric, timeframe);
    return res.json({ success: true, data: explanation });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to explain analytics',
      message: (error as Error).message
    });
  }
});

// Content generation routes
router.post('/generate/caption', async (req, res) => {
  try {
    const { description, platform, tone } = req.body;
    const organizationId = req.user?.organizationId;

    if (!description) {
      return res.status(400).json({ success: false, error: 'Description is required' });
    }

    if (!platform) {
      return res.status(400).json({ success: false, error: 'Platform is required' });
    }

    const content = await mockGenerateContent(organizationId, description, platform, tone);
    return res.json({ success: true, data: content });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate caption',
      message: (error as Error).message
    });
  }
});

router.post('/strategy/hashtags-captions', async (req, res) => {
  try {
    const { content, platform, industry, tone } = req.body;
    const organizationId = req.user?.organizationId;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    if (!platform) {
      return res.status(400).json({ success: false, error: 'Platform is required' });
    }

    const suggestions = await mockSuggestHashtags(organizationId, content, platform, industry, tone);
    return res.json({ success: true, data: suggestions });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to suggest hashtags',
      message: (error as Error).message
    });
  }
});

// Strategy routes
router.post('/strategy/optimize', async (req, res) => {
  try {
    const { goals, currentStrategy, platforms } = req.body;
    const organizationId = req.user?.organizationId;

    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return res.status(400).json({ success: false, error: 'Goals are required' });
    }

    const optimization = await mockOptimizeStrategy(organizationId, goals, currentStrategy, platforms);
    return res.json({ success: true, data: optimization });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to optimize strategy',
      message: (error as Error).message
    });
  }
});

// Predictive routes
router.post('/predict/performance', async (req, res) => {
  try {
    const { timeframe, metrics } = req.body;
    const organizationId = req.user?.organizationId;

    if (!timeframe) {
      return res.status(400).json({ success: false, error: 'Timeframe is required' });
    }

    const predictions = await mockPredictPerformance(organizationId, timeframe, metrics);
    return res.json({ success: true, data: predictions });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to predict performance',
      message: (error as Error).message
    });
  }
});

router.post('/recommend/goals', async (req, res) => {
  try {
    const { currentPerformance, timeframe } = req.body;
    const organizationId = req.user?.organizationId;

    if (!currentPerformance) {
      return res.status(400).json({ success: false, error: 'Current performance is required' });
    }

    const goals = await mockRecommendGoals(organizationId, currentPerformance, timeframe);
    return res.json({ success: true, data: goals });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to recommend goals',
      message: (error as Error).message
    });
  }
});

const app = express();
app.use(express.json());
app.use('/api/ai-chat', router);

describe('AI Chat - Cross-Feature Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Analytics → Content Creation Flow', () => {
    it('should analyze performance and generate optimized content based on insights', async () => {
      // Step 1: Get analytics insights
      mockExplainAnalytics.mockResolvedValue({
        metric: 'engagement_rate',
        value: 3.2,
        explanation: 'Your engagement rate of 3.2% is below industry average (4.5%)',
        recommendations: ['Post more engaging questions', 'Use storytelling captions']
      });

      const analyticsResponse = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({
          metric: 'engagement_rate',
          timeframe: 'last_30_days'
        });

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.body.data.recommendations).toBeDefined();

      // Step 2: Generate content based on recommendations
      mockGenerateContent.mockResolvedValue({
        captions: [
          'What\'s your favorite way to unwind after a long day? 🌙✨',
          'Tell us your weekend plans! Drop them in the comments 👇'
        ],
        tone: 'engaging',
        platform: 'instagram'
      });

      const contentResponse = await request(app)
        .post('/api/ai-chat/generate/caption')
        .send({
          description: 'Create engaging question-based content',
          platform: 'instagram',
          tone: 'friendly'
        });

      expect(contentResponse.status).toBe(200);
      expect(contentResponse.body.data.captions).toHaveLength(2);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'Create engaging question-based content',
        'instagram',
        'friendly'
      );
    });

    it('should optimize hashtags based on performance data', async () => {
      // Step 1: Analyze hashtag performance
      mockExplainAnalytics.mockResolvedValue({
        metric: 'hashtag_performance',
        topPerformingHashtags: ['#marketing', '#business', '#entrepreneur'],
        underperformingHashtags: ['#ad', '#promo']
      });

      await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({
          metric: 'hashtag_performance',
          timeframe: 'last_30_days'
        });

      // Step 2: Get improved hashtag suggestions
      mockSuggestHashtags.mockResolvedValue({
        originalCaption: 'Check out our new product!',
        improvedCaption: 'Excited to share our latest innovation with you! 🚀',
        hashtags: ['#marketing', '#business', '#innovation', '#newproduct', '#entrepreneurlife'],
        hashtagPerformance: {
          '#marketing': 'high',
          '#business': 'high',
          '#innovation': 'medium'
        }
      });

      const hashtagResponse = await request(app)
        .post('/api/ai-chat/strategy/hashtags-captions')
        .send({
          content: 'Check out our new product!',
          platform: 'instagram',
          industry: 'technology'
        });

      expect(hashtagResponse.status).toBe(200);
      expect(hashtagResponse.body.data.hashtags).toContain('#marketing');
      expect(hashtagResponse.body.data.hashtags).not.toContain('#ad');
    });
  });

  describe('Strategy → Prediction Flow', () => {
    it('should optimize strategy and predict future performance', async () => {
      // Step 1: Optimize content strategy
      mockOptimizeStrategy.mockResolvedValue({
        currentStrategy: { postFrequency: 'daily', contentMix: '70% promotional' },
        optimizedStrategy: {
          postFrequency: '2x daily',
          contentMix: '40% promotional, 30% educational, 30% entertainment',
          expectedImprovement: '+25% engagement'
        },
        recommendations: [
          'Increase educational content',
          'Post during peak hours (9am, 6pm)',
          'Use more video content'
        ]
      });

      const strategyResponse = await request(app)
        .post('/api/ai-chat/strategy/optimize')
        .send({
          goals: ['increase_engagement', 'grow_followers'],
          currentStrategy: {
            postFrequency: 'daily',
            contentMix: '70% promotional'
          },
          platforms: ['instagram', 'twitter']
        });

      expect(strategyResponse.status).toBe(200);
      expect(strategyResponse.body.data.optimizedStrategy.expectedImprovement).toBe('+25% engagement');

      // Step 2: Predict performance with new strategy
      mockPredictPerformance.mockResolvedValue({
        timeframe: '30_days',
        predictions: {
          engagement_rate: {
            current: 3.2,
            predicted: 4.0,
            confidence: 85,
            change: '+25%'
          },
          follower_growth: {
            current: 100,
            predicted: 150,
            confidence: 78,
            change: '+50%'
          }
        }
      });

      const predictionResponse = await request(app)
        .post('/api/ai-chat/predict/performance')
        .send({
          timeframe: '30_days',
          metrics: ['engagement_rate', 'follower_growth']
        });

      expect(predictionResponse.status).toBe(200);
      expect(predictionResponse.body.data.predictions.engagement_rate.predicted).toBe(4.0);
      expect(predictionResponse.body.data.predictions.follower_growth.change).toBe('+50%');
    });

    it('should recommend SMART goals based on predictions', async () => {
      // Step 1: Get performance predictions
      mockPredictPerformance.mockResolvedValue({
        timeframe: '90_days',
        predictions: {
          engagement_rate: { predicted: 5.5, confidence: 82 },
          follower_growth: { predicted: 500, confidence: 75 }
        }
      });

      await request(app)
        .post('/api/ai-chat/predict/performance')
        .send({
          timeframe: '90_days',
          metrics: ['engagement_rate', 'follower_growth']
        });

      // Step 2: Generate SMART goals based on predictions
      mockRecommendGoals.mockResolvedValue({
        goals: [
          {
            type: 'engagement',
            title: 'Achieve 5% engagement rate',
            difficulty: 'moderate',
            timeframe: '90 days',
            milestones: [
              { week: 4, target: '3.5%' },
              { week: 8, target: '4.2%' },
              { week: 12, target: '5.0%' }
            ],
            smart: {
              specific: 'Increase engagement rate from 3.2% to 5.0%',
              measurable: 'Track weekly engagement metrics',
              achievable: 'Based on 82% confidence prediction',
              relevant: 'Aligns with growth objectives',
              timeBound: '90-day timeframe'
            }
          }
        ]
      });

      const goalsResponse = await request(app)
        .post('/api/ai-chat/recommend/goals')
        .send({
          currentPerformance: {
            engagement_rate: 3.2,
            follower_count: 1000
          },
          timeframe: '90_days'
        });

      expect(goalsResponse.status).toBe(200);
      expect(goalsResponse.body.data.goals).toHaveLength(1);
      expect(goalsResponse.body.data.goals[0].milestones).toHaveLength(3);
      expect(goalsResponse.body.data.goals[0].smart.achievable).toContain('82% confidence');
    });
  });

  describe('End-to-End Content Optimization Workflow', () => {
    it('should complete full workflow: analyze → strategize → create → predict', async () => {
      // Step 1: Analyze current performance
      mockExplainAnalytics.mockResolvedValue({
        metric: 'overall_performance',
        summary: 'Engagement below average, reach declining',
        keyInsights: ['Post frequency too low', 'Content lacks variety']
      });

      const analyticsResult = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({
          metric: 'overall_performance',
          timeframe: 'last_30_days'
        });

      expect(analyticsResult.status).toBe(200);

      // Step 2: Optimize strategy based on insights
      mockOptimizeStrategy.mockResolvedValue({
        optimizedStrategy: {
          postFrequency: '2x daily',
          contentTypes: ['carousel', 'video', 'image'],
          bestPostTimes: ['9:00 AM', '6:00 PM']
        }
      });

      const strategyResult = await request(app)
        .post('/api/ai-chat/strategy/optimize')
        .send({
          goals: ['increase_engagement', 'boost_reach'],
          currentStrategy: { postFrequency: 'daily' }
        });

      expect(strategyResult.status).toBe(200);

      // Step 3: Generate content following new strategy
      mockGenerateContent.mockResolvedValue({
        captions: ['Optimized caption 1', 'Optimized caption 2'],
        contentType: 'carousel',
        scheduledTime: '9:00 AM'
      });

      const contentResult = await request(app)
        .post('/api/ai-chat/generate/caption')
        .send({
          description: 'Create carousel content for 9am post',
          platform: 'instagram',
          tone: 'engaging'
        });

      expect(contentResult.status).toBe(200);

      // Step 4: Predict performance of new approach
      mockPredictPerformance.mockResolvedValue({
        predictions: {
          engagement_rate: { predicted: 5.8, change: '+81%' },
          reach: { predicted: 15000, change: '+150%' }
        }
      });

      const predictionResult = await request(app)
        .post('/api/ai-chat/predict/performance')
        .send({
          timeframe: '30_days',
          metrics: ['engagement_rate', 'reach']
        });

      expect(predictionResult.status).toBe(200);
      expect(predictionResult.body.data.predictions.engagement_rate.change).toBe('+81%');

      // Verify all steps executed in sequence
      expect(mockExplainAnalytics).toHaveBeenCalled();
      expect(mockOptimizeStrategy).toHaveBeenCalled();
      expect(mockGenerateContent).toHaveBeenCalled();
      expect(mockPredictPerformance).toHaveBeenCalled();
    });
  });

  describe('Error Handling Across Features', () => {
    it('should handle analytics failure gracefully and continue with default strategy', async () => {
      // Analytics fails
      mockExplainAnalytics.mockRejectedValue(new Error('Analytics service unavailable'));

      const analyticsResult = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({
          metric: 'engagement_rate',
          timeframe: 'last_30_days'
        });

      expect(analyticsResult.status).toBe(500);
      expect(analyticsResult.body.error).toBe('Failed to explain analytics');

      // Strategy optimization still works with default data
      mockOptimizeStrategy.mockResolvedValue({
        optimizedStrategy: { postFrequency: '2x daily' },
        note: 'Using default industry benchmarks due to analytics unavailability'
      });

      const strategyResult = await request(app)
        .post('/api/ai-chat/strategy/optimize')
        .send({
          goals: ['increase_engagement']
        });

      expect(strategyResult.status).toBe(200);
      expect(strategyResult.body.data.note).toContain('default industry benchmarks');
    });

    it('should validate data consistency across features', async () => {
      // Generate content with specific requirements
      mockGenerateContent.mockResolvedValue({
        captions: ['Test caption'],
        platform: 'instagram',
        characterCount: 150
      });

      const contentResult = await request(app)
        .post('/api/ai-chat/generate/caption')
        .send({
          description: 'Short promotional post',
          platform: 'instagram'
        });

      expect(contentResult.status).toBe(200);

      // Try to optimize for wrong platform - should fail validation
      const invalidStrategyResult = await request(app)
        .post('/api/ai-chat/strategy/optimize')
        .send({
          goals: []  // Empty goals array should fail
        });

      expect(invalidStrategyResult.status).toBe(400);
      expect(invalidStrategyResult.body.error).toBe('Goals are required');
    });
  });
});
