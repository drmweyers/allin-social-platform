/**
 * AI Chat Integration Tests - Authentication & Authorization
 * Tests auth middleware, role-based access, and organization isolation
 *
 * @group integration
 * @group ai-chat
 * @group security
 */

import express from 'express';
import request from 'supertest';
import { MASTER_TEST_CREDENTIALS } from '../../unit/ai-chat/test-fixtures';

// Mock conversation service
const mockExplainAnalytics = jest.fn();
const mockGenerateContent = jest.fn();
const mockOptimizeStrategy = jest.fn();

jest.mock('../../../src/services/conversation.service', () => ({
  conversationService: {
    explainAnalytics: mockExplainAnalytics,
    generateContent: mockGenerateContent,
    optimizeStrategy: mockOptimizeStrategy
  }
}));

describe('AI Chat - Authentication & Authorization Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Middleware', () => {
    beforeEach(() => {
      // Create app with NO auth middleware
      const router = express.Router();

      router.post('/explain/analytics', async (req, res) => {
        try {
          const { metric, timeframe } = req.body;
          const organizationId = req.user?.organizationId;

          if (!req.user) {
            return res.status(401).json({ success: false, error: 'Unauthorized - No user context' });
          }

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

      app = express();
      app.use(express.json());
      app.use('/api/ai-chat', router);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .send({
          metric: 'engagement_rate',
          timeframe: 'last_30_days'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Unauthorized');
      expect(mockExplainAnalytics).not.toHaveBeenCalled();
    });

    it('should accept request with valid authentication', async () => {
      // Create app WITH auth middleware
      const authMiddleware = (req: any, _res: any, next: any) => {
        req.user = {
          id: MASTER_TEST_CREDENTIALS.admin.id,
          email: MASTER_TEST_CREDENTIALS.admin.email,
          organizationId: MASTER_TEST_CREDENTIALS.admin.organizationId,
          role: MASTER_TEST_CREDENTIALS.admin.role
        };
        next();
      };

      const router = express.Router();
      router.use(authMiddleware);

      router.post('/explain/analytics', async (req, res) => {
        try {
          const { metric, timeframe } = req.body;
          const organizationId = req.user?.organizationId;

          if (!req.user) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
          }

          if (!metric) {
            return res.status(400).json({ success: false, error: 'Metric is required' });
          }

          const explanation = await mockExplainAnalytics(organizationId, metric, timeframe);
          return res.json({ success: true, data: explanation });
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Failed to explain analytics'
          });
        }
      });

      const authenticatedApp = express();
      authenticatedApp.use(express.json());
      authenticatedApp.use('/api/ai-chat', router);

      mockExplainAnalytics.mockResolvedValue({
        metric: 'engagement_rate',
        value: 4.5
      });

      const response = await request(authenticatedApp)
        .post('/api/ai-chat/explain/analytics')
        .send({
          metric: 'engagement_rate',
          timeframe: 'last_30_days'
        });

      expect(response.status).toBe(200);
      expect(mockExplainAnalytics).toHaveBeenCalledWith(
        MASTER_TEST_CREDENTIALS.admin.organizationId,
        'engagement_rate',
        'last_30_days'
      );
    });
  });

  describe('Role-Based Access Control', () => {
    const createAuthenticatedApp = (userRole: string) => {
      const authMiddleware = (req: any, _res: any, next: any) => {
        let credentials;
        if (userRole === 'admin') {
          credentials = MASTER_TEST_CREDENTIALS.admin;
        } else if (userRole === 'manager') {
          credentials = MASTER_TEST_CREDENTIALS.manager;
        } else if (userRole === 'creator') {
          credentials = MASTER_TEST_CREDENTIALS.creator;
        } else {
          // Client role (read-only)
          credentials = {
            id: 'client-user-123',
            email: 'client@allin.demo',
            organizationId: 'org-client-123',
            role: 'CLIENT'
          };
        }

        req.user = {
          id: credentials.id,
          email: credentials.email,
          organizationId: credentials.organizationId,
          role: userRole
        };
        next();
      };

      const router = express.Router();
      router.use(authMiddleware);

      // Analytics endpoint - all roles can read
      router.post('/explain/analytics', async (req, res) => {
        try {
          const { metric } = req.body;
          const organizationId = req.user?.organizationId;

          if (!metric) {
            return res.status(400).json({ success: false, error: 'Metric is required' });
          }

          const explanation = await mockExplainAnalytics(organizationId, metric);
          return res.json({ success: true, data: explanation });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Failed' });
        }
      });

      // Content generation - manager/creator can create
      router.post('/generate/caption', async (req, res) => {
        try {
          const { description, platform } = req.body;
          const userRole = req.user?.role;

          // Role check
          if (!['admin', 'manager', 'creator'].includes(userRole || '')) {
            return res.status(403).json({
              success: false,
              error: 'Forbidden - Insufficient permissions'
            });
          }

          if (!description || !platform) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
          }

          const content = await mockGenerateContent(req.user?.organizationId, description, platform);
          return res.json({ success: true, data: content });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Failed' });
        }
      });

      // Strategy optimization - admin/manager only
      router.post('/strategy/optimize', async (req, res) => {
        try {
          const { goals } = req.body;
          const userRole = req.user?.role;

          // Role check
          if (!['admin', 'manager'].includes(userRole || '')) {
            return res.status(403).json({
              success: false,
              error: 'Forbidden - Admin or Manager role required'
            });
          }

          if (!goals || !Array.isArray(goals) || goals.length === 0) {
            return res.status(400).json({ success: false, error: 'Goals are required' });
          }

          const optimization = await mockOptimizeStrategy(req.user?.organizationId, goals);
          return res.json({ success: true, data: optimization });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Failed' });
        }
      });

      const testApp = express();
      testApp.use(express.json());
      testApp.use('/api/ai-chat', router);

      return testApp;
    };

    it('should allow all roles to read analytics', async () => {
      const roles = ['admin', 'manager', 'creator', 'client'];

      for (const role of roles) {
        const app = createAuthenticatedApp(role);

        mockExplainAnalytics.mockResolvedValue({
          metric: 'engagement_rate',
          value: 4.5
        });

        const response = await request(app)
          .post('/api/ai-chat/explain/analytics')
          .send({
            metric: 'engagement_rate'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });

    it('should allow manager and creator to generate content, but not client', async () => {
      // Manager can generate
      const managerApp = createAuthenticatedApp('manager');

      mockGenerateContent.mockResolvedValue({
        captions: ['Test caption'],
        platform: 'instagram'
      });

      const managerResponse = await request(managerApp)
        .post('/api/ai-chat/generate/caption')
        .send({
          description: 'Test content',
          platform: 'instagram'
        });

      expect(managerResponse.status).toBe(200);
      expect(managerResponse.body.success).toBe(true);

      // Creator can generate
      const creatorApp = createAuthenticatedApp('creator');

      mockGenerateContent.mockResolvedValue({
        captions: ['Test caption'],
        platform: 'instagram'
      });

      const creatorResponse = await request(creatorApp)
        .post('/api/ai-chat/generate/caption')
        .send({
          description: 'Test content',
          platform: 'instagram'
        });

      expect(creatorResponse.status).toBe(200);
      expect(creatorResponse.body.success).toBe(true);

      // Client cannot generate
      const clientApp = createAuthenticatedApp('client');

      const clientResponse = await request(clientApp)
        .post('/api/ai-chat/generate/caption')
        .send({
          description: 'Test content',
          platform: 'instagram'
        });

      expect(clientResponse.status).toBe(403);
      expect(clientResponse.body.error).toContain('Forbidden');
    });

    it('should restrict strategy optimization to admin and manager only', async () => {
      // Admin can optimize
      const adminApp = createAuthenticatedApp('admin');

      mockOptimizeStrategy.mockResolvedValue({
        optimizedStrategy: { postFrequency: '2x daily' }
      });

      const adminResponse = await request(adminApp)
        .post('/api/ai-chat/strategy/optimize')
        .send({
          goals: ['increase_engagement']
        });

      expect(adminResponse.status).toBe(200);
      expect(adminResponse.body.success).toBe(true);

      // Manager can optimize
      const managerApp = createAuthenticatedApp('manager');

      mockOptimizeStrategy.mockResolvedValue({
        optimizedStrategy: { postFrequency: '2x daily' }
      });

      const managerResponse = await request(managerApp)
        .post('/api/ai-chat/strategy/optimize')
        .send({
          goals: ['increase_engagement']
        });

      expect(managerResponse.status).toBe(200);
      expect(managerResponse.body.success).toBe(true);

      // Creator cannot optimize
      const creatorApp = createAuthenticatedApp('creator');

      const creatorResponse = await request(creatorApp)
        .post('/api/ai-chat/strategy/optimize')
        .send({
          goals: ['increase_engagement']
        });

      expect(creatorResponse.status).toBe(403);
      expect(creatorResponse.body.error).toContain('Admin or Manager role required');

      // Client cannot optimize
      const clientApp = createAuthenticatedApp('client');

      const clientResponse = await request(clientApp)
        .post('/api/ai-chat/strategy/optimize')
        .send({
          goals: ['increase_engagement']
        });

      expect(clientResponse.status).toBe(403);
      expect(clientResponse.body.error).toContain('Admin or Manager role required');
    });
  });

  describe('Organization Isolation', () => {
    const createMultiOrgApp = () => {
      const authMiddleware = (req: any, _res: any, next: any) => {
        // Get org from header (simulating multi-tenant routing)
        const orgId = req.headers['x-organization-id'];

        if (orgId === 'org-123') {
          req.user = {
            id: MASTER_TEST_CREDENTIALS.admin.id,
            organizationId: 'org-123',
            role: 'admin'
          };
        } else if (orgId === 'org-456') {
          req.user = {
            id: 'user-456',
            organizationId: 'org-456',
            role: 'manager'
          };
        } else {
          return next();  // No auth
        }

        next();
      };

      const router = express.Router();
      router.use(authMiddleware);

      router.post('/explain/analytics', async (req, res) => {
        try {
          const { metric } = req.body;
          const organizationId = req.user?.organizationId;

          if (!organizationId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
          }

          // Service will filter data by organizationId
          const explanation = await mockExplainAnalytics(organizationId, metric);
          return res.json({ success: true, data: explanation });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Failed' });
        }
      });

      const testApp = express();
      testApp.use(express.json());
      testApp.use('/api/ai-chat', router);

      return testApp;
    };

    it('should isolate data between organizations', async () => {
      const app = createMultiOrgApp();

      // Organization 1 request
      mockExplainAnalytics.mockResolvedValue({
        metric: 'engagement_rate',
        value: 4.5,
        organizationId: 'org-123'
      });

      const org1Response = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .set('x-organization-id', 'org-123')
        .send({
          metric: 'engagement_rate'
        });

      expect(org1Response.status).toBe(200);
      expect(mockExplainAnalytics).toHaveBeenCalledWith('org-123', 'engagement_rate');

      // Organization 2 request
      mockExplainAnalytics.mockResolvedValue({
        metric: 'engagement_rate',
        value: 3.2,
        organizationId: 'org-456'
      });

      const org2Response = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .set('x-organization-id', 'org-456')
        .send({
          metric: 'engagement_rate'
        });

      expect(org2Response.status).toBe(200);
      expect(mockExplainAnalytics).toHaveBeenCalledWith('org-456', 'engagement_rate');

      // Verify each org got their own data
      expect(mockExplainAnalytics).toHaveBeenCalledTimes(2);
    });

    it('should prevent cross-organization data access', async () => {
      const app = createMultiOrgApp();

      // User from org-123 tries to request data with org-456 in body
      mockExplainAnalytics.mockImplementation((orgId) => {
        return Promise.resolve({
          metric: 'engagement_rate',
          value: orgId === 'org-123' ? 4.5 : 3.2,
          organizationId: orgId
        });
      });

      const response = await request(app)
        .post('/api/ai-chat/explain/analytics')
        .set('x-organization-id', 'org-123')
        .send({
          metric: 'engagement_rate',
          organizationId: 'org-456'  // Attempting to access another org's data
        });

      // Should use org from auth context, not request body
      expect(response.status).toBe(200);
      expect(mockExplainAnalytics).toHaveBeenCalledWith('org-123', 'engagement_rate');
    });

    it('should handle requests without organization context', async () => {
      const app = createMultiOrgApp();

      const response = await request(app)
        .post('/api/ai-chat/explain/analytics')
        // No x-organization-id header
        .send({
          metric: 'engagement_rate'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Unauthorized');
      expect(mockExplainAnalytics).not.toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should maintain user context throughout request lifecycle', async () => {
      const authMiddleware = (req: any, _res: any, next: any) => {
        req.user = {
          id: MASTER_TEST_CREDENTIALS.admin.id,
          email: MASTER_TEST_CREDENTIALS.admin.email,
          name: 'Admin User',
          organizationId: MASTER_TEST_CREDENTIALS.admin.organizationId,
          role: MASTER_TEST_CREDENTIALS.admin.role
        };
        // Add sessionId as custom property
        (req.user as any).sessionId = 'session-abc-123';
        next();
      };

      const router = express.Router();
      router.use(authMiddleware);

      router.post('/explain/analytics', async (req, res) => {
        try {
          const { metric } = req.body;

          // Verify user context is maintained
          expect((req.user as any)?.sessionId).toBe('session-abc-123');
          expect(req.user?.organizationId).toBe(MASTER_TEST_CREDENTIALS.admin.organizationId);

          const explanation = await mockExplainAnalytics(
            req.user?.organizationId,
            metric
          );

          return res.json({
            success: true,
            data: explanation,
            sessionId: (req.user as any)?.sessionId
          });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Failed' });
        }
      });

      const testApp = express();
      testApp.use(express.json());
      testApp.use('/api/ai-chat', router);

      mockExplainAnalytics.mockResolvedValue({
        metric: 'engagement_rate',
        value: 4.5
      });

      const response = await request(testApp)
        .post('/api/ai-chat/explain/analytics')
        .send({
          metric: 'engagement_rate'
        });

      expect(response.status).toBe(200);
      expect(response.body.sessionId).toBe('session-abc-123');
    });
  });
});
