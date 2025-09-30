import { test, expect, Page } from '@playwright/test';

const APP_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:5000';

test.describe('Social Media Features', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Login before each test
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[name="email"]', 'demo@allin.com');
    await page.fill('input[name="password"]', 'DemoPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
  });

  test('should display social account connections', async () => {
    await page.goto(`${APP_URL}/dashboard/accounts`);

    // Check for platform cards
    await expect(page.locator('[data-testid="facebook-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="twitter-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="instagram-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="linkedin-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="tiktok-card"]')).toBeVisible();
  });

  test('should create a new post', async () => {
    await page.goto(`${APP_URL}/dashboard/create`);

    // Fill post details
    await page.fill('[data-testid="post-content"]', 'This is a test post from Playwright E2E tests!');

    // Select platforms
    await page.click('[data-testid="platform-facebook"]');
    await page.click('[data-testid="platform-twitter"]');

    // Add hashtags
    await page.fill('[data-testid="hashtags-input"]', '#testing #allinplatform #e2e');

    // Preview post
    await page.click('[data-testid="preview-button"]');
    await expect(page.locator('[data-testid="post-preview"]')).toBeVisible();

    // Save as draft
    await page.click('[data-testid="save-draft-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should schedule a post', async () => {
    await page.goto(`${APP_URL}/dashboard/create`);

    // Fill post details
    await page.fill('[data-testid="post-content"]', 'Scheduled post for future delivery');

    // Select platforms
    await page.click('[data-testid="platform-facebook"]');

    // Set schedule
    await page.click('[data-testid="schedule-option"]');

    // Set date and time (tomorrow at 10 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    await page.fill('[data-testid="schedule-date"]', tomorrow.toISOString().split('T')[0]);
    await page.fill('[data-testid="schedule-time"]', '10:00');

    // Schedule post
    await page.click('[data-testid="schedule-post-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should display calendar view', async () => {
    await page.goto(`${APP_URL}/dashboard/calendar`);

    // Check calendar elements
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="month-view"]')).toBeVisible();

    // Switch to week view
    await page.click('[data-testid="week-view-button"]');
    await expect(page.locator('[data-testid="week-view"]')).toBeVisible();

    // Switch to day view
    await page.click('[data-testid="day-view-button"]');
    await expect(page.locator('[data-testid="day-view"]')).toBeVisible();
  });

  test('should drag and drop post in calendar', async () => {
    await page.goto(`${APP_URL}/dashboard/calendar`);

    // Create a post first
    await page.click('[data-testid="quick-create-button"]');
    await page.fill('[data-testid="quick-post-content"]', 'Test drag and drop post');
    await page.click('[data-testid="add-to-calendar"]');

    // Find the post and drag it
    const post = page.locator('[data-testid="calendar-post"]').first();
    const targetSlot = page.locator('[data-testid="calendar-slot-tomorrow-14"]');

    // Drag and drop
    await post.dragTo(targetSlot);

    // Verify post moved
    await expect(targetSlot.locator('[data-testid="calendar-post"]')).toBeVisible();
  });

  test('should use AI content generation', async () => {
    await page.goto(`${APP_URL}/dashboard/create`);

    // Click AI generate button
    await page.click('[data-testid="ai-generate-button"]');

    // Fill AI prompt
    await page.fill('[data-testid="ai-prompt"]', 'Create an engaging post about productivity tips');

    // Generate content
    await page.click('[data-testid="generate-content-button"]');

    // Wait for AI response
    await page.waitForSelector('[data-testid="generated-content"]', { timeout: 10000 });

    // Check generated content
    await expect(page.locator('[data-testid="generated-content"]')).toContainText(/productivity/i);

    // Use generated content
    await page.click('[data-testid="use-generated-content"]');
    await expect(page.locator('[data-testid="post-content"]')).toHaveValue(/.+/);
  });

  test('should display analytics dashboard', async () => {
    await page.goto(`${APP_URL}/dashboard/analytics`);

    // Check analytics elements
    await expect(page.locator('[data-testid="engagement-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="reach-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="growth-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();
  });

  test('should manage team members', async () => {
    await page.goto(`${APP_URL}/dashboard/team`);

    // Check team list
    await expect(page.locator('[data-testid="team-members-list"]')).toBeVisible();

    // Add new team member
    await page.click('[data-testid="add-member-button"]');
    await page.fill('[data-testid="member-email"]', 'newmember@allin.com');
    await page.selectOption('[data-testid="member-role"]', 'editor');
    await page.click('[data-testid="invite-member-button"]');

    // Check success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should create workflow', async () => {
    await page.goto(`${APP_URL}/dashboard/workflow`);

    // Create new workflow
    await page.click('[data-testid="create-workflow-button"]');

    // Fill workflow details
    await page.fill('[data-testid="workflow-name"]', 'Content Approval Process');

    // Add steps
    await page.click('[data-testid="add-step-button"]');
    await page.fill('[data-testid="step-1-name"]', 'Draft Review');
    await page.selectOption('[data-testid="step-1-assignee"]', 'editor');

    await page.click('[data-testid="add-step-button"]');
    await page.fill('[data-testid="step-2-name"]', 'Final Approval');
    await page.selectOption('[data-testid="step-2-assignee"]', 'manager');

    // Save workflow
    await page.click('[data-testid="save-workflow-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});

test.describe('API Social Media Endpoints', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Get auth token
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'demo@allin.com',
        password: 'DemoPassword123!'
      }
    });
    const body = await response.json();
    authToken = body.token;
  });

  test('should schedule post via API', async ({ request }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await request.post(`${API_URL}/api/schedule/posts`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        content: 'API test scheduled post',
        socialAccountId: 'test-account-id',
        scheduledFor: tomorrow.toISOString(),
        timezone: 'UTC',
        hashtags: ['#api', '#testing'],
        mentions: []
      }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('post');
    expect(body.data).toHaveProperty('schedule');
  });

  test('should get scheduled posts via API', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/schedule/posts`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('posts');
    expect(body.data).toHaveProperty('pagination');
  });

  test('should get analytics via API', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/analytics/overview`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('engagement');
    expect(body).toHaveProperty('reach');
    expect(body).toHaveProperty('growth');
  });
});