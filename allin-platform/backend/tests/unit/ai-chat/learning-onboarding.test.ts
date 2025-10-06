/**
 * AI Chat - Learning & Onboarding Tests
 * Category 7: Learning & Onboarding (3 features, 18 tests)
 */

import request from 'supertest';
import express from 'express';
import {
  MASTER_TEST_CREDENTIALS
} from './test-fixtures';

// Mock conversation service
const mockGetFeatureTutorial = jest.fn();
const mockGetBestPractices = jest.fn();
const mockRecommendLearningPath = jest.fn();

jest.mock('../../../src/services/conversation.service', () => ({
  conversationService: {
    getFeatureTutorial: mockGetFeatureTutorial,
    getBestPractices: mockGetBestPractices,
    recommendLearningPath: mockRecommendLearningPath
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

// Feature 7.1: Feature Tutorials
router.post('/tutorial/feature', async (req, res) => {
  try {
    const { featureName, userLevel } = req.body;
    const organizationId = req.user?.organizationId;

    if (!featureName) {
      return res.status(400).json({
        success: false,
        error: 'Feature name is required'
      });
    }

    const tutorial = await mockGetFeatureTutorial(
      organizationId,
      featureName,
      userLevel
    );
    return res.json({ success: true, data: tutorial });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get tutorial',
      message: (error as Error).message
    });
  }
});

// Feature 7.2: Best Practices Guidance
router.post('/guide/best-practices', async (req, res) => {
  try {
    const { platform, topic, industry } = req.body;
    const organizationId = req.user?.organizationId;

    if (!platform) {
      return res.status(400).json({
        success: false,
        error: 'Platform is required'
      });
    }

    const guidance = await mockGetBestPractices(
      organizationId,
      platform,
      topic,
      industry
    );
    return res.json({ success: true, data: guidance });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get best practices',
      message: (error as Error).message
    });
  }
});

// Feature 7.3: Learning Path Recommendations
router.post('/recommend/learning-path', async (req, res) => {
  try {
    const { currentSkillLevel, goals, timeAvailable } = req.body;
    const organizationId = req.user?.organizationId;

    if (!goals || !Array.isArray(goals)) {
      return res.status(400).json({
        success: false,
        error: 'Goals array is required'
      });
    }

    const learningPath = await mockRecommendLearningPath(
      organizationId,
      currentSkillLevel,
      goals,
      timeAvailable
    );
    return res.json({ success: true, data: learningPath });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to recommend learning path',
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

describe('AI Chat - Learning & Onboarding', () => {
  describe('POST /api/ai-chat/tutorial/feature', () => {
    it('should explain content calendar feature', async () => {
      const mockTutorial = {
        feature: 'content_calendar',
        title: 'How to Use the Content Calendar',
        overview: 'The content calendar helps you plan, schedule, and manage your social media posts across all platforms.',
        steps: [
          {
            step: 1,
            title: 'Access the Calendar',
            instruction: 'Click on "Content Calendar" in the main navigation',
            tip: 'Use keyboard shortcut Cmd+K to quick-access'
          },
          {
            step: 2,
            title: 'Create a Post',
            instruction: 'Click the "+" button or drag-and-drop to a date',
            tip: 'Drag across multiple days for recurring posts'
          },
          {
            step: 3,
            title: 'Schedule for Multiple Platforms',
            instruction: 'Select platforms and customize content for each',
            tip: 'Use the "Adapt for All Platforms" feature to auto-customize'
          },
          {
            step: 4,
            title: 'Set Optimal Times',
            instruction: 'Click "Suggest Best Time" for AI recommendations',
            tip: 'Times are based on your audience activity patterns'
          }
        ],
        commonPitfalls: [
          'Forgetting to set timezone correctly',
          'Not customizing content for each platform',
          'Scheduling too many posts at once'
        ],
        proTips: [
          'Use color coding to organize by campaign',
          'Enable calendar sync to Google Calendar',
          'Set up approval workflows for team posts'
        ],
        relatedFeatures: [
          'Auto-scheduling',
          'Content library',
          'Team collaboration'
        ],
        estimatedTime: '5 minutes to learn basics'
      };

      mockGetFeatureTutorial.mockResolvedValue(mockTutorial);

      const response = await request(app)
        .post('/api/ai-chat/tutorial/feature')
        .send({
          featureName: 'content_calendar',
          userLevel: 'beginner'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.steps).toHaveLength(4);
      expect(response.body.data.commonPitfalls).toHaveLength(3);
      expect(response.body.data.proTips).toHaveLength(3);
      expect(mockGetFeatureTutorial).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'content_calendar',
        'beginner'
      );
    });

    it('should explain analytics dashboard feature', async () => {
      const mockTutorial = {
        feature: 'analytics_dashboard',
        title: 'Understanding Your Analytics Dashboard',
        steps: [
          {
            step: 1,
            title: 'Navigate to Analytics',
            instruction: 'Click "Analytics" in the sidebar'
          },
          {
            step: 2,
            title: 'Choose Date Range',
            instruction: 'Select timeframe (7d, 30d, 90d, custom)'
          },
          {
            step: 3,
            title: 'Interpret Key Metrics',
            instruction: 'Focus on engagement rate, reach, and follower growth'
          }
        ],
        keyMetrics: [
          {
            metric: 'Engagement Rate',
            definition: 'Interactions divided by reach',
            goodBenchmark: '3-5% for most industries'
          },
          {
            metric: 'Reach',
            definition: 'Unique users who saw your content',
            howToImprove: 'Post at optimal times, use trending hashtags'
          }
        ]
      };

      mockGetFeatureTutorial.mockResolvedValue(mockTutorial);

      const response = await request(app)
        .post('/api/ai-chat/tutorial/feature')
        .send({ featureName: 'analytics_dashboard' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.keyMetrics).toBeDefined();
      expect(response.body.data.keyMetrics).toHaveLength(2);
    });

    it('should explain team collaboration features', async () => {
      const mockTutorial = {
        feature: 'team_collaboration',
        title: 'Working with Your Team',
        steps: [
          {
            step: 1,
            title: 'Invite Team Members',
            instruction: 'Go to Settings > Team > Invite Members'
          },
          {
            step: 2,
            title: 'Assign Roles',
            instruction: 'Set permissions (Admin, Manager, Creator, Client)'
          },
          {
            step: 3,
            title: 'Set Up Approval Workflow',
            instruction: 'Enable "Require Approval" for content review'
          }
        ],
        roleExplanations: {
          admin: 'Full access to all features and settings',
          manager: 'Can create, schedule, and manage content',
          creator: 'Can create and submit content for approval',
          client: 'Read-only access to analytics and content'
        }
      };

      mockGetFeatureTutorial.mockResolvedValue(mockTutorial);

      const response = await request(app)
        .post('/api/ai-chat/tutorial/feature')
        .send({ featureName: 'team_collaboration' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.roleExplanations).toBeDefined();
    });

    it('should adapt tutorial based on user level', async () => {
      const levels = ['beginner', 'intermediate', 'advanced'];

      for (const level of levels) {
        mockGetFeatureTutorial.mockResolvedValue({
          feature: 'test',
          userLevel: level,
          complexity: level === 'beginner' ? 'simple' : level === 'intermediate' ? 'moderate' : 'detailed'
        });

        const response = await request(app)
          .post('/api/ai-chat/tutorial/feature')
          .send({
            featureName: 'test',
            userLevel: level
          })
          .expect(200);

        expect(response.body.data.userLevel).toBe(level);
      }
    });

    it('should handle unknown features gracefully', async () => {
      mockGetFeatureTutorial.mockRejectedValue(
        new Error('Feature not found')
      );

      const response = await request(app)
        .post('/api/ai-chat/tutorial/feature')
        .send({ featureName: 'nonexistent_feature' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Feature not found');
    });

    it('should return 400 when feature name is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/tutorial/feature')
        .send({ userLevel: 'beginner' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Feature name is required');
    });
  });

  describe('POST /api/ai-chat/guide/best-practices', () => {
    it('should provide Instagram best practices', async () => {
      const mockGuidance = {
        platform: 'instagram',
        bestPractices: [
          {
            category: 'Content',
            practices: [
              {
                practice: 'Use high-quality visuals',
                reasoning: 'Instagram is a visual platform - quality matters',
                impact: 'High',
                examples: ['Professional photos', 'Well-designed graphics', 'Short videos (Reels)']
              },
              {
                practice: 'Post consistently (3-7 times per week)',
                reasoning: 'Algorithm favors active accounts',
                impact: 'High',
                recommendedSchedule: 'Tuesday 2 PM, Thursday 3 PM, Sunday 11 AM'
              },
              {
                practice: 'Use 5-10 relevant hashtags',
                reasoning: 'Improves discoverability',
                impact: 'Medium',
                tip: 'Mix popular and niche hashtags'
              }
            ]
          },
          {
            category: 'Engagement',
            practices: [
              {
                practice: 'Respond to comments within 1 hour',
                reasoning: 'Boosts engagement rate and algorithm ranking',
                impact: 'High'
              },
              {
                practice: 'Use Stories daily',
                reasoning: 'Stories appear first in feed, high visibility',
                impact: 'High',
                tip: 'Add polls and questions for interaction'
              }
            ]
          }
        ],
        commonMistakes: [
          'Posting without a caption',
          'Using too many or irrelevant hashtags',
          'Not engaging with followers'
        ],
        industryBenchmarks: {
          engagementRate: '1-5%',
          postingFrequency: '3-7 posts per week',
          storyFrequency: '1-3 stories per day'
        }
      };

      mockGetBestPractices.mockResolvedValue(mockGuidance);

      const response = await request(app)
        .post('/api/ai-chat/guide/best-practices')
        .send({
          platform: 'instagram',
          topic: 'general',
          industry: 'lifestyle'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bestPractices).toHaveLength(2);
      expect(response.body.data.commonMistakes).toHaveLength(3);
      expect(response.body.data.industryBenchmarks).toBeDefined();
      expect(mockGetBestPractices).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'instagram',
        'general',
        'lifestyle'
      );
    });

    it('should provide LinkedIn best practices', async () => {
      const mockGuidance = {
        platform: 'linkedin',
        bestPractices: [
          {
            category: 'Content',
            practices: [
              {
                practice: 'Share professional insights and thought leadership',
                reasoning: 'LinkedIn users value expertise and learning',
                impact: 'Very High'
              },
              {
                practice: 'Post during business hours (Monday-Friday 8 AM - 12 PM)',
                reasoning: 'When professionals are most active',
                impact: 'High'
              }
            ]
          }
        ],
        tone: 'Professional yet conversational',
        contentTypes: ['Articles', 'Industry insights', 'Case studies', 'Professional achievements']
      };

      mockGetBestPractices.mockResolvedValue(mockGuidance);

      const response = await request(app)
        .post('/api/ai-chat/guide/best-practices')
        .send({ platform: 'linkedin' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tone).toBe('Professional yet conversational');
    });

    it('should provide topic-specific best practices', async () => {
      const mockGuidance = {
        platform: 'twitter',
        topic: 'engagement',
        bestPractices: [
          {
            category: 'Engagement Tactics',
            practices: [
              {
                practice: 'Tweet threads for complex topics',
                reasoning: 'Threads keep users engaged longer',
                impact: 'High'
              },
              {
                practice: 'Use polls to boost interaction',
                reasoning: 'Polls have 3x higher engagement',
                impact: 'Medium'
              }
            ]
          }
        ]
      };

      mockGetBestPractices.mockResolvedValue(mockGuidance);

      const response = await request(app)
        .post('/api/ai-chat/guide/best-practices')
        .send({
          platform: 'twitter',
          topic: 'engagement'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.topic).toBe('engagement');
    });

    it('should provide industry-specific best practices', async () => {
      const mockGuidance = {
        platform: 'instagram',
        industry: 'ecommerce',
        bestPractices: [
          {
            category: 'E-commerce Specific',
            practices: [
              {
                practice: 'Use Instagram Shopping tags',
                reasoning: 'Direct path to purchase',
                impact: 'Very High',
                conversionRate: '2-3% average'
              },
              {
                practice: 'Show products in lifestyle context',
                reasoning: 'Helps customers visualize usage',
                impact: 'High'
              }
            ]
          }
        ]
      };

      mockGetBestPractices.mockResolvedValue(mockGuidance);

      const response = await request(app)
        .post('/api/ai-chat/guide/best-practices')
        .send({
          platform: 'instagram',
          industry: 'ecommerce'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.industry).toBe('ecommerce');
    });

    it('should return 400 when platform is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/guide/best-practices')
        .send({ topic: 'engagement' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Platform is required');
    });

    it('should handle optional topic and industry parameters', async () => {
      mockGetBestPractices.mockResolvedValue({
        platform: 'twitter',
        bestPractices: []
      });

      await request(app)
        .post('/api/ai-chat/guide/best-practices')
        .send({ platform: 'twitter' })
        .expect(200);

      expect(mockGetBestPractices).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'twitter',
        undefined,
        undefined
      );
    });
  });

  describe('POST /api/ai-chat/recommend/learning-path', () => {
    it('should recommend learning path for beginners', async () => {
      const mockLearningPath = {
        currentLevel: 'beginner',
        goals: ['increase_engagement', 'grow_followers'],
        timeAvailable: '5 hours per week',
        recommendedPath: {
          week1: {
            focus: 'Platform Basics',
            modules: [
              {
                title: 'Understanding Social Media Platforms',
                duration: '1 hour',
                topics: ['Instagram vs Facebook vs Twitter', 'When to use each platform'],
                resources: ['Video tutorial', 'Platform comparison guide']
              },
              {
                title: 'Setting Up Your Profiles',
                duration: '2 hours',
                topics: ['Profile optimization', 'Bio writing', 'Visual branding'],
                practiceExercise: 'Optimize your Instagram profile'
              }
            ],
            estimatedTime: '3 hours'
          },
          week2: {
            focus: 'Content Creation',
            modules: [
              {
                title: 'Creating Engaging Content',
                duration: '2 hours',
                topics: ['Visual design basics', 'Caption writing', 'Hashtag strategy']
              },
              {
                title: 'Using Content Calendar',
                duration: '1 hour',
                topics: ['Planning posts', 'Scheduling', 'Consistency']
              }
            ],
            estimatedTime: '3 hours'
          },
          week3: {
            focus: 'Engagement & Growth',
            modules: [
              {
                title: 'Building Engagement',
                duration: '2 hours',
                topics: ['Responding to comments', 'Community building', 'Collaboration']
              },
              {
                title: 'Analytics Basics',
                duration: '1 hour',
                topics: ['Understanding key metrics', 'What to measure', 'Adjusting strategy']
              }
            ],
            estimatedTime: '3 hours'
          }
        },
        totalDuration: '3 weeks (9 hours total)',
        milestones: [
          { week: 1, goal: 'Optimized profiles on 2 platforms' },
          { week: 2, goal: 'First week of scheduled content' },
          { week: 3, goal: 'Baseline analytics understanding' }
        ],
        resources: [
          'Interactive tutorials in the app',
          'Video library access',
          'Community forum support'
        ]
      };

      mockRecommendLearningPath.mockResolvedValue(mockLearningPath);

      const response = await request(app)
        .post('/api/ai-chat/recommend/learning-path')
        .send({
          currentSkillLevel: 'beginner',
          goals: ['increase_engagement', 'grow_followers'],
          timeAvailable: '5 hours per week'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendedPath.week1).toBeDefined();
      expect(response.body.data.recommendedPath.week2).toBeDefined();
      expect(response.body.data.recommendedPath.week3).toBeDefined();
      expect(response.body.data.milestones).toHaveLength(3);
      expect(mockRecommendLearningPath).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'beginner',
        ['increase_engagement', 'grow_followers'],
        '5 hours per week'
      );
    });

    it('should recommend accelerated path for experienced users', async () => {
      const mockLearningPath = {
        currentLevel: 'intermediate',
        goals: ['advanced_analytics', 'automation'],
        recommendedPath: {
          week1: {
            focus: 'Advanced Analytics',
            modules: [
              {
                title: 'Deep Dive Analytics',
                duration: '3 hours',
                topics: ['Attribution modeling', 'ROI tracking', 'Predictive analytics'],
                difficulty: 'advanced'
              }
            ]
          },
          week2: {
            focus: 'Marketing Automation',
            modules: [
              {
                title: 'Workflow Automation',
                duration: '4 hours',
                topics: ['Auto-scheduling', 'Response automation', 'Reporting automation']
              }
            ]
          }
        },
        totalDuration: '2 weeks (7 hours total)',
        note: 'Accelerated path for experienced users'
      };

      mockRecommendLearningPath.mockResolvedValue(mockLearningPath);

      const response = await request(app)
        .post('/api/ai-chat/recommend/learning-path')
        .send({
          currentSkillLevel: 'intermediate',
          goals: ['advanced_analytics', 'automation']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.note).toContain('Accelerated');
    });

    it('should customize path based on time availability', async () => {
      const mockLearningPath = {
        timeAvailable: '2 hours per week',
        recommendedPath: {
          note: 'Extended timeline due to limited time availability',
          duration: '6 weeks instead of 3 weeks',
          pacing: 'Slower, more manageable'
        }
      };

      mockRecommendLearningPath.mockResolvedValue(mockLearningPath);

      const response = await request(app)
        .post('/api/ai-chat/recommend/learning-path')
        .send({
          currentSkillLevel: 'beginner',
          goals: ['increase_engagement'],
          timeAvailable: '2 hours per week'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendedPath.note).toContain('Extended timeline');
    });

    it('should align learning path with specific goals', async () => {
      const goals = [
        ['increase_engagement'],
        ['grow_followers', 'build_community'],
        ['improve_analytics', 'roi_tracking']
      ];

      for (const goalSet of goals) {
        mockRecommendLearningPath.mockResolvedValue({
          goals: goalSet,
          pathFocus: goalSet.join(' + ')
        });

        const response = await request(app)
          .post('/api/ai-chat/recommend/learning-path')
          .send({
            currentSkillLevel: 'beginner',
            goals: goalSet
          })
          .expect(200);

        expect(response.body.data.goals).toEqual(goalSet);
      }
    });

    it('should return 400 when goals are missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/recommend/learning-path')
        .send({ currentSkillLevel: 'beginner' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Goals array is required');
    });

    it('should return 400 when goals is not an array', async () => {
      const response = await request(app)
        .post('/api/ai-chat/recommend/learning-path')
        .send({
          currentSkillLevel: 'beginner',
          goals: 'increase_engagement'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Goals array is required');
    });
  });
});
