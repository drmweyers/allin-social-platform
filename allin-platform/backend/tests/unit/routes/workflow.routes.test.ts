import request from 'supertest';
import express from 'express';

// Mock the workflow service BEFORE importing routes
jest.mock('../../../src/services/workflow.service', () => ({
  workflowService: {
    createWorkflow: jest.fn(),
    processApproval: jest.fn(),
    getWorkflowStatus: jest.fn(),
    getPendingApprovals: jest.fn(),
    getWorkflowActivities: jest.fn(),
    createWorkflowConfig: jest.fn()
  }
}));

import workflowRoutes from '../../../src/routes/workflow.routes';

// Get the mocked service with proper typing
const mockWorkflowService = jest.requireMock('../../../src/services/workflow.service').workflowService as jest.Mocked<{
  createWorkflow: jest.Mock;
  processApproval: jest.Mock;
  getWorkflowStatus: jest.Mock;
  getPendingApprovals: jest.Mock;
  getWorkflowActivities: jest.Mock;
  createWorkflowConfig: jest.Mock;
}>;

// Mock authentication middleware
jest.mock('../../../src/middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123'
    };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api', workflowRoutes);

describe('Workflow Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/workflows', () => {
    const validWorkflowData = {
      postId: 'post-123',
      workflowType: 'approval'
    };

    it('should create a workflow successfully', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        postId: 'post-123',
        organizationId: 'org-123',
        workflowType: 'approval',
        status: 'pending',
        createdAt: '2024-01-20T10:00:00Z'
      };

      mockWorkflowService.createWorkflow.mockResolvedValue(mockWorkflow);

      const response = await request(app)
        .post('/api/workflows')
        .send(validWorkflowData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.workflow).toEqual(mockWorkflow);
      expect(mockWorkflowService.createWorkflow).toHaveBeenCalledWith(
        'post-123',
        'org-123',
        'approval'
      );
    });

    it('should create workflow with default organization when not provided', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        postId: 'post-123',
        organizationId: 'default',
        status: 'pending'
      };

      mockWorkflowService.createWorkflow.mockResolvedValue(mockWorkflow);

      const response = await request(app)
        .post('/api/workflows')
        .send({ postId: 'post-123' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(mockWorkflowService.createWorkflow).toHaveBeenCalledWith(
        'post-123',
        'org-123',
        undefined
      );
    });

    it('should return 400 when postId is missing', async () => {
      const response = await request(app)
        .post('/api/workflows')
        .send({ workflowType: 'approval' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('Post ID is required');
    });

    it('should return 500 when service throws error', async () => {
      mockWorkflowService.createWorkflow.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/api/workflows')
        .send(validWorkflowData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to create workflow');
    });
  });

  describe('POST /api/workflows/:postId/approve', () => {
    const validApprovalData = {
      action: 'APPROVE',
      comment: 'Looks good!'
    };

    it('should process APPROVE action successfully', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        postId: 'post-123',
        status: 'approved',
        approvedBy: 'user-123',
        approvedAt: '2024-01-20T10:00:00Z'
      };

      mockWorkflowService.processApproval.mockResolvedValue(mockWorkflow);

      const response = await request(app)
        .post('/api/workflows/post-123/approve')
        .send(validApprovalData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.workflow).toEqual(mockWorkflow);
      expect(response.body.message).toContain('APPROVE');
      expect(mockWorkflowService.processApproval).toHaveBeenCalledWith({
        postId: 'post-123',
        userId: 'user-123',
        action: 'APPROVE',
        comment: 'Looks good!',
        changes: undefined
      });
    });

    it('should process REJECT action successfully', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        postId: 'post-123',
        status: 'rejected'
      };

      mockWorkflowService.processApproval.mockResolvedValue(mockWorkflow);

      const response = await request(app)
        .post('/api/workflows/post-123/approve')
        .send({
          action: 'REJECT',
          comment: 'Needs revision'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('REJECT');
    });

    it('should process REQUEST_CHANGES action with changes data', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        postId: 'post-123',
        status: 'changes_requested'
      };

      mockWorkflowService.processApproval.mockResolvedValue(mockWorkflow);

      const response = await request(app)
        .post('/api/workflows/post-123/approve')
        .send({
          action: 'REQUEST_CHANGES',
          comment: 'Please update caption',
          changes: { caption: 'New caption suggestion' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockWorkflowService.processApproval).toHaveBeenCalledWith({
        postId: 'post-123',
        userId: 'user-123',
        action: 'REQUEST_CHANGES',
        comment: 'Please update caption',
        changes: { caption: 'New caption suggestion' }
      });
    });

    it('should process COMMENT action successfully', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        postId: 'post-123',
        status: 'pending'
      };

      mockWorkflowService.processApproval.mockResolvedValue(mockWorkflow);

      const response = await request(app)
        .post('/api/workflows/post-123/approve')
        .send({
          action: 'COMMENT',
          comment: 'Just a general comment'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid action', async () => {
      const response = await request(app)
        .post('/api/workflows/post-123/approve')
        .send({
          action: 'INVALID_ACTION',
          comment: 'Test'
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 when action is missing', async () => {
      const response = await request(app)
        .post('/api/workflows/post-123/approve')
        .send({ comment: 'Test' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 500 when service throws error', async () => {
      mockWorkflowService.processApproval.mockRejectedValue(
        new Error('Workflow not found')
      );

      const response = await request(app)
        .post('/api/workflows/post-123/approve')
        .send(validApprovalData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Workflow not found');
    });
  });

  describe('GET /api/workflows/:postId', () => {
    it('should get workflow status successfully', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        postId: 'post-123',
        status: 'pending',
        currentStep: 1,
        totalSteps: 3,
        createdAt: '2024-01-20T10:00:00Z',
        approvers: [
          { userId: 'user-1', status: 'approved' },
          { userId: 'user-2', status: 'pending' }
        ]
      };

      mockWorkflowService.getWorkflowStatus.mockResolvedValue(mockWorkflow);

      const response = await request(app)
        .get('/api/workflows/post-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.workflow).toEqual(mockWorkflow);
      expect(mockWorkflowService.getWorkflowStatus).toHaveBeenCalledWith('post-123');
    });

    it('should return 404 when workflow not found', async () => {
      mockWorkflowService.getWorkflowStatus.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/workflows/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Workflow not found');
    });

    it('should return 500 when service throws error', async () => {
      mockWorkflowService.getWorkflowStatus.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/workflows/post-123')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to get workflow status');
    });
  });

  describe('GET /api/workflows/pending/approvals', () => {
    it('should get pending approvals successfully', async () => {
      const mockApprovals = [
        {
          id: 'workflow-1',
          postId: 'post-1',
          postTitle: 'Marketing Campaign',
          requestedBy: 'user-1',
          requestedAt: '2024-01-20T10:00:00Z',
          priority: 'high'
        },
        {
          id: 'workflow-2',
          postId: 'post-2',
          postTitle: 'Product Launch',
          requestedBy: 'user-2',
          requestedAt: '2024-01-20T09:00:00Z',
          priority: 'medium'
        }
      ];

      mockWorkflowService.getPendingApprovals.mockResolvedValue(mockApprovals);

      const response = await request(app)
        .get('/api/workflows/pending/approvals')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.approvals).toEqual(mockApprovals);
      expect(response.body.count).toBe(2);
      expect(mockWorkflowService.getPendingApprovals).toHaveBeenCalledWith('user-123');
    });

    it('should return empty array when no pending approvals', async () => {
      mockWorkflowService.getPendingApprovals.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/workflows/pending/approvals')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.approvals).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('should return 500 when service throws error', async () => {
      mockWorkflowService.getPendingApprovals.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/workflows/pending/approvals')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to get pending approvals');
    });
  });

  describe('GET /api/workflows/:workflowId/activities', () => {
    it('should get workflow activities successfully', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          workflowId: 'workflow-123',
          action: 'CREATED',
          userId: 'user-1',
          userName: 'John Doe',
          timestamp: '2024-01-20T10:00:00Z',
          details: 'Workflow created'
        },
        {
          id: 'activity-2',
          workflowId: 'workflow-123',
          action: 'COMMENT',
          userId: 'user-2',
          userName: 'Jane Smith',
          timestamp: '2024-01-20T10:30:00Z',
          comment: 'Looks good to me',
          details: 'Comment added'
        },
        {
          id: 'activity-3',
          workflowId: 'workflow-123',
          action: 'APPROVED',
          userId: 'user-2',
          userName: 'Jane Smith',
          timestamp: '2024-01-20T11:00:00Z',
          details: 'Workflow approved'
        }
      ];

      mockWorkflowService.getWorkflowActivities.mockResolvedValue(mockActivities);

      const response = await request(app)
        .get('/api/workflows/workflow-123/activities')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.activities).toEqual(mockActivities);
      expect(response.body.activities).toHaveLength(3);
      expect(mockWorkflowService.getWorkflowActivities).toHaveBeenCalledWith('workflow-123');
    });

    it('should return empty array when no activities', async () => {
      mockWorkflowService.getWorkflowActivities.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/workflows/workflow-123/activities')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.activities).toEqual([]);
    });

    it('should return 500 when service throws error', async () => {
      mockWorkflowService.getWorkflowActivities.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/workflows/workflow-123/activities')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to get workflow activities');
    });
  });

  describe('POST /api/workflows/config', () => {
    const validConfigData = {
      name: 'Marketing Approval',
      organizationId: 'org-123',
      steps: [
        { order: 1, approverRole: 'manager', required: true },
        { order: 2, approverRole: 'director', required: true }
      ],
      autoPublish: false,
      notifyOnApproval: true,
      notifyOnRejection: true
    };

    it('should create workflow config successfully', async () => {
      const mockConfig = {
        id: 'config-123',
        ...validConfigData,
        createdAt: '2024-01-20T10:00:00Z'
      };

      mockWorkflowService.createWorkflowConfig.mockResolvedValue(mockConfig);

      const response = await request(app)
        .post('/api/workflows/config')
        .send(validConfigData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.config).toEqual(mockConfig);
      expect(mockWorkflowService.createWorkflowConfig).toHaveBeenCalledWith(validConfigData);
    });

    it('should create config with optional fields', async () => {
      const minimalConfig = {
        name: 'Simple Approval',
        organizationId: 'org-123',
        steps: [{ order: 1, approverRole: 'manager', required: true }]
      };

      const mockConfig = {
        id: 'config-123',
        ...minimalConfig,
        autoPublish: false,
        notifyOnApproval: false,
        notifyOnRejection: false
      };

      mockWorkflowService.createWorkflowConfig.mockResolvedValue(mockConfig);

      const response = await request(app)
        .post('/api/workflows/config')
        .send(minimalConfig)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.config).toEqual(mockConfig);
    });

    it('should return 400 when name is missing', async () => {
      const invalidConfig = {
        organizationId: 'org-123',
        steps: [{ order: 1, approverRole: 'manager' }]
      };

      const response = await request(app)
        .post('/api/workflows/config')
        .send(invalidConfig)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('Workflow name is required');
    });

    it('should return 400 when organizationId is missing', async () => {
      const invalidConfig = {
        name: 'Test Workflow',
        steps: [{ order: 1, approverRole: 'manager' }]
      };

      const response = await request(app)
        .post('/api/workflows/config')
        .send(invalidConfig)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 when steps is not an array', async () => {
      const invalidConfig = {
        name: 'Test Workflow',
        organizationId: 'org-123',
        steps: 'not-an-array'
      };

      const response = await request(app)
        .post('/api/workflows/config')
        .send(invalidConfig)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('Steps must be an array');
    });

    it('should return 500 when service throws error', async () => {
      mockWorkflowService.createWorkflowConfig.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/api/workflows/config')
        .send(validConfigData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to create workflow configuration');
    });
  });
});
