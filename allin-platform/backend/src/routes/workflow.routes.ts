import { Router, Request, Response } from 'express';
import { workflowService } from '../services/workflow.service';
import { authenticateToken } from '../middleware/auth';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// Create workflow for a post
router.post(
  '/workflows',
  authenticateToken,
  [
    body('postId').notEmpty().withMessage('Post ID is required'),
    body('workflowType').optional().isString()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { postId, workflowType } = req.body;
      const organizationId = req.user?.organizationId || 'default';

      const workflow = await workflowService.createWorkflow(
        postId,
        organizationId,
        workflowType
      );

      return res.status(201).json({
        success: true,
        workflow
      });
    } catch (error) {
      console.error('Create workflow error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create workflow'
      });
    }
  }
);

// Process approval action
router.post(
  '/workflows/:postId/approve',
  authenticateToken,
  [
    param('postId').notEmpty(),
    body('action').isIn(['APPROVE', 'REJECT', 'REQUEST_CHANGES', 'COMMENT']),
    body('comment').optional().isString(),
    body('changes').optional()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { postId } = req.params;
      const { action, comment, changes } = req.body;
      const userId = req.user?.id!;

      const workflow = await workflowService.processApproval({
        postId,
        userId,
        action,
        comment,
        changes
      });

      return res.json({
        success: true,
        workflow,
        message: `Action ${action} processed successfully`
      });
    } catch (error) {
      console.error('Process approval error:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process approval'
      });
    }
  }
);

// Get workflow status for a post
router.get(
  '/workflows/:postId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const workflow = await workflowService.getWorkflowStatus(postId);

      if (!workflow) {
        return res.status(404).json({
          success: false,
          message: 'Workflow not found'
        });
      }

      return res.json({
        success: true,
        workflow
      });
    } catch (error) {
      console.error('Get workflow status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get workflow status'
      });
    }
  }
);

// Get pending approvals for current user
router.get(
  '/workflows/pending/approvals',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id!;
      const pendingApprovals = await workflowService.getPendingApprovals(userId);

      return res.json({
        success: true,
        approvals: pendingApprovals,
        count: pendingApprovals.length
      });
    } catch (error) {
      console.error('Get pending approvals error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get pending approvals'
      });
    }
  }
);

// Get workflow activities/history
router.get(
  '/workflows/:workflowId/activities',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { workflowId } = req.params;
      const activities = await workflowService.getWorkflowActivities(workflowId);

      return res.json({
        success: true,
        activities
      });
    } catch (error) {
      console.error('Get workflow activities error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get workflow activities'
      });
    }
  }
);

// Create custom workflow configuration
router.post(
  '/workflows/config',
  authenticateToken,
  [
    body('name').notEmpty().withMessage('Workflow name is required'),
    body('organizationId').notEmpty(),
    body('steps').isArray().withMessage('Steps must be an array'),
    body('autoPublish').optional().isBoolean(),
    body('notifyOnApproval').optional().isBoolean(),
    body('notifyOnRejection').optional().isBoolean()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const config = await workflowService.createWorkflowConfig(req.body);

      return res.status(201).json({
        success: true,
        config
      });
    } catch (error) {
      console.error('Create workflow config error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create workflow configuration'
      });
    }
  }
);

export default router;