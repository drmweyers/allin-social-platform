/**
 * AI Chat - Content Creation Assistance Tests
 * Category 4: Content Creation Assistance (4 features, 24 tests)
 */

import request from 'supertest';
import express from 'express';
import {
  MASTER_TEST_CREDENTIALS,
  SAMPLE_CONTENT
} from './test-fixtures';

// Mock conversation service
const mockGenerateCaption = jest.fn();
const mockSuggestContentCalendar = jest.fn();
const mockAnalyzeCreativeBrief = jest.fn();
const mockAdaptContentMultiPlatform = jest.fn();

jest.mock('../../../src/services/conversation.service', () => ({
  conversationService: {
    generateCaption: mockGenerateCaption,
    suggestContentCalendar: mockSuggestContentCalendar,
    analyzeCreativeBrief: mockAnalyzeCreativeBrief,
    adaptContentMultiPlatform: mockAdaptContentMultiPlatform
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

// Feature 4.1: Caption Generation
router.post('/generate/caption', async (req, res) => {
  try {
    const { description, platform, tone, includeHashtags } = req.body;
    const organizationId = req.user?.organizationId;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Description is required'
      });
    }

    if (!platform) {
      return res.status(400).json({
        success: false,
        error: 'Platform is required'
      });
    }

    const captions = await mockGenerateCaption(
      organizationId,
      description,
      platform,
      tone,
      includeHashtags
    );
    return res.json({ success: true, data: captions });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate caption',
      message: (error as Error).message
    });
  }
});

// Feature 4.2: Content Calendar Suggestions
router.post('/calendar/suggest', async (req, res) => {
  try {
    const { timeframe, goals, postingFrequency } = req.body;
    const organizationId = req.user?.organizationId;

    if (!timeframe) {
      return res.status(400).json({
        success: false,
        error: 'Timeframe is required'
      });
    }

    const calendar = await mockSuggestContentCalendar(
      organizationId,
      timeframe,
      goals,
      postingFrequency
    );
    return res.json({ success: true, data: calendar });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate calendar',
      message: (error as Error).message
    });
  }
});

// Feature 4.3: Creative Brief Analysis
router.post('/brief/analyze', async (req, res) => {
  try {
    const { brief, objectives } = req.body;
    const organizationId = req.user?.organizationId;

    if (!brief) {
      return res.status(400).json({
        success: false,
        error: 'Brief is required'
      });
    }

    const analysis = await mockAnalyzeCreativeBrief(
      organizationId,
      brief,
      objectives
    );
    return res.json({ success: true, data: analysis });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze brief',
      message: (error as Error).message
    });
  }
});

// Feature 4.4: Multi-Platform Content Adaptation
router.post('/adapt/multi-platform', async (req, res) => {
  try {
    const { content, sourcePlatform, targetPlatforms } = req.body;
    const organizationId = req.user?.organizationId;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    if (!targetPlatforms || !Array.isArray(targetPlatforms)) {
      return res.status(400).json({
        success: false,
        error: 'Target platforms array is required'
      });
    }

    const adaptations = await mockAdaptContentMultiPlatform(
      organizationId,
      content,
      sourcePlatform,
      targetPlatforms
    );
    return res.json({ success: true, data: adaptations });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to adapt content',
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

describe('AI Chat - Content Creation Assistance', () => {
  describe('POST /api/ai-chat/generate/caption', () => {
    it('should generate Instagram caption with multiple variations', async () => {
      const mockCaptions = {
        description: 'Sunset at the beach',
        platform: 'instagram',
        variations: [
          {
            tone: 'inspirational',
            caption: SAMPLE_CONTENT.instagramCaption.improved,
            hashtags: SAMPLE_CONTENT.instagramCaption.suggestions.hashtags,
            callToAction: SAMPLE_CONTENT.instagramCaption.suggestions.callToAction,
            characterCount: 245,
            emojis: ['✨', '📸']
          },
          {
            tone: 'casual',
            caption: 'Another beautiful sunset 🌅 Can\'t get enough of these views! Where\'s your favorite sunset spot?',
            hashtags: ['#Sunset', '#BeachLife', '#GoodVibes'],
            callToAction: 'Where\'s your favorite sunset spot?',
            characterCount: 125,
            emojis: ['🌅']
          },
          {
            tone: 'professional',
            caption: 'Capturing the essence of natural beauty. Professional photography services available.\n\n#Photography #Sunset #Professional',
            hashtags: ['#Photography', '#Sunset', '#Professional'],
            callToAction: null,
            characterCount: 135,
            emojis: []
          }
        ],
        estimatedEngagement: {
          likes: 450,
          comments: 25,
          saves: 30
        }
      };

      mockGenerateCaption.mockResolvedValue(mockCaptions);

      const response = await request(app)
        .post('/api/ai-chat/generate/caption')
        .send({
          description: 'Sunset at the beach',
          platform: 'instagram',
          tone: 'mixed',
          includeHashtags: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.variations).toHaveLength(3);
      expect(response.body.data.variations[0].tone).toBe('inspirational');
      expect(response.body.data.variations[0].hashtags).toHaveLength(5);
      expect(mockGenerateCaption).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'Sunset at the beach',
        'instagram',
        'mixed',
        true
      );
    });

    it('should generate LinkedIn caption (professional tone)', async () => {
      const mockCaptions = {
        description: 'Product launch announcement',
        platform: 'linkedin',
        variations: [
          {
            tone: 'professional',
            caption: 'Excited to announce the launch of our new SaaS platform that revolutionizes team collaboration.\n\nKey features:\n• Real-time collaboration\n• Advanced analytics\n• Enterprise security\n\nLearn more: [link]\n\n#SaaS #ProductLaunch #Innovation',
            hashtags: ['#SaaS', '#ProductLaunch', '#Innovation'],
            callToAction: 'Learn more',
            characterCount: 280
          }
        ]
      };

      mockGenerateCaption.mockResolvedValue(mockCaptions);

      const response = await request(app)
        .post('/api/ai-chat/generate/caption')
        .send({
          description: 'Product launch announcement',
          platform: 'linkedin',
          tone: 'professional'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.variations[0].tone).toBe('professional');
      expect(response.body.data.variations[0].caption).toContain('Excited to announce');
    });

    it('should generate Twitter caption with character limit', async () => {
      const mockCaptions = {
        description: 'Quick marketing tip',
        platform: 'twitter',
        variations: [
          {
            tone: 'casual',
            caption: '🚀 Marketing tip: Engage with your audience in the first hour after posting for maximum reach.\n\nTry it and watch your engagement soar! 📈\n\n#MarketingTips #SocialMedia',
            characterCount: 175,
            withinLimit: true,
            hashtags: ['#MarketingTips', '#SocialMedia']
          }
        ]
      };

      mockGenerateCaption.mockResolvedValue(mockCaptions);

      const response = await request(app)
        .post('/api/ai-chat/generate/caption')
        .send({
          description: 'Quick marketing tip',
          platform: 'twitter',
          tone: 'casual'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.variations[0].characterCount).toBeLessThanOrEqual(280);
      expect(response.body.data.variations[0].withinLimit).toBe(true);
    });

    it('should generate caption without hashtags when requested', async () => {
      const mockCaptions = {
        variations: [
          {
            caption: 'Beautiful sunset at the beach',
            hashtags: [],
            includeHashtags: false
          }
        ]
      };

      mockGenerateCaption.mockResolvedValue(mockCaptions);

      const response = await request(app)
        .post('/api/ai-chat/generate/caption')
        .send({
          description: 'Sunset',
          platform: 'instagram',
          includeHashtags: false
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.variations[0].hashtags).toHaveLength(0);
    });

    it('should return 400 when description is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/generate/caption')
        .send({ platform: 'instagram' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Description is required');
    });

    it('should return 400 when platform is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/generate/caption')
        .send({ description: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Platform is required');
    });

    it('should handle tone parameter gracefully when not provided', async () => {
      mockGenerateCaption.mockResolvedValue({
        variations: [{ tone: 'neutral', caption: 'Test caption' }]
      });

      await request(app)
        .post('/api/ai-chat/generate/caption')
        .send({
          description: 'Test',
          platform: 'instagram'
        })
        .expect(200);

      expect(mockGenerateCaption).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'Test',
        'instagram',
        undefined,
        undefined
      );
    });
  });

  describe('POST /api/ai-chat/calendar/suggest', () => {
    it('should generate weekly content calendar', async () => {
      const mockCalendar = {
        timeframe: 'week',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
        posts: [
          {
            day: 'Monday',
            date: '2024-01-15',
            time: '09:00',
            platform: 'linkedin',
            contentType: 'article',
            topic: 'Industry insights',
            reasoning: 'Monday mornings good for professional content'
          },
          {
            day: 'Tuesday',
            date: '2024-01-16',
            time: '14:00',
            platform: 'instagram',
            contentType: 'image',
            topic: 'Product showcase',
            reasoning: 'Peak engagement time on Instagram'
          },
          {
            day: 'Wednesday',
            date: '2024-01-17',
            time: '15:00',
            platform: 'twitter',
            contentType: 'thread',
            topic: 'Tips & tricks',
            reasoning: 'Mid-week engagement high on Twitter'
          }
        ],
        totalPosts: 3,
        recommendations: [
          'Mix content types for variety',
          'Maintain consistent posting schedule',
          'Engage with audience within first hour'
        ]
      };

      mockSuggestContentCalendar.mockResolvedValue(mockCalendar);

      const response = await request(app)
        .post('/api/ai-chat/calendar/suggest')
        .send({
          timeframe: 'week',
          goals: ['increase_engagement'],
          postingFrequency: 'daily'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(3);
      expect(response.body.data.posts[0].platform).toBe('linkedin');
      expect(response.body.data.totalPosts).toBe(3);
      expect(mockSuggestContentCalendar).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'week',
        ['increase_engagement'],
        'daily'
      );
    });

    it('should generate monthly content calendar', async () => {
      const mockCalendar = {
        timeframe: 'month',
        startDate: '2024-02-01',
        endDate: '2024-02-29',
        posts: [],
        totalPosts: 60,
        breakdown: {
          instagram: 20,
          twitter: 20,
          linkedin: 15,
          facebook: 5
        },
        themes: {
          week1: 'Brand awareness',
          week2: 'Product features',
          week3: 'Customer stories',
          week4: 'Industry insights'
        }
      };

      mockSuggestContentCalendar.mockResolvedValue(mockCalendar);

      const response = await request(app)
        .post('/api/ai-chat/calendar/suggest')
        .send({
          timeframe: 'month',
          goals: ['brand_awareness', 'customer_acquisition']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalPosts).toBe(60);
      expect(response.body.data.breakdown).toBeDefined();
      expect(response.body.data.themes).toBeDefined();
    });

    it('should align calendar with specific goals', async () => {
      const mockCalendar = {
        timeframe: 'week',
        goals: ['increase_engagement', 'grow_followers'],
        posts: [
          {
            day: 'Tuesday',
            contentType: 'video',
            goal: 'increase_engagement',
            reasoning: 'Video content drives 2x engagement'
          },
          {
            day: 'Wednesday',
            contentType: 'contest',
            goal: 'grow_followers',
            reasoning: 'Contests attract new followers'
          }
        ]
      };

      mockSuggestContentCalendar.mockResolvedValue(mockCalendar);

      const response = await request(app)
        .post('/api/ai-chat/calendar/suggest')
        .send({
          timeframe: 'week',
          goals: ['increase_engagement', 'grow_followers']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.goals).toContain('increase_engagement');
      expect(response.body.data.goals).toContain('grow_followers');
    });

    it('should suggest posting frequency based on resources', async () => {
      const mockCalendar = {
        timeframe: 'week',
        recommendedFrequency: '3x per week',
        reasoning: 'Balanced approach for sustainable content creation',
        posts: []
      };

      mockSuggestContentCalendar.mockResolvedValue(mockCalendar);

      const response = await request(app)
        .post('/api/ai-chat/calendar/suggest')
        .send({
          timeframe: 'week',
          postingFrequency: 'sustainable'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendedFrequency).toBeTruthy();
    });

    it('should include seasonal/trending topics', async () => {
      const mockCalendar = {
        timeframe: 'week',
        posts: [
          {
            day: 'Thursday',
            topic: 'Thanksgiving preparation tips',
            isSeasonal: true,
            reasoning: 'Capitalize on seasonal interest'
          }
        ],
        trendingTopics: ['#Thanksgiving', '#HolidaySeason']
      };

      mockSuggestContentCalendar.mockResolvedValue(mockCalendar);

      const response = await request(app)
        .post('/api/ai-chat/calendar/suggest')
        .send({ timeframe: 'week' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trendingTopics).toBeDefined();
    });

    it('should return 400 when timeframe is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/calendar/suggest')
        .send({ goals: ['increase_engagement'] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Timeframe is required');
    });

    it('should handle no goals specified', async () => {
      mockSuggestContentCalendar.mockResolvedValue({
        timeframe: 'week',
        posts: []
      });

      await request(app)
        .post('/api/ai-chat/calendar/suggest')
        .send({ timeframe: 'week' })
        .expect(200);

      expect(mockSuggestContentCalendar).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'week',
        undefined,
        undefined
      );
    });
  });

  describe('POST /api/ai-chat/brief/analyze', () => {
    it('should analyze creative brief and provide recommendations', async () => {
      const mockAnalysis = {
        brief: 'Launch campaign for new eco-friendly product line',
        analysis: {
          targetAudience: 'Environmentally conscious consumers, ages 25-45',
          keyMessages: [
            'Sustainable materials',
            'Carbon-neutral production',
            'Premium quality'
          ],
          toneRecommendation: 'Inspirational and educational',
          platformRecommendations: ['Instagram', 'LinkedIn', 'Pinterest'],
          contentTypes: ['Product photography', 'Behind-the-scenes videos', 'Educational infographics']
        },
        recommendations: [
          {
            priority: 'high',
            recommendation: 'Create Instagram Reels showing production process',
            reasoning: 'Visual storytelling resonates with eco-conscious audience'
          },
          {
            priority: 'high',
            recommendation: 'Partner with sustainability influencers',
            reasoning: 'Leverage trusted voices in the community'
          },
          {
            priority: 'medium',
            recommendation: 'Develop educational blog content',
            reasoning: 'Establish thought leadership in sustainability'
          }
        ],
        timeline: {
          week1: 'Brand awareness content',
          week2: 'Product features and benefits',
          week3: 'Customer testimonials',
          week4: 'Launch promotion'
        }
      };

      mockAnalyzeCreativeBrief.mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post('/api/ai-chat/brief/analyze')
        .send({
          brief: 'Launch campaign for new eco-friendly product line',
          objectives: ['brand_awareness', 'product_launch']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analysis.targetAudience).toBeTruthy();
      expect(response.body.data.analysis.keyMessages).toHaveLength(3);
      expect(response.body.data.recommendations).toHaveLength(3);
      expect(mockAnalyzeCreativeBrief).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'Launch campaign for new eco-friendly product line',
        ['brand_awareness', 'product_launch']
      );
    });

    it('should identify gaps in creative brief', async () => {
      const mockAnalysis = {
        brief: 'Increase social media engagement',
        gaps: [
          {
            element: 'Target audience',
            severity: 'high',
            recommendation: 'Define specific demographics and psychographics'
          },
          {
            element: 'Success metrics',
            severity: 'high',
            recommendation: 'Specify measurable KPIs'
          },
          {
            element: 'Budget',
            severity: 'medium',
            recommendation: 'Allocate budget for each channel'
          }
        ],
        completeness: '40%'
      };

      mockAnalyzeCreativeBrief.mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post('/api/ai-chat/brief/analyze')
        .send({ brief: 'Increase social media engagement' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.gaps).toHaveLength(3);
      expect(response.body.data.completeness).toBe('40%');
    });

    it('should suggest content pillars based on brief', async () => {
      const mockAnalysis = {
        brief: 'SaaS company looking to establish thought leadership',
        contentPillars: [
          {
            pillar: 'Industry Insights',
            description: 'Share trends and analysis',
            frequency: 'Weekly',
            platforms: ['LinkedIn', 'Twitter']
          },
          {
            pillar: 'Product Education',
            description: 'Tutorials and use cases',
            frequency: 'Bi-weekly',
            platforms: ['YouTube', 'Blog']
          },
          {
            pillar: 'Customer Success',
            description: 'Case studies and testimonials',
            frequency: 'Monthly',
            platforms: ['LinkedIn', 'Website']
          }
        ]
      };

      mockAnalyzeCreativeBrief.mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post('/api/ai-chat/brief/analyze')
        .send({ brief: 'SaaS company looking to establish thought leadership' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contentPillars).toHaveLength(3);
      expect(response.body.data.contentPillars[0].pillar).toBe('Industry Insights');
    });

    it('should return 400 when brief is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/brief/analyze')
        .send({ objectives: ['brand_awareness'] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Brief is required');
    });

    it('should handle brief without objectives', async () => {
      mockAnalyzeCreativeBrief.mockResolvedValue({
        brief: 'Test brief',
        analysis: {}
      });

      await request(app)
        .post('/api/ai-chat/brief/analyze')
        .send({ brief: 'Test brief' })
        .expect(200);

      expect(mockAnalyzeCreativeBrief).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'Test brief',
        undefined
      );
    });
  });

  describe('POST /api/ai-chat/adapt/multi-platform', () => {
    it('should adapt Instagram content to Twitter and LinkedIn', async () => {
      const mockAdaptations = {
        originalContent: 'Long Instagram caption about product launch...',
        sourcePlatform: 'instagram',
        adaptations: {
          twitter: {
            content: '🚀 Excited to announce our new product launch!\n\nKey features:\n✅ Feature 1\n✅ Feature 2\n✅ Feature 3\n\nLearn more: [link]\n\n#ProductLaunch #Innovation',
            characterCount: 185,
            changes: ['Condensed content', 'Added thread suggestion', 'Optimized hashtags for Twitter'],
            threadSuggestion: 'Consider breaking into 3-tweet thread for full details'
          },
          linkedin: {
            content: 'I\'m thrilled to announce the launch of our latest innovation...\n\n[Professional expansion of Instagram content]\n\n#ProductLaunch #Innovation #B2B',
            characterCount: 450,
            changes: ['More professional tone', 'Added business context', 'Expanded details'],
            formatting: 'Added line breaks for readability'
          }
        },
        recommendations: [
          'Twitter: Post thread for full story',
          'LinkedIn: Add case study link',
          'All platforms: Post at optimal times'
        ]
      };

      mockAdaptContentMultiPlatform.mockResolvedValue(mockAdaptations);

      const response = await request(app)
        .post('/api/ai-chat/adapt/multi-platform')
        .send({
          content: 'Long Instagram caption about product launch...',
          sourcePlatform: 'instagram',
          targetPlatforms: ['twitter', 'linkedin']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.adaptations.twitter).toBeDefined();
      expect(response.body.data.adaptations.linkedin).toBeDefined();
      expect(response.body.data.adaptations.twitter.characterCount).toBeLessThanOrEqual(280);
      expect(mockAdaptContentMultiPlatform).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'Long Instagram caption about product launch...',
        'instagram',
        ['twitter', 'linkedin']
      );
    });

    it('should preserve key messages across platforms', async () => {
      const mockAdaptations = {
        originalContent: 'Original message',
        keyMessages: ['Message 1', 'Message 2'],
        adaptations: {
          twitter: { content: '...', preservedMessages: ['Message 1', 'Message 2'] },
          facebook: { content: '...', preservedMessages: ['Message 1', 'Message 2'] }
        }
      };

      mockAdaptContentMultiPlatform.mockResolvedValue(mockAdaptations);

      const response = await request(app)
        .post('/api/ai-chat/adapt/multi-platform')
        .send({
          content: 'Original message',
          targetPlatforms: ['twitter', 'facebook']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.keyMessages).toEqual(['Message 1', 'Message 2']);
    });

    it('should optimize hashtags for each platform', async () => {
      const mockAdaptations = {
        adaptations: {
          instagram: {
            hashtags: ['#Tag1', '#Tag2', '#Tag3', '#Tag4', '#Tag5'],
            hashtagStrategy: 'Use 5-10 hashtags'
          },
          twitter: {
            hashtags: ['#Tag1', '#Tag2'],
            hashtagStrategy: 'Use 1-2 hashtags for better engagement'
          },
          linkedin: {
            hashtags: ['#Tag1', '#Tag2', '#Tag3'],
            hashtagStrategy: 'Use 3-5 professional hashtags'
          }
        }
      };

      mockAdaptContentMultiPlatform.mockResolvedValue(mockAdaptations);

      const response = await request(app)
        .post('/api/ai-chat/adapt/multi-platform')
        .send({
          content: 'Test content',
          targetPlatforms: ['instagram', 'twitter', 'linkedin']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.adaptations.instagram.hashtags).toHaveLength(5);
      expect(response.body.data.adaptations.twitter.hashtags).toHaveLength(2);
      expect(response.body.data.adaptations.linkedin.hashtags).toHaveLength(3);
    });

    it('should return 400 when content is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/adapt/multi-platform')
        .send({ targetPlatforms: ['twitter'] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Content is required');
    });

    it('should return 400 when target platforms is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/adapt/multi-platform')
        .send({ content: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Target platforms array is required');
    });
  });
});
