/**
 * AI Chat E2E Tests - User Journey
 * Complete user workflows from login to AI-assisted content creation
 *
 * @group e2e
 * @group ai-chat
 */

import { test, expect, Page } from '@playwright/test';

// Test credentials from CLAUDE.md
const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@allin.demo',
    password: 'AdminPass123'
  },
  manager: {
    email: 'manager@allin.demo',
    password: 'ManagerPass123'
  },
  creator: {
    email: 'creator@allin.demo',
    password: 'CreatorPass123'
  }
};

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

test.describe('AI Chat - Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/auth/login`);
  });

  test('Manager Journey: Analyze Performance → Get AI Insights → Create Optimized Content', async ({ page }) => {
    // Step 1: Login as manager
    await page.fill('input[name="email"]', TEST_CREDENTIALS.manager.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.manager.password);
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);

    // Step 2: Navigate to Analytics page
    await page.click('a[href*="/analytics"]');
    await page.waitForURL('**/analytics');

    // Step 3: View engagement metrics
    const engagementCard = page.locator('[data-testid="engagement-rate-card"]');
    await expect(engagementCard).toBeVisible({ timeout: 5000 });

    // Step 4: Open AI Chat to explain metrics
    const aiChatButton = page.locator('[data-testid="ai-chat-button"]');
    await aiChatButton.click();

    // Step 5: Ask AI to explain engagement rate
    const chatInput = page.locator('[data-testid="ai-chat-input"]');
    await chatInput.fill('Explain my engagement rate and how to improve it');
    await chatInput.press('Enter');

    // Step 6: Wait for AI response
    const aiResponse = page.locator('[data-testid="ai-chat-message"]').last();
    await expect(aiResponse).toBeVisible({ timeout: 10000 });
    await expect(aiResponse).toContainText(/engagement rate/i);

    // Step 7: Navigate to content creation
    await page.click('a[href*="/content/create"]');
    await page.waitForURL('**/content/create');

    // Step 8: Use AI to generate caption
    await page.click('[data-testid="ai-generate-caption"]');

    const captionDescInput = page.locator('[data-testid="caption-description"]');
    await captionDescInput.fill('Motivational Monday post about productivity');

    const platformSelect = page.locator('[data-testid="platform-select"]');
    await platformSelect.selectOption('instagram');

    await page.click('[data-testid="generate-caption-submit"]');

    // Step 9: Verify AI-generated captions appear
    const generatedCaptions = page.locator('[data-testid="generated-caption"]');
    await expect(generatedCaptions.first()).toBeVisible({ timeout: 10000 });

    // Step 10: Select a caption and schedule post
    await generatedCaptions.first().click();
    await page.click('[data-testid="schedule-post-button"]');

    // Step 11: Verify success notification
    const successNotification = page.locator('[data-testid="notification-success"]');
    await expect(successNotification).toBeVisible({ timeout: 5000 });
    await expect(successNotification).toContainText(/scheduled successfully/i);
  });

  test('Admin Journey: View Dashboard → Get AI Recommendations → Optimize Strategy', async ({ page }) => {
    // Step 1: Login as admin
    await page.fill('input[name="email"]', TEST_CREDENTIALS.admin.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.admin.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Step 2: Open AI Chat from dashboard
    const aiChatToggle = page.locator('[data-testid="ai-chat-toggle"]');
    await aiChatToggle.click();

    // Step 3: Request dashboard summary
    const chatInput = page.locator('[data-testid="ai-chat-input"]');
    await chatInput.fill('Summarize my dashboard performance for this week');
    await chatInput.press('Enter');

    // Step 4: Verify AI provides dashboard summary
    const summaryResponse = page.locator('[data-testid="ai-chat-message"]').last();
    await expect(summaryResponse).toBeVisible({ timeout: 10000 });
    await expect(summaryResponse).toContainText(/week/i);

    // Step 5: Request actionable recommendations
    await chatInput.fill('What should I focus on to improve engagement?');
    await chatInput.press('Enter');

    const recommendationsResponse = page.locator('[data-testid="ai-chat-message"]').last();
    await expect(recommendationsResponse).toBeVisible({ timeout: 10000 });

    // Step 6: Navigate to strategy settings
    await page.click('a[href*="/settings/strategy"]');
    await page.waitForURL('**/settings/strategy');

    // Step 7: Update posting frequency based on AI recommendation
    const postingFrequency = page.locator('[data-testid="posting-frequency"]');
    await postingFrequency.selectOption('twice-daily');

    // Step 8: Save strategy changes
    await page.click('[data-testid="save-strategy"]');

    // Step 9: Verify success
    const saveNotification = page.locator('[data-testid="notification-success"]');
    await expect(saveNotification).toBeVisible({ timeout: 5000 });
  });

  test('Creator Journey: Content Creation with AI Assistance', async ({ page }) => {
    // Step 1: Login as creator
    await page.fill('input[name="email"]', TEST_CREDENTIALS.creator.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.creator.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Step 2: Navigate to content creation
    await page.click('a[href*="/content/create"]');
    await page.waitForURL('**/content/create');

    // Step 3: Start with AI content assistant
    await page.click('[data-testid="ai-assistant-button"]');

    // Step 4: Request content ideas
    const aiInput = page.locator('[data-testid="ai-chat-input"]');
    await aiInput.fill('Give me 3 content ideas for fitness brand on Instagram');
    await aiInput.press('Enter');

    // Step 5: Wait for AI content ideas
    const ideasResponse = page.locator('[data-testid="ai-chat-message"]').last();
    await expect(ideasResponse).toBeVisible({ timeout: 10000 });
    await expect(ideasResponse).toContainText(/fitness/i);

    // Step 6: Generate caption for first idea
    await aiInput.fill('Generate an engaging caption for a morning workout motivation post');
    await aiInput.press('Enter');

    const captionResponse = page.locator('[data-testid="ai-chat-message"]').last();
    await expect(captionResponse).toBeVisible({ timeout: 10000 });

    // Step 7: Request hashtag suggestions
    await aiInput.fill('Suggest 10 relevant hashtags for this post');
    await aiInput.press('Enter');

    const hashtagResponse = page.locator('[data-testid="ai-chat-message"]').last();
    await expect(hashtagResponse).toBeVisible({ timeout: 10000 });
    await expect(hashtagResponse).toContainText(/#/);

    // Step 8: Copy AI-generated content to post form
    await page.click('[data-testid="use-this-caption"]');

    // Step 9: Verify caption is populated
    const captionField = page.locator('[data-testid="post-caption"]');
    await expect(captionField).not.toBeEmpty();

    // Step 10: Save as draft
    await page.click('[data-testid="save-draft"]');

    const draftNotification = page.locator('[data-testid="notification-success"]');
    await expect(draftNotification).toBeVisible({ timeout: 5000 });
    await expect(draftNotification).toContainText(/draft saved/i);
  });
});

test.describe('AI Chat - Multi-Platform Content Creation', () => {
  test('Create content for multiple platforms with AI optimization', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('input[name="email"]', TEST_CREDENTIALS.manager.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.manager.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to multi-platform content creator
    await page.click('a[href*="/content/multi-platform"]');
    await page.waitForURL('**/content/multi-platform');

    // Step 1: Enter master content
    const masterContent = page.locator('[data-testid="master-content-input"]');
    await masterContent.fill('Exciting product launch announcement! New features available now.');

    // Step 2: Select target platforms
    await page.check('[data-testid="platform-instagram"]');
    await page.check('[data-testid="platform-twitter"]');
    await page.check('[data-testid="platform-linkedin"]');

    // Step 3: Let AI adapt content for each platform
    await page.click('[data-testid="ai-adapt-content"]');

    // Step 4: Wait for AI to generate platform-specific versions
    await page.waitForSelector('[data-testid="adapted-content-instagram"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="adapted-content-twitter"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="adapted-content-linkedin"]', { timeout: 10000 });

    // Step 5: Verify Instagram version has hashtags
    const instagramContent = page.locator('[data-testid="adapted-content-instagram"]');
    await expect(instagramContent).toContainText(/#/);

    // Step 6: Verify Twitter version is under 280 characters
    const twitterContent = await page.locator('[data-testid="adapted-content-twitter"]').textContent();
    expect(twitterContent?.length).toBeLessThanOrEqual(280);

    // Step 7: Verify LinkedIn version is professional
    const linkedinContent = page.locator('[data-testid="adapted-content-linkedin"]');
    await expect(linkedinContent).not.toContainText(/#/); // LinkedIn uses fewer hashtags

    // Step 8: Schedule all posts
    await page.click('[data-testid="schedule-all-platforms"]');

    // Step 9: Verify success
    const successNotification = page.locator('[data-testid="notification-success"]');
    await expect(successNotification).toBeVisible({ timeout: 5000 });
    await expect(successNotification).toContainText(/scheduled for 3 platforms/i);
  });
});

test.describe('AI Chat - Performance Prediction Workflow', () => {
  test('Get AI performance predictions and set goals', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('input[name="email"]', TEST_CREDENTIALS.admin.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to predictions page
    await page.click('a[href*="/insights/predictions"]');
    await page.waitForURL('**/insights/predictions');

    // Step 1: Request 30-day performance prediction
    await page.click('[data-testid="ai-predict-performance"]');

    const timeframeSelect = page.locator('[data-testid="prediction-timeframe"]');
    await timeframeSelect.selectOption('30-days');

    await page.click('[data-testid="generate-prediction"]');

    // Step 2: Wait for AI prediction results
    await page.waitForSelector('[data-testid="prediction-chart"]', { timeout: 10000 });

    // Step 3: Verify prediction shows engagement forecast
    const engagementPrediction = page.locator('[data-testid="predicted-engagement"]');
    await expect(engagementPrediction).toBeVisible();

    // Step 4: Request AI goal recommendations based on predictions
    await page.click('[data-testid="ai-recommend-goals"]');

    // Step 5: Wait for goal recommendations
    const goalsList = page.locator('[data-testid="recommended-goals"]');
    await expect(goalsList).toBeVisible({ timeout: 10000 });

    // Step 6: Verify SMART goals are provided
    const firstGoal = page.locator('[data-testid="goal-item"]').first();
    await expect(firstGoal).toContainText(/specific/i);

    // Step 7: Accept first recommended goal
    await page.click('[data-testid="accept-goal-0"]');

    // Step 8: Verify goal is added to active goals
    const activeGoals = page.locator('[data-testid="active-goals-list"]');
    await expect(activeGoals.locator('[data-testid="goal-item"]')).toHaveCount(1);

    // Step 9: View goal progress tracker
    await page.click('[data-testid="view-goal-progress"]');

    // Step 10: Verify milestone tracking is displayed
    const milestones = page.locator('[data-testid="goal-milestone"]');
    await expect(milestones.first()).toBeVisible();
  });
});

test.describe('AI Chat - Error Handling and Edge Cases', () => {
  test('Handle AI service unavailability gracefully', async ({ page, context }) => {
    // Intercept AI API calls and simulate failure
    await context.route('**/api/ai-chat/**', route => {
      route.abort('failed');
    });

    // Login
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('input[name="email"]', TEST_CREDENTIALS.manager.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.manager.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Open AI Chat
    await page.click('[data-testid="ai-chat-toggle"]');

    // Try to send message
    const chatInput = page.locator('[data-testid="ai-chat-input"]');
    await chatInput.fill('Test message');
    await chatInput.press('Enter');

    // Verify error message is shown
    const errorMessage = page.locator('[data-testid="ai-chat-error"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    await expect(errorMessage).toContainText(/unavailable|error/i);

    // Verify user can still access manual features
    await page.click('a[href*="/content/create"]');
    await page.waitForURL('**/content/create');

    // Manual content creation should still work
    const manualCaption = page.locator('[data-testid="manual-caption-input"]');
    await expect(manualCaption).toBeVisible();
  });

  test('Handle rate limiting with user-friendly message', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('input[name="email"]', TEST_CREDENTIALS.creator.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.creator.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Open AI Chat
    await page.click('[data-testid="ai-chat-toggle"]');
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    // Send multiple rapid requests to trigger rate limit
    for (let i = 0; i < 6; i++) {
      await chatInput.fill(`Test message ${i}`);
      await chatInput.press('Enter');
      await page.waitForTimeout(100);
    }

    // Verify rate limit message appears
    const rateLimitNotification = page.locator('[data-testid="notification-warning"]');
    await expect(rateLimitNotification).toBeVisible({ timeout: 10000 });
    await expect(rateLimitNotification).toContainText(/rate limit|too many requests/i);

    // Verify input is disabled temporarily
    await expect(chatInput).toBeDisabled();
  });
});
