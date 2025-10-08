import express from 'express';
import { requireAuth } from '../middleware/auth';
import { validateZodRequest } from '../middleware/validation';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';

const router = express.Router();

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional()
});

const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  currency: z.string().optional()
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const updateNotificationsSchema = z.object({
  emailNotifications: z.object({
    posts: z.boolean().optional(),
    mentions: z.boolean().optional(),
    teamActivity: z.boolean().optional(),
    billing: z.boolean().optional(),
    security: z.boolean().optional()
  }).optional(),
  pushNotifications: z.object({
    posts: z.boolean().optional(),
    mentions: z.boolean().optional(),
    teamActivity: z.boolean().optional()
  }).optional(),
  weeklyReports: z.boolean().optional(),
  monthlyReports: z.boolean().optional()
});

const connectSocialAccountSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok']),
  accessToken: z.string().min(1, 'Access token is required'),
  accountId: z.string().optional(),
  accountName: z.string().optional()
});

// Mock data for development
const mockUsers = [
  {
    id: 'user1',
    name: 'John Smith',
    email: 'john.smith@allin.demo',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    bio: 'Social media manager with 5+ years of experience in digital marketing and content strategy.',
    title: 'Marketing Manager',
    department: 'Marketing',
    avatar: '/api/placeholder/32/32',
    organizationId: 'org1'
  }
];

const mockOrganizations = [
  {
    id: 'org1',
    name: 'AllIn Social Media',
    description: 'A comprehensive social media management platform for businesses of all sizes.',
    website: 'https://allin.demo',
    industry: 'Technology',
    size: '51-200 employees',
    timezone: 'America/New_York',
    language: 'English',
    currency: 'USD',
    logo: '/api/placeholder/64/64'
  }
];

const mockNotificationSettings = [
  {
    userId: 'user1',
    emailNotifications: {
      posts: true,
      mentions: true,
      teamActivity: true,
      billing: true,
      security: true
    },
    pushNotifications: {
      posts: true,
      mentions: true,
      teamActivity: false
    },
    weeklyReports: true,
    monthlyReports: true
  }
];

const mockSocialAccounts = [
  {
    id: '1',
    platform: 'facebook',
    accountName: 'AllIn Social Media',
    username: '@allinsocial',
    isConnected: true,
    followers: 12500,
    connectedAt: '2024-01-15T10:00:00Z',
    lastSync: '2024-01-20T14:30:00Z',
    userId: 'user1'
  },
  {
    id: '2',
    platform: 'instagram',
    accountName: 'AllIn Social',
    username: '@allinsocial',
    isConnected: true,
    followers: 8900,
    connectedAt: '2024-01-15T10:05:00Z',
    lastSync: '2024-01-20T14:25:00Z',
    userId: 'user1'
  },
  {
    id: '3',
    platform: 'twitter',
    accountName: 'AllIn Social Media',
    username: '@AllInSocial',
    isConnected: true,
    followers: 5600,
    connectedAt: '2024-01-15T10:10:00Z',
    lastSync: '2024-01-20T14:20:00Z',
    userId: 'user1'
  },
  {
    id: '4',
    platform: 'linkedin',
    accountName: 'AllIn Social Media Company',
    username: 'allin-social-media',
    isConnected: false,
    followers: 0,
    userId: 'user1'
  },
  {
    id: '5',
    platform: 'youtube',
    accountName: 'AllIn Social',
    username: '@AllInSocial',
    isConnected: false,
    followers: 0,
    userId: 'user1'
  },
  {
    id: '6',
    platform: 'tiktok',
    accountName: 'AllIn Social',
    username: '@allinsocial',
    isConnected: false,
    followers: 0,
    userId: 'user1'
  }
];

/**
 * @route GET /api/settings/profile
 * @desc Get user profile settings
 * @access Private
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = mockUsers.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

/**
 * @route PATCH /api/settings/profile
 * @desc Update user profile
 * @access Private
 */
router.patch('/profile', requireAuth, validateZodRequest(updateProfileSchema, 'body'), async (req, res) => {
  try {
    const userId = req.user?.id;
    const updates = req.body;

    const userIndex = mockUsers.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Update user properties
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        (mockUsers[userIndex] as any)[key] = updates[key];
      }
    });

    return res.json({
      success: true,
      data: mockUsers[userIndex],
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

/**
 * @route GET /api/settings/organization
 * @desc Get organization settings
 * @access Private
 */
router.get('/organization', requireAuth, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org1';
    const organization = mockOrganizations.find(org => org.id === organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    return res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch organization settings'
    });
  }
});

/**
 * @route PATCH /api/settings/organization
 * @desc Update organization settings
 * @access Private
 */
router.patch('/organization', requireAuth, validateZodRequest(updateOrganizationSchema, 'body'), async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org1';
    const updates = req.body;

    const orgIndex = mockOrganizations.findIndex(org => org.id === organizationId);

    if (orgIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Update organization properties
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        (mockOrganizations[orgIndex] as any)[key] = updates[key];
      }
    });

    return res.json({
      success: true,
      data: mockOrganizations[orgIndex],
      message: 'Organization settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update organization settings'
    });
  }
});

/**
 * @route POST /api/settings/password
 * @desc Update user password
 * @access Private
 */
router.post('/password', requireAuth, validateZodRequest(updatePasswordSchema, 'body'), async (req, res) => {
  try {
    const { currentPassword: _currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    // In a real implementation, verify the current password against the stored hash
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // In a real implementation, update the password in the database
    console.log(`Password updated for user ${userId}: ${hashedPassword}`);

    return res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update password'
    });
  }
});

/**
 * @route GET /api/settings/notifications
 * @desc Get notification preferences
 * @access Private
 */
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const settings = mockNotificationSettings.find(s => s.userId === userId);

    if (!settings) {
      // Return default settings
      const defaultSettings = {
        userId: userId || 'user1',
        emailNotifications: {
          posts: true,
          mentions: true,
          teamActivity: true,
          billing: true,
          security: true
        },
        pushNotifications: {
          posts: true,
          mentions: true,
          teamActivity: false
        },
        weeklyReports: true,
        monthlyReports: true
      };

      mockNotificationSettings.push(defaultSettings);
      return res.json({
        success: true,
        data: defaultSettings
      });
    }

    return res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notification settings'
    });
  }
});

/**
 * @route PATCH /api/settings/notifications
 * @desc Update notification preferences
 * @access Private
 */
router.patch('/notifications', requireAuth, validateZodRequest(updateNotificationsSchema, 'body'), async (req, res) => {
  try {
    const userId = req.user?.id;
    const updates = req.body;

    const settingsIndex = mockNotificationSettings.findIndex(s => s.userId === userId);

    if (settingsIndex === -1) {
      // Create new settings
      const newSettings = {
        userId,
        emailNotifications: {
          posts: true,
          mentions: true,
          teamActivity: true,
          billing: true,
          security: true
        },
        pushNotifications: {
          posts: true,
          mentions: true,
          teamActivity: false
        },
        weeklyReports: true,
        monthlyReports: true,
        ...updates
      };

      mockNotificationSettings.push(newSettings);
      return res.json({
        success: true,
        data: newSettings,
        message: 'Notification settings created successfully'
      });
    }

    // Update existing settings
    if (updates.emailNotifications) {
      mockNotificationSettings[settingsIndex].emailNotifications = {
        ...mockNotificationSettings[settingsIndex].emailNotifications,
        ...updates.emailNotifications
      };
    }

    if (updates.pushNotifications) {
      mockNotificationSettings[settingsIndex].pushNotifications = {
        ...mockNotificationSettings[settingsIndex].pushNotifications,
        ...updates.pushNotifications
      };
    }

    if (updates.weeklyReports !== undefined) {
      mockNotificationSettings[settingsIndex].weeklyReports = updates.weeklyReports;
    }

    if (updates.monthlyReports !== undefined) {
      mockNotificationSettings[settingsIndex].monthlyReports = updates.monthlyReports;
    }

    return res.json({
      success: true,
      data: mockNotificationSettings[settingsIndex],
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification settings'
    });
  }
});

/**
 * @route GET /api/settings/social-accounts
 * @desc Get connected social media accounts
 * @access Private
 */
router.get('/social-accounts', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const accounts = mockSocialAccounts.filter(account => account.userId === userId);

    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('Error fetching social accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch social accounts'
    });
  }
});

/**
 * @route POST /api/settings/social-accounts/connect
 * @desc Connect a social media account
 * @access Private
 */
router.post('/social-accounts/connect', requireAuth, validateZodRequest(connectSocialAccountSchema, 'body'), async (req, res) => {
  try {
    const { platform, accessToken: _accessToken, accountId: _accountId, accountName } = req.body;
    const userId = req.user?.id;

    // Find existing account
    const accountIndex = mockSocialAccounts.findIndex(
      account => account.platform === platform && account.userId === userId
    );

    if (accountIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Social account not found'
      });
    }

    // In a real implementation, validate the access token with the platform's API
    // and fetch account details

    // Update account as connected
    const updatedAccount = {
      ...mockSocialAccounts[accountIndex],
      isConnected: true,
      connectedAt: new Date().toISOString(),
      lastSync: new Date().toISOString(),
      accountName: accountName || mockSocialAccounts[accountIndex].accountName
    };
    mockSocialAccounts[accountIndex] = updatedAccount as any;
    // In real implementation, store encrypted access token securely

    return res.json({
      success: true,
      data: mockSocialAccounts[accountIndex],
      message: `${platform} account connected successfully`
    });
  } catch (error) {
    console.error('Error connecting social account:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to connect social account'
    });
  }
});

/**
 * @route POST /api/settings/social-accounts/:id/disconnect
 * @desc Disconnect a social media account
 * @access Private
 */
router.post('/social-accounts/:id/disconnect', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const accountIndex = mockSocialAccounts.findIndex(
      account => account.id === id && account.userId === userId
    );

    if (accountIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Social account not found'
      });
    }

    // Update account as disconnected
    const disconnectedAccount = {
      ...mockSocialAccounts[accountIndex],
      isConnected: false,
      followers: 0
    };
    delete (disconnectedAccount as any).connectedAt;
    delete (disconnectedAccount as any).lastSync;
    mockSocialAccounts[accountIndex] = disconnectedAccount as any;

    return res.json({
      success: true,
      data: mockSocialAccounts[accountIndex],
      message: 'Account disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting social account:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to disconnect social account'
    });
  }
});

/**
 * @route POST /api/settings/social-accounts/:id/sync
 * @desc Sync a social media account
 * @access Private
 */
router.post('/social-accounts/:id/sync', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const accountIndex = mockSocialAccounts.findIndex(
      account => account.id === id && account.userId === userId
    );

    if (accountIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Social account not found'
      });
    }

    if (!mockSocialAccounts[accountIndex].isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Cannot sync disconnected account'
      });
    }

    // In a real implementation, sync data from the platform's API
    mockSocialAccounts[accountIndex].lastSync = new Date().toISOString();

    return res.json({
      success: true,
      data: mockSocialAccounts[accountIndex],
      message: 'Account synced successfully'
    });
  } catch (error) {
    console.error('Error syncing social account:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync social account'
    });
  }
});

/**
 * @route GET /api/settings/security
 * @desc Get security settings
 * @access Private
 */
router.get('/security', requireAuth, async (_req, res) => {
  try {
    // Mock security settings
    const securitySettings = {
      twoFactorEnabled: false,
      smsEnabled: false,
      authenticatorEnabled: false,
      passwordLastChanged: '2024-01-01T00:00:00Z',
      activeSessions: [
        {
          id: 'session1',
          device: 'Chrome on Windows',
          location: 'New York, NY',
          lastActive: new Date().toISOString(),
          isCurrent: true
        },
        {
          id: 'session2',
          device: 'Safari on iPhone',
          location: 'Los Angeles, CA',
          lastActive: '2024-01-20T09:30:00Z',
          isCurrent: false
        }
      ],
      loginHistory: [
        {
          timestamp: '2024-01-20T10:00:00Z',
          device: 'Chrome on Windows',
          location: 'New York, NY',
          status: 'success'
        }
      ]
    };

    return res.json({
      success: true,
      data: securitySettings
    });
  } catch (error) {
    console.error('Error fetching security settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch security settings'
    });
  }
});

/**
 * @route POST /api/settings/security/revoke-session
 * @desc Revoke a security session
 * @access Private
 */
router.post('/security/revoke-session', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // In a real implementation, revoke the session from the database
    console.log(`Session ${sessionId} revoked for user ${req.user?.id}`);

    return res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking session:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to revoke session'
    });
  }
});

/**
 * @route GET /api/settings/billing
 * @desc Get billing information
 * @access Private
 */
router.get('/billing', requireAuth, async (_req, res) => {
  try {
    // Mock billing information
    const billingInfo = {
      plan: {
        name: 'Professional',
        price: 49,
        interval: 'month',
        features: [
          '10 team members',
          '25 social accounts',
          '5TB storage',
          'Advanced analytics',
          'Priority support'
        ]
      },
      subscription: {
        status: 'active',
        nextBilling: '2024-02-20T00:00:00Z',
        cancelAtPeriodEnd: false
      },
      paymentMethod: {
        type: 'card',
        last4: '1234',
        expiryMonth: 12,
        expiryYear: 2027,
        brand: 'Visa'
      },
      usage: {
        teamMembers: 5,
        connectedAccounts: 12,
        storageUsed: 2.4 * 1024 * 1024 * 1024 * 1024 // 2.4TB in bytes
      },
      invoices: [
        {
          id: 'INV-2024-001',
          date: '2024-01-20T00:00:00Z',
          amount: 49.00,
          status: 'paid',
          downloadUrl: '/api/billing/invoices/INV-2024-001/download'
        },
        {
          id: 'INV-2023-012',
          date: '2023-12-20T00:00:00Z',
          amount: 49.00,
          status: 'paid',
          downloadUrl: '/api/billing/invoices/INV-2023-012/download'
        }
      ]
    };

    res.json({
      success: true,
      data: billingInfo
    });
  } catch (error) {
    console.error('Error fetching billing info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing information'
    });
  }
});

export default router;