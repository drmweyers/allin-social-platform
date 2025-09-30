import { prisma } from './database';
import { PostStatus, MemberRole } from '@prisma/client';
import { getRedis } from './redis';
import { EventEmitter } from 'events';

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
  SCHEDULED = 'SCHEDULED'
}

export enum ApprovalAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REQUEST_CHANGES = 'REQUEST_CHANGES',
  COMMENT = 'COMMENT'
}

interface WorkflowStep {
  id: string;
  name: string;
  order: number;
  requiredRole: MemberRole;
  requiredApprovals: number;
  currentApprovals: number;
  approvers: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

interface WorkflowConfig {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  autoPublish: boolean;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
}

interface ApprovalRequest {
  postId: string;
  userId: string;
  action: ApprovalAction;
  comment?: string;
  changes?: any;
}

interface WorkflowActivity {
  id: string;
  workflowId: string;
  postId: string;
  userId: string;
  action: string;
  comment?: string;
  metadata?: any;
  timestamp: Date;
}

export class WorkflowService extends EventEmitter {
  private workflowConfigs: Map<string, WorkflowConfig> = new Map();

  constructor() {
    super();
    this.loadWorkflowConfigs();
  }

  private async loadWorkflowConfigs() {
    // Load workflow configurations from database
    // In production, these would be stored in the database
    const defaultConfig: WorkflowConfig = {
      id: 'default',
      organizationId: 'default',
      name: 'Standard Approval Workflow',
      description: 'Default two-step approval process',
      steps: [
        {
          id: 'step1',
          name: 'Content Review',
          order: 1,
          requiredRole: MemberRole.MEMBER,
          requiredApprovals: 1,
          currentApprovals: 0,
          approvers: [],
          status: 'pending'
        },
        {
          id: 'step2',
          name: 'Manager Approval',
          order: 2,
          requiredRole: MemberRole.ADMIN,
          requiredApprovals: 1,
          currentApprovals: 0,
          approvers: [],
          status: 'pending'
        }
      ],
      autoPublish: true,
      notifyOnApproval: true,
      notifyOnRejection: true
    };

    this.workflowConfigs.set('default', defaultConfig);
  }

  // Create a new workflow instance for a post
  async createWorkflow(postId: string, organizationId: string, workflowType: string = 'default') {
    const config = this.workflowConfigs.get(workflowType) || this.workflowConfigs.get('default')!;

    const workflow = {
      id: `workflow_${Date.now()}`,
      postId,
      organizationId,
      config: JSON.parse(JSON.stringify(config)), // Deep clone
      status: WorkflowStatus.PENDING_REVIEW,
      currentStep: 0,
      createdAt: new Date(),
      activities: []
    };

    // Store in Redis for fast access
    await redisClient.setex(
      `workflow:${postId}`,
      86400, // 24 hours
      JSON.stringify(workflow)
    );

    // Also store in database
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.DRAFT,
        metadata: {
          workflowId: workflow.id,
          workflowStatus: WorkflowStatus.PENDING_REVIEW
        }
      }
    });

    // Log activity
    await this.logActivity({
      id: `activity_${Date.now()}`,
      workflowId: workflow.id,
      postId,
      userId: 'system',
      action: 'WORKFLOW_CREATED',
      timestamp: new Date()
    });

    // Emit event
    this.emit('workflowCreated', { postId, workflowId: workflow.id });

    return workflow;
  }

  // Process an approval action
  async processApproval(request: ApprovalRequest) {
    const { postId, userId, action, comment, changes } = request;

    // Get workflow from cache
    const workflowData = await redisClient.get(`workflow:${postId}`);
    if (!workflowData) {
      throw new Error('Workflow not found');
    }

    const workflow = JSON.parse(workflowData);
    const currentStep = workflow.config.steps[workflow.currentStep];

    // Verify user has permission for this step
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizations: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has required role
    const userRole = user.organizations[0]?.role;
    if (!this.hasRequiredRole(userRole, currentStep.requiredRole)) {
      throw new Error('Insufficient permissions for this approval step');
    }

    // Process the action
    switch (action) {
      case ApprovalAction.APPROVE:
        await this.handleApproval(workflow, currentStep, userId, comment);
        break;
      case ApprovalAction.REJECT:
        await this.handleRejection(workflow, userId, comment);
        break;
      case ApprovalAction.REQUEST_CHANGES:
        await this.handleChangeRequest(workflow, userId, comment, changes);
        break;
      case ApprovalAction.COMMENT:
        await this.handleComment(workflow, userId, comment!);
        break;
    }

    // Log activity
    await this.logActivity({
      id: `activity_${Date.now()}`,
      workflowId: workflow.id,
      postId,
      userId,
      action: action.toString(),
      comment,
      metadata: changes,
      timestamp: new Date()
    });

    // Update workflow in cache
    await redisClient.setex(
      `workflow:${postId}`,
      86400,
      JSON.stringify(workflow)
    );

    // Emit event
    this.emit('approvalProcessed', { postId, action, userId });

    return workflow;
  }

  private async handleApproval(workflow: any, currentStep: WorkflowStep, userId: string, comment?: string) {
    // Add user to approvers if not already there
    if (!currentStep.approvers.includes(userId)) {
      currentStep.approvers.push(userId);
      currentStep.currentApprovals++;
    }

    // Check if step is complete
    if (currentStep.currentApprovals >= currentStep.requiredApprovals) {
      currentStep.status = 'completed';

      // Move to next step or complete workflow
      if (workflow.currentStep < workflow.config.steps.length - 1) {
        workflow.currentStep++;
        workflow.config.steps[workflow.currentStep].status = 'in_progress';
        workflow.status = WorkflowStatus.IN_REVIEW;

        // Notify next approvers
        this.emit('stepCompleted', {
          workflowId: workflow.id,
          completedStep: currentStep.name,
          nextStep: workflow.config.steps[workflow.currentStep].name
        });
      } else {
        // All steps completed
        workflow.status = WorkflowStatus.APPROVED;

        // Auto-publish if configured
        if (workflow.config.autoPublish) {
          await this.publishPost(workflow.postId);
          workflow.status = WorkflowStatus.PUBLISHED;
        }

        this.emit('workflowCompleted', {
          workflowId: workflow.id,
          postId: workflow.postId,
          status: workflow.status
        });
      }
    }
  }

  private async handleRejection(workflow: any, userId: string, comment?: string) {
    workflow.status = WorkflowStatus.REJECTED;
    const currentStep = workflow.config.steps[workflow.currentStep];
    currentStep.status = 'completed';

    // Update post status
    await prisma.post.update({
      where: { id: workflow.postId },
      data: {
        status: PostStatus.DRAFT,
        metadata: {
          workflowStatus: WorkflowStatus.REJECTED,
          rejectedBy: userId,
          rejectionReason: comment
        }
      }
    });

    this.emit('workflowRejected', {
      workflowId: workflow.id,
      postId: workflow.postId,
      rejectedBy: userId,
      reason: comment
    });
  }

  private async handleChangeRequest(workflow: any, userId: string, comment?: string, changes?: any) {
    workflow.status = WorkflowStatus.PENDING_REVIEW;

    // Reset current step
    const currentStep = workflow.config.steps[workflow.currentStep];
    currentStep.status = 'pending';
    currentStep.currentApprovals = 0;
    currentStep.approvers = [];

    // Store requested changes
    workflow.requestedChanges = {
      userId,
      comment,
      changes,
      timestamp: new Date()
    };

    this.emit('changesRequested', {
      workflowId: workflow.id,
      postId: workflow.postId,
      requestedBy: userId,
      changes
    });
  }

  private async handleComment(workflow: any, userId: string, comment: string) {
    // Just add comment to activities, no status change
    this.emit('commentAdded', {
      workflowId: workflow.id,
      postId: workflow.postId,
      userId,
      comment
    });
  }

  private hasRequiredRole(userRole: MemberRole | undefined, requiredRole: MemberRole): boolean {
    if (!userRole) return false;

    const roleHierarchy = {
      [MemberRole.OWNER]: 4,
      [MemberRole.ADMIN]: 3,
      [MemberRole.MEMBER]: 2,
      [MemberRole.VIEWER]: 1
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  private async publishPost(postId: string) {
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.PUBLISHED,
        publishedAt: new Date()
      }
    });
  }

  // Get workflow status for a post
  async getWorkflowStatus(postId: string) {
    const workflowData = await redisClient.get(`workflow:${postId}`);
    if (!workflowData) {
      return null;
    }

    return JSON.parse(workflowData);
  }

  // Get workflow activities/history
  async getWorkflowActivities(workflowId: string): Promise<WorkflowActivity[]> {
    // In production, these would be stored in database
    const activities = await redisClient.get(`workflow:activities:${workflowId}`);
    return activities ? JSON.parse(activities) : [];
  }

  private async logActivity(activity: WorkflowActivity) {
    const activities = await this.getWorkflowActivities(activity.workflowId);
    activities.push(activity);

    await redisClient.setex(
      `workflow:activities:${activity.workflowId}`,
      86400,
      JSON.stringify(activities)
    );
  }

  // Create custom workflow configuration
  async createWorkflowConfig(config: Partial<WorkflowConfig>) {
    const newConfig: WorkflowConfig = {
      id: config.id || `config_${Date.now()}`,
      organizationId: config.organizationId!,
      name: config.name || 'Custom Workflow',
      description: config.description,
      steps: config.steps || [],
      autoPublish: config.autoPublish ?? false,
      notifyOnApproval: config.notifyOnApproval ?? true,
      notifyOnRejection: config.notifyOnRejection ?? true
    };

    this.workflowConfigs.set(newConfig.id, newConfig);

    // Store in database (in production)
    // await prisma.workflowConfig.create({ data: newConfig });

    return newConfig;
  }

  // Get pending approvals for a user
  async getPendingApprovals(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizations: true
      }
    });

    if (!user) return [];

    const userRole = user.organizations[0]?.role;
    const organizationId = user.organizations[0]?.organizationId;

    // Get all posts in workflow for this organization
    const posts = await prisma.post.findMany({
      where: {
        organizationId,
        status: PostStatus.DRAFT,
        metadata: {
          path: ['workflowStatus'],
          not: WorkflowStatus.PUBLISHED
        }
      }
    });

    const pendingApprovals = [];

    for (const post of posts) {
      const workflow = await this.getWorkflowStatus(post.id);
      if (workflow && workflow.status === WorkflowStatus.IN_REVIEW) {
        const currentStep = workflow.config.steps[workflow.currentStep];

        // Check if user can approve this step
        if (this.hasRequiredRole(userRole, currentStep.requiredRole) &&
            !currentStep.approvers.includes(userId)) {
          pendingApprovals.push({
            postId: post.id,
            postContent: post.content,
            workflowId: workflow.id,
            step: currentStep.name,
            requiredRole: currentStep.requiredRole,
            currentApprovals: currentStep.currentApprovals,
            requiredApprovals: currentStep.requiredApprovals
          });
        }
      }
    }

    return pendingApprovals;
  }
}

export const workflowService = new WorkflowService();