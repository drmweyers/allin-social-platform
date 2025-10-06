/**
 * AI Chat - Automation & Workflow Tests
 * Category 6: Automation & Workflow (3 features, 18 tests)
 */

import request from 'supertest';
import express from 'express';
import {
  MASTER_TEST_CREDENTIALS
} from './test-fixtures';

// Mock conversation service
const mockSuggestWorkflows = jest.fn();
const mockRecommendAutomationRules = jest.fn();
const mockOptimizeWorkflow = jest.fn();

jest.mock('../../../src/services/conversation.service', () => ({
  conversationService: {
    suggestWorkflows: mockSuggestWorkflows,
    recommendAutomationRules: mockRecommendAutomationRules,
    optimizeWorkflow: mockOptimizeWorkflow
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

// Feature 6.1: Workflow Suggestions
router.post('/suggest/workflows', async (req, res) => {
  try {
    const { currentWorkflow, painPoints, goals } = req.body;
    const organizationId = req.user?.organizationId;

    const suggestions = await mockSuggestWorkflows(
      organizationId,
      currentWorkflow,
      painPoints,
      goals
    );
    return res.json({ success: true, data: suggestions });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to suggest workflows',
      message: (error as Error).message
    });
  }
});

// Feature 6.2: Automation Rule Recommendations
router.post('/recommend/automation-rules', async (req, res) => {
  try {
    const { taskType, frequency, conditions } = req.body;
    const organizationId = req.user?.organizationId;

    if (!taskType) {
      return res.status(400).json({
        success: false,
        error: 'Task type is required'
      });
    }

    const rules = await mockRecommendAutomationRules(
      organizationId,
      taskType,
      frequency,
      conditions
    );
    return res.json({ success: true, data: rules });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to recommend automation rules',
      message: (error as Error).message
    });
  }
});

// Feature 6.3: Workflow Optimization
router.post('/optimize/workflow', async (req, res) => {
  try {
    const { workflow, metrics } = req.body;
    const organizationId = req.user?.organizationId;

    if (!workflow) {
      return res.status(400).json({
        success: false,
        error: 'Workflow data is required'
      });
    }

    const optimization = await mockOptimizeWorkflow(
      organizationId,
      workflow,
      metrics
    );
    return res.json({ success: true, data: optimization });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to optimize workflow',
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

describe('AI Chat - Automation & Workflow', () => {
  describe('POST /api/ai-chat/suggest/workflows', () => {
    it('should suggest posting automation workflow', async () => {
      const mockSuggestions = {
        category: 'posting_automation',
        recommendations: [
          {
            name: 'Auto-schedule optimal posting times',
            description: 'Automatically schedule posts for peak engagement times',
            complexity: 'low',
            setupTime: '15 minutes',
            timeSavings: '5 hours per week',
            tools: ['Buffer', 'Hootsuite', 'Later'],
            steps: [
              'Connect social media accounts',
              'Set posting frequency preferences',
              'Enable AI optimal time detection',
              'Review and approve suggested schedule'
            ],
            riskLevel: 'low',
            safetyNote: 'Always review posts before they go live'
          },
          {
            name: 'Content recycling automation',
            description: 'Automatically repost high-performing content',
            complexity: 'medium',
            setupTime: '30 minutes',
            timeSavings: '3 hours per week',
            riskLevel: 'medium',
            safetyNote: 'Ensure content stays relevant over time'
          }
        ],
        totalPotentialSavings: '8 hours per week',
        recommendedPriority: [
          'Start with auto-scheduling (quick win)',
          'Add content recycling after 2 weeks'
        ]
      };

      mockSuggestWorkflows.mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .post('/api/ai-chat/suggest/workflows')
        .send({
          currentWorkflow: 'manual_posting',
          painPoints: ['time_consuming', 'inconsistent_timing'],
          goals: ['save_time', 'increase_consistency']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toHaveLength(2);
      expect(response.body.data.recommendations[0].timeSavings).toBe('5 hours per week');
      expect(response.body.data.totalPotentialSavings).toBe('8 hours per week');
      expect(mockSuggestWorkflows).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'manual_posting',
        ['time_consuming', 'inconsistent_timing'],
        ['save_time', 'increase_consistency']
      );
    });

    it('should suggest response automation workflow', async () => {
      const mockSuggestions = {
        category: 'response_automation',
        recommendations: [
          {
            name: 'Auto-reply to common questions',
            description: 'Set up AI-powered responses to FAQs',
            complexity: 'medium',
            setupTime: '45 minutes',
            timeSavings: '10 hours per week',
            steps: [
              'Identify top 10 common questions',
              'Create response templates',
              'Set up auto-reply triggers',
              'Enable AI to handle variations',
              'Set escalation rules for complex queries'
            ],
            riskLevel: 'medium',
            safetyNote: 'Always allow users to reach a human if needed'
          }
        ]
      };

      mockSuggestWorkflows.mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .post('/api/ai-chat/suggest/workflows')
        .send({
          painPoints: ['too_many_repetitive_questions'],
          goals: ['improve_response_time']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations[0].name).toBe('Auto-reply to common questions');
      expect(response.body.data.recommendations[0].complexity).toBe('medium');
    });

    it('should suggest reporting automation workflow', async () => {
      const mockSuggestions = {
        category: 'reporting_automation',
        recommendations: [
          {
            name: 'Weekly performance reports',
            description: 'Automatically generate and email weekly analytics reports',
            complexity: 'low',
            setupTime: '20 minutes',
            timeSavings: '2 hours per week',
            schedule: 'Every Monday at 9 AM',
            recipients: ['team@example.com', 'manager@example.com'],
            riskLevel: 'low'
          },
          {
            name: 'Real-time alert system',
            description: 'Get notified of significant metric changes',
            complexity: 'low',
            setupTime: '15 minutes',
            triggers: ['Viral post detected', 'Engagement spike', 'Negative sentiment surge'],
            riskLevel: 'low'
          }
        ]
      };

      mockSuggestWorkflows.mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .post('/api/ai-chat/suggest/workflows')
        .send({
          currentWorkflow: 'manual_reporting',
          goals: ['stay_informed', 'save_time']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toHaveLength(2);
      expect(response.body.data.recommendations[0].schedule).toBe('Every Monday at 9 AM');
    });

    it('should estimate time savings for workflows', async () => {
      const mockSuggestions = {
        recommendations: [
          { name: 'Workflow 1', timeSavings: '5 hours per week' },
          { name: 'Workflow 2', timeSavings: '3 hours per week' },
          { name: 'Workflow 3', timeSavings: '2 hours per week' }
        ],
        timeSavingsBreakdown: {
          daily: '1.4 hours',
          weekly: '10 hours',
          monthly: '40 hours',
          yearly: '480 hours (60 days)'
        },
        costSavings: {
          assumedHourlyRate: 50,
          weeklySavings: 500,
          monthlySavings: 2000,
          yearlySavings: 24000
        }
      };

      mockSuggestWorkflows.mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .post('/api/ai-chat/suggest/workflows')
        .send({ goals: ['save_time'] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.timeSavingsBreakdown).toBeDefined();
      expect(response.body.data.costSavings.yearlySavings).toBe(24000);
    });

    it('should assess workflow complexity', async () => {
      const mockSuggestions = {
        recommendations: [
          {
            name: 'Simple workflow',
            complexity: 'low',
            technicalLevel: 'beginner',
            estimatedSetupTime: '10 minutes'
          },
          {
            name: 'Moderate workflow',
            complexity: 'medium',
            technicalLevel: 'intermediate',
            estimatedSetupTime: '45 minutes',
            prerequisites: ['API access', 'Zapier account']
          },
          {
            name: 'Advanced workflow',
            complexity: 'high',
            technicalLevel: 'advanced',
            estimatedSetupTime: '3 hours',
            prerequisites: ['Developer knowledge', 'Custom API integration'],
            alternativeSuggestion: 'Consider hiring a developer'
          }
        ]
      };

      mockSuggestWorkflows.mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .post('/api/ai-chat/suggest/workflows')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toHaveLength(3);
      expect(response.body.data.recommendations[2].alternativeSuggestion).toBeDefined();
    });

    it('should include safety and risk warnings', async () => {
      const mockSuggestions = {
        recommendations: [
          {
            name: 'Auto-delete old posts',
            riskLevel: 'high',
            safetyWarning: 'Permanent deletion - create backups first!',
            safetyChecklist: [
              'Export all posts before enabling',
              'Test on a small batch first',
              'Set up manual approval for first 30 days',
              'Review deletion criteria carefully'
            ]
          },
          {
            name: 'Auto-respond to all comments',
            riskLevel: 'medium',
            safetyWarning: 'May respond inappropriately to complex or sensitive comments',
            bestPractice: 'Always review AI responses in first week'
          }
        ]
      };

      mockSuggestWorkflows.mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .post('/api/ai-chat/suggest/workflows')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations[0].riskLevel).toBe('high');
      expect(response.body.data.recommendations[0].safetyChecklist).toHaveLength(4);
    });
  });

  describe('POST /api/ai-chat/recommend/automation-rules', () => {
    it('should recommend auto-response rules', async () => {
      const mockRules = {
        taskType: 'auto_response',
        rules: [
          {
            trigger: 'Comment contains "price" or "cost"',
            action: 'Reply with pricing link',
            template: 'Thanks for your interest! Check out our pricing here: [link]',
            conditions: ['During business hours', 'First-time commenter'],
            priority: 'high'
          },
          {
            trigger: 'Comment contains "support" or "help"',
            action: 'Reply with support link',
            template: 'We\'re here to help! Visit our support center: [link]',
            conditions: ['Any time'],
            priority: 'high'
          },
          {
            trigger: 'Positive comment (sentiment > 0.7)',
            action: 'Thank and engage',
            template: 'Thank you so much! 🙏 What do you love most about [topic]?',
            conditions: ['Verified user'],
            priority: 'medium'
          }
        ],
        setupInstructions: [
          'Go to Settings > Automation > Auto-responses',
          'Click "Add Rule"',
          'Set trigger keywords',
          'Customize response template',
          'Set conditions',
          'Test with a few comments first'
        ]
      };

      mockRecommendAutomationRules.mockResolvedValue(mockRules);

      const response = await request(app)
        .post('/api/ai-chat/recommend/automation-rules')
        .send({
          taskType: 'auto_response',
          frequency: 'realtime',
          conditions: ['business_hours', 'verified_users']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rules).toHaveLength(3);
      expect(response.body.data.rules[0].priority).toBe('high');
      expect(response.body.data.setupInstructions).toHaveLength(6);
      expect(mockRecommendAutomationRules).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'auto_response',
        'realtime',
        ['business_hours', 'verified_users']
      );
    });

    it('should recommend content scheduling rules', async () => {
      const mockRules = {
        taskType: 'content_scheduling',
        rules: [
          {
            trigger: 'Monday 9:00 AM',
            action: 'Post motivational content',
            platform: 'linkedin',
            contentType: 'quote',
            recurring: 'weekly'
          },
          {
            trigger: 'Tuesday 2:00 PM',
            action: 'Post product showcase',
            platform: 'instagram',
            contentType: 'carousel',
            recurring: 'weekly'
          },
          {
            trigger: 'Friday 5:00 PM',
            action: 'Post weekend content',
            platform: 'all',
            contentType: 'casual',
            recurring: 'weekly'
          }
        ],
        optimalSchedule: {
          instagram: ['Tuesday 2 PM', 'Thursday 3 PM', 'Sunday 11 AM'],
          linkedin: ['Monday 9 AM', 'Wednesday 10 AM', 'Friday 8 AM'],
          twitter: ['Every day 9 AM, 1 PM, 6 PM']
        }
      };

      mockRecommendAutomationRules.mockResolvedValue(mockRules);

      const response = await request(app)
        .post('/api/ai-chat/recommend/automation-rules')
        .send({
          taskType: 'content_scheduling',
          frequency: 'weekly'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rules).toHaveLength(3);
      expect(response.body.data.optimalSchedule).toBeDefined();
    });

    it('should recommend engagement boost rules', async () => {
      const mockRules = {
        taskType: 'engagement_boost',
        rules: [
          {
            trigger: 'Post reaches 100 likes in first hour',
            action: 'Boost post with $50 ad spend',
            reasoning: 'High early engagement indicates viral potential',
            expectedROI: '5x'
          },
          {
            trigger: 'Comment from influencer (>10k followers)',
            action: 'Reply within 5 minutes + pin comment',
            reasoning: 'Leverage influencer engagement for visibility'
          },
          {
            trigger: 'Post engagement drops below 50 likes in 24 hours',
            action: 'Share to Stories to boost visibility',
            reasoning: 'Second chance for underperforming content'
          }
        ]
      };

      mockRecommendAutomationRules.mockResolvedValue(mockRules);

      const response = await request(app)
        .post('/api/ai-chat/recommend/automation-rules')
        .send({ taskType: 'engagement_boost' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rules[0].expectedROI).toBe('5x');
    });

    it('should recommend moderation rules', async () => {
      const mockRules = {
        taskType: 'moderation',
        rules: [
          {
            trigger: 'Comment contains profanity',
            action: 'Hide comment + notify moderator',
            severity: 'high',
            autoAction: true
          },
          {
            trigger: 'Spam detected (repeated links)',
            action: 'Delete + block user',
            severity: 'high',
            autoAction: true
          },
          {
            trigger: 'Negative sentiment comment',
            action: 'Flag for human review',
            severity: 'medium',
            autoAction: false,
            reasoning: 'Negative feedback might be valuable'
          }
        ],
        safetyNote: 'Always review auto-moderation actions weekly to prevent false positives'
      };

      mockRecommendAutomationRules.mockResolvedValue(mockRules);

      const response = await request(app)
        .post('/api/ai-chat/recommend/automation-rules')
        .send({ taskType: 'moderation' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rules).toHaveLength(3);
      expect(response.body.data.safetyNote).toBeDefined();
    });

    it('should return 400 when task type is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/recommend/automation-rules')
        .send({ frequency: 'daily' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task type is required');
    });

    it('should handle optional frequency and conditions', async () => {
      mockRecommendAutomationRules.mockResolvedValue({
        taskType: 'test',
        rules: []
      });

      await request(app)
        .post('/api/ai-chat/recommend/automation-rules')
        .send({ taskType: 'test' })
        .expect(200);

      expect(mockRecommendAutomationRules).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'test',
        undefined,
        undefined
      );
    });
  });

  describe('POST /api/ai-chat/optimize/workflow', () => {
    it('should optimize existing workflow for efficiency', async () => {
      const mockOptimization = {
        currentWorkflow: {
          name: 'Content creation and posting',
          steps: 7,
          averageTime: '4 hours',
          inefficiencies: 3
        },
        optimizedWorkflow: {
          name: 'Streamlined content workflow',
          steps: 4,
          averageTime: '2.5 hours',
          improvements: [
            {
              step: 'Content ideation',
              current: 'Manual brainstorming (1 hour)',
              optimized: 'AI-assisted ideation (15 minutes)',
              timeSaved: '45 minutes'
            },
            {
              step: 'Image creation',
              current: 'Custom design in Photoshop (1 hour)',
              optimized: 'Template-based design in Canva (20 minutes)',
              timeSaved: '40 minutes'
            },
            {
              step: 'Caption writing',
              current: 'Manual writing and research (30 minutes)',
              optimized: 'AI-assisted with editing (10 minutes)',
              timeSaved: '20 minutes'
            }
          ],
          totalTimeSaved: '1.5 hours per content piece',
          monthlyTimeSaved: '60 hours (assuming 40 posts/month)'
        },
        actionPlan: [
          'Week 1: Set up AI content ideation tools',
          'Week 2: Create Canva template library',
          'Week 3: Implement AI caption assistance',
          'Week 4: Measure and refine new workflow'
        ]
      };

      mockOptimizeWorkflow.mockResolvedValue(mockOptimization);

      const response = await request(app)
        .post('/api/ai-chat/optimize/workflow')
        .send({
          workflow: {
            name: 'Content creation and posting',
            steps: ['ideation', 'design', 'writing', 'scheduling'],
            averageTime: '4 hours'
          },
          metrics: ['time', 'quality', 'consistency']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.optimizedWorkflow.steps).toBe(4);
      expect(response.body.data.optimizedWorkflow.improvements).toHaveLength(3);
      expect(response.body.data.optimizedWorkflow.totalTimeSaved).toBe('1.5 hours per content piece');
      expect(mockOptimizeWorkflow).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        expect.any(Object),
        ['time', 'quality', 'consistency']
      );
    });

    it('should identify workflow bottlenecks', async () => {
      const mockOptimization = {
        bottlenecks: [
          {
            step: 'Manual approval process',
            issue: 'Takes 2-3 days for approval',
            impact: 'Delays publishing by 40%',
            solution: 'Implement tiered approval (low-risk auto-approve)',
            potentialImprovement: 'Reduce approval time by 80%'
          },
          {
            step: 'Cross-platform formatting',
            issue: 'Reformatting content for each platform manually',
            impact: '1 hour per post set',
            solution: 'Use multi-platform content adaptation tool',
            potentialImprovement: 'Save 50 minutes per post set'
          }
        ]
      };

      mockOptimizeWorkflow.mockResolvedValue(mockOptimization);

      const response = await request(app)
        .post('/api/ai-chat/optimize/workflow')
        .send({
          workflow: { name: 'Publishing workflow' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bottlenecks).toHaveLength(2);
      expect(response.body.data.bottlenecks[0].solution).toBeDefined();
    });

    it('should suggest parallel vs sequential task optimization', async () => {
      const mockOptimization = {
        currentStructure: 'sequential',
        recommendedStructure: 'parallel',
        parallelizableTasks: [
          {
            tasks: ['Image design', 'Caption writing', 'Hashtag research'],
            current: '2.5 hours (sequential)',
            optimized: '1 hour (parallel with team)',
            improvement: '60% time reduction'
          }
        ],
        teamAllocation: {
          designer: 'Focus on visuals',
          writer: 'Focus on captions',
          strategist: 'Focus on hashtags and scheduling'
        }
      };

      mockOptimizeWorkflow.mockResolvedValue(mockOptimization);

      const response = await request(app)
        .post('/api/ai-chat/optimize/workflow')
        .send({
          workflow: { name: 'Team content workflow' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendedStructure).toBe('parallel');
      expect(response.body.data.teamAllocation).toBeDefined();
    });

    it('should provide quality metrics alongside efficiency', async () => {
      const mockOptimization = {
        metrics: {
          efficiency: {
            before: '4 hours per content piece',
            after: '2 hours per content piece',
            improvement: '50%'
          },
          quality: {
            before: 'Inconsistent (manual variation)',
            after: 'Consistent (template + AI-assisted)',
            score: '+25%'
          },
          consistency: {
            before: '3-4 posts per week',
            after: '5-7 posts per week',
            improvement: '75%'
          }
        },
        tradeoffAnalysis: 'No quality sacrifice - automation handles repetitive tasks while humans focus on creative strategy'
      };

      mockOptimizeWorkflow.mockResolvedValue(mockOptimization);

      const response = await request(app)
        .post('/api/ai-chat/optimize/workflow')
        .send({
          workflow: { name: 'Test workflow' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics.quality).toBeDefined();
      expect(response.body.data.tradeoffAnalysis).toBeDefined();
    });

    it('should return 400 when workflow data is missing', async () => {
      const response = await request(app)
        .post('/api/ai-chat/optimize/workflow')
        .send({ metrics: ['time'] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Workflow data is required');
    });

    it('should handle optional metrics parameter', async () => {
      mockOptimizeWorkflow.mockResolvedValue({
        optimizedWorkflow: {}
      });

      await request(app)
        .post('/api/ai-chat/optimize/workflow')
        .send({ workflow: { name: 'Test' } })
        .expect(200);

      expect(mockOptimizeWorkflow).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        { name: 'Test' },
        undefined
      );
    });
  });
});
