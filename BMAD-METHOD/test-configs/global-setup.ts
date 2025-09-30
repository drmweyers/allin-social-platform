import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  // Ensure auth directory exists
  const authDir = path.join(__dirname, '../test-data/auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3001';

  // Test accounts from CLAUDE.md
  const testAccounts = [
    {
      role: 'admin',
      email: 'admin@allin.demo',
      password: 'Admin123!@#',
      storageFile: 'admin.json'
    },
    {
      role: 'agency',
      email: 'agency@allin.demo',
      password: 'Agency123!@#',
      storageFile: 'agency.json'
    },
    {
      role: 'manager',
      email: 'manager@allin.demo',
      password: 'Manager123!@#',
      storageFile: 'manager.json'
    },
    {
      role: 'creator',
      email: 'creator@allin.demo',
      password: 'Creator123!@#',
      storageFile: 'creator.json'
    },
    {
      role: 'client',
      email: 'client@allin.demo',
      password: 'Client123!@#',
      storageFile: 'client.json'
    },
    {
      role: 'user',
      email: 'team@allin.demo',
      password: 'Team123!@#',
      storageFile: 'user.json'
    }
  ];

  // Setup browser
  const browser = await chromium.launch();

  try {
    // Authenticate each test user
    for (const account of testAccounts) {
      console.log(`🔐 Authenticating ${account.role} user...`);

      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        // Navigate to login page
        await page.goto(`${baseURL}/auth/login`);

        // Wait for login form
        await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });

        // Fill login form
        await page.fill('[data-testid="email-input"]', account.email);
        await page.fill('[data-testid="password-input"]', account.password);

        // Submit login
        await page.click('[data-testid="login-button"]');

        // Wait for successful login (redirect to dashboard)
        await page.waitForURL('**/dashboard**', { timeout: 15000 });

        // Verify we're logged in by checking for dashboard elements
        await page.waitForSelector('[data-testid="dashboard-nav"]', { timeout: 10000 });

        // Save authenticated state
        const storageState = await context.storageState();
        const storageFile = path.join(authDir, account.storageFile);
        fs.writeFileSync(storageFile, JSON.stringify(storageState, null, 2));

        console.log(`✅ ${account.role} user authenticated successfully`);

      } catch (error) {
        console.error(`❌ Failed to authenticate ${account.role} user:`, error);
        throw error;
      } finally {
        await context.close();
      }

      // Small delay between authentications
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } finally {
    await browser.close();
  }

  console.log('✅ Global setup completed successfully');
}

export default globalSetup;