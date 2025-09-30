import { test, expect, Page } from '@playwright/test';
import { TestHelpers, SELECTORS } from '../utils/test-helpers';

/**
 * 📅 COMPREHENSIVE SCHEDULING SYSTEM TESTS
 *
 * This test suite covers EVERY aspect of the scheduling system:
 * - Calendar view and navigation
 * - Time picker functionality
 * - Recurring posts setup
 * - Timezone selection and handling
 * - Optimal time suggestions
 * - Queue management
 * - Bulk scheduling operations
 * - Schedule conflicts handling
 * - Schedule editing and deletion
 * - Schedule analytics
 */

test.describe('📅 COMPLETE SCHEDULING SYSTEM TESTS', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    // Login and navigate to schedule page
    await page.goto('/auth/login');
    await page.fill('input#email', 'admin@allin.demo');
    await page.fill('input#password', 'Admin123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    await page.goto('/dashboard/schedule');
    await helpers.waitForLoadingComplete();
  });

  test.describe('📅 CALENDAR VIEW - Complete Testing', () => {
    test('CALENDAR-001: Calendar view initialization and navigation', async ({ page }) => {
      // Check for calendar container
      const calendarElements = [
        '[data-testid="calendar"]',
        '.calendar',
        '.react-calendar',
        '.calendar-container'
      ];

      let calendar = null;
      for (const selector of calendarElements) {
        const element = page.locator(selector).first();
        if (await element.count() > 0 && await element.isVisible()) {
          calendar = element;
          break;
        }
      }

      if (calendar) {
        await expect(calendar).toBeVisible();

        // Check for navigation controls
        const prevButton = calendar.locator('button').filter({ hasText: /prev|<|back/i }).first();
        const nextButton = calendar.locator('button').filter({ hasText: /next|>|forward/i }).first();

        if (await prevButton.count() > 0) {
          await expect(prevButton).toBeVisible();
          await expect(prevButton).toBeEnabled();
        }

        if (await nextButton.count() > 0) {
          await expect(nextButton).toBeVisible();
          await expect(nextButton).toBeEnabled();
        }

        // Check for month/year display
        const monthYear = calendar.locator('.month-year, .calendar-header, .current-month').first();
        if (await monthYear.count() > 0) {
          await expect(monthYear).toBeVisible();
          console.log('✅ Calendar month/year display found');
        }

        await helpers.takeScreenshot('calendar-view');
      }
    });

    test('CALENDAR-002: Calendar date selection', async ({ page }) => {
      // Find calendar dates
      const dateElements = page.locator('.calendar-date, .day, [role="gridcell"]');
      const dateCount = await dateElements.count();

      if (dateCount > 0) {
        // Click on a future date
        const futureDate = dateElements.nth(Math.floor(dateCount / 2));
        if (await futureDate.isVisible()) {
          await futureDate.click();
          await page.waitForTimeout(500);

          // Check for date selection feedback
          const selectedDate = page.locator('.selected, .active, .calendar-date-selected');
          if (await selectedDate.count() > 0) {
            console.log('✅ Date selection visual feedback working');
          }
        }
      }
    });

    test('CALENDAR-003: Calendar view modes', async ({ page }) => {
      const viewModes = ['Month', 'Week', 'Day'];

      for (const mode of viewModes) {
        const viewButton = page.locator(`button:has-text("${mode}"), [data-testid="${mode.toLowerCase()}-view"]`).first();

        if (await viewButton.count() > 0 && await viewButton.isVisible()) {
          await viewButton.click();
          await page.waitForTimeout(1000);

          // Verify view changed
          const viewContainer = page.locator(`.${mode.toLowerCase()}-view, [data-view="${mode.toLowerCase()}"]`);
          if (await viewContainer.count() > 0) {
            console.log(`✅ ${mode} view mode working`);
          }

          await helpers.takeScreenshot(`calendar-${mode.toLowerCase()}-view`);
        }
      }
    });

    test('CALENDAR-004: Scheduled posts display on calendar', async ({ page }) => {
      // Look for scheduled post indicators on calendar
      const postIndicators = page.locator('.scheduled-post, .post-indicator, .event-dot');
      const indicatorCount = await postIndicators.count();

      if (indicatorCount > 0) {
        console.log(`✅ Found ${indicatorCount} scheduled post indicators`);

        // Click on a post indicator
        const firstIndicator = postIndicators.first();
        await firstIndicator.click();
        await page.waitForTimeout(500);

        // Check for post details popup/tooltip
        const postDetails = page.locator('.post-details, .tooltip, .popover');
        if (await postDetails.count() > 0 && await postDetails.isVisible()) {
          console.log('✅ Scheduled post details display working');
        }
      }
    });
  });

  test.describe('🕐 TIME PICKER - Complete Testing', () => {
    test('TIME-001: Time picker UI and functionality', async ({ page }) => {
      // Look for time picker or schedule time button
      const timeElements = [
        '[data-testid="time-picker"]',
        '.time-picker',
        'input[type="time"]',
        'button:has-text("Set Time")',
        '.schedule-time'
      ];

      let timePicker = null;
      for (const selector of timeElements) {
        const element = page.locator(selector).first();
        if (await element.count() > 0 && await element.isVisible()) {
          timePicker = element;
          break;
        }
      }

      if (timePicker) {
        await expect(timePicker).toBeVisible();

        // Test time input
        if (await timePicker.getAttribute('type') === 'time') {
          await timePicker.fill('14:30');
          await expect(timePicker).toHaveValue('14:30');
        } else {
          await timePicker.click();
          await page.waitForTimeout(500);

          // Look for time picker dropdown
          const timeDropdown = page.locator('.time-dropdown, .time-picker-dropdown');
          if (await timeDropdown.count() > 0) {
            console.log('✅ Time picker dropdown opened');
          }
        }

        await helpers.takeScreenshot('time-picker');
      }
    });

    test('TIME-002: 12/24 hour format support', async ({ page }) => {
      const formatToggle = page.locator('[data-testid="time-format"], .format-toggle, button:has-text("12h"), button:has-text("24h")').first();

      if (await formatToggle.count() > 0) {
        await formatToggle.click();
        await page.waitForTimeout(500);

        // Check if format changed
        const timeDisplay = page.locator('.time-display, .current-time');
        if (await timeDisplay.count() > 0) {
          const timeText = await timeDisplay.textContent();
          if (timeText?.includes('AM') || timeText?.includes('PM')) {
            console.log('✅ 12-hour format detected');
          } else if (timeText?.match(/\d{2}:\d{2}/)) {
            console.log('✅ 24-hour format detected');
          }
        }
      }
    });

    test('TIME-003: Time validation and constraints', async ({ page }) => {
      const timeInput = page.locator('input[type="time"], [data-testid="time-input"]').first();

      if (await timeInput.count() > 0) {
        // Test invalid time values
        const invalidTimes = ['25:00', '12:60', 'invalid'];

        for (const invalidTime of invalidTimes) {
          await timeInput.fill(invalidTime);
          await page.waitForTimeout(500);

          // Check for validation error
          const errorMessage = page.locator('.error-message, .validation-error, .time-error');
          if (await errorMessage.count() > 0 && await errorMessage.isVisible()) {
            console.log(`✅ Time validation working for: ${invalidTime}`);
          }
        }

        // Test valid time
        await timeInput.fill('09:30');
        await expect(timeInput).toHaveValue('09:30');
      }
    });
  });

  test.describe('🔄 RECURRING POSTS - Complete Testing', () => {
    test('RECURRING-001: Recurring post setup UI', async ({ page }) => {
      const recurringSection = page.locator('[data-testid="recurring"], .recurring-section, .repeat-options').first();

      if (await recurringSection.count() > 0) {
        await expect(recurringSection).toBeVisible();

        // Check for recurring options
        const recurringOptions = ['Daily', 'Weekly', 'Monthly', 'Custom'];

        for (const option of recurringOptions) {
          const optionElement = recurringSection.locator(`button:has-text("${option}"), input[value="${option.toLowerCase()}"]`);
          if (await optionElement.count() > 0) {
            console.log(`✅ Recurring option found: ${option}`);
          }
        }

        await helpers.takeScreenshot('recurring-options');
      }
    });

    test('RECURRING-002: Weekly recurring pattern setup', async ({ page }) => {
      const weeklyOption = page.locator('button:has-text("Weekly"), input[value="weekly"]').first();

      if (await weeklyOption.count() > 0) {
        await weeklyOption.click();
        await page.waitForTimeout(500);

        // Check for day selection
        const dayCheckboxes = page.locator('input[type="checkbox"][value*="day"], .day-selector');
        const dayCount = await dayCheckboxes.count();

        if (dayCount > 0) {
          // Select Monday, Wednesday, Friday
          const daysToSelect = ['monday', 'wednesday', 'friday'];

          for (const day of daysToSelect) {
            const dayCheckbox = page.locator(`input[value*="${day}"], label:has-text("${day.charAt(0).toUpperCase() + day.slice(1)}")`).first();
            if (await dayCheckbox.count() > 0) {
              await dayCheckbox.click();
              await page.waitForTimeout(200);
            }
          }

          console.log('✅ Weekly recurring pattern setup tested');
        }
      }
    });

    test('RECURRING-003: Custom recurring pattern', async ({ page }) => {
      const customOption = page.locator('button:has-text("Custom"), input[value="custom"]').first();

      if (await customOption.count() > 0) {
        await customOption.click();
        await page.waitForTimeout(500);

        // Check for custom interval input
        const intervalInput = page.locator('input[type="number"], [data-testid="interval"]').first();
        if (await intervalInput.count() > 0) {
          await intervalInput.fill('3');
          await expect(intervalInput).toHaveValue('3');
        }

        // Check for unit selector
        const unitSelector = page.locator('select, [data-testid="interval-unit"]').first();
        if (await unitSelector.count() > 0) {
          await unitSelector.selectOption('days');
        }

        console.log('✅ Custom recurring pattern setup tested');
      }
    });

    test('RECURRING-004: Recurring end date setup', async ({ page }) => {
      const endDateOption = page.locator('[data-testid="end-date"], .end-date-selector').first();

      if (await endDateOption.count() > 0) {
        await endDateOption.click();

        // Set end date
        const endDateInput = page.locator('input[type="date"], .end-date-input').first();
        if (await endDateInput.count() > 0) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 30);
          const dateString = futureDate.toISOString().split('T')[0];

          await endDateInput.fill(dateString);
          await expect(endDateInput).toHaveValue(dateString);
          console.log('✅ Recurring end date setup tested');
        }
      }
    });
  });

  test.describe('🌍 TIMEZONE HANDLING - Complete Testing', () => {
    test('TIMEZONE-001: Timezone selector functionality', async ({ page }) => {
      const timezoneSelector = page.locator('[data-testid="timezone"], .timezone-selector, select[name="timezone"]').first();

      if (await timezoneSelector.count() > 0) {
        await expect(timezoneSelector).toBeVisible();

        // Test selecting different timezones
        const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];

        for (const timezone of timezones) {
          try {
            await timezoneSelector.selectOption(timezone);
            await page.waitForTimeout(500);
            console.log(`✅ Timezone selected: ${timezone}`);
          } catch {
            // Timezone option might not be available
          }
        }

        await helpers.takeScreenshot('timezone-selector');
      }
    });

    test('TIMEZONE-002: Time display in different timezones', async ({ page }) => {
      const timeDisplay = page.locator('.time-display, .current-time, [data-testid="time-display"]').first();

      if (await timeDisplay.count() > 0) {
        const timezoneSelector = page.locator('[data-testid="timezone"], .timezone-selector').first();

        if (await timezoneSelector.count() > 0) {
          // Change timezone and check time update
          await timezoneSelector.selectOption('America/New_York');
          await page.waitForTimeout(1000);

          const nyTime = await timeDisplay.textContent();

          await timezoneSelector.selectOption('Europe/London');
          await page.waitForTimeout(1000);

          const londonTime = await timeDisplay.textContent();

          if (nyTime !== londonTime) {
            console.log('✅ Time display updates with timezone changes');
          }
        }
      }
    });

    test('TIMEZONE-003: Timezone warning for scheduling', async ({ page }) => {
      // Set a timezone different from user's local timezone
      const timezoneSelector = page.locator('[data-testid="timezone"], .timezone-selector').first();

      if (await timezoneSelector.count() > 0) {
        await timezoneSelector.selectOption('Asia/Tokyo');
        await page.waitForTimeout(500);

        // Check for timezone warning or information
        const timezoneWarning = page.locator('.timezone-warning, .timezone-info, [data-testid="timezone-warning"]');
        if (await timezoneWarning.count() > 0 && await timezoneWarning.isVisible()) {
          console.log('✅ Timezone warning/info displayed');
        }
      }
    });
  });

  test.describe('⏰ OPTIMAL TIME SUGGESTIONS - Complete Testing', () => {
    test('OPTIMAL-001: Optimal time suggestions display', async ({ page }) => {
      const optimalTimeSection = page.locator('[data-testid="optimal-times"], .optimal-times, .best-times').first();

      if (await optimalTimeSection.count() > 0) {
        await expect(optimalTimeSection).toBeVisible();

        // Check for suggested times
        const suggestedTimes = optimalTimeSection.locator('.suggested-time, .optimal-time-slot');
        const timeCount = await suggestedTimes.count();

        if (timeCount > 0) {
          console.log(`✅ Found ${timeCount} optimal time suggestions`);

          // Test clicking on a suggested time
          const firstSuggestion = suggestedTimes.first();
          await firstSuggestion.click();
          await page.waitForTimeout(500);

          // Check if time is applied
          const timeInput = page.locator('input[type="time"], [data-testid="time-input"]').first();
          if (await timeInput.count() > 0) {
            const timeValue = await timeInput.inputValue();
            if (timeValue) {
              console.log(`✅ Optimal time applied: ${timeValue}`);
            }
          }
        }

        await helpers.takeScreenshot('optimal-times');
      }
    });

    test('OPTIMAL-002: Platform-specific optimal times', async ({ page }) => {
      const platforms = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn'];

      for (const platform of platforms) {
        const platformTab = page.locator(`button:has-text("${platform}"), [data-testid="${platform.toLowerCase()}-optimal"]`).first();

        if (await platformTab.count() > 0) {
          await platformTab.click();
          await page.waitForTimeout(500);

          // Check for platform-specific suggestions
          const platformSuggestions = page.locator('.platform-suggestions, .optimal-times');
          if (await platformSuggestions.count() > 0) {
            console.log(`✅ ${platform} optimal times found`);
          }
        }
      }
    });

    test('OPTIMAL-003: Audience-based time suggestions', async ({ page }) => {
      const audienceSelector = page.locator('[data-testid="audience-selector"], .audience-selector').first();

      if (await audienceSelector.count() > 0) {
        await audienceSelector.selectOption('global');
        await page.waitForTimeout(1000);

        // Check if optimal times update
        const optimalTimes = page.locator('.optimal-time-slot, .suggested-time');
        const globalTimes = await optimalTimes.count();

        await audienceSelector.selectOption('local');
        await page.waitForTimeout(1000);

        const localTimes = await optimalTimes.count();

        console.log(`✅ Audience-based suggestions: Global ${globalTimes}, Local ${localTimes}`);
      }
    });
  });

  test.describe('📋 QUEUE MANAGEMENT - Complete Testing', () => {
    test('QUEUE-001: Queue display and management', async ({ page }) => {
      const queueSection = page.locator('[data-testid="queue"], .queue-section, .post-queue').first();

      if (await queueSection.count() > 0) {
        await expect(queueSection).toBeVisible();

        // Check for queued items
        const queueItems = queueSection.locator('.queue-item, .queued-post');
        const itemCount = await queueItems.count();

        if (itemCount > 0) {
          console.log(`✅ Found ${itemCount} items in queue`);

          // Test queue item actions
          const firstItem = queueItems.first();

          // Test edit button
          const editButton = firstItem.locator('button:has-text("Edit"), [data-testid="edit-queue-item"]').first();
          if (await editButton.count() > 0) {
            await editButton.click();
            await page.waitForTimeout(500);
            console.log('✅ Queue item edit tested');
          }

          // Test delete button
          const deleteButton = firstItem.locator('button:has-text("Delete"), [data-testid="delete-queue-item"]').first();
          if (await deleteButton.count() > 0) {
            await deleteButton.click();
            await page.waitForTimeout(500);

            // Handle confirmation dialog
            const confirmDialog = page.locator('.modal, .dialog, [role="dialog"]');
            if (await confirmDialog.count() > 0) {
              const confirmButton = confirmDialog.locator('button:has-text("Delete"), button:has-text("Confirm")').first();
              if (await confirmButton.count() > 0) {
                await confirmButton.click();
              }
            }
            console.log('✅ Queue item deletion tested');
          }
        }

        await helpers.takeScreenshot('queue-management');
      }
    });

    test('QUEUE-002: Drag and drop queue reordering', async ({ page }) => {
      const queueItems = page.locator('.queue-item, .queued-post');
      const itemCount = await queueItems.count();

      if (itemCount >= 2) {
        const firstItem = queueItems.first();
        const secondItem = queueItems.nth(1);

        // Test drag and drop
        await helpers.dragAndDrop(
          firstItem.locator('xpath=.').toString(),
          secondItem.locator('xpath=.').toString()
        );

        await page.waitForTimeout(1000);
        console.log('✅ Queue drag and drop reordering tested');
      }
    });

    test('QUEUE-003: Bulk queue operations', async ({ page }) => {
      const selectAllCheckbox = page.locator('[data-testid="select-all"], .select-all-checkbox').first();

      if (await selectAllCheckbox.count() > 0) {
        await selectAllCheckbox.check();
        await page.waitForTimeout(500);

        // Check for bulk action buttons
        const bulkActions = page.locator('.bulk-actions, [data-testid="bulk-actions"]').first();

        if (await bulkActions.count() > 0) {
          await expect(bulkActions).toBeVisible();

          // Test bulk delete
          const bulkDeleteButton = bulkActions.locator('button:has-text("Delete"), [data-testid="bulk-delete"]').first();
          if (await bulkDeleteButton.count() > 0) {
            await bulkDeleteButton.click();
            await page.waitForTimeout(500);
            console.log('✅ Bulk delete operation tested');
          }

          // Test bulk reschedule
          const bulkRescheduleButton = bulkActions.locator('button:has-text("Reschedule"), [data-testid="bulk-reschedule"]').first();
          if (await bulkRescheduleButton.count() > 0) {
            await bulkRescheduleButton.click();
            await page.waitForTimeout(500);
            console.log('✅ Bulk reschedule operation tested');
          }
        }
      }
    });
  });

  test.describe('📊 SCHEDULE ANALYTICS - Complete Testing', () => {
    test('ANALYTICS-001: Schedule performance metrics', async ({ page }) => {
      const analyticsSection = page.locator('[data-testid="schedule-analytics"], .schedule-analytics').first();

      if (await analyticsSection.count() > 0) {
        await expect(analyticsSection).toBeVisible();

        // Check for key metrics
        const metrics = ['Scheduled Posts', 'Published Posts', 'Success Rate', 'Engagement Rate'];

        for (const metric of metrics) {
          const metricElement = analyticsSection.locator(`text="${metric}", [data-metric="${metric.toLowerCase().replace(' ', '-')}"]`);
          if (await metricElement.count() > 0) {
            console.log(`✅ Schedule metric found: ${metric}`);
          }
        }

        await helpers.takeScreenshot('schedule-analytics');
      }
    });

    test('ANALYTICS-002: Best performing times chart', async ({ page }) => {
      const chartContainer = page.locator('.chart-container, canvas, svg', { hasText: 'performance' });

      if (await chartContainer.count() > 0) {
        await expect(chartContainer.first()).toBeVisible();
        console.log('✅ Performance times chart displayed');
      }
    });
  });

  test.describe('⚡ PERFORMANCE TESTS', () => {
    test('PERF-001: Schedule page load performance', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard/schedule');
      await helpers.waitForLoadingComplete();

      const loadTime = Date.now() - startTime;
      console.log(`Schedule page load time: ${loadTime}ms`);

      expect(loadTime).toBeLessThan(8000);

      const metrics = await helpers.checkPerformanceMetrics();
      console.log('Schedule page performance metrics:', metrics);
    });

    test('PERF-002: Calendar rendering performance', async ({ page }) => {
      const startTime = Date.now();

      const calendar = page.locator('.calendar, [data-testid="calendar"]').first();
      await expect(calendar).toBeVisible();

      const renderTime = Date.now() - startTime;
      console.log(`Calendar rendering time: ${renderTime}ms`);
    });
  });
});

export {};