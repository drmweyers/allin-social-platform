import express from 'express';
import { requireAuth } from '../middleware/auth';
import { validateZodRequest } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const inviteMemberSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'editor', 'viewer']),
  message: z.string().optional()
});

const updateMemberSchema = z.object({
  role: z.enum(['admin', 'editor', 'viewer']).optional(),
  status: z.enum(['active', 'pending', 'suspended']).optional(),
  permissions: z.array(z.string()).optional()
});

// Permission definitions
const permissions = [
  // Content permissions
  { id: 'create_posts', name: 'Create Posts', description: 'Create and draft social media posts', category: 'content' },
  { id: 'edit_posts', name: 'Edit Posts', description: 'Edit existing posts and drafts', category: 'content' },
  { id: 'publish_posts', name: 'Publish Posts', description: 'Publish posts to social media platforms', category: 'content' },
  { id: 'delete_posts', name: 'Delete Posts', description: 'Delete posts and drafts', category: 'content' },
  { id: 'schedule_posts', name: 'Schedule Posts', description: 'Schedule posts for future publishing', category: 'content' },
  { id: 'manage_media', name: 'Manage Media Library', description: 'Upload, organize, and delete media files', category: 'content' },

  // Analytics permissions
  { id: 'view_analytics', name: 'View Analytics', description: 'Access analytics and reporting', category: 'analytics' },
  { id: 'export_reports', name: 'Export Reports', description: 'Export analytics data and reports', category: 'analytics' },
  { id: 'manage_competitors', name: 'Manage Competitors', description: 'Add and analyze competitor data', category: 'analytics' },

  // Team permissions
  { id: 'view_team', name: 'View Team', description: 'View team member list and profiles', category: 'team' },
  { id: 'invite_members', name: 'Invite Members', description: 'Send invitations to new team members', category: 'team' },
  { id: 'edit_members', name: 'Edit Members', description: 'Edit team member roles and permissions', category: 'team' },
  { id: 'remove_members', name: 'Remove Members', description: 'Remove team members from the organization', category: 'team' },

  // Settings permissions
  { id: 'manage_accounts', name: 'Manage Social Accounts', description: 'Connect and manage social media accounts', category: 'settings' },
  { id: 'manage_integrations', name: 'Manage Integrations', description: 'Configure third-party integrations', category: 'settings' },
  { id: 'manage_billing', name: 'Manage Billing', description: 'Access billing information and manage subscriptions', category: 'billing' },
  { id: 'manage_organization', name: 'Manage Organization', description: 'Edit organization settings and preferences', category: 'settings' }
];

// Role definitions
const roles = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access to all features and settings',
    permissions: permissions.map(p => p.id) // All permissions
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Can create, edit, and publish content',
    permissions: permissions.filter(p =>
      p.category === 'content' ||
      p.id === 'view_analytics' ||
      p.id === 'view_team'
    ).map(p => p.id)
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to content and analytics',
    permissions: permissions.filter(p =>
      p.id === 'view_analytics' ||
      p.id === 'view_team'
    ).map(p => p.id)
  }
];

// Mock team members data - using official test accounts
const mockTeamMembers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@allin.demo',
    avatar: '/api/placeholder/32/32',
    role: 'admin',
    status: 'active',
    joinedAt: '2024-01-01T00:00:00Z',
    lastActive: '2024-01-20T14:30:00Z',
    permissions: roles.find(r => r.id === 'admin')?.permissions || [],
    department: 'Administration',
    phone: '+1 (555) 100-0001',
    location: 'New York, NY',
    timezone: 'America/New_York',
    invitedBy: 'System',
    activatedAt: '2024-01-01T00:00:00Z',
    organizationId: 'org-123'
  },
  {
    id: '2',
    name: 'Agency Owner',
    email: 'agency@allin.demo',
    avatar: '/api/placeholder/32/32',
    role: 'editor',
    status: 'active',
    joinedAt: '2024-01-02T10:00:00Z',
    lastActive: '2024-01-20T13:15:00Z',
    permissions: roles.find(r => r.id === 'editor')?.permissions || [],
    department: 'Agency Management',
    phone: '+1 (555) 200-0002',
    location: 'Los Angeles, CA',
    timezone: 'America/Los_Angeles',
    invitedBy: 'admin@allin.demo',
    activatedAt: '2024-01-02T10:30:00Z',
    organizationId: 'org-123'
  },
  {
    id: '3',
    name: 'Manager User',
    email: 'manager@allin.demo',
    avatar: '/api/placeholder/32/32',
    role: 'editor',
    status: 'active',
    joinedAt: '2024-01-03T09:30:00Z',
    lastActive: '2024-01-20T11:45:00Z',
    permissions: roles.find(r => r.id === 'editor')?.permissions || [],
    department: 'Content Management',
    phone: '+1 (555) 300-0003',
    location: 'Chicago, IL',
    invitedBy: 'agency@allin.demo',
    activatedAt: '2024-01-03T10:00:00Z',
    organizationId: 'org-123'
  },
  {
    id: '4',
    name: 'Content Creator',
    email: 'creator@allin.demo',
    avatar: '/api/placeholder/32/32',
    role: 'editor',
    status: 'active',
    joinedAt: '2024-01-04T14:20:00Z',
    lastActive: '2024-01-20T09:30:00Z',
    permissions: roles.find(r => r.id === 'editor')?.permissions || [],
    department: 'Content Creation',
    phone: '+1 (555) 400-0004',
    location: 'Austin, TX',
    invitedBy: 'manager@allin.demo',
    activatedAt: '2024-01-04T14:45:00Z',
    organizationId: 'org-123'
  },
  {
    id: '5',
    name: 'Client User',
    email: 'client@allin.demo',
    avatar: '/api/placeholder/32/32',
    role: 'viewer',
    status: 'active',
    joinedAt: '2024-01-05T11:00:00Z',
    lastActive: '2024-01-19T16:00:00Z',
    permissions: roles.find(r => r.id === 'viewer')?.permissions || [],
    department: 'Client Services',
    phone: '+1 (555) 500-0005',
    location: 'Miami, FL',
    invitedBy: 'agency@allin.demo',
    activatedAt: '2024-01-05T11:30:00Z',
    organizationId: 'org-123'
  },
  {
    id: '6',
    name: 'Team Member',
    email: 'team@allin.demo',
    avatar: '/api/placeholder/32/32',
    role: 'viewer',
    status: 'active',
    joinedAt: '2024-01-06T16:00:00Z',
    lastActive: '2024-01-20T08:15:00Z',
    permissions: roles.find(r => r.id === 'viewer')?.permissions || [],
    department: 'Team Collaboration',
    phone: '+1 (555) 600-0006',
    location: 'Remote',
    timezone: 'UTC',
    invitedBy: 'manager@allin.demo',
    activatedAt: '2024-01-06T16:30:00Z',
    organizationId: 'org-123'
  },
  {
    id: 'pending-user-id',
    name: 'Pending User',
    email: 'pending@example.com',
    avatar: '/api/placeholder/32/32',
    role: 'editor',
    status: 'pending',
    joinedAt: '2024-01-07T10:00:00Z',
    lastActive: '',
    permissions: roles.find(r => r.id === 'editor')?.permissions || [],
    department: '',
    phone: '',
    location: '',
    timezone: '',
    invitedBy: 'admin@allin.demo',
    activatedAt: '',
    organizationId: 'org-123'
  },
  {
    id: '7',
    name: 'Test User 1',
    email: 'test1@example.com',
    avatar: '/api/placeholder/32/32',
    role: 'editor',
    status: 'active',
    joinedAt: '2024-01-08T10:00:00Z',
    lastActive: '2024-01-20T10:00:00Z',
    permissions: roles.find(r => r.id === 'editor')?.permissions || [],
    department: 'Testing',
    phone: '',
    location: '',
    timezone: 'UTC',
    invitedBy: 'admin@allin.demo',
    activatedAt: '2024-01-08T10:30:00Z',
    organizationId: 'org-123'
  },
  {
    id: '8',
    name: 'Test User 2',
    email: 'test2@example.com',
    avatar: '/api/placeholder/32/32',
    role: 'viewer',
    status: 'active',
    joinedAt: '2024-01-09T10:00:00Z',
    lastActive: '2024-01-20T09:00:00Z',
    permissions: roles.find(r => r.id === 'viewer')?.permissions || [],
    department: 'Testing',
    phone: '',
    location: '',
    timezone: 'UTC',
    invitedBy: 'admin@allin.demo',
    activatedAt: '2024-01-09T10:30:00Z',
    organizationId: 'org-123'
  }
];

/**
 * @route GET /api/team/members
 * @desc Get all team members
 * @access Private
 */
router.get('/members', requireAuth, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org1';
    const { role, status, search } = req.query;

    let filteredMembers = mockTeamMembers.filter(member => member.organizationId === organizationId);

    // Apply filters
    if (role) {
      filteredMembers = filteredMembers.filter(member => member.role === role);
    }

    if (status) {
      filteredMembers = filteredMembers.filter(member => member.status === status);
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredMembers = filteredMembers.filter(member =>
        member.name.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower) ||
        (member.department && member.department.toLowerCase().includes(searchLower))
      );
    }

    // Sort by join date (newest first)
    filteredMembers.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());

    res.json({
      success: true,
      data: filteredMembers
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team members'
    });
  }
});

/**
 * @route POST /api/team/invite
 * @desc Invite a new team member
 * @access Private
 */
router.post('/invite', requireAuth, validateZodRequest(inviteMemberSchema, 'body'), async (req, res) => {
  try {
    const { email, role, message } = req.body;
    const organizationId = req.user?.organizationId || 'org1';
    const invitedBy = req.user?.email || '';

    // Check if user already exists
    const existingMember = mockTeamMembers.find(member =>
      member.email === email && member.organizationId === organizationId
    );

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this organization'
      });
    }

    // Create new team member invitation
    const inviteId = Date.now().toString();
    const newMember = {
      id: inviteId,
      inviteId, // Add inviteId for backward compatibility
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      email,
      avatar: '/api/placeholder/32/32',
      role,
      status: 'pending' as const,
      joinedAt: new Date().toISOString(),
      lastActive: '',
      permissions: roles.find(r => r.id === role)?.permissions || [],
      department: '',
      phone: '',
      location: '',
      invitedBy,
      activatedAt: '',
      organizationId
    };

    mockTeamMembers.push(newMember);

    // In a real implementation, send invitation email here
    console.log(`Invitation sent to ${email} with role ${role}`);
    console.log(`Custom message: ${message || 'Welcome to our team!'}`);

    return res.json({
      success: true,
      data: newMember,
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    console.error('Error inviting team member:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send invitation'
    });
  }
});

/**
 * @route GET /api/team/members/:id
 * @desc Get a specific team member
 * @access Private
 */
router.get('/members/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'org1';

    const member = mockTeamMembers.find(m => m.id === id && m.organizationId === organizationId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    return res.json({
      success: true,
      data: member
    });
  } catch (error) {
    console.error('Error fetching team member:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch team member'
    });
  }
});

/**
 * @route PATCH /api/team/members/:id
 * @desc Update a team member
 * @access Private
 */
router.patch('/members/:id', requireAuth, validateZodRequest(updateMemberSchema, 'body'), async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'org1';
    const updates = req.body;

    const memberIndex = mockTeamMembers.findIndex(m => m.id === id && m.organizationId === organizationId);

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Update member properties
    if (updates.role) {
      mockTeamMembers[memberIndex].role = updates.role;
      // Update permissions based on new role
      const rolePermissions = roles.find(r => r.id === updates.role)?.permissions || [];
      mockTeamMembers[memberIndex].permissions = rolePermissions;
    }

    if (updates.status) {
      mockTeamMembers[memberIndex].status = updates.status;
      if (updates.status === 'active' && !mockTeamMembers[memberIndex].activatedAt) {
        mockTeamMembers[memberIndex].activatedAt = new Date().toISOString();
      }
    }

    if (updates.permissions) {
      mockTeamMembers[memberIndex].permissions = updates.permissions;
    }

    return res.json({
      success: true,
      data: mockTeamMembers[memberIndex],
      message: 'Team member updated successfully'
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update team member'
    });
  }
});

/**
 * @route DELETE /api/team/members/:id
 * @desc Remove a team member
 * @access Private
 */
router.delete('/members/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'org1';

    const memberIndex = mockTeamMembers.findIndex(m => m.id === id && m.organizationId === organizationId);

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Prevent removing the last admin (only check if the member being deleted is an admin)
    const member = mockTeamMembers[memberIndex];
    if (member.role === 'admin' && member.status === 'active') {
      const adminCount = mockTeamMembers.filter(m =>
        m.organizationId === organizationId &&
        m.role === 'admin' &&
        m.status === 'active'
      ).length;

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the last active administrator'
        });
      }
    }

    mockTeamMembers.splice(memberIndex, 1);

    return res.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove team member'
    });
  }
});

/**
 * @route GET /api/team/roles
 * @desc Get all available roles and permissions
 * @access Private
 */
router.get('/roles', requireAuth, async (_req, res) => {
  try {
    return res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch roles'
    });
  }
});

/**
 * @route GET /api/team/permissions
 * @desc Get all available permissions
 * @access Private
 */
router.get('/permissions', requireAuth, async (_req, res) => {
  try {
    return res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions'
    });
  }
});

/**
 * @route GET /api/team/stats
 * @desc Get team statistics
 * @access Private
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org1';
    const teamMembers = mockTeamMembers.filter(member => member.organizationId === organizationId);

    const recentMembers = teamMembers
      .filter(m => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(m.joinedAt) > weekAgo;
      })
      .map(m => ({
        userId: m.id,
        userName: m.name,
        action: 'joined',
        timestamp: m.joinedAt,
        entityType: 'team',
        entityId: m.id
      }));

    const stats = {
      totalMembers: teamMembers.length,
      activeMembers: teamMembers.filter(m => m.status === 'active').length,
      pendingInvites: teamMembers.filter(m => m.status === 'pending').length,
      byRole: {
        admin: teamMembers.filter(m => m.role === 'admin').length,
        editor: teamMembers.filter(m => m.role === 'editor').length,
        viewer: teamMembers.filter(m => m.role === 'viewer').length
      },
      byStatus: {
        active: teamMembers.filter(m => m.status === 'active').length,
        pending: teamMembers.filter(m => m.status === 'pending').length,
        suspended: teamMembers.filter(m => m.status === 'suspended').length
      },
      recentActivity: recentMembers
    };

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch team statistics'
    });
  }
});

/**
 * @route POST /api/team/members/:id/resend-invite
 * @desc Resend invitation to a pending member
 * @access Private
 */
router.post('/members/:id/resend-invite', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'org1';

    const member = mockTeamMembers.find(m => m.id === id && m.organizationId === organizationId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    if (member.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only resend invites to pending members'
      });
    }

    // In a real implementation, resend invitation email here
    console.log(`Invitation resent to ${member.email}`);

    return res.json({
      success: true,
      message: 'Invitation resent successfully'
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend invitation'
    });
  }
});

/**
 * @route POST /api/team/bulk-action
 * @desc Perform bulk actions on team members
 * @access Private
 */
router.post('/bulk-action', requireAuth, async (req, res) => {
  try {
    const { memberIds, action, data } = req.body;
    const organizationId = req.user?.organizationId || 'org1';

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Member IDs array is required'
      });
    }

    let updatedCount = 0;

    switch (action) {
      case 'updateRole':
      case 'update_role':
        if (!data || !data.role) {
          return res.status(400).json({
            success: false,
            message: 'Role is required for role update action'
          });
        }
        for (const memberId of memberIds) {
          const memberIndex = mockTeamMembers.findIndex(m =>
            m.id === memberId && m.organizationId === organizationId
          );
          if (memberIndex !== -1) {
            mockTeamMembers[memberIndex].role = data.role;
            const rolePermissions = roles.find(r => r.id === data.role)?.permissions || [];
            mockTeamMembers[memberIndex].permissions = rolePermissions;
            updatedCount++;
          }
        }
        break;

      case 'updateStatus':
      case 'update_status':
        if (!data || !data.status) {
          return res.status(400).json({
            success: false,
            message: 'Status is required for status update action'
          });
        }
        for (const memberId of memberIds) {
          const memberIndex = mockTeamMembers.findIndex(m =>
            m.id === memberId && m.organizationId === organizationId
          );
          if (memberIndex !== -1) {
            mockTeamMembers[memberIndex].status = data.status;
            if (data.status === 'active' && !mockTeamMembers[memberIndex].activatedAt) {
              mockTeamMembers[memberIndex].activatedAt = new Date().toISOString();
            }
            updatedCount++;
          }
        }
        break;

      case 'remove':
      case 'delete':
        // Check for admin removal safety - only block if we're actually removing admins
        const adminsToRemove = memberIds.filter(id => {
          const member = mockTeamMembers.find(m => m.id === id && m.organizationId === organizationId);
          return member && member.role === 'admin' && member.status === 'active';
        });

        const currentAdminCount = mockTeamMembers.filter(m =>
          m.organizationId === organizationId &&
          m.role === 'admin' &&
          m.status === 'active'
        ).length;

        // Only block if we're removing admins AND it would remove all of them
        if (adminsToRemove.length > 0 && adminsToRemove.length >= currentAdminCount) {
          return res.status(400).json({
            success: false,
            message: 'Cannot remove all administrators'
          });
        }

        for (const memberId of memberIds) {
          const memberIndex = mockTeamMembers.findIndex(m =>
            m.id === memberId && m.organizationId === organizationId
          );
          if (memberIndex !== -1) {
            mockTeamMembers.splice(memberIndex, 1);
            updatedCount++;
          }
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    return res.json({
      success: true,
      data: { updatedCount },
      message: `${action} action completed on ${updatedCount} members`
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to perform bulk action'
    });
  }
});

export default router;