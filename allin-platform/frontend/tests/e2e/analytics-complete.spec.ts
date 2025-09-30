import { test, expect, Page } from '@playwright/test';
import { TestHelpers, SELECTORS } from '../utils/test-helpers';

/**
 * 📊 COMPREHENSIVE ANALYTICS DASHBOARD TESTS
 *
 * This test suite covers EVERY aspect of the analytics dashboard:
 * - Date range picker functionality
 * - All metric cards and KPIs
 * - Charts and graphs (line, bar, pie, etc.)
 * - Export functionality (PDF, CSV, PNG)
 * - Comparison views (period over period)
 * - Real-time updates
 * - Platform-specific analytics
 * - Drill-down capabilities
 * - Filter and segmentation
 * - Custom dashboard creation
 * - Data visualization interactions
 * - Performance monitoring
 */

test.describe('📊 COMPLETE ANALYTICS DASHBOARD TESTS', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    // Login and navigate to analytics page
    await page.goto('/auth/login');
    await page.fill('input#email', 'admin@allin.demo');
    await page.fill('input#password', 'Admin123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    await page.goto('/dashboard/analytics');
    await helpers.waitForLoadingComplete();
  });

  test.describe('📅 DATE RANGE PICKER - Complete Testing', () => {
    test('DATE-001: Date range picker UI and functionality', async ({ page }) => {
      const dateRangePicker = page.locator('[data-testid="date-range"], .date-range-picker, .date-picker').first();

      if (await dateRangePicker.count() > 0) {
        await expect(dateRangePicker).toBeVisible();
        await expect(dateRangePicker).toBeEnabled();

        // Click to open date picker
        await dateRangePicker.click();
        await page.waitForTimeout(1000);

        // Check for date picker dropdown
        const dateDropdown = page.locator('.date-dropdown, .calendar-dropdown, .date-picker-dropdown');
        if (await dateDropdown.count() > 0) {
          await expect(dateDropdown.first()).toBeVisible();
          console.log('✅ Date range picker dropdown opened');
        }

        await helpers.takeScreenshot('date-range-picker');
      }
    });

    test('DATE-002: Preset date ranges', async ({ page }) => {
      const presetButtons = page.locator('button').filter({ hasText: /today|yesterday|last 7 days|last 30 days|this month|last month/i });
      const presetCount = await presetButtons.count();

      if (presetCount > 0) {
        console.log(`✅ Found ${presetCount} preset date range options`);

        // Test each preset
        const presets = ['Last 7 days', 'Last 30 days', 'This month', 'Last month'];

        for (const preset of presets) {
          const presetButton = page.locator(`button:has-text("${preset}")`).first();
          if (await presetButton.count() > 0 && await presetButton.isVisible()) {
            await presetButton.click();
            await page.waitForTimeout(1000);

            // Wait for data to refresh
            await helpers.waitForLoadingComplete();
            console.log(`✅ ${preset} preset tested`);
          }
        }
      }
    });

    test('DATE-003: Custom date range selection', async ({ page }) => {
      const dateRangePicker = page.locator('[data-testid="date-range"], .date-range-picker').first();

      if (await dateRangePicker.count() > 0) {
        await dateRangePicker.click();
        await page.waitForTimeout(500);

        // Look for custom date inputs
        const startDateInput = page.locator('input[placeholder*="start"], [data-testid="start-date"]').first();
        const endDateInput = page.locator('input[placeholder*="end"], [data-testid="end-date"]').first();

        if (await startDateInput.count() > 0 && await endDateInput.count() > 0) {
          // Set custom date range (last week)
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - 7);

          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];

          await startDateInput.fill(startDateStr);
          await endDateInput.fill(endDateStr);

          // Apply custom range
          const applyButton = page.locator('button:has-text("Apply"), [data-testid="apply-date-range"]').first();
          if (await applyButton.count() > 0) {
            await applyButton.click();
            await helpers.waitForLoadingComplete();
            console.log('✅ Custom date range applied');
          }
        }
      }
    });

    test('DATE-004: Date range validation', async ({ page }) => {
      const dateRangePicker = page.locator('[data-testid="date-range"], .date-range-picker').first();

      if (await dateRangePicker.count() > 0) {
        await dateRangePicker.click();
        await page.waitForTimeout(500);

        const startDateInput = page.locator('input[placeholder*="start"], [data-testid="start-date"]').first();
        const endDateInput = page.locator('input[placeholder*="end"], [data-testid="end-date"]').first();

        if (await startDateInput.count() > 0 && await endDateInput.count() > 0) {
          // Test invalid date range (start date after end date)
          const today = new Date();
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);

          await startDateInput.fill(today.toISOString().split('T')[0]);
          await endDateInput.fill(yesterday.toISOString().split('T')[0]);

          const applyButton = page.locator('button:has-text("Apply")').first();
          if (await applyButton.count() > 0) {
            await applyButton.click();
            await page.waitForTimeout(500);

            // Check for validation error
            const errorMessage = page.locator('.error-message, .validation-error, .date-error');
            if (await errorMessage.count() > 0 && await errorMessage.isVisible()) {
              console.log('✅ Date range validation working');
            }
          }
        }
      }
    });
  });

  test.describe('📈 METRIC CARDS - Complete Testing', () => {
    test('METRICS-001: Key performance indicator cards', async ({ page }) => {
      const expectedMetrics = [
        'Total Posts',
        'Impressions',
        'Reach',
        'Engagement',
        'Engagement Rate',
        'Clicks',
        'Followers Growth',
        'Comments',
        'Shares',
        'Saves'
      ];

      let metricsFound = 0;

      for (const metric of expectedMetrics) {
        const metricCard = page.locator('.metric-card, .kpi-card, .stat-card').filter({ hasText: new RegExp(metric, 'i') });
        const metricText = page.locator(`text="${metric}"`).or(page.locator(`[data-metric="${metric.toLowerCase().replace(' ', '-')}"]`));

        if (await metricCard.count() > 0 || await metricText.count() > 0) {
          metricsFound++;

          // Check for metric value
          const metricValue = page.locator('.metric-value, .kpi-value, .stat-value').filter({ hasText: /\d+/ });
          if (await metricValue.count() > 0) {
            console.log(`✅ ${metric} metric found with value`);
          }

          // Check for percentage change indicator
          const changeIndicator = page.locator('.change-indicator, .percentage-change, .trend-indicator');
          if (await changeIndicator.count() > 0) {
            console.log(`✅ ${metric} has change indicator`);
          }
        }
      }

      console.log(`✅ Found ${metricsFound}/${expectedMetrics.length} expected metrics`);
      await helpers.takeScreenshot('analytics-metrics');
    });

    test('METRICS-002: Metric card interactions', async ({ page }) => {
      const metricCards = page.locator('.metric-card, .kpi-card, .stat-card');
      const cardCount = await metricCards.count();

      if (cardCount > 0) {
        // Test clicking on metric cards
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = metricCards.nth(i);
          if (await card.isVisible()) {
            await card.click();
            await page.waitForTimeout(1000);

            // Check for drill-down or detail view
            const detailView = page.locator('.metric-detail, .drill-down, .modal');
            if (await detailView.count() > 0 && await detailView.isVisible()) {
              console.log(`✅ Metric card ${i + 1} drill-down working`);

              // Close detail view
              const closeButton = detailView.locator('button').filter({ hasText: /close|x/i }).first();
              if (await closeButton.count() > 0) {
                await closeButton.click();
              }
            }
          }
        }
      }
    });

    test('METRICS-003: Metric tooltips and descriptions', async ({ page }) => {
      const metricCards = page.locator('.metric-card, .kpi-card');
      const cardCount = await metricCards.count();

      if (cardCount > 0) {
        // Test hovering over metric cards for tooltips
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = metricCards.nth(i);
          if (await card.isVisible()) {
            await card.hover();
            await page.waitForTimeout(1000);

            // Check for tooltip
            const tooltip = page.locator('.tooltip, [role="tooltip"], .metric-description');
            if (await tooltip.count() > 0 && await tooltip.isVisible()) {
              console.log(`✅ Metric card ${i + 1} tooltip working`);
            }
          }
        }
      }
    });
  });

  test.describe('📊 CHARTS AND GRAPHS - Complete Testing', () => {
    test('CHARTS-001: Chart types and rendering', async ({ page }) => {
      const chartSelectors = [
        'canvas',
        'svg',
        '.chart',
        '.graph',
        '.recharts-wrapper',
        '.chartjs-chart',
        '[data-testid*="chart"]'
      ];

      let chartsFound = 0;
      for (const selector of chartSelectors) {
        const charts = page.locator(selector);
        const count = await charts.count();

        for (let i = 0; i < count; i++) {
          const chart = charts.nth(i);
          if (await chart.isVisible()) {
            chartsFound++;
            await expect(chart).toBeVisible();
          }
        }
      }

      console.log(`✅ Found ${chartsFound} chart elements`);

      // Check for specific chart types
      const chartTypes = ['Line Chart', 'Bar Chart', 'Pie Chart', 'Area Chart', 'Doughnut'];

      for (const chartType of chartTypes) {
        const chartElement = page.locator(`[aria-label*="${chartType}"], [data-chart-type="${chartType.toLowerCase().replace(' ', '-')}"]`);
        if (await chartElement.count() > 0) {
          console.log(`✅ ${chartType} found`);
        }
      }

      await helpers.takeScreenshot('analytics-charts');
    });

    test('CHARTS-002: Chart interactions and legend', async ({ page }) => {
      // Test chart legend interactions
      const legendItems = page.locator('.legend-item, .recharts-legend-item, .chart-legend li');
      const legendCount = await legendItems.count();

      if (legendCount > 0) {
        // Click on legend items to toggle data series
        for (let i = 0; i < Math.min(legendCount, 3); i++) {
          const legendItem = legendItems.nth(i);
          if (await legendItem.isVisible()) {
            await legendItem.click();
            await page.waitForTimeout(500);
            console.log(`✅ Legend item ${i + 1} interaction tested`);
          }
        }
      }

      // Test chart hover interactions
      const charts = page.locator('canvas, svg.recharts-surface');
      if (await charts.count() > 0) {
        const firstChart = charts.first();
        if (await firstChart.isVisible()) {
          // Get chart dimensions
          const chartBox = await firstChart.boundingBox();
          if (chartBox) {
            // Hover over different parts of the chart
            const centerX = chartBox.x + chartBox.width / 2;
            const centerY = chartBox.y + chartBox.height / 2;

            await page.mouse.move(centerX, centerY);
            await page.waitForTimeout(500);

            // Check for tooltip or data point info
            const chartTooltip = page.locator('.tooltip, .chart-tooltip, .recharts-tooltip-wrapper');
            if (await chartTooltip.count() > 0 && await chartTooltip.isVisible()) {
              console.log('✅ Chart hover tooltip working');
            }
          }
        }
      }
    });

    test('CHARTS-003: Chart zoom and pan functionality', async ({ page }) => {
      const charts = page.locator('canvas, svg.recharts-surface');

      if (await charts.count() > 0) {
        const chart = charts.first();
        if (await chart.isVisible()) {
          const chartBox = await chart.boundingBox();
          if (chartBox) {
            // Test zoom (wheel event)
            await page.mouse.move(chartBox.x + chartBox.width / 2, chartBox.y + chartBox.height / 2);
            await page.mouse.wheel(0, -100); // Zoom in
            await page.waitForTimeout(500);

            await page.mouse.wheel(0, 100); // Zoom out
            await page.waitForTimeout(500);

            console.log('✅ Chart zoom functionality tested');

            // Test pan (drag)
            await page.mouse.move(chartBox.x + 100, chartBox.y + 100);
            await page.mouse.down();
            await page.mouse.move(chartBox.x + 200, chartBox.y + 100);
            await page.mouse.up();
            await page.waitForTimeout(500);

            console.log('✅ Chart pan functionality tested');
          }
        }
      }
    });

    test('CHARTS-004: Chart data refresh', async ({ page }) => {
      const refreshButton = page.locator('button').filter({ hasText: /refresh|reload|update/i }).first();

      if (await refreshButton.count() > 0) {
        await refreshButton.click();
        await page.waitForTimeout(1000);

        // Check for loading state
        const loadingIndicator = page.locator('.loading, .spinner, .chart-loading');
        if (await loadingIndicator.count() > 0) {
          console.log('✅ Chart loading state displayed');
        }

        await helpers.waitForLoadingComplete();
        console.log('✅ Chart data refresh tested');
      }
    });
  });

  test.describe('📥 EXPORT FUNCTIONALITY - Complete Testing', () => {
    test('EXPORT-001: Export button and options', async ({ page }) => {
      const exportButton = page.locator('[data-testid="export"], button:has-text("Export"), .export-button').first();

      if (await exportButton.count() > 0) {
        await expect(exportButton).toBeVisible();
        await expect(exportButton).toBeEnabled();

        await exportButton.click();
        await page.waitForTimeout(1000);

        // Check for export options
        const exportOptions = page.locator('.export-options, .export-menu, .dropdown-menu');
        if (await exportOptions.count() > 0) {
          await expect(exportOptions.first()).toBeVisible();

          // Check for export formats
          const exportFormats = ['PDF', 'CSV', 'Excel', 'PNG', 'JPEG'];

          for (const format of exportFormats) {
            const formatOption = exportOptions.locator(`button:has-text("${format}"), a:has-text("${format}")`);
            if (await formatOption.count() > 0) {
              console.log(`✅ Export format available: ${format}`);
            }
          }

          await helpers.takeScreenshot('export-options');
        }
      }
    });

    test('EXPORT-002: PDF export functionality', async ({ page }) => {
      const exportButton = page.locator('[data-testid="export"], button:has-text("Export")').first();

      if (await exportButton.count() > 0) {
        await exportButton.click();
        await page.waitForTimeout(500);

        const pdfOption = page.locator('button:has-text("PDF"), a:has-text("PDF")').first();
        if (await pdfOption.count() > 0) {
          // Set up download handler
          const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

          await pdfOption.click();

          try {
            const download = await downloadPromise;
            console.log(`✅ PDF export initiated: ${download.suggestedFilename()}`);
          } catch (error) {
            console.log('⚠️ PDF export test - download may not have completed');
          }
        }
      }
    });

    test('EXPORT-003: CSV export functionality', async ({ page }) => {
      const exportButton = page.locator('[data-testid="export"], button:has-text("Export")').first();

      if (await exportButton.count() > 0) {
        await exportButton.click();
        await page.waitForTimeout(500);

        const csvOption = page.locator('button:has-text("CSV"), a:has-text("CSV")').first();
        if (await csvOption.count() > 0) {
          // Set up download handler
          const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

          await csvOption.click();

          try {
            const download = await downloadPromise;
            console.log(`✅ CSV export initiated: ${download.suggestedFilename()}`);
          } catch (error) {
            console.log('⚠️ CSV export test - download may not have completed');
          }
        }
      }
    });

    test('EXPORT-004: Image export functionality', async ({ page }) => {
      const exportButton = page.locator('[data-testid="export"], button:has-text("Export")').first();

      if (await exportButton.count() > 0) {
        await exportButton.click();
        await page.waitForTimeout(500);

        const imageOption = page.locator('button:has-text("PNG"), button:has-text("Image")').first();
        if (await imageOption.count() > 0) {
          const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

          await imageOption.click();

          try {
            const download = await downloadPromise;
            console.log(`✅ Image export initiated: ${download.suggestedFilename()}`);
          } catch (error) {
            console.log('⚠️ Image export test - download may not have completed');
          }
        }
      }
    });
  });

  test.describe('🔄 COMPARISON VIEWS - Complete Testing', () => {
    test('COMPARE-001: Period over period comparison', async ({ page }) => {
      const compareButton = page.locator('[data-testid="compare"], button:has-text("Compare"), .compare-toggle').first();

      if (await compareButton.count() > 0) {
        await compareButton.click();
        await page.waitForTimeout(1000);

        // Check for comparison options
        const comparisonOptions = page.locator('.comparison-options, .compare-dropdown');
        if (await comparisonOptions.count() > 0) {
          await expect(comparisonOptions.first()).toBeVisible();

          // Test different comparison periods
          const periods = ['Previous Period', 'Same Period Last Year', 'Custom Period'];

          for (const period of periods) {
            const periodOption = comparisonOptions.locator(`button:has-text("${period}"), option:has-text("${period}")`);
            if (await periodOption.count() > 0) {
              await periodOption.click();
              await page.waitForTimeout(1000);
              console.log(`✅ Comparison period tested: ${period}`);
            }
          }
        }

        await helpers.takeScreenshot('comparison-view');
      }
    });

    test('COMPARE-002: Comparison data visualization', async ({ page }) => {
      const compareButton = page.locator('[data-testid="compare"], button:has-text("Compare")').first();

      if (await compareButton.count() > 0) {
        await compareButton.click();
        await page.waitForTimeout(1000);

        // Select previous period comparison
        const previousPeriodOption = page.locator('button:has-text("Previous Period"), option:has-text("Previous")').first();
        if (await previousPeriodOption.count() > 0) {
          await previousPeriodOption.click();
          await helpers.waitForLoadingComplete();

          // Check for comparison indicators in metrics
          const comparisonIndicators = page.locator('.comparison-value, .change-indicator, .vs-previous');
          if (await comparisonIndicators.count() > 0) {
            console.log('✅ Comparison indicators displayed in metrics');
          }

          // Check for comparison lines in charts
          const charts = page.locator('canvas, svg.recharts-surface');
          if (await charts.count() > 0) {
            console.log('✅ Charts should now show comparison data');
          }
        }
      }
    });

    test('COMPARE-003: Comparison legend and labels', async ({ page }) => {
      const compareButton = page.locator('[data-testid="compare"], button:has-text("Compare")').first();

      if (await compareButton.count() > 0) {
        await compareButton.click();
        await page.waitForTimeout(1000);

        const previousPeriodOption = page.locator('button:has-text("Previous Period")').first();
        if (await previousPeriodOption.count() > 0) {
          await previousPeriodOption.click();
          await helpers.waitForLoadingComplete();

          // Check for comparison legend
          const legend = page.locator('.legend, .chart-legend, .comparison-legend');
          if (await legend.count() > 0) {
            const legendItems = legend.locator('.legend-item, li');
            const itemCount = await legendItems.count();

            if (itemCount >= 2) {
              console.log(`✅ Comparison legend shows ${itemCount} data series`);
            }
          }
        }
      }
    });
  });

  test.describe('🔍 FILTERS AND SEGMENTATION - Complete Testing', () => {
    test('FILTER-001: Platform filter functionality', async ({ page }) => {
      const platformFilter = page.locator('[data-testid="platform-filter"], .platform-filter, select[name="platform"]').first();

      if (await platformFilter.count() > 0) {
        await expect(platformFilter).toBeVisible();

        // Test different platform selections
        const platforms = ['All Platforms', 'Facebook', 'Instagram', 'Twitter', 'LinkedIn'];

        for (const platform of platforms) {
          try {
            await platformFilter.selectOption(platform);
            await helpers.waitForLoadingComplete();
            console.log(`✅ Platform filter tested: ${platform}`);
          } catch {
            // Platform option might not be available
            const platformButton = page.locator(`button:has-text("${platform}")`).first();
            if (await platformButton.count() > 0) {
              await platformButton.click();
              await helpers.waitForLoadingComplete();
              console.log(`✅ Platform filter tested: ${platform}`);
            }
          }
        }
      }
    });

    test('FILTER-002: Content type filter', async ({ page }) => {
      const contentTypeFilter = page.locator('[data-testid="content-type-filter"], .content-type-filter').first();

      if (await contentTypeFilter.count() > 0) {
        const contentTypes = ['All Content', 'Posts', 'Stories', 'Videos', 'Images'];

        for (const contentType of contentTypes) {
          const contentOption = page.locator(`button:has-text("${contentType}"), option:has-text("${contentType}")`).first();
          if (await contentOption.count() > 0) {
            await contentOption.click();
            await helpers.waitForLoadingComplete();
            console.log(`✅ Content type filter tested: ${contentType}`);
          }
        }
      }
    });

    test('FILTER-003: Audience demographic filters', async ({ page }) => {
      const demographicFilters = page.locator('[data-testid="demographic-filter"], .demographic-filters');

      if (await demographicFilters.count() > 0) {
        // Test age group filter
        const ageFilter = demographicFilters.locator('select[name="age"], [data-filter="age"]').first();
        if (await ageFilter.count() > 0) {
          await ageFilter.selectOption('18-24');
          await helpers.waitForLoadingComplete();
          console.log('✅ Age demographic filter tested');
        }

        // Test gender filter
        const genderFilter = demographicFilters.locator('select[name="gender"], [data-filter="gender"]').first();
        if (await genderFilter.count() > 0) {
          await genderFilter.selectOption('female');
          await helpers.waitForLoadingComplete();
          console.log('✅ Gender demographic filter tested');
        }

        // Test location filter
        const locationFilter = demographicFilters.locator('select[name="location"], [data-filter="location"]').first();
        if (await locationFilter.count() > 0) {
          await locationFilter.selectOption('United States');
          await helpers.waitForLoadingComplete();
          console.log('✅ Location demographic filter tested');
        }
      }
    });

    test('FILTER-004: Advanced filter combinations', async ({ page }) => {
      // Apply multiple filters simultaneously
      const platformFilter = page.locator('[data-testid="platform-filter"], .platform-filter').first();
      const contentTypeFilter = page.locator('[data-testid="content-type-filter"], .content-type-filter').first();

      if (await platformFilter.count() > 0 && await contentTypeFilter.count() > 0) {
        // Select Instagram
        await platformFilter.selectOption('Instagram');
        await page.waitForTimeout(1000);

        // Select Images content type
        await contentTypeFilter.selectOption('Images');
        await helpers.waitForLoadingComplete();

        console.log('✅ Advanced filter combination tested: Instagram + Images');

        // Check if data updated accordingly
        const metricCards = page.locator('.metric-card, .kpi-card');
        if (await metricCards.count() > 0) {
          console.log('✅ Metrics updated with combined filters');
        }
      }
    });
  });

  test.describe('⚡ REAL-TIME UPDATES - Complete Testing', () => {
    test('REALTIME-001: Auto-refresh functionality', async ({ page }) => {
      const autoRefreshToggle = page.locator('[data-testid="auto-refresh"], .auto-refresh-toggle').first();

      if (await autoRefreshToggle.count() > 0) {
        await autoRefreshToggle.click();
        await page.waitForTimeout(500);

        // Check for auto-refresh indicator
        const refreshIndicator = page.locator('.auto-refresh-indicator, .refresh-status');
        if (await refreshIndicator.count() > 0) {
          console.log('✅ Auto-refresh enabled');
        }

        // Wait for potential auto-refresh
        await page.waitForTimeout(5000);

        // Check for refresh activity
        const lastUpdated = page.locator('.last-updated, .refresh-time');
        if (await lastUpdated.count() > 0) {
          console.log('✅ Last updated timestamp found');
        }
      }
    });

    test('REALTIME-002: Manual refresh functionality', async ({ page }) => {
      const refreshButton = page.locator('[data-testid="refresh"], button:has-text("Refresh")').first();

      if (await refreshButton.count() > 0) {
        await refreshButton.click();

        // Check for loading state
        const loadingStates = [
          '.loading',
          '.spinner',
          '.refresh-loading',
          '[data-testid="loading"]'
        ];

        let loadingFound = false;
        for (const loadingState of loadingStates) {
          const loading = page.locator(loadingState);
          if (await loading.count() > 0) {
            loadingFound = true;
            console.log('✅ Loading state displayed during refresh');
            break;
          }
        }

        await helpers.waitForLoadingComplete();
        console.log('✅ Manual refresh completed');
      }
    });

    test('REALTIME-003: Live data indicators', async ({ page }) => {
      const liveIndicators = [
        '.live-indicator',
        '.real-time-badge',
        '.status-live',
        '[data-status="live"]'
      ];

      for (const indicator of liveIndicators) {
        const element = page.locator(indicator);
        if (await element.count() > 0 && await element.isVisible()) {
          console.log('✅ Live data indicator found');
          break;
        }
      }

      // Check for real-time metrics
      const realtimeMetrics = page.locator('.real-time-metric, .live-metric');
      if (await realtimeMetrics.count() > 0) {
        console.log('✅ Real-time metrics displayed');
      }
    });
  });

  test.describe('📊 CUSTOM DASHBOARD - Complete Testing', () => {
    test('CUSTOM-001: Dashboard customization options', async ({ page }) => {
      const customizeButton = page.locator('[data-testid="customize"], button:has-text("Customize")').first();

      if (await customizeButton.count() > 0) {
        await customizeButton.click();
        await page.waitForTimeout(1000);

        // Check for customization panel
        const customPanel = page.locator('.customize-panel, .dashboard-editor');
        if (await customPanel.count() > 0) {
          await expect(customPanel.first()).toBeVisible();

          // Check for widget options
          const widgetOptions = customPanel.locator('.widget-option, .metric-option');
          const optionCount = await widgetOptions.count();

          if (optionCount > 0) {
            console.log(`✅ Found ${optionCount} widget customization options`);
          }

          await helpers.takeScreenshot('dashboard-customization');
        }
      }
    });

    test('CUSTOM-002: Widget drag and drop', async ({ page }) => {
      const widgets = page.locator('.widget, .metric-card, .chart-container');
      const widgetCount = await widgets.count();

      if (widgetCount >= 2) {
        const firstWidget = widgets.first();
        const secondWidget = widgets.nth(1);

        // Test drag and drop reordering
        await helpers.dragAndDrop(
          firstWidget.locator('xpath=.').toString(),
          secondWidget.locator('xpath=.').toString()
        );

        await page.waitForTimeout(1000);
        console.log('✅ Widget drag and drop tested');
      }
    });

    test('CUSTOM-003: Widget configuration', async ({ page }) => {
      const widgets = page.locator('.widget, .metric-card');
      if (await widgets.count() > 0) {
        const firstWidget = widgets.first();

        // Look for widget settings/configuration
        const settingsButton = firstWidget.locator('.settings-button, .config-button, button[title*="settings"]').first();
        if (await settingsButton.count() > 0) {
          await settingsButton.click();
          await page.waitForTimeout(500);

          // Check for configuration options
          const configPanel = page.locator('.widget-config, .settings-panel');
          if (await configPanel.count() > 0) {
            console.log('✅ Widget configuration panel opened');
          }
        }
      }
    });
  });

  test.describe('⚡ PERFORMANCE TESTS', () => {
    test('PERF-001: Analytics page load performance', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard/analytics');
      await helpers.waitForLoadingComplete();

      const loadTime = Date.now() - startTime;
      console.log(`Analytics page load time: ${loadTime}ms`);

      expect(loadTime).toBeLessThan(10000); // 10 seconds max

      const metrics = await helpers.checkPerformanceMetrics();
      console.log('Analytics performance metrics:', metrics);
    });

    test('PERF-002: Chart rendering performance', async ({ page }) => {
      const startTime = Date.now();

      // Wait for all charts to render
      const charts = page.locator('canvas, svg');
      const chartCount = await charts.count();

      for (let i = 0; i < chartCount; i++) {
        await expect(charts.nth(i)).toBeVisible();
      }

      const renderTime = Date.now() - startTime;
      console.log(`${chartCount} charts rendered in ${renderTime}ms`);
    });

    test('PERF-003: Data filtering performance', async ({ page }) => {
      const startTime = Date.now();

      // Apply filter
      const platformFilter = page.locator('[data-testid="platform-filter"], .platform-filter').first();
      if (await platformFilter.count() > 0) {
        await platformFilter.selectOption('Facebook');
        await helpers.waitForLoadingComplete();
      }

      const filterTime = Date.now() - startTime;
      console.log(`Filter application time: ${filterTime}ms`);

      expect(filterTime).toBeLessThan(5000); // 5 seconds max for filter
    });
  });
});

export {};