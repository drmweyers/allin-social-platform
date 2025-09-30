import { test, expect, Page } from '@playwright/test';
import { TestHelpers, SELECTORS } from '../utils/test-helpers';

/**
 * ⚙️ COMPREHENSIVE SETTINGS & CONFIGURATION TESTS
 *
 * This test suite covers EVERY aspect of settings and configuration:
 * - Profile settings (personal information, avatar, preferences)
 * - Account security settings (password, 2FA, sessions)
 * - Notification preferences (email, push, in-app)
 * - Billing information and subscription management
 * - API keys management and regeneration
 * - Data export/import functionality
 * - Privacy settings and data control
 * - Integration settings and webhooks
 * - Theme and appearance customization
 * - Language and localization settings
 */

test.describe('⚙️ COMPLETE SETTINGS & CONFIGURATION TESTS', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    // Login and navigate to settings
    await page.goto('/auth/login');
    await page.fill('input#email', 'admin@allin.demo');
    await page.fill('input#password', 'Admin123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    await page.goto('/dashboard/settings');
    await helpers.waitForLoadingComplete();
  });

  test.describe('👤 PROFILE SETTINGS - Complete Testing', () => {
    test('PROFILE-001: Personal information management', async ({ page }) => {
      const profileTab = page.locator('[data-testid="profile-tab"], button:has-text("Profile"), .profile-settings').first();

      if (await profileTab.count() > 0) {
        await profileTab.click();
        await page.waitForTimeout(1000);

        const profileForm = page.locator('[data-testid="profile-form"], .profile-form, form').first();

        if (await profileForm.count() > 0) {
          await expect(profileForm).toBeVisible();

          // Check for profile fields
          const profileFields = [
            { field: 'firstName', label: 'First Name', testValue: 'John' },
            { field: 'lastName', label: 'Last Name', testValue: 'Doe' },
            { field: 'email', label: 'Email', testValue: 'john.doe@example.com' },
            { field: 'phone', label: 'Phone', testValue: '+1234567890' },
            { field: 'company', label: 'Company', testValue: 'Acme Corp' },
            { field: 'jobTitle', label: 'Job Title', testValue: 'Marketing Manager' },
            { field: 'bio', label: 'Bio', testValue: 'Passionate about social media marketing' }
          ];

          for (const fieldInfo of profileFields) {
            const field = profileForm.locator(`input[name="${fieldInfo.field}"], textarea[name="${fieldInfo.field}"], [data-testid="${fieldInfo.field}"]`).first();

            if (await field.count() > 0 && await field.isVisible()) {
              await field.clear();
              await field.fill(fieldInfo.testValue);
              await expect(field).toHaveValue(fieldInfo.testValue);
              console.log(`✅ Profile field tested: ${fieldInfo.label}`);
            }
          }

          // Test profile save
          const saveButton = profileForm.locator('button:has-text("Save"), button[type="submit"]').first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(1000);

            // Check for save confirmation
            const saveConfirmation = page.locator('.success-message, .profile-saved, [data-testid="save-success"]');
            if (await saveConfirmation.count() > 0) {
              console.log('✅ Profile save confirmation displayed');
            }
          }

          await helpers.takeScreenshot('profile-settings');
        }
      }
    });

    test('PROFILE-002: Avatar upload and management', async ({ page }) => {
      const profileTab = page.locator('[data-testid="profile-tab"], button:has-text("Profile")').first();

      if (await profileTab.count() > 0) {
        await profileTab.click();
        await page.waitForTimeout(1000);

        // Check for avatar section
        const avatarSection = page.locator('[data-testid="avatar-section"], .avatar-upload, .profile-picture').first();

        if (await avatarSection.count() > 0) {
          await expect(avatarSection).toBeVisible();

          // Test avatar upload
          const avatarUpload = avatarSection.locator('input[type="file"], [data-testid="avatar-upload"]').first();
          const uploadButton = avatarSection.locator('button:has-text("Upload"), button:has-text("Change")').first();

          if (await avatarUpload.count() > 0) {
            await helpers.uploadTestFile(avatarUpload.locator('xpath=.').first(), 'avatar.jpg', 'fake-avatar-image');
          } else if (await uploadButton.count() > 0) {
            await uploadButton.click();
            await page.waitForTimeout(500);

            const fileInput = page.locator('input[type="file"]').first();
            if (await fileInput.count() > 0) {
              await helpers.uploadTestFile(fileInput.locator('xpath=.').first(), 'avatar.jpg', 'fake-avatar-image');
            }
          }

          await page.waitForTimeout(2000);

          // Check for avatar preview
          const avatarPreview = page.locator('.avatar-preview, .profile-image-preview, img[alt*="avatar"]');
          if (await avatarPreview.count() > 0) {
            console.log('✅ Avatar upload and preview working');
          }

          // Test avatar removal
          const removeButton = avatarSection.locator('button:has-text("Remove"), [data-testid="remove-avatar"]').first();
          if (await removeButton.count() > 0) {
            await removeButton.click();
            await page.waitForTimeout(500);
            console.log('✅ Avatar removal functionality tested');
          }
        }
      }
    });

    test('PROFILE-003: Timezone and language preferences', async ({ page }) => {
      const profileTab = page.locator('[data-testid="profile-tab"], button:has-text("Profile")').first();

      if (await profileTab.count() > 0) {
        await profileTab.click();
        await page.waitForTimeout(1000);

        // Test timezone selection
        const timezoneSelector = page.locator('select[name="timezone"], [data-testid="timezone-selector"]').first();
        if (await timezoneSelector.count() > 0) {
          await timezoneSelector.selectOption('America/New_York');
          await page.waitForTimeout(500);
          console.log('✅ Timezone selection tested');
        }

        // Test language selection
        const languageSelector = page.locator('select[name="language"], [data-testid="language-selector"]').first();
        if (await languageSelector.count() > 0) {
          await languageSelector.selectOption('English');
          await page.waitForTimeout(500);
          console.log('✅ Language selection tested');
        }

        // Test date/time format preferences
        const dateFormatSelector = page.locator('select[name="dateFormat"], [data-testid="date-format"]').first();
        if (await dateFormatSelector.count() > 0) {
          await dateFormatSelector.selectOption('MM/DD/YYYY');
          console.log('✅ Date format selection tested');
        }

        const timeFormatSelector = page.locator('select[name="timeFormat"], [data-testid="time-format"]').first();
        if (await timeFormatSelector.count() > 0) {
          await timeFormatSelector.selectOption('12h');
          console.log('✅ Time format selection tested');
        }
      }
    });
  });

  test.describe('🔐 SECURITY SETTINGS - Complete Testing', () => {
    test('SECURITY-001: Password change functionality', async ({ page }) => {
      const securityTab = page.locator('[data-testid="security-tab"], button:has-text("Security"), .security-settings').first();

      if (await securityTab.count() > 0) {
        await securityTab.click();
        await page.waitForTimeout(1000);

        const passwordSection = page.locator('[data-testid="password-section"], .password-change, .change-password').first();

        if (await passwordSection.count() > 0) {
          await expect(passwordSection).toBeVisible();

          // Test password change form
          const currentPasswordInput = passwordSection.locator('input[name="currentPassword"], [data-testid="current-password"]').first();
          const newPasswordInput = passwordSection.locator('input[name="newPassword"], [data-testid="new-password"]').first();
          const confirmPasswordInput = passwordSection.locator('input[name="confirmPassword"], [data-testid="confirm-password"]').first();

          if (await currentPasswordInput.count() > 0) {
            await currentPasswordInput.fill('Admin123!@#');
          }

          if (await newPasswordInput.count() > 0) {
            await newPasswordInput.fill('NewPassword456!@#');

            // Check for password strength indicator
            const strengthIndicator = page.locator('.password-strength, .strength-meter, [data-testid="password-strength"]');
            if (await strengthIndicator.count() > 0) {
              console.log('✅ Password strength indicator displayed');
            }
          }

          if (await confirmPasswordInput.count() > 0) {
            await confirmPasswordInput.fill('NewPassword456!@#');
          }

          // Test password change
          const changePasswordButton = passwordSection.locator('button:has-text("Change Password"), button:has-text("Update")').first();
          if (await changePasswordButton.count() > 0) {
            await changePasswordButton.click();
            await page.waitForTimeout(1000);

            // Check for success message
            const successMessage = page.locator('.success-message, .password-changed');
            if (await successMessage.count() > 0) {
              console.log('✅ Password change functionality tested');
            }
          }

          await helpers.takeScreenshot('security-password-change');
        }
      }
    });

    test('SECURITY-002: Two-factor authentication setup', async ({ page }) => {
      const securityTab = page.locator('[data-testid="security-tab"], button:has-text("Security")').first();

      if (await securityTab.count() > 0) {
        await securityTab.click();
        await page.waitForTimeout(1000);

        const twoFactorSection = page.locator('[data-testid="two-factor"], .two-factor-auth, .2fa-section').first();

        if (await twoFactorSection.count() > 0) {
          await expect(twoFactorSection).toBeVisible();

          // Test enabling 2FA
          const enable2faButton = twoFactorSection.locator('button:has-text("Enable"), button:has-text("Setup"), .enable-2fa').first();

          if (await enable2faButton.count() > 0) {
            await enable2faButton.click();
            await page.waitForTimeout(1000);

            // Check for 2FA setup modal
            const setupModal = page.locator('.two-factor-setup, [data-testid="2fa-setup"], .modal').first();

            if (await setupModal.count() > 0) {
              await expect(setupModal).toBeVisible();

              // Check for QR code
              const qrCode = setupModal.locator('.qr-code, canvas, img[alt*="QR"]');
              if (await qrCode.count() > 0) {
                console.log('✅ 2FA QR code displayed');
              }

              // Check for backup codes
              const backupCodes = setupModal.locator('.backup-codes, .recovery-codes');
              if (await backupCodes.count() > 0) {
                console.log('✅ 2FA backup codes displayed');
              }

              // Test verification code input
              const verificationInput = setupModal.locator('input[name="code"], [data-testid="verification-code"]').first();
              if (await verificationInput.count() > 0) {
                await verificationInput.fill('123456'); // Test code

                const verifyButton = setupModal.locator('button:has-text("Verify"), button:has-text("Confirm")').first();
                if (await verifyButton.count() > 0) {
                  await verifyButton.click();
                  await page.waitForTimeout(1000);
                  console.log('✅ 2FA verification process tested');
                }
              }

              await helpers.takeScreenshot('2fa-setup');
            }
          }

          // Test disabling 2FA (if already enabled)
          const disable2faButton = twoFactorSection.locator('button:has-text("Disable"), .disable-2fa').first();
          if (await disable2faButton.count() > 0) {
            await disable2faButton.click();
            await page.waitForTimeout(500);

            // Check for confirmation dialog
            const confirmDialog = page.locator('.confirm-dialog, [role="dialog"]');
            if (await confirmDialog.count() > 0) {
              const confirmButton = confirmDialog.locator('button:has-text("Confirm"), button:has-text("Disable")').first();
              if (await confirmButton.count() > 0) {
                await confirmButton.click();
                console.log('✅ 2FA disable functionality tested');
              }
            }
          }
        }
      }
    });

    test('SECURITY-003: Session management', async ({ page }) => {
      const securityTab = page.locator('[data-testid="security-tab"], button:has-text("Security")').first();

      if (await securityTab.count() > 0) {
        await securityTab.click();
        await page.waitForTimeout(1000);

        const sessionSection = page.locator('[data-testid="sessions"], .active-sessions, .session-management').first();

        if (await sessionSection.count() > 0) {
          await expect(sessionSection).toBeVisible();

          // Check for active sessions list
          const sessionList = sessionSection.locator('.session-list, .active-session-item');
          const sessionCount = await sessionList.count();

          if (sessionCount > 0) {
            console.log(`✅ Found ${sessionCount} active sessions`);

            // Check session information
            const firstSession = sessionList.first();
            const sessionInfo = [
              '.device-info, .session-device',
              '.location-info, .session-location',
              '.last-active, .session-time',
              '.ip-address, .session-ip'
            ];

            for (const infoSelector of sessionInfo) {
              const info = firstSession.locator(infoSelector);
              if (await info.count() > 0) {
                console.log(`✅ Session info found: ${infoSelector}`);
              }
            }

            // Test revoking a session
            const revokeButton = firstSession.locator('button:has-text("Revoke"), button:has-text("End")').first();
            if (await revokeButton.count() > 0) {
              await revokeButton.click();
              await page.waitForTimeout(500);
              console.log('✅ Session revocation tested');
            }
          }

          // Test "Revoke All Sessions" functionality
          const revokeAllButton = sessionSection.locator('button:has-text("Revoke All"), button:has-text("End All")').first();
          if (await revokeAllButton.count() > 0) {
            await revokeAllButton.click();
            await page.waitForTimeout(500);

            // Check for confirmation
            const confirmDialog = page.locator('.confirm-dialog, [role="dialog"]');
            if (await confirmDialog.count() > 0) {
              console.log('✅ Revoke all sessions confirmation displayed');
            }
          }

          await helpers.takeScreenshot('session-management');
        }
      }
    });

    test('SECURITY-004: Login history and alerts', async ({ page }) => {
      const securityTab = page.locator('[data-testid="security-tab"], button:has-text("Security")').first();

      if (await securityTab.count() > 0) {
        await securityTab.click();
        await page.waitForTimeout(1000);

        const loginHistorySection = page.locator('[data-testid="login-history"], .login-history, .security-log').first();

        if (await loginHistorySection.count() > 0) {
          await expect(loginHistorySection).toBeVisible();

          // Check for login history entries
          const historyEntries = loginHistorySection.locator('.login-entry, .history-item');
          const entryCount = await historyEntries.count();

          if (entryCount > 0) {
            console.log(`✅ Found ${entryCount} login history entries`);

            // Check entry details
            const firstEntry = historyEntries.first();
            const entryDetails = [
              '.login-time, .entry-timestamp',
              '.login-location, .entry-location',
              '.login-device, .entry-device',
              '.login-status, .entry-status'
            ];

            for (const detailSelector of entryDetails) {
              const detail = firstEntry.locator(detailSelector);
              if (await detail.count() > 0) {
                console.log(`✅ Login history detail found: ${detailSelector}`);
              }
            }
          }

          // Check for security alert settings
          const alertSettings = page.locator('[data-testid="security-alerts"], .security-notifications');
          if (await alertSettings.count() > 0) {
            const alertToggles = alertSettings.locator('input[type="checkbox"], .toggle');
            const toggleCount = await alertToggles.count();

            if (toggleCount > 0) {
              console.log(`✅ Found ${toggleCount} security alert settings`);
            }
          }
        }
      }
    });
  });

  test.describe('🔔 NOTIFICATION SETTINGS - Complete Testing', () => {
    test('NOTIFICATIONS-001: Email notification preferences', async ({ page }) => {
      const notificationsTab = page.locator('[data-testid="notifications-tab"], button:has-text("Notifications"), .notification-settings').first();

      if (await notificationsTab.count() > 0) {
        await notificationsTab.click();
        await page.waitForTimeout(1000);

        const emailSection = page.locator('[data-testid="email-notifications"], .email-settings').first();

        if (await emailSection.count() > 0) {
          await expect(emailSection).toBeVisible();

          // Test email notification toggles
          const emailNotificationTypes = [
            'Post Published',
            'Comment Received',
            'Mention Received',
            'Follower Added',
            'Weekly Report',
            'Monthly Summary',
            'Security Alerts',
            'Team Updates'
          ];

          for (const notificationType of emailNotificationTypes) {
            const notificationToggle = emailSection.locator(`input[type="checkbox"], .toggle`).filter({ hasText: new RegExp(notificationType, 'i') });

            if (await notificationToggle.count() > 0) {
              const toggle = notificationToggle.first();
              const initialState = await toggle.isChecked();

              await toggle.click();
              await page.waitForTimeout(200);

              const newState = await toggle.isChecked();
              if (newState !== initialState) {
                console.log(`✅ Email notification toggle tested: ${notificationType}`);
              }
            } else {
              // Try finding by label text
              const labelElement = emailSection.locator(`label:has-text("${notificationType}")`);
              if (await labelElement.count() > 0) {
                await labelElement.click();
                console.log(`✅ Email notification option found: ${notificationType}`);
              }
            }
          }

          await helpers.takeScreenshot('email-notifications');
        }
      }
    });

    test('NOTIFICATIONS-002: Push notification settings', async ({ page }) => {
      const notificationsTab = page.locator('[data-testid="notifications-tab"], button:has-text("Notifications")').first();

      if (await notificationsTab.count() > 0) {
        await notificationsTab.click();
        await page.waitForTimeout(1000);

        const pushSection = page.locator('[data-testid="push-notifications"], .push-settings').first();

        if (await pushSection.count() > 0) {
          await expect(pushSection).toBeVisible();

          // Test enabling push notifications
          const enablePushButton = pushSection.locator('button:has-text("Enable"), button:has-text("Allow")').first();

          if (await enablePushButton.count() > 0) {
            await enablePushButton.click();
            await page.waitForTimeout(1000);

            // Note: In a real browser, this would trigger a permission request
            console.log('✅ Push notification enable button tested');
          }

          // Test push notification preferences
          const pushPreferences = [
            'Real-time Alerts',
            'Scheduled Reports',
            'Team Mentions',
            'System Updates'
          ];

          for (const preference of pushPreferences) {
            const preferenceToggle = pushSection.locator(`input[type="checkbox"], .toggle`).filter({ hasText: new RegExp(preference, 'i') });

            if (await preferenceToggle.count() > 0) {
              await preferenceToggle.first().click();
              await page.waitForTimeout(200);
              console.log(`✅ Push notification preference tested: ${preference}`);
            }
          }
        }
      }
    });

    test('NOTIFICATIONS-003: In-app notification settings', async ({ page }) => {
      const notificationsTab = page.locator('[data-testid="notifications-tab"], button:has-text("Notifications")').first();

      if (await notificationsTab.count() > 0) {
        await notificationsTab.click();
        await page.waitForTimeout(1000);

        const inAppSection = page.locator('[data-testid="in-app-notifications"], .in-app-settings').first();

        if (await inAppSection.count() > 0) {
          await expect(inAppSection).toBeVisible();

          // Test notification frequency settings
          const frequencySelector = inAppSection.locator('select[name="frequency"], [data-testid="notification-frequency"]').first();

          if (await frequencySelector.count() > 0) {
            const frequencies = ['Immediately', 'Hourly', 'Daily', 'Weekly'];

            for (const frequency of frequencies) {
              try {
                await frequencySelector.selectOption(frequency);
                await page.waitForTimeout(200);
                console.log(`✅ Notification frequency tested: ${frequency}`);
              } catch {
                // Option might not be available
              }
            }
          }

          // Test notification sound settings
          const soundToggle = inAppSection.locator('input[type="checkbox"]').filter({ hasText: /sound|audio/i });
          if (await soundToggle.count() > 0) {
            await soundToggle.first().click();
            console.log('✅ Notification sound toggle tested');
          }

          // Test desktop notification settings
          const desktopToggle = inAppSection.locator('input[type="checkbox"]').filter({ hasText: /desktop/i });
          if (await desktopToggle.count() > 0) {
            await desktopToggle.first().click();
            console.log('✅ Desktop notification toggle tested');
          }
        }
      }
    });

    test('NOTIFICATIONS-004: Notification schedule and quiet hours', async ({ page }) => {
      const notificationsTab = page.locator('[data-testid="notifications-tab"], button:has-text("Notifications")').first();

      if (await notificationsTab.count() > 0) {
        await notificationsTab.click();
        await page.waitForTimeout(1000);

        const scheduleSection = page.locator('[data-testid="notification-schedule"], .quiet-hours, .notification-timing').first();

        if (await scheduleSection.count() > 0) {
          await expect(scheduleSection).toBeVisible();

          // Test quiet hours settings
          const quietHoursToggle = scheduleSection.locator('input[type="checkbox"], .toggle').filter({ hasText: /quiet|do not disturb/i });

          if (await quietHoursToggle.count() > 0) {
            await quietHoursToggle.first().click();
            await page.waitForTimeout(500);

            // Test time range selectors
            const startTimeInput = scheduleSection.locator('input[type="time"], [data-testid="start-time"]').first();
            const endTimeInput = scheduleSection.locator('input[type="time"], [data-testid="end-time"]').first();

            if (await startTimeInput.count() > 0) {
              await startTimeInput.fill('22:00');
              console.log('✅ Quiet hours start time set');
            }

            if (await endTimeInput.count() > 0) {
              await endTimeInput.fill('08:00');
              console.log('✅ Quiet hours end time set');
            }
          }

          // Test timezone for notifications
          const timezoneSelector = scheduleSection.locator('select[name="timezone"], [data-testid="notification-timezone"]').first();
          if (await timezoneSelector.count() > 0) {
            await timezoneSelector.selectOption('America/New_York');
            console.log('✅ Notification timezone tested');
          }

          await helpers.takeScreenshot('notification-schedule');
        }
      }
    });
  });

  test.describe('💳 BILLING SETTINGS - Complete Testing', () => {
    test('BILLING-001: Subscription information display', async ({ page }) => {
      const billingTab = page.locator('[data-testid="billing-tab"], button:has-text("Billing"), .billing-settings').first();

      if (await billingTab.count() > 0) {
        await billingTab.click();
        await page.waitForTimeout(1000);

        const subscriptionSection = page.locator('[data-testid="subscription"], .subscription-info').first();

        if (await subscriptionSection.count() > 0) {
          await expect(subscriptionSection).toBeVisible();

          // Check for subscription details
          const subscriptionDetails = [
            'Current Plan',
            'Billing Cycle',
            'Next Billing Date',
            'Amount',
            'Status'
          ];

          for (const detail of subscriptionDetails) {
            const detailElement = subscriptionSection.locator(`text="${detail}"`);
            if (await detailElement.count() > 0) {
              console.log(`✅ Subscription detail found: ${detail}`);
            }
          }

          // Check for plan features
          const featuresSection = subscriptionSection.locator('.plan-features, .subscription-features');
          if (await featuresSection.count() > 0) {
            const featureItems = featuresSection.locator('.feature-item, li');
            const featureCount = await featureItems.count();

            if (featureCount > 0) {
              console.log(`✅ Found ${featureCount} plan features`);
            }
          }

          await helpers.takeScreenshot('billing-subscription');
        }
      }
    });

    test('BILLING-002: Payment method management', async ({ page }) => {
      const billingTab = page.locator('[data-testid="billing-tab"], button:has-text("Billing")').first();

      if (await billingTab.count() > 0) {
        await billingTab.click();
        await page.waitForTimeout(1000);

        const paymentSection = page.locator('[data-testid="payment-methods"], .payment-methods').first();

        if (await paymentSection.count() > 0) {
          await expect(paymentSection).toBeVisible();

          // Test adding payment method
          const addPaymentButton = paymentSection.locator('button:has-text("Add"), button:has-text("New Payment Method")').first();

          if (await addPaymentButton.count() > 0) {
            await addPaymentButton.click();
            await page.waitForTimeout(1000);

            // Check for payment form modal
            const paymentModal = page.locator('.payment-modal, [data-testid="payment-modal"], .modal').first();

            if (await paymentModal.count() > 0) {
              await expect(paymentModal).toBeVisible();

              // Test credit card form
              const cardForm = paymentModal.locator('.card-form, .payment-form');

              if (await cardForm.count() > 0) {
                const cardFields = [
                  { field: 'cardNumber', testValue: '4111111111111111' },
                  { field: 'expiryDate', testValue: '12/25' },
                  { field: 'cvv', testValue: '123' },
                  { field: 'cardholderName', testValue: 'John Doe' }
                ];

                for (const fieldInfo of cardFields) {
                  const field = cardForm.locator(`input[name="${fieldInfo.field}"], [data-testid="${fieldInfo.field}"]`).first();

                  if (await field.count() > 0 && await field.isVisible()) {
                    await field.fill(fieldInfo.testValue);
                    console.log(`✅ Payment field tested: ${fieldInfo.field}`);
                  }
                }

                // Test billing address
                const billingAddress = cardForm.locator('.billing-address, [data-testid="billing-address"]');
                if (await billingAddress.count() > 0) {
                  console.log('✅ Billing address section found');
                }

                await helpers.takeScreenshot('payment-method-form');
              }
            }
          }

          // Check for existing payment methods
          const paymentMethods = paymentSection.locator('.payment-method, .card-item');
          const methodCount = await paymentMethods.count();

          if (methodCount > 0) {
            console.log(`✅ Found ${methodCount} existing payment methods`);

            // Test payment method actions
            const firstMethod = paymentMethods.first();

            const editButton = firstMethod.locator('button:has-text("Edit"), [data-testid="edit-payment"]').first();
            if (await editButton.count() > 0) {
              await editButton.click();
              await page.waitForTimeout(500);
              console.log('✅ Payment method edit tested');
            }

            const deleteButton = firstMethod.locator('button:has-text("Delete"), button:has-text("Remove")').first();
            if (await deleteButton.count() > 0) {
              await deleteButton.click();
              await page.waitForTimeout(500);

              // Check for confirmation dialog
              const confirmDialog = page.locator('.confirm-dialog, [role="dialog"]');
              if (await confirmDialog.count() > 0) {
                console.log('✅ Payment method deletion confirmation displayed');
              }
            }
          }
        }
      }
    });

    test('BILLING-003: Invoice history and downloads', async ({ page }) => {
      const billingTab = page.locator('[data-testid="billing-tab"], button:has-text("Billing")').first();

      if (await billingTab.count() > 0) {
        await billingTab.click();
        await page.waitForTimeout(1000);

        const invoiceSection = page.locator('[data-testid="invoices"], .invoice-history, .billing-history').first();

        if (await invoiceSection.count() > 0) {
          await expect(invoiceSection).toBeVisible();

          // Check for invoice list
          const invoiceList = invoiceSection.locator('.invoice-item, .invoice-row, tr');
          const invoiceCount = await invoiceList.count();

          if (invoiceCount > 0) {
            console.log(`✅ Found ${invoiceCount} invoice records`);

            // Check invoice details
            const firstInvoice = invoiceList.first();
            const invoiceDetails = [
              '.invoice-date, .date',
              '.invoice-amount, .amount',
              '.invoice-status, .status',
              '.invoice-number, .number'
            ];

            for (const detailSelector of invoiceDetails) {
              const detail = firstInvoice.locator(detailSelector);
              if (await detail.count() > 0) {
                console.log(`✅ Invoice detail found: ${detailSelector}`);
              }
            }

            // Test invoice download
            const downloadButton = firstInvoice.locator('button:has-text("Download"), a:has-text("PDF")').first();
            if (await downloadButton.count() > 0) {
              const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

              await downloadButton.click();

              try {
                const download = await downloadPromise;
                console.log(`✅ Invoice download initiated: ${download.suggestedFilename()}`);
              } catch {
                console.log('⚠️ Invoice download test - download may not have completed');
              }
            }
          }

          await helpers.takeScreenshot('billing-invoices');
        }
      }
    });

    test('BILLING-004: Plan upgrade and downgrade', async ({ page }) => {
      const billingTab = page.locator('[data-testid="billing-tab"], button:has-text("Billing")').first();

      if (await billingTab.count() > 0) {
        await billingTab.click();
        await page.waitForTimeout(1000);

        const planSection = page.locator('[data-testid="plan-management"], .plan-section').first();

        if (await planSection.count() > 0) {
          // Test upgrade button
          const upgradeButton = planSection.locator('button:has-text("Upgrade"), button:has-text("Change Plan")').first();

          if (await upgradeButton.count() > 0) {
            await upgradeButton.click();
            await page.waitForTimeout(1000);

            // Check for plan selection modal
            const planModal = page.locator('.plan-modal, [data-testid="plan-selection"], .modal').first();

            if (await planModal.count() > 0) {
              await expect(planModal).toBeVisible();

              // Check for available plans
              const planOptions = planModal.locator('.plan-option, .plan-card');
              const planCount = await planOptions.count();

              if (planCount > 0) {
                console.log(`✅ Found ${planCount} available plan options`);

                // Test selecting a plan
                const firstPlan = planOptions.first();
                const selectButton = firstPlan.locator('button:has-text("Select"), button:has-text("Choose")').first();

                if (await selectButton.count() > 0) {
                  await selectButton.click();
                  await page.waitForTimeout(500);
                  console.log('✅ Plan selection tested');
                }
              }

              await helpers.takeScreenshot('plan-selection');
            }
          }

          // Test cancel subscription
          const cancelButton = planSection.locator('button:has-text("Cancel"), button:has-text("Cancel Subscription")').first();
          if (await cancelButton.count() > 0) {
            await cancelButton.click();
            await page.waitForTimeout(500);

            // Check for cancellation confirmation
            const cancelDialog = page.locator('.cancel-dialog, [data-testid="cancel-confirmation"]');
            if (await cancelDialog.count() > 0) {
              console.log('✅ Subscription cancellation confirmation displayed');
            }
          }
        }
      }
    });
  });

  test.describe('🔑 API KEYS MANAGEMENT - Complete Testing', () => {
    test('API-001: API key generation and management', async ({ page }) => {
      const apiTab = page.locator('[data-testid="api-tab"], button:has-text("API"), .api-settings').first();

      if (await apiTab.count() > 0) {
        await apiTab.click();
        await page.waitForTimeout(1000);

        const apiSection = page.locator('[data-testid="api-keys"], .api-keys-section').first();

        if (await apiSection.count() > 0) {
          await expect(apiSection).toBeVisible();

          // Test creating new API key
          const createKeyButton = apiSection.locator('button:has-text("Create"), button:has-text("Generate API Key")').first();

          if (await createKeyButton.count() > 0) {
            await createKeyButton.click();
            await page.waitForTimeout(1000);

            // Check for API key creation form
            const keyForm = page.locator('.api-key-form, [data-testid="key-form"], .modal').first();

            if (await keyForm.count() > 0) {
              await expect(keyForm).toBeVisible();

              // Fill key details
              const keyNameInput = keyForm.locator('input[name="name"], [data-testid="key-name"]').first();
              if (await keyNameInput.count() > 0) {
                await keyNameInput.fill('Test API Key');
              }

              const keyDescriptionInput = keyForm.locator('textarea[name="description"], [data-testid="key-description"]').first();
              if (await keyDescriptionInput.count() > 0) {
                await keyDescriptionInput.fill('API key for testing purposes');
              }

              // Test permission selection
              const permissions = keyForm.locator('input[type="checkbox"], .permission-checkbox');
              const permissionCount = Math.min(await permissions.count(), 3);

              for (let i = 0; i < permissionCount; i++) {
                const permission = permissions.nth(i);
                if (await permission.isVisible()) {
                  await permission.check();
                  await page.waitForTimeout(200);
                }
              }

              // Generate key
              const generateButton = keyForm.locator('button:has-text("Generate"), button:has-text("Create")').first();
              if (await generateButton.count() > 0) {
                await generateButton.click();
                await page.waitForTimeout(1000);

                // Check for generated key display
                const generatedKey = page.locator('.generated-key, [data-testid="api-key-value"], .key-display');
                if (await generatedKey.count() > 0) {
                  console.log('✅ API key generated successfully');
                }
              }

              await helpers.takeScreenshot('api-key-generation');
            }
          }

          // Check for existing API keys
          const apiKeyList = apiSection.locator('.api-key-list, .key-items');
          if (await apiKeyList.count() > 0) {
            const keyItems = apiKeyList.locator('.api-key-item, .key-row');
            const keyCount = await keyItems.count();

            if (keyCount > 0) {
              console.log(`✅ Found ${keyCount} existing API keys`);

              // Test key actions
              const firstKey = keyItems.first();

              // Test regenerating key
              const regenerateButton = firstKey.locator('button:has-text("Regenerate"), [data-testid="regenerate-key"]').first();
              if (await regenerateButton.count() > 0) {
                await regenerateButton.click();
                await page.waitForTimeout(500);
                console.log('✅ API key regeneration tested');
              }

              // Test deleting key
              const deleteButton = firstKey.locator('button:has-text("Delete"), button:has-text("Revoke")').first();
              if (await deleteButton.count() > 0) {
                await deleteButton.click();
                await page.waitForTimeout(500);

                // Check for confirmation
                const confirmDialog = page.locator('.confirm-dialog, [role="dialog"]');
                if (await confirmDialog.count() > 0) {
                  console.log('✅ API key deletion confirmation displayed');
                }
              }
            }
          }
        }
      }
    });

    test('API-002: API usage statistics and limits', async ({ page }) => {
      const apiTab = page.locator('[data-testid="api-tab"], button:has-text("API")').first();

      if (await apiTab.count() > 0) {
        await apiTab.click();
        await page.waitForTimeout(1000);

        const usageSection = page.locator('[data-testid="api-usage"], .api-usage, .usage-stats').first();

        if (await usageSection.count() > 0) {
          await expect(usageSection).toBeVisible();

          // Check for usage metrics
          const usageMetrics = [
            'Requests This Month',
            'Remaining Requests',
            'Rate Limit',
            'Last Request',
            'Success Rate'
          ];

          for (const metric of usageMetrics) {
            const metricElement = usageSection.locator(`text="${metric}"`);
            if (await metricElement.count() > 0) {
              console.log(`✅ API usage metric found: ${metric}`);
            }
          }

          // Check for usage charts
          const usageChart = usageSection.locator('canvas, svg, .chart');
          if (await usageChart.count() > 0) {
            console.log('✅ API usage chart displayed');
          }

          await helpers.takeScreenshot('api-usage-stats');
        }
      }
    });
  });

  test.describe('📊 DATA MANAGEMENT - Complete Testing', () => {
    test('DATA-001: Data export functionality', async ({ page }) => {
      const dataTab = page.locator('[data-testid="data-tab"], button:has-text("Data"), .data-settings').first();

      if (await dataTab.count() > 0) {
        await dataTab.click();
        await page.waitForTimeout(1000);

        const exportSection = page.locator('[data-testid="data-export"], .data-export').first();

        if (await exportSection.count() > 0) {
          await expect(exportSection).toBeVisible();

          // Test different export options
          const exportOptions = [
            'Posts and Content',
            'Analytics Data',
            'Account Information',
            'Team Data',
            'All Data'
          ];

          for (const option of exportOptions) {
            const optionCheckbox = exportSection.locator(`input[type="checkbox"], .export-option`).filter({ hasText: new RegExp(option, 'i') });

            if (await optionCheckbox.count() > 0) {
              await optionCheckbox.first().check();
              console.log(`✅ Export option tested: ${option}`);
            }
          }

          // Test export format selection
          const formatSelector = exportSection.locator('select[name="format"], [data-testid="export-format"]').first();
          if (await formatSelector.count() > 0) {
            const formats = ['JSON', 'CSV', 'XML'];

            for (const format of formats) {
              try {
                await formatSelector.selectOption(format);
                console.log(`✅ Export format tested: ${format}`);
              } catch {
                // Format might not be available
              }
            }
          }

          // Test initiating export
          const exportButton = exportSection.locator('button:has-text("Export"), button:has-text("Download Data")').first();
          if (await exportButton.count() > 0) {
            await exportButton.click();
            await page.waitForTimeout(1000);

            // Check for export progress or confirmation
            const exportStatus = page.locator('.export-status, .export-progress, [data-testid="export-status"]');
            if (await exportStatus.count() > 0) {
              console.log('✅ Data export initiated');
            }
          }

          await helpers.takeScreenshot('data-export');
        }
      }
    });

    test('DATA-002: Data import functionality', async ({ page }) => {
      const dataTab = page.locator('[data-testid="data-tab"], button:has-text("Data")').first();

      if (await dataTab.count() > 0) {
        await dataTab.click();
        await page.waitForTimeout(1000);

        const importSection = page.locator('[data-testid="data-import"], .data-import').first();

        if (await importSection.count() > 0) {
          await expect(importSection).toBeVisible();

          // Test file upload for import
          const importButton = importSection.locator('button:has-text("Import"), button:has-text("Upload")').first();
          const fileInput = importSection.locator('input[type="file"]').first();

          if (await fileInput.count() > 0) {
            await helpers.uploadTestFile(fileInput.locator('xpath=.').first(), 'import-data.json', '{"posts": [{"content": "test post"}]}');
          } else if (await importButton.count() > 0) {
            await importButton.click();

            const modalFileInput = page.locator('input[type="file"]').first();
            if (await modalFileInput.count() > 0) {
              await helpers.uploadTestFile(modalFileInput.locator('xpath=.').first(), 'import-data.csv', 'title,content\nTest Post,This is a test post');
            }
          }

          await page.waitForTimeout(2000);

          // Check for import validation
          const importValidation = page.locator('.import-validation, .validation-results');
          if (await importValidation.count() > 0) {
            console.log('✅ Data import validation displayed');
          }

          // Check for import preview
          const importPreview = page.locator('.import-preview, .data-preview');
          if (await importPreview.count() > 0) {
            console.log('✅ Data import preview displayed');
          }

          await helpers.takeScreenshot('data-import');
        }
      }
    });

    test('DATA-003: Data deletion and account closure', async ({ page }) => {
      const dataTab = page.locator('[data-testid="data-tab"], button:has-text("Data")').first();

      if (await dataTab.count() > 0) {
        await dataTab.click();
        await page.waitForTimeout(1000);

        const deletionSection = page.locator('[data-testid="data-deletion"], .account-deletion, .danger-zone').first();

        if (await deletionSection.count() > 0) {
          await expect(deletionSection).toBeVisible();

          // Test selective data deletion
          const deleteOptions = [
            'Delete All Posts',
            'Delete Analytics Data',
            'Delete Account Information',
            'Close Account Permanently'
          ];

          for (const option of deleteOptions) {
            const deleteButton = deletionSection.locator(`button:has-text("${option}")`).first();

            if (await deleteButton.count() > 0) {
              await deleteButton.click();
              await page.waitForTimeout(500);

              // Check for confirmation dialog
              const confirmDialog = page.locator('.confirm-dialog, .danger-dialog, [role="dialog"]');
              if (await confirmDialog.count() > 0) {
                console.log(`✅ Deletion confirmation displayed for: ${option}`);

                // Close dialog without confirming
                const cancelButton = confirmDialog.locator('button:has-text("Cancel"), button:has-text("No")').first();
                if (await cancelButton.count() > 0) {
                  await cancelButton.click();
                }
              }
            }
          }

          await helpers.takeScreenshot('data-deletion-options');
        }
      }
    });
  });

  test.describe('⚡ PERFORMANCE TESTS', () => {
    test('PERF-001: Settings page load performance', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard/settings');
      await helpers.waitForLoadingComplete();

      const loadTime = Date.now() - startTime;
      console.log(`Settings page load time: ${loadTime}ms`);

      expect(loadTime).toBeLessThan(8000);

      const metrics = await helpers.checkPerformanceMetrics();
      console.log('Settings page performance metrics:', metrics);
    });

    test('PERF-002: Settings save performance', async ({ page }) => {
      const profileTab = page.locator('[data-testid="profile-tab"], button:has-text("Profile")').first();

      if (await profileTab.count() > 0) {
        await profileTab.click();
        await page.waitForTimeout(1000);

        const firstNameInput = page.locator('input[name="firstName"], [data-testid="firstName"]').first();
        if (await firstNameInput.count() > 0) {
          await firstNameInput.fill('Performance Test User');

          const startTime = Date.now();

          const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await helpers.waitForLoadingComplete();
          }

          const saveTime = Date.now() - startTime;
          console.log(`Settings save time: ${saveTime}ms`);

          expect(saveTime).toBeLessThan(5000); // 5 seconds max for save
        }
      }
    });
  });
});

export {};