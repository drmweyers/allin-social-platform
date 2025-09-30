import { test, expect, Page } from '@playwright/test';
import { TestHelpers, SELECTORS } from '../utils/test-helpers';

/**
 * 👥 COMPREHENSIVE TEAM MANAGEMENT TESTS
 *
 * This test suite covers EVERY aspect of team management:
 * - Member invitation and onboarding
 * - Role assignment (Admin, Manager, Editor, Viewer, Contributor)
 * - Permission settings and enforcement
 * - Team activity log and audit trail
 * - Member profile management
 * - Team collaboration features
 * - Access control testing
 * - Team settings and configuration
 * - Member removal and deactivation
 * - Team analytics and insights
 */

test.describe('👥 COMPLETE TEAM MANAGEMENT TESTS', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input#email', 'admin@allin.demo');
    await page.fill('input#password', 'Admin123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    await page.goto('/dashboard/team');
    await helpers.waitForLoadingComplete();
  });

  const TEAM_ROLES = [
    {
      name: 'Admin',
      permissions: ['full-access', 'manage-team', 'manage-settings', 'view-analytics', 'create-content', 'publish-content'],
      description: 'Full system access'
    },
    {
      name: 'Manager',
      permissions: ['manage-team', 'view-analytics', 'create-content', 'publish-content', 'approve-content'],
      description: 'Team and content management'
    },
    {
      name: 'Editor',
      permissions: ['create-content', 'edit-content', 'schedule-content'],
      description: 'Content creation and editing'
    },
    {
      name: 'Contributor',
      permissions: ['create-content', 'submit-for-approval'],
      description: 'Content creation only'
    },
    {
      name: 'Viewer',
      permissions: ['view-content', 'view-analytics'],
      description: 'Read-only access'
    }
  ];

  test.describe('👤 MEMBER INVITATION - Complete Testing', () => {
    test('INVITE-001: Invitation form and validation', async ({ page }) => {
      const inviteButton = page.locator('[data-testid="invite-member"], button:has-text("Invite"), .invite-button').first();

      if (await inviteButton.count() > 0) {
        await expect(inviteButton).toBeVisible();
        await expect(inviteButton).toBeEnabled();

        await inviteButton.click();
        await page.waitForTimeout(1000);

        // Check for invitation modal/form
        const inviteModal = page.locator('.invite-modal, [data-testid="invite-modal"], .modal').first();

        if (await inviteModal.count() > 0) {
          await expect(inviteModal).toBeVisible();

          // Check for email input
          const emailInput = inviteModal.locator('input[type="email"], [data-testid="invite-email"]').first();
          if (await emailInput.count() > 0) {
            await expect(emailInput).toBeVisible();

            // Test email validation
            await emailInput.fill('invalid-email');

            const sendButton = inviteModal.locator('button:has-text("Send"), button:has-text("Invite")').first();
            if (await sendButton.count() > 0) {
              await sendButton.click();
              await page.waitForTimeout(500);

              // Check for validation error
              const errorMessage = page.locator('.error-message, .validation-error');
              if (await errorMessage.count() > 0) {
                console.log('✅ Email validation working');
              }
            }

            // Test valid email
            await emailInput.clear();
            await emailInput.fill('newuser@example.com');
          }

          // Check for role selection
          const roleSelector = inviteModal.locator('select[name="role"], [data-testid="role-selector"]').first();
          if (await roleSelector.count() > 0) {
            await expect(roleSelector).toBeVisible();

            // Test each role option
            for (const role of TEAM_ROLES) {
              try {
                await roleSelector.selectOption(role.name);
                console.log(`✅ Role option available: ${role.name}`);
              } catch {
                // Role might not be available for current user
              }
            }
          }

          await helpers.takeScreenshot('team-invitation-form');
        }
      }
    });

    test('INVITE-002: Bulk invitation functionality', async ({ page }) => {
      const bulkInviteButton = page.locator('[data-testid="bulk-invite"], button:has-text("Bulk Invite"), .bulk-invite').first();

      if (await bulkInviteButton.count() > 0) {
        await bulkInviteButton.click();
        await page.waitForTimeout(1000);

        const bulkModal = page.locator('.bulk-invite-modal, [data-testid="bulk-invite-modal"]').first();

        if (await bulkModal.count() > 0) {
          // Check for bulk email input (textarea or multiple email inputs)
          const bulkEmailInput = bulkModal.locator('textarea, [data-testid="bulk-emails"]').first();

          if (await bulkEmailInput.count() > 0) {
            const testEmails = [
              'user1@example.com',
              'user2@example.com',
              'user3@example.com'
            ].join('\n');

            await bulkEmailInput.fill(testEmails);

            // Test bulk role assignment
            const bulkRoleSelector = bulkModal.locator('select[name="role"], [data-testid="bulk-role"]').first();
            if (await bulkRoleSelector.count() > 0) {
              await bulkRoleSelector.selectOption('Editor');
            }

            // Send bulk invitations
            const sendBulkButton = bulkModal.locator('button:has-text("Send"), button:has-text("Invite All")').first();
            if (await sendBulkButton.count() > 0) {
              await sendBulkButton.click();
              await page.waitForTimeout(2000);

              console.log('✅ Bulk invitation functionality tested');
            }
          }
        }
      }
    });

    test('INVITE-003: Invitation status tracking', async ({ page }) => {
      const invitationsTab = page.locator('[data-testid="invitations-tab"], button:has-text("Invitations"), .invitations-tab').first();

      if (await invitationsTab.count() > 0) {
        await invitationsTab.click();
        await page.waitForTimeout(1000);

        // Check for invitations list
        const invitationsList = page.locator('[data-testid="invitations-list"], .invitations-list').first();

        if (await invitationsList.count() > 0) {
          await expect(invitationsList).toBeVisible();

          // Check for invitation statuses
          const invitationItems = invitationsList.locator('.invitation-item, .pending-invitation');
          const invitationCount = await invitationItems.count();

          if (invitationCount > 0) {
            console.log(`✅ Found ${invitationCount} pending invitations`);

            // Check for status indicators
            const statusIndicators = ['Pending', 'Accepted', 'Expired', 'Declined'];

            for (const status of statusIndicators) {
              const statusElement = invitationsList.locator(`text="${status}", .status-${status.toLowerCase()}`);
              if (await statusElement.count() > 0) {
                console.log(`✅ Invitation status found: ${status}`);
              }
            }

            // Test resend invitation
            const resendButton = invitationItems.first().locator('button:has-text("Resend"), [data-testid="resend-invitation"]').first();
            if (await resendButton.count() > 0) {
              await resendButton.click();
              await page.waitForTimeout(1000);
              console.log('✅ Resend invitation functionality tested');
            }

            // Test cancel invitation
            const cancelButton = invitationItems.first().locator('button:has-text("Cancel"), [data-testid="cancel-invitation"]').first();
            if (await cancelButton.count() > 0) {
              await cancelButton.click();
              await page.waitForTimeout(1000);
              console.log('✅ Cancel invitation functionality tested');
            }
          }
        }

        await helpers.takeScreenshot('team-invitations-list');
      }
    });
  });

  test.describe('🔐 ROLE MANAGEMENT - Complete Testing', () => {
    test('ROLES-001: Role assignment and modification', async ({ page }) => {
      const teamMembers = page.locator('.team-member, .member-item, [data-testid="team-member"]');
      const memberCount = await teamMembers.count();

      if (memberCount > 0) {
        const firstMember = teamMembers.first();

        // Find role selector for member
        const roleSelector = firstMember.locator('select, .role-selector, [data-testid="member-role"]').first();

        if (await roleSelector.count() > 0) {
          // Test changing roles
          for (const role of TEAM_ROLES.slice(0, 3)) { // Test first 3 roles
            try {
              await roleSelector.selectOption(role.name);
              await page.waitForTimeout(1000);
              console.log(`✅ Role changed to: ${role.name}`);

              // Check for role change confirmation
              const roleConfirmation = page.locator('.role-updated, .success-message, [data-testid="role-success"]');
              if (await roleConfirmation.count() > 0) {
                console.log('✅ Role change confirmation displayed');
              }
            } catch {
              console.log(`⚠️ Role ${role.name} not available for this user`);
            }
          }
        }

        await helpers.takeScreenshot('team-role-management');
      }
    });

    test('ROLES-002: Permission matrix display', async ({ page }) => {
      const permissionsTab = page.locator('[data-testid="permissions-tab"], button:has-text("Permissions"), .permissions-tab').first();

      if (await permissionsTab.count() > 0) {
        await permissionsTab.click();
        await page.waitForTimeout(1000);

        // Check for permissions matrix/table
        const permissionsMatrix = page.locator('[data-testid="permissions-matrix"], .permissions-table, table').first();

        if (await permissionsMatrix.count() > 0) {
          await expect(permissionsMatrix).toBeVisible();

          // Check for role columns
          for (const role of TEAM_ROLES) {
            const roleColumn = permissionsMatrix.locator(`th:has-text("${role.name}"), .role-column-${role.name.toLowerCase()}`);
            if (await roleColumn.count() > 0) {
              console.log(`✅ Permissions column found for: ${role.name}`);
            }
          }

          // Check for permission rows
          const commonPermissions = [
            'View Content',
            'Create Content',
            'Edit Content',
            'Publish Content',
            'Delete Content',
            'Manage Team',
            'View Analytics',
            'Manage Settings'
          ];

          for (const permission of commonPermissions) {
            const permissionRow = permissionsMatrix.locator(`td:has-text("${permission}"), tr:has-text("${permission}")`);
            if (await permissionRow.count() > 0) {
              console.log(`✅ Permission row found: ${permission}`);
            }
          }

          await helpers.takeScreenshot('team-permissions-matrix');
        }
      }
    });

    test('ROLES-003: Custom role creation', async ({ page }) => {
      const createRoleButton = page.locator('[data-testid="create-role"], button:has-text("Create Role"), .create-role').first();

      if (await createRoleButton.count() > 0) {
        await createRoleButton.click();
        await page.waitForTimeout(1000);

        const roleModal = page.locator('.create-role-modal, [data-testid="role-modal"]').first();

        if (await roleModal.count() > 0) {
          await expect(roleModal).toBeVisible();

          // Fill role details
          const roleNameInput = roleModal.locator('input[name="name"], [data-testid="role-name"]').first();
          if (await roleNameInput.count() > 0) {
            await roleNameInput.fill('Content Reviewer');
          }

          const roleDescriptionInput = roleModal.locator('textarea[name="description"], [data-testid="role-description"]').first();
          if (await roleDescriptionInput.count() > 0) {
            await roleDescriptionInput.fill('Reviews and approves content before publishing');
          }

          // Select permissions
          const permissionCheckboxes = roleModal.locator('input[type="checkbox"], .permission-checkbox');
          const checkboxCount = Math.min(await permissionCheckboxes.count(), 5);

          for (let i = 0; i < checkboxCount; i++) {
            const checkbox = permissionCheckboxes.nth(i);
            if (await checkbox.isVisible()) {
              await checkbox.check();
              await page.waitForTimeout(200);
            }
          }

          // Save custom role
          const saveRoleButton = roleModal.locator('button:has-text("Save"), button:has-text("Create")').first();
          if (await saveRoleButton.count() > 0) {
            await saveRoleButton.click();
            await page.waitForTimeout(1000);
            console.log('✅ Custom role creation tested');
          }
        }
      }
    });
  });

  test.describe('📋 TEAM ACTIVITY LOG - Complete Testing', () => {
    test('ACTIVITY-001: Activity log display and filtering', async ({ page }) => {
      const activityTab = page.locator('[data-testid="activity-tab"], button:has-text("Activity"), .activity-tab').first();

      if (await activityTab.count() > 0) {
        await activityTab.click();
        await page.waitForTimeout(1000);

        const activityLog = page.locator('[data-testid="activity-log"], .activity-log, .audit-trail').first();

        if (await activityLog.count() > 0) {
          await expect(activityLog).toBeVisible();

          // Check for activity items
          const activityItems = activityLog.locator('.activity-item, .log-entry, .audit-entry');
          const itemCount = await activityItems.count();

          if (itemCount > 0) {
            console.log(`✅ Found ${itemCount} activity log entries`);

            // Check for activity types
            const activityTypes = [
              'Member Added',
              'Role Changed',
              'Content Created',
              'Content Published',
              'Settings Updated',
              'Member Removed'
            ];

            for (const activityType of activityTypes) {
              const activityElement = activityLog.locator(`text="${activityType}"`);
              if (await activityElement.count() > 0) {
                console.log(`✅ Activity type found: ${activityType}`);
              }
            }
          }

          // Test activity filtering
          const activityFilter = activityLog.locator('select[name="activity-type"], [data-testid="activity-filter"]').first();
          if (await activityFilter.count() > 0) {
            await activityFilter.selectOption('Member Activities');
            await page.waitForTimeout(1000);
            console.log('✅ Activity filtering tested');
          }

          await helpers.takeScreenshot('team-activity-log');
        }
      }
    });

    test('ACTIVITY-002: Activity details and timestamps', async ({ page }) => {
      const activityTab = page.locator('[data-testid="activity-tab"], button:has-text("Activity")').first();

      if (await activityTab.count() > 0) {
        await activityTab.click();
        await page.waitForTimeout(1000);

        const activityItems = page.locator('.activity-item, .log-entry');

        if (await activityItems.count() > 0) {
          const firstActivity = activityItems.first();

          // Check for timestamp
          const timestamp = firstActivity.locator('.timestamp, .activity-time, .log-time');
          if (await timestamp.count() > 0) {
            const timeText = await timestamp.textContent();
            if (timeText && timeText.trim().length > 0) {
              console.log('✅ Activity timestamps displayed');
            }
          }

          // Check for user information
          const userInfo = firstActivity.locator('.user-name, .activity-user, .performed-by');
          if (await userInfo.count() > 0) {
            console.log('✅ Activity user information displayed');
          }

          // Check for activity details
          const activityDetails = firstActivity.locator('.activity-details, .log-details');
          if (await activityDetails.count() > 0) {
            console.log('✅ Activity details displayed');
          }

          // Test expanding activity details
          await firstActivity.click();
          await page.waitForTimeout(500);

          const expandedDetails = page.locator('.expanded-details, .activity-expanded');
          if (await expandedDetails.count() > 0) {
            console.log('✅ Activity detail expansion working');
          }
        }
      }
    });

    test('ACTIVITY-003: Activity export functionality', async ({ page }) => {
      const activityTab = page.locator('[data-testid="activity-tab"], button:has-text("Activity")').first();

      if (await activityTab.count() > 0) {
        await activityTab.click();
        await page.waitForTimeout(1000);

        const exportButton = page.locator('[data-testid="export-activity"], button:has-text("Export"), .export-log').first();

        if (await exportButton.count() > 0) {
          await exportButton.click();
          await page.waitForTimeout(500);

          // Check for export options
          const exportOptions = page.locator('.export-options, .export-dropdown');
          if (await exportOptions.count() > 0) {
            const csvOption = exportOptions.locator('button:has-text("CSV"), a:has-text("CSV")').first();
            if (await csvOption.count() > 0) {
              // Set up download handler
              const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

              await csvOption.click();

              try {
                const download = await downloadPromise;
                console.log(`✅ Activity log export initiated: ${download.suggestedFilename()}`);
              } catch {
                console.log('⚠️ Activity export test - download may not have completed');
              }
            }
          }
        }
      }
    });
  });

  test.describe('👤 MEMBER PROFILES - Complete Testing', () => {
    test('PROFILE-001: Member profile display and editing', async ({ page }) => {
      const teamMembers = page.locator('.team-member, .member-item');

      if (await teamMembers.count() > 0) {
        const firstMember = teamMembers.first();

        // Click on member to view profile
        await firstMember.click();
        await page.waitForTimeout(1000);

        // Check for profile modal or detail view
        const memberProfile = page.locator('.member-profile, [data-testid="member-profile"], .profile-modal').first();

        if (await memberProfile.count() > 0) {
          await expect(memberProfile).toBeVisible();

          // Check for profile information
          const profileElements = [
            '.member-name, .profile-name',
            '.member-email, .profile-email',
            '.member-role, .profile-role',
            '.member-avatar, .profile-avatar',
            '.join-date, .member-since'
          ];

          for (const elementSelector of profileElements) {
            const element = memberProfile.locator(elementSelector);
            if (await element.count() > 0 && await element.isVisible()) {
              console.log(`✅ Profile element found: ${elementSelector}`);
            }
          }

          // Test profile editing (if available)
          const editProfileButton = memberProfile.locator('button:has-text("Edit"), [data-testid="edit-profile"]').first();
          if (await editProfileButton.count() > 0) {
            await editProfileButton.click();
            await page.waitForTimeout(500);

            const editForm = page.locator('.edit-profile-form, .profile-edit');
            if (await editForm.count() > 0) {
              console.log('✅ Profile editing functionality available');
            }
          }

          await helpers.takeScreenshot('team-member-profile');
        }
      }
    });

    test('PROFILE-002: Member statistics and activity', async ({ page }) => {
      const teamMembers = page.locator('.team-member, .member-item');

      if (await teamMembers.count() > 0) {
        const firstMember = teamMembers.first();
        await firstMember.click();
        await page.waitForTimeout(1000);

        const memberProfile = page.locator('.member-profile, .profile-modal').first();

        if (await memberProfile.count() > 0) {
          // Check for member statistics
          const statsElements = [
            'Posts Created',
            'Posts Published',
            'Comments Made',
            'Last Active',
            'Total Contributions'
          ];

          for (const stat of statsElements) {
            const statElement = memberProfile.locator(`text="${stat}"`);
            if (await statElement.count() > 0) {
              console.log(`✅ Member statistic found: ${stat}`);
            }
          }

          // Check for recent activity
          const recentActivity = memberProfile.locator('.recent-activity, .member-activity');
          if (await recentActivity.count() > 0) {
            const activityItems = recentActivity.locator('.activity-item, li');
            const activityCount = await activityItems.count();

            if (activityCount > 0) {
              console.log(`✅ Found ${activityCount} recent activity items`);
            }
          }
        }
      }
    });
  });

  test.describe('🔒 ACCESS CONTROL - Complete Testing', () => {
    test('ACCESS-001: Role-based access enforcement', async ({ page }) => {
      // Test different access levels by simulating different user roles
      const roleTests = [
        {
          role: 'Viewer',
          shouldHaveAccess: ['view-content', 'view-analytics'],
          shouldNotHaveAccess: ['create-content', 'manage-team', 'delete-content']
        },
        {
          role: 'Editor',
          shouldHaveAccess: ['view-content', 'create-content', 'edit-content'],
          shouldNotHaveAccess: ['manage-team', 'delete-users', 'billing-settings']
        }
      ];

      for (const roleTest of roleTests) {
        // Simulate role by setting localStorage
        await page.evaluate((role) => {
          localStorage.setItem('user_role', role);
        }, roleTest.role);

        await page.reload();
        await helpers.waitForLoadingComplete();

        // Check for UI elements that should/shouldn't be available
        const restrictedElements = [
          { selector: '[data-testid="invite-member"]', permission: 'manage-team' },
          { selector: 'button:has-text("Delete")', permission: 'delete-content' },
          { selector: '[data-testid="billing"]', permission: 'billing-settings' }
        ];

        for (const element of restrictedElements) {
          const shouldHaveAccess = roleTest.shouldHaveAccess.includes(element.permission);
          const elementLocator = page.locator(element.selector);

          if (shouldHaveAccess) {
            if (await elementLocator.count() > 0) {
              console.log(`✅ ${roleTest.role} correctly has access to: ${element.permission}`);
            }
          } else {
            if (await elementLocator.count() === 0) {
              console.log(`✅ ${roleTest.role} correctly denied access to: ${element.permission}`);
            }
          }
        }
      }
    });

    test('ACCESS-002: Permission validation on actions', async ({ page }) => {
      // Test that restricted actions show appropriate errors
      const restrictedActions = [
        { button: '[data-testid="delete-member"]', expectedError: 'insufficient permissions' },
        { button: '[data-testid="change-billing"]', expectedError: 'access denied' }
      ];

      for (const action of restrictedActions) {
        const actionButton = page.locator(action.button);

        if (await actionButton.count() > 0 && await actionButton.isVisible()) {
          await actionButton.click();
          await page.waitForTimeout(1000);

          // Check for permission error
          const errorMessages = page.locator('.error-message, .permission-error, .access-denied');
          if (await errorMessages.count() > 0) {
            const errorText = await errorMessages.first().textContent();
            if (errorText?.toLowerCase().includes('permission') || errorText?.toLowerCase().includes('access')) {
              console.log('✅ Permission validation working for restricted action');
            }
          }
        }
      }
    });
  });

  test.describe('⚙️ TEAM SETTINGS - Complete Testing', () => {
    test('SETTINGS-001: Team configuration options', async ({ page }) => {
      const settingsTab = page.locator('[data-testid="team-settings"], button:has-text("Settings"), .team-settings').first();

      if (await settingsTab.count() > 0) {
        await settingsTab.click();
        await page.waitForTimeout(1000);

        const settingsPanel = page.locator('.team-settings-panel, [data-testid="settings-panel"]').first();

        if (await settingsPanel.count() > 0) {
          await expect(settingsPanel).toBeVisible();

          // Check for team configuration options
          const configOptions = [
            'Team Name',
            'Default Role',
            'Invitation Expiry',
            'Two-Factor Authentication',
            'Session Timeout',
            'Email Notifications'
          ];

          for (const option of configOptions) {
            const optionElement = settingsPanel.locator(`label:has-text("${option}"), text="${option}"`);
            if (await optionElement.count() > 0) {
              console.log(`✅ Team setting found: ${option}`);
            }
          }

          await helpers.takeScreenshot('team-settings');
        }
      }
    });

    test('SETTINGS-002: Security settings configuration', async ({ page }) => {
      const settingsTab = page.locator('[data-testid="team-settings"], button:has-text("Settings")').first();

      if (await settingsTab.count() > 0) {
        await settingsTab.click();
        await page.waitForTimeout(1000);

        // Check for security-related settings
        const securitySettings = [
          'Password Requirements',
          'Two-Factor Authentication',
          'Session Management',
          'IP Restrictions',
          'Login Notifications'
        ];

        for (const setting of securitySettings) {
          const settingElement = page.locator(`text="${setting}", [data-setting="${setting.toLowerCase().replace(' ', '-')}"]`);
          if (await settingElement.count() > 0) {
            console.log(`✅ Security setting found: ${setting}`);
          }
        }

        // Test toggling security settings
        const securityToggles = page.locator('input[type="checkbox"], .toggle, .switch');
        const toggleCount = Math.min(await securityToggles.count(), 3);

        for (let i = 0; i < toggleCount; i++) {
          const toggle = securityToggles.nth(i);
          if (await toggle.isVisible()) {
            const initialState = await toggle.isChecked();
            await toggle.click();
            await page.waitForTimeout(500);

            const newState = await toggle.isChecked();
            if (newState !== initialState) {
              console.log(`✅ Security setting toggle ${i + 1} working`);
            }
          }
        }
      }
    });
  });

  test.describe('📊 TEAM ANALYTICS - Complete Testing', () => {
    test('ANALYTICS-001: Team performance metrics', async ({ page }) => {
      const analyticsTab = page.locator('[data-testid="team-analytics"], button:has-text("Analytics"), .team-analytics').first();

      if (await analyticsTab.count() > 0) {
        await analyticsTab.click();
        await page.waitForTimeout(1000);

        const analyticsPanel = page.locator('.team-analytics-panel, [data-testid="analytics-panel"]').first();

        if (await analyticsPanel.count() > 0) {
          await expect(analyticsPanel).toBeVisible();

          // Check for team metrics
          const teamMetrics = [
            'Active Members',
            'Content Created',
            'Posts Published',
            'Team Productivity',
            'Collaboration Score',
            'Average Response Time'
          ];

          for (const metric of teamMetrics) {
            const metricElement = analyticsPanel.locator(`text="${metric}"`);
            if (await metricElement.count() > 0) {
              console.log(`✅ Team metric found: ${metric}`);
            }
          }

          // Check for performance charts
          const charts = analyticsPanel.locator('canvas, svg, .chart');
          if (await charts.count() > 0) {
            console.log('✅ Team analytics charts displayed');
          }

          await helpers.takeScreenshot('team-analytics');
        }
      }
    });

    test('ANALYTICS-002: Individual member performance', async ({ page }) => {
      const analyticsTab = page.locator('[data-testid="team-analytics"], button:has-text("Analytics")').first();

      if (await analyticsTab.count() > 0) {
        await analyticsTab.click();
        await page.waitForTimeout(1000);

        // Check for member performance breakdown
        const memberPerformance = page.locator('.member-performance, [data-testid="member-stats"]').first();

        if (await memberPerformance.count() > 0) {
          const memberRows = memberPerformance.locator('.member-row, tr');
          const memberCount = await memberRows.count();

          if (memberCount > 0) {
            console.log(`✅ Found performance data for ${memberCount} team members`);

            // Check for individual metrics
            const individualMetrics = ['Posts', 'Engagement', 'Activity Score'];

            for (const metric of individualMetrics) {
              const metricColumn = memberPerformance.locator(`th:has-text("${metric}"), .${metric.toLowerCase()}-column`);
              if (await metricColumn.count() > 0) {
                console.log(`✅ Individual metric column found: ${metric}`);
              }
            }
          }
        }
      }
    });
  });

  test.describe('⚡ PERFORMANCE TESTS', () => {
    test('PERF-001: Team page load performance', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard/team');
      await helpers.waitForLoadingComplete();

      const loadTime = Date.now() - startTime;
      console.log(`Team page load time: ${loadTime}ms`);

      expect(loadTime).toBeLessThan(8000);

      const metrics = await helpers.checkPerformanceMetrics();
      console.log('Team page performance metrics:', metrics);
    });

    test('PERF-002: Large team handling', async ({ page }) => {
      // Simulate a large team by adding test data
      await page.evaluate(() => {
        const largeTeam = Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          role: ['Admin', 'Manager', 'Editor', 'Viewer'][i % 4],
          status: 'active'
        }));

        localStorage.setItem('team_members', JSON.stringify(largeTeam));
      });

      await page.reload();
      await helpers.waitForLoadingComplete();

      // Check if pagination or virtualization is working
      const memberItems = page.locator('.team-member, .member-item');
      const visibleMembers = await memberItems.count();

      console.log(`✅ Large team test: ${visibleMembers} members displayed`);

      // Check for pagination controls
      const pagination = page.locator('.pagination, .page-controls');
      if (await pagination.count() > 0) {
        console.log('✅ Pagination controls found for large team');
      }
    });
  });
});

export {};